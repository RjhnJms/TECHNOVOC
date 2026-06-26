/**
 * Utility functions for handling school years dynamically and scalably.
 */

/**
 * Extracts the start year as a number from a school year string (e.g. "2023-2024" -> 2023).
 * If the format is invalid, returns 0.
 */
export function getStartYear(sy: string): number {
  if (!sy) return 0
  const match = sy.match(/(\d{4})/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Returns the school year string corresponding to a given Date (defaults to now).
 * Assumes a school year starts in June (month index 5).
 */
export function getSchoolYearFromDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed: 0 = Jan, 5 = Jun
  const startYear = month >= 5 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

/**
 * Generates a list of school years starting from a base year up to the current date's school year
 * plus a specified number of buffer years (useful for future registrations).
 * Returns the list in ascending order (e.g. ["2023-2024", "2024-2025", ...]).
 */
export function generateSchoolYears(baseStartYear: number = 2023, bufferYears: number = 1): string[] {
  const currentSy = getSchoolYearFromDate()
  const currentStart = getStartYear(currentSy)
  const endYear = Math.max(currentStart + bufferYears, baseStartYear)
  const years: string[] = []
  for (let y = baseStartYear; y <= endYear; y++) {
    years.push(`${y}-${y + 1}`)
  }
  return years
}
