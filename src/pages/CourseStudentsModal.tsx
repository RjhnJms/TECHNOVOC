import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

interface Props {
  course: {
    id: string
    course_name: string
    capacity: number
  }
  onClose: () => void
}

interface StudentRanking {
  id: string
  score: number
  rank: number
  status: string
  students?: {
    full_name: string
    lrn: string
    phone_number: string
    school_year: string
  }
}

export default function CourseStudentsModal({ course, onClose }: Props) {
  const [students, setStudents] = useState<StudentRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "included" | "waitlist">("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("rankings")
        .select("*, students(full_name, lrn, phone_number, school_year)")
        .eq("course_id", course.id)
        .order("score", { ascending: false })
      setStudents(data || [])
      setLoading(false)
    }
    loadStudents()

    // Close on Escape
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [course.id, onClose])

  const filtered = students.filter(s => {
    const matchFilter = filter === "all" || s.status === filter
    const matchSearch =
      s.students?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.students?.lrn?.includes(search)
    return matchFilter && matchSearch
  })

  const included = students.filter(s => s.status === "included").length
  const waitlist = students.filter(s => s.status === "waitlist").length

  const exportCSV = () => {
    const csv = [
      "Rank,Full Name,LRN,School Year,Phone,Score,Status",
      ...filtered.map(s =>
        `${s.rank},${s.students?.full_name || ""},${s.students?.lrn || ""},${s.students?.school_year || ""},${s.students?.phone_number || ""},${s.score},${s.status}`
      )
    ].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `${course.course_name}-students.csv`
    a.click()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
    >
      <div style={{ backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "750px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, backgroundColor: "white", zIndex: 10, borderRadius: "16px 16px 0 0" }}>
          <div>
            <h2 style={{ fontWeight: "800", fontSize: "20px", margin: "0 0 4px" }}>
              {course.course_name} — Students
            </h2>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              Capacity: {course.capacity} slots &nbsp;•&nbsp;
              <span style={{ color: "#16a34a", fontWeight: "600" }}>{included} Enrolled</span> &nbsp;•&nbsp;
              <span style={{ color: "#f59e0b", fontWeight: "600" }}>{waitlist} Waitlist</span> &nbsp;•&nbsp;
              <span style={{ color: "#2563eb", fontWeight: "600" }}>{course.capacity - included} Available</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={exportCSV}
              style={{ padding: "8px 14px", backgroundColor: "#374151", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
            >
              ⬇ Export CSV
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: "20px 28px" }}>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Total", value: students.length, color: "#2563eb" },
              { label: "Enrolled", value: included, color: "#16a34a" },
              { label: "Waitlist", value: waitlist, color: "#f59e0b" },
              { label: "Available", value: course.capacity - included, color: "#7c3aed" },
            ].map(stat => (
              <div key={stat.label} style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "14px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 2px", color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Capacity Bar */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>Enrollment Progress</span>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>{included} / {course.capacity} ({Math.round((included / course.capacity) * 100)}%)</span>
            </div>
            <div style={{ backgroundColor: "#e5e7eb", borderRadius: "6px", height: "10px" }}>
              <div style={{
                backgroundColor: included / course.capacity >= 0.9 ? "#dc2626" : included / course.capacity >= 0.6 ? "#f59e0b" : "#16a34a",
                height: "10px", borderRadius: "6px",
                width: `${Math.min((included / course.capacity) * 100, 100)}%`,
                transition: "width 0.5s"
              }} />
            </div>
          </div>

          {/* Search + Filter */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <input
              placeholder="Search by name or LRN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: "200px", padding: "9px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none" }}
            />
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
                  {f === "all" ? `All (${students.length})` : f === "included" ? `Included (${included})` : `Waitlist (${waitlist})`}
                </button>
              ))}
            </div>
          </div>

          {/* Students Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "28px", margin: "0 0 8px" }}>Loading...</p>
              <p style={{ color: "#6b7280" }}>Loading students...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "32px", margin: "0 0 8px" }}>No Students</p>
              <p style={{ color: "#9ca3af", margin: 0 }}>No students found.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  {["Rank", "Full Name", "LRN", "School Year", "Score", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "9px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
                    <td style={{ padding: "10px 12px", fontWeight: "700" }}>
                      #{s.rank}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: "600" }}>{s.students?.full_name || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "#6b7280" }}>{s.students?.lrn || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "#6b7280" }}>{s.students?.school_year || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px", height: "6px", width: "60px" }}>
                          <div style={{ backgroundColor: s.score >= 5 ? "#16a34a" : "#f59e0b", height: "6px", borderRadius: "4px", width: `${Math.min((s.score / 10) * 100, 100)}%` }} />
                        </div>
                        <span style={{ fontWeight: "700", color: "#2563eb" }}>{s.score}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        backgroundColor: s.status === "included" ? "#dcfce7" : "#fef3c7",
                        color: s.status === "included" ? "#16a34a" : "#92400e",
                        padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600"
                      }}>
                        {s.status === "included" ? "Included" : "Waitlist"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}