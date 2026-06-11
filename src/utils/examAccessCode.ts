import { supabase } from "../supabaseClient"

const SETTINGS_KEY = "require_lab_access_code"
const CODE_LENGTH = 8
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
export const DEFAULT_BATCH_SIZE = 20

export interface ExamAccessCodeRow {
  id: string
  code: string
  max_uses: number
  created_at: string
  redemption_count?: number
}

export type LabCodeUsageStatus = "active" | "completed"

export interface LabCodeUsageRow {
  redemption_id: string
  student_id: string
  student_name: string
  lrn: string
  school_year: string
  code: string
  code_id: string
  used_at: string
  /** Active = redeemed code and assessment not yet submitted. */
  status: LabCodeUsageStatus
}

function randomCode(): string {
  let out = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return out
}

export async function isLabAccessCodeRequired(): Promise<boolean> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle()

  if (error) {
    console.warn("Could not load lab access setting:", error.message)
    return false
  }
  return data?.value === "true"
}

export async function setLabAccessCodeRequired(required: boolean): Promise<string | null> {
  const { error } = await supabase
    .from("system_settings")
    .upsert({
      key: SETTINGS_KEY,
      value: required ? "true" : "false",
      updated_at: new Date().toISOString(),
    })

  return error?.message ?? null
}

export async function fetchLabCodeUsage(): Promise<LabCodeUsageRow[]> {
  const { data: redemptions, error } = await supabase
    .from("exam_access_code_redemptions")
    .select(`
      id,
      used_at,
      student_id,
      code_id,
      students ( full_name, lrn, school_year ),
      exam_access_codes ( code )
    `)
    .order("used_at", { ascending: false })

  if (error) {
    console.warn("Could not load lab code usage:", error.message)
    return []
  }
  if (!redemptions?.length) return []

  const studentIds = [...new Set(redemptions.map(r => r.student_id))]
  const { data: assessments } = await supabase
    .from("assessments")
    .select("student_id")
    .in("student_id", studentIds)

  const assessedStudentIds = new Set((assessments || []).map(a => a.student_id))

  return redemptions.map(row => {
    const student = row.students as { full_name?: string; lrn?: string; school_year?: string } | null
    const codeRow = row.exam_access_codes as { code?: string } | null
    const studentId = row.student_id as string

    return {
      redemption_id: row.id as string,
      student_id: studentId,
      student_name: student?.full_name ?? "Unknown",
      lrn: student?.lrn ?? "—",
      school_year: student?.school_year ?? "—",
      code: codeRow?.code ?? "—",
      code_id: row.code_id as string,
      used_at: row.used_at as string,
      status: assessedStudentIds.has(studentId) ? "completed" : "active",
    }
  })
}

export async function fetchExamAccessCodes(): Promise<ExamAccessCodeRow[]> {
  const { data: codes, error } = await supabase
    .from("exam_access_codes")
    .select("id, code, max_uses, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.warn("Could not load exam access codes:", error.message)
    return []
  }

  const { data: redemptions } = await supabase
    .from("exam_access_code_redemptions")
    .select("code_id")

  const countByCode = new Map<string, number>()
  for (const r of redemptions || []) {
    countByCode.set(r.code_id, (countByCode.get(r.code_id) || 0) + 1)
  }

  return (codes || []).map(row => ({
    ...row,
    redemption_count: countByCode.get(row.id) || 0,
  }))
}

export async function generateBatchCode(
  maxUses: number = DEFAULT_BATCH_SIZE
): Promise<{ code: string } | { error: string }> {
  const size = Math.max(1, Math.min(100, Math.floor(maxUses)))

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode()
    const { error } = await supabase.from("exam_access_codes").insert({
      code,
      max_uses: size,
    })

    if (!error) return { code }

    if (error.code === "23505" && error.message.includes("exam_access_codes_code")) {
      continue
    }
    return { error: error.message }
  }
  return { error: "Could not generate a unique code. Please try again." }
}

export async function revokeBatchCode(codeId: string): Promise<string | null> {
  const { error } = await supabase.from("exam_access_codes").delete().eq("id", codeId)
  return error?.message ?? null
}

export async function studentHasUnusedBatchSlot(studentId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("exam_access_code_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)

  if (error) return false
  return (count || 0) === 0
}

const verifiedStorageKey = (studentId: string) => `lab_code_verified_${studentId}`

export function isLabCodeVerifiedLocally(studentId: string): boolean {
  return sessionStorage.getItem(verifiedStorageKey(studentId)) === "1"
}

export function setLabCodeVerifiedLocally(studentId: string): void {
  sessionStorage.setItem(verifiedStorageKey(studentId), "1")
}

export function clearLabCodeVerifiedLocally(studentId: string): void {
  sessionStorage.removeItem(verifiedStorageKey(studentId))
}

export async function validateLabCodeForStudent(
  studentId: string,
  rawCode: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const code = rawCode.trim().toUpperCase()
  if (!code) {
    return { ok: false, message: "Please enter your laboratory access code." }
  }

  const { data: codeRow, error } = await supabase
    .from("exam_access_codes")
    .select("id, max_uses")
    .eq("code", code)
    .maybeSingle()

  if (error) {
    return { ok: false, message: "Could not verify the code. Please try again." }
  }
  if (!codeRow) {
    return { ok: false, message: "Invalid access code. Ask your teacher for the batch code issued in the laboratory." }
  }

  const { count: useCount, error: countError } = await supabase
    .from("exam_access_code_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("code_id", codeRow.id)

  if (countError) {
    return { ok: false, message: "Could not verify the code. Please try again." }
  }

  if ((useCount || 0) >= codeRow.max_uses) {
    return { ok: false, message: "This batch code has reached its student limit. Ask your teacher for a new code." }
  }

  const { data: existing } = await supabase
    .from("exam_access_code_redemptions")
    .select("id")
    .eq("code_id", codeRow.id)
    .eq("student_id", studentId)
    .maybeSingle()

  if (existing) {
    return { ok: true }
  }

  return { ok: true }
}

export async function redeemLabCodeForStudent(
  studentId: string,
  rawCode: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const code = rawCode.trim().toUpperCase()
  const check = await validateLabCodeForStudent(studentId, code)
  if (!check.ok) return check

  const { data: codeRow } = await supabase
    .from("exam_access_codes")
    .select("id, max_uses")
    .eq("code", code)
    .maybeSingle()

  if (!codeRow) {
    return { ok: false, message: "Invalid access code." }
  }

  const { data: existing } = await supabase
    .from("exam_access_code_redemptions")
    .select("id")
    .eq("code_id", codeRow.id)
    .eq("student_id", studentId)
    .maybeSingle()

  if (existing) {
    clearLabCodeVerifiedLocally(studentId)
    return { ok: true }
  }

  const { count: useCount } = await supabase
    .from("exam_access_code_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("code_id", codeRow.id)

  if ((useCount || 0) >= codeRow.max_uses) {
    return { ok: false, message: "This batch code has reached its student limit." }
  }

  const { error } = await supabase.from("exam_access_code_redemptions").insert({
    code_id: codeRow.id,
    student_id: studentId,
    used_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === "23505") {
      clearLabCodeVerifiedLocally(studentId)
      return { ok: true }
    }
    return { ok: false, message: "Could not activate the code. Please try again." }
  }

  clearLabCodeVerifiedLocally(studentId)
  return { ok: true }
}
