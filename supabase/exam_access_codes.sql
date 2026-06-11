-- Run in the Supabase SQL editor to enable laboratory batch exam access codes.
-- One code can be shared by up to max_uses students (default 20); each student redeems once.

create table if not exists system_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

insert into system_settings (key, value)
values ('require_lab_access_code', 'false')
on conflict (key) do nothing;

create table if not exists exam_access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  max_uses int not null default 20 check (max_uses > 0),
  created_at timestamptz default now()
);

create table if not exists exam_access_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references exam_access_codes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  used_at timestamptz default now(),
  unique (code_id, student_id)
);

create index if not exists exam_access_codes_code_idx on exam_access_codes (code);
create index if not exists exam_access_code_redemptions_student_idx on exam_access_code_redemptions (student_id);

alter table system_settings enable row level security;
alter table exam_access_codes enable row level security;
alter table exam_access_code_redemptions enable row level security;

create policy "Allow all for system_settings"
  on system_settings for all using (true) with check (true);

create policy "Allow all for exam_access_codes"
  on exam_access_codes for all using (true) with check (true);

create policy "Allow all for exam_access_code_redemptions"
  on exam_access_code_redemptions for all using (true) with check (true);
