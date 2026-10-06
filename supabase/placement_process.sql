-- Batch placement process: run in the Supabase SQL editor once.
-- Placement is no longer done when a student submits. The admin runs placement after the exam
-- period, students who did not pass a preferred course are waitlisted and placed manually,
-- and results are released to students per school year.

-- Waitlisted students have no course yet
alter table rankings alter column course_id drop not null;

-- How the student was placed and by whom
alter table rankings add column if not exists placement_type text not null default 'auto'
  check (placement_type in ('auto', 'manual'));
alter table rankings add column if not exists assigned_by text;
alter table rankings add column if not exists assigned_at timestamptz default now();

-- Existing rows from the old submit-time logic are marked 'auto', so the next "Run Placement"
-- for their school year replaces them.

-- Release flags are stored as placement_released:<school year> in system_settings
create table if not exists system_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
