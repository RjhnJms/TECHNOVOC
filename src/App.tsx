import { useCallback, useState, type ReactNode } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminLoginPage from "./pages/AdminLoginPage"
import AdminDashboard from "./pages/AdminDashboard"
import StudentDashboard from "./pages/StudentDashboard"
import type { UserSession } from "./types/session"
import { loadUserSession, saveUserSession } from "./utils/userSession"

function RequireStudent({ session, children }: {
  session: UserSession | null
  children: (s: Extract<UserSession, { role: "student" }>) => ReactNode
}) {
  if (session?.role !== "student") {
    return <Navigate to="/" replace />
  }
  return <>{children(session)}</>
}

function RequireAdmin({ session, children }: {
  session: UserSession | null
  children: (s: Extract<UserSession, { role: "admin" }>) => ReactNode
}) {
  if (session?.role !== "admin") {
    return <Navigate to="/admin" replace />
  }
  return <>{children(session)}</>
}

function AppRoutes() {
  const [session, setSessionState] = useState<UserSession | null>(loadUserSession)
  const navigate = useNavigate()

  const setSession = useCallback((newSession: UserSession | null) => {
    setSessionState(newSession)
    saveUserSession(newSession)
  }, [])

  return (
    <Routes>
      <Route
        path="/"
        element={
          session?.role === "student"
            ? <Navigate to="/student" replace />
            : <LoginPage onLogin={s => {
                setSession(s)
                navigate("/student", { replace: true })
              }} />
        }
      />
      <Route
        path="/admin"
        element={
          session?.role === "admin"
            ? <Navigate to="/admin/dashboard" replace />
            : <AdminLoginPage onLogin={s => {
                setSession(s)
                navigate("/admin/dashboard", { replace: true })
              }} />
        }
      />
      <Route
        path="/student"
        element={
          <RequireStudent session={session}>
            {s => (
              <StudentDashboard
                studentId={s.id}
                studentName={s.name}
                onLogout={() => {
                  setSession(null)
                  navigate("/", { replace: true })
                }}
              />
            )}
          </RequireStudent>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin session={session}>
            {s => (
              <AdminDashboard
                adminName={s.name}
                onLogout={() => {
                  setSession(null)
                  navigate("/admin", { replace: true })
                }}
              />
            )}
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
