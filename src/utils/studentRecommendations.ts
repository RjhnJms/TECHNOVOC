import { supabase } from "../supabaseClient"
import { isPassingScore } from "./trackRanking"
import { fetchEnrolledCountsForSchoolYear } from "./placement"

export interface CourseScore {
  course_id: string
  score: number
  total_items: number
}

export interface Top3Recommendation {
  course_id: string
  score: number
  rank: number
  /** True when all 3 preferred courses passed (6+/10). */
  fromPreferredCourses: boolean
}

const CHOICE_LABELS = ["1st choice", "2nd choice", "3rd choice"] as const

export function getChoiceLabel(preferenceIndex: number): string {
  return CHOICE_LABELS[preferenceIndex] ?? `#${preferenceIndex + 1}`
}

/** FNV-1a hash, used to give tied courses a stable order per student. */
function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Sort courses by score descending. Courses with equal scores are ordered by a hash of the
 * student ID and course ID, so no course gets a systematic positional advantage across
 * students, while each student always sees the same order.
 */
function fairScoreSort(scores: CourseScore[], tieSeed: string): CourseScore[] {
  return [...scores].sort(
    (a, b) =>
      b.score - a.score ||
      hashString(tieSeed + a.course_id) - hashString(tieSeed + b.course_id)
  )
}

/**
 * Top 3 course recommendations (shown to students and used for manual placement):
 *
 * CASE A — Student passes (≥ 6/10) ALL 3 preferred courses:
 *   → Top-3 = those 3 preferred courses in choice order (1st, 2nd, 3rd).
 *
 * CASE B — Student does not pass all 3 preferred courses:
 *   → Top-3 = 3 highest-scoring courses from the full exam, EXCLUDING the 3 preferred choices.
 *
 * Placement itself is done by the batch process in placement.ts.
 */
export function computeTop3Recommendations(
  allScores: CourseScore[],
  preferredCourseIds: string[],
  tieSeed: string
): Top3Recommendation[] {
  const scoreByCourse = new Map(allScores.map(s => [s.course_id, s]))
  const preferredSet = new Set(preferredCourseIds)

  const fromPreferredCourses =
    preferredCourseIds.length === 3 &&
    preferredCourseIds.every(id => {
      const s = scoreByCourse.get(id)
      return s && isPassingScore(s.score, s.total_items)
    })

  const picks = fromPreferredCourses
    ? preferredCourseIds.map(id => scoreByCourse.get(id)!)
    : fairScoreSort(allScores.filter(s => !preferredSet.has(s.course_id)), tieSeed).slice(0, 3)

  return picks.map((s, index) => ({
    course_id: s.course_id,
    score: s.score,
    rank: index + 1,
    fromPreferredCourses,
  }))
}

/**
 * Courses an admin may choose for a waitlisted student: the 3 highest-scoring courses outside
 * the student's preferred choices that still have open slots in their school year.
 */
export function getManualPlacementOptions(
  allScores: CourseScore[],
  preferredCourseIds: string[],
  tieSeed: string,
  slotsLeftByCourse: Record<string, number>
): string[] {
  const preferredSet = new Set(preferredCourseIds)
  return fairScoreSort(allScores.filter(s => !preferredSet.has(s.course_id)), tieSeed)
    .filter(s => (slotsLeftByCourse[s.course_id] ?? 0) > 0)
    .slice(0, 3)
    .map(s => s.course_id)
}

/** Manually place a waitlisted student, recording which admin placed them and when. */
export async function assignPlacementCourse(
  studentId: string,
  courseId: string,
  schoolYear: string,
  adminName: string
): Promise<{ error: string | null }> {
  const [{ data: courseData }, enrolledCounts] = await Promise.all([
    supabase.from("courses").select("capacity").eq("id", courseId).maybeSingle(),
    fetchEnrolledCountsForSchoolYear(schoolYear),
  ])
  const slotsLeft = (courseData?.capacity ?? 0) - (enrolledCounts[courseId] ?? 0)
  if (slotsLeft <= 0) {
    return { error: "This course has reached its capacity. Choose a different track." }
  }

  const { data: assessment } = await supabase
    .from("assessments")
    .select("score")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle()

  const { error: deleteError } = await supabase.from("rankings").delete().eq("student_id", studentId)
  if (deleteError) return { error: deleteError.message }

  const { error: insertError } = await supabase.from("rankings").insert({
    student_id: studentId,
    course_id: courseId,
    status: "included",
    score: assessment?.score ?? 0,
    rank: 1,
    placement_type: "manual",
    assigned_by: adminName,
    assigned_at: new Date().toISOString(),
  })

  return { error: insertError?.message ?? null }
}
