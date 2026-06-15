import { useEffect, useRef } from "react"
import { AlertTriangle, Download, Trash2, UserCheck, Info } from "lucide-react"

type DialogVariant = "danger" | "warning" | "info" | "export" | "assign"

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
  onConfirm: () => void
  onCancel: () => void
}

const variantConfig: Record<DialogVariant, {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  confirmBg: string
  confirmHover: string
}> = {
  danger: {
    icon: <Trash2 size={24} />,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
    confirmBg: "#dc2626",
    confirmHover: "#b91c1c",
  },
  warning: {
    icon: <AlertTriangle size={24} />,
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    confirmBg: "#d97706",
    confirmHover: "#b45309",
  },
  info: {
    icon: <Info size={24} />,
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
    confirmBg: "#2563eb",
    confirmHover: "#1d4ed8",
  },
  export: {
    icon: <Download size={24} />,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    confirmBg: "#374151",
    confirmHover: "#1f2937",
  },
  assign: {
    icon: <UserCheck size={24} />,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    confirmBg: "#16a34a",
    confirmHover: "#15803d",
  },
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel()
      }
      window.addEventListener("keydown", handler)
      // Focus confirm button for accessibility
      setTimeout(() => confirmBtnRef.current?.focus(), 50)
      return () => window.removeEventListener("keydown", handler)
    }
  }, [open, onCancel])

  if (!open) return null

  const config = variantConfig[variant]

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
          animation: "slideUp 0.2s ease-out",
        }}
      >
        <div style={{ padding: "28px 28px 20px", textAlign: "center" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: config.iconBg,
              color: config.iconColor,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            {config.icon}
          </div>
          <h3 style={{ fontWeight: "700", fontSize: "18px", margin: "0 0 8px", color: "#111827" }}>
            {title}
          </h3>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        <div
          style={{
            padding: "16px 28px 24px",
            display: "flex",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 20px",
              backgroundColor: "white",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "white")}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 20px",
              backgroundColor: config.confirmBg,
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = config.confirmHover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = config.confirmBg)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
