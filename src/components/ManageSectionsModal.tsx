import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import ConfirmDialog from "./ConfirmDialog"
import { STUDENT_TYPES, type SectionRow } from "../utils/studentProfile"

interface Props {
  open: boolean
  sections: SectionRow[]
  usingFallback: boolean
  studentCountBySection: Record<string, number>
  onClose: () => void
  onChanged: () => Promise<void> | void
}

const RESERVED_NAMES = new Set(STUDENT_TYPES.map(t => t.toLowerCase()))

export default function ManageSectionsModal({
  open,
  sections,
  usingFallback,
  studentCountBySection,
  onClose,
  onChanged,
}: Props) {
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<SectionRow | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteTarget) {
        if (editingId) {
          setEditingId(null)
          setEditingValue("")
        } else {
          onClose()
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, editingId, deleteTarget, onClose])

  if (!open) return null

  const validateSectionName = (raw: string, excludeId?: string): string | null => {
    const trimmed = raw.trim()
    if (!trimmed) return "Section name is required."
    if (trimmed.length > 50) return "Section name cannot exceed 50 characters."
    if (RESERVED_NAMES.has(trimmed.toLowerCase())) {
      return `"${trimmed}" is reserved for Student Type.`
    }
    const duplicate = sections.some(
      s => s.id !== excludeId && s.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) return `Section "${trimmed}" already exists.`
    return null
  }

  const handleAdd = async () => {
    setError("")
    if (usingFallback) {
      setError("Run supabase/sections.sql in your Supabase SQL Editor first to enable editing sections.")
      return
    }
    const validationError = validateSectionName(newName)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    const { error: insertError } = await supabase
      .from("sections")
      .insert([{ name: newName.trim() }])
    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNewName("")
    await onChanged()
  }

  const startEdit = (section: SectionRow) => {
    setError("")
    setEditingId(section.id)
    setEditingValue(section.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingValue("")
    setError("")
  }

  const handleSaveEdit = async (section: SectionRow) => {
    setError("")
    if (usingFallback || section.isFallback) {
      setError("Run supabase/sections.sql in your Supabase SQL Editor first to enable editing sections.")
      return
    }
    const trimmed = editingValue.trim()
    if (trimmed === section.name) {
      cancelEdit()
      return
    }
    const validationError = validateSectionName(trimmed, section.id)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    const { error: updateSectionError } = await supabase
      .from("sections")
      .update({ name: trimmed })
      .eq("id", section.id)

    if (updateSectionError) {
      setSaving(false)
      setError(updateSectionError.message)
      return
    }

    // Keep existing students linked to the renamed section
    const { error: updateStudentsError } = await supabase
      .from("students")
      .update({ section: trimmed })
      .eq("section", section.name)

    setSaving(false)

    if (updateStudentsError) {
      setError(`Section renamed, but updating existing student records failed: ${updateStudentsError.message}`)
    }

    setEditingId(null)
    setEditingValue("")
    await onChanged()
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    setError("")

    if (usingFallback || target.isFallback) {
      setError("Run supabase/sections.sql in your Supabase SQL Editor first to enable deleting sections.")
      return
    }

    setSaving(true)
    const { error: deleteError } = await supabase
      .from("sections")
      .delete()
      .eq("id", target.id)
    setSaving(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    if (editingId === target.id) {
      setEditingId(null)
      setEditingValue("")
    }
    await onChanged()
  }

  const deleteStudentCount = deleteTarget ? (studentCountBySection[deleteTarget.name] ?? 0) : 0

  return (
    <>
      <div
        onClick={e => {
          if (e.target === e.currentTarget) onClose()
        }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(17, 24, 39, 0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            maxHeight: "88vh",
            overflowY: "auto",
            backgroundColor: "white",
            borderRadius: "14px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              padding: "20px 24px",
              borderBottom: "1px solid #e5e7eb",
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 1,
            }}
          >
            <div>
              <h3 style={{ fontWeight: "800", fontSize: "19px", margin: "0 0 4px" }}>
                Manage Sections
              </h3>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                Add, rename, or delete sections shown in student sign-up and reports.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                backgroundColor: "white",
                color: "#374151",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Close manage sections window"
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {usingFallback && (
              <div
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "14px",
                }}
              >
                Showing default sections. Run <code>supabase/sections.sql</code> in Supabase SQL Editor to add, edit, or delete sections.
              </div>
            )}

            {error && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "14px",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
              <input
                placeholder="New section name (e.g. Peace)..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") void handleAdd()
                }}
                disabled={saving || usingFallback}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={saving || usingFallback}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: saving || usingFallback ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: saving || usingFallback ? 0.6 : 1,
                }}
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {sections.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "28px 0", margin: 0 }}>
                No sections yet. Add one above.
              </p>
            ) : (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                {sections.map((section, idx) => {
                  const isEditing = editingId === section.id
                  const count = studentCountBySection[section.name] ?? 0
                  return (
                    <div
                      key={section.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        padding: "10px 14px",
                        borderBottom: idx === sections.length - 1 ? "none" : "1px solid #f3f4f6",
                        backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb",
                      }}
                    >
                      {isEditing ? (
                        <>
                          <input
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") void handleSaveEdit(section)
                              if (e.key === "Escape") cancelEdit()
                            }}
                            autoFocus
                            disabled={saving}
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #2563eb",
                              fontSize: "14px",
                              outline: "none",
                            }}
                          />
                          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => void handleSaveEdit(section)}
                              disabled={saving}
                              style={saveBtnStyle}
                            >
                              <Check size={14} />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                              style={neutralBtnStyle}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <span style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>
                              {section.name}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#6b7280",
                                backgroundColor: "#f3f4f6",
                                padding: "2px 8px",
                                borderRadius: "999px",
                              }}
                            >
                              {count} student{count === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => startEdit(section)}
                              disabled={saving || usingFallback}
                              style={{
                                ...editBtnStyle,
                                opacity: saving || usingFallback ? 0.5 : 1,
                                cursor: saving || usingFallback ? "not-allowed" : "pointer",
                              }}
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(section)}
                              disabled={saving || usingFallback}
                              style={{
                                ...deleteBtnStyle,
                                opacity: saving || usingFallback ? 0.5 : 1,
                                cursor: saving || usingFallback ? "not-allowed" : "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Section"
        message={
          deleteTarget
            ? deleteStudentCount > 0
              ? `Are you sure you want to delete section "${deleteTarget.name}"? ${deleteStudentCount} student(s) currently have this section; their existing records will keep the label, and new students will no longer see it in Sign Up.`
              : `Are you sure you want to delete section "${deleteTarget.name}"?`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

const editBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  backgroundColor: "#eff6ff",
  color: "#2563eb",
  border: "none",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
}

const deleteBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  backgroundColor: "#fef2f2",
  color: "#dc2626",
  border: "none",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
}

const saveBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  backgroundColor: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
}

const neutralBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "600",
}
