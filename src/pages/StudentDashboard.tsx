import { useState, useEffect, useRef } from "react"
import { supabase } from "../supabaseClient"
import StudentResults from "./StudentResults"
import AssessmentIntro from "./Assessmentintro"
import AssessmentQuestion from "./AssessmentQuestion"

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
}

type Stage = "intro" | "assessment" | "results"

export default function StudentDashboard({ studentId, studentName, onLogout }: Props) {
  const [stage, setStage] = useState<Stage>("intro")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [alreadyTaken, setAlreadyTaken] = useState(false)

  // Timer states
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [timerMinutes, setTimerMinutes] = useState(60)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerStarted, setTimerStarted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const checkTaken = async () => {
      const { data } = await supabase
        .from("assessments")
        .select("*")
        .eq("student_id", studentId)
        .limit(1)
      if (data && data.length > 0) setAlreadyTaken(true)
    }
    checkTaken()
  }, [studentId])

  // ── Timer countdown ──
  useEffect(() => {
    if (!timerStarted || !timerEnabled) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          alert("Time is up! Your assessment will be submitted now.")
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStarted])

  const loadQuestions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("questions")
      .select("*, courses(course_name)")
      .order("course_id")
    setLoading(false)
    if (error || !data) { alert("Failed to load questions."); return }
    setQuestions([...data].sort(() => Math.random() - 0.5))
    setTimeLeft(timerMinutes * 60)
    setTimerStarted(true)
    setStage("assessment")
  }

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    const unanswered = questions.length - Object.keys(answers).length
    if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return

    setLoading(true)
    const courseMap = buildCourseMap(questions, answers)
    const scores = buildScores(courseMap)
    await saveAssessments(studentId, scores)
    await saveRankings(studentId, scores)
    setLoading(false)
    setStage("results")
  }

  const resetAssessment = () => {
    setStage("intro")
    setAnswers({})
    setCurrentIndex(0)
    setQuestions([])
    setTimerStarted(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // ── INTRO ──
  if (stage === "intro") {
    return (
      <AssessmentIntro
        studentName={studentName}
        alreadyTaken={alreadyTaken}
        loading={loading}
        timerEnabled={timerEnabled}
        timerMinutes={timerMinutes}
        onToggleTimer={() => setTimerEnabled(p => !p)}
        onSelectMinutes={setTimerMinutes}
        onStart={loadQuestions}
        onLogout={onLogout}
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
        loading={loading}
        timeLeft={timeLeft}
        timerEnabled={timerEnabled}
        onAnswer={handleAnswer}
        onNext={() => setCurrentIndex(i => i + 1)}
        onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
        onNavigate={setCurrentIndex}
        onSubmit={handleSubmit}
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
      percentage: Math.round((data.score / data.total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

async function saveAssessments(
  studentId: string,
  scores: ReturnType<typeof buildScores>
) {
  for (const cs of scores) {
    await supabase.from("assessments").insert([{
      student_id: studentId,
      course_id: cs.course_id,
      score: cs.score,
      total_items: cs.total,
      passed: cs.percentage >= 50,
    }])
  }
}

async function saveRankings(
  studentId: string,
  scores: ReturnType<typeof buildScores>
) {
  // Only save courses where student scored 75% or higher
  const qualifiedCourses = scores.filter(cs => cs.percentage >= 75)
  for (let i = 0; i < qualifiedCourses.length; i++) {
    await supabase.from("rankings").insert([{
      student_id: studentId,
      course_id: qualifiedCourses[i].course_id,
      score: qualifiedCourses[i].score,
      rank: i + 1,
      status: "included",
    }])
  }
}