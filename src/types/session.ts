export type UserSession =
  | { role: "admin"; name: string }
  | { role: "student"; id: string; name: string }
