import { useState, useEffect } from "react"
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
  shuffledOptions?: { originalLabel: string; value: string }[]
}

type Stage = "intro" | "assessment" | "results"

export default function StudentDashboard({ studentId, studentName, onLogout }: Props) {
  const [stage, setStage] = useState<Stage>("intro")
  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [preCalculatedTotal, setPreCalculatedTotal] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [alreadyTaken, setAlreadyTaken] = useState(false)

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
          return
        }

        const { data: qData, error } = await supabase
          .from("questions")
          .select("*, courses(course_name)")
          .order("course_id")
        
        if (error || !qData) {
          alert("Failed to load questions from database.")
          setLoading(false)
          return
        }

        setAllQuestions(qData)
        setPreCalculatedTotal(qData.length)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    checkTakenAndLoad()
  }, [studentId])

  const startAssessment = () => {
    if (allQuestions.length === 0) {
      alert("No questions found in the database. Please ask admin to add questions first.")
      return
    }

    // 1. Shuffle options inside each question (so neighbors can't copy)
    const preparedQuestions = allQuestions.map(q => {
      const opts = [
        { originalLabel: "Option A", value: q.option_a },
        { originalLabel: "Option B", value: q.option_b },
        { originalLabel: "Option C", value: q.option_c },
        { originalLabel: "Option D", value: q.option_d },
      ]
      return {
        ...q,
        shuffledOptions: shuffleArray(opts)
      }
    })

    // 2. Shuffle the global question order
    setQuestions(shuffleArray(preparedQuestions))
    setStage("assessment")
  }

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit your assessment?")) return

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
  }

  // ── INTRO ──
  if (stage === "intro") {
    return (
      <AssessmentIntro
        studentName={studentName}
        alreadyTaken={alreadyTaken}
        loading={loading}
        onStart={startAssessment}
        onViewResults={() => setStage("results")}
        onLogout={onLogout}
        totalQuestions={preCalculatedTotal}
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
  // Save rankings for all courses the student completed, ranked by score descending
  const qualifiedCourses = scores
  for (let i = 0; i < qualifiedCourses.length; i++) {
    await supabase.from("rankings").insert([{
      student_id: studentId,
      course_id: qualifiedCourses[i].course_id,
      score: qualifiedCourses[i].percentage, // Save percentage score for standardized scaling
      rank: i + 1,
      status: "included",
    }])
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}