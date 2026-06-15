import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import AssignCoursePanel from "../components/AssignCoursePanel"
import { Clock, Users, Search, RefreshCw, Loader2, TrendingUp } from "lucide-react"
import { QUESTIONS_PER_TRACK } from "../utils/trackRanking"
import ConfirmDialog from "../components/ConfirmDialog"

interface Student {
  id: string
  full_name: string
  lrn: string
  phone_number: string
  school_year: string
  created_at: string
}

interface Course {
  id: string
  course_name: string
  capacity: number
  enrolled?: number
}

interface WaitlistEntry {
  id: string
  student_id: string
  course_id: string | null
  score: number
  rank: number
  status: string
  school_year: string
  students: Student | null
  courses: Course | null
}

interface PreferredCourse {
  course_id: string
  course_name: string
  preference_order: number
}

interface PlacementEntry extends WaitlistEntry {
  preferredCourses: PreferredCourse[]
}

interface Props {
  onSelectStudent: (student: Student) => void
}

export default function WaitlistTab({ onSelectStudent }: Props) {
  const [placementWaitlist, setPlacementWaitlist] = useState<PlacementEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCountByCourse, setEnrolledCountByCourse] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [examScoresByStudent, setExamScoresByStudent] = useState<Record<string, Record<string, number>>>({})
  const [showExportConfirm, setShowExportConfirm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: rankData, error: rankError }, { data: courseData, error: courseError }, { data: enrolledData }] = await Promise.all([
        supabase
          .from("rankings")
          .select("*, students(*), courses(*)")
          .eq("status", "waitlist")
          .order("score", { ascending: false }),
        supabase
          .from("courses")
          .select("*")
          .order("course_name"),
        supabase
          .from("rankings")
          .select("course_id")
          .eq("status", "included"),
      ])

      if (rankError) throw rankError
      if (courseError) throw courseError

      // Build enrolled count per course
      const countMap: Record<string, number> = {}
      for (const r of enrolledData || []) {
        if (r.course_id) countMap[r.course_id] = (countMap[r.course_id] || 0) + 1
      }
      setEnrolledCountByCourse(countMap)

      // Only keep placement waitlist rows (waitlist + null course_id)
      const placementRows: WaitlistEntry[] = (rankData || [])
        .filter((r: { course_id: string | null; status: string }) => r.status === "waitlist" && !r.course_id)
        .map((r: {
          id: string
          student_id: string
          course_id: string | null
          score: number
          rank: number
          status: string
          school_year: string
          students: Student | null
          courses: Course | null
        }) => ({
          id: r.id,
          student_id: r.student_id,
          course_id: r.course_id,
          score: r.score,
          rank: r.rank,
          status: "placement_waitlist",
          school_year: r.school_year,
          students: r.students,
          courses: r.courses,
        }))

      const placementStudentIds = [...new Set(placementRows.map(r => r.student_id))]
      const prefsByStudent = new Map<string, PreferredCourse[]>()

      if (placementStudentIds.length > 0) {
        const [{ data: prefData }, { data: assessmentData }] = await Promise.all([
          supabase
            .from("student_course_preferences")
            .select("student_id, course_id, preference_order, courses(course_name)")
            .in("student_id", placementStudentIds)
            .order("preference_order"),
          supabase
            .from("assessments")
            .select("student_id, course_id, score")
            .in("student_id", placementStudentIds),
        ])

        for (const p of prefData || []) {
          const list = prefsByStudent.get(p.student_id) || []
          const course = p.courses as { course_name?: string } | null
          list.push({
            course_id: p.course_id,
            course_name: course?.course_name ?? "Unknown",
            preference_order: p.preference_order,
          })
          prefsByStudent.set(p.student_id, list)
        }

        const scoresByStudent: Record<string, Record<string, number>> = {}
        for (const a of assessmentData || []) {
          if (!scoresByStudent[a.student_id]) scoresByStudent[a.student_id] = {}
          scoresByStudent[a.student_id][a.course_id] = a.score
        }
        setExamScoresByStudent(scoresByStudent)
      } else {
        setExamScoresByStudent({})
      }

      setPlacementWaitlist(
        placementRows.map(r => ({
          ...r,
          preferredCourses: prefsByStudent.get(r.student_id) || [],
        }))
      )
      setCourses(courseData || [])
    } catch (err) {
      console.error("Error fetching waitlist data:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlacementWaitlist = placementWaitlist.filter(item => {
    const matchSearch =
      !searchQuery ||
      item.students?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.students?.lrn?.includes(searchQuery)
    return matchSearch
  })

  const uniqueStudentsCount = new Set(filteredPlacementWaitlist.map(w => w.student_id)).size

  const exportWaitlistCSV = () => {
    const csvHeaders = "Student Name,LRN,School Year,Preferred Courses,Best Score"
    const rows = filteredPlacementWaitlist.map(w => {
      const name = w.students?.full_name || ""
      const lrn = w.students?.lrn || ""
      const sy = w.students?.school_year || ""
      const prefs = w.preferredCourses.map(p => p.course_name).join("; ")
      return `"${name.replace(/"/g, '""')}","${lrn}","${sy}","${prefs.replace(/"/g, '""')}","${w.score}"`
    })

    const csvContent = [csvHeaders, ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `waitlist-export-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px" }}>Placement Waitlist</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Students awaiting manual placement after not passing their preferred courses
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{ padding: "10px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>
          <button
            onClick={() => setShowExportConfirm(true)}
            disabled={filteredPlacementWaitlist.length === 0}
            style={{ padding: "10px 16px", backgroundColor: "#374151", color: "white", border: "none", borderRadius: "8px", cursor: filteredPlacementWaitlist.length === 0 ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", opacity: filteredPlacementWaitlist.length === 0 ? 0.6 : 1 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" }}>
        {[
          { label: "Pending Placement", value: loading ? "—" : filteredPlacementWaitlist.length, icon: <Clock size={22} />, color: "#f59e0b", bg: "#fef3c7" },
          { label: "Unique Students", value: loading ? "—" : uniqueStudentsCount, icon: <Users size={22} />, color: "#2563eb", bg: "#eff6ff" },
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 4px" }}>{stat.label}</p>
              <h3 style={{ color: "#111827", fontSize: "22px", margin: 0, fontWeight: "800" }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              placeholder="Search by student name or LRN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {/* Placement waitlist — did not pass preferred courses */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <TrendingUp size={18} color="#5b21b6" />
          <p style={{ fontWeight: "700", margin: 0, fontSize: "16px", color: "#5b21b6" }}>
            Pending Placement ({filteredPlacementWaitlist.length})
          </p>
        </div>
        <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 16px" }}>
          These students did not pass (6+/10) on any of their 3 preferred courses. Their <strong>top 3 highest scores</strong> are shown to help you assign them to a suitable available track.
        </p>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>Loading...</p>
        ) : filteredPlacementWaitlist.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0", margin: 0 }}>
            No students awaiting placement.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredPlacementWaitlist.map((w, i) => {
              const preferredIds = w.preferredCourses.map(p => p.course_id)
              const scoreMap = examScoresByStudent[w.student_id] || {}

              // Compute top 3 highest-scoring courses
              const top3BestScores = Object.entries(scoreMap)
                .map(([courseId, score]) => ({
                  courseId,
                  score,
                  course: courses.find(c => c.id === courseId),
                }))
                .filter(e => e.course)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)

              return (
                <div
                  key={w.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#faf5ff" : "white",
                    border: "1px solid #e9d5ff",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  {/* Student header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                    <div>
                      <button
                        onClick={() => w.students && onSelectStudent(w.students)}
                        style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "700", padding: 0, textDecoration: "underline", fontSize: "15px" }}
                      >
                        {w.students?.full_name || "—"}
                      </button>
                      <span style={{ color: "#6b7280", fontSize: "13px", marginLeft: "10px" }}>LRN: {w.students?.lrn || "—"}</span>
                    </div>
                    <span style={{ backgroundColor: "#f3e8ff", color: "#7c3aed", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                      Pending Placement
                    </span>
                  </div>

                  {/* Preferred courses (blocked) */}
                  <div style={{ marginBottom: "14px" }}>
                    <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", margin: "0 0 6px" }}>❌ Preferred courses (failed — cannot assign):</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {w.preferredCourses.length > 0 ? w.preferredCourses.map(p => {
                        const score = scoreMap[p.course_id]
                        return (
                          <span
                            key={p.course_id}
                            style={{ backgroundColor: "#ede9fe", color: "#5b21b6", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}
                          >
                            #{p.preference_order} {p.course_name}{score !== undefined ? ` (${score}/${QUESTIONS_PER_TRACK})` : ""}
                          </span>
                        )
                      }) : <span style={{ color: "#9ca3af", fontSize: "12px" }}>No preferences set</span>}
                    </div>
                  </div>

                  {/* Top 3 best scoring courses */}
                  <div style={{ marginBottom: "14px" }}>
                    <p style={{ fontSize: "12px", fontWeight: "600", color: "#15803d", margin: "0 0 6px" }}>✅ Top 3 highest scores (admin can assign here if slots available):</p>
                    {top3BestScores.length === 0 ? (
                      <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>No exam data available.</p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {top3BestScores.map(({ courseId, score, course }, idx) => {
                          const enrolled = enrolledCountByCourse[courseId] || 0
                          const capacity = course?.capacity ?? 0
                          const slotsLeft = Math.max(0, capacity - enrolled)
                          const hasSlots = slotsLeft > 0
                          const isPreferred = preferredIds.includes(courseId)
                          return (
                            <div
                              key={courseId}
                              style={{
                                backgroundColor: hasSlots ? "#f0fdf4" : "#fef2f2",
                                border: `1px solid ${hasSlots ? "#86efac" : "#fca5a5"}`,
                                borderRadius: "10px",
                                padding: "8px 14px",
                                minWidth: "150px",
                              }}
                            >
                              <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "13px", color: "#111827" }}>
                                #{idx + 1} {course?.course_name}
                              </p>
                              <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#2563eb", fontWeight: "700" }}>
                                Score: {score}/{QUESTIONS_PER_TRACK}
                              </p>
                              <p style={{ margin: 0, fontSize: "11px", color: hasSlots ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                {hasSlots ? `${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} available` : "Full — no slots"}
                              </p>
                              {isPreferred && (
                                <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#7c3aed", fontWeight: "600" }}>⚠ Was preferred (still assignable)</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Assign panel — restricted to top 3 highest scoring courses */}
                  <AssignCoursePanel
                    studentId={w.student_id}
                    studentName={w.students?.full_name || "Student"}
                    rankingId={w.id}
                    preferredCourseIds={preferredIds}
                    courses={courses}
                    examScoreByCourseId={scoreMap}
                    allowedCourseIds={top3BestScores.map(e => e.courseId)}
                    enrolledCountById={enrolledCountByCourse}
                    capacityById={Object.fromEntries(courses.map(c => [c.id, c.capacity]))}
                    onAssigned={fetchData}
                    compact
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #c4b5fd", borderRadius: "12px", padding: "20px", marginTop: "16px" }}>
        <p style={{ fontWeight: "700", color: "#5b21b6", margin: "0 0 10px" }}>How placement works</p>
        <ul style={{ paddingLeft: "16px", color: "#6d28d9", fontSize: "13px", lineHeight: "2", margin: 0 }}>
          <li>
            <strong>Passed all 3 preferred courses:</strong> The system automatically places the student in all 3 preferred tracks.
          </li>
          <li>
            <strong>Passed 1 or 2 preferred courses:</strong> The system automatically places the student in the preferred course with the highest score.
          </li>
          <li>
            <strong>Passed 0 preferred courses:</strong> The student appears here for you to manually assign them to one of their top 3 highest-scoring tracks.
          </li>
        </ul>
      </div>
      <ConfirmDialog
        open={showExportConfirm}
        title="Export Waitlist CSV"
        message={`Export ${filteredPlacementWaitlist.length} student record${filteredPlacementWaitlist.length === 1 ? "" : "s"} on the placement waitlist to a CSV file?`}
        confirmLabel="Export"
        variant="export"
        onConfirm={() => {
          setShowExportConfirm(false)
          exportWaitlistCSV()
        }}
        onCancel={() => setShowExportConfirm(false)}
      />
    </div>
  )
}
