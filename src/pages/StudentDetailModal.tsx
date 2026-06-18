import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { printStudentResults } from "./printResults"
import AssignCoursePanel from "../components/AssignCoursePanel"
import {
  computeTop3Recommendations,
  needsPlacementWaitlist,
  saveStudentRecommendations,
} from "../utils/studentRecommendations"
import { isPassingScore, QUESTIONS_PER_TRACK } from "../utils/trackRanking"

interface Props {
  student: {
    id: string
    full_name: string
    lrn: string
    school_year: string
    created_at: string
  }
  onClose: () => void
}

interface AssessmentResult {
  id: string
  course_id: string
  score: number
  total_items: number
  passed: boolean
  taken_at: string
  courses?: { course_name: string }
}

interface Course {
  id: string
  course_name: string
  capacity?: number
}

interface Top3BestScore {
  courseId: string
  score: number
  courseName: string
}

export default function StudentDetailModal({ student, onClose }: Props) {
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [preferredScores, setPreferredScores] = useState<AssessmentResult[]>([])
  const [preferredCourseIds, setPreferredCourseIds] = useState<string[]>([])
  const [rankings, setRankings] = useState<any[]>([])
  const [allPreferredPassed, setAllPreferredPassed] = useState(false)
  const [onPlacementWaitlist, setOnPlacementWaitlist] = useState(false)
  const [placementRankingId, setPlacementRankingId] = useState<string | null>(null)
  const [assignedCourseName, setAssignedCourseName] = useState<string | null>(null)
  const [autoPlacedCourseName, setAutoPlacedCourseName] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCountByCourse, setEnrolledCountByCourse] = useState<Record<string, number>>({})
  const [top3BestScores, setTop3BestScores] = useState<Top3BestScore[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
      setLoading(true)
      const [aData, pData, rData, cData, enrolledData] = await Promise.all([
        supabase
          .from("assessments")
          .select("*, courses(course_name)")
          .eq("student_id", student.id)
          .order("score", { ascending: false }),
        supabase
          .from("student_course_preferences")
          .select("course_id")
          .eq("student_id", student.id)
          .order("preference_order"),
        supabase
          .from("rankings")
          .select("*, courses(course_name, capacity)")
          .eq("student_id", student.id)
          .order("rank", { ascending: true }),
        supabase.from("courses").select("id, course_name, capacity").order("course_name"),
        supabase.from("rankings").select("course_id").eq("status", "included"),
      ])

      const rows = (aData.data || []) as AssessmentResult[]
      const prefIds = (pData.data || []).map(p => p.course_id)
      const courseRows = cData.data || []
      setAssessments(rows)
      setPreferredCourseIds(prefIds)
      setCourses(courseRows)

      const countMap: Record<string, number> = {}
      for (const r of enrolledData.data || []) {
        if (r.course_id) countMap[r.course_id] = (countMap[r.course_id] || 0) + 1
      }
      setEnrolledCountByCourse(countMap)

      const scoreInputs = rows.map(a => ({
        course_id: a.course_id,
        score: a.score,
        total_items: a.total_items,
      }))
      const needsPlacement = needsPlacementWaitlist(scoreInputs, prefIds)

      let rankRows = rData.data || []
      let placementRow = rankRows.find(r => r.status === "waitlist" && !r.course_id)

      if (needsPlacement && !placementRow) {
        await saveStudentRecommendations(student.id, scoreInputs, prefIds)
        const { data: refreshed } = await supabase
          .from("rankings")
          .select("*, courses(course_name, capacity)")
          .eq("student_id", student.id)
          .order("rank", { ascending: true })
        rankRows = refreshed || []
        placementRow = rankRows.find(r => r.status === "waitlist" && !r.course_id)
      }

      setPlacementRankingId(placementRow?.id ?? null)

      const manualAssign = rankRows.find(
        r =>
          r.status === "included" &&
          r.course_id &&
          !prefIds.includes(r.course_id)
      )
      if (manualAssign?.courses) {
        const c = manualAssign.courses as { course_name?: string }
        setAssignedCourseName(c.course_name ?? null)
      } else {
        setAssignedCourseName(null)
      }

      const autoPlaced = rankRows.find(
        r => r.status === "included" && r.course_id && prefIds.includes(r.course_id)
      )
      if (autoPlaced?.courses) {
        const c = autoPlaced.courses as { course_name?: string }
        setAutoPlacedCourseName(c.course_name ?? null)
      } else {
        setAutoPlacedCourseName(null)
      }

      const computed = computeTop3Recommendations(scoreInputs, prefIds)

      const passedAll = computed[0]?.fromPreferredCourses ?? false
      setAllPreferredPassed(passedAll)

      const scoreByCourse = new Map(rows.map(a => [a.course_id, a]))
      setPreferredScores(
        prefIds
          .map(id => scoreByCourse.get(id))
          .filter((a): a is AssessmentResult => !!a)
          .sort((a, b) => b.score - a.score)
      )

      const nameById = Object.fromEntries(courseRows.map(c => [c.id, c.course_name]))

      setTop3BestScores(
        rows
          .filter(a => !prefIds.includes(a.course_id))
          .map(a => ({
            courseId: a.course_id,
            score: a.score,
            courseName: a.courses?.course_name || nameById[a.course_id] || "Unknown",
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
      )

      if (rankRows.length > 0) {
        setRankings(rankRows.filter(r => !(r.status === "waitlist" && !r.course_id)))
      } else if (computed.length > 0) {
        const courseById = Object.fromEntries(courseRows.map(c => [c.id, c]))
        setRankings(computed.map((c, i) => ({
          id: `computed-${i}`,
          score: c.score,
          rank: c.rank,
          status: "recommended",
          courses: courseById[c.course_id]
            ? { course_name: courseById[c.course_id].course_name }
            : undefined,
        })))
      } else {
        setRankings([])
      }

      setOnPlacementWaitlist(needsPlacement && !manualAssign)
      setLoading(false)
  }

  useEffect(() => {
    void load()
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id])

  const takenAt = assessments[0]?.taken_at
    ? new Date(assessments[0].taken_at).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not taken yet"

  const handlePrint = () => {
    const totalScore = assessments.reduce((s, a) => s + a.score, 0)
    const totalItems = assessments.reduce((s, a) => s + a.total_items, 0)
    printStudentResults({
      studentName: student.full_name,
      studentLRN: student.lrn,
      schoolYear: student.school_year,
      takenAt,
      totalScore,
      totalItems,
      top3: rankings.map(r => ({
        course_name: r.courses?.course_name || "",
        score: r.score,
        total_items: assessments.find(a => a.courses?.course_name === r.courses?.course_name)?.total_items,
      })),
      assessments: assessments.map(a => ({
        course_name: a.courses?.course_name || "",
        score: a.score,
        total_items: a.total_items,
      })),
      rankings: rankings.map(r => ({
        course_name: r.courses?.course_name || "",
        score: r.score,
        rank: r.rank,
        status: r.status,
      })),
    })
  }

  return (
    <>
      <div
        onClick={e => {
          if (e.target === e.currentTarget) onClose()
        }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "640px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              padding: "24px 28px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                <h2 style={{ fontWeight: "800", fontSize: "20px", margin: 0 }}>
                  {student.full_name}
                </h2>
                {!loading && assessments.length > 0 && onPlacementWaitlist && !assignedCourseName && (
                  <span style={{ backgroundColor: "#f3e8ff", color: "#7c3aed", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                    Waitlist
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#6b7280" }}>
                <span>
                  LRN: <strong>{student.lrn}</strong>
                </span>
                <span>
                  SY: <strong>{student.school_year}</strong>
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {assessments.length > 0 && (
                <button onClick={handlePrint} style={btnPrint}>
                  Print
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ padding: "24px 28px" }}>
            {loading ? (
              <p style={{ textAlign: "center", color: "#6b7280", padding: "40px 0" }}>Loading...</p>
            ) : assessments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📋</p>
                <h3 style={{ fontWeight: "700", margin: "0 0 8px" }}>No Assessment Taken</h3>
                <p style={{ color: "#6b7280", margin: 0 }}>
                  {student.full_name} has not taken the assessment yet.
                </p>
              </div>
            ) : allPreferredPassed ? (
              <>
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "2px solid #16a34a",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "20px",
                  }}
                >
                  <p style={{ fontWeight: "800", color: "#15803d", margin: "0 0 4px", fontSize: "18px" }}>
                    Passed on all preferred courses
                  </p>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Taken: {takenAt}</p>
                </div>
                <p style={{ fontWeight: "700", margin: "0 0 12px" }}>Preferred course scores</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {preferredScores.map((a) => {
                    const passed = isPassingScore(a.score, a.total_items)
                    return (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 16px",
                          borderRadius: "10px",
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: "700" }}>
                            #{preferredCourseIds.indexOf(a.course_id) + 1} {a.courses?.course_name}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>
                            Preferred course
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontWeight: "800", fontSize: "20px", color: "#2563eb" }}>
                            {a.score} / {a.total_items || QUESTIONS_PER_TRACK}
                          </p>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              backgroundColor: passed ? "#dcfce7" : "#fef2f2",
                              color: passed ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {passed ? "Passed" : "Failed"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : onPlacementWaitlist ? (
              <div style={{ padding: "8px 0" }}>
                {assignedCourseName ? (
                  <div style={{ backgroundColor: "#f0fdf4", border: "2px solid #16a34a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                    <p style={{ fontWeight: "700", color: "#15803d", margin: "0 0 4px" }}>Assigned course</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{assignedCourseName}</p>
                  </div>
                ) : (
                  <>
                    <div style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                      <p style={{ fontWeight: "700", color: "#5b21b6", margin: "0 0 4px" }}>Pending placement</p>
                      <p style={{ color: "#6b7280", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                        This student did not pass (6+/10) on any of their 3 preferred courses and is on the waitlist.
                        Assign them to one of their top 3 highest-scoring tracks below.
                      </p>
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <p style={{ fontSize: "12px", fontWeight: "600", color: "#15803d", margin: "0 0 8px" }}>
                        Top 3 highest scores (assign here if slots available):
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                        {top3BestScores.map(({ courseId, score, courseName }, idx) => {
                          const enrolled = enrolledCountByCourse[courseId] || 0
                          const capacity = courses.find(c => c.id === courseId)?.capacity ?? 0
                          const slotsLeft = Math.max(0, capacity - enrolled)
                          const hasSlots = slotsLeft > 0
                          const isPreferred = preferredCourseIds.includes(courseId)
                          return (
                            <div
                              key={courseId}
                              style={{
                                backgroundColor: hasSlots ? "#f0fdf4" : "#fef2f2",
                                border: `1px solid ${hasSlots ? "#86efac" : "#fca5a5"}`,
                                borderRadius: "10px",
                                padding: "8px 14px",
                                minWidth: "140px",
                              }}
                            >
                              <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "13px" }}>
                                #{idx + 1} {courseName}
                              </p>
                              <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#2563eb", fontWeight: "700" }}>
                                Score: {score}/{QUESTIONS_PER_TRACK}
                              </p>
                              <p style={{ margin: 0, fontSize: "11px", color: hasSlots ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                {hasSlots ? `${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} available` : "Full — no slots"}
                              </p>
                              {isPreferred && (
                                <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#7c3aed", fontWeight: "600" }}>
                                  Was preferred (still assignable)
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <AssignCoursePanel
                        studentId={student.id}
                        studentName={student.full_name}
                        rankingId={placementRankingId}
                        preferredCourseIds={preferredCourseIds}
                        courses={courses}
                        examScoreByCourseId={Object.fromEntries(
                          assessments.map(a => [a.course_id, a.score])
                        )}
                        allowedCourseIds={top3BestScores.map(e => e.courseId)}
                        enrolledCountById={enrolledCountByCourse}
                        capacityById={Object.fromEntries(courses.map(c => [c.id, c.capacity ?? 0]))}
                        onAssigned={() => { void load() }}
                      />
                    </div>
                  </>
                )}
                <p style={{ fontWeight: "700", margin: "0 0 12px" }}>Preferred course scores</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {preferredScores.map((a) => {
                    const passed = isPassingScore(a.score, a.total_items)
                    return (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 16px",
                          borderRadius: "10px",
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: "700" }}>#{preferredCourseIds.indexOf(a.course_id) + 1} {a.courses?.course_name}</p>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            backgroundColor: passed ? "#dcfce7" : "#fef2f2",
                            color: passed ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {a.score}/{a.total_items || QUESTIONS_PER_TRACK} — {passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {autoPlacedCourseName && (
                  <div style={{ backgroundColor: "#eff6ff", border: "2px solid #2563eb", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                    <p style={{ fontWeight: "700", color: "#1d4ed8", margin: "0 0 4px" }}>Auto-placed course</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{autoPlacedCourseName}</p>
                    <p style={{ color: "#6b7280", fontSize: "13px", margin: "8px 0 0" }}>
                      Placed in their highest-scoring preferred course that passed.
                    </p>
                  </div>
                )}
                <p style={{ fontWeight: "700", margin: "0 0 12px" }}>Preferred course scores</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {preferredScores.map((a) => {
                    const passed = isPassingScore(a.score, a.total_items)
                    return (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 16px",
                          borderRadius: "10px",
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: "700" }}>#{preferredCourseIds.indexOf(a.course_id) + 1} {a.courses?.course_name}</p>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            backgroundColor: passed ? "#dcfce7" : "#fef2f2",
                            color: passed ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {a.score}/{a.total_items || QUESTIONS_PER_TRACK} — {passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  )
}

const btnPrint: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
}
