import { useState, useEffect, useMemo } from "react"
import { supabase } from "../supabaseClient"
import { Download, FileText, RefreshCw, Search, ChevronDown } from "lucide-react"
import { QUESTIONS_PER_TRACK, getCompetencyLevel } from "../utils/trackRanking"
import ConfirmDialog from "../components/ConfirmDialog"

interface Course {
  id: string
  course_name: string
  capacity: number
}

interface IncludedRanking {
  id: string
  student_id: string
  course_id: string
  score: number
  rank: number
  students?: {
    full_name: string
    lrn: string
    school_year: string
  } | null
  courses?: { course_name: string } | null
}

function CustomSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
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
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          color: "#374151",
          fontSize: "14px",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          outline: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          fontWeight: "500",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#6366f1"
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb"
          setTimeout(() => setIsOpen(false), 200)
        }}
      >
        <span>{selectedOption?.label || "Select track..."}</span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "#9ca3af",
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
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.08)",
            zIndex: 1000,
            maxHeight: "260px",
            overflowY: "auto",
            padding: "4px",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: isSelected ? "#f3f4f6" : "transparent",
                  color: isSelected ? "#111827" : "#4b5563",
                  fontSize: "14px",
                  fontWeight: isSelected ? "600" : "400",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "block",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#fafafa"
                    e.currentTarget.style.color = "#111827"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent"
                    e.currentTarget.style.color = "#4b5563"
                  }
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function escapeCsv(value: string): string {
  const s = value ?? ""
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(row => row.map(cell => escapeCsv(String(cell))).join(",")).join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  a.download = filename
  a.click()
}

export default function ReportsTab() {
  const [courses, setCourses] = useState<Course[]>([])
  const [included, setIncluded] = useState<IncludedRanking[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<"track" | "all" | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [{ data: courseData }, { data: rankData }] = await Promise.all([
      supabase.from("courses").select("id, course_name, capacity").order("course_name"),
      supabase
        .from("rankings")
        .select("id, student_id, course_id, score, rank, students(full_name, lrn, school_year), courses(course_name)")
        .eq("status", "included")
        .order("rank", { ascending: true }),
    ])

    setCourses(courseData || [])
    setIncluded((rankData || []) as unknown as IncludedRanking[])

    if (courseData?.length && !selectedCourse) {
      setSelectedCourse(courseData[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = courses.find(c => c.id === selectedCourse)
  const courseRoster = useMemo(
    () =>
      included
        .filter(r => r.course_id === selectedCourse)
        .sort((a, b) => a.rank - b.rank || b.score - a.score),
    [included, selectedCourse]
  )

  const filteredRoster = courseRoster.filter(r => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.students?.full_name?.toLowerCase().includes(q) ||
      r.students?.lrn?.includes(searchQuery)
    )
  })

  const slotsFilled = courseRoster.length
  const slotsOpen = selected ? Math.max(0, selected.capacity - slotsFilled) : 0

  const buildRowsForRankings = (rows: IncludedRanking[], courseName?: string) => {
    const header = [
      "Track",
      "Rank",
      "Student Name",
      "LRN",
      "School Year",
      `Score (/${QUESTIONS_PER_TRACK})`,
      "Result",
      "Status",
    ]
    const data = rows
      .sort((a, b) => {
        const trackA = courseName || a.courses?.course_name || courses.find(c => c.id === a.course_id)?.course_name || ""
        const trackB = courseName || b.courses?.course_name || courses.find(c => c.id === b.course_id)?.course_name || ""
        if (trackA !== trackB) return trackA.localeCompare(trackB)
        return a.rank - b.rank || b.score - a.score
      })
      .map(r => {
        const track =
          courseName ||
          r.courses?.course_name ||
          courses.find(c => c.id === r.course_id)?.course_name ||
          ""
        return [
          track,
          String(r.rank),
          r.students?.full_name || "",
          r.students?.lrn || "",
          r.students?.school_year || "",
          String(r.score),
          getCompetencyLevel(r.score, QUESTIONS_PER_TRACK),
          "Included",
        ]
      })
    return [header, ...data]
  }

  const exportCurrentTrack = () => {
    if (!selected) return
    const rows = buildRowsForRankings(courseRoster, selected.course_name)
    downloadCsv(`final-roster-${selected.course_name.replace(/\s+/g, "-")}.csv`, rows)
  }

  const exportAllTracks = () => {
    const sorted = [...included].sort((a, b) => {
      const nameA = courses.find(c => c.id === a.course_id)?.course_name || ""
      const nameB = courses.find(c => c.id === b.course_id)?.course_name || ""
      if (nameA !== nameB) return nameA.localeCompare(nameB)
      return a.rank - b.rank || b.score - a.score
    })
    downloadCsv("final-rosters-all-tracks.csv", buildRowsForRankings(sorted))
  }

  const busy = loading

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={22} />
            Reports
          </h2>
          <p style={{ color: "#6b7280", margin: 0, maxWidth: "560px" }}>
            Final rosters per track — students who passed (6+ / 10) and are <strong>included</strong> in each course ranking.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => void fetchData()} disabled={busy} style={btnOutline}>
            <RefreshCw size={16} />
            Reload
          </button>
          <button
            type="button"
            onClick={() => setConfirmDialog("track")}
            disabled={busy || !selectedCourse || courseRoster.length === 0}
            style={btnDark}
          >
            <Download size={16} />
            Export track
          </button>
          <button
            type="button"
            onClick={() => setConfirmDialog("all")}
            disabled={busy || included.length === 0}
            style={btnDark}
          >
            <Download size={16} />
            Export all tracks
          </button>
        </div>
      </div>

      <div style={card}>
        <p style={{ fontWeight: "600", margin: "0 0 4px" }}>Select track</p>
        <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>
          View the final included list for each TVE course
        </p>
        <CustomSelect
          value={selectedCourse}
          onChange={val => {
            setSelectedCourse(val)
            setSearchQuery("")
          }}
          options={courses.map(c => ({
            value: c.id,
            label: `${c.course_name} (${included.filter(r => r.course_id === c.id).length} included)`,
          }))}
        />
      </div>

      {selected && (
        <div style={{ ...card, marginTop: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontWeight: "800", fontSize: "20px", margin: "0 0 4px" }}>{selected.course_name}</h3>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              <span style={{ color: "#16a34a", fontWeight: "600" }}>{slotsFilled} included</span>
              {" · "}
              {slotsOpen} slot{slotsOpen === 1 ? "" : "s"} open
              {" · "}
              Capacity {selected.capacity}
            </p>
          </div>

          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              placeholder="Search by name or LRN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ ...selectStyle, paddingLeft: "36px" }}
            />
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>Loading reports...</p>
          ) : filteredRoster.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>
              {courseRoster.length === 0
                ? "No students are included in this track yet. Rankings appear after students take the exam and pass this course (6+/10)."
                : "No students match your search."}
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  {["Rank", "Student", "LRN", "School year", "Score", "Result"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "white" : "#f9fafb" }}
                  >
                    <td style={tdStyle}>#{r.rank}</td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{r.students?.full_name || "—"}</td>
                    <td style={tdStyle}>{r.students?.lrn || "—"}</td>
                    <td style={tdStyle}>{r.students?.school_year || "—"}</td>
                    <td style={{ ...tdStyle, fontWeight: "700", color: "#2563eb" }}>
                      {r.score} / {QUESTIONS_PER_TRACK}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: getCompetencyLevel(r.score, QUESTIONS_PER_TRACK) === "Passed" ? "#dcfce7" : "#fef2f2",
                        color: getCompetencyLevel(r.score, QUESTIONS_PER_TRACK) === "Passed" ? "#16a34a" : "#dc2626",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}>
                        {getCompetencyLevel(r.score, QUESTIONS_PER_TRACK)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px 20px", marginTop: "16px" }}>
        <p style={{ fontWeight: "700", color: "#15803d", margin: "0 0 8px", fontSize: "14px" }}>About final rosters</p>
        <p style={{ color: "#166534", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
          Only students with status <strong>Included</strong> (passed 6 or more on that track) appear here.
          Use <strong>Export track</strong> for one course or <strong>Export all tracks</strong> for every included student across all courses.
          If lists look outdated, click <strong>Refresh rankings</strong> in Course Management or here.
        </p>
      </div>

      <ConfirmDialog
        open={confirmDialog !== null}
        title="Export Report"
        message={confirmDialog === "all"
          ? "Are you sure you want to export the final rosters for all tracks to a CSV file?"
          : `Are you sure you want to export the final roster for "${selected?.course_name}" to a CSV file?`
        }
        confirmLabel="Export"
        variant="export"
        onConfirm={() => {
          if (confirmDialog === "all") {
            exportAllTracks()
          } else if (confirmDialog === "track") {
            exportCurrentTrack()
          }
          setConfirmDialog(null)
        }}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  )
}

const card: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "24px",
  border: "1px solid #e5e7eb",
}
const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  fontSize: "14px",
  backgroundColor: "white",
  cursor: "pointer",
  outline: "none",
  boxSizing: "border-box",
}
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  color: "#6b7280",
  fontWeight: "600",
}
const tdStyle: React.CSSProperties = { padding: "12px" }
const btnDark: React.CSSProperties = {
  padding: "10px 16px",
  backgroundColor: "#374151",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
}
const btnOutline: React.CSSProperties = {
  ...btnDark,
  backgroundColor: "white",
  color: "#374151",
  border: "1px solid #e5e7eb",
}
