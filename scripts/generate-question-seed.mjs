#!/usr/bin/env node
/**
 * Generates supabase/seed_navs_questions.sql from scripts/navsQuestionBank.mjs
 * Run: node scripts/generate-question-seed.mjs
 */
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { NAVS_QUESTION_BANK, allCourses } from "./navsQuestionBank.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

/** PostgreSQL dollar-quoting avoids broken strings from commas and apostrophes. */
function dollarQuote(text, preferredTag = "t") {
  let tag = preferredTag
  let n = 0
  while (text.includes(`$${tag}$`)) {
    n += 1
    tag = `${preferredTag}${n}`
  }
  return `$${tag}$${text}$${tag}$`
}

const courseList = allCourses()
  .map(c => dollarQuote(c, "c"))
  .join(", ")

const lines = [
  "-- NAVS TECHNO-VOC question bank seed",
  "-- 11 courses x 20 questions (10 pre-skilled + 10 aptitude) = 220 in bank",
  "-- Each student exam: 10 random per course x 11 courses = 110 items",
  "--",
  "-- Run in Supabase SQL Editor after courses exist.",
  "",
  `DELETE FROM questions WHERE course_id IN (`,
  `  SELECT id FROM courses WHERE course_name IN (${courseList})`,
  `);`,
  "",
]

let tagCounter = 0
function nextTag() {
  tagCounter += 1
  return `v${tagCounter}`
}

for (const courseName of allCourses()) {
  const items = NAVS_QUESTION_BANK[courseName]
  lines.push(`-- ${courseName} (${items.length} questions)`)
  const courseLit = dollarQuote(courseName, "course")

  for (const item of items) {
    const [oa, ob, oc, od] = item.options
    const correct = ["Option A", "Option B", "Option C", "Option D"][item.correct]
    const t = nextTag()

    lines.push(`INSERT INTO questions (question_text, course_id, type, option_a, option_b, option_c, option_d, correct_answer)`)
    lines.push(`SELECT`)
    lines.push(`  ${dollarQuote(item.q, `${t}q`)},`)
    lines.push(`  c.id,`)
    lines.push(`  ${dollarQuote(item.type, `${t}ty`)},`)
    lines.push(`  ${dollarQuote(oa, `${t}a`)},`)
    lines.push(`  ${dollarQuote(ob, `${t}b`)},`)
    lines.push(`  ${dollarQuote(oc, `${t}c`)},`)
    lines.push(`  ${dollarQuote(od, `${t}d`)},`)
    lines.push(`  ${dollarQuote(correct, `${t}ok`)}`)
    lines.push(`FROM courses c WHERE c.course_name = ${courseLit} LIMIT 1;`)
    lines.push("")
  }
}

lines.push("-- Verify counts (expect 20 per course):")
lines.push(`SELECT c.course_name, COUNT(q.id) AS question_count`)
lines.push(`FROM courses c`)
lines.push(`LEFT JOIN questions q ON q.course_id = c.id`)
lines.push(`WHERE c.course_name IN (${courseList})`)
lines.push(`GROUP BY c.course_name`)
lines.push(`ORDER BY c.course_name;`)

const outPath = join(root, "supabase", "seed_navs_questions.sql")
writeFileSync(outPath, lines.join("\n"), "utf8")
console.log(`Wrote ${outPath} (${lines.length} lines)`)
