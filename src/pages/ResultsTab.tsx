import { useState, useEffect, useCallback } from "react"
import { supabase } from "../supabaseClient"
import { Search, Trash2, Eye } from "lucide-react"
import StudentDetailModal from "./StudentDetailModal"
import ConfirmDialog from "../components/ConfirmDialog"

interface Student {
  id: string
  full_name: string
  lrn: string
  school_year: string
  created_at: string
}

export default function ResultsTab() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [studentSearch, setStudentSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ type: "delete" | "export"; student?: Student } | null>(null)
  const [placementStatuses, setPlacementStatuses] = useState<Record<string, { label: string; style: React.CSSProperties }>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: studentData }, { data: rankData }, { data: assessmentData }] = await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, lrn, school_year, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("rankings")
        .select("student_id, course_id, status, courses(course_name)"),
      supabase
        .from("assessments")
        .select("student_id")
    ])

    const takenStudentIds = new Set((assessmentData || []).map(a => a.student_id))
    const statusMap: Record<string, { label: string; style: React.CSSProperties }> = {}

    for (const student of studentData || []) {
      const sId = student.id
      if (!takenStudentIds.has(sId)) {
        statusMap[sId] = {
          label: "Not Taken",
          style: { backgroundColor: "#f3f4f6", color: "#6b7280" }
        }
        continue
      }

      const studentRanks = (rankData || []).filter(r => r.student_id === sId)
      const assigned = studentRanks.find(r => r.status === "included" && r.course_id)
      const waitlist = studentRanks.find(r => r.status === "waitlist" && !r.course_id)

      if (assigned) {
        const cName = (assigned.courses as { course_name?: string })?.course_name || "Assigned"
        statusMap[sId] = {
          label: cName,
          style: { backgroundColor: "#dcfce7", color: "#16a34a", fontWeight: "700" }
        }
      } else if (waitlist) {
        statusMap[sId] = {
          label: "Waitlist",
          style: { backgroundColor: "#f3e8ff", color: "#7c3aed", fontWeight: "700" }
        }
      } else {
        statusMap[sId] = {
          label: "Pending",
          style: { backgroundColor: "#fef3c7", color: "#d97706", fontWeight: "700" }
        }
      }
    }

    setStudents(studentData || [])
    setPlacementStatuses(statusMap)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteStudent = async (student: Student) => {
    setConfirmDialog(null)
    setDeletingId(student.id)
    await supabase.from("exam_access_code_redemptions").delete().eq("student_id", student.id)
    await supabase.from("student_course_preferences").delete().eq("student_id", student.id)
    await supabase.from("rankings").delete().eq("student_id", student.id)
    await supabase.from("assessments").delete().eq("student_id", student.id)
    await supabase.from("students").delete().eq("id", student.id)
    setDeletingId(null)
    if (selectedStudent?.id === student.id) setSelectedStudent(null)
    await fetchData()
  }

  const exportStudentsCSV = () => {
    const csv = [
      "Full Name,LRN,School Year,Registered",
      ...students.map(
        s => `${s.full_name},${s.lrn},${s.school_year},${new Date(s.created_at).toLocaleDateString()}`
      ),
    ].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "students.csv"
    a.click()
  }

  const filteredStudents = students.filter(
    s =>
      s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.lrn?.includes(studentSearch)
  )

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px" }}>Results & Students</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Manage student records and view course recommendations
          </p>
        </div>
      </div>

      {/* Student records */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>Student records</p>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              View assessment results or delete a student
            </p>
          </div>
          <button
            onClick={() => setConfirmDialog({ type: "export" })}
            style={{
              padding: "8px 16px",
              backgroundColor: "#374151",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
            }}
          >
            Export students CSV
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            placeholder="Search students by name or LRN..."
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No students found</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Full Name", "LRN", "School Year", "Registered", "Placement Status", "Actions"].map(h => (
                  <th
                    key={h}
                    style={{ textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: "600" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    backgroundColor: i % 2 === 0 ? "white" : "#f9fafb",
                  }}
                >
                  <td style={{ padding: "10px 12px", fontWeight: "500" }}>{s.full_name}</td>
                  <td style={{ padding: "10px 12px" }}>{s.lrn}</td>
                  <td style={{ padding: "10px 12px" }}>{s.school_year}</td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {placementStatuses[s.id] ? (
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          ...placementStatuses[s.id].style,
                        }}
                      >
                        {placementStatuses[s.id].label}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(s)}
                        style={actionBtn}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setConfirmDialog({ type: "delete", student: s }) }}
                        disabled={deletingId === s.id}
                        style={{
                          ...actionBtn,
                          backgroundColor: deletingId === s.id ? "#f3f4f6" : "#fef2f2",
                          color: deletingId === s.id ? "#9ca3af" : "#dc2626",
                        }}
                      >
                        <Trash2 size={14} />
                        {deletingId === s.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <p style={{ fontWeight: "700", color: "#1d4ed8", margin: "0 0 10px" }}>How recommendations work</p>
        <ul style={{ paddingLeft: "16px", color: "#1e40af", fontSize: "13px", lineHeight: "2", margin: 0 }}>
          <li>
            Each student selects <strong>3 preferred courses</strong> before the exam.
          </li>
          <li>
            Passing score per track: <strong>6 out of 10</strong>.
          </li>
          <li>
            If they pass on <strong>all 3 preferred courses</strong>, those become their top 3 —{" "}
            <strong>highest score = #1 recommendation</strong>.
          </li>
          <li>
            If they do <strong>not</strong> pass all 3 preferred courses, their top 3 are the{" "}
            <strong>highest-scoring courses</strong> from the full exam.
          </li>
          <li>
            Use <strong>View</strong> on a student to see preferred course scores or top 3 recommendations.
          </li>
        </ul>
      </div>

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => {
            setSelectedStudent(null)
            fetchData()
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDialog?.type === "delete" && !!confirmDialog.student}
        title="Delete Student"
        message={`Are you sure you want to delete "${confirmDialog?.student?.full_name}"? This will permanently remove their assessment results, rankings, and preferences. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => confirmDialog?.student && handleDeleteStudent(confirmDialog.student)}
        onCancel={() => setConfirmDialog(null)}
      />
      <ConfirmDialog
        open={confirmDialog?.type === "export"}
        title="Export Students CSV"
        message={`Export ${students.length} student record${students.length === 1 ? "" : "s"} to a CSV file?`}
        confirmLabel="Export"
        variant="export"
        onConfirm={() => { setConfirmDialog(null); exportStudentsCSV() }}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  )
}

const actionBtn: React.CSSProperties = {
  padding: "6px 12px",
  backgroundColor: "#f3f4f6",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
}
