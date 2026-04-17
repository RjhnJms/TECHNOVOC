import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { printStudentResults } from "./printResults"

interface Props {
  student: {
    id: string
    full_name: string
    lrn: string
    school_year: string
    phone_number: string
    created_at: string
  }
  onClose: () => void
}

interface AssessmentResult {
  id: string
  score: number
  total_items: number
  passed: boolean
  taken_at: string
  courses?: { course_name: string }
}

interface RankingResult {
  id: string
  score: number
  rank: number
  status: string
  courses?: { course_name: string; capacity: number }
}

export default function StudentDetailModal({ student, onClose }: Props) {
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [rankings, setRankings] = useState<RankingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"scores" | "rankings">("scores")

  useEffect(() => {
    fetchResults()
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    const [aData, rData] = await Promise.all([
      supabase.from("assessments").select("*, courses(course_name)").eq("student_id", student.id).order("score", { ascending: false }),
      supabase.from("rankings").select("*, courses(course_name, capacity)").eq("student_id", student.id).order("score", { ascending: false }),
    ])
    setAssessments(aData.data || [])
    setRankings(rData.data || [])
    setLoading(false)
  }

  const totalScore = assessments.reduce((s, a) => s + a.score, 0)
  const totalItems = assessments.reduce((s, a) => s + a.total_items, 0)
  const overallPct = totalItems > 0 ? Math.round((totalScore / totalItems) * 100) : 0
  const passed = overallPct >= 50
  const top3 = rankings.slice(0, 3)
  const takenAt = assessments[0]?.taken_at
    ? new Date(assessments[0].taken_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "Not taken yet"

  const handlePrint = () => printStudentResults({
    studentName: student.full_name,
    studentLRN: student.lrn,
    schoolYear: student.school_year,
    takenAt,
    totalScore,
    totalItems,
    overallPercent: overallPct,
    passed,
    top3: top3.map(r => ({ course_name: r.courses?.course_name || "", score: r.score, status: r.status })),
    assessments: assessments.map(a => ({ course_name: a.courses?.course_name || "", score: a.score, total_items: a.total_items, passed: a.passed })),
    rankings: rankings.map(r => ({ course_name: r.courses?.course_name || "", score: r.score, rank: r.rank, status: r.status })),
  })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
    >
      <div style={{ backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <ModalHeader
          student={student}
          hasResults={assessments.length > 0}
          onPrint={handlePrint}
          onClose={onClose}
        />

        <div style={{ padding: "24px 28px" }}>
          {loading ? (
            <LoadingState />
          ) : assessments.length === 0 ? (
            <EmptyState name={student.full_name} />
          ) : (
            <>
              <ScoreBanner totalScore={totalScore} totalItems={totalItems} overallPct={overallPct} passed={passed} takenAt={takenAt} />
              <Top3Section top3={top3} />
              <TabSwitcher activeTab={activeTab} onSwitch={setActiveTab} />
              {activeTab === "scores"
                ? <ScoresTable assessments={assessments} totalScore={totalScore} totalItems={totalItems} overallPct={overallPct} passed={passed} />
                : <RankingsTable rankings={rankings} />
              }
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────

function ModalHeader({ student, hasResults, onPrint, onClose }: {
  student: Props["student"]
  hasResults: boolean
  onPrint: () => void
  onClose: () => void
}) {
  return (
    <div style={{ padding: "24px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, backgroundColor: "white", zIndex: 10, borderRadius: "16px 16px 0 0" }}>
      <div>
        <h2 style={{ fontWeight: "800", fontSize: "20px", margin: "0 0 4px" }}>{student.full_name}</h2>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#6b7280" }}>
          <span>LRN: <strong>{student.lrn}</strong></span>
          <span>SY: <strong>{student.school_year}</strong></span>
          <span>{student.phone_number}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {hasResults && (
          <button onClick={onPrint} style={btnPrint}>Print Results</button>
        )}
        <button onClick={onClose} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}>✕</button>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <p style={{ fontSize: "32px", margin: "0 0 8px" }}>⏳</p>
      <p style={{ color: "#6b7280" }}>Loading results...</p>
    </div>
  )
}

function EmptyState({ name }: { name: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📋</p>
      <h3 style={{ fontWeight: "700", margin: "0 0 8px" }}>No Assessment Taken</h3>
      <p style={{ color: "#6b7280", margin: 0 }}>{name} has not taken the TVE Strand Assessment yet.</p>
    </div>
  )
}

function ScoreBanner({ totalScore, totalItems, overallPct, passed, takenAt }: {
  totalScore: number; totalItems: number; overallPct: number; passed: boolean; takenAt: string
}) {
  return (
    <div style={{ backgroundColor: passed ? "#f0fdf4" : "#fef2f2", border: `2px solid ${passed ? "#16a34a" : "#dc2626"}`, borderRadius: "12px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontSize: "28px" }}>{passed ? "🎉" : "📚"}</span>
          <h3 style={{ fontWeight: "800", fontSize: "20px", margin: 0, color: passed ? "#15803d" : "#dc2626" }}>{passed ? "Passed" : "Failed"}</h3>
        </div>
        <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>Taken: {takenAt}</p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        {[
          { label: "Score", value: totalScore, color: "#2563eb" },
          { label: "Total", value: totalItems, color: "#6b7280" },
          { label: "Rate", value: `${overallPct}%`, color: passed ? "#16a34a" : "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", backgroundColor: "white", borderRadius: "10px", padding: "10px 16px", minWidth: "68px" }}>
            <p style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 2px", color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Top3Section({ top3 }: { top3: RankingResult[] }) {
  if (top3.length === 0) return null
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 12px" }}>Top 3 Course Recommendations</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {top3.map((r, i) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "10px", backgroundColor: i === 0 ? "#fffbeb" : "#f9fafb", border: `1px solid ${i === 0 ? "#fcd34d" : "#e5e7eb"}` }}>
            <span style={{ fontWeight: "800", fontSize: "16px", color: i === 0 ? "#d97706" : i === 1 ? "#6b7280" : "#b45309", minWidth: "28px" }}>#{i + 1}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: "700", margin: "0 0 6px" }}>{r.courses?.course_name}</p>
              <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px", height: "6px" }}>
                <div style={{ backgroundColor: i === 0 ? "#d97706" : "#2563eb", height: "6px", borderRadius: "4px", width: `${Math.min((r.score / 10) * 100, 100)}%` }} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontWeight: "700", color: "#2563eb", margin: "0 0 4px" }}>{r.score} pts</p>
              <span style={{ backgroundColor: r.status === "included" ? "#dcfce7" : "#fef3c7", color: r.status === "included" ? "#16a34a" : "#92400e", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
                {r.status === "included" ? "Included" : "Waitlist"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabSwitcher({ activeTab, onSwitch }: {
  activeTab: "scores" | "rankings"
  onSwitch: (tab: "scores" | "rankings") => void
}) {
  return (
    <div style={{ display: "flex", gap: "4px", marginBottom: "14px", backgroundColor: "#f3f4f6", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
      {(["scores", "rankings"] as const).map(tab => (
        <button key={tab} onClick={() => onSwitch(tab)} style={{ padding: "7px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", backgroundColor: activeTab === tab ? "white" : "transparent", color: activeTab === tab ? "#111827" : "#6b7280", boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
          {tab === "scores" ? "Score Breakdown" : "Rankings"}
        </button>
      ))}
    </div>
  )
}

function ScoresTable({ assessments, totalScore, totalItems, overallPct, passed }: {
  assessments: AssessmentResult[]
  totalScore: number
  totalItems: number
  overallPct: number
  passed: boolean
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
          {["Course", "Score", "Total", "Percentage", "Status"].map(h => (
            <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {assessments.map((a, i) => {
          const pct = Math.round((a.score / a.total_items) * 100)
          return (
            <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
              <td style={{ padding: "9px 12px", fontWeight: "500" }}>{a.courses?.course_name}</td>
              <td style={{ padding: "9px 12px", fontWeight: "700", color: "#2563eb" }}>{a.score}</td>
              <td style={{ padding: "9px 12px", color: "#6b7280" }}>{a.total_items}</td>
              <td style={{ padding: "9px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px", height: "6px", width: "70px" }}>
                    <div style={{ backgroundColor: pct >= 50 ? "#16a34a" : "#f59e0b", height: "6px", borderRadius: "4px", width: `${pct}%` }} />
                  </div>
                  <span style={{ fontWeight: "600", fontSize: "12px" }}>{pct}%</span>
                </div>
              </td>
              <td style={{ padding: "9px 12px" }}>
                <span style={{ backgroundColor: a.passed ? "#dcfce7" : "#fef2f2", color: a.passed ? "#16a34a" : "#dc2626", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                  {a.passed ? "Passed" : "Failed"}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr style={{ borderTop: "2px solid #e5e7eb", backgroundColor: "#f8fafc" }}>
          <td style={{ padding: "9px 12px", fontWeight: "700" }}>TOTAL</td>
          <td style={{ padding: "9px 12px", fontWeight: "800", color: "#2563eb" }}>{totalScore}</td>
          <td style={{ padding: "9px 12px", color: "#6b7280", fontWeight: "700" }}>{totalItems}</td>
          <td style={{ padding: "9px 12px", fontWeight: "700" }}>{overallPct}%</td>
          <td style={{ padding: "9px 12px" }}>
            <span style={{ backgroundColor: passed ? "#dcfce7" : "#fef2f2", color: passed ? "#16a34a" : "#dc2626", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
              {passed ? "Passed" : "Failed"}
            </span>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

function RankingsTable({ rankings }: { rankings: RankingResult[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
          {["Course", "Score", "Rank", "Capacity", "Status"].map(h => (
            <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rankings.map((r, i) => (
          <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
            <td style={{ padding: "9px 12px", fontWeight: "500" }}>{r.courses?.course_name}</td>
            <td style={{ padding: "9px 12px", fontWeight: "700", color: "#2563eb" }}>{r.score}</td>
            <td style={{ padding: "9px 12px", fontWeight: "700" }}>#{r.rank}</td>
            <td style={{ padding: "9px 12px", color: "#6b7280" }}>{r.courses?.capacity || 70} slots</td>
            <td style={{ padding: "9px 12px" }}>
              <span style={{ backgroundColor: r.status === "included" ? "#dcfce7" : "#fef3c7", color: r.status === "included" ? "#16a34a" : "#92400e", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                {r.status === "included" ? "Included" : "Waitlist"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const btnPrint: React.CSSProperties = { padding: "8px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }