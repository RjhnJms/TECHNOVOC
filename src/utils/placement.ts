import { supabase } from "../supabaseClient"
import { getStartYear } from "./schoolYear"
import { isPassingScore, QUESTIONS_PER_TRACK } from "./trackRanking"

/**
 * Batch placement, run by the admin once all students of a school year have taken the assessment.
 *
 * 1. Students who passed (6+/10) at least one preferred course are placed automatically using
 *    student-proposing deferred acceptance: each student gets the highest preferred choice they
 *    passed where they rank within the course's slots. Priority inside a course is decided by
 *    score in that course → overall exam percentage → preference order. Submission time is never
 *    used, so taking the exam earlier gives no advantage. Students who are still exactly tied at
 *    the last slot are all admitted.
 * 2. Students who did not pass any preferred course, or whose passed courses are full, go to the
 *    waitlist and are placed manually by an admin from their top recommended courses.
 *
 * Manual placements are never changed by a re-run; their seats are subtracted from capacity first.
 */

export interface PlacementApplicant {
  student_id: string
  /** Passed preferred course IDs in choice order (1st, 2nd, 3rd). */
  passedPreferredIds: string[]
  scoreByCourse: Record<string, number>
  overallPercentage: number
  /** 0 = 1st choice, 1 = 2nd, 2 = 3rd. */
  preferenceIndexByCourse: Record<string, number>
}

export interface PlacementOutcome {
  placed: { student_id: string; course_id: string; score: number; rank: number }[]
  waitlisted: string[]
  /** Students admitted beyond capacity because they were exactly tied at the last slot. */
  tieOverflow: number
}

function compareInCourse(a: PlacementApplicant, b: PlacementApplicant, courseId: string): number {
  const scoreDiff = (b.scoreByCourse[courseId] ?? 0) - (a.scoreByCourse[courseId] ?? 0)
  if (scoreDiff !== 0) return scoreDiff
  const pctDiff = b.overallPercentage - a.overallPercentage
  if (pctDiff !== 0) return pctDiff
  return (a.preferenceIndexByCourse[courseId] ?? 99) - (b.preferenceIndexByCourse[courseId] ?? 99)
}

export function computeBatchPlacement(
  applicants: PlacementApplicant[],
  slotsByCourse: Record<string, number>
): PlacementOutcome {
  const byId = new Map(applicants.map(a => [a.student_id, a]))
  const nextChoice = new Map(applicants.map(a => [a.student_id, 0]))
  const held: Record<string, string[]> = {}
  const free = applicants.filter(a => a.passedPreferredIds.length > 0).map(a => a.student_id)
  const waitlisted = applicants.filter(a => a.passedPreferredIds.length === 0).map(a => a.student_id)

  while (free.length > 0) {
    const studentId = free.pop()!
    const applicant = byId.get(studentId)!
    const choiceIndex = nextChoice.get(studentId)!
    if (choiceIndex >= applicant.passedPreferredIds.length) {
      waitlisted.push(studentId)
      continue
    }
    nextChoice.set(studentId, choiceIndex + 1)

    const courseId = applicant.passedPreferredIds[choiceIndex]
    const capacity = slotsByCourse[courseId] ?? 0
    const holders = [...(held[courseId] || []), studentId]
    const sorted = holders
      .map(id => byId.get(id)!)
      .sort((a, b) => compareInCourse(a, b, courseId))

    if (sorted.length <= capacity) {
      held[courseId] = sorted.map(a => a.student_id)
      continue
    }

    const cutoff = capacity > 0 ? sorted[capacity - 1] : null
    const keep = cutoff ? sorted.filter(a => compareInCourse(a, cutoff, courseId) <= 0) : []
    const keepIds = new Set(keep.map(a => a.student_id))
    held[courseId] = keep.map(a => a.student_id)
    for (const a of sorted) {
      if (!keepIds.has(a.student_id)) free.push(a.student_id)
    }
  }

  const placed: PlacementOutcome["placed"] = []
  let tieOverflow = 0
  for (const [courseId, ids] of Object.entries(held)) {
    const sorted = ids.map(id => byId.get(id)!).sort((a, b) => compareInCourse(a, b, courseId))
    tieOverflow += Math.max(0, sorted.length - (slotsByCourse[courseId] ?? 0))
    sorted.forEach((a, index) => {
      // Exactly tied students share the same rank
      const prev = index > 0 ? sorted[index - 1] : null
      const rank = prev && compareInCourse(prev, a, courseId) === 0
        ? placed[placed.length - 1].rank
        : index + 1
      placed.push({ student_id: a.student_id, course_id: courseId, score: a.scoreByCourse[courseId] ?? 0, rank })
    })
  }

  return { placed, waitlisted, tieOverflow }
}

// ── School-year cohort data ─────────────────────────────────

export interface CohortStudent {
  id: string
  full_name: string
  lrn: string
  school_year: string
}

export function isInSchoolYear(studentYear: string | null | undefined, schoolYear: string): boolean {
  if (!studentYear) return false
  return getStartYear(studentYear) === getStartYear(schoolYear)
}

const PAGE_SIZE = 1000

/**
 * Supabase returns at most 1000 rows per request, so placement data (11 assessment rows per
 * student) is read page by page to make sure no student's scores are left out.
 */
async function fetchAllRows<T>(
  table: string,
  columns: string
): Promise<{ data: T[]; error: string | null }> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id")
      .range(from, from + PAGE_SIZE - 1)
    if (error) return { data: rows, error: error.message }
    rows.push(...((data || []) as T[]))
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null }
  }
}

async function fetchCohortStudents(schoolYear: string): Promise<CohortStudent[]> {
  const { data } = await fetchAllRows<CohortStudent>("students", "id, full_name, lrn, school_year")
  return data.filter(s => isInSchoolYear(s.school_year, schoolYear))
}

function chunk<T>(items: T[], size = 100): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** Number of placed ("included") students per course within one school year. */
export async function fetchEnrolledCountsForSchoolYear(schoolYear: string): Promise<Record<string, number>> {
  const { data } = await fetchAllRows<{
    course_id: string | null
    status: string
    students: { school_year?: string } | null
  }>("rankings", "course_id, status, students(school_year)")

  const counts: Record<string, number> = {}
  for (const row of data) {
    if (row.status !== "included" || !row.course_id) continue
    if (!isInSchoolYear(row.students?.school_year, schoolYear)) continue
    counts[row.course_id] = (counts[row.course_id] || 0) + 1
  }
  return counts
}

interface RankingRow {
  id: string
  student_id: string
  course_id: string | null
  status: string
  placement_type: string | null
}

// ── Release setting (per school year) ───────────────────────

const releaseKey = (schoolYear: string) => `placement_released:${schoolYear}`
const lastRunKey = (schoolYear: string) => `placement_last_run:${schoolYear}`

export async function isPlacementReleased(schoolYear: string): Promise<boolean> {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", releaseKey(schoolYear))
    .maybeSingle()
  return data?.value === "true"
}

export async function setPlacementReleased(schoolYear: string, released: boolean): Promise<string | null> {
  const { error } = await supabase.from("system_settings").upsert({
    key: releaseKey(schoolYear),
    value: released ? "true" : "false",
    updated_at: new Date().toISOString(),
  })
  return error?.message ?? null
}

export async function getLastPlacementRun(schoolYear: string): Promise<string | null> {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", lastRunKey(schoolYear))
    .maybeSingle()
  return data?.value ?? null
}

// ── Status summary for the admin panel ──────────────────────

export interface PlacementSummary {
  totalStudents: number
  notAssessed: number
  pending: number
  autoPlaced: number
  manuallyPlaced: number
  waitlisted: number
  released: boolean
  lastRun: string | null
}

export async function fetchPlacementSummary(schoolYear: string): Promise<PlacementSummary> {
  const students = await fetchCohortStudents(schoolYear)
  const ids = new Set(students.map(s => s.id))

  const [{ data: assessments }, { data: rankings }, released, lastRun] = await Promise.all([
    fetchAllRows<{ student_id: string }>("assessments", "student_id"),
    fetchAllRows<RankingRow>("rankings", "id, student_id, course_id, status, placement_type"),
    isPlacementReleased(schoolYear),
    getLastPlacementRun(schoolYear),
  ])

  const assessed = new Set(assessments.map(a => a.student_id).filter(id => ids.has(id)))
  const cohortRankings = rankings.filter(r => ids.has(r.student_id))
  const withRanking = new Set(cohortRankings.map(r => r.student_id))

  return {
    totalStudents: students.length,
    notAssessed: students.length - assessed.size,
    pending: [...assessed].filter(id => !withRanking.has(id)).length,
    autoPlaced: cohortRankings.filter(r => r.status === "included" && r.placement_type !== "manual").length,
    manuallyPlaced: cohortRankings.filter(r => r.status === "included" && r.placement_type === "manual").length,
    waitlisted: cohortRankings.filter(r => r.status === "waitlist").length,
    released,
    lastRun,
  }
}

// ── Run placement ───────────────────────────────────────────

export interface RunPlacementResult {
  error: string | null
  placed: number
  waitlisted: number
  manualKept: number
  tieOverflow: number
}

export async function runPlacement(schoolYear: string, adminName: string): Promise<RunPlacementResult> {
  const empty = { placed: 0, waitlisted: 0, manualKept: 0, tieOverflow: 0 }
  const students = await fetchCohortStudents(schoolYear)
  const studentIds = students.map(s => s.id)
  if (studentIds.length === 0) return { error: null, ...empty }

  const [coursesResult, assessmentsResult, prefsResult, rankingsResult] = await Promise.all([
    fetchAllRows<{ id: string; capacity: number | null }>("courses", "id, capacity"),
    fetchAllRows<{ student_id: string; course_id: string; score: number; total_items: number }>(
      "assessments", "student_id, course_id, score, total_items"
    ),
    fetchAllRows<{ student_id: string; course_id: string; preference_order: number }>(
      "student_course_preferences", "student_id, course_id, preference_order"
    ),
    fetchAllRows<RankingRow>("rankings", "id, student_id, course_id, status, placement_type"),
  ])
  if (rankingsResult.error) {
    return { error: `${rankingsResult.error} — run supabase/placement_process.sql in the Supabase SQL editor.`, ...empty }
  }
  // Never place students from incomplete data
  const loadError = coursesResult.error ?? assessmentsResult.error ?? prefsResult.error
  if (loadError) return { error: `Could not load placement data: ${loadError}`, ...empty }

  const courses = coursesResult.data
  const assessments = assessmentsResult.data
  const prefs = [...prefsResult.data].sort((a, b) => a.preference_order - b.preference_order)
  const rankings = rankingsResult.data

  const cohort = new Set(studentIds)
  const manualRows = rankings.filter(
    r => cohort.has(r.student_id) && r.status === "included" && r.placement_type === "manual" && r.course_id
  )
  const manualStudents = new Set(manualRows.map(r => r.student_id))

  // Seats taken by manual placements in this school year are not available to the automatic run
  const slotsByCourse: Record<string, number> = {}
  for (const c of courses) slotsByCourse[c.id] = c.capacity ?? 0
  for (const r of manualRows) {
    if (r.course_id) slotsByCourse[r.course_id] = (slotsByCourse[r.course_id] ?? 0) - 1
  }

  const scoresByStudent = new Map<string, { course_id: string; score: number; total_items: number }[]>()
  for (const a of assessments) {
    if (!cohort.has(a.student_id)) continue
    const list = scoresByStudent.get(a.student_id) || []
    list.push(a)
    scoresByStudent.set(a.student_id, list)
  }

  const prefsByStudent = new Map<string, string[]>()
  for (const p of prefs) {
    if (!cohort.has(p.student_id)) continue
    const list = prefsByStudent.get(p.student_id) || []
    list.push(p.course_id)
    prefsByStudent.set(p.student_id, list)
  }

  const applicants: PlacementApplicant[] = []
  for (const [studentId, scores] of scoresByStudent) {
    if (manualStudents.has(studentId)) continue
    const preferred = prefsByStudent.get(studentId) || []
    const scoreByCourse = Object.fromEntries(scores.map(s => [s.course_id, s.score]))
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
    const totalItems = scores.reduce((sum, s) => sum + (s.total_items || QUESTIONS_PER_TRACK), 0)
    applicants.push({
      student_id: studentId,
      passedPreferredIds: preferred.filter(id => {
        const s = scores.find(x => x.course_id === id)
        return !!s && isPassingScore(s.score, s.total_items)
      }),
      scoreByCourse,
      overallPercentage: totalItems > 0 ? (totalScore / totalItems) * 100 : 0,
      preferenceIndexByCourse: Object.fromEntries(preferred.map((id, i) => [id, i])),
    })
  }

  const outcome = computeBatchPlacement(applicants, slotsByCourse)

  // Replace every automatic/waitlist row in this school year; manual placements stay untouched
  const rowsToDelete = rankings
    .filter(r => cohort.has(r.student_id) && !(r.status === "included" && r.placement_type === "manual"))
    .map(r => r.id)
  for (const ids of chunk(rowsToDelete)) {
    const { error } = await supabase.from("rankings").delete().in("id", ids)
    if (error) return { error: error.message, ...empty }
  }

  const now = new Date().toISOString()
  const bestScore = (studentId: string) =>
    Math.max(0, ...(scoresByStudent.get(studentId) || []).map(s => s.score))

  const newRows = [
    ...outcome.placed.map(p => ({
      student_id: p.student_id,
      course_id: p.course_id,
      score: p.score,
      rank: p.rank,
      status: "included",
      placement_type: "auto",
      assigned_by: adminName,
      assigned_at: now,
    })),
    ...outcome.waitlisted.map(studentId => ({
      student_id: studentId,
      course_id: null,
      score: bestScore(studentId),
      rank: 0,
      status: "waitlist",
      placement_type: "auto",
      assigned_by: adminName,
      assigned_at: now,
    })),
  ]
  for (const rows of chunk(newRows)) {
    const { error } = await supabase.from("rankings").insert(rows)
    if (error) {
      return { error: `${error.message} — run supabase/placement_process.sql in the Supabase SQL editor.`, ...empty }
    }
  }

  await supabase.from("system_settings").upsert({ key: lastRunKey(schoolYear), value: now, updated_at: now })

  return {
    error: null,
    placed: outcome.placed.length,
    waitlisted: outcome.waitlisted.length,
    manualKept: manualRows.length,
    tieOverflow: outcome.tieOverflow,
  }
}
