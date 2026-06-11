import type { UserSession } from "../types/session"

const SESSION_KEY = "user_session"

function isUserSession(value: unknown): value is UserSession {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  if (v.role === "admin") return typeof v.name === "string" && v.name.length > 0
  if (v.role === "student") {
    return typeof v.id === "string" && v.id.length > 0 && typeof v.name === "string" && v.name.length > 0
  }
  return false
}

export function loadUserSession(): UserSession | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem(SESSION_KEY)
      if (!raw) continue
      const parsed: unknown = JSON.parse(raw)
      if (isUserSession(parsed)) return parsed
    } catch {
      /* try next storage */
    }
  }
  return null
}

export function saveUserSession(session: UserSession | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    return
  }

  const raw = JSON.stringify(session)
  try {
    localStorage.setItem(SESSION_KEY, raw)
  } catch (err) {
    console.warn("Could not persist login to localStorage (storage may be full):", err)
  }
  try {
    sessionStorage.setItem(SESSION_KEY, raw)
  } catch (err) {
    console.warn("Could not persist login to sessionStorage:", err)
  }
}
