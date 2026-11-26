import { useState } from "react"
import { AlertCircle, UserCheck } from "lucide-react"
import { assignPlacementCourse } from "../utils/studentRecommendations"
import { isPassingScore, QUESTIONS_PER_TRACK } from "../utils/trackRanking"
import { CourseIcon } from "../utils/courseIcons"
import ConfirmDialog from "./ConfirmDialog"

interface Course {
  id: string
  course_name: string
}

interface Props {
  studentId: string
  studentName: string
  schoolYear: string
  adminName: string
  courses: Course[]
  examScoreByCourseId: Record<string, number>
  allowedCourseIds?: string[]
  enrolledCountById?: Record<string, number>
  capacityById?: Record<string, number>
  onAssigned?: () => void
}

/**
 * Manual placement for a waitlisted student. The candidate courses are listed as choices
 * (ranked by score) so the admin compares and selects in one place, then confirms.
 */
export default function AssignCoursePanel({
  studentId,
  studentName,
  schoolYear,
  adminName,
  courses,
  examScoreByCourseId,
  allowedCourseIds,
  enrolledCountById,
  capacityById,
  onAssigned,
}: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAssignConfirm, setShowAssignConfirm] = useState(false)

  const candidates = (allowedCourseIds
    ? allowedCourseIds.map(id => courses.find(c => c.id === id)).filter((c): c is Course => !!c)
    : courses
  ).map(c => {
    const score = examScoreByCourseId[c.id] ?? 0
    const capacity = capacityById?.[c.id] ?? 9999
    const slotsLeft = Math.max(0, capacity - (enrolledCountById?.[c.id] ?? 0))
    return { ...c, score, slotsLeft, isFull: slotsLeft === 0 }
  })

  const selected = candidates.find(c => c.id === selectedCourseId)
  const assignableCount = candidates.filter(c => !c.isFull).length

  const handleAssignConfirm = async () => {
    setShowAssignConfirm(false)
    setAssigning(true)
    setError(null)
    const result = await assignPlacementCourse(studentId, selectedCourseId, schoolYear, adminName)
    setAssigning(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSelectedCourseId("")
    onAssigned?.()
  }

  return (
    <section
      aria-labelledby="manual-placement-title"
      style={{
        backgroundColor: "#faf5ff",
        border: "1px solid #e9d5ff",
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <h3 id="manual-placement-title" style={{ fontSize: "16px", fontWeight: 800, color: "#4c1d95", margin: "0 0 4px" }}>
        Needs manual placement
      </h3>
      <p style={{ color: "#6b4f8f", fontSize: "13px", margin: "0 0 16px", lineHeight: 1.5, maxWidth: "60ch" }}>
        {studentName} didn&apos;t pass any preferred course, or the courses they passed are full.
        Choose one of their highest-scoring other courses that still has open slots.
      </p>

      {assignableCount === 0 ? (
        <div
          role="status"
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            backgroundColor: "white",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "12px 14px",
            color: "#991b1b",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>
            {candidates.length === 0
              ? "No course outside this student's preferred choices has open slots. Increase a course's capacity in Course Management to place them."
              : "All courses outside this student's preferred choices are full. Increase a course's capacity in Course Management to place them."}
          </span>
        </div>
      ) : (
        <>
          <div role="radiogroup" aria-labelledby="manual-placement-title" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {candidates.map((c, idx) => {
              const isSelected = c.id === selectedCourseId
              const passed = isPassingScore(c.score, QUESTIONS_PER_TRACK)
              return (
                <label
                  key={c.id}
                  className="placement-option"
                  data-selected={isSelected || undefined}
                  data-disabled={c.isFull || undefined}
                >
                  <input
                    type="radio"
                    name={`placement-${studentId}`}
                    value={c.id}
                    aria-label={`${c.course_name}, score ${c.score} out of ${QUESTIONS_PER_TRACK}, ${c.isFull ? "no slots left" : `${c.slotsLeft} slots open`}`}
                    checked={isSelected}
                    disabled={c.isFull || assigning}
                    onChange={() => {
                      setSelectedCourseId(c.id)
                      setError(null)
                    }}
                    className="placement-option-input"
                  />
                  <span className="placement-option-radio" aria-hidden="true" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#7c3aed", width: "22px", flexShrink: 0 }}>
                    #{idx + 1}
                  </span>
                  <CourseIcon courseName={c.course_name} size={15} circleSize={32} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 700, fontSize: "15px", color: "#111827" }}>
                      {c.course_name}
                    </span>
                    <span style={{ display: "block", fontSize: "12px", color: c.isFull ? "#9ca3af" : "#15803d", fontWeight: 600, marginTop: "1px" }}>
                      {c.isFull ? "No slots left" :`${c.slotsLeft} slot${c.slotsLeft === 1 ? "" : "s"} open`}
                    </span>
                  </span>
                  <span style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ display: "block", fontWeight: 800, fontSize: "17px", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                      {c.score}<span style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280" }}>/{QUESTIONS_PER_TRACK}</span>
                    </span>
                    <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: passed ? "#15803d" : "#b91c1c" }}>
                      {passed ? "Passed" : "Failed"}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "16px",
            }}
          >
            <p style={{ color: "#6b4f8f", fontSize: "12px", margin: 0, flex: "1 1 220px", lineHeight: 1.45 }}>
              Your name ({adminName}) and today&apos;s date are saved with this placement.
            </p>
            <button
              type="button"
              className="placement-assign-btn"
              onClick={() => setShowAssignConfirm(true)}
              disabled={assigning || !selected}
            >
              <UserCheck size={16} />
              {assigning ? "Placing…" : selected ? `Place in ${selected.course_name}` : "Choose a course"}
            </button>
          </div>
        </>
      )}

      {error && (
        <p role="alert" style={{ display: "flex", gap: "6px", alignItems: "center", color: "#b91c1c", fontSize: "13px", fontWeight: 600, margin: "12px 0 0" }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </p>
      )}

      <ConfirmDialog
        open={showAssignConfirm}
        title="Place student"
        message={`Place ${studentName} in ${selected?.course_name ?? "this course"} for ${schoolYear}? This uses one of the course's open slots.`}
        confirmLabel="Place student"
        variant="assign"
        onConfirm={handleAssignConfirm}
        onCancel={() => setShowAssignConfirm(false)}
      />
    </section>
  )
}
