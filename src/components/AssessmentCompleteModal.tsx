import { useEffect, useRef, useState } from "react"
import { CheckCircle } from "lucide-react"

interface Props {
  open: boolean
  studentName: string
  onContinue: () => void
}

export default function AssessmentCompleteModal({ open, studentName, onContinue }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setTimeout(() => btnRef.current?.focus(), 200)
      setTimeout(() => setShowConfetti(true), 100)
    } else {
      setShowConfetti(false)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        animation: "acmFadeIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          overflow: "hidden",
          animation: "acmSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
        }}
      >
        {/* Confetti decoration */}
        {showConfetti && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "160px", overflow: "hidden", pointerEvents: "none" }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  width: `${6 + Math.random() * 6}px`,
                  height: `${6 + Math.random() * 6}px`,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                  backgroundColor: [
                    "#1a73e8", "#1e8e3e", "#e37400", "#d93025",
                    "#a142f4", "#f9ab00", "#24c1e0", "#e8453c",
                  ][i % 8],
                  left: `${5 + (i / 24) * 90}%`,
                  top: "-10px",
                  opacity: 0,
                  animation: `acmConfettiFall ${1.2 + Math.random() * 0.8}s ${i * 0.06}s ease-out forwards`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
        )}

        {/* Top gradient accent */}
        <div
          style={{
            height: "6px",
            background: "linear-gradient(90deg, #1a73e8, #1e8e3e, #f9ab00, #e8453c)",
          }}
        />

        <div style={{ padding: "40px 32px 20px", textAlign: "center", position: "relative" }}>
          {/* Success icon with pulse animation */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              animation: "acmPulse 2s ease-in-out infinite",
              boxShadow: "0 4px 20px rgba(30, 142, 62, 0.2)",
            }}
          >
            <CheckCircle size={42} color="#1e8e3e" strokeWidth={2.2} />
          </div>

          <h2
            style={{
              fontWeight: "800",
              fontSize: "24px",
              margin: "0 0 8px",
              color: "#1a1a1a",
              letterSpacing: "-0.3px",
            }}
          >
            Assessment Complete! 🎉
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "#5f6368",
              margin: "0 0 6px",
              lineHeight: 1.6,
            }}
          >
            Congratulations, <strong style={{ color: "#1a1a1a" }}>{studentName}</strong>!
          </p>

          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              margin: "0 0 28px",
              lineHeight: 1.6,
            }}
          >
            Your assessment has been successfully submitted. You can now view your results and course recommendations.
          </p>

          {/* Info box */}
          <div
            style={{
              backgroundColor: "#e8f0fe",
              border: "1px solid #aecbfa",
              borderRadius: "12px",
              padding: "14px 18px",
              marginBottom: "28px",
              textAlign: "left",
            }}
          >
            <p style={{ margin: 0, fontSize: "13px", color: "#1967d2", fontWeight: "600", lineHeight: 1.5 }}>
              💡 Your scores will be used to determine your placement in the available tracks. Click below to see your detailed results.
            </p>
          </div>

          {/* Continue button */}
          <button
            ref={btnRef}
            onClick={onContinue}
            style={{
              width: "100%",
              padding: "14px 28px",
              backgroundColor: "#1e8e3e",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "16px",
              boxShadow: "0 4px 14px rgba(30, 142, 62, 0.35)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#15803d"
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(30, 142, 62, 0.4)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#1e8e3e"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(30, 142, 62, 0.35)"
            }}
          >
            View My Results →
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 32px",
            borderTop: "1px solid #f3f4f6",
            textAlign: "center",
            backgroundColor: "#fafafa",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
            TECHNO-VOC Assessment System
          </p>
        </div>
      </div>

      <style>{`
        @keyframes acmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes acmSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes acmPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(30, 142, 62, 0.2); }
          50% { box-shadow: 0 4px 30px rgba(30, 142, 62, 0.35); }
        }
        @keyframes acmConfettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(140px) rotate(720deg); }
        }
      `}</style>
    </div>
  )
}
