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

interface Props {
  studentName: string
  questions: Question[]
  currentIndex: number
  answers: Record<number, string>
  loading: boolean
  timeLeft: number
  timerEnabled: boolean
  onAnswer: (questionId: number, answer: string) => void
  onNext: () => void
  onPrev: () => void
  onNavigate: (index: number) => void
  onSubmit: () => void
  onExit: () => void
}

export default function AssessmentQuestion({
  studentName, questions, currentIndex, answers, loading,
  timeLeft, timerEnabled,
  onAnswer, onNext, onPrev, onNavigate, onSubmit, onExit
}: Props) {
  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0
  const answeredCount = Object.keys(answers).length
  const isWarning = timeLeft <= 300 && timeLeft > 0
  const isDanger = timeLeft <= 60 && timeLeft > 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const options = [
    { label: "Option A", value: currentQuestion?.option_a },
    { label: "Option B", value: currentQuestion?.option_b },
    { label: "Option C", value: currentQuestion?.option_c },
    { label: "Option D", value: currentQuestion?.option_d },
  ]

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", width: "100%" }}>

      {/* Header */}
      <div style={{ backgroundColor: "white", padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: "700", fontSize: "16px" }}>TECHNO-VOC Assessment</h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
            {studentName} — Question {currentIndex + 1} of {questions.length} — Answered: {answeredCount}/{questions.length}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Timer */}
          {timerEnabled && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: isDanger ? "#fef2f2" : isWarning ? "#fffbeb" : "#f0fdf4", border: `1px solid ${isDanger ? "#dc2626" : isWarning ? "#fcd34d" : "#16a34a"}`, borderRadius: "8px", padding: "6px 14px" }}>
              <span style={{ fontWeight: "800", fontSize: "18px", fontFamily: "monospace", color: isDanger ? "#dc2626" : isWarning ? "#92400e" : "#15803d", letterSpacing: "1px" }}>
                {formatTime(timeLeft)}
              </span>
              {isDanger && <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: "700" }}>Hurry!</span>}
              {isWarning && !isDanger && <span style={{ fontSize: "11px", color: "#92400e", fontWeight: "600" }}>Almost up!</span>}
            </div>
          )}
          <button onClick={onExit} style={btnOutline}>Exit</button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ backgroundColor: "#e5e7eb", height: "6px", width: "100%" }}>
        <div style={{ backgroundColor: "#2563eb", height: "6px", width: `${progress}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ width: "100%", maxWidth: "750px" }}>

          {/* Badges */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
              {currentQuestion?.courses?.course_name}
            </span>
            <span style={{ backgroundColor: currentQuestion?.type === "pre-skilled" ? "#ede9fe" : "#fef3c7", color: currentQuestion?.type === "pre-skilled" ? "#6d28d9" : "#92400e", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
              {currentQuestion?.type}
            </span>
          </div>

          {/* Question Card */}
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "32px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>Question {currentIndex + 1}</p>
            <h3 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 24px", lineHeight: "1.5" }}>
              {currentQuestion?.question_text}
            </h3>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {options.map(opt => {
                const isSelected = answers[currentQuestion?.id] === opt.label
                return (
                  <div
                    key={opt.label}
                    onClick={() => onAnswer(currentQuestion.id, opt.label)}
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "10px", cursor: "pointer", border: isSelected ? "2px solid #2563eb" : "2px solid #e5e7eb", backgroundColor: isSelected ? "#eff6ff" : "white", transition: "all 0.15s" }}
                  >
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? "#2563eb" : "#f3f4f6", color: isSelected ? "white" : "#374151", fontWeight: "700", fontSize: "13px" }}>
                      {opt.label.split(" ")[1]}
                    </div>
                    <span style={{ fontSize: "15px", color: isSelected ? "#1d4ed8" : "#374151", fontWeight: isSelected ? "600" : "400" }}>
                      {opt.value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button onClick={onPrev} disabled={currentIndex === 0} style={{ ...btnOutline, opacity: currentIndex === 0 ? 0.4 : 1 }}>
              Previous
            </button>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>{currentIndex + 1} / {questions.length}</span>
            {currentIndex < questions.length - 1 ? (
              <button onClick={onNext} style={btnDark}>Next</button>
            ) : (
              <button onClick={onSubmit} disabled={loading} style={{ ...btnDark, backgroundColor: "#16a34a" }}>
                {loading ? "Submitting..." : "Submit Assessment"}
              </button>
            )}
          </div>

          {/* Question Navigator */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontWeight: "600", fontSize: "13px", margin: "0 0 10px", color: "#374151" }}>Question Navigator</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => onNavigate(i)}
                  style={{ width: "32px", height: "32px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600", backgroundColor: currentIndex === i ? "#2563eb" : answers[q.id] ? "#16a34a" : "#f3f4f6", color: currentIndex === i || answers[q.id] ? "white" : "#374151" }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
              <span style={{ color: "#2563eb" }}>Current</span>
              <span style={{ color: "#16a34a" }}>Answered ({answeredCount})</span>
              <span>Unanswered ({questions.length - answeredCount})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const btnDark: React.CSSProperties = { padding: "10px 24px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const btnOutline: React.CSSProperties = { padding: "8px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }