import type { CSSProperties } from "react"
import { supabase } from "../supabaseClient"

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

export interface SectionRow {
  id: string
  name: string
  isFallback?: boolean
}

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

function fallbackSections(): SectionRow[] {
  return STUDENT_SECTIONS.map(name => ({ id: name, name, isFallback: true }))
}

export async function fetchSections(): Promise<{ sections: SectionRow[]; usingFallback: boolean }> {
  const { data, error } = await supabase
    .from("sections")
    .select("id, name")
    .order("name", { ascending: true })

  if (error || !data) {
    return { sections: fallbackSections(), usingFallback: true }
  }

  return {
    sections: data.map(row => ({ id: row.id as string, name: row.name as string })),
    usingFallback: false,
  }
}
