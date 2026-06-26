import { supabase } from "../supabaseClient"

/** Exam has 10 questions per track; passing is 6 correct (60%). */
export const QUESTIONS_PER_TRACK = 10
export const PASSING_SCORE = 6
export const WAITLIST_TOP_FAILED = 3

export type RankingStatus = "included" | "waitlist" | "rejected" | "placement_waitlist" | "capacity_waitlist"

export function isPassingScore(score: number, totalItems: number = QUESTIONS_PER_TRACK): boolean {
  if (totalItems <= 0) return false
  return score >= PASSING_SCORE
}

/**
 * Returns "Passed" if score passes (≥ PASSING_SCORE), "Failed" otherwise.
 */
export function getCompetencyLevel(score: number, totalItems: number = QUESTIONS_PER_TRACK): "Passed" | "Failed" {
  return isPassingScore(score, totalItems) ? "Passed" : "Failed"
}

/**
 * Percentile rank: percentage of students who scored strictly below this student.
 * Higher percentile = better relative performance.
 */
export function computePercentileRank(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 100
  const below = allScores.filter(s => s < score).length
  return Math.round((below / allScores.length) * 100)
}

export function getRankingStatusLabel(status: string, score?: number): string {
  const isHigh = score !== undefined ? score >= PASSING_SCORE : true
  switch (status) {
    case "included":
      return isHigh ? "Passed (Placed)" : "Failed (Placed)"
    case "waitlist":
      return "Failed (Waitlist)"
    case "rejected":
      return "Failed (Rejected)"
    case "placement_waitlist":
      return "Pending placement"
    case "capacity_waitlist":
      return "Passed (Capacity Waitlist)"
    case "recommended":
      return isHigh ? "Passed (Recommended)" : "Failed (Recommended)"
    default:
      return status
  }
}

export function getRankingStatusStyle(status: string, score?: number): { backgroundColor: string; color: string } {
  const isHigh = score !== undefined ? score >= PASSING_SCORE : true
  switch (status) {
    case "included":
      return isHigh
        ? { backgroundColor: "#dcfce7", color: "#16a34a" }
        : { backgroundColor: "#e0f2fe", color: "#0369a1" }
    case "waitlist":
      return { backgroundColor: "#fef3c7", color: "#92400e" }
    case "rejected":
      return { backgroundColor: "#fef2f2", color: "#dc2626" }
    case "placement_waitlist":
      return { backgroundColor: "#f3e8ff", color: "#7c3aed" }
    case "capacity_waitlist":
      return { backgroundColor: "#fff7ed", color: "#c2410c" }
    case "recommended":
      return { backgroundColor: "#f3f4f6", color: "#6b7280" }
    default:
      return { backgroundColor: "#f3f4f6", color: "#6b7280" }
  }
}

export interface TrackApplicant {
  student_id: string
  score: number
  total_items: number
  /** Average percentage across ALL courses in the exam (tiebreaker #1). e.g. 72.5 = 72.5% */
  overall_exam_percentage?: number
  /** Preference order for this course: 1 = 1st choice, 2 = 2nd, 3 = 3rd (tiebreaker #2). */
  preference_order?: number
  /** Timestamp when the student completed the assessment (tiebreaker #3 — earlier = priority). */
  assessment_completed_at?: string
}

export interface TrackRankingRow {
  student_id: string
  score: number
  rank: number
  status: RankingStatus
  percentile?: number
}

/**
 * Multi-criteria tiebreaker comparator for students with equal track scores.
 *
 * When students are tied on the course score, this determines who gets
 * priority for placement. The tiebreaker order is:
 *
 * 1. **Overall exam percentage** (higher = better) — Average percentage across
 *    ALL courses in the exam. Rewards well-rounded students and normalizes
 *    scores regardless of how many questions each course has.
 *    e.g. Student A: 72.5% overall vs Student B: 65% overall → A wins.
 *
 * 2. **Preference order** (lower = better, i.e. 1st choice > 2nd > 3rd) —
 *    Students who listed this course as their 1st choice get priority over
 *    those who listed it as 2nd or 3rd.
 *
 * 3. **Assessment completion time** (earlier = better) — First-come advantage
 *    for students who completed their assessment sooner.
 *
 * 4. **Student ID** (alphabetical, deterministic fallback) — Ensures stable,
 *    reproducible ordering when all other criteria are equal.
 */
function tiebreakerCompare(a: TrackApplicant, b: TrackApplicant): number {
  // Primary sort: course score (descending — higher is better)
  if (b.score !== a.score) return b.score - a.score

  // Tiebreaker #1: Overall exam percentage (descending — higher is better)
  const pctA = a.overall_exam_percentage ?? 0
  const pctB = b.overall_exam_percentage ?? 0
  if (pctB !== pctA) return pctB - pctA

  // Tiebreaker #2: Preference order (ascending — 1st choice > 2nd > 3rd)
  // Students who didn't list this as a preference get Infinity (lowest priority)
  const prefA = a.preference_order ?? Infinity
  const prefB = b.preference_order ?? Infinity
  if (prefA !== prefB) return prefA - prefB

  // Tiebreaker #3: Assessment completion time (ascending — earlier is better)
  const timeA = a.assessment_completed_at ? new Date(a.assessment_completed_at).getTime() : Infinity
  const timeB = b.assessment_completed_at ? new Date(b.assessment_completed_at).getTime() : Infinity
  if (timeA !== timeB) return timeA - timeB

  // Final fallback: student_id alphabetical for deterministic ordering
  return a.student_id.localeCompare(b.student_id)
}

/**
 * Per-track ranking with capacity-aware tiebreaking:
 *
 * - Passed students (score ≥ 6) are sorted using multi-criteria tiebreaker.
 * - If a capacity is provided and passed students exceed available slots,
 *   only the top N are "included"; the rest become "capacity_waitlist".
 * - Failed students: top 3 by score → "waitlist"; remainder → "rejected".
 *
 * **Capacity tiebreaker scenario:**
 * e.g. Course has 70 slots, 65 already filled, 5 remaining. But 10 students
 * all scored 6/10. The system uses the multi-criteria tiebreaker to fairly
 * rank them and place the top 5, while the remaining 5 go to "capacity_waitlist".
 */
export function computeTrackRankings(
  applicants: TrackApplicant[],
  capacity?: number
): TrackRankingRow[] {
  const allScores = applicants.map(a => a.score)

  const passed = applicants
    .filter(a => isPassingScore(a.score, a.total_items))
    .sort(tiebreakerCompare)

  const failed = applicants
    .filter(a => !isPassingScore(a.score, a.total_items))
    .sort(tiebreakerCompare)

  const rows: TrackRankingRow[] = []
  let rank = 1

  for (let i = 0; i < passed.length; i++) {
    const a = passed[i]
    // If capacity is set, only include students up to that limit
    const isWithinCapacity = capacity === undefined || i < capacity
    rows.push({
      student_id: a.student_id,
      score: a.score,
      rank,
      status: isWithinCapacity ? "included" : "capacity_waitlist",
      percentile: computePercentileRank(a.score, allScores),
    })
    rank += 1
  }

  failed.forEach((a, index) => {
    const status: RankingStatus = index < WAITLIST_TOP_FAILED ? "waitlist" : "rejected"
    rows.push({
      student_id: a.student_id,
      score: a.score,
      rank,
      status,
      percentile: computePercentileRank(a.score, allScores),
    })
    rank += 1
  })

  return rows
}

/** Recompute rankings for one track from all applicants who selected it. */
export async function recomputeTrackRankings(courseId: string): Promise<void> {
  // 1. Get all students who selected this course as a preference
  const { data: prefs } = await supabase
    .from("student_course_preferences")
    .select("student_id, preference_order")
    .eq("course_id", courseId)

  const studentIds = [...new Set((prefs || []).map(p => p.student_id))]
  if (studentIds.length === 0) {
    await supabase.from("rankings").delete().eq("course_id", courseId)
    return
  }

  // 2. Build a preference order lookup for this course
  const preferenceByStudent = new Map<string, number>()
  for (const p of prefs || []) {
    preferenceByStudent.set(p.student_id, p.preference_order)
  }

  // 3. Get course capacity
  const { data: courseData } = await supabase
    .from("courses")
    .select("capacity")
    .eq("id", courseId)
    .maybeSingle()
  const capacity = courseData?.capacity ?? undefined

  // 4. Get assessments for this specific course
  const { data: assessments } = await supabase
    .from("assessments")
    .select("student_id, score, total_items, taken_at")
    .eq("course_id", courseId)
    .in("student_id", studentIds)

  // 5. Get ALL assessments for these students (to compute overall exam percentage)
  const { data: allAssessments } = await supabase
    .from("assessments")
    .select("student_id, score, total_items, taken_at")
    .in("student_id", studentIds)

  // Compute overall exam percentage per student (average % across all courses)
  // e.g. Student scores: 8/10 (80%), 6/10 (60%), 7/10 (70%) → average = 70%
  const scoresByStudent = new Map<string, { score: number; total_items: number }[]>()
  const latestTakenByStudent = new Map<string, string>()
  for (const a of allAssessments || []) {
    const list = scoresByStudent.get(a.student_id) || []
    list.push({ score: a.score, total_items: a.total_items || QUESTIONS_PER_TRACK })
    scoresByStudent.set(a.student_id, list)
    // Track the latest taken_at timestamp for each student
    const current = latestTakenByStudent.get(a.student_id)
    if (!current || a.taken_at > current) {
      latestTakenByStudent.set(a.student_id, a.taken_at)
    }
  }

  // Calculate average percentage for each student
  const overallPercentageByStudent = new Map<string, number>()
  for (const [studentId, scores] of scoresByStudent) {
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
    const totalItems = scores.reduce((sum, s) => sum + s.total_items, 0)
    const percentage = totalItems > 0 ? (totalScore / totalItems) * 100 : 0
    overallPercentageByStudent.set(studentId, Math.round(percentage * 100) / 100) // 2 decimal places
  }

  // 6. Build enriched applicant list
  const applicants: TrackApplicant[] = (assessments || []).map(a => ({
    student_id: a.student_id,
    score: a.score,
    total_items: a.total_items,
    overall_exam_percentage: overallPercentageByStudent.get(a.student_id) ?? 0,
    preference_order: preferenceByStudent.get(a.student_id),
    assessment_completed_at: latestTakenByStudent.get(a.student_id),
  }))

  // 7. Compute capacity-aware rankings
  const rows = computeTrackRankings(applicants, capacity)

  // 8. Persist to database
  await supabase.from("rankings").delete().eq("course_id", courseId)

  if (rows.length > 0) {
    await supabase.from("rankings").insert(
      rows.map(r => ({
        student_id: r.student_id,
        course_id: courseId,
        score: r.score,
        rank: r.rank,
        status: r.status,
      }))
    )
  }
}

export async function recomputeTracksForStudent(preferredCourseIds: string[]): Promise<void> {
  for (const courseId of preferredCourseIds) {
    await recomputeTrackRankings(courseId)
  }
}

export async function recomputeAllTrackRankings(): Promise<void> {
  const { data: courseRows } = await supabase.from("courses").select("id")
  for (const course of courseRows || []) {
    await recomputeTrackRankings(course.id)
  }
}
