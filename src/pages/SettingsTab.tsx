import { useState, useEffect, useCallback } from "react"
import {
  fetchExamAccessCodes,
  fetchLabCodeUsage,
  generateBatchCode,
  isLabAccessCodeRequired,
  revokeBatchCode,
  setLabAccessCodeRequired,
  DEFAULT_BATCH_SIZE,
  type ExamAccessCodeRow,
  type LabCodeUsageRow,
} from "../utils/examAccessCode"
import { KeyRound, Loader2, RefreshCw, ShieldCheck, Copy, Check, Users } from "lucide-react"

export default function SettingsTab() {
  const [requireLabCode, setRequireLabCode] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [savingSetting, setSavingSetting] = useState(false)
  const [codes, setCodes] = useState<ExamAccessCodeRow[]>([])
  const [codeUsage, setCodeUsage] = useState<LabCodeUsageRow[]>([])
  const [codesLoading, setCodesLoading] = useState(true)
  const [usageFilter, setUsageFilter] = useState<"all" | "active" | "completed">("all")
  const [generating, setGenerating] = useState(false)
  const [batchCount, setBatchCount] = useState(1)
  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    const required = await isLabAccessCodeRequired()
    setRequireLabCode(required)
    setSettingsLoading(false)
  }, [])

  const loadCodes = useCallback(async () => {
    setCodesLoading(true)
    const [rows, usage] = await Promise.all([fetchExamAccessCodes(), fetchLabCodeUsage()])
    setCodes(rows)
    setCodeUsage(usage)
    setCodesLoading(false)
  }, [])

  useEffect(() => {
    loadSettings()
    loadCodes()
  }, [loadSettings, loadCodes])

  const toggleRequireLabCode = async () => {
    setSavingSetting(true)
    const next = !requireLabCode
    const err = await setLabAccessCodeRequired(next)
    if (err) {
      alert(`Could not save setting: ${err}\n\nRun supabase/exam_access_codes.sql in your Supabase SQL editor if tables are missing.`)
    } else {
      setRequireLabCode(next)
    }
    setSavingSetting(false)
  }

  const handleGenerateBatches = async () => {
    const count = Math.max(1, Math.min(20, batchCount))
    const size = Math.max(1, Math.min(100, batchSize))
    if (!confirm(`Generate ${count} batch code(s)? Each code can be used by up to ${size} students.`)) return

    setGenerating(true)
    let failed = 0
    const created: string[] = []
    for (let i = 0; i < count; i++) {
      const result = await generateBatchCode(size)
      if ("error" in result) failed++
      else created.push(result.code)
    }
    setGenerating(false)
    await loadCodes()
    if (failed > 0) {
      alert(`Created ${created.length} code(s). ${failed} failed — try again.`)
    } else if (created.length === 1) {
      alert(`Batch code created: ${created[0]}\n\nShare this with up to ${size} students in the lab.`)
    }
  }

  const handleRevoke = async (row: ExamAccessCodeRow) => {
    const used = row.redemption_count || 0
    if (used > 0) {
      if (!confirm(`This code was used by ${used} student(s). Remove it anyway? Those students cannot start without a new code.`)) return
    } else if (!confirm("Remove this unused batch code?")) {
      return
    }
    const err = await revokeBatchCode(row.id)
    if (err) alert(err)
    else await loadCodes()
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      alert(`Code: ${code}`)
    }
  }

  const activeCodes = codes.filter(c => (c.redemption_count || 0) < c.max_uses)
  const totalSlotsLeft = activeCodes.reduce(
    (sum, c) => sum + (c.max_uses - (c.redemption_count || 0)),
    0
  )

  const activeInLab = codeUsage.filter(u => u.status === "active")
  const filteredUsage = codeUsage.filter(u => usageFilter === "all" || u.status === usageFilter)

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px" }}>System Settings</h2>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Control laboratory-only exam access with batch codes (one code per group of students)
        </p>
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ backgroundColor: "#eff6ff", borderRadius: "10px", padding: "12px", color: "#1d4ed8" }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: "700", margin: "0 0 6px", fontSize: "16px" }}>Require laboratory access code</p>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 16px", lineHeight: 1.5 }}>
              When enabled, students must enter a batch code (issued in the computer laboratory) before they can
              start the assessment. Each code supports up to {DEFAULT_BATCH_SIZE} students by default.
            </p>
            <button
              type="button"
              onClick={toggleRequireLabCode}
              disabled={settingsLoading || savingSetting}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: settingsLoading || savingSetting ? "not-allowed" : "pointer",
                fontWeight: "600",
                backgroundColor: requireLabCode ? "#dc2626" : "#111827",
                color: "white",
                opacity: settingsLoading || savingSetting ? 0.7 : 1,
              }}
            >
              {savingSetting ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={16} />
                  Saving...
                </span>
              ) : settingsLoading ? (
                "Loading..."
              ) : requireLabCode ? (
                "Disable laboratory codes"
              ) : (
                "Enable laboratory codes"
              )}
            </button>
            <p style={{ margin: "12px 0 0", fontSize: "13px", color: requireLabCode ? "#15803d" : "#9ca3af" }}>
              Status: {settingsLoading ? "..." : requireLabCode ? "Enabled — students must enter a batch code" : "Disabled — students can start without a code"}
            </p>
          </div>
        </div>
      </div>

      <div style={{ ...card, marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontWeight: "700", margin: "0 0 4px", fontSize: "16px", display: "flex", alignItems: "center", gap: 8 }}>
              <KeyRound size={18} />
              Laboratory batch codes
            </p>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              One code per batch (e.g. 20 students). Each student redeems the same code once when starting the exam.
            </p>
            {activeCodes.length > 0 && (
              <p style={{ color: "#15803d", fontSize: "13px", margin: "8px 0 0", fontWeight: "600" }}>
                {activeCodes.length} active batch(es) · {totalSlotsLeft} student slot(s) remaining
              </p>
            )}
          </div>
          <button type="button" onClick={loadCodes} style={btnSecondary}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "4px" }}>
              Students per code
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={batchSize}
              onChange={e => setBatchSize(Number(e.target.value) || DEFAULT_BATCH_SIZE)}
              style={{ ...inputStyle, width: "120px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "4px" }}>
              Number of codes
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={batchCount}
              onChange={e => setBatchCount(Number(e.target.value) || 1)}
              style={{ ...inputStyle, width: "120px" }}
            />
          </div>
          <button type="button" onClick={handleGenerateBatches} disabled={generating} style={btnPrimary}>
            {generating ? "Generating..." : "Generate batch code(s)"}
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Code", "Usage", "Created", "Status", "Actions"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codesLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>Loading codes...</td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                    No batch codes yet. Generate codes for each lab session.
                  </td>
                </tr>
              ) : (
                codes.map(row => {
                  const used = row.redemption_count || 0
                  const full = used >= row.max_uses
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: "700", letterSpacing: "0.08em" }}>
                        {row.code}
                      </td>
                      <td style={tdStyle}>
                        {used} / {row.max_uses} students
                      </td>
                      <td style={{ ...tdStyle, color: "#6b7280" }}>
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            backgroundColor: full ? "#f3f4f6" : "#dcfce7",
                            color: full ? "#6b7280" : "#15803d",
                          }}
                        >
                          {full ? "Full" : "Available"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button type="button" onClick={() => copyCode(row.code)} style={btnSmall}>
                            {copiedCode === row.code ? <Check size={14} /> : <Copy size={14} />}
                            {copiedCode === row.code ? "Copied" : "Copy"}
                          </button>
                          <button type="button" onClick={() => handleRevoke(row)} style={{ ...btnSmall, color: "#dc2626" }}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...card, marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontWeight: "700", margin: "0 0 4px", fontSize: "16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} />
              Students using laboratory codes
            </p>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              Students who started the exam with a batch code. <strong>In lab</strong> means they have not submitted yet.
            </p>
            {!codesLoading && (
              <p style={{ color: "#1d4ed8", fontSize: "13px", margin: "8px 0 0", fontWeight: "600" }}>
                {activeInLab.length} currently in lab · {codeUsage.length} total redemption(s)
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select
              value={usageFilter}
              onChange={e => setUsageFilter(e.target.value as typeof usageFilter)}
              style={{ ...inputStyle, width: "auto", minWidth: "140px" }}
            >
              <option value="all">All students</option>
              <option value="active">In lab only</option>
              <option value="completed">Submitted only</option>
            </select>
            <button type="button" onClick={loadCodes} style={btnSecondary}>
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Student", "LRN", "School year", "Batch code", "Started", "Status"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codesLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>Loading...</td>
                </tr>
              ) : filteredUsage.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                    {usageFilter === "active"
                      ? "No students are currently in the lab with a batch code."
                      : usageFilter === "completed"
                        ? "No submitted assessments from batch codes yet."
                        : "No students have used a batch code yet."}
                  </td>
                </tr>
              ) : (
                filteredUsage.map(row => (
                  <tr
                    key={row.redemption_id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      backgroundColor: row.status === "active" ? "#f0fdf4" : undefined,
                    }}
                  >
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{row.student_name}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace" }}>{row.lrn}</td>
                    <td style={{ ...tdStyle, color: "#6b7280" }}>{row.school_year}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: "700", letterSpacing: "0.06em" }}>
                      {row.code}
                    </td>
                    <td style={{ ...tdStyle, color: "#6b7280" }}>
                      {new Date(row.used_at).toLocaleString()}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          backgroundColor: row.status === "active" ? "#dcfce7" : "#eff6ff",
                          color: row.status === "active" ? "#15803d" : "#1d4ed8",
                        }}
                      >
                        {row.status === "active" ? "In lab" : "Submitted"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "24px",
  border: "1px solid #e5e7eb",
}
const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
}
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  color: "#6b7280",
  fontWeight: "600",
}
const tdStyle: React.CSSProperties = { padding: "10px 12px" }
const btnPrimary: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "#111827",
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
const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  backgroundColor: "white",
  color: "#374151",
  border: "1px solid #e5e7eb",
}
const btnSmall: React.CSSProperties = {
  padding: "4px 10px",
  backgroundColor: "#f3f4f6",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
}
