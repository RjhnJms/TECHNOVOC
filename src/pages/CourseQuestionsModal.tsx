import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import EditQuestionModal from "./EditQuestionModal"
import {
  isPoolFull,
  poolSlotsRemaining,
  QUESTION_POOL_SIZE_PER_TRACK,
  QUESTIONS_DRAWN_PER_TRACK,
} from "../utils/examQuestions"

interface Course {
  id: string
  course_name: string
}

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  type: string
  course_id: string
  courses?: { course_name: string }
}

interface Props {
  course: Course
  onClose: () => void
  onChanged: () => void
}

const emptyQuestion = {
  question_text: "",
  type: "pre-skilled",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "Option A",
}

export default function CourseQuestionsModal({ course, onClose, onChanged }: Props) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [newQuestion, setNewQuestion] = useState(emptyQuestion)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)

  const fetchQuestions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("questions")
      .select("*, courses(course_name)")
      .eq("course_id", course.id)
      .order("id")
    setQuestions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchQuestions()
  }, [course.id])

  const handleAddQuestion = async () => {
    setError("")
    if (isPoolFull(questions.length)) {
      setError(`This course already has ${QUESTION_POOL_SIZE_PER_TRACK} questions (the maximum pool size).`)
      return
    }
    const { question_text, type, option_a, option_b, option_c, option_d, correct_answer } = newQuestion
    if (!question_text || !option_a || !option_b || !option_c || !option_d) {
      setError("Please fill in all fields.")
      return
    }

    setSaving(true)
    const { error: insertError } = await supabase.from("questions").insert([{
      question_text,
      course_id: course.id,
      type,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
    }])
    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNewQuestion(emptyQuestion)
    setShowAddForm(false)
    await fetchQuestions()
    onChanged()
  }

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("Delete this question?")) return
    await supabase.from("questions").delete().eq("id", id)
    await fetchQuestions()
    onChanged()
  }

  const handleDeleteAllQuestions = async () => {
    if (questions.length === 0) return
    if (
      !confirm(
        `Delete all ${questions.length} question(s) for ${course.course_name}?\n\nThis cannot be undone.`
      )
    ) {
      return
    }

    setDeletingAll(true)
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("course_id", course.id)

    setDeletingAll(false)

    if (deleteError) {
      alert(`Could not delete questions: ${deleteError.message}`)
      return
    }

    setShowAddForm(false)
    setEditingQuestion(null)
    await fetchQuestions()
    onChanged()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px",
      }}
    >
      <div style={{
        backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "900px",
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: "700", fontSize: "18px" }}>{course.course_name} — Questions</h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "13px" }}>
              Pool: {questions.length} / {QUESTION_POOL_SIZE_PER_TRACK} questions — each student gets{" "}
              {QUESTIONS_DRAWN_PER_TRACK} chosen at random from this pool
            </p>
            {poolSlotsRemaining(questions.length) > 0 && (
              <p style={{ margin: "8px 0 0", color: "#b45309", fontSize: "12px", fontWeight: "600" }}>
                Add {poolSlotsRemaining(questions.length)} more question(s) to complete the pool.
              </p>
            )}
            {isPoolFull(questions.length) && (
              <p style={{ margin: "8px 0 0", color: "#15803d", fontSize: "12px", fontWeight: "600" }}>
                Pool complete. Students will each receive a different random set of {QUESTIONS_DRAWN_PER_TRACK} questions.
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowAddForm(v => !v)}
              disabled={isPoolFull(questions.length)}
              style={{
                padding: "8px 16px",
                backgroundColor: isPoolFull(questions.length) ? "#e5e7eb" : "#111827",
                color: isPoolFull(questions.length) ? "#9ca3af" : "white",
                border: "none",
                borderRadius: "8px",
                cursor: isPoolFull(questions.length) ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Plus size={14} />
                Add Question
              </span>
            </button>
            <button
              type="button"
              onClick={handleDeleteAllQuestions}
              disabled={loading || deletingAll || questions.length === 0}
              style={{
                padding: "8px 16px",
                backgroundColor: loading || deletingAll || questions.length === 0 ? "#f3f4f6" : "#fef2f2",
                color: loading || deletingAll || questions.length === 0 ? "#9ca3af" : "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                cursor: loading || deletingAll || questions.length === 0 ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {deletingAll ? <Loader2 size={14} /> : <Trash2 size={14} />}
                {deletingAll ? "Deleting..." : "Delete all"}
              </span>
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280", padding: "8px" }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1 }}>
          {showAddForm && (
            <div style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "20px", marginBottom: "20px", border: "1px solid #e5e7eb" }}>
              <p style={{ fontWeight: "700", margin: "0 0 16px", fontSize: "15px" }}>New Question</p>
              {error && (
                <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>
                  {error}
                </div>
              )}
              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Question</label>
                <textarea
                  value={newQuestion.question_text}
                  onChange={e => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  rows={2}
                  placeholder="Enter the question"
                  style={{ ...inputStyle, marginTop: "6px", resize: "vertical" }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Type</label>
                <select
                  value={newQuestion.type}
                  onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value })}
                  style={{ ...selectStyle, marginTop: "6px", width: "100%" }}
                >
                  <option value="pre-skilled">Pre-Skilled</option>
                  <option value="aptitude">Aptitude</option>
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Options (select correct answer)</label>
                {(["A", "B", "C", "D"] as const).map(opt => {
                  const key = `option_${opt.toLowerCase()}` as keyof typeof newQuestion
                  const optLabel = `Option ${opt}`
                  const isCorrect = newQuestion.correct_answer === optLabel
                  return (
                    <div key={opt} style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                      <input
                        type="radio"
                        name="new_correct"
                        checked={isCorrect}
                        onChange={() => setNewQuestion({ ...newQuestion, correct_answer: optLabel })}
                      />
                      <span style={{ fontWeight: "600", minWidth: "70px", fontSize: "13px" }}>Option {opt}</span>
                      <input
                        placeholder={`Option ${opt}`}
                        value={newQuestion[key] as string}
                        onChange={e => setNewQuestion({ ...newQuestion, [key]: e.target.value })}
                        style={{ ...inputStyle, flex: 1, marginTop: 0 }}
                      />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={() => { setShowAddForm(false); setError("") }} style={btnOutline}>Cancel</button>
                <button onClick={handleAddQuestion} disabled={saving} style={btnDark}>
                  {saving ? "Saving..." : "Save Question"}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
              <Loader2 size={28} style={{ marginBottom: "8px" }} />
              <p>Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>
              No questions yet. Click &quot;Add Question&quot; to create one for this course.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  {["Question", "Type", "Correct", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#6b7280", fontWeight: "600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.id} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}>
                    <td style={{ padding: "10px 12px", maxWidth: "400px" }}>
                      <p style={{ margin: 0, fontWeight: "500" }}>{q.question_text}</p>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        backgroundColor: q.type === "pre-skilled" ? "#dbeafe" : "#ede9fe",
                        color: q.type === "pre-skilled" ? "#1d4ed8" : "#6d28d9",
                        padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                      }}>
                        {q.type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: "600", fontSize: "13px" }}>
                      {q.correct_answer}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setEditingQuestion(q)}
                          style={{ padding: "4px 10px", backgroundColor: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Pencil size={13} /> Edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          style={{ padding: "4px 10px", backgroundColor: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Trash2 size={13} /> Delete
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
      </div>

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          courses={[course]}
          lockCourseId={course.id}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => { fetchQuestions(); onChanged(); setEditingQuestion(null) }}
        />
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", boxSizing: "border-box", outline: "none" }
const selectStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", backgroundColor: "white", cursor: "pointer", outline: "none" }
const labelStyle: React.CSSProperties = { fontWeight: "600", fontSize: "14px", color: "#374151" }
const btnDark: React.CSSProperties = { padding: "8px 20px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }
const btnOutline: React.CSSProperties = { padding: "8px 20px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }
