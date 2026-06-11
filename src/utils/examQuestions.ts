import { QUESTIONS_PER_TRACK } from "./trackRanking"

/** Each course keeps this many questions in the bank. */
export const QUESTION_POOL_SIZE_PER_TRACK = 20

/** Each student's exam randomly draws this many questions from that course's pool. */
export const QUESTIONS_DRAWN_PER_TRACK = QUESTIONS_PER_TRACK

/** @deprecated Use QUESTION_POOL_SIZE_PER_TRACK */
export const QUESTION_BANK_MIN_PER_TRACK = QUESTION_POOL_SIZE_PER_TRACK

interface QuestionBase {
  id: number
  course_id: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

export function countQuestionsByCourse<T extends { course_id: string }>(
  allQuestions: T[]
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const q of allQuestions) {
    counts[q.course_id] = (counts[q.course_id] || 0) + 1
  }
  return counts
}

export function countExamQuestions(
  trackCount: number,
  questionsPerTrack = QUESTIONS_DRAWN_PER_TRACK
): number {
  return trackCount * questionsPerTrack
}

export function isBankReady(
  count: number,
  poolSize = QUESTION_POOL_SIZE_PER_TRACK
): boolean {
  return count >= poolSize
}

export function isPoolFull(
  count: number,
  poolSize = QUESTION_POOL_SIZE_PER_TRACK
): boolean {
  return count >= poolSize
}

export function poolSlotsRemaining(
  count: number,
  poolSize = QUESTION_POOL_SIZE_PER_TRACK
): number {
  return Math.max(0, poolSize - count)
}

function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return Math.floor((buf[0] / 0x100000000) * maxExclusive)
  }
  return Math.floor(Math.random() * maxExclusive)
}

/** Fisher–Yates shuffle using crypto randomness when available. */
export function shuffleRandom<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export type ExamSelectionSuccess<T> = {
  ok: true
  questions: T[]
  examCourseIds: string[]
}

export type ExamSelectionFailure = {
  ok: false
  errors: string[]
}

/**
 * Builds one exam: for each track, randomly draw QUESTIONS_DRAWN_PER_TRACK (10)
 * questions from that track's pool (must have QUESTION_POOL_SIZE_PER_TRACK / 20).
 * Each student gets an independent random draw so sets usually differ.
 */
export function selectExamQuestions<T extends QuestionBase>(
  allQuestions: T[],
  courseIds: string[],
  getCourseName: (courseId: string) => string,
  shuffle: <U>(array: U[]) => U[] = shuffleRandom,
  questionsPerTrack = QUESTIONS_DRAWN_PER_TRACK,
  poolSize = QUESTION_POOL_SIZE_PER_TRACK
): ExamSelectionSuccess<T> | ExamSelectionFailure {
  const errors: string[] = []
  const selected: T[] = []

  for (const courseId of courseIds) {
    const name = getCourseName(courseId)
    const pool = allQuestions.filter(q => q.course_id === courseId)
    const bankSize = pool.length

    if (bankSize < poolSize) {
      errors.push(
        `${name}: ${bankSize} / ${poolSize} questions in pool — add ${poolSize - bankSize} more so the exam can draw ${questionsPerTrack} at random per student.`
      )
      continue
    }

    const drawn = shuffle(pool).slice(0, questionsPerTrack)
    selected.push(...drawn)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  if (selected.length !== courseIds.length * questionsPerTrack) {
    return {
      ok: false,
      errors: ["Could not build a full exam. Every track needs a full 20-question pool."],
    }
  }

  return {
    ok: true,
    questions: shuffle(selected),
    examCourseIds: courseIds,
  }
}
