import { useState } from "react"
import { supabase } from "../supabaseClient"
import logo from "../assets/NAVS LOGO.svg"
import type { UserSession } from "../types/session"
import { generateSchoolYears, getSchoolYearFromDate, getStartYear } from "../utils/schoolYear"

const schoolYearOptions = generateSchoolYears(2023, 1).reverse()


type StudentMode = "login" | "signup"

interface Props {
  onLogin: (session: Extract<UserSession, { role: "student" }>) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [studentMode, setStudentMode] = useState<StudentMode>("login")

  // Student fields
  const [fullName, setFullName] = useState("")
  const [studentLRN, setStudentLRN] = useState("")
  const [schoolYear, setSchoolYear] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<{
    fullName?: string
    studentLRN?: string
    schoolYear?: string
  }>({})
  const [showSignupSuccess, setShowSignupSuccess] = useState(false)

  const resetMessages = () => {
    setError("")
    setErrors({})
  }

  const switchStudentMode = (mode: StudentMode) => {
    setStudentMode(mode)
    resetMessages()
  }

  const handleFullNameChange = (val: string) => {
    // Restrict input to letters, spaces, dots, hyphens, and single quotes
    if (/^[A-Za-z\s.,'-]*$/.test(val)) {
      setFullName(val)
      if (errors.fullName) {
        setErrors(prev => ({ ...prev, fullName: undefined }))
      }
    }
  }

  const handleStudentLRNChange = (val: string) => {
    // Restrict input to digits only and max 12 characters
    if (/^\d*$/.test(val) && val.length <= 12) {
      setStudentLRN(val)
      if (errors.studentLRN) {
        setErrors(prev => ({ ...prev, studentLRN: undefined }))
      }
    }
  }

  const handleSchoolYearChange = (val: string) => {
    setSchoolYear(val)
    if (errors.schoolYear) {
      setErrors(prev => ({ ...prev, schoolYear: undefined }))
    }
  }

  // ── STUDENT LOGIN (LRN only) ───────────────────────
  const handleStudentLogin = async () => {
    resetMessages()

    const newErrors: typeof errors = {}
    if (!studentLRN.trim()) {
      newErrors.studentLRN = "Please enter your LRN."
    } else if (!/^\d+$/.test(studentLRN.trim())) {
      newErrors.studentLRN = "LRN must consist of numbers only."
    } else if (studentLRN.trim().length > 12) {
      newErrors.studentLRN = "LRN cannot exceed 12 digits."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    const { data: student, error: fetchError } = await supabase
      .from("students")
      .select("id, full_name")
      .eq("lrn", studentLRN.trim())
      .single()

    setLoading(false)

    if (fetchError || !student) {
      setError("LRN not found. Please sign up first.")
      return
    }

    onLogin({ role: "student", id: student.id, name: student.full_name })
  }

  // ── STUDENT SIGNUP ─────────────────────────────────
  const handleStudentSignup = async () => {
    resetMessages()

    const newErrors: typeof errors = {}

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required."
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters."
    } else if (!/^[A-Za-z\s.,'-]+$/.test(fullName.trim())) {
      newErrors.fullName = "Full name must contain letters and spaces only."
    }

    if (!studentLRN.trim()) {
      newErrors.studentLRN = "LRN is required."
    } else if (!/^\d+$/.test(studentLRN.trim())) {
      newErrors.studentLRN = "LRN must consist of numbers only."
    } else if (studentLRN.trim().length > 12) {
      newErrors.studentLRN = "LRN cannot exceed 12 digits."
    }

    if (!schoolYear) {
      newErrors.schoolYear = "Please select your school year."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("lrn", studentLRN.trim())
      .single()

    if (existing) {
      setLoading(false)
      setError("This LRN is already registered. Please log in instead.")
      return
    }

    const { data: newStudent, error: insertError } = await supabase
      .from("students")
      .insert([{
        full_name: fullName.trim(),
        lrn: studentLRN.trim(),
        school_year: schoolYear,
        phone_number: "",
      }])
      .select("id, full_name")
      .single()

    setLoading(false)

    if (insertError || !newStudent) {
      setError("Failed to sign up: " + (insertError?.message || "Unknown error"))
      return
    }

    const registeredLRN = studentLRN.trim()
    setFullName("")
    setSchoolYear("")
    setStudentLRN(registeredLRN)
    setStudentMode("login")
    setShowSignupSuccess(true)
  }

  const handleSignupSuccessClose = () => {
    setShowSignupSuccess(false)
    setStudentMode("login")
  }

  return (
    <div style={containerStyle}>
      <div className="login-card" style={cardStyle}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div style={{
            width: "122px", height: "122px", borderRadius: "50%",
            backgroundColor: "#f8f8ff", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <img src={logo} alt="NAVS Logo" width="120" height="120" />
          </div>
        </div>

        {/* Title */}
        <h1 style={{ textAlign: "center", fontWeight: "800", fontSize: "24px", margin: "0 0 4px" }}>
          TECHNO-VOC
        </h1>
        <p style={{ textAlign: "center", color: "#6b7280", margin: "0 0 4px", fontSize: "14px" }}>
          Assessment for TVE Strands
        </p>
        <p style={{ textAlign: "center", color: "#6b7280", margin: "0 0 24px", fontSize: "14px" }}>
          Northern Antique Vocational School - NAVS
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: "#fef2f2", color: "#dc2626",
            padding: "10px 14px", borderRadius: "8px",
            marginBottom: "16px", fontSize: "13px"
          }}>
            {error}
          </div>
        )}

        {/* Login / Sign Up toggle */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "8px", marginBottom: "20px",
          border: "1px solid #e5e7eb", borderRadius: "10px", padding: "3px"
        }}>
          <button
            onClick={() => switchStudentMode("login")}
            style={{
              padding: "8px", borderRadius: "7px", border: "none",
              cursor: "pointer", fontWeight: "600", fontSize: "14px",
              backgroundColor: studentMode === "login" ? "#eff6ff" : "transparent",
              color: studentMode === "login" ? "#1d4ed8" : "#6b7280",
            }}
          >
            Login
          </button>
          <button
            onClick={() => switchStudentMode("signup")}
            style={{
              padding: "8px", borderRadius: "7px", border: "none",
              cursor: "pointer", fontWeight: "600", fontSize: "14px",
              backgroundColor: studentMode === "signup" ? "#eff6ff" : "transparent",
              color: studentMode === "signup" ? "#1d4ed8" : "#6b7280",
            }}
          >
            Sign Up
          </button>
        </div>

        {studentMode === "login" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontWeight: "600", fontSize: "14px" }}>Student LRN</label>
              <input
                placeholder="Enter your LRN to log in"
                value={studentLRN}
                onChange={(e) => handleStudentLRNChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStudentLogin()}
                style={{
                  ...inputStyle,
                  borderColor: errors.studentLRN ? "#dc2626" : "#e5e7eb",
                  backgroundColor: errors.studentLRN ? "#fef2f2" : "#f9fafb",
                }}
              />
              {errors.studentLRN && (
                <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.studentLRN}
                </p>
              )}
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                Use the LRN you registered with
              </p>
            </div>
            <button
              onClick={handleStudentLogin}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: 0 }}>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchStudentMode("signup")}
                style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", padding: 0, fontSize: "13px" }}
              >
                Sign up here
              </button>
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontWeight: "600", fontSize: "14px" }}>Full Name</label>
              <input
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.fullName ? "#dc2626" : "#e5e7eb",
                  backgroundColor: errors.fullName ? "#fef2f2" : "#f9fafb",
                }}
              />
              {errors.fullName && (
                <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.fullName}
                </p>
              )}
            </div>
            <div>
              <label style={{ fontWeight: "600", fontSize: "14px" }}>Student LRN</label>
              <input
                placeholder="Enter your student LRN"
                value={studentLRN}
                onChange={(e) => handleStudentLRNChange(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.studentLRN ? "#dc2626" : "#e5e7eb",
                  backgroundColor: errors.studentLRN ? "#fef2f2" : "#f9fafb",
                }}
              />
              {errors.studentLRN && (
                <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.studentLRN}
                </p>
              )}
            </div>
            <div>
              <label style={{ fontWeight: "600", fontSize: "14px" }}>School Year</label>
              <select
                value={schoolYear}
                onChange={(e) => handleSchoolYearChange(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.schoolYear ? "#dc2626" : "#e5e7eb",
                  backgroundColor: errors.schoolYear ? "#fef2f2" : "#f9fafb",
                }}
              >
                <option value="">Select your school year</option>
                {schoolYearOptions.map((sy) => (
                  <option key={sy} value={sy}>
                    {sy}
                  </option>
                ))}
              </select>
              {errors.schoolYear && (
                <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.schoolYear}
                </p>
              )}
            </div>
            <button
              onClick={handleStudentSignup}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: 0 }}>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => switchStudentMode("login")}
                style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", padding: 0, fontSize: "13px" }}
              >
                Log in with LRN
              </button>
            </p>
          </div>
        )}
      </div>

      {showSignupSuccess && (
        <div style={modalOverlayStyle} onClick={handleSignupSuccessClose}>
          <div
            style={modalCardStyle}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-success-title"
          >
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              backgroundColor: "#dcfce7", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: "28px", color: "#16a34a"
            }}>
              ✓
            </div>
            <h2
              id="signup-success-title"
              style={{ textAlign: "center", fontWeight: "700", fontSize: "20px", margin: "0 0 8px" }}
            >
              Account Created Successfully
            </h2>
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: "14px", margin: "0 0 24px", lineHeight: 1.5 }}>
              Your account has been registered. Please log in using your LRN to start the assessment.
            </p>
            <button onClick={handleSignupSuccessClose} style={buttonStyle}>
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


const containerStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "100vh",
  backgroundColor: "#e8eef7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 16px",
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "20px",
  padding: "40px",
  width: "100%",
  maxWidth: "420px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  fontSize: "14px",
  marginTop: "6px",
  outline: "none",
  boxSizing: "border-box",
}

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#111827",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "8px",
}

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 1000,
}

const modalCardStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "16px",
  padding: "32px 28px",
  width: "100%",
  maxWidth: "360px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
}

