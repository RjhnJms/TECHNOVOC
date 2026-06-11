import { supabase } from "../supabaseClient"
import { isPassingScore } from "./trackRanking"

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

/**
 * Top 3 course recommendations:
 *
 * CASE A — Student passes (≥ 6/10) ALL 3 preferred courses:
 *   → Top-3 = those 3 preferred courses, sorted by score descending (#1 = highest score).
 *
 * CASE B — Student fails at least 1 preferred course:
 *   → Top-3 = 3 highest-scoring courses from the FULL exam (any track).
 *
 * TIEBREAKER (for CASE B same-score edge case):
 *   When two courses have the same score, the order is:
 *   1. Preferred course ranks above non-preferred (preferred choice respected).
 *   2. If both preferred or both non-preferred at same score: alphabetical by course_id (deterministic).
 *
 * This ensures that if a student fails all 3 preferred courses but ties with others,
 * the preferred course still gets priority in the top-3 recommendation.
 */
export function computeTop3Recommendations(
  allScores: CourseScore[],
  preferredCourseIds: string[]
): Top3Recommendation[] {
  const scoreByCourse = new Map(allScores.map(s => [s.course_id, s]))

  const preferredScores = preferredCourseIds
    .map(id => scoreByCourse.get(id))
    .filter((s): s is CourseScore => !!s)

  const allPreferredPassed =
    preferredCourseIds.length === 3 &&
    preferredCourseIds.every(id => {
      const s = scoreByCourse.get(id)
      return s && isPassingScore(s.score, s.total_items)
    })

  const fromPreferredCourses = allPreferredPassed && preferredScores.length === 3

  let picks: CourseScore[]

  if (fromPreferredCourses) {
    // CASE A: all preferred courses passed — sort by score desc
    picks = [...preferredScores].sort((a, b) => b.score - a.score)
  } else {
    // CASE B: sort full list with tiebreaker
    const preferredSet = new Set(preferredCourseIds)
    picks = [...allScores]
      .sort((a, b) => {
        // Primary: higher score first
        if (b.score !== a.score) return b.score - a.score
        // Secondary tiebreaker: preferred course beats non-preferred
        const aIsPreferred = preferredSet.has(a.course_id) ? 0 : 1
        const bIsPreferred = preferredSet.has(b.course_id) ? 0 : 1
        if (aIsPreferred !== bIsPreferred) return aIsPreferred - bIsPreferred
        // Tertiary: alphabetical by course_id for determinism
        return a.course_id.localeCompare(b.course_id)
      })
      .slice(0, 3)
  }

  return picks.map((s, index) => ({
    course_id: s.course_id,
    score: s.score,
    rank: index + 1,
    fromPreferredCourses,
  }))
}

export function allPreferredCoursesPassed(
  allScores: CourseScore[],
  preferredCourseIds: string[]
): boolean {
  return computeTop3Recommendations(allScores, preferredCourseIds)[0]?.fromPreferredCourses ?? false
}

export async function fetchStudentPreferredCourseIds(studentId: string): Promise<string[]> {
  const { data } = await supabase
    .from("student_course_preferences")
    .select("course_id")
    .eq("student_id", studentId)
    .order("preference_order")

  return (data || []).map(p => p.course_id)
}

export interface AssignableCourseOption {
  id: string
  label: string
  disabled: boolean
}

/** Courses the admin may assign to, with exam scores shown and preferences blocked. */
export function buildAssignableCourseOptions(
  courses: { id: string; course_name: string }[],
  preferredCourseIds: string[],
  examScoreByCourseId: Record<string, number>
): AssignableCourseOption[] {
  return courses
    .map(c => {
      const isPreferred = preferredCourseIds.includes(c.id)
      const score = examScoreByCourseId[c.id]
      const scoreText = score !== undefined ? ` — exam score ${score}/10` : ""
      return {
        id: c.id,
        label: isPreferred
          ? `${c.course_name} (preferred — not allowed)`
          : `${c.course_name}${scoreText}`,
        disabled: isPreferred,
      }
    })
    .sort((a, b) => {
      if (a.disabled !== b.disabled) return a.disabled ? 1 : -1
      return a.label.localeCompare(b.label)
    })
}

/** Assign a placement-waitlisted student to a course outside their top 3 preferences. */
export async function assignPlacementCourse(
  studentId: string,
  courseId: string,
  preferredCourseIds: string[],
  rankingId?: string | null
): Promise<{ error: string | null }> {
  if (preferredCourseIds.includes(courseId)) {
    return {
      error: "Cannot assign a student to one of their 3 preferred courses. Choose a different track.",
    }
  }

  const { data: assessment } = await supabase
    .from("assessments")
    .select("score")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle()

  const score = assessment?.score ?? 0

  if (rankingId) {
    const { error } = await supabase
      .from("rankings")
      .update({
        course_id: courseId,
        status: "included",
        score,
        rank: 1,
      })
      .eq("id", rankingId)
      .eq("student_id", studentId)

    return { error: error?.message ?? null }
  }

  const { error: deleteError } = await supabase.from("rankings").delete().eq("student_id", studentId)
  if (deleteError) return { error: deleteError.message }

  const { error: insertError } = await supabase.from("rankings").insert({
    student_id: studentId,
    course_id: courseId,
    status: "included",
    score,
    rank: 1,
  })

  return { error: insertError?.message ?? null }
}

export async function saveStudentRecommendations(
  studentId: string,
  allScores: CourseScore[],
  preferredCourseIds: string[]
): Promise<{ fromPreferredCourses: boolean; recommendations: Top3Recommendation[]; error: string | null }> {
  const top3 = computeTop3Recommendations(allScores, preferredCourseIds)
  const fromPreferredCourses = top3[0]?.fromPreferredCourses ?? false

  if (!fromPreferredCourses) {
    const { data: existing } = await supabase
      .from("rankings")
      .select("id, status, course_id")
      .eq("student_id", studentId)

    const manualPlacement = (existing || []).find(
      r =>
        r.status === "included" &&
        r.course_id &&
        !preferredCourseIds.includes(r.course_id)
    )

    if (manualPlacement) {
      const { error: cleanupError } = await supabase
        .from("rankings")
        .delete()
        .eq("student_id", studentId)
        .neq("id", manualPlacement.id)

      return {
        fromPreferredCourses: false,
        recommendations: top3,
        error: cleanupError?.message ?? null,
      }
    }
  }

  const { error: deleteError } = await supabase.from("rankings").delete().eq("student_id", studentId)
  if (deleteError) {
    return {
      fromPreferredCourses,
      recommendations: top3,
      error: deleteError.message,
    }
  }

  if (fromPreferredCourses && top3.length > 0) {
    const { error: insertError } = await supabase.from("rankings").insert(
      top3.map(r => ({
        student_id: studentId,
        course_id: r.course_id,
        score: r.score,
        rank: r.rank,
        status: "included",
      }))
    )
    if (insertError) {
      return {
        fromPreferredCourses: true,
        recommendations: top3,
        error: insertError.message,
      }
    }
  } else if (!fromPreferredCourses) {
    const bestScore = allScores.reduce((max, s) => Math.max(max, s.score), 0)
    const { error: insertError } = await supabase.from("rankings").insert({
      student_id: studentId,
      course_id: null,
      score: bestScore,
      rank: 0,
      status: "placement_waitlist",
    })
    if (insertError) {
      return {
        fromPreferredCourses: false,
        recommendations: top3,
        error: insertError.message,
      }
    }
  }

  return {
    fromPreferredCourses,
    recommendations: top3,
    error: null,
  }
}

/** Rebuild top-3 recommendation rows for every student who has assessments and preferences. */
export async function recomputeAllStudentRecommendations(): Promise<void> {
  const { data: assessments } = await supabase
    .from("assessments")
    .select("student_id, course_id, score, total_items")

  if (!assessments?.length) return

  const byStudent = new Map<string, CourseScore[]>()
  for (const a of assessments) {
    const list = byStudent.get(a.student_id) || []
    list.push({
      course_id: a.course_id,
      score: a.score,
      total_items: a.total_items,
    })
    byStudent.set(a.student_id, list)
  }

  const studentIds = [...byStudent.keys()]

  const { data: allPrefs } = await supabase
    .from("student_course_preferences")
    .select("student_id, course_id, preference_order")
    .in("student_id", studentIds)
    .order("preference_order")

  const prefsByStudent = new Map<string, string[]>()
  for (const p of allPrefs || []) {
    const list = prefsByStudent.get(p.student_id) || []
    list.push(p.course_id)
    prefsByStudent.set(p.student_id, list)
  }

  for (const [studentId, scores] of byStudent) {
    const preferred = prefsByStudent.get(studentId) || []
    if (preferred.length === 3) {
      await saveStudentRecommendations(studentId, scores, preferred)
    }
  }
}
