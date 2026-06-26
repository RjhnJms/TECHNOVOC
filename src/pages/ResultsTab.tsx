import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "../supabaseClient"
import { Search, Trash2, Eye } from "lucide-react"
import StudentDetailModal from "./StudentDetailModal"
import ConfirmDialog from "../components/ConfirmDialog"
import { SkeletonTableRows } from "../components/Skeleton"
import { getStartYear } from "../utils/schoolYear"


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

interface Props {
  schoolYearFilter: string
}

export default function ResultsTab({ schoolYearFilter }: Props) {
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
  const [studentCourses, setStudentCourses] = useState<Record<string, { preferred: string[]; recommended: string[] }>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: studentData }, { data: rankData }, { data: assessmentData }, { data: courseData }, { data: prefData }] = await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, lrn, school_year, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("rankings")
        .select("student_id, course_id, status, courses(course_name)"),
      supabase
        .from("assessments")
        .select("student_id, course_id, score, total_items"),
      supabase
        .from("courses")
        .select("id, course_name")
        .order("course_name"),
      supabase
        .from("student_course_preferences")
        .select("student_id, course_id, preference_order")
        .order("preference_order"),
    ])

    const courseMap = new Map((courseData || []).map(c => [c.id, c.course_name]))
    
    const prefsByStudent = new Map<string, string[]>()
    for (const p of prefData || []) {
      const list = prefsByStudent.get(p.student_id) || []
      list.push(p.course_id)
      prefsByStudent.set(p.student_id, list)
    }

    const scoresByStudent = new Map<string, { course_id: string; score: number; total_items: number }[]>()
    for (const a of assessmentData || []) {
      const list = scoresByStudent.get(a.student_id) || []
      list.push({ course_id: a.course_id, score: a.score, total_items: a.total_items })
      scoresByStudent.set(a.student_id, list)
    }

    const statusMap: Record<string, PlacementInfo> = {}
    const courseMapInfo: Record<string, { preferred: string[]; recommended: string[] }> = {}
    const takenStudentIds = new Set((assessmentData || []).map(a => a.student_id))

    for (const student of studentData || []) {
      const sId = student.id

      // 1. Calculate Preferred & Recommended lists
      const prefIds = prefsByStudent.get(sId) || []
      const scores = scoresByStudent.get(sId) || []
      const scoreByCourse = new Map(scores.map(s => [s.course_id, s]))

      // Passed preferred courses (score >= 6)
      const passedPreferredNames: string[] = []
      for (const pId of prefIds) {
        const s = scoreByCourse.get(pId)
        if (s && s.score >= 6) {
          const name = courseMap.get(pId)
          if (name) passedPreferredNames.push(name)
        }
      }

      // Recommended courses (highest scoring non-preferred courses)
      const nonPreferredScores = scores
        .filter(s => !prefIds.includes(s.course_id))
        .sort((a, b) => b.score - a.score)

      const recommendedNames: string[] = []
      const slotsToFill = 3 - passedPreferredNames.length
      for (let i = 0; i < slotsToFill && i < nonPreferredScores.length; i++) {
        const name = courseMap.get(nonPreferredScores[i].course_id)
        if (name) recommendedNames.push(name)
      }

      courseMapInfo[sId] = {
        preferred: passedPreferredNames,
        recommended: recommendedNames,
      }

      // 2. Placement status badge
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
    setStudentCourses(courseMapInfo)
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
      "Full Name,LRN,Preferred,Recommended,Enrolled Course",
      ...exportRows.map(
        s => {
          const pref = (studentCourses[s.id]?.preferred || []).join(" / ")
          const rec = (studentCourses[s.id]?.recommended || []).join(" / ")
          const enrolled = placementStatuses[s.id]?.label || ""
          return `"${s.full_name}","${s.lrn}","${pref}","${rec}","${enrolled}"`
        }
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

    const filterYearStart = schoolYearFilter !== "all" ? getStartYear(schoolYearFilter) : Infinity

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

        const studentYearStart = s.school_year ? getStartYear(s.school_year) : 0
        const matchesSchoolYear =
          schoolYearFilter === "all" ||
          studentYearStart <= filterYearStart

        return matchesSearch && matchesCourse && matchesSchoolYear
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
  }, [courseFilter, placementStatuses, sortBy, studentSearch, students, schoolYearFilter])

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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Full Name", "LRN", "Preferred", "Recommended", "Enrolled Course", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRows columns={6} rows={8} />
            </tbody>
          </table>
        ) : filteredStudents.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No students found</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Full Name", "LRN", "Preferred", "Recommended", "Enrolled Course", "Actions"].map(h => (
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
                  <td style={{ padding: "10px 12px" }}>
                    {studentCourses[s.id]?.preferred.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {studentCourses[s.id].preferred.map(name => (
                          <span key={name} style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>• {name}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {studentCourses[s.id]?.recommended.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {studentCourses[s.id].recommended.map(name => (
                          <span key={name} style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>• {name}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                    )}
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
