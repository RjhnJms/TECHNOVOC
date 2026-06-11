import { useState } from "react"
import { assignPlacementCourse, buildAssignableCourseOptions } from "../utils/studentRecommendations"

interface Course {
  id: string
  course_name: string
}

interface Props {
  studentId: string
  studentName: string
  rankingId?: string | null
  preferredCourseIds: string[]
  courses: Course[]
  examScoreByCourseId: Record<string, number>
  allowedCourseIds?: string[]
  enrolledCountById?: Record<string, number>
  capacityById?: Record<string, number>
  onAssigned?: () => void
  compact?: boolean
}

export default function AssignCoursePanel({
  studentId,
  studentName,
  rankingId = null,
  preferredCourseIds,
  courses,
  examScoreByCourseId,
  allowedCourseIds,
  enrolledCountById,
  capacityById,
  onAssigned,
  compact = false,
}: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = buildAssignableCourseOptions(
    courses,
    preferredCourseIds,
    examScoreByCourseId,
    allowedCourseIds,
    enrolledCountById,
    capacityById
  )
  const assignableCount = options.filter(o => !o.disabled).length

  const handleAssign = async () => {
    if (!selectedCourseId) {
      setError("Please select a course first.")
      return
    }

    const courseName = courses.find(c => c.id === selectedCourseId)?.course_name ?? "this course"
    if (!confirm(`Assign ${studentName} to ${courseName}?`)) return

    setAssigning(true)
    setError(null)
    const result = await assignPlacementCourse(
      studentId,
      selectedCourseId,
      rankingId
    )
    setAssigning(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSelectedCourseId("")
    onAssigned?.()
  }

  return (
    <div
      style={{
        backgroundColor: "#faf5ff",
        border: "1px solid #c4b5fd",
        borderRadius: "12px",
        padding: compact ? "14px" : "18px",
      }}
    >
      <p style={{ fontWeight: "700", color: "#5b21b6", margin: "0 0 4px", fontSize: compact ? "14px" : "15px" }}>
        Assign to course
      </p>
      <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 12px", lineHeight: 1.45 }}>
        {allowedCourseIds
          ? "Choose from the student's top 3 highest-scoring courses. Full courses are disabled."
          : "Choose a track for this student. Their 3 preferred courses cannot be selected."}
      </p>

      {assignableCount === 0 ? (
        <p style={{ color: "#b91c1c", fontSize: "13px", margin: 0 }}>
          {options.length === 0 ? "No assignable courses available." : "All top-scoring courses are currently full."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: "10px", alignItems: compact ? "stretch" : "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={e => {
                setSelectedCourseId(e.target.value)
                setError(null)
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: error ? "1px solid #f87171" : "1px solid #d8b4fe",
                fontSize: "14px",
                backgroundColor: "white",
                boxSizing: "border-box",
              }}
            >
              <option value="">— Select a course —</option>
              {options.map(o => (
                <option key={o.id} value={o.id} disabled={o.disabled}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAssign}
            disabled={assigning || !selectedCourseId}
            style={{
              padding: "10px 20px",
              backgroundColor: "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: assigning || !selectedCourseId ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              opacity: assigning || !selectedCourseId ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {assigning ? "Assigning..." : "Assign student"}
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: "#b91c1c", fontSize: "13px", margin: "10px 0 0" }}>{error}</p>
      )}
    </div>
  )
}
