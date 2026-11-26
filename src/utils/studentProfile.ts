import type { CSSProperties } from "react"

export const STUDENT_SECTIONS = [
  "Amity",
  "Courtesy",
  "Dharma",
  "Faith",
  "Honesty",
  "Integrity",
  "Joy",
  "Kindness",
  "Loyalty",
  "Obedience",
] as const

export const STUDENT_TYPES = [
  "Regular",
  "Transferee",
  "Balik Skwela",
] as const

export type StudentSection = (typeof STUDENT_SECTIONS)[number]
export type StudentType = (typeof STUDENT_TYPES)[number]

export function getStudentTypeBadgeStyle(studentType?: string | null): CSSProperties {
  switch (studentType) {
    case "Transferee":
      return { backgroundColor: "#fef3c7", color: "#b45309", fontWeight: "700" }
    case "Balik Skwela":
      return { backgroundColor: "#ede9fe", color: "#6d28d9", fontWeight: "700" }
    case "Regular":
    default:
      return { backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: "600" }
  }
}
