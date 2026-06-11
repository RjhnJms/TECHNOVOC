import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "../supabaseClient"
import StudentResults from "./StudentResults"
import AssessmentIntro from "./Assessmentintro"
import AssessmentQuestion from "./AssessmentQuestion"
import CoursePreferenceSelection, { type CourseOption } from "./CoursePreferenceSelection"
import { selectExamQuestions, countExamQuestions, shuffleRandom } from "../utils/examQuestions"
import { isPassingScore } from "../utils/trackRanking"
import { saveStudentRecommendations } from "../utils/studentRecommendations"
import {
  isLabAccessCodeRequired,
  isLabCodeVerifiedLocally,
  redeemLabCodeForStudent,
  setLabCodeVerifiedLocally,
  validateLabCodeForStudent,
} from "../utils/examAccessCode"

interface Props {
  studentId: string
  studentName: string
  onLogout: () => void
}

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  type: string
  course_id: string
  courses?: { course_name: string }
  shuffledOptions?: { originalLabel: string; value: string }[]
}

type Stage = "preferences" | "intro" | "assessment" | "results"

function getPreferredCoursesKey(studentId: string) {
  return `preferred_courses_${studentId}`
}

function getSavedPreferences(studentId: string): string[] | null {
  try {
    const raw = localStorage.getItem(getPreferredCoursesKey(studentId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length === 3) return parsed
  } catch {
    /* ignore */
  }
  return null
}

export const ASSESSMENT_DURATION_MS = 60 * 60 * 1000
export const MAX_SKIPS = 5

function getSavedSession(studentId: string) {
  try {
    const savedStateStr = localStorage.getItem(`assessment_state_${studentId}`)
    if (savedStateStr) {
      const savedState = JSON.parse(savedStateStr)
      if (savedState && savedState.questions && savedState.questions.length > 0) {
        return savedState
      }
    }
  } catch (err) {
    console.error("Failed to restore saved assessment state:", err)
  }
  return null
}

export default function StudentDashboard({ studentId, studentName, onLogout }: Props) {
  const savedSession = getSavedSession(studentId)
  const savedPreferences = getSavedPreferences(studentId)

  const [stage, setStage] = useState<Stage>(
    savedSession ? "assessment" : savedPreferences ? "intro" : "preferences"
  )
  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([])
  const [preferredCourseIds, setPreferredCourseIds] = useState<string[]>(
    savedSession?.preferredCourseIds ?? savedPreferences ?? []
  )
  const [questions, setQuestions] = useState<Question[]>(savedSession ? savedSession.questions : [])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [preCalculatedTotal, setPreCalculatedTotal] = useState(0)
  const [currentIndex, setCurrentIndex] = useState<number>(savedSession ? savedSession.currentIndex : 0)
  const [answers, setAnswers] = useState<Record<number, string>>(savedSession ? savedSession.answers : {})
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(
    () => new Set(savedSession?.skippedQuestions ?? [])
  )
  const [skipsUsed, setSkipsUsed] = useState<number>(savedSession?.skipsUsed ?? 0)
  const [assessmentEndTime, setAssessmentEndTime] = useState<number | null>(
    savedSession?.assessmentEndTime ?? null
  )
  const [loading, setLoading] = useState(true)
  const [alreadyTaken, setAlreadyTaken] = useState(false)
  const [requireLabCode, setRequireLabCode] = useState(false)
  const [labCode, setLabCode] = useState("")
  const [labCodeVerified, setLabCodeVerified] = useState(() => isLabCodeVerifiedLocally(studentId))
  const [labCodeError, setLabCodeError] = useState<string | null>(null)
  const [verifyingLabCode, setVerifyingLabCode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const autoSubmittedRef = useRef(false)
  const skipSessionSaveRef = useRef(false)
  const saveSessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const checkTakenAndLoad = async () => {
      setLoading(true)
      try {
        const { data: takenData } = await supabase
          .from("assessments")
          .select("*")
          .eq("student_id", studentId)
          .limit(1)
        if (takenData && takenData.length > 0) {
          setAlreadyTaken(true)
          setStage("results")
          setLoading(false)
          localStorage.removeItem(`assessment_state_${studentId}`)
          return
        }

        const labRequired = await isLabAccessCodeRequired()
        setRequireLabCode(labRequired)
        if (!labRequired) {
          setLabCodeVerified(true)
        } else if (!isLabCodeVerifiedLocally(studentId)) {
          setLabCodeVerified(false)
        }

        const [{ data: qData, error }, { data: courseData }] = await Promise.all([
          supabase.from("questions").select("*, courses(course_name)").order("course_id"),
          supabase.from("courses").select("id, course_name").order("course_name"),
        ])

        if (error || !qData) {
          alert("Failed to load questions from database.")
          setLoading(false)
          return
        }

        const courses = courseData || []
        setAvailableCourses(courses)
        setAllQuestions(qData)
        setPreCalculatedTotal(countExamQuestions(courses.length))

        const { data: dbPrefs } = await supabase
          .from("student_course_preferences")
          .select("course_id, preference_order")
          .eq("student_id", studentId)
          .order("preference_order")

        if (dbPrefs && dbPrefs.length === 3) {
          const ids = dbPrefs.map(p => p.course_id)
          setPreferredCourseIds(ids)
          localStorage.setItem(getPreferredCoursesKey(studentId), JSON.stringify(ids))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    checkTakenAndLoad()
  }, [studentId])

  // Restore full question text from DB when resuming a slim localStorage session
  const needsQuestionTextMerge = questions.length > 0 && !questions[0]?.question_text
  useEffect(() => {
    if (!needsQuestionTextMerge || allQuestions.length === 0) return

    setQuestions(prev =>
      prev.map(q => {
        const full = allQuestions.find(a => a.id === q.id)
        if (!full) return q
        return { ...full, shuffledOptions: q.shuffledOptions }
      })
    )
  }, [allQuestions, needsQuestionTextMerge])

  // Debounced save — slim payload avoids blocking the UI on large exams
  useEffect(() => {
    if (stage !== "assessment" || questions.length === 0 || skipSessionSaveRef.current) return

    if (saveSessionTimerRef.current) {
      clearTimeout(saveSessionTimerRef.current)
    }

    saveSessionTimerRef.current = setTimeout(() => {
      if (skipSessionSaveRef.current) return
      const stateToSave = {
        questions: slimQuestionsForStorage(questions),
        currentIndex,
        answers,
        skippedQuestions: Array.from(skippedQuestions),
        skipsUsed,
        assessmentEndTime,
        preferredCourseIds,
      }
      try {
        localStorage.setItem(`assessment_state_${studentId}`, JSON.stringify(stateToSave))
      } catch (err) {
        console.warn("Could not save assessment progress locally:", err)
      }
    }, 800)

    return () => {
      if (saveSessionTimerRef.current) clearTimeout(saveSessionTimerRef.current)
    }
  }, [stage, questions, currentIndex, answers, skippedQuestions, skipsUsed, assessmentEndTime, preferredCourseIds, studentId])

  // Restore timer for in-progress sessions saved before timer was added
  useEffect(() => {
    if (stage === "assessment" && questions.length > 0 && !assessmentEndTime) {
      setAssessmentEndTime(Date.now() + ASSESSMENT_DURATION_MS)
    }
  }, [stage, questions.length, assessmentEndTime])

  useEffect(() => {
    if (!loading && preferredCourseIds.length === 3 && stage === "preferences" && !savedSession) {
      setStage("intro")
    }
  }, [loading, preferredCourseIds.length, stage, savedSession])

  const savePreferredCourses = async (courseIds: string[]) => {
    setPreferredCourseIds(courseIds)
    localStorage.setItem(getPreferredCoursesKey(studentId), JSON.stringify(courseIds))

    await supabase.from("student_course_preferences").delete().eq("student_id", studentId)
    const { error } = await supabase.from("student_course_preferences").insert(
      courseIds.map((course_id, i) => ({
        student_id: studentId,
        course_id,
        preference_order: i + 1,
      }))
    )
    if (error) {
      console.warn("Preferences saved locally; database table may need setup:", error.message)
    }

    setStage("intro")
  }

  const handleVerifyLabCode = async () => {
    setVerifyingLabCode(true)
    setLabCodeError(null)
    const result = await validateLabCodeForStudent(studentId, labCode)
    setVerifyingLabCode(false)
    if (!result.ok) {
      setLabCodeError(result.message)
      setLabCodeVerified(false)
      return
    }
    setLabCodeVerified(true)
    setLabCodeVerifiedLocally(studentId)
  }

  const startAssessment = async () => {
    if (preferredCourseIds.length !== 3) {
      setStage("preferences")
      return
    }

    if (requireLabCode) {
      if (!labCodeVerified) {
        setLabCodeError("Verify your laboratory batch code before starting.")
        return
      }
      const redeem = await redeemLabCodeForStudent(studentId, labCode)
      if (!redeem.ok) {
        setLabCodeError(redeem.message)
        setLabCodeVerified(false)
        return
      }
    }
    if (allQuestions.length === 0) {
      alert("No questions found in the database. Please ask admin to add questions first.")
      return
    }

    const examCourseIds = availableCourses.map(c => c.id)
    const nameById = Object.fromEntries(availableCourses.map(c => [c.id, c.course_name]))
    const selection = selectExamQuestions<Question>(
      allQuestions,
      examCourseIds,
      id => nameById[id] || "Unknown track",
      shuffleRandom
    )

    if (!selection.ok) {
      alert(
        "The exam cannot start until every track has enough questions in the bank:\n\n" +
        selection.errors.join("\n")
      )
      return
    }

    // Shuffle options inside each question (so neighbors can't copy)
    const preparedQuestions = selection.questions.map(q => {
      const opts = [
        { originalLabel: "Option A", value: q.option_a },
        { originalLabel: "Option B", value: q.option_b },
        { originalLabel: "Option C", value: q.option_c },
        { originalLabel: "Option D", value: q.option_d },
      ]
      return {
        ...q,
        shuffledOptions: shuffleArray(opts),
      }
    })

    const shuffled = preparedQuestions
    const endTime = Date.now() + ASSESSMENT_DURATION_MS
    setQuestions(shuffled)
    setSkippedQuestions(new Set())
    setSkipsUsed(0)
    setAssessmentEndTime(endTime)
    autoSubmittedRef.current = false
    skipSessionSaveRef.current = false
    setStage("assessment")

    localStorage.setItem(`assessment_state_${studentId}`, JSON.stringify({
      questions: slimQuestionsForStorage(shuffled),
      currentIndex: 0,
      answers: {},
      skippedQuestions: [],
      skipsUsed: 0,
      assessmentEndTime: endTime,
      preferredCourseIds,
    }))
  }

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    setSkippedQuestions(prev => {
      if (!prev.has(questionId)) return prev
      const next = new Set(prev)
      next.delete(questionId)
      return next
    })
  }

  const handleSkip = () => {
    if (skipsUsed >= MAX_SKIPS) return
    const question = questions[currentIndex]
    if (!question || answers[question.id]) return

    setSkippedQuestions(prev => new Set(prev).add(question.id))
    setSkipsUsed(prev => prev + 1)
    // No auto-advance — all questions on the page are visible simultaneously
  }

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submittingRef.current) return
    if (!autoSubmit && !confirm("Are you sure you want to submit your assessment?")) return

    submittingRef.current = true
    setSubmitting(true)
    skipSessionSaveRef.current = true
    if (saveSessionTimerRef.current) {
      clearTimeout(saveSessionTimerRef.current)
      saveSessionTimerRef.current = null
    }
    localStorage.removeItem(`assessment_state_${studentId}`)

    try {
      const courseMap = buildCourseMap(questions, answers)
      const scores = buildScores(courseMap)

      const assessmentRows = scores.map(cs => ({
        student_id: studentId,
        course_id: cs.course_id,
        score: cs.score,
        total_items: cs.total,
        passed: isPassingScore(cs.score, cs.total),
      }))

      const { error: assessmentError } = await supabase.from("assessments").insert(assessmentRows)
      if (assessmentError) {
        throw new Error(assessmentError.message)
      }

      const recResult = await saveStudentRecommendations(
        studentId,
        scores.map(s => ({ course_id: s.course_id, score: s.score, total_items: s.total })),
        preferredCourseIds
      )
      if (recResult.error) {
        console.warn("Recommendations could not be saved:", recResult.error)
      }

      setAlreadyTaken(true)
      setStage("results")
    } catch (err) {
      console.error("Assessment submit failed:", err)
      const message = err instanceof Error ? err.message : "Unknown error"
      alert(
        `Could not submit your assessment: ${message}\n\nPlease check your connection and try again.`
      )
      submittingRef.current = false
      skipSessionSaveRef.current = false
    } finally {
      setSubmitting(false)
    }
  }, [studentId, questions, answers, preferredCourseIds])

  // Auto-submit once when the 60-minute timer expires
  useEffect(() => {
    if (stage !== "assessment" || !assessmentEndTime) return

    const tick = () => {
      if (Date.now() >= assessmentEndTime && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true
        void handleSubmit(true)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [stage, assessmentEndTime, handleSubmit])

  const resetAssessment = () => {
    submittingRef.current = false
    autoSubmittedRef.current = false
    skipSessionSaveRef.current = false
    const hasPrefs = preferredCourseIds.length === 3
    setStage(hasPrefs ? "intro" : "preferences")
    setAnswers({})
    setCurrentIndex(0)
    setQuestions([])
    setSkippedQuestions(new Set())
    setSkipsUsed(0)
    setAssessmentEndTime(null)
    localStorage.removeItem(`assessment_state_${studentId}`) // Clear saved session state upon exit/reset
  }

  const preferredCourseNames = preferredCourseIds
    .map(id => availableCourses.find(c => c.id === id)?.course_name)
    .filter(Boolean) as string[]

  // ── PREFERENCES ──
  if (stage === "preferences" && !alreadyTaken) {
    return (
      <CoursePreferenceSelection
        studentName={studentName}
        courses={availableCourses}
        loading={loading}
        onConfirm={savePreferredCourses}
        onLogout={onLogout}
      />
    )
  }

  // ── INTRO ──
  if (stage === "intro") {
    return (
      <AssessmentIntro
        studentName={studentName}
        alreadyTaken={alreadyTaken}
        loading={loading}
        onStart={() => { void startAssessment() }}
        onViewResults={() => setStage("results")}
        onLogout={onLogout}
        onChangePreferences={() => setStage("preferences")}
        totalQuestions={preCalculatedTotal}
        preferredCourses={preferredCourseNames}
        requireLabCode={requireLabCode}
        labCode={labCode}
        onLabCodeChange={code => {
          setLabCode(code)
          setLabCodeError(null)
          if (labCodeVerified) setLabCodeVerified(false)
        }}
        onVerifyLabCode={() => { void handleVerifyLabCode() }}
        labCodeVerified={labCodeVerified}
        labCodeError={labCodeError}
        verifyingLabCode={verifyingLabCode}
      />
    )
  }

  // ── ASSESSMENT ──
  if (stage === "assessment") {
    return (
      <AssessmentQuestion
        studentName={studentName}
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        skippedQuestions={skippedQuestions}
        skipsUsed={skipsUsed}
        maxSkips={MAX_SKIPS}
        assessmentEndTime={assessmentEndTime}
        submitting={submitting}
        onAnswer={handleAnswer}
        onSkip={handleSkip}
        onNext={() => setCurrentIndex(i => i + 1)}
        onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
        onNavigate={setCurrentIndex}
        onSubmit={() => { void handleSubmit(false) }}
        onExit={resetAssessment}
      />
    )
  }

  // ── RESULTS ──
  if (stage === "results") {
    return (
      <StudentResults
        studentId={studentId}
        studentName={studentName}
        onLogout={onLogout}
        onRetake={resetAssessment}
      />
    )
  }

  return null
}

// ── Helper functions (outside component = lower complexity) ──

type StoredExamQuestion = Pick<
  Question,
  "id" | "course_id" | "correct_answer" | "type" | "courses" | "shuffledOptions"
>

/** Omit heavy text fields from localStorage to keep saves fast. */
function slimQuestionsForStorage(questions: Question[]): StoredExamQuestion[] {
  return questions.map(q => ({
    id: q.id,
    course_id: q.course_id,
    correct_answer: q.correct_answer,
    type: q.type,
    courses: q.courses,
    shuffledOptions: q.shuffledOptions,
  }))
}

function buildCourseMap(
  questions: Question[],
  answers: Record<number, string>
) {
  const courseMap: Record<string, { course_id: string; score: number; total: number }> = {}
  questions.forEach(q => {
    const name = q.courses?.course_name || "Unknown"
    if (!courseMap[name]) courseMap[name] = { course_id: q.course_id, score: 0, total: 0 }
    courseMap[name].total += 1
    if (answers[q.id] === q.correct_answer) courseMap[name].score += 1
  })
  return courseMap
}

function buildScores(
  courseMap: Record<string, { course_id: string; score: number; total: number }>
) {
  return Object.entries(courseMap)
    .map(([name, data]) => ({
      course_name: name,
      course_id: data.course_id,
      score: data.score,
      total: data.total,
    }))
    .sort((a, b) => b.score - a.score || b.total - a.total)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}