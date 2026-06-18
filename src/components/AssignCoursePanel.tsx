import { useState } from "react"
import { assignPlacementCourse } from "../utils/studentRecommendations"
import ConfirmDialog from "./ConfirmDialog"
import { ChevronDown } from "lucide-react"

interface Course {
  id: string
  course_name: string
}

interface CustomSelectOption {
  value: string
  label: string
  score: number
  slotsLeft: number
  disabled?: boolean
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  hasError,
}: {
  value: string
  onChange: (val: string) => void
  options: CustomSelectOption[]
  placeholder: string
  hasError?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(o => o.value === value)

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: hasError ? "1px solid #f87171" : "1px solid #c4b5fd",
          backgroundColor: "white",
          color: "#374151",
          fontSize: "14px",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          outline: "none",
          fontWeight: "500",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
        onFocus={(e) => {
          if (!hasError) e.currentTarget.style.borderColor = "#a78bfa"
        }}
        onBlur={(e) => {
          if (!hasError) e.currentTarget.style.borderColor = "#c4b5fd"
          setTimeout(() => setIsOpen(false), 200)
        }}
      >
        <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
          {selectedOption
            ? `${selectedOption.label} (Score: ${selectedOption.score}/10, ${
                selectedOption.disabled ? "Full" : `${selectedOption.slotsLeft} slots`
              })`
            : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "#a78bfa",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e9d5ff",
            boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.08), 0 8px 10px -6px rgba(124, 58, 237, 0.08)",
            zIndex: 1000,
            maxHeight: "260px",
            overflowY: "auto",
            padding: "4px",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            const isDisabled = opt.disabled
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: isSelected ? "#f3e8ff" : "transparent",
                  color: isDisabled ? "#d1d5db" : isSelected ? "#6b21a8" : "#4b5563",
                  fontSize: "14px",
                  fontWeight: isSelected ? "600" : "400",
                  textAlign: "left",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isDisabled) {
                    e.currentTarget.style.backgroundColor = "#faf5ff"
                    e.currentTarget.style.color = "#6b21a8"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isDisabled) {
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.color = "#4b5563"
                  }
                }}
              >
                <span style={{ fontWeight: "600" }}>{opt.label}</span>
                <span style={{ fontSize: "12px", color: isDisabled ? "#d1d5db" : "#7c3aed", fontWeight: "500", marginLeft: "8px" }}>
                  Score: {opt.score}/10 · {isDisabled ? "Full" : `${opt.slotsLeft} slots`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
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
  const [showAssignConfirm, setShowAssignConfirm] = useState(false)

  const buildOption = (c: Course) => {
    const score = examScoreByCourseId[c.id] ?? 0
    const enrolled = enrolledCountById?.[c.id] ?? 0
    const capacity = capacityById?.[c.id] ?? 9999
    const slotsLeft = Math.max(0, capacity - enrolled)
    const isFull = slotsLeft === 0

    return {
      value: c.id,
      label: c.course_name,
      score,
      slotsLeft,
      disabled: isFull,
    }
  }

  const options = allowedCourseIds
    ? allowedCourseIds
        .map(id => courses.find(c => c.id === id))
        .filter((c): c is Course => !!c && !preferredCourseIds.includes(c.id))
        .map(buildOption)
    : courses
        .filter(c => !preferredCourseIds.includes(c.id))
        .map(buildOption)

  const assignableCount = options.filter(o => !o.disabled).length

  const handleAssignClick = () => {
    if (!selectedCourseId) {
      setError("Please select a course first.")
      return
    }
    setShowAssignConfirm(true)
  }

  const handleAssignConfirm = async () => {
    setShowAssignConfirm(false)

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
        Choose from the student's top recommended courses. Full courses are disabled.
      </p>

      {assignableCount === 0 ? (
        <p style={{ color: "#b91c1c", fontSize: "13px", margin: 0 }}>
          {options.length === 0
            ? "No assignable courses available."
            : "All recommended courses are currently full."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: compact ? "column" : "row", gap: "10px", alignItems: compact ? "stretch" : "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "6px" }}>
              Course
            </label>
            <CustomSelect
              value={selectedCourseId}
              onChange={val => {
                setSelectedCourseId(val)
                setError(null)
              }}
              options={options}
              placeholder="— Select a course —"
              hasError={!!error}
            />
          </div>
          <button
            type="button"
            onClick={handleAssignClick}
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
      <ConfirmDialog
        open={showAssignConfirm}
        title="Assign Student"
        message={`Are you sure you want to assign ${studentName} to ${courses.find(c => c.id === selectedCourseId)?.course_name ?? "this course"}?`}
        confirmLabel="Assign"
        variant="assign"
        onConfirm={handleAssignConfirm}
        onCancel={() => setShowAssignConfirm(false)}
      />
    </div>
  )
}
