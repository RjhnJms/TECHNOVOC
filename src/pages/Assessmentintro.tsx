interface Props {
  studentName: string
  alreadyTaken: boolean
  loading: boolean
  onStart: () => void
  onViewResults: () => void
  onLogout: () => void
  onChangePreferences?: () => void
  totalQuestions?: number
  preferredCourses?: string[]
  requireLabCode?: boolean
  labCode?: string
  onLabCodeChange?: (code: string) => void
  onVerifyLabCode?: () => void
  labCodeVerified?: boolean
  labCodeError?: string | null
  verifyingLabCode?: boolean
}

export default function AssessmentIntro({
  studentName, alreadyTaken, loading, onStart, onViewResults, onLogout,
  onChangePreferences, totalQuestions, preferredCourses = [],
  requireLabCode = false,
  labCode = "",
  onLabCodeChange,
  onVerifyLabCode,
  labCodeVerified = false,
  labCodeError = null,
  verifyingLabCode = false,
}: Props) {
  const canStart =
    !loading &&
    (!requireLabCode || labCodeVerified)
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", width: "100%" }}>

      {/* Header */}
      <div className="intro-header">
        <div>
          <h2 style={{ margin: 0, fontWeight: "700", fontSize: "18px" }}>TECHNO-VOC</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Welcome, {studentName}</p>
        </div>
        <button onClick={onLogout} style={btnOutline}>Logout</button>
      </div>

      <div className="intro-container">
        <div className="intro-card">

          <h2 style={{ fontWeight: "700", fontSize: "20px", margin: "0 0 8px" }}>TVE Strand Assessment</h2>
          <p style={{ color: "#6b7280", margin: "0 0 24px", fontSize: "14px" }}>
            This assessment will help determine which Technical-Vocational Education courses are most suitable for you
          </p>

          {/* Already Taken Notice */}
          {alreadyTaken && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
              <p style={{ color: "#991b1b", fontWeight: "600", margin: "0 0 4px" }}>Assessment Already Completed</p>
              <p style={{ color: "#991b1b", fontSize: "13px", margin: 0 }}>You have already finished taking this assessment. This exam is only allowed to be taken once.</p>
            </div>
          )}

          {/* Assessment Info */}
          <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <p style={{ fontWeight: "700", color: "#1d4ed8", margin: 0, fontSize: "15px" }}>Assessment Information</p>
              <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                ✨ Randomizer Active
              </span>
            </div>
            {[
              totalQuestions
                ? `Total Questions: ${totalQuestions} (10 per track across all TVE courses)`
                : "Total Questions: 110 (10 per track × 11 courses)",
              "Question pool: each track has 20 questions; your exam randomly selects 10 from that pool",
              "Anti-cheating: each student gets their own random 10 per track, plus shuffled answer options",
              "Passing Score: 6 out of 10 (60%) per track — score 6–10 is Passed, below 6 is Failed",
              "Top 3 recommendations: pass all 3 preferred courses (6+/10) to qualify on those; otherwise your 3 highest scores overall",
              "Time Limit: 60 minutes — the assessment auto-submits when time runs out",
              "Skips: You may skip up to 5 questions (skipped questions count as incorrect)",
              "Question Types: Pre-skilled and Aptitude",
              "Your 3 preferred courses determine qualification when you score 6+ on each of them",
            ].map((item, i) => (
              <p key={i} style={{ color: "#1e40af", fontSize: "14px", margin: "0 0 6px" }}>• {item}</p>
            ))}
          </div>

          {preferredCourses.length === 3 && !alreadyTaken && (
            <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "20px", marginBottom: "16px", border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ fontWeight: "700", color: "#15803d", margin: 0, fontSize: "15px" }}>Your Preferred Courses</p>
                {onChangePreferences && (
                  <button type="button" onClick={onChangePreferences} style={{ ...btnOutline, padding: "6px 12px", fontSize: "12px" }}>
                    Change
                  </button>
                )}
              </div>
              {preferredCourses.map((name, i) => (
                <p key={name} style={{ color: "#166534", fontSize: "14px", margin: "0 0 4px" }}>
                  #{i + 1} {name}
                </p>
              ))}
            </div>
          )}

          {requireLabCode && !alreadyTaken && (
            <div style={{ backgroundColor: "#f5f3ff", borderRadius: "12px", padding: "20px", marginBottom: "16px", border: "1px solid #ddd6fe" }}>
              <p style={{ fontWeight: "700", color: "#5b21b6", margin: "0 0 8px", fontSize: "15px" }}>Laboratory Batch Code</p>
              <p style={{ color: "#6d28d9", fontSize: "13px", margin: "0 0 14px", lineHeight: 1.5 }}>
                Enter the batch code given to your group in the computer laboratory. The same code can be used by multiple students in your batch.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={labCode}
                  onChange={e => onLabCodeChange?.(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD34"
                  maxLength={12}
                  disabled={labCodeVerified}
                  style={{
                    flex: "1 1 200px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: labCodeError ? "1px solid #f87171" : "1px solid #c4b5fd",
                    fontSize: "16px",
                    fontFamily: "monospace",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    boxSizing: "border-box",
                    outline: "none",
                    backgroundColor: labCodeVerified ? "#ede9fe" : "white",
                  }}
                />
                {!labCodeVerified && (
                  <button
                    type="button"
                    onClick={onVerifyLabCode}
                    disabled={verifyingLabCode || !labCode.trim()}
                    style={{ ...btnDark, padding: "12px 20px", opacity: verifyingLabCode || !labCode.trim() ? 0.6 : 1 }}
                  >
                    {verifyingLabCode ? "Verifying..." : "Verify code"}
                  </button>
                )}
              </div>
              {labCodeError && (
                <p style={{ color: "#b91c1c", fontSize: "13px", margin: "10px 0 0" }}>{labCodeError}</p>
              )}
              {labCodeVerified && (
                <p style={{ color: "#15803d", fontSize: "13px", margin: "10px 0 0", fontWeight: "600" }}>
                  Code verified. You may start the assessment.
                </p>
              )}
            </div>
          )}

          {/* Before You Start */}
          <div style={{ backgroundColor: "#fffbeb", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <p style={{ fontWeight: "700", color: "#92400e", margin: "0 0 12px", fontSize: "15px" }}>Before You Start</p>
            {[
              "Read each question carefully",
              "Choose the best answer from the options provided",
              "You can navigate between questions using Previous/Next or the question grid",
              "Use Skip Question only when needed — you have a maximum of 5 skips",
              "Watch the timer in the header; unanswered questions are scored as incorrect",
              "Select your 3 preferred courses before starting (if you have not already)",
              "You will receive top 3 course recommendations based on your assessment score",
              ...(requireLabCode ? ["A laboratory batch access code is required before you can start"] : []),
            ].map((item, i) => (
              <p key={i} style={{ color: "#92400e", fontSize: "14px", margin: "0 0 6px" }}>• {item}</p>
            ))}
          </div>

          {alreadyTaken ? (
            <button
              onClick={onViewResults}
              style={{ ...btnDark, backgroundColor: "#2563eb", width: "100%", padding: "16px", fontSize: "16px" }}
            >
              View Assessment Results
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={!canStart}
              style={{
                ...btnDark,
                width: "100%",
                padding: "16px",
                fontSize: "16px",
                opacity: canStart ? 1 : 0.55,
                cursor: canStart ? "pointer" : "not-allowed",
              }}
            >
              {loading
                ? "Loading Questions..."
                : requireLabCode && !labCodeVerified
                  ? "Verify laboratory code to start"
                  : "Start Assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const btnDark: React.CSSProperties = { padding: "10px 24px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const btnOutline: React.CSSProperties = { padding: "8px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }