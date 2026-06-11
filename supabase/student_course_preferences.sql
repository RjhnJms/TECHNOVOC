-- Run this in the Supabase SQL editor to enable saving student course preferences.

create table if not exists student_course_preferences (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  preference_order smallint not null check (preference_order between 1 and 3),
  created_at timestamptz default now(),
  unique (student_id, preference_order),
  unique (student_id, course_id)
);

alter table student_course_preferences enable row level security;

create policy "Allow all for student_course_preferences"
  on student_course_preferences for all using (true) with check (true);
