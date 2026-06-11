import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { BookOpen, HelpCircle, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react"
import CourseQuestionsModal from "./CourseQuestionsModal"
import {
  QUESTION_POOL_SIZE_PER_TRACK,
  QUESTIONS_DRAWN_PER_TRACK,
  isBankReady,
  countExamQuestions,
} from "../utils/examQuestions"

interface Course {
  id: string
  course_name: string
  capacity: number
}

interface CourseRow extends Course {
  questionCount: number
}

export default function CoursesTab() {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [questionsCourse, setQuestionsCourse] = useState<Course | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newCourseName, setNewCourseName] = useState("")
  const [newCourseCapacity, setNewCourseCapacity] = useState("70")
  const [addError, setAddError] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: courseData } = await supabase
      .from("courses")
      .select("id, course_name, capacity")
      .order("course_name")

    const { data: questionData } = await supabase
      .from("questions")
      .select("id, course_id")

    const countByCourse: Record<string, number> = {}
    ;(questionData || []).forEach(q => {
      countByCourse[q.course_id] = (countByCourse[q.course_id] || 0) + 1
    })

    setCourses((courseData || []).map(c => ({
      ...c,
      questionCount: countByCourse[c.id] || 0,
    })))
    setLoading(false)
  }

  const handleAddCourse = async () => {
    setAddError("")
    const name = newCourseName.trim()
    const capacity = parseInt(newCourseCapacity, 10)

    if (!name) {
      setAddError("Course name is required.")
      return
    }
    if (isNaN(capacity) || capacity < 1) {
      setAddError("Capacity must be at least 1.")
      return
    }

    const duplicate = courses.some(
      c => c.course_name.toLowerCase() === name.toLowerCase()
    )
    if (duplicate) {
      setAddError("A course with this name already exists.")
      return
    }

    setAdding(true)
    const { error } = await supabase.from("courses").insert([{ course_name: name, capacity }])
    setAdding(false)

    if (error) {
      setAddError(error.message)
      return
    }

    setNewCourseName("")
    setNewCourseCapacity("70")
    setShowAddModal(false)
    fetchData()
  }

  const handleDeleteCourse = async (course: CourseRow) => {
    const { count: assessmentCount } = await supabase
      .from("assessments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", course.id)

    if ((assessmentCount || 0) > 0) {
      alert(`Cannot delete "${course.course_name}" because students already have assessment records for this course.`)
      return
    }

    if (!confirm(
      `Delete "${course.course_name}"?\n\nThis will also delete ${course.questionCount} question(s) linked to this course. This cannot be undone.`
    )) return

    setDeletingId(course.id)
    await supabase.from("questions").delete().eq("course_id", course.id)
    await supabase.from("rankings").delete().eq("course_id", course.id)
    await supabase.from("courses").delete().eq("id", course.id)
    setDeletingId(null)
    fetchData()
  }

  const filtered = courses.filter(c =>
    c.course_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px" }}>Course Management</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Maintain {QUESTION_POOL_SIZE_PER_TRACK} questions per track; each student&apos;s exam draws{" "}
            {QUESTIONS_DRAWN_PER_TRACK} at random from that pool ({countExamQuestions(courses.length)} items total)
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchData}
            style={{ padding: "10px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <RefreshCw size={16} />
              Refresh
            </span>
          </button>
          <button
            onClick={() => { setShowAddModal(true); setAddError("") }}
            style={{ padding: "10px 20px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Plus size={16} />
              Add Course
            </span>
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
        <input
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
            <Loader2 size={32} style={{ marginBottom: "8px" }} />
            <p>Loading courses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "48px 0" }}>
            {courses.length === 0 ? "No courses yet. Click Add Course to create one." : "No courses match your search."}
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                {["Course", "Question bank", "Exam draw", "Bank status", "Capacity", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((course, i) => (
                <tr key={course.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "14px 16px", fontWeight: "600" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <BookOpen size={16} color="#6b7280" />
                      {course.course_name}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#374151", fontWeight: "600" }}>
                    {course.questionCount}
                    <span style={{ color: "#9ca3af", fontWeight: "400", fontSize: "12px" }}>
                      {" "}/ {QUESTION_POOL_SIZE_PER_TRACK}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7280" }}>
                    {QUESTIONS_DRAWN_PER_TRACK} random / student
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      backgroundColor: isBankReady(course.questionCount) ? "#dcfce7" : "#fef2f2",
                      color: isBankReady(course.questionCount) ? "#16a34a" : "#dc2626",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}>
                      {isBankReady(course.questionCount) ? "Pool ready" : "Needs questions"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7280" }}>{course.capacity}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setQuestionsCourse(course)}
                        style={{ padding: "6px 14px", backgroundColor: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <HelpCircle size={14} />
                          Questions
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course)}
                        disabled={deletingId === course.id}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: deletingId === course.id ? "#f3f4f6" : "#fef2f2",
                          color: deletingId === course.id ? "#9ca3af" : "#dc2626",
                          border: "none", borderRadius: "6px",
                          cursor: deletingId === course.id ? "not-allowed" : "pointer",
                          fontSize: "13px", fontWeight: "600",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Trash2 size={14} />
                          {deletingId === course.id ? "Deleting..." : "Delete"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontWeight: "700", fontSize: "18px" }}>Add Course</h3>
              <button onClick={() => { setShowAddModal(false); setAddError("") }} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            {addError && (
              <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
                {addError}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Course Name</label>
              <input
                value={newCourseName}
                onChange={e => setNewCourseName(e.target.value)}
                placeholder="e.g. Automotive"
                style={{ ...inputStyle, marginTop: "6px" }}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Capacity (slots)</label>
              <input
                type="number"
                min={1}
                value={newCourseCapacity}
                onChange={e => setNewCourseCapacity(e.target.value)}
                style={{ ...inputStyle, marginTop: "6px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => { setShowAddModal(false); setAddError("") }} style={btnOutline}>Cancel</button>
              <button onClick={handleAddCourse} disabled={adding} style={btnDark}>
                {adding ? "Adding..." : "Add Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {questionsCourse && (
        <CourseQuestionsModal
          course={questionsCourse}
          onClose={() => setQuestionsCourse(null)}
          onChanged={fetchData}
        />
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", boxSizing: "border-box", outline: "none" }
const labelStyle: React.CSSProperties = { fontWeight: "600", fontSize: "14px", color: "#374151" }
const btnDark: React.CSSProperties = { padding: "10px 24px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }
const btnOutline: React.CSSProperties = { padding: "10px 24px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }
