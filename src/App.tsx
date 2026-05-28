import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import type { UserSession } from './types/session'

function AppRoutes() {
  const [session, setSessionState] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('user_session')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      console.error("Failed to parse user session:", e)
      return null
    }
  })

  const setSession = (newSession: UserSession | null) => {
    setSessionState(newSession)
    if (newSession) {
      localStorage.setItem('user_session', JSON.stringify(newSession))
    } else {
      localStorage.removeItem('user_session')
    }
  }

  const navigate = useNavigate()

  if (session?.role === 'admin') {
    return (
      <AdminDashboard
        adminName={session.name}
        onLogout={() => {
          setSession(null)
          navigate('/admin', { replace: true })
        }}
      />
    )
  }

  if (session?.role === 'student') {
    return (
      <StudentDashboard
        studentId={session.id}
        studentName={session.name}
        onLogout={() => {
          setSession(null)
          navigate('/', { replace: true })
        }}
      />
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={setSession} />} />
      <Route path="/admin" element={<AdminLoginPage onLogin={setSession} />} />
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
