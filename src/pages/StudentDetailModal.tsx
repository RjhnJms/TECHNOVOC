import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import AssignCoursePanel from "../components/AssignCoursePanel"
import {
  computeTop3Recommendations,
  getChoiceLabel,
  needsPlacementWaitlist,
  pickAutoPlacementCourse,
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
    const expectedAuto = pickAutoPlacementCourse(scoreInputs, prefIds)

    let rankRows = rData.data || []
    let placementRow = rankRows.find(r => r.status === "waitlist" && !r.course_id)

    const manualAssignBeforeSave = rankRows.find(
      r =>
        r.status === "included" &&
        r.course_id &&
        (needsPlacement || !prefIds.includes(r.course_id))
    )

    if (
      expectedAuto &&
      !needsPlacement &&
      !manualAssignBeforeSave &&
      !rankRows.some(r => r.status === "included" && r.course_id === expectedAuto.course_id)
    ) {
      await saveStudentRecommendations(student.id, scoreInputs, prefIds)
      const { data: refreshed } = await supabase
        .from("rankings")
        .select("*, courses(course_name, capacity)")
        .eq("student_id", student.id)
        .order("rank", { ascending: true })
      rankRows = refreshed || []
      placementRow = rankRows.find(r => r.status === "waitlist" && !r.course_id)
    } else if (needsPlacement && !placementRow) {
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
        (needsPlacement || !prefIds.includes(r.course_id))
    )
    if (manualAssign?.courses) {
      const c = manualAssign.courses as { course_name?: string }
      setAssignedCourseName(c.course_name ?? null)
    } else {
      setAssignedCourseName(null)
    }

    const autoPlaced = rankRows.find(
      r =>
        r.status === "included" &&
        r.course_id &&
        prefIds.includes(r.course_id) &&
        !needsPlacement
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
    )

    const nameById = Object.fromEntries(courseRows.map(c => [c.id, c.course_name]))

    setTop3BestScores(
      computeTop3Recommendations(scoreInputs, prefIds).map(c => ({
        courseId: c.course_id,
        score: c.score,
        courseName: nameById[c.course_id] || "Unknown",
      }))
    )



    setOnPlacementWaitlist(needsPlacement)
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

  const totalScore = assessments.reduce((sum, a) => sum + a.score, 0)
  const totalItems = assessments.reduce((sum, a) => sum + (a.total_items || QUESTIONS_PER_TRACK), 0)

  const printScoreBreakdown = () => {
    const rows = assessments
      .map(a => {
        const total = a.total_items || QUESTIONS_PER_TRACK
        const passed = isPassingScore(a.score, total)
        return `
          <tr>
            <td>${a.courses?.course_name || "Unknown course"}</td>
            <td><strong>${a.score} / ${total}</strong></td>
            <td class="${passed ? "passed" : "failed"}">${passed ? "Passed" : "Failed"}</td>
          </tr>
        `
      })
      .join("")

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Assessment Score Breakdown - ${student.full_name}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 32px; }
    .header { text-align: center; border-bottom: 3px solid #111827; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 4px; font-size: 24px; letter-spacing: 1px; }
    .header p { margin: 2px 0; color: #4b5563; font-size: 13px; }
    .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .info div { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
    .info span { color: #6b7280; }
    .info strong { text-align: right; }
    .summary { display: flex; justify-content: space-between; align-items: center; border: 2px solid #2563eb; background: #eff6ff; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
    .summary h2 { margin: 0; font-size: 18px; color: #1d4ed8; }
    .summary strong { font-size: 22px; color: #111827; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #111827; color: white; text-align: left; padding: 10px 12px; }
    td { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .passed { color: #16a34a; font-weight: 700; }
    .failed { color: #dc2626; font-weight: 700; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #6b7280; text-align: right; }
    @media print { body { padding: 16px; } @page { margin: 12mm; size: A4; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>TECHNO-VOC</h1>
    <p>Assessment Score Breakdown</p>
    <p>Northern Antique Vocational School - NAVS</p>
  </div>
  <div class="info">
    <div><span>Student Name</span><strong>${student.full_name}</strong></div>
    <div><span>LRN</span><strong>${student.lrn}</strong></div>
    <div><span>School Year</span><strong>${student.school_year}</strong></div>
    <div><span>Date Taken</span><strong>${takenAt}</strong></div>
  </div>
  <div class="summary">
    <h2>Total Assessment Score</h2>
    <strong>${totalScore} / ${totalItems}</strong>
  </div>
  <table>
    <thead>
      <tr><th>Course</th><th>Score</th><th>Status</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Generated by TECHNO-VOC Assessment System</div>
</body>
</html>
    `

    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) {
      alert("Please allow popups to print the score breakdown.")
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
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
              {!loading && assessments.length > 0 && (
                <button
                  onClick={printScoreBreakdown}
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "13px",
                  }}
                >
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
                          <p style={{ margin: 0, fontWeight: "700", textTransform: "capitalize" }}>
                            {getChoiceLabel(preferredCourseIds.indexOf(a.course_id))}: {a.courses?.course_name}
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
                    <p style={{ fontWeight: "700", color: "#15803d", margin: "0 0 4px" }}>Enrolled Course</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{assignedCourseName}</p>
                  </div>
                ) : (
                  <>
                    <div style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                      <p style={{ fontWeight: "700", color: "#5b21b6", margin: "0 0 4px" }}>Pending placement</p>
                      <p style={{ color: "#6b7280", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                        This student did not pass (6+/10) on any of their 3 preferred courses and is on the waitlist.
                        Assign them to one of their top 3 highest-scoring tracks outside their preferred choices.
                      </p>
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <p style={{ fontSize: "12px", fontWeight: "600", color: "#15803d", margin: "0 0 8px" }}>
                        Top 3 highest scores outside preferred choices (assign here if slots available):
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                        {top3BestScores.map(({ courseId, score, courseName }, idx) => {
                          const enrolled = enrolledCountByCourse[courseId] || 0
                          const capacity = courses.find(c => c.id === courseId)?.capacity ?? 0
                          const slotsLeft = Math.max(0, capacity - enrolled)
                          const hasSlots = slotsLeft > 0
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
                            </div>
                          )
                        })}
                      </div>
                      <AssignCoursePanel
                        studentId={student.id}
                        studentName={student.full_name}
                        rankingId={placementRankingId}
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
                        <p style={{ margin: 0, fontWeight: "700", textTransform: "capitalize" }}>
                          {getChoiceLabel(preferredCourseIds.indexOf(a.course_id))}: {a.courses?.course_name}
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
                          {a.score}/{a.total_items || QUESTIONS_PER_TRACK} — {passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {assignedCourseName && (
                  <div style={{ backgroundColor: "#f0fdf4", border: "2px solid #16a34a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                    <p style={{ fontWeight: "700", color: "#15803d", margin: "0 0 4px" }}>Enrolled Course</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{assignedCourseName}</p>
                  </div>
                )}
                {autoPlacedCourseName && (
                  <div style={{ backgroundColor: "#eff6ff", border: "2px solid #2563eb", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                    <p style={{ fontWeight: "700", color: "#1d4ed8", margin: "0 0 4px" }}>Auto-placed course</p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{autoPlacedCourseName}</p>
                    <p style={{ color: "#6b7280", fontSize: "13px", margin: "8px 0 0" }}>
                      Placed in their highest-priority passing preferred course (1st choice first, then 2nd, then 3rd — score does not override choice order).
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
                        <p style={{ margin: 0, fontWeight: "700", textTransform: "capitalize" }}>
                          {getChoiceLabel(preferredCourseIds.indexOf(a.course_id))}: {a.courses?.course_name}
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
                          {a.score}/{a.total_items || QUESTIONS_PER_TRACK} — {passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!loading && assessments.length > 0 && (
              <div style={{ marginTop: "22px", borderTop: "1px solid #e5e7eb", paddingTop: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontWeight: "800", margin: "0 0 4px", fontSize: "16px" }}>Assessment score breakdown</p>
                    <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                      All course scores from the completed assessment.
                    </p>
                  </div>
                  <div style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "8px 12px", fontWeight: "800", fontSize: "14px" }}>
                    Total: {totalScore} / {totalItems}
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "520px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                        {["Course", "Score", "Status"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: "700" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((a, i) => {
                        const total = a.total_items || QUESTIONS_PER_TRACK
                        const passed = isPassingScore(a.score, total)
                        return (
                          <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
                            <td style={{ padding: "10px 12px", fontWeight: "700" }}>{a.courses?.course_name || "Unknown course"}</td>
                            <td style={{ padding: "10px 12px", color: "#2563eb", fontWeight: "800" }}>{a.score} / {total}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{
                                backgroundColor: passed ? "#dcfce7" : "#fef2f2",
                                color: passed ? "#16a34a" : "#dc2626",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: "800",
                              }}>
                                {passed ? "Passed" : "Failed"}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  )
}
