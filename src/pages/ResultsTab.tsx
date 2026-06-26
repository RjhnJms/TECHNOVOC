import { useState, useEffect, useCallback, useMemo } from "react"
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

interface Course {
  id: string
  course_name: string
}

interface PlacementInfo {
  label: string
  courseId: string | null
  status: "assigned" | "waitlist" | "pending" | "not_taken"
  style: React.CSSProperties
}

export default function ResultsTab() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [studentSearch, setStudentSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ type: "delete" | "export"; student?: Student } | null>(null)
  const [placementStatuses, setPlacementStatuses] = useState<Record<string, PlacementInfo>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: studentData }, { data: rankData }, { data: assessmentData }, { data: courseData }] = await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, lrn, school_year, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("rankings")
        .select("student_id, course_id, status, courses(course_name)"),
      supabase
        .from("assessments")
        .select("student_id"),
      supabase
        .from("courses")
        .select("id, course_name")
        .order("course_name"),
    ])

    const takenStudentIds = new Set((assessmentData || []).map(a => a.student_id))
    const statusMap: Record<string, PlacementInfo> = {}

    for (const student of studentData || []) {
      const sId = student.id
      if (!takenStudentIds.has(sId)) {
        statusMap[sId] = {
          label: "Not Taken",
          courseId: null,
          status: "not_taken",
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
          courseId: assigned.course_id,
          status: "assigned",
          style: { backgroundColor: "#dcfce7", color: "#16a34a", fontWeight: "700" }
        }
      } else if (waitlist) {
        statusMap[sId] = {
          label: "Waitlist",
          courseId: null,
          status: "waitlist",
          style: { backgroundColor: "#f3e8ff", color: "#7c3aed", fontWeight: "700" }
        }
      } else {
        statusMap[sId] = {
          label: "Pending",
          courseId: null,
          status: "pending",
          style: { backgroundColor: "#fef3c7", color: "#d97706", fontWeight: "700" }
        }
      }
    }

    setStudents(studentData || [])
    setCourses(courseData || [])
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
    const exportRows = filteredStudents
    const csv = [
      "Full Name,LRN,School Year,Registered,Enrolled Course",
      ...exportRows.map(
        s => `${s.full_name},${s.lrn},${s.school_year},${new Date(s.created_at).toLocaleDateString()},${placementStatuses[s.id]?.label || ""}`
      ),
    ].join("\n")
    const selectedCourse = courses.find(course => course.id === courseFilter)
    const filename = selectedCourse
      ? `${selectedCourse.course_name.replace(/\s+/g, "-")}-students.csv`
      : courseFilter === "unassigned"
        ? "unassigned-pending-students.csv"
        : "students-current-list.csv"
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = filename
    a.click()
  }

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase()
    return students
      .filter(s => {
        const placement = placementStatuses[s.id]
        const matchesSearch =
          s.full_name?.toLowerCase().includes(q) ||
          s.lrn?.includes(studentSearch)

        const matchesCourse =
          courseFilter === "all" ||
          (courseFilter === "unassigned" && placement?.status !== "assigned") ||
          placement?.courseId === courseFilter

        return matchesSearch && matchesCourse
      })
      .sort((a, b) => {
        const placementA = placementStatuses[a.id]?.label || ""
        const placementB = placementStatuses[b.id]?.label || ""
        switch (sortBy) {
          case "name_asc":
            return a.full_name.localeCompare(b.full_name)
          case "name_desc":
            return b.full_name.localeCompare(a.full_name)
          case "course_asc":
            return placementA.localeCompare(placementB) || a.full_name.localeCompare(b.full_name)
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case "newest":
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })
  }, [courseFilter, placementStatuses, sortBy, studentSearch, students])

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
            Export current list CSV
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
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
              style={{ ...inputStyle, paddingLeft: "36px" }}
            />
          </div>

          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            style={{ ...inputStyle, flex: "0 1 220px" }}
          >
            <option value="all">All tracks</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.course_name}</option>
            ))}
            <option value="unassigned">Unassigned / Pending</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ ...inputStyle, flex: "0 1 180px" }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="course_asc">Track A-Z</option>
          </select>
        </div>

        <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>
          Showing {filteredStudents.length} of {students.length} student{students.length === 1 ? "" : "s"}
        </p>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No students found</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Full Name", "LRN", "School Year", "Registered", "Enrolled Course", "Actions"].map(h => (
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
            If they pass on <strong>all 3 preferred courses</strong> (6+/10), those become their top 3 —{" "}
            <strong>highest score = #1</strong>, with ties broken by <strong>1st, 2nd, then 3rd choice</strong>.
          </li>
          <li>
            If they do <strong>not</strong> pass all 3 preferred courses, their top 3 are the{" "}
            <strong>highest-scoring courses outside their 3 choices</strong>.
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
        message={`Export ${filteredStudents.length} student record${filteredStudents.length === 1 ? "" : "s"} from the current filtered list to a CSV file?`}
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "white",
}
