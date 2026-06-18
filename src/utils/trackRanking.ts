import { supabase } from "../supabaseClient"

/** Exam has 10 questions per track; passing is 6 correct (60%). */
export const QUESTIONS_PER_TRACK = 10
export const PASSING_SCORE = 6
export const WAITLIST_TOP_FAILED = 3

export type RankingStatus = "included" | "waitlist" | "rejected" | "placement_waitlist"

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
}

export interface TrackRankingRow {
  student_id: string
  score: number
  rank: number
  status: RankingStatus
  percentile?: number
}

/**
 * Per-track ranking with percentile:
 * - Passed (score >= 6): status "included" (High Competency), ranked by score descending.
 * - Failed: top 3 by score → "waitlist" (Low Competency); remainder → "rejected" (Low Competency).
 *
 * Tiebreaker: when two students have equal scores, sort deterministically by student_id
 * (alphabetical) so same-score distribution is stable and reproducible.
 */
export function computeTrackRankings(applicants: TrackApplicant[]): TrackRankingRow[] {
  const allScores = applicants.map(a => a.score)

  const passed = applicants
    .filter(a => isPassingScore(a.score, a.total_items))
    .sort((a, b) => b.score - a.score || a.student_id.localeCompare(b.student_id))

  const failed = applicants
    .filter(a => !isPassingScore(a.score, a.total_items))
    .sort((a, b) => b.score - a.score || a.student_id.localeCompare(b.student_id))

  const rows: TrackRankingRow[] = []
  let rank = 1

  for (const a of passed) {
    rows.push({
      student_id: a.student_id,
      score: a.score,
      rank,
      status: "included",
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
  const { data: prefs } = await supabase
    .from("student_course_preferences")
    .select("student_id")
    .eq("course_id", courseId)

  const studentIds = [...new Set((prefs || []).map(p => p.student_id))]
  if (studentIds.length === 0) {
    await supabase.from("rankings").delete().eq("course_id", courseId)
    return
  }

  const { data: assessments } = await supabase
    .from("assessments")
    .select("student_id, score, total_items")
    .eq("course_id", courseId)
    .in("student_id", studentIds)

  const applicants: TrackApplicant[] = (assessments || []).map(a => ({
    student_id: a.student_id,
    score: a.score,
    total_items: a.total_items,
  }))

  const rows = computeTrackRankings(applicants)

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
