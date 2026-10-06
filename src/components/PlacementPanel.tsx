import { useCallback, useEffect, useState } from "react"
import { Loader2, PlayCircle, Send, EyeOff } from "lucide-react"
import ConfirmDialog from "./ConfirmDialog"
import {
  fetchPlacementSummary,
  runPlacement,
  setPlacementReleased,
  type PlacementSummary,
} from "../utils/placement"

interface Props {
  schoolYear: string
  adminName: string
  onChanged: () => void
}

type Dialog = "run" | "release" | "unrelease" | null

export default function PlacementPanel({ schoolYear, adminName, onChanged }: Props) {
  const [summary, setSummary] = useState<PlacementSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const loadSummary = useCallback(async () => {
    if (schoolYear === "all") return
    setSummary(await fetchPlacementSummary(schoolYear))
  }, [schoolYear])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  if (schoolYear === "all") {
    return (
      <div style={panelStyle}>
        <p style={titleStyle}>Course Placement</p>
        <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
          Select a school year in the header to run placement and release results for that school year.
        </p>
      </div>
    )
  }

  const doRun = async () => {
    setDialog(null)
    setBusy(true)
    setMessage(null)
    const result = await runPlacement(schoolYear, adminName)
    setBusy(false)
    if (result.error) {
      setMessage({ text: `Placement failed: ${result.error}`, error: true })
    } else {
      const extra = result.tieOverflow > 0
        ? ` ${result.tieOverflow} extra seat(s) were used because students were exactly tied at the last slot.`
        : ""
      setMessage({
        text: `Placement complete: ${result.placed} placed automatically, ${result.waitlisted} on the waitlist for manual placement, ${result.manualKept} manual placement(s) kept.${extra}`,
        error: false,
      })
    }
    await loadSummary()
    onChanged()
  }

  const doSetReleased = async (released: boolean) => {
    setDialog(null)
    setBusy(true)
    const err = await setPlacementReleased(schoolYear, released)
    setBusy(false)
    setMessage(err ? { text: `Could not update release status: ${err}`, error: true } : null)
    await loadSummary()
  }

  const stats = summary
    ? [
        { label: "Not yet assessed", value: summary.notAssessed, color: "#dc2626" },
        { label: "Pending placement", value: summary.pending, color: "#d97706" },
        { label: "Placed automatically", value: summary.autoPlaced, color: "#16a34a" },
        { label: "Placed manually", value: summary.manuallyPlaced, color: "#2563eb" },
        { label: "Waitlist (needs manual)", value: summary.waitlisted, color: "#7c3aed" },
      ]
    : []

  const runMessage = [
    `This places all assessed students of ${schoolYear} at the same time.`,
    "Students who passed a preferred course are placed in their highest passed choice, with higher scores getting priority when slots are limited.",
    "Students who did not pass any preferred course, or whose passed courses are full, go to the waitlist.",
    "Manual placements are kept. Earlier automatic placements and waitlist entries for this school year are replaced.",
    summary && summary.notAssessed > 0
      ? `Warning: ${summary.notAssessed} student(s) have not taken the assessment yet. Run placement only after the exam period has ended.`
      : "",
  ].filter(Boolean).join(" ")

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <div>
          <p style={titleStyle}>Course Placement — {schoolYear}</p>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
            Run placement once after all students have taken the assessment, place waitlisted students manually, then release the results.
          </p>
          {summary && (
            <p style={{ color: "#6b7280", fontSize: "12px", margin: "6px 0 0" }}>
              Last run: {summary.lastRun ? new Date(summary.lastRun).toLocaleString("en-PH") : "never"}
              {" · "}
              Results:{" "}
              <strong style={{ color: summary.released ? "#16a34a" : "#d97706" }}>
                {summary.released ? "released to students" : "not yet released"}
              </strong>
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setDialog("run")}
            disabled={busy || !summary || summary.released}
            title={summary?.released ? "Hide the results first before running placement again." : undefined}
            style={{ ...btn, backgroundColor: "#111827", opacity: busy || !summary || summary.released ? 0.5 : 1 }}
          >
            {busy ? <Loader2 size={14} /> : <PlayCircle size={14} />}
            Run Placement
          </button>
          {summary?.released ? (
            <button type="button" onClick={() => setDialog("unrelease")} disabled={busy} style={{ ...btn, backgroundColor: "#6b7280" }}>
              <EyeOff size={14} />
              Hide Results
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDialog("release")}
              disabled={busy || !summary?.lastRun}
              title={!summary?.lastRun ? "Run placement first." : undefined}
              style={{ ...btn, backgroundColor: "#16a34a", opacity: busy || !summary?.lastRun ? 0.5 : 1 }}
            >
              <Send size={14} />
              Release Results
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 12px" }}>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: stat.color }}>{stat.value}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {message && (
        <p style={{ margin: "12px 0 0", fontSize: "13px", color: message.error ? "#b91c1c" : "#15803d", fontWeight: "600" }}>
          {message.text}
        </p>
      )}

      <ConfirmDialog
        open={dialog === "run"}
        title="Run Placement"
        message={runMessage}
        confirmLabel="Run Placement"
        variant="warning"
        onConfirm={() => { void doRun() }}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "release"}
        title="Release Results"
        message={`Release the final course placements for ${schoolYear}? All students of this school year will see their placement at the same time.${summary && summary.waitlisted > 0 ? ` ${summary.waitlisted} student(s) are still on the waitlist and will see that status until you place them.` : ""}`}
        confirmLabel="Release"
        variant="assign"
        onConfirm={() => { void doSetReleased(true) }}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "unrelease"}
        title="Hide Results"
        message={`Hide the course placements for ${schoolYear} from students? They will see "placement pending" until you release the results again.`}
        confirmLabel="Hide"
        variant="warning"
        onConfirm={() => { void doSetReleased(false) }}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
  padding: "20px 24px",
  border: "1px solid #e5e7eb",
  marginBottom: "20px",
}

const titleStyle: React.CSSProperties = {
  fontWeight: "700",
  fontSize: "16px",
  margin: "0 0 4px",
}

const btn: React.CSSProperties = {
  padding: "8px 14px",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
}
