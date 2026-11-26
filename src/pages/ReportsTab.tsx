import { useState, useEffect, useMemo } from "react"
import { supabase } from "../supabaseClient"
import { ArrowLeft, Award, Download, FileText, GraduationCap, RefreshCw, Search, SlidersHorizontal, Users, X, ChevronDown } from "lucide-react"
import { CourseIcon } from "../utils/courseIcons"
import { SkeletonTableRows } from "../components/Skeleton"
import { getStartYear } from "../utils/schoolYear"
import { fetchAllRows } from "../utils/placement"
import { STUDENT_SECTIONS, STUDENT_TYPES, fetchSections, getStudentTypeBadgeStyle, type SectionRow } from "../utils/studentProfile"
import { isPassingScore, QUESTIONS_PER_TRACK } from "../utils/trackRanking"


import ConfirmDialog from "../components/ConfirmDialog"
import ManageSectionsModal from "../components/ManageSectionsModal"

interface Course {
  id: string
  course_name: string
  capacity: number
}

interface CourseSummary extends Course {
  enrolled: number
  available: number
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
    student_type?: string | null
    section?: string | null
  } | null
  courses?: { course_name: string } | null
}

interface ReportStudent {
  id: string
  full_name: string
  lrn: string
  school_year: string
  student_type?: string | null
  section?: string | null
}

interface ReportAssessment {
  student_id: string
  course_id: string
  score: number
  total_items: number
  passed: boolean
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

interface Props {
  schoolYearFilter: string
}

export default function ReportsTab({ schoolYearFilter }: Props) {
  const [courses, setCourses] = useState<Course[]>([])
  const [included, setIncluded] = useState<IncludedRanking[]>([])
  const [students, setStudents] = useState<ReportStudent[]>([])
  const [assessments, setAssessments] = useState<ReportAssessment[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sectionsPageOpen, setSectionsPageOpen] = useState(false)
  const [showManageSections, setShowManageSections] = useState(false)
  const [sectionsList, setSectionsList] = useState<SectionRow[]>(() =>
    STUDENT_SECTIONS.map(name => ({ id: name, name, isFallback: true }))
  )
  const [sectionsUsingFallback, setSectionsUsingFallback] = useState(false)
  const [sectionGroupFilter, setSectionGroupFilter] = useState("all")
  const [sectionTrackFilter, setSectionTrackFilter] = useState("all")
  const [sectionSearch, setSectionSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<"track" | "all" | "section" | null>(null)
  const [exportTrackId, setExportTrackId] = useState("")
  const [showExportDropdown, setShowExportDropdown] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [{ data: courseData }, { data: rankData }, studentsResult, assessmentsResult, sectionsResult] = await Promise.all([
      supabase.from("courses").select("id, course_name, capacity").order("course_name"),
      supabase
        .from("rankings")
        .select("id, student_id, course_id, score, rank, students(full_name, lrn, school_year, student_type, section), courses(course_name)")
        .eq("status", "included")
        .order("rank", { ascending: true }),
      fetchAllRows<ReportStudent>("students", "id, full_name, lrn, school_year, student_type, section"),
      fetchAllRows<ReportAssessment>("assessments", "student_id, course_id, score, total_items, passed"),
      fetchSections(),
    ])

    setCourses(courseData || [])
    setIncluded((rankData || []) as unknown as IncludedRanking[])
    setStudents(studentsResult.data || [])
    setAssessments(assessmentsResult.data || [])
    setSectionsList(sectionsResult.sections)
    setSectionsUsingFallback(sectionsResult.usingFallback)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredIncluded = useMemo(() => {
    if (schoolYearFilter === "all") return included
    const filterYearStart = getStartYear(schoolYearFilter)
    return included.filter(r => {
      const studentYear = r.students?.school_year
      if (!studentYear) return false
      return getStartYear(studentYear) === filterYearStart
    })
  }, [included, schoolYearFilter])

  const courseSummaries = useMemo<CourseSummary[]>(
    () =>
      courses.map(course => {
        const enrolled = filteredIncluded.filter(r => r.course_id === course.id).length
        return {
          ...course,
          enrolled,
          available: Math.max(0, course.capacity - enrolled),
        }
      }),
    [courses, filteredIncluded]
  )

  const totalCapacity = courseSummaries.reduce((sum, course) => sum + course.capacity, 0)
  const totalEnrolled = courseSummaries.reduce((sum, course) => sum + course.enrolled, 0)
  const totalAvailable = courseSummaries.reduce((sum, course) => sum + course.available, 0)

  const filteredYearStudents = useMemo(() => {
    if (schoolYearFilter === "all") return students
    const filterYearStart = getStartYear(schoolYearFilter)
    return students.filter(s => s.school_year && getStartYear(s.school_year) === filterYearStart)
  }, [students, schoolYearFilter])

  const enrolledCourseByStudent = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of filteredIncluded) {
      if (!r.student_id || map.has(r.student_id)) continue
      const cName = r.courses?.course_name || courses.find(c => c.id === r.course_id)?.course_name || ""
      if (cName) map.set(r.student_id, cName)
    }
    return map
  }, [filteredIncluded, courses])

  const assessmentLookupByStudent = useMemo(() => {
    const courseNameById = new Map(courses.map(c => [c.id, c.course_name]))
    const byStudent = new Map<string, {
      byCourse: Record<string, ReportAssessment>
      totalScore: number
      totalItems: number
      bestCourseNames: string[]
      bestScore: number
      bestTotal: number
      assessed: boolean
    }>()

    for (const a of assessments) {
      let entry = byStudent.get(a.student_id)
      if (!entry) {
        entry = {
          byCourse: {},
          totalScore: 0,
          totalItems: 0,
          bestCourseNames: [],
          bestScore: -1,
          bestTotal: QUESTIONS_PER_TRACK,
          assessed: false,
        }
        byStudent.set(a.student_id, entry)
      }
      entry.byCourse[a.course_id] = a
      entry.totalScore += a.score
      entry.totalItems += a.total_items || QUESTIONS_PER_TRACK
      entry.assessed = true
      const cName = courseNameById.get(a.course_id) || ""
      if (a.score > entry.bestScore) {
        entry.bestScore = a.score
        entry.bestTotal = a.total_items || QUESTIONS_PER_TRACK
        entry.bestCourseNames = cName ? [cName] : []
      } else if (a.score === entry.bestScore && cName && !entry.bestCourseNames.includes(cName)) {
        entry.bestCourseNames.push(cName)
        entry.bestCourseNames.sort((x, y) => x.localeCompare(y))
      }
    }
    return byStudent
  }, [assessments, courses])

  const availableSectionNames = useMemo(() => {
    const names = new Set(sectionsList.map(s => s.name))
    for (const s of filteredYearStudents) {
      if (s.section) names.add(s.section)
    }
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [sectionsList, filteredYearStudents])

  const allStudentCountBySection = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of students) {
      if (s.section) counts[s.section] = (counts[s.section] || 0) + 1
    }
    return counts
  }, [students])

  const sectionGroupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: filteredYearStudents.length }
    for (const sec of availableSectionNames) counts[sec] = 0
    for (const type of STUDENT_TYPES) {
      if (type !== "Regular") counts[type] = 0
    }
    for (const s of filteredYearStudents) {
      if (s.section && s.section in counts) counts[s.section] += 1
      if (s.student_type && s.student_type !== "Regular" && s.student_type in counts) {
        counts[s.student_type] += 1
      }
    }
    return counts
  }, [availableSectionNames, filteredYearStudents])

  const sectionBaseStudents = useMemo(() => {
    return filteredYearStudents.filter(s => {
      if (sectionGroupFilter === "all") return true
      if (sectionGroupFilter === "Transferee" || sectionGroupFilter === "Balik Skwela") {
        return s.student_type === sectionGroupFilter
      }
      return s.section === sectionGroupFilter
    })
  }, [filteredYearStudents, sectionGroupFilter])

  const topScorersByTrack = useMemo(() => {
    return courses.map(course => {
      let highestScore: number | null = null
      let totalItems = QUESTIONS_PER_TRACK
      let topStudents: ReportStudent[] = []
      let assessedCount = 0

      for (const student of sectionBaseStudents) {
        const record = assessmentLookupByStudent.get(student.id)?.byCourse[course.id]
        if (!record) continue
        assessedCount += 1
        if (highestScore === null || record.score > highestScore) {
          highestScore = record.score
          totalItems = record.total_items || QUESTIONS_PER_TRACK
          topStudents = [student]
        } else if (record.score === highestScore) {
          topStudents.push(student)
        }
      }

      topStudents.sort((a, b) => a.full_name.localeCompare(b.full_name))

      return {
        courseId: course.id,
        courseName: course.course_name,
        highestScore,
        totalItems,
        topStudents,
        assessedCount,
      }
    })
  }, [courses, sectionBaseStudents, assessmentLookupByStudent])

  const selectedTrackTop = useMemo(
    () => (sectionTrackFilter === "all" ? null : topScorersByTrack.find(t => t.courseId === sectionTrackFilter) ?? null),
    [sectionTrackFilter, topScorersByTrack]
  )

  const sectionTableRows = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase()
    const matching = sectionBaseStudents.filter(s => {
      if (!q) return true
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.lrn.includes(sectionSearch.trim()) ||
        (s.section || "").toLowerCase().includes(q)
      )
    })

    return [...matching].sort((a, b) => {
      const infoA = assessmentLookupByStudent.get(a.id)
      const infoB = assessmentLookupByStudent.get(b.id)

      if (sectionTrackFilter !== "all") {
        const recA = infoA?.byCourse[sectionTrackFilter]
        const recB = infoB?.byCourse[sectionTrackFilter]
        if (recA && !recB) return -1
        if (!recA && recB) return 1
        if (recA && recB && recB.score !== recA.score) return recB.score - recA.score
      } else {
        const hasA = !!infoA?.assessed
        const hasB = !!infoB?.assessed
        if (hasA && !hasB) return -1
        if (!hasA && hasB) return 1
        if (infoA && infoB && infoB.totalScore !== infoA.totalScore) {
          return infoB.totalScore - infoA.totalScore
        }
      }
      return a.full_name.localeCompare(b.full_name)
    })
  }, [sectionBaseStudents, sectionSearch, sectionTrackFilter, assessmentLookupByStudent])

  const selected = courseSummaries.find(c => c.id === selectedCourse)
  const courseRoster = useMemo(
    () =>
      filteredIncluded
        .filter(r => r.course_id === selectedCourse)
        .sort((a, b) => a.rank - b.rank || b.score - a.score),
    [filteredIncluded, selectedCourse]
  )

  const filteredRoster = courseRoster.filter(r => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.students?.full_name?.toLowerCase().includes(q) ||
      r.students?.lrn?.includes(searchQuery)
    )
  })

  const slotsFilled = selected?.enrolled ?? courseRoster.length
  const slotsOpen = selected?.available ?? 0

  const buildRowsForRankings = (rows: IncludedRanking[], courseName?: string) => {
    const header = [
      "Enrolled Course",
      "Student Name",
      "LRN",
      "School Year",
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
          r.students?.full_name || "",
          r.students?.lrn || "",
          r.students?.school_year || "",
          "Included",
        ]
      })
    return [header, ...data]
  }

  const exportSpecificTrack = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    if (!course) return
    const roster = filteredIncluded
      .filter(r => r.course_id === courseId)
      .sort((a, b) => a.rank - b.rank || b.score - a.score)
    const rows = buildRowsForRankings(roster, course.course_name)
    downloadCsv(`final-roster-${course.course_name.replace(/\s+/g, "-")}.csv`, rows)
  }

  const exportAllTracks = () => {
    const sorted = [...filteredIncluded].sort((a, b) => {
      const nameA = courses.find(c => c.id === a.course_id)?.course_name || ""
      const nameB = courses.find(c => c.id === b.course_id)?.course_name || ""
      if (nameA !== nameB) return nameA.localeCompare(nameB)
      return a.rank - b.rank || b.score - a.score
    })
    downloadCsv("final-rosters-all-tracks.csv", buildRowsForRankings(sorted))
  }

  const exportSectionReport = () => {
    const selectedTrack = courses.find(c => c.id === sectionTrackFilter)
    const groupSlug = sectionGroupFilter === "all" ? "all-sections" : sectionGroupFilter.toLowerCase().replace(/\s+/g, "-")
    const trackSlug = selectedTrack ? selectedTrack.course_name.toLowerCase().replace(/\s+/g, "-") : "all-tracks"

    if (selectedTrack) {
      const header = ["Student Name", "LRN", "Student Type", "Section", `${selectedTrack.course_name} Score`, "Track Status", "Enrolled Course"]
      const rows = sectionTableRows.map(s => {
        const rec = assessmentLookupByStudent.get(s.id)?.byCourse[selectedTrack.id]
        const total = rec?.total_items || QUESTIONS_PER_TRACK
        const scoreLabel = rec ? `${rec.score} / ${total}` : "Not taken"
        const statusLabel = rec ? (isPassingScore(rec.score, total) ? "Passed" : "Failed") : "Not taken"
        return [
          s.full_name,
          s.lrn,
          s.student_type || "—",
          s.section || "—",
          scoreLabel,
          statusLabel,
          enrolledCourseByStudent.get(s.id) || "—",
        ]
      })
      downloadCsv(`section-report-${groupSlug}-${trackSlug}.csv`, [header, ...rows])
      return
    }

    const header = ["Student Name", "LRN", "Student Type", "Section", "Highest Track", "Total Score", "Enrolled Course"]
    const rows = sectionTableRows.map(s => {
      const info = assessmentLookupByStudent.get(s.id)
      const bestLabel = info?.assessed && info.bestCourseNames.length > 0
        ? `${info.bestCourseNames.join(", ")} (${info.bestScore} / ${info.bestTotal})`
        : "Not taken"
      const totalLabel = info?.assessed ? `${info.totalScore} / ${info.totalItems}` : "Not taken"
      return [
        s.full_name,
        s.lrn,
        s.student_type || "—",
        s.section || "—",
        bestLabel,
        totalLabel,
        enrolledCourseByStudent.get(s.id) || "—",
      ]
    })
    downloadCsv(`section-report-${groupSlug}-${trackSlug}.csv`, [header, ...rows])
  }

  const exportTrackName = courses.find(c => c.id === exportTrackId)?.course_name
  const exportTrackEnrolled = filteredIncluded.filter(r => r.course_id === exportTrackId).length

  const viewCourseStudents = (courseId: string) => {
    setSelectedCourse(courseId)
    setSearchQuery("")
  }

  const busy = loading

  const confirmDialogEl = (
    <ConfirmDialog
      open={confirmDialog !== null}
      title="Export Report"
      message={confirmDialog === "all"
        ? "Are you sure you want to export the final rosters for all tracks to a CSV file?"
        : confirmDialog === "section"
          ? `Are you sure you want to export ${sectionTableRows.length} student record${sectionTableRows.length === 1 ? "" : "s"} for ${sectionGroupFilter === "all" ? "All Sections & Types" : sectionGroupFilter} to a CSV file?`
          : `Are you sure you want to export the final roster for "${exportTrackName}" (${exportTrackEnrolled} student${exportTrackEnrolled !== 1 ? "s" : ""}) to a CSV file?`
      }
      confirmLabel="Export"
      variant="export"
      onConfirm={() => {
        if (confirmDialog === "all") {
          exportAllTracks()
        } else if (confirmDialog === "section") {
          exportSectionReport()
        } else if (confirmDialog === "track" && exportTrackId) {
          exportSpecificTrack(exportTrackId)
        }
        setConfirmDialog(null)
        setExportTrackId("")
      }}
      onCancel={() => {
        setConfirmDialog(null)
        setExportTrackId("")
      }}
    />
  )

  if (sectionsPageOpen) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <button
              type="button"
              onClick={() => setSectionsPageOpen(false)}
              style={{ ...btnOutline, padding: "7px 12px", fontSize: "13px", marginBottom: "12px" }}
            >
              <ArrowLeft size={15} />
              Back to Reports
            </button>
            <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
              <GraduationCap size={22} />
              Students by Section
            </h2>
            <p style={{ color: "#6b7280", margin: 0 }}>
              View students from each section (or Transferee / Balik Skwela) and check who got the highest score on a course.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={() => setShowManageSections(true)} disabled={busy} style={btnOutline}>
              <SlidersHorizontal size={16} />
              Manage Sections
            </button>
            <button type="button" onClick={() => void fetchData()} disabled={busy} style={btnOutline}>
              <RefreshCw size={16} />
              Reload
            </button>
            <button
              type="button"
              onClick={() => setConfirmDialog("section")}
              disabled={busy || sectionTableRows.length === 0}
              style={btnDark}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={sectionGroupFilter}
              onChange={e => setSectionGroupFilter(e.target.value)}
              style={{ ...selectStyle, flex: "1 1 220px" }}
              aria-label="Filter by section or student type"
            >
              <option value="all">All Sections & Types ({sectionGroupCounts.all ?? 0})</option>
              <optgroup label="Sections">
                {availableSectionNames.map(sec => (
                  <option key={sec} value={sec}>{sec} ({sectionGroupCounts[sec] ?? 0})</option>
                ))}
              </optgroup>
              <optgroup label="Other Student Types">
                {STUDENT_TYPES.filter(t => t !== "Regular").map(type => (
                  <option key={type} value={type}>{type} ({sectionGroupCounts[type] ?? 0})</option>
                ))}
              </optgroup>
            </select>

            <select
              value={sectionTrackFilter}
              onChange={e => setSectionTrackFilter(e.target.value)}
              style={{ ...selectStyle, flex: "1 1 220px" }}
              aria-label="Filter by track or course"
            >
              <option value="all">All tracks (best track per student)</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.course_name}</option>
              ))}
            </select>

            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                placeholder="Search by name or LRN..."
                value={sectionSearch}
                onChange={e => setSectionSearch(e.target.value)}
                style={{ ...selectStyle, cursor: "text", paddingLeft: "36px" }}
              />
            </div>
          </div>
        </div>

        {!loading && sectionTrackFilter !== "all" && selectedTrackTop && (
          <div
            style={{
              backgroundColor: selectedTrackTop.highestScore !== null && selectedTrackTop.highestScore > 0 ? "#fefce8" : "#f9fafb",
              border: `1px solid ${selectedTrackTop.highestScore !== null && selectedTrackTop.highestScore > 0 ? "#fde047" : "#e5e7eb"}`,
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Award size={20} color={selectedTrackTop.highestScore !== null && selectedTrackTop.highestScore > 0 ? "#ca8a04" : "#9ca3af"} />
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Highest Score in {selectedTrackTop.courseName} — {sectionGroupFilter === "all" ? "All Sections" : sectionGroupFilter}
                </p>
                {selectedTrackTop.assessedCount === 0 || selectedTrackTop.highestScore === null ? (
                  <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                    No assessment scores recorded yet for this selection.
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#111827" }}>
                    {selectedTrackTop.topStudents.map(st =>
                      sectionGroupFilter === "all"
                        ? `${st.full_name} (${st.section || st.student_type || "—"})`
                        : st.full_name
                    ).join(", ")}
                  </p>
                )}
              </div>
            </div>
            {selectedTrackTop.highestScore !== null && (
              <span
                style={{
                  backgroundColor: selectedTrackTop.highestScore > 0 ? "#fef08a" : "#e5e7eb",
                  color: selectedTrackTop.highestScore > 0 ? "#854d0e" : "#374151",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "800",
                }}
              >
                {selectedTrackTop.highestScore} / {selectedTrackTop.totalItems}
              </span>
            )}
          </div>
        )}

        <div style={card}>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>
            Showing {sectionTableRows.length} of {sectionBaseStudents.length} student{sectionBaseStudents.length === 1 ? "" : "s"}
            {sectionGroupFilter !== "all" ? ` in ${sectionGroupFilter}` : ""}
          </p>

          {loading ? (
            <div className="table-responsive" style={{ marginBottom: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    {["Student Name", "LRN", "Student Type", "Section", "Track Score", "Status", "Enrolled Course"].map(h => (
                      <th key={h} style={{ ...thStyle, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRows columns={7} rows={6} />
                </tbody>
              </table>
            </div>
          ) : sectionTableRows.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "36px 0", margin: 0 }}>
              No students found for this section filter.
            </p>
          ) : (
            <div className="table-responsive" style={{ marginBottom: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "720px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    {(sectionTrackFilter === "all"
                      ? ["Student Name", "LRN", "Student Type", "Section", "Highest Track", "Total Score", "Enrolled Course"]
                      : ["Student Name", "LRN", "Student Type", "Section", `${courses.find(c => c.id === sectionTrackFilter)?.course_name || "Track"} Score`, "Status", "Enrolled Course"]
                    ).map(h => (
                      <th key={h} style={{ ...thStyle, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sectionTableRows.map((s, i) => {
                    const info = assessmentLookupByStudent.get(s.id)
                    const trackRec = sectionTrackFilter !== "all" ? info?.byCourse[sectionTrackFilter] : undefined
                    const isTopForSelectedTrack =
                      sectionTrackFilter !== "all" &&
                      !!trackRec &&
                      selectedTrackTop?.highestScore !== null &&
                      selectedTrackTop?.highestScore !== undefined &&
                      selectedTrackTop.highestScore > 0 &&
                      trackRec.score === selectedTrackTop.highestScore
                    const enrolledCourse = enrolledCourseByStudent.get(s.id)

                    return (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          backgroundColor: isTopForSelectedTrack ? "#fefce8" : i % 2 === 0 ? "white" : "#f9fafb",
                        }}
                      >
                        <td style={{ ...tdStyle, fontWeight: "600" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            {s.full_name}
                            {isTopForSelectedTrack && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  backgroundColor: "#fef08a",
                                  color: "#854d0e",
                                }}
                              >
                                Top Scorer
                              </span>
                            )}
                          </span>
                        </td>
                        <td style={tdStyle}>{s.lrn}</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                          {s.student_type ? (
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                ...getStudentTypeBadgeStyle(s.student_type),
                              }}
                            >
                              {s.student_type}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{s.section || "—"}</td>
                        {sectionTrackFilter === "all" ? (
                          <>
                            <td style={tdStyle}>
                              {info?.assessed && info.bestCourseNames.length > 0 ? (
                                <span>
                                  <strong>{info.bestCourseNames.join(", ")}</strong>{" "}
                                  <span style={{ color: "#2563eb", fontWeight: "700" }}>
                                    ({info.bestScore} / {info.bestTotal})
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: "#9ca3af", fontSize: "12px" }}>Not taken</span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, whiteSpace: "nowrap", fontWeight: "600" }}>
                              {info?.assessed ? `${info.totalScore} / ${info.totalItems}` : "—"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ ...tdStyle, whiteSpace: "nowrap", fontWeight: "700", color: trackRec ? "#111827" : "#9ca3af" }}>
                              {trackRec ? `${trackRec.score} / ${trackRec.total_items || QUESTIONS_PER_TRACK}` : "Not taken"}
                            </td>
                            <td style={tdStyle}>
                              {trackRec ? (
                                <span
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    backgroundColor: isPassingScore(trackRec.score, trackRec.total_items || QUESTIONS_PER_TRACK) ? "#f0fdf4" : "#fef2f2",
                                    color: isPassingScore(trackRec.score, trackRec.total_items || QUESTIONS_PER_TRACK) ? "#15803d" : "#dc2626",
                                  }}
                                >
                                  {isPassingScore(trackRec.score, trackRec.total_items || QUESTIONS_PER_TRACK) ? "Passed" : "Failed"}
                                </span>
                              ) : (
                                <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                              )}
                            </td>
                          </>
                        )}
                        <td style={{ ...tdStyle, fontWeight: enrolledCourse ? "600" : "400", color: enrolledCourse ? "#16a34a" : "#9ca3af" }}>
                          {enrolledCourse || "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ManageSectionsModal
          open={showManageSections}
          sections={sectionsList}
          usingFallback={sectionsUsingFallback}
          studentCountBySection={allStudentCountBySection}
          onClose={() => setShowManageSections(false)}
          onChanged={async () => {
            await fetchData()
          }}
        />

        {confirmDialogEl}
      </div>
    )
  }

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
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={() => void fetchData()} disabled={busy} style={btnOutline}>
            <RefreshCw size={16} />
            Reload
          </button>
          <button type="button" onClick={() => setSectionsPageOpen(true)} disabled={busy} style={btnOutline}>
            <GraduationCap size={16} />
            Sections
          </button>

          {/* Export specific track dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={busy || courses.length === 0}
              style={btnDark}
            >
              <Download size={16} />
              Export track
              <ChevronDown size={14} style={{ marginLeft: "2px", transition: "transform 0.2s", transform: showExportDropdown ? "rotate(180deg)" : "rotate(0)" }} />
            </button>

            {showExportDropdown && (
              <>
                {/* Invisible backdrop to close dropdown */}
                <div
                  onClick={() => setShowExportDropdown(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 998 }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    backgroundColor: "white",
                    borderRadius: "10px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    border: "1px solid #e5e7eb",
                    minWidth: "260px",
                    zIndex: 999,
                    overflow: "hidden",
                    animation: "dropdownIn 0.15s ease-out",
                  }}
                >
                  <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #f3f4f6" }}>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Select a track to export
                    </p>
                  </div>
                  <div style={{ maxHeight: "260px", overflowY: "auto", padding: "4px 0" }}>
                    {courses.map(course => {
                      const enrolled = filteredIncluded.filter(r => r.course_id === course.id).length
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            setExportTrackId(course.id)
                            setShowExportDropdown(false)
                            setConfirmDialog("track")
                          }}
                          disabled={enrolled === 0}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            padding: "10px 14px",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: enrolled > 0 ? "pointer" : "not-allowed",
                            fontSize: "14px",
                            color: enrolled > 0 ? "#1f2937" : "#d1d5db",
                            fontWeight: "500",
                            textAlign: "left",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={e => { if (enrolled > 0) e.currentTarget.style.backgroundColor = "#f3f4f6" }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent" }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <CourseIcon courseName={course.course_name} size={14} circleSize={26} />
                            {course.course_name}
                          </span>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            flexShrink: 0,
                            backgroundColor: enrolled > 0 ? "#f0fdf4" : "#f9fafb",
                            color: enrolled > 0 ? "#16a34a" : "#9ca3af",
                          }}>
                            {enrolled} student{enrolled !== 1 ? "s" : ""}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setConfirmDialog("all")}
            disabled={busy || filteredIncluded.length === 0}
            style={btnDark}
          >
            <Download size={16} />
            Export all tracks
          </button>
        </div>
      </div>

      <div style={{ ...card, marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <h3 style={{ fontWeight: "800", fontSize: "18px", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} />
              Course Slots and Enrolled Students
            </h3>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              See available slots for every course and open the enrolled student list below.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { label: "Total capacity", value: totalCapacity, color: "#2563eb" },
              { label: "Enrolled", value: totalEnrolled, color: "#16a34a" },
              { label: "Available slots", value: totalAvailable, color: "#f59e0b" },
            ].map(stat => (
              <div key={stat.label} style={miniStat}>
                <p style={{ margin: "0 0 2px", fontSize: "18px", fontWeight: "800", color: stat.color }}>{stat.value}</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", whiteSpace: "nowrap" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "680px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                  {["Course", "Capacity", "Enrolled", "Available slots", "Status", "Students"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows columns={6} rows={6} />
              </tbody>
            </table>
          </div>
        ) : courseSummaries.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "28px 0" }}>No courses found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "680px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                  {["Course", "Capacity", "Enrolled", "Available slots", "Status", "Students"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courseSummaries.map((course, i) => {
                  const isSelected = course.id === selectedCourse
                  const isFull = course.available === 0
                  return (
                    <tr
                      key={course.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        backgroundColor: isSelected ? "#eef2ff" : i % 2 === 0 ? "white" : "#f9fafb",
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: "700" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <CourseIcon courseName={course.course_name} size={15} circleSize={30} />
                          {course.course_name}
                        </span>
                      </td>
                      <td style={tdStyle}>{course.capacity}</td>
                      <td style={{ ...tdStyle, color: "#16a34a", fontWeight: "700" }}>{course.enrolled}</td>
                      <td style={{ ...tdStyle, color: isFull ? "#dc2626" : "#f59e0b", fontWeight: "700" }}>
                        {course.available}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          backgroundColor: isFull ? "#fef2f2" : "#f0fdf4",
                          color: isFull ? "#dc2626" : "#15803d",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}>
                          {isFull ? "Full" : "Open"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() => viewCourseStudents(course.id)}
                          style={isSelected ? btnSelectedSmall : btnSmall}
                        >
                          View students
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedCourse("")
          }}
          style={modalBackdrop}
        >
          <div style={modalPanel}>
          <div style={modalHeader}>
            <div>
            <h3 style={{ fontWeight: "800", fontSize: "20px", margin: "0 0 4px" }}>{selected.course_name}</h3>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              <span style={{ color: "#16a34a", fontWeight: "600" }}>{slotsFilled} enrolled</span>
              {" · "}
              {slotsOpen} slot{slotsOpen === 1 ? "" : "s"} open
              {" · "}
              Capacity {selected.capacity}
            </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCourse("")}
              style={iconButton}
              aria-label="Close enrolled students window"
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: "20px 24px" }}>

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
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  {["Student", "LRN", "School year", "Enrolled Course"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows columns={4} rows={5} />
              </tbody>
            </table>
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
                  {["Student", "LRN", "School year", "Enrolled Course"].map(h => (
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
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{r.students?.full_name || "—"}</td>
                    <td style={tdStyle}>{r.students?.lrn || "—"}</td>
                    <td style={tdStyle}>{r.students?.school_year || "—"}</td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{r.courses?.course_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </div>
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

      {confirmDialogEl}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
const miniStat: React.CSSProperties = {
  minWidth: "112px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
}
const modalBackdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(17, 24, 39, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
}
const modalPanel: React.CSSProperties = {
  width: "100%",
  maxWidth: "860px",
  maxHeight: "88vh",
  overflowY: "auto",
  backgroundColor: "white",
  borderRadius: "14px",
  boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
}
const modalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  padding: "22px 24px",
  borderBottom: "1px solid #e5e7eb",
  position: "sticky",
  top: 0,
  backgroundColor: "white",
  zIndex: 1,
}
const iconButton: React.CSSProperties = {
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
}
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
const btnSmall: React.CSSProperties = {
  padding: "7px 12px",
  backgroundColor: "white",
  color: "#374151",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "12px",
}
const btnSelectedSmall: React.CSSProperties = {
  ...btnSmall,
  backgroundColor: "#111827",
  color: "white",
  border: "1px solid #111827",
}
