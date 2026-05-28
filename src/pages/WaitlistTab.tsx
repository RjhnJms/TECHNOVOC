import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { Clock, Users, BookOpen, Search, RefreshCw, Loader2 } from "lucide-react"

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
}

interface WaitlistEntry {
  id: string
  student_id: string
  course_id: string
  score: number
  rank: number
  status: string
  school_year: string
  students: Student | null
  courses: Course | null
}

interface Props {
  onSelectStudent: (student: Student) => void
}

export default function WaitlistTab({ onSelectStudent }: Props) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch waitlisted rankings
      const { data: rankData, error: rankError } = await supabase
        .from("rankings")
        .select("*, students(*), courses(*)")
        .eq("status", "waitlist")
        .order("score", { ascending: false })

      if (rankError) throw rankError

      // Fetch courses for the dropdown filter
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .order("course_name")

      if (courseError) throw courseError

      // Map raw response to type-safe representation
      const typedRankings: WaitlistEntry[] = (rankData || []).map((r: any) => ({
        id: r.id,
        student_id: r.student_id,
        course_id: r.course_id,
        score: r.score,
        rank: r.rank,
        status: r.status,
        school_year: r.school_year,
        students: r.students ? {
          id: r.students.id,
          full_name: r.students.full_name,
          lrn: r.students.lrn,
          phone_number: r.students.phone_number,
          school_year: r.students.school_year,
          created_at: r.students.created_at
        } : null,
        courses: r.courses ? {
          id: r.courses.id,
          course_name: r.courses.course_name,
          capacity: r.courses.capacity
        } : null
      }))

      setWaitlist(typedRankings)
      setCourses(courseData || [])
    } catch (err) {
      console.error("Error fetching waitlist data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMoveToIncluded = async (entry: WaitlistEntry) => {
    if (!confirm(`Are you sure you want to move ${entry.students?.full_name || "this student"} to "Qualified" status for the ${entry.courses?.course_name || "selected"} course?`)) return
    
    setActionLoadingId(entry.id)
    try {
      const { error } = await supabase
        .from("rankings")
        .update({ status: "included" })
        .eq("id", entry.id)

      if (error) throw error

      // Refresh waitlist
      await fetchData()
    } catch (err) {
      console.error("Error moving student to included:", err)
      alert("Failed to update status. Please try again.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filter waitlist entries
  const filteredWaitlist = waitlist.filter(item => {
    const matchCourse = selectedCourse === "all" || item.course_id === selectedCourse
    const matchSearch = 
      !searchQuery ||
      item.students?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.students?.lrn?.includes(searchQuery)
    return matchCourse && matchSearch
  })

  // Calculations for stats
  const totalWaitlistedCount = filteredWaitlist.length
  
  // Unique students count
  const uniqueStudentsCount = new Set(filteredWaitlist.map(w => w.student_id)).size

  // Find course with the most waitlisted students
  const waitlistCountByCourse: Record<string, number> = {}
  filteredWaitlist.forEach(w => {
    const courseName = w.courses?.course_name || "Unknown"
    waitlistCountByCourse[courseName] = (waitlistCountByCourse[courseName] || 0) + 1
  })

  let mostWaitlistedCourse = "None"
  let mostWaitlistedCount = 0
  Object.entries(waitlistCountByCourse).forEach(([course, count]) => {
    if (count > mostWaitlistedCount) {
      mostWaitlistedCourse = course
      mostWaitlistedCount = count
    }
  })

  // Export filtered waitlist to CSV
  const exportWaitlistCSV = () => {
    const csvHeaders = "Rank,Student Name,LRN,School Year,Course,Score,Phone Number,Registered Date"
    const csvRows = filteredWaitlist.map(w => {
      const rank = w.rank || ""
      const name = w.students?.full_name || ""
      const lrn = w.students?.lrn || ""
      const sy = w.students?.school_year || ""
      const course = w.courses?.course_name || ""
      const score = `${w.score}%`
      const phone = w.students?.phone_number || ""
      const date = w.students?.created_at ? new Date(w.students.created_at).toLocaleDateString() : ""
      return `"${rank}","${name.replace(/"/g, '""')}","${lrn}","${sy}","${course}","${score}","${phone}","${date}"`
    })

    const csvContent = [csvHeaders, ...csvRows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px" }}>Waitlisted Students</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>View and manage students currently placed on course waitlists</p>
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
            onClick={exportWaitlistCSV}
            disabled={filteredWaitlist.length === 0}
            style={{ padding: "10px 16px", backgroundColor: "#374151", color: "white", border: "none", borderRadius: "8px", cursor: filteredWaitlist.length === 0 ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", opacity: filteredWaitlist.length === 0 ? 0.6 : 1 }}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
        {[
          { label: "Total Waitlisted Entries", value: loading ? "—" : totalWaitlistedCount, icon: <Clock size={22} />, color: "#f59e0b", bg: "#fef3c7" },
          { label: "Unique Students Waitlisted", value: loading ? "—" : uniqueStudentsCount, icon: <Users size={22} />, color: "#2563eb", bg: "#eff6ff" },
          { label: "Most Over-Capacity Course", value: loading ? "—" : mostWaitlistedCount > 0 ? `${mostWaitlistedCourse} (${mostWaitlistedCount})` : "None", icon: <BookOpen size={22} />, color: "#7c3aed", bg: "#f5f3ff" }
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 4px" }}>{stat.label}</p>
              <h3 style={{ color: "#111827", fontSize: typeof stat.value === "string" && stat.value.length > 15 ? "16px" : "22px", margin: 0, fontWeight: "800" }}>
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
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
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", backgroundColor: "white", cursor: "pointer", outline: "none", minWidth: "180px" }}
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.course_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" }}>
        <p style={{ fontWeight: "600", margin: "0 0 4px", fontSize: "16px" }}>
          Waitlist Records ({filteredWaitlist.length})
        </p>
        <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 16px" }}>
          Showing {filteredWaitlist.length} of {waitlist.length} waitlisted entries
        </p>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>Loading waitlist records...</p>
        ) : filteredWaitlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: "32px", margin: "0 0 8px" }}>—</p>
            <p style={{ color: "#9ca3af", margin: 0 }}>No waitlisted students found.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Rank", "Student Name", "LRN", "Course", "Score", "Phone Number", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredWaitlist.map((w, i) => (
                <tr
                  key={w.id}
                  style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}
                >
                  {/* Rank in Course */}
                  <td style={{ padding: "12px", fontWeight: "700" }}>
                    #{w.rank}
                  </td>

                  {/* Student Name (Clickable) */}
                  <td style={{ padding: "12px", fontWeight: "500" }}>
                    <button
                      onClick={() => w.students && onSelectStudent(w.students)}
                      style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", padding: 0, textDecoration: "underline", textAlign: "left", fontSize: "14px" }}
                    >
                      {w.students?.full_name || "—"}
                    </button>
                  </td>

                  {/* LRN */}
                  <td style={{ padding: "12px", color: "#4b5563" }}>
                    {w.students?.lrn || "—"}
                  </td>

                  {/* Course Name */}
                  <td style={{ padding: "12px" }}>
                    <span style={{ backgroundColor: "#fef3c7", color: "#d97706", padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                      {w.courses?.course_name || "—"}
                    </span>
                  </td>

                  {/* Score */}
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px", height: "6px", width: "70px" }}>
                        <div style={{
                          backgroundColor: w.score >= 75 ? "#16a34a" : "#f59e0b",
                          height: "6px", borderRadius: "4px",
                          width: `${Math.min(w.score, 100)}%`
                        }} />
                      </div>
                      <span style={{ fontWeight: "700", color: "#111827" }}>{w.score}%</span>
                    </div>
                  </td>

                  {/* Phone Number */}
                  <td style={{ padding: "12px", color: "#6b7280" }}>
                    {w.students?.phone_number || "—"}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "12px" }}>
                    <button
                      onClick={() => handleMoveToIncluded(w)}
                      disabled={actionLoadingId === w.id}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f0fdf4",
                        color: "#16a34a",
                        border: "none",
                        borderRadius: "6px",
                        cursor: actionLoadingId === w.id ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {actionLoadingId === w.id ? <Loader2 size={12} className="animate-spin" /> : null}
                      Move to Qualified
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Card */}
      <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "12px", padding: "20px", marginTop: "16px" }}>
        <p style={{ fontWeight: "700", color: "#b45309", margin: "0 0 10px" }}>ℹ About the Waitlist</p>
        <ul style={{ paddingLeft: "16px", color: "#92400e", fontSize: "13px", lineHeight: "2", margin: 0 }}>
          <li>Students are automatically placed on the waitlist when course capacities are exceeded during assessment ranking.</li>
          <li>The admin can override the capacity by clicking "Move to Qualified", which will qualify the student in that course.</li>
          <li>Students on the waitlist can be contacted using their phone numbers listed above, or by using the SMS Tab.</li>
        </ul>
      </div>
    </div>
  )
}
