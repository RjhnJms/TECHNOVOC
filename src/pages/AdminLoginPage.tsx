import { useState } from "react"
import { supabase } from "../supabaseClient"
import logo from "../assets/NAVS LOGO.svg"
import type { UserSession } from "../types/session"

interface Props {
  onLogin: (session: Extract<UserSession, { role: "admin" }>) => void
}

export default function AdminLoginPage({ onLogin }: Props) {
  const [adminName, setAdminName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAdminLogin = async () => {
    setError("")

    if (!adminName.trim() || !password) {
      setError("Please enter your admin name and password.")
      return
    }

    setLoading(true)

    const { data, error: err } = await supabase
      .from("admins")
      .select("*")
      .eq("admin_name", adminName.trim())
      .eq("password", password)
      .single()

    setLoading(false)

    if (err || !data) {
      setError("Invalid admin name or password.")
      return
    }

    onLogin({ role: "admin", name: data.admin_name })
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div style={{
            width: "100px", height: "100px", borderRadius: "50%",
            backgroundColor: "#f8f8ff", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <img src={logo} alt="NAVS Logo" width="96" height="96" />
          </div>
        </div>

        <h1 style={{ textAlign: "center", fontWeight: "800", fontSize: "22px", margin: "0 0 4px" }}>
          Admin Portal
        </h1>
        <p style={{ textAlign: "center", color: "#6b7280", margin: "0 0 24px", fontSize: "14px" }}>
          Authorized personnel only
        </p>

        {error && (
          <div style={{
            backgroundColor: "#fef2f2", color: "#dc2626",
            padding: "10px 14px", borderRadius: "8px",
            marginBottom: "16px", fontSize: "13px"
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Admin Name</label>
            <input
              placeholder="Enter admin name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              style={inputStyle}
              autoComplete="username"
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              style={inputStyle}
              autoComplete="current-password"
            />
          </div>
          <button
            onClick={handleAdminLogin}
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
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
  maxWidth: "400px",
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

const labelStyle: React.CSSProperties = {
  fontWeight: "600",
  fontSize: "14px",
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

