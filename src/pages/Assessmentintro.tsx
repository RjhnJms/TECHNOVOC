interface Props {
  studentName: string
  alreadyTaken: boolean
  loading: boolean
  timerEnabled: boolean
  timerMinutes: number
  onToggleTimer: () => void
  onSelectMinutes: (min: number) => void
  onStart: () => void
  onLogout: () => void
}

export default function AssessmentIntro({
  studentName, alreadyTaken, loading,
  timerEnabled, timerMinutes,
  onToggleTimer, onSelectMinutes, onStart, onLogout
}: Props) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", width: "100%" }}>

      {/* Header */}
      <div style={{ backgroundColor: "white", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: "700", fontSize: "18px" }}>TECHNO-VOC</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Welcome, {studentName}</p>
        </div>
        <button onClick={onLogout} style={btnOutline}>Logout</button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "700px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>

          <h2 style={{ fontWeight: "700", fontSize: "20px", margin: "0 0 8px" }}>TVE Strand Assessment</h2>
          <p style={{ color: "#6b7280", margin: "0 0 24px", fontSize: "14px" }}>
            This assessment will help determine which Technical-Vocational Education courses are most suitable for you
          </p>

          {/* Already Taken Warning */}
          {alreadyTaken && (
            <div style={{ backgroundColor: "#fef9c3", border: "1px solid #fcd34d", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
              <p style={{ color: "#92400e", fontWeight: "600", margin: "0 0 4px" }}>Already Taken</p>
              <p style={{ color: "#92400e", fontSize: "13px", margin: 0 }}>You have already taken this assessment. You can retake it but results will be added again.</p>
            </div>
          )}

          {/* Assessment Info */}
          <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <p style={{ fontWeight: "700", color: "#1d4ed8", margin: "0 0 12px", fontSize: "15px" }}>Assessment Information</p>
            {[
              "Total Questions: 100",
              "Question Types: Pre-skilled and Aptitude",
              "Passing Score: 75% per course",
              "Available Courses: Automotive, Agriculture, ICT, Drafting, Beauty-care, Dressmaking, Carpentry, Food-tech, Electricity, Electronics, SMAW",
            ].map((item, i) => (
              <p key={i} style={{ color: "#1e40af", fontSize: "14px", margin: "0 0 6px" }}>• {item}</p>
            ))}
          </div>

          {/* Before You Start */}
          <div style={{ backgroundColor: "#fffbeb", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <p style={{ fontWeight: "700", color: "#92400e", margin: "0 0 12px", fontSize: "15px" }}>Before You Start</p>
            {[
              "Read each question carefully",
              "Choose the best answer from the options provided",
              "You can navigate between questions",
              "Make sure to answer all questions before submitting",
              "Courses with 75% or higher will be recommended to you",
            ].map((item, i) => (
              <p key={i} style={{ color: "#92400e", fontSize: "14px", margin: "0 0 6px" }}>• {item}</p>
            ))}
          </div>

          {/* Timer Settings */}
          <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "20px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <p style={{ fontWeight: "700", margin: "0 0 2px", fontSize: "14px" }}>Assessment Timer</p>
                <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>Set a time limit for the assessment</p>
              </div>
              {/* Toggle */}
              <div
                onClick={onToggleTimer}
                style={{ width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer", backgroundColor: timerEnabled ? "#2563eb" : "#d1d5db", position: "relative", transition: "background 0.2s" }}
              >
                <div style={{ position: "absolute", top: "3px", left: timerEnabled ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
            {timerEnabled && (
              <div style={{ display: "flex", gap: "8px" }}>
                {[30, 45, 60, 90, 120].map(min => (
                  <button
                    key={min}
                    onClick={() => onSelectMinutes(min)}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: "8px", border: timerMinutes === min ? "2px solid #2563eb" : "2px solid #e5e7eb", backgroundColor: timerMinutes === min ? "#eff6ff" : "white", color: timerMinutes === min ? "#2563eb" : "#374151", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onStart}
            disabled={loading}
            style={{ ...btnDark, width: "100%", padding: "16px", fontSize: "16px" }}
          >
            {loading ? "Loading Questions..." : "Start Assessment"}
          </button>
        </div>
      </div>
    </div>
  )
}

const btnDark: React.CSSProperties = { padding: "10px 24px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const btnOutline: React.CSSProperties = { padding: "8px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }