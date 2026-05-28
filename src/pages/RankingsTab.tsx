import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { BookOpen, CheckCircle2, Clock, Loader2, RefreshCw, Users, Search } from "lucide-react"

interface RankingEntry {
  id: string
  student_id: string
  course_id: string
  score: number
  rank: number
  status: string
  school_year: string
  students?: { full_name: string; lrn: string; phone_number: string; school_year: string } | null
  courses?: { course_name: string; capacity: number } | null
}

interface Course {
  id: string
  course_name: string
  capacity: number
}

export default function RankingsTab() {
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "included" | "waitlist">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)

    // Fetch courses
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .order("course_name")
    
    const fetchedCourses = courseData || []
    setCourses(fetchedCourses)

    // Fetch rankings with student and course info
    const { data: rankData } = await supabase
      .from("rankings")
      .select("*, students(full_name, lrn, phone_number, school_year), courses(course_name, capacity)")
      .order("score", { ascending: false })
    
    const fetchedRankings = rankData || []
    setRankings(fetchedRankings)

    // Default to first course if none is selected
    if (fetchedCourses.length > 0 && !selectedCourse) {
      setSelectedCourse(fetchedCourses[0].id)
    }

    setLoading(false)
  }

  // Recalculate rankings per course based on score
  const recalculateRankings = async () => {
    if (!confirm("Recalculate all rankings based on current scores?")) return
    setLoading(true)

    for (const course of courses) {
      const courseRankings = rankings
        .filter(r => r.course_id === course.id)
        .sort((a, b) => b.score - a.score)

      for (let i = 0; i < courseRankings.length; i++) {
        const status = i < course.capacity ? "included" : "waitlist"
        await supabase
          .from("rankings")
          .update({ rank: i + 1, status })
          .eq("id", courseRankings[i].id)
      }
    }

    await fetchData()
  }

  // Export rankings of selected course as CSV
  const exportCSV = (courseId: string) => {
    const courseData = courses.find(c => c.id === courseId)
    if (!courseData) return

    const filtered = rankings.filter(r => r.course_id === courseId)

    const csv = [
      "Rank,Student Name,LRN,School Year,Score,Status,Phone",
      ...filtered.map(r =>
        `${r.rank},${r.students?.full_name || ""},${r.students?.lrn || ""},${r.students?.school_year || ""},${r.score},${r.status === "included" ? "Qualified" : "Waitlist"},${r.students?.phone_number || ""}`
      )
    ].join("\n")

    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `rankings-${courseData.course_name}.csv`
    a.click()
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse)
  const selectedCourseName = selectedCourseData?.course_name || "—"
  const capacity = selectedCourseData?.capacity || 70

  // Filter rankings for the active course
  const activeCourseRankings = rankings
    .filter(r => r.course_id === selectedCourse)
    .sort((a, b) => b.score - a.score)

  // Calculate stats for current course
  const enrolledCount = activeCourseRankings.filter(r => r.status === "included").length
  const waitlistCount = activeCourseRankings.filter(r => r.status === "waitlist").length
  const availableSlots = capacity - enrolledCount

  // Filter rankings by search query and tab filter
  const searchedAndFilteredRankings = activeCourseRankings.filter(r => {
    const matchFilter = filter === "all" || r.status === filter
    const matchSearch =
      !searchQuery ||
      r.students?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.students?.lrn?.includes(searchQuery)
    return matchFilter && matchSearch
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px" }}>Course Rankings & Enrolment</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>View and manage student course placements</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={recalculateRankings}
            disabled={loading}
            style={{ padding: "10px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Recalculate
          </button>
          <button
            onClick={() => exportCSV(selectedCourse)}
            disabled={loading || !selectedCourse}
            style={{ padding: "10px 16px", backgroundColor: "#374151", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Course Selector */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
        <p style={{ fontWeight: "600", margin: "0 0 4px" }}>Select Course</p>
        <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>Choose a technical-vocational course to view student rankings</p>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedCourse}
            onChange={e => {
              setSelectedCourse(e.target.value)
              setFilter("all")
              setSearchQuery("")
            }}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", backgroundColor: "white", cursor: "pointer", outline: "none" }}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.course_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Details Block */}
      {selectedCourse && (
        <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "24px 28px", marginBottom: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontWeight: "800", fontSize: "20px", margin: "0 0 4px" }}>
              {selectedCourseName} — Students
            </h3>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              Capacity: {capacity} slots &nbsp;•&nbsp;
              <span style={{ color: "#16a34a", fontWeight: "600" }}>{enrolledCount} Qualified</span> &nbsp;•&nbsp;
              <span style={{ color: "#f59e0b", fontWeight: "600" }}>{waitlistCount} Waitlist</span> &nbsp;•&nbsp;
              <span style={{ color: "#2563eb", fontWeight: "600" }}>{availableSlots} Available</span>
            </p>
          </div>

          {/* Stats Cards Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Total", value: activeCourseRankings.length, color: "#2563eb" },
              { label: "Qualified", value: enrolledCount, color: "#16a34a" },
              { label: "Waitlist", value: waitlistCount, color: "#f59e0b" },
              { label: "Available", value: availableSlots, color: "#7c3aed" },
            ].map(stat => (
              <div key={stat.label} style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "14px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 2px", color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Capacity Progress Bar */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>Enrollment Progress</span>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>{enrolledCount} / {capacity} ({Math.round((enrolledCount / capacity) * 100)}%)</span>
            </div>
            <div style={{ backgroundColor: "#e5e7eb", borderRadius: "6px", height: "10px" }}>
              <div style={{
                backgroundColor: enrolledCount / capacity >= 0.9 ? "#dc2626" : enrolledCount / capacity >= 0.6 ? "#f59e0b" : "#16a34a",
                height: "10px", borderRadius: "6px",
                width: `${Math.min((enrolledCount / capacity) * 100, 100)}%`,
                transition: "width 0.5s"
              }} />
            </div>
          </div>

          {/* Search + Filter tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                placeholder="Search by name or LRN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: "4px", backgroundColor: "#f3f4f6", padding: "4px", borderRadius: "8px" }}>
              {(["all", "included", "waitlist"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 14px", borderRadius: "6px", border: "none",
                    cursor: "pointer", fontWeight: "600", fontSize: "13px",
                    backgroundColor: filter === f ? "white" : "transparent",
                    color: filter === f
                      ? f === "included" ? "#16a34a" : f === "waitlist" ? "#f59e0b" : "#111827"
                      : "#6b7280",
                    boxShadow: filter === f ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    textTransform: "capitalize"
                  }}
                >
                  {f === "all" ? `All (${activeCourseRankings.length})` : f === "included" ? `Qualified (${enrolledCount})` : `Waitlist (${waitlistCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Rankings Table */}
          {searchedAndFilteredRankings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "32px", margin: "0 0 8px" }}>—</p>
              <p style={{ color: "#9ca3af", margin: 0 }}>No students found matching filters.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  {["Rank", "Full Name", "LRN", "School Year", "Score", "Status", "Action"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {searchedAndFilteredRankings.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
                    <td style={{ padding: "12px", fontWeight: "700" }}>
                      #{r.rank}
                    </td>
                    <td style={{ padding: "12px", fontWeight: "600" }}>
                      {r.students?.full_name || "—"}
                    </td>
                    <td style={{ padding: "12px", color: "#6b7280" }}>
                      {r.students?.lrn || "—"}
                    </td>
                    <td style={{ padding: "12px", color: "#6b7280" }}>
                      {r.students?.school_year || "—"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px", height: "6px", width: "80px" }}>
                          <div style={{
                            backgroundColor: r.score >= 75 ? "#16a34a" : "#f59e0b",
                            height: "6px", borderRadius: "4px",
                            width: `${Math.min(r.score, 100)}%`
                          }} />
                        </div>
                        <span style={{ fontWeight: "600" }}>{r.score}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        backgroundColor: r.status === "included" ? "#dcfce7" : "#fef3c7",
                        color: r.status === "included" ? "#16a34a" : "#92400e",
                        padding: "4px 12px", borderRadius: "20px",
                        fontSize: "12px", fontWeight: "600"
                      }}>
                        {r.status === "included" ? "Qualified" : "Waitlist"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={async () => {
                          const newStatus = r.status === "included" ? "waitlist" : "included"
                          await supabase.from("rankings").update({ status: newStatus }).eq("id", r.id)
                          fetchData()
                        }}
                        style={{
                          padding: "4px 12px",
                          backgroundColor: r.status === "included" ? "#fef2f2" : "#f0fdf4",
                          color: r.status === "included" ? "#dc2626" : "#16a34a",
                          border: "none", borderRadius: "6px",
                          cursor: "pointer", fontSize: "12px", fontWeight: "600"
                        }}
                      >
                        {r.status === "included" ? "Move to Waitlist" : "Move to Qualified"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Info / How Rankings Work */}
      <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "20px" }}>
        <p style={{ fontWeight: "700", color: "#1d4ed8", margin: "0 0 10px" }}>ℹ How Rankings Work</p>
        <ul style={{ paddingLeft: "16px", color: "#1e40af", fontSize: "13px", lineHeight: "2", margin: 0 }}>
          <li>Students are ranked by their performance score in each course</li>
          <li>Each course has a carrying capacity of 70 students</li>
          <li>Top-ranked students (up to capacity) are marked as <strong>Qualified</strong></li>
          <li>Students beyond capacity are placed on the <strong>Waitlist</strong></li>
          <li>Rankings are based on course-specific assessment scores</li>
          <li>Students receive top 3 course recommendations based on their overall performance</li>
          <li>Admin can manually move students between Qualified and Waitlist</li>
        </ul>
      </div>
    </div>
  )
}