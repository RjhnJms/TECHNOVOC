import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { printStudentResults } from "./printResults"
import {
  getRankingStatusLabel,
  getRankingStatusStyle,
  getCompetencyLevel,
  QUESTIONS_PER_TRACK,
} from "../utils/trackRanking"
import { computeTop3Recommendations } from "../utils/studentRecommendations"

interface Props {
  studentId: string
  studentName: string
  onLogout: () => void
  onRetake: () => void
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

interface StudentInfo {
  lrn: string
  school_year: string
}

export default function StudentResults({ studentId, studentName, onLogout, onRetake }: Props) {
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [rankings, setRankings] = useState<RankingResult[]>([])
  const [assignedCourse, setAssignedCourse] = useState<RankingResult | null>(null)
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({ lrn: "", school_year: "" })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"scores" | "rankings">("scores")
  const [recommendationSource, setRecommendationSource] = useState<"preferred" | "fallback" | "placement_pending" | "assigned">("fallback")
  const [preferredCourseNames, setPreferredCourseNames] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [sData, aData, rData, pData] = await Promise.all([
        supabase.from("students").select("lrn, school_year").eq("id", studentId).single(),
        supabase.from("assessments").select("*, courses(course_name)").eq("student_id", studentId).order("score", { ascending: false }),
        supabase.from("rankings").select("*, courses(course_name, capacity)").eq("student_id", studentId).order("rank", { ascending: true }),
        supabase
          .from("student_course_preferences")
          .select("course_id, courses(course_name)")
          .eq("student_id", studentId)
          .order("preference_order"),
      ])
      if (sData.data) setStudentInfo(sData.data)
      const assessmentRows = aData.data || []
      setAssessments(assessmentRows)

      const preferredIds = (pData.data || []).map(p => p.course_id)
      const prefNames = (pData.data || []).map(p => {
        const c = p.courses as { course_name?: string } | null
        return c?.course_name ?? ""
      }).filter(Boolean)
      setPreferredCourseNames(prefNames)

      const computed = computeTop3Recommendations(
        assessmentRows.map(a => ({
          course_id: a.course_id,
          score: a.score,
          total_items: a.total_items,
        })),
        preferredIds
      )

      const placementPending = (rData.data || []).some(r => r.status === "waitlist" && !r.course_id)
      const assigned = (rData.data || []).find(r => r.status === "included" && r.course_id)
      setAssignedCourse(assigned ?? null)

      if (placementPending) {
        setRecommendationSource("placement_pending")
      } else if (assigned) {
        setRecommendationSource("assigned")
      } else {
        setRecommendationSource(computed[0]?.fromPreferredCourses ? "preferred" : "fallback")
      }

      const useComputed = !computed[0]?.fromPreferredCourses && !assigned

      if (useComputed) {
        if (computed.length > 0) {
          const { data: courses } = await supabase.from("courses").select("id, course_name, capacity")
          const courseById = Object.fromEntries((courses || []).map(c => [c.id, c]))
          setRankings(computed.map((c, i) => ({
            id: `computed-${i}`,
            score: c.score,
            rank: c.rank,
            status: "recommended",
            courses: courseById[c.course_id]
              ? { course_name: courseById[c.course_id].course_name, capacity: courseById[c.course_id].capacity }
              : undefined,
          })))
        } else {
          setRankings([])
        }
      } else {
        setRankings(rData.data || [])
      }
      setLoading(false)
    }
    load()
  }, [studentId])

  const top3: RankingResult[] = [...rankings]
    .filter(r => r.rank >= 1 && r.rank <= 3)
    .sort((a, b) => a.rank - b.rank)
  const totalScore = assessments.reduce((s, a) => s + a.score, 0)
  const totalItems = assessments.reduce((s, a) => s + a.total_items, 0)
  const takenAt = assessments[0]?.taken_at
    ? new Date(assessments[0].taken_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

  const handlePrint = () => printStudentResults({
    studentName,
    studentLRN: studentInfo.lrn,
    schoolYear: studentInfo.school_year,
    takenAt,
    totalScore,
    totalItems,
    top3: top3.map(r => ({
      course_name: r.courses?.course_name || "",
      score: r.score,
      total_items: assessments.find(a => a.courses?.course_name === r.courses?.course_name)?.total_items,
    })),
    assessments: assessments.map(a => ({ course_name: a.courses?.course_name || "", score: a.score, total_items: a.total_items })),
    rankings: rankings.map(r => ({
      course_name: r.courses?.course_name || "",
      score: r.score,
      rank: r.rank,
      status: r.status,
    })),
  })

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", width: "100%" }}>

      {/* Header */}
      <ResultsHeader
        studentName={studentName}
        onPrint={assessments.length > 0 ? handlePrint : undefined}
        onLogout={onLogout}
      />

      <div className="admin-content" style={{ maxWidth: "960px", margin: "0 auto" }}>
        {loading ? (
          <LoadingState />
        ) : assessments.length === 0 ? (
          <NoAssessmentState onStart={onRetake} />
        ) : (
          <>
            <ResultBanner
              totalScore={totalScore}
              totalItems={totalItems}
              takenAt={takenAt}
            />
            <Top3Courses
              top3={top3}
              assessments={assessments}
              recommendationSource={recommendationSource}
              preferredCourseNames={preferredCourseNames}
              assignedCourse={assignedCourse}
            />
            <ResultTabs
              activeTab={activeTab}
              onSwitch={setActiveTab}
              assessments={assessments}
              rankings={rankings}
              totalScore={totalScore}
              totalItems={totalItems}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────

function ResultsHeader({ studentName, onPrint, onLogout }: {
  studentName: string
  onPrint?: () => void
  onLogout: () => void
}) {
  return (
    <div className="intro-header">
      <div>
        <h2 style={{ margin: 0, fontWeight: "700", fontSize: "18px" }}>TECHNO-VOC</h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Welcome, {studentName}</p>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {onPrint && (
          <button onClick={onPrint} style={btnOutline}>
            🖨 Print Results
          </button>
        )}
        <button onClick={onLogout} style={btnOutline}>
          Logout
        </button>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <p style={{ fontSize: "40px", margin: "0 0 8px" }}>⏳</p>
      <p style={{ color: "#6b7280" }}>Loading your results...</p>
    </div>
  )
}

function NoAssessmentState({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "56px 48px", textAlign: "center", maxWidth: "480px", width: "100%", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: "52px", margin: "0 0 16px" }}>📋</p>
        <h3 style={{ fontWeight: "700", fontSize: "20px", margin: "0 0 10px" }}>No Assessment Yet</h3>
        <p style={{ color: "#6b7280", margin: "0 0 28px", lineHeight: "1.6" }}>
          You have not taken the TVE Strand Assessment yet. Take it now to find out which courses best match your skills!
        </p>
        <button onClick={onStart} style={{ ...btnDark, padding: "14px 36px", fontSize: "15px", width: "100%" }}>
          Start Assessment Now
        </button>
      </div>
    </div>
  )
}

function ResultBanner({ totalScore, totalItems, takenAt }: {
  totalScore: number; totalItems: number; takenAt: string
}) {
  return (
    <>
      <div className="result-banner-card">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <span style={{ fontSize: "36px" }}>🎉</span>
            <h2 style={{ fontWeight: "800", fontSize: "24px", margin: 0, color: "#15803d" }}>
              Assessment Complete
            </h2>
          </div>
          <p style={{ color: "#6b7280", margin: "0 0 4px" }}>
            Your results are shown below by course score.
          </p>
          <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>Taken: {takenAt}</p>
        </div>
        <div className="stats-container">
          {[
            { label: "Total Score", value: totalScore, color: "#2563eb" },
            { label: "Out of", value: totalItems, color: "#6b7280" },
            { label: "Overall", value: `${totalScore} / ${totalItems}`, color: "#16a34a" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center", backgroundColor: "white", borderRadius: "12px", padding: "14px 20px", minWidth: "80px" }}>
              <p style={{ fontSize: "26px", fontWeight: "800", margin: "0 0 2px", color: stat.color }}>{stat.value}</p>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

    </>
  )
}

function Top3Courses({
  top3, assessments, recommendationSource, preferredCourseNames, assignedCourse,
}: {
  top3: RankingResult[]
  assessments: AssessmentResult[]
  recommendationSource: "preferred" | "fallback" | "placement_pending" | "assigned"
  preferredCourseNames: string[]
  assignedCourse: RankingResult | null
}) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <h3 style={{ fontWeight: "700", fontSize: "17px", margin: "0 0 4px" }}>Your Course Placement & Recommendation</h3>
      <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>
        {recommendationSource === "preferred"
          ? "✅ You scored 6+/10 on all 3 preferred courses. Your top 3 recommendations are based on your preferred courses — #1 is your best match."
          : recommendationSource === "placement_pending"
            ? "⚠️ You did not score 6+/10 on all 3 preferred courses. An administrator will assign you to a suitable track."
            : recommendationSource === "assigned"
              ? "🏆 You have been successfully placed in a course track."
              : "📊 Your top 3 course recommendations are based on your highest scores across the full exam."}
      </p>

      {/* Assigned Placement Banner */}
      {recommendationSource === "assigned" && assignedCourse && (
        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <p style={{ fontWeight: "700", color: "#15803d", margin: "0 0 4px", fontSize: "14px" }}>🎉 Course Placement Assigned</p>
          <p style={{ color: "#374151", fontSize: "18px", fontWeight: "800", margin: "0 0 6px" }}>
            {assignedCourse.courses?.course_name}
          </p>
          <p style={{ color: "#16a34a", fontSize: "13px", margin: 0, fontWeight: "600" }}>
            You have been successfully placed in this track.
          </p>
        </div>
      )}
      {recommendationSource === "assigned" && !assignedCourse && (
        <p style={{ backgroundColor: "#f0fdf4", color: "#15803d", fontSize: "12px", padding: "8px 12px", borderRadius: "8px", margin: "0 0 16px", fontWeight: "600" }}>
          🎉 You have been assigned to your course placement based on your preferred choices and/or scores!
        </p>
      )}

      {/* Preferred Courses & Scores - Always show for visibility */}
      {preferredCourseNames.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px 16px" }}>
            <p style={{ fontWeight: "700", margin: "0 0 10px", fontSize: "13px", color: "#374151" }}>Your 3 Preferred Courses & Scores:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {preferredCourseNames.map((name, index) => {
                const assessment = assessments.find(a => a.courses?.course_name === name)
                const score = assessment?.score ?? 0
                const total = assessment?.total_items ?? QUESTIONS_PER_TRACK
                const passed = score >= 6
                return (
                  <div key={name} style={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#111827" }}>
                        #{index + 1} {name}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#6b7280" }}>Preferred course</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontWeight: "800", fontSize: "16px", color: "#2563eb" }}>
                        {score} / {total}
                      </p>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        backgroundColor: passed ? "#dcfce7" : "#fef2f2",
                        color: passed ? "#16a34a" : "#dc2626"
                      }}>
                        {passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Waitlist info (if applicable) */}
      {recommendationSource === "placement_pending" && (
        <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #c4b5fd", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <p style={{ fontWeight: "700", color: "#5b21b6", margin: "0 0 8px", fontSize: "14px" }}>On placement waitlist</p>
          <p style={{ color: "#7c3aed", fontSize: "13px", margin: 0, fontWeight: "600" }}>
            Please wait for your teacher to assign your final track.
          </p>
        </div>
      )}

      {/* Recommended list - Hide completely if system already placed the student */}
      {recommendationSource !== "assigned" && (
        <>
          {top3.length === 0 ? (
            <div style={{ backgroundColor: "#fef2f2", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
              <p style={{ fontSize: "32px", margin: "0 0 8px" }}>😔</p>
              <p style={{ fontWeight: "700", color: "#dc2626", margin: "0 0 6px", fontSize: "16px" }}>No Qualified Courses</p>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                No course recommendations found yet. Please complete the assessment first.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(recommendationSource === "placement_pending") && (
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#4b5563", margin: "4px 0 10px" }}>
                  💡 Here are your top 3 recommended courses based on your exam scores (excluding preferred courses):
                </p>
              )}
              {top3.map((r, i) => {
                const assessment = assessments.find(a => a.courses?.course_name === r.courses?.course_name)
                const total = assessment?.total_items ?? 0
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px", borderRadius: "12px", backgroundColor: i === 0 ? "#fffbeb" : i === 1 ? "#f8fafc" : "#f9fafb", border: `1px solid ${i === 0 ? "#fcd34d" : "#e5e7eb"}` }}>
                    <span style={{ fontWeight: "800", fontSize: "18px", color: i === 0 ? "#d97706" : i === 1 ? "#6b7280" : "#b45309", flexShrink: 0, minWidth: "32px" }}>
                      #{i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "700", margin: "0 0 4px", fontSize: "16px" }}>{r.courses?.course_name}</p>
                      <p style={{ fontSize: "14px", color: "#2563eb", fontWeight: "700", margin: "0 0 6px" }}>
                        Score: {r.score} / {total || QUESTIONS_PER_TRACK}
                      </p>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{
                          ...getRankingStatusStyle(r.status, r.score),
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}>
                          {getRankingStatusLabel(r.status, r.score)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ResultTabs({ activeTab, onSwitch, assessments, rankings, totalScore, totalItems }: {
  activeTab: "scores" | "rankings"
  onSwitch: (tab: "scores" | "rankings") => void
  assessments: AssessmentResult[]
  rankings: RankingResult[]
  totalScore: number
  totalItems: number
}) {
  return (
    <>
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", backgroundColor: "white", padding: "4px", borderRadius: "10px", border: "1px solid #e5e7eb", width: "fit-content" }}>
        {(["scores", "rankings"] as const).map(tab => (
          <button key={tab} onClick={() => onSwitch(tab)} style={{ padding: "9px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", backgroundColor: activeTab === tab ? "#111827" : "transparent", color: activeTab === tab ? "white" : "#6b7280" }}>
            {tab === "scores" ? "Score Breakdown" : "Your Top 3"}
          </button>
        ))}
      </div>

      {activeTab === "scores" ? (
        <ScoresTable assessments={assessments} totalScore={totalScore} totalItems={totalItems} />
      ) : (
        <RankingsTable rankings={rankings} />
      )}
    </>
  )
}

function ScoresTable({ assessments, totalScore, totalItems }: {
  assessments: AssessmentResult[]
  totalScore: number; totalItems: number
}) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <h3 style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 16px" }}>Score Breakdown by Course</h3>
      <div className="table-responsive">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              {["Course", "Score", "Out of", "Result"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assessments.map((a, i) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
                <td style={{ padding: "12px", fontWeight: "500" }}>{a.courses?.course_name}</td>
                <td style={{ padding: "12px", fontWeight: "700", color: "#2563eb" }}>{a.score}</td>
                <td style={{ padding: "12px", color: "#6b7280" }}>{a.total_items}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    backgroundColor: getCompetencyLevel(a.score, a.total_items) === "Passed" ? "#dcfce7" : "#fef2f2",
                    color: getCompetencyLevel(a.score, a.total_items) === "Passed" ? "#16a34a" : "#dc2626",
                    padding: "3px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}>
                    {getCompetencyLevel(a.score, a.total_items)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #e5e7eb", backgroundColor: "#f8fafc" }}>
              <td style={{ padding: "12px", fontWeight: "700" }}>OVERALL TOTAL</td>
              <td style={{ padding: "12px", fontWeight: "800", color: "#2563eb", fontSize: "16px" }}>{totalScore}</td>
              <td style={{ padding: "12px", fontWeight: "700", color: "#6b7280" }}>{totalItems}</td>
              <td style={{ padding: "12px" }} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function RankingsTable({ rankings }: { rankings: RankingResult[] }) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <h3 style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 16px" }}>Your Top 3 Recommendations</h3>
      <div className="table-responsive">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              {["Course", "Score", "Recommendation", "Result"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
                <td style={{ padding: "12px", fontWeight: "500" }}>{r.courses?.course_name}</td>
                <td style={{ padding: "12px", fontWeight: "700", color: "#2563eb" }}>
                  {r.score} / {QUESTIONS_PER_TRACK}
                </td>
                <td style={{ padding: "12px", fontWeight: "700" }}>#{r.rank}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    ...getRankingStatusStyle(r.status, r.score),
                    padding: "3px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}>
                    {getRankingStatusLabel(r.status, r.score)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const btnDark: React.CSSProperties = { padding: "10px 24px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const btnOutline: React.CSSProperties = { padding: "8px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
