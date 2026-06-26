import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import ResultsTab from "./ResultsTab"
import CoursesTab from "./CoursesTab"
import OverviewTab from "./OverviewTab"
import SettingsTab from "./SettingsTab"
import ReportsTab from "./ReportsTab"
import StudentDetailModal from "./StudentDetailModal"
import { BarChart3, BookOpen, Trophy, Settings, FileText } from "lucide-react"

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

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    const { data: initialCourses } = await supabase.from("courses").select("*")

    const existingCourseKeys = new Set((initialCourses || []).map(c => normalizeCourseName(c.course_name)))
    const missingCourses = NAVS_COURSES.filter(
      courseName => !existingCourseKeys.has(normalizeCourseName(courseName))
    ).map(course_name => ({ course_name, capacity: 70 }))

    if (missingCourses.length > 0) {
      await supabase.from("courses").insert(missingCourses)
    }
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
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "courses" && <CoursesTab />}
        {activeTab === "results" && <ResultsTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>

      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  )
}
