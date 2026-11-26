-- Add student_type and section columns to students table.
-- Run this in the Supabase SQL editor.

alter table students
  add column if not exists student_type text default 'Regular',
  add column if not exists section text;
