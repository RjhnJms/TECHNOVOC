import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import ResultsTab from "./ResultsTab"
import CoursesTab from "./CoursesTab"
import OverviewTab from "./OverviewTab"
import SettingsTab from "./SettingsTab"
import ReportsTab from "./ReportsTab"
import StudentDetailModal from "./StudentDetailModal"
import { BarChart3, BookOpen, Trophy, Settings, FileText } from "lucide-react"
import { generateSchoolYears } from "../utils/schoolYear"


interface Props {
  adminName: string
  onLogout: () => void
}

type Tab = "overview" | "courses" | "results" | "reports" | "settings"

const NAVS_COURSES = [
  "Automotive",
  "Agriculture",
  "Beauty Care",
  "Carpentry",
  "Dressmaking",
  "Drafting",
  "Electricity",
  "Electronics",
  "Food Tech",
  "ICT",
  "SMAW",
] as const

const normalizeCourseName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "")

interface Student {
  id: string
  full_name: string
  lrn: string
  school_year: string
  created_at: string
}

export default function AdminDashboard({ adminName, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [schoolYears, setSchoolYears] = useState<string[]>([])
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>("all")

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    const [{ data: initialCourses }, { data: studentsData }] = await Promise.all([
      supabase.from("courses").select("*"),
      supabase.from("students").select("school_year"),
    ])

    const existingCourseKeys = new Set((initialCourses || []).map(c => normalizeCourseName(c.course_name)))
    const missingCourses = NAVS_COURSES.filter(
      courseName => !existingCourseKeys.has(normalizeCourseName(courseName))
    ).map(course_name => ({ course_name, capacity: 70 }))

    if (missingCourses.length > 0) {
      await supabase.from("courses").insert(missingCourses)
    }

    const dbYears = studentsData ? studentsData.map(s => s.school_year).filter(Boolean) : []
    const generatedYears = generateSchoolYears(2023, 1)
    const allYears = [...new Set([...dbYears, ...generatedYears])].sort((a, b) => b.localeCompare(a))
    setSchoolYears(allYears)

  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Dashboard", icon: <BarChart3 size={16} /> },
    { key: "courses", label: "Course Management", icon: <BookOpen size={16} /> },
    { key: "results", label: "Results", icon: <Trophy size={16} /> },
    { key: "reports", label: "Reports", icon: <FileText size={16} /> },
    { key: "settings", label: "Settings", icon: <Settings size={16} /> },
  ]

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", width: "100%", boxSizing: "border-box" }}>
      <div className="admin-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>TECHNO-VOC Admin Dashboard</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Welcome, {adminName}</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={schoolYearFilter}
            onChange={e => setSchoolYearFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "14px",
              backgroundColor: "white",
              fontWeight: "600",
              outline: "none",
            }}
          >
            <option value="all">All School Years</option>
            {schoolYears.map(sy => (
              <option key={sy} value={sy}>{sy} & prior</option>
            ))}
          </select>
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
              backgroundColor: "white",
              fontWeight: "600",
            }}
          >
            ↪ Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 20px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              backgroundColor: activeTab === tab.key ? "#111827" : "transparent",
              color: activeTab === tab.key ? "white" : "#6b7280",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === "overview" && <OverviewTab schoolYearFilter={schoolYearFilter} />}
        {activeTab === "courses" && <CoursesTab />}
        {activeTab === "results" && <ResultsTab schoolYearFilter={schoolYearFilter} />}
        {activeTab === "reports" && <ReportsTab schoolYearFilter={schoolYearFilter} />}
        {activeTab === "settings" && <SettingsTab />}
      </div>

      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  )
}
