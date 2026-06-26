import { useEffect, useMemo, useState, useRef } from "react"
import ConfirmDialog from "../components/ConfirmDialog"

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

interface Props {
  studentName: string
  questions: Question[]
  currentIndex: number
  answers: Record<number, string>
  skippedQuestions: Set<number>
  skipsUsed: number
  maxSkips: number
  assessmentEndTime: number | null
  submitting: boolean
  onAnswer: (questionId: number, answer: string) => void
  onSkip: () => void
  onNext: () => void
  onPrev: () => void
  onNavigate: (index: number) => void
  onSubmit: () => void
  onExit: () => void
}

const PAGE_SIZE = 10

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function AssessmentQuestion({
  studentName, questions, currentIndex, answers, skippedQuestions,
  skipsUsed, maxSkips, assessmentEndTime, submitting,
  onAnswer, onSkip, onNavigate, onSubmit, onExit
}: Props) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    assessmentEndTime ? assessmentEndTime - Date.now() : 0
  )
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [pendingSkipIndex, setPendingSkipIndex] = useState<number | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  // Derive which "page" (section of 10) we are on from currentIndex
  const currentPage = Math.floor(currentIndex / PAGE_SIZE)
  const totalPages = Math.ceil(questions.length / PAGE_SIZE)

  // Questions visible on this page
  const pageQuestions = useMemo(() =>
    questions.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [questions, currentPage]
  )

  // Generic section label — course name intentionally hidden from student
  const sectionName = `Section ${currentPage + 1}`

  // Answered count for the current page
  const pageAnswered = pageQuestions.filter(q => !!answers[q.id] || skippedQuestions.has(q.id)).length

  // Overall stats
  const totalAnswered = questions.filter(q => !!answers[q.id]).length
  const totalSkipped = skippedQuestions.size
  const totalUnanswered = questions.length - totalAnswered - totalSkipped

  const skipsRemaining = maxSkips - skipsUsed
  const isLowTime = timeRemaining > 0 && timeRemaining <= 5 * 60 * 1000
  const isLastPage = currentPage === totalPages - 1
  const canSubmit = totalAnswered === questions.length

  useEffect(() => {
    if (!assessmentEndTime) return
    const updateTimer = () => setTimeRemaining(assessmentEndTime - Date.now())
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [assessmentEndTime])

  useEffect(() => {
    if (totalAnswered === 0 && totalSkipped === 0) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [totalAnswered, totalSkipped])

  const goToNextSection = () => {
    const nextFirst = (currentPage + 1) * PAGE_SIZE
    if (nextFirst < questions.length) {
      onNavigate(nextFirst)
      topRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const goToPrevSection = () => {
    const prevFirst = (currentPage - 1) * PAGE_SIZE
    if (prevFirst >= 0) {
      onNavigate(prevFirst)
      topRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Per-page completion for sidebar section list
  const pageSummary = useMemo(() =>
    Array.from({ length: totalPages }, (_, pi) => {
      const pqs = questions.slice(pi * PAGE_SIZE, (pi + 1) * PAGE_SIZE)
      const answered = pqs.filter(q => !!answers[q.id] || skippedQuestions.has(q.id)).length
      // Generic label — course name hidden to prevent bias
      const name = `Section ${pi + 1}`
      return { name, answered, total: pqs.length }
    }),
    [questions, answers, skippedQuestions, totalPages]
  )

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f3f4", width: "100%" }}>

      {/* ── Header ── */}
      <div className="assessment-header">
        <div className="assessment-header-left">
          <div>
            <h1 style={{ margin: 0, fontWeight: "700", fontSize: "16px", color: "#1a1a1a" }}>
              TECHNO-VOC Assessment
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#5f6368" }}>
              {studentName} · Section {currentPage + 1} of {totalPages} · {totalAnswered} of {questions.length} answered
            </p>
          </div>
        </div>

        <div className="assessment-header-right">
          {/* Timer */}
          {assessmentEndTime && (
            <div style={{
              padding: "6px 14px",
              borderRadius: "8px",
              backgroundColor: isLowTime ? "#fce8e6" : "#e8f0fe",
              border: `1.5px solid ${isLowTime ? "#f28b82" : "#aecbfa"}`,
            }}>
              <p style={{ margin: 0, fontSize: "10px", color: isLowTime ? "#c5221f" : "#1967d2", fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Time Left
              </p>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", fontFamily: "monospace", color: isLowTime ? "#c5221f" : "#1967d2" }}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          )}

          {/* Skips */}
          <div style={{ padding: "6px 14px", borderRadius: "8px", backgroundColor: "#fef7e0", border: "1.5px solid #fdd663" }}>
            <p style={{ margin: 0, fontSize: "10px", color: "#7a5c00", fontWeight: "700", letterSpacing: "0.5px", textTransform: "uppercase" }}>Skips</p>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#7a5c00" }}>{skipsRemaining}/{maxSkips}</p>
          </div>

          {totalAnswered === 0 && totalSkipped === 0 && (
            <button onClick={onExit} style={btnOutline}>Exit</button>
          )}
        </div>
      </div>

      {/* ── Overall Progress Bar ── */}
      <div style={{ backgroundColor: "#dadce0", height: "4px", width: "100%" }}>
        <div style={{
          backgroundColor: "#1a73e8",
          height: "4px",
          width: `${questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0}%`,
          transition: "width 0.4s ease"
        }} />
      </div>

      {/* ── Body ── */}
      <div ref={topRef} className="assessment-body">

        {/* ── Left: Form Questions ── */}
        <div className="assessment-left-panel">

          {/* Section header card */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            borderTop: "10px solid #1a73e8",
            padding: "24px 28px",
            marginBottom: "12px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "700", color: "#1a1a1a" }}>
              {sectionName}
            </h2>
            <p style={{ margin: 0, color: "#5f6368", fontSize: "14px" }}>
              Section {currentPage + 1} of {totalPages} · {pageAnswered} of {pageQuestions.length} answered in this section
            </p>
            {pageQuestions.some(q => skippedQuestions.has(q.id)) && (
              <p style={{ margin: "8px 0 0", color: "#e37400", fontSize: "13px", fontWeight: "600" }}>
                ⚠ This section has skipped questions. You can return to them anytime.
              </p>
            )}
          </div>

          {/* Individual question cards */}
          {pageQuestions.map((q, localIdx) => {
            const globalIdx = currentPage * PAGE_SIZE + localIdx
            const options = q.shuffledOptions || [
              { originalLabel: "Option A", value: q.option_a },
              { originalLabel: "Option B", value: q.option_b },
              { originalLabel: "Option C", value: q.option_c },
              { originalLabel: "Option D", value: q.option_d },
            ]
            const selected = answers[q.id]
            const isSkipped = skippedQuestions.has(q.id)
            const isAnswered = !!selected

            return (
              <div
                key={q.id}
                id={`q-${globalIdx}`}
                className="question-card"
                style={{
                  borderLeft: isSkipped
                    ? "4px solid #e37400"
                    : isAnswered
                      ? "4px solid #1e8e3e"
                      : "4px solid transparent",
                }}
              >
                {/* Question number & badges */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "14px" }}>
                  <span style={{
                    minWidth: "26px", height: "26px", borderRadius: "50%",
                    backgroundColor: isAnswered ? "#1e8e3e" : isSkipped ? "#e37400" : "#1a73e8",
                    color: "white", fontSize: "12px", fontWeight: "700",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    {globalIdx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "600", color: "#1a1a1a", lineHeight: "1.5" }}>
                      {q.question_text}
                      <span style={{ color: "#c5221f", marginLeft: "4px" }}>*</span>
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {/* Question type indicator */}
                      <span style={{
                        backgroundColor: q.type === "pre-skilled" ? "#ede9fe" : "#e8f0fe",
                        color: q.type === "pre-skilled" ? "#6d28d9" : "#1967d2",
                        padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                        letterSpacing: "0.3px"
                      }}>
                        {q.type === "pre-skilled" ? "Pre-Skill" : "Aptitude"}
                      </span>
                      {isSkipped && (
                        <span style={{ backgroundColor: "#fff3e0", color: "#e37400", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
                          SKIPPED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Answer options */}
                <div className="question-options-container">
                  {options.map((opt, oi) => {
                    const isSelected = selected === opt.originalLabel
                    return (
                      <label
                        key={opt.originalLabel}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: isSelected ? "2px solid #1a73e8" : "2px solid #e0e0e0",
                          backgroundColor: isSelected ? "#e8f0fe" : "white",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onClick={() => onAnswer(q.id, opt.originalLabel)}
                      >
                        {/* Custom radio */}
                        <div style={{
                          width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                          border: isSelected ? "5px solid #1a73e8" : "2px solid #bdc1c6",
                          backgroundColor: "white",
                          transition: "border 0.15s"
                        }} />
                        <span style={{
                          fontSize: "14px",
                          color: isSelected ? "#1967d2" : "#3c4043",
                          fontWeight: isSelected ? "600" : "400"
                        }}>
                          <span style={{ fontWeight: "700", marginRight: "6px", color: "#5f6368" }}>
                            {String.fromCharCode(65 + oi)}.
                          </span>
                          {opt.value}
                        </span>
                      </label>
                    )
                  })}
                </div>

                {/* Per-question skip button */}
                {!isAnswered && !isSkipped && (
                  <div style={{ marginTop: "12px", marginLeft: "36px" }}>
                    <button
                      onClick={() => {
                        setPendingSkipIndex(globalIdx)
                        setShowSkipConfirm(true)
                      }}
                      disabled={skipsRemaining === 0}
                      title={skipsRemaining === 0 ? "No skips remaining" : "Mark as skipped"}
                      style={{
                        ...btnText,
                        color: skipsRemaining > 0 ? "#e37400" : "#bdc1c6",
                        cursor: skipsRemaining > 0 ? "pointer" : "not-allowed"
                      }}
                    >
                      Skip this question ({skipsRemaining} left)
                    </button>
                  </div>
                )}

                {/* "Remove skip" option */}
                {isSkipped && (
                  <div style={{ marginTop: "12px", marginLeft: "36px" }}>
                    <span style={{ fontSize: "13px", color: "#e37400", fontStyle: "italic" }}>
                      This question is skipped — select an answer above to unskip it.
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Section nav buttons ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingBottom: "40px" }}>
            <button
              onClick={goToPrevSection}
              disabled={currentPage === 0}
              style={{ ...btnOutline, opacity: currentPage === 0 ? 0.4 : 1 }}
            >
              ← Previous Section
            </button>

            {isLastPage ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <button
                  onClick={onSubmit}
                  disabled={submitting || !canSubmit}
                  style={{
                    ...btnPrimary,
                    backgroundColor: (submitting || !canSubmit) ? "#bdc1c6" : "#1e8e3e",
                    cursor: (submitting || !canSubmit) ? "not-allowed" : "pointer",
                    boxShadow: (submitting || !canSubmit) ? "none" : btnPrimary.boxShadow
                  }}
                >
                  {submitting ? "Submitting..." : "✓ Submit Assessment"}
                </button>
                {!canSubmit && (
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#d93025", fontWeight: "600" }}>
                    Please answer all {questions.length} questions to submit ({questions.length - totalAnswered} remaining)
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={goToNextSection}
                style={btnPrimary}
              >
                Next Section →
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Sticky Sidebar ── */}
        <div className="assessment-right-panel">
          <div style={{
            position: "sticky",
            top: "80px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            overflow: "hidden"
          }}>
            {/* Sidebar header */}
            <div style={{ backgroundColor: "#1a73e8", padding: "16px 18px" }}>
              <p style={{ margin: 0, color: "white", fontWeight: "700", fontSize: "14px" }}>Overall Progress</p>
              <p style={{ margin: "4px 0 0", color: "#aecbfa", fontSize: "12px" }}>
                {totalAnswered} answered · {totalSkipped} skipped · {totalUnanswered} remaining
              </p>
            </div>

            {/* Overall progress bar */}
            <div style={{ padding: "14px 18px 0" }}>
              <div style={{ backgroundColor: "#e0e0e0", borderRadius: "4px", height: "8px" }}>
                <div style={{
                  backgroundColor: "#1a73e8",
                  height: "8px",
                  borderRadius: "4px",
                  width: `${questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0}%`,
                  transition: "width 0.4s"
                }} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#5f6368", textAlign: "right" }}>
                {questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0}% complete
              </p>
            </div>

            {/* Legend */}
            <div style={{ padding: "10px 18px 14px", borderBottom: "1px solid #e0e0e0", display: "flex", flexDirection: "column", gap: "7px" }}>
              {[
                { color: "#1e8e3e", label: `Answered (${totalAnswered})` },
                { color: "#e37400", label: `Skipped (${totalSkipped})` },
                { color: "#e0e0e0", label: `Unanswered (${totalUnanswered})`, border: "1px solid #bdc1c6" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: l.color, border: l.border, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: "12px", color: "#3c4043" }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Skipped Questions Panel */}
            {totalSkipped > 0 && (
              <div style={{ padding: "12px 18px", borderBottom: "1px solid #e0e0e0", backgroundColor: "#fffbf5" }}>
                <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: "700", color: "#e37400", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>⚠</span> Skipped ({totalSkipped})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {questions.map((q, gi) => {
                    if (!skippedQuestions.has(q.id)) return null
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          onNavigate(gi)
                          topRef.current?.scrollIntoView({ behavior: "smooth" })
                        }}
                        title={`Go to Question ${gi + 1} (skipped)`}
                        style={{
                          width: "30px", height: "30px",
                          borderRadius: "6px",
                          border: "1.5px solid #e37400",
                          backgroundColor: "#fff3e0",
                          color: "#e37400",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "background 0.15s"
                        }}
                      >
                        {gi + 1}
                      </button>
                    )
                  })}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#a8630e", fontStyle: "italic" }}>
                  Click a number to go to that question
                </p>
              </div>
            )}

            {/* Section list */}
            <div style={{ padding: "12px 18px", maxHeight: "360px", overflowY: "auto" }}>
              <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "700", color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sections
              </p>
              {pageSummary.map((sec, pi) => {
                const isCurrent = pi === currentPage
                const done = sec.answered === sec.total
                return (
                  <button
                    key={pi}
                    onClick={() => {
                      onNavigate(pi * PAGE_SIZE)
                      topRef.current?.scrollIntoView({ behavior: "smooth" })
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 12px",
                      marginBottom: "4px",
                      borderRadius: "6px",
                      border: isCurrent ? "2px solid #1a73e8" : "2px solid transparent",
                      backgroundColor: isCurrent ? "#e8f0fe" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: isCurrent ? "700" : "500",
                        color: isCurrent ? "#1967d2" : "#3c4043",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        maxWidth: "160px"
                      }}>
                        {sec.name}
                      </span>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: done ? "#1e8e3e" : isCurrent ? "#1967d2" : "#9aa0a6",
                        flexShrink: 0,
                        marginLeft: "6px"
                      }}>
                        {sec.answered}/{sec.total}
                      </span>
                    </div>
                    {/* Mini progress */}
                    <div style={{ backgroundColor: "#e0e0e0", borderRadius: "2px", height: "3px", marginTop: "5px" }}>
                      <div style={{
                        backgroundColor: done ? "#1e8e3e" : "#1a73e8",
                        height: "3px",
                        borderRadius: "2px",
                        width: `${(sec.answered / sec.total) * 100}%`,
                        transition: "width 0.3s"
                      }} />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Submit button in sidebar for quick access */}
            <div style={{ padding: "12px 18px 16px", borderTop: "1px solid #e0e0e0" }}>
              <button
                onClick={onSubmit}
                disabled={submitting || !canSubmit}
                style={{
                  ...btnPrimary,
                  width: "100%",
                  backgroundColor: (submitting || !canSubmit) ? "#bdc1c6" : "#1e8e3e",
                  fontSize: "13px",
                  padding: "10px 14px",
                  cursor: (submitting || !canSubmit) ? "not-allowed" : "pointer",
                  boxShadow: (submitting || !canSubmit) ? "none" : btnPrimary.boxShadow
                }}
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
              </button>
              {!canSubmit && (
                <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#d93025", fontWeight: "600", textAlign: "center", lineHeight: "1.4" }}>
                  Please answer all questions to submit ({questions.length - totalAnswered} remaining)
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
      <ConfirmDialog
        open={showSkipConfirm}
        title="Skip Question"
        message={`Are you sure you want to skip this question? Skipped questions are scored as incorrect. You have ${skipsRemaining} skip${skipsRemaining === 1 ? "" : "s"} remaining.`}
        confirmLabel="Skip"
        variant="warning"
        onConfirm={() => {
          setShowSkipConfirm(false)
          if (pendingSkipIndex !== null) {
            onNavigate(pendingSkipIndex)
            setTimeout(onSkip, 50)
          }
          setPendingSkipIndex(null)
        }}
        onCancel={() => {
          setShowSkipConfirm(false)
          setPendingSkipIndex(null)
        }}
      />
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: "11px 28px",
  backgroundColor: "#1a73e8",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
}

const btnOutline: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "white",
  border: "1.5px solid #dadce0",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  color: "#3c4043"
}

const btnText: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "13px",
  fontWeight: "600",
  padding: "0",
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationStyle: "dotted"
}
