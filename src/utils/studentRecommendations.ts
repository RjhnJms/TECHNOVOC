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

const CHOICE_LABELS = ["1st choice", "2nd choice", "3rd choice"] as const

export function getChoiceLabel(preferenceIndex: number): string {
  return CHOICE_LABELS[preferenceIndex] ?? `#${preferenceIndex + 1}`
}

/**
 * Top 3 course recommendations:
 *
 * CASE A — Student passes (≥ 6/10) ALL 3 preferred courses:
 *   → Top-3 = those 3 preferred courses in choice order (1st, 2nd, 3rd).
 *
 * CASE B — Student fails at least 1 preferred course (waitlist):
 *   → Top-3 = 3 highest-scoring courses from the full exam, EXCLUDING the 3 preferred choices.
 *   → Admin manually assigns from these options.
 *
 * Auto-placement (single course): first passing preferred by choice order (1st, then 2nd, then 3rd),
 * regardless of score. Skips courses at capacity when saving.
 */
export function computeTop3Recommendations(
  allScores: CourseScore[],
  preferredCourseIds: string[]
): Top3Recommendation[] {
  const scoreByCourse = new Map(allScores.map(s => [s.course_id, s]))
  const preferredSet = new Set(preferredCourseIds)

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
    picks = preferredCourseIds
      .map(id => scoreByCourse.get(id))
      .filter((s): s is CourseScore => !!s)
  } else {
    picks = allScores
      .filter(s => !preferredSet.has(s.course_id))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
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

/** First passing preferred course by choice order (1st → 2nd → 3rd), ignoring score. */
export function pickAutoPlacementCourse(
  allScores: CourseScore[],
  preferredCourseIds: string[]
): { course_id: string; score: number } | null {
  const scoreByCourse = new Map(allScores.map(s => [s.course_id, s]))
  for (const id of preferredCourseIds) {
    const s = scoreByCourse.get(id)
    if (s && isPassingScore(s.score, s.total_items)) {
      return { course_id: id, score: s.score }
    }
  }
  return null
}

/** Top 3 non-preferred course IDs by exam score (for admin assignment on waitlist). */
export function getAdminAssignableCourseIds(
  allScores: CourseScore[],
  preferredCourseIds: string[]
): string[] {
  return computeTop3Recommendations(allScores, preferredCourseIds)
    .filter(r => !r.fromPreferredCourses)
    .map(r => r.course_id)
}

/** True when the student did not pass any of their 3 preferred courses (needs manual placement). */
export function needsPlacementWaitlist(
  allScores: CourseScore[],
  preferredCourseIds: string[]
): boolean {
  if (preferredCourseIds.length !== 3) return false
  return pickAutoPlacementCourse(allScores, preferredCourseIds) === null
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

/** Courses the admin may assign to, filtered to allowed course IDs and showing slot availability. */
export function buildAssignableCourseOptions(
  courses: { id: string; course_name: string }[],
  preferredCourseIds: string[],
  examScoreByCourseId: Record<string, number>,
  allowedCourseIds?: string[],
  enrolledCountById?: Record<string, number>,
  capacityById?: Record<string, number>
): AssignableCourseOption[] {
  const filtered = allowedCourseIds
    ? courses.filter(c => allowedCourseIds.includes(c.id))
    : courses.filter(c => !preferredCourseIds.includes(c.id))

  return filtered
    .map(c => {
      const score = examScoreByCourseId[c.id]
      const scoreText = score !== undefined ? ` — score ${score}/10` : ""
      const enrolled = enrolledCountById?.[c.id] ?? 0
      const capacity = capacityById?.[c.id] ?? 9999
      const slotsLeft = Math.max(0, capacity - enrolled)
      const isFull = slotsLeft === 0
      const slotText = capacityById ? (isFull ? " — FULL" : ` — ${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} left`) : ""
      return {
        id: c.id,
        label: `${c.course_name}${scoreText}${slotText}`,
        disabled: isFull,
      }
    })
    .sort((a, b) => {
      if (a.disabled !== b.disabled) return a.disabled ? 1 : -1
      return a.label.localeCompare(b.label)
    })
}

/** Assign a placement-waitlisted student to their top-scoring available course. */
async function getCourseSlotsLeft(courseId: string): Promise<number> {
  const [{ data: courseData }, { count: enrolled }] = await Promise.all([
    supabase.from("courses").select("capacity").eq("id", courseId).maybeSingle(),
    supabase.from("rankings").select("*", { count: "exact", head: true }).eq("course_id", courseId).eq("status", "included"),
  ])
  return (courseData?.capacity ?? 0) - (enrolled ?? 0)
}

/** Pick first passing preferred course with an open slot (1st choice, then 2nd, then 3rd). */
async function pickPassedPreferredWithSlot(
  allScores: CourseScore[],
  preferredCourseIds: string[]
): Promise<{ course_id: string; score: number } | null> {
  const scoreByCourse = new Map(allScores.map(s => [s.course_id, s]))
  for (const id of preferredCourseIds) {
    const s = scoreByCourse.get(id)
    if (!s || !isPassingScore(s.score, s.total_items)) continue
    const slotsLeft = await getCourseSlotsLeft(id)
    if (slotsLeft > 0) return { course_id: id, score: s.score }
  }
  return null
}

/** Pick the student's highest scoring course that has available capacity (fallback placement). */
async function pickHighestScoringWithSlot(
  allScores: CourseScore[]
): Promise<{ course_id: string; score: number } | null> {
  const sorted = [...allScores].sort((a, b) => b.score - a.score)
  for (const s of sorted) {
    const slotsLeft = await getCourseSlotsLeft(s.course_id)
    if (slotsLeft > 0) return { course_id: s.course_id, score: s.score }
  }
  return null
}

export async function assignPlacementCourse(
  studentId: string,
  courseId: string,
  rankingId?: string | null
): Promise<{ error: string | null }> {
  const [{ data: courseData }, { count: enrolled }] = await Promise.all([
    supabase.from("courses").select("capacity").eq("id", courseId).maybeSingle(),
    supabase.from("rankings").select("*", { count: "exact", head: true }).eq("course_id", courseId).eq("status", "included"),
  ])
  const capacity = courseData?.capacity ?? 0
  const slotsLeft = capacity - (enrolled ?? 0)
  if (slotsLeft <= 0) {
    return { error: "This course has reached its capacity. Choose a different track." }
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

  const allPreferredPassed = allPreferredCoursesPassed(allScores, preferredCourseIds)
  const onWaitlist = needsPlacementWaitlist(allScores, preferredCourseIds)
  const autoPlacement = pickAutoPlacementCourse(allScores, preferredCourseIds)

  if (allPreferredPassed && top3.length > 0) {
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
  } else {
    // Try to place automatically based on preferred courses first
    let placed = false

    if (autoPlacement && !onWaitlist) {
      const best = await pickPassedPreferredWithSlot(allScores, preferredCourseIds)
      if (best) {
        const { error: insertError } = await supabase.from("rankings").insert({
          student_id: studentId,
          course_id: best.course_id,
          score: best.score,
          rank: 1,
          status: "included",
        })
        if (insertError) {
          return {
            fromPreferredCourses: false,
            recommendations: top3,
            error: insertError.message,
          }
        }
        placed = true
      }
    }

    // Fallback: If they haven't been placed (failed preferred courses, or preferred are full),
    // automatically assign them to their highest scoring overall course that has slots left.
    if (!placed) {
      const fallbackBest = await pickHighestScoringWithSlot(allScores)
      if (fallbackBest) {
        const { error: insertError } = await supabase.from("rankings").insert({
          student_id: studentId,
          course_id: fallbackBest.course_id,
          score: fallbackBest.score,
          rank: 1,
          status: "included",
        })
        if (insertError) {
          return {
            fromPreferredCourses: false,
            recommendations: top3,
            error: insertError.message,
          }
        }
      } else {
        // Absolute fallback: if every single course is full, place on waitlist
        const bestScore = allScores.reduce((max, s) => Math.max(max, s.score), 0)
        const { error: insertError } = await supabase.from("rankings").insert({
          student_id: studentId,
          course_id: null,
          score: bestScore,
          rank: 0,
          status: "waitlist",
        })
        if (insertError) {
          return {
            fromPreferredCourses: false,
            recommendations: top3,
            error: insertError.message,
          }
        }
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
