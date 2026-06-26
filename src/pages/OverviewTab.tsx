import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { isLabAccessCodeRequired } from "../utils/examAccessCode"
import { ClipboardList, CheckCircle2, Clock, GraduationCap, RefreshCw, Users } from "lucide-react"
import { SkeletonStatCard, SkeletonStatCardHorizontal } from "../components/Skeleton"
import { getStartYear } from "../utils/schoolYear"


interface OverviewStats {
  totalStudents: number
  totalAssessments: number
  qualified: number
  passingRate: number
  notYetAssessed: number
  availableSlots: number
  totalCapacity: number
  mostQualifiedCourse: string
  mostQualifiedCount: number
  totalEnrolled: number
  totalWaitlist: number
  courseBreakdown: { course_name: string; count: number; enrolled: number; waitlist: number; passRate: number }[]
  labCodesRequired: boolean
  notAssessedNeedCode: number
  notAssessedWithCode: number
}

interface AssessmentEntry {
  passed: boolean
  courses: { course_name: string } | { course_name: string }[] | null
}

interface RankEntry {
  status: string
  courses: { course_name: string } | { course_name: string }[] | null
}

interface Props {
  schoolYearFilter: string
}

export default function OverviewTab({ schoolYearFilter }: Props) {
  const [stats, setStats] = useState<OverviewStats>({
    totalStudents: 0,
    totalAssessments: 0,
    qualified: 0,
    passingRate: 0,
    notYetAssessed: 0,
    availableSlots: 0,
    totalCapacity: 0,
    mostQualifiedCourse: "—",
    mostQualifiedCount: 0,
    totalEnrolled: 0,
    totalWaitlist: 0,
    courseBreakdown: [],
    labCodesRequired: false,
    notAssessedNeedCode: 0,
    notAssessedWithCode: 0,
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  
  useEffect(() => {
    fetchStats()
  }, [schoolYearFilter])

  const fetchStats = async () => {
    setLoading(true)

    const filterYearStart = schoolYearFilter !== "all" ? getStartYear(schoolYearFilter) : Infinity

    const { data: studentsData } = await supabase
      .from("students")
      .select("id, school_year")

    const filteredStudents = (studentsData || []).filter(s => {
      if (schoolYearFilter === "all") return true
      const studentYearStart = s.school_year ? getStartYear(s.school_year) : 0
      return studentYearStart <= filterYearStart
    })

    const filteredStudentIds = new Set(filteredStudents.map(s => s.id))
    const totalStudents = filteredStudents.length

    const [{ data: assessmentData }, { data: rankData }, { data: allCourses }] = await Promise.all([
      supabase
        .from("assessments")
        .select("student_id, course_id, passed, courses(course_name)"),
      supabase
        .from("rankings")
        .select("student_id, course_id, status, courses(course_name)"),
      supabase
        .from("courses")
        .select("capacity"),
    ])

    const filteredAssessments = (assessmentData || []).filter(a => filteredStudentIds.has(a.student_id))
    const totalAssessments = new Set(filteredAssessments.map(a => a.student_id)).size

    const qualified = new Set(filteredAssessments.filter(a => a.passed).map(a => a.student_id)).size

    const assessedStudentIds = new Set(filteredAssessments.map(a => a.student_id))
    const notYetAssessed = totalStudents - assessedStudentIds.size

    const totalCapacity = allCourses?.reduce((sum, c) => sum + (c.capacity || 0), 0) || 0

    const passingRate = totalAssessments > 0
      ? Math.round((qualified / totalAssessments) * 100)
      : 0

    const filteredRankings = (rankData || []).filter(r => filteredStudentIds.has(r.student_id))
    const totalEnrolled = filteredRankings.filter(r => r.status === "included").length
    const totalWaitlist = filteredRankings.filter(r => r.status === "waitlist").length

    const courseMap: Record<string, { course_name: string; count: number; passed: number }> = {}
    filteredAssessments.forEach((a) => {
      const entry = a as unknown as AssessmentEntry
      let name = "Unknown"
      if (entry.courses) {
        if (Array.isArray(entry.courses)) {
          if (entry.courses.length > 0) name = entry.courses[0].course_name
        } else if (typeof entry.courses === "object") {
          name = (entry.courses as { course_name: string }).course_name || "Unknown"
        }
      }
      if (!courseMap[name]) courseMap[name] = { course_name: name, count: 0, passed: 0 }
      courseMap[name].count += 1
      if (entry.passed) courseMap[name].passed += 1
    })

    const enrolledMap: Record<string, number> = {}
    const waitlistMap: Record<string, number> = {}
    filteredRankings.forEach((r) => {
      const entry = r as unknown as RankEntry
      let name = "Unknown"
      if (entry.courses) {
        if (Array.isArray(entry.courses)) {
          if (entry.courses.length > 0) name = entry.courses[0].course_name
        } else if (typeof entry.courses === "object") {
          name = (entry.courses as { course_name: string }).course_name || "Unknown"
        }
      }
      if (entry.status === "included") enrolledMap[name] = (enrolledMap[name] || 0) + 1
      else if (entry.status === "waitlist") waitlistMap[name] = (waitlistMap[name] || 0) + 1
    })

    const courseBreakdown = Object.values(courseMap)
      .map(c => ({
        course_name: c.course_name,
        count: c.count,
        enrolled: enrolledMap[c.course_name] || 0,
        waitlist: waitlistMap[c.course_name] || 0,
        passRate: c.count > 0 ? Math.round((c.passed / c.count) * 100) : 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.course_name.localeCompare(b.course_name)
      })

    let mostQualifiedCourse = "—"
    let mostQualifiedCount = 0
    Object.values(courseMap).forEach(c => {
      if (c.course_name !== "Unknown" || Object.keys(courseMap).length === 1) {
        if (c.passed > mostQualifiedCount) {
          mostQualifiedCourse = c.course_name
          mostQualifiedCount = c.passed
        }
      }
    })
    if (mostQualifiedCount === 0 && Object.values(courseMap).length > 0) {
      const sortedByCount = Object.values(courseMap).sort((a, b) => b.count - a.count)
      mostQualifiedCourse = sortedByCount[0]?.course_name || "—"
    }

    const availableSlots = totalCapacity - totalEnrolled

    const labCodesRequired = await isLabAccessCodeRequired()
    let notAssessedNeedCode = 0
    let notAssessedWithCode = 0

    if (labCodesRequired && notYetAssessed > 0) {
      const { data: redemptions } = await supabase.from("exam_access_code_redemptions").select("student_id")
      const redeemedStudentIds = new Set((redemptions || []).map(r => r.student_id))
      for (const s of filteredStudents) {
        if (assessedStudentIds.has(s.id)) continue
        if (redeemedStudentIds.has(s.id)) notAssessedWithCode++
        else notAssessedNeedCode++
      }
    }

    setStats({
      totalStudents,
      totalAssessments,
      qualified,
      passingRate,
      notYetAssessed: notYetAssessed > 0 ? notYetAssessed : 0,
      availableSlots: availableSlots > 0 ? availableSlots : 0,
      totalCapacity,
      mostQualifiedCourse,
      mostQualifiedCount,
      totalEnrolled,
      totalWaitlist,
      courseBreakdown,
      labCodesRequired,
      notAssessedNeedCode,
      notAssessedWithCode,
    })

    setLastUpdated(new Date().toLocaleTimeString())
    setLoading(false)
  }

  const notYetAssessedSub = () => {
    if (!stats.labCodesRequired || stats.notYetAssessed === 0) {
      return "haven't taken assessment"
    }
    if (stats.notAssessedWithCode > 0 && stats.notAssessedNeedCode > 0) {
      return `${stats.notAssessedWithCode} redeemed batch code · ${stats.notAssessedNeedCode} need code`
    }
    if (stats.notAssessedNeedCode > 0) {
      return `${stats.notAssessedNeedCode} need batch code in Settings`
    }
    return `${stats.notAssessedWithCode} have batch code ready`
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontWeight: "700", fontSize: "22px", margin: "0 0 4px" }}>Dashboard Overview</h2>
          <p style={{ color: "#6b7280", margin: 0, fontSize: "13px" }}>
            {lastUpdated ? `Last updated: ${lastUpdated}` : "Loading live data..."}
            {!loading && (
              <span style={{ color: "#9ca3af" }}>
                {" · "}
                Lab codes {stats.labCodesRequired ? "on" : "off"}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          style={{ padding: "10px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={16} />
            {loading ? "Loading..." : "Refresh"}
          </span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {loading ? (
          <>{[0,1,2].map(i => <SkeletonStatCard key={i} />)}</>
        ) : [
          { label: "Total Students", value: stats.totalStudents, icon: <Users size={22} />, color: "#2563eb", bg: "#eff6ff", sub: "registered students" },
          { label: "Not Yet Assessed", value: stats.notYetAssessed, icon: <ClipboardList size={22} />, color: "#dc2626", bg: "#fef2f2", sub: notYetAssessedSub() },
          { label: "Available Slots", value: stats.availableSlots, icon: <CheckCircle2 size={22} />, color: "#16a34a", bg: "#f0fdf4", sub: `of ${stats.totalCapacity} total capacity` },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: stat.bg, borderRadius: "14px", padding: "20px", border: `1px solid ${stat.color}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: 0, fontWeight: "600" }}>{stat.label}</p>
              <span>{stat.icon}</span>
            </div>
            <h2 style={{ color: stat.color, fontSize: "30px", margin: "0 0 4px", fontWeight: "800", lineHeight: 1.1 }}>
              {stat.value}
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {loading ? (
          <>{[0,1,2].map(i => <SkeletonStatCardHorizontal key={i} />)}</>
        ) : [
          { label: "Students Assessed", value: stats.totalAssessments, icon: <ClipboardList size={22} />, color: "#0891b2" },
          { label: "Qualified", value: stats.totalEnrolled, icon: <GraduationCap size={22} />, color: "#16a34a" },
          { label: "On Waitlist", value: stats.totalWaitlist, icon: <Clock size={22} />, color: "#f59e0b" },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 4px" }}>{stat.label}</p>
              <h3 style={{ color: stat.color, fontSize: "24px", margin: 0, fontWeight: "800" }}>
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
