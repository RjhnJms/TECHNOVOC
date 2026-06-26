import { useState } from "react"
import { getChoiceLabel } from "../utils/studentRecommendations"

export interface CourseOption {
  id: string
  course_name: string
}

interface Props {
  studentName: string
  courses: CourseOption[]
  loading: boolean
  onConfirm: (courseIds: string[]) => void
  onLogout: () => void
}

export default function CoursePreferenceSelection({
  studentName, courses, loading, onConfirm, onLogout,
}: Props) {
  const [selected, setSelected] = useState<string[]>([])

  const toggleCourse = (courseId: string) => {
    setSelected(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId)
      }
      if (prev.length >= 3) return prev
      return [...prev, courseId]
    })
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    setSelected(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  const getCourseName = (id: string) =>
    courses.find(c => c.id === id)?.course_name ?? ""

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", width: "100%" }}>
      <div className="intro-header">
        <div>
          <h2 style={{ margin: 0, fontWeight: "700", fontSize: "18px" }}>TECHNO-VOC</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Welcome, {studentName}</p>
        </div>
        <button onClick={onLogout} style={btnOutline}>Logout</button>
      </div>

      <div className="intro-container">
        <div className="intro-card">
          <h2 style={{ fontWeight: "700", fontSize: "20px", margin: "0 0 8px" }}>Select Your 3 Preferred Courses</h2>
          <p style={{ color: "#6b7280", margin: "0 0 24px", fontSize: "14px", lineHeight: 1.5 }}>
            Choose exactly three courses in order: <strong>1st choice</strong>, then <strong>2nd choice</strong>, then <strong>3rd choice</strong>.
            If your scores tie, the system uses this order to decide your best match. You will take the full assessment after this step.
          </p>

          {selected.length > 0 && (
            <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid #bfdbfe" }}>
              <p style={{ fontWeight: "700", color: "#1d4ed8", margin: "0 0 12px", fontSize: "14px" }}>Your ranked choices</p>
              {selected.map((id, i) => (
                <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < selected.length - 1 ? "1px solid #dbeafe" : "none" }}>
                  <span style={{ fontSize: "14px", color: "#1e40af" }}>
                    <strong style={{ textTransform: "capitalize" }}>{getChoiceLabel(i)}</strong> — {getCourseName(id)}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {i > 0 && (
                      <button type="button" onClick={() => moveUp(i)} style={btnSmall}>↑</button>
                    )}
                    <button type="button" onClick={() => toggleCourse(id)} style={{ ...btnSmall, color: "#dc2626" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontWeight: "600", fontSize: "14px", margin: "0 0 12px", color: "#374151" }}>
            Available courses ({selected.length}/3 selected)
          </p>

          {loading ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "24px 0" }}>Loading courses...</p>
          ) : (
            <div className="courses-grid">
              {courses.map(course => {
                const isSelected = selected.includes(course.id)
                const rank = selected.indexOf(course.id) + 1
                const disabled = !isSelected && selected.length >= 3
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => !disabled && toggleCourse(course.id)}
                    disabled={disabled}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                      backgroundColor: isSelected ? "#eff6ff" : disabled ? "#f9fafb" : "white",
                      cursor: disabled ? "not-allowed" : "pointer",
                      textAlign: "left",
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontWeight: "600", fontSize: "14px", color: isSelected ? "#1d4ed8" : "#374151" }}>
                      {course.course_name}
                    </span>
                    {isSelected && (
                      <span style={{ display: "block", fontSize: "12px", color: "#2563eb", marginTop: "4px", fontWeight: "700", textTransform: "capitalize" }}>
                        {getChoiceLabel(rank - 1)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={() => onConfirm(selected)}
            disabled={selected.length !== 3 || loading}
            style={{
              ...btnDark,
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              opacity: selected.length === 3 && !loading ? 1 : 0.5,
              cursor: selected.length === 3 && !loading ? "pointer" : "not-allowed",
            }}
          >
            Continue to Assessment
          </button>
        </div>
      </div>
    </div>
  )
}

const btnDark: React.CSSProperties = { padding: "10px 24px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const btnOutline: React.CSSProperties = { padding: "8px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
const btnSmall: React.CSSProperties = { padding: "4px 10px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }
