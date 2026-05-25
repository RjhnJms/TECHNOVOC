interface Props {
  studentName: string
  alreadyTaken: boolean
  loading: boolean
  onStart: () => void
  onViewResults: () => void
  onLogout: () => void
  totalQuestions?: number
}

export default function AssessmentIntro({
  studentName, alreadyTaken, loading, onStart, onViewResults, onLogout, totalQuestions
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
              totalQuestions ? `Total Questions: ${totalQuestions} (Randomized subset)` : "Total Questions: 100",
              "Question Types: Pre-skilled and Aptitude",
              "Your scores will be used to recommend the top 3 most suitable courses for you",
              "Available Courses: Automotive, Agriculture, ICT, Drafting, Beauty-care, Dressmaking, Carpentry, Food-tech, Electricity, Electronics, SMAW",
              "Anti-Cheating Shuffling: Questions and options are randomized per student session",
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
              "You will receive top 3 course recommendations based on your overall performance",
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
              disabled={loading}
              style={{ ...btnDark, width: "100%", padding: "16px", fontSize: "16px" }}
            >
              {loading ? "Loading Questions..." : "Start Assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const btnDark: React.CSSProperties = { padding: "10px 24px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const btnOutline: React.CSSProperties = { padding: "8px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }