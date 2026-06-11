-- Run this if you already created exam_access_codes with the old per-student schema.

create table if not exists exam_access_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references exam_access_codes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  used_at timestamptz default now(),
  unique (code_id, student_id)
);

alter table exam_access_codes add column if not exists max_uses int not null default 20;

-- Migrate used per-student rows into batch + redemption model
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'exam_access_codes' and column_name = 'student_id'
  ) then
    insert into exam_access_code_redemptions (code_id, student_id, used_at)
    select id, student_id, coalesce(used_at, created_at)
    from exam_access_codes
    where student_id is not null and used_at is not null
    on conflict do nothing;

    alter table exam_access_codes drop constraint if exists exam_access_codes_student_id_fkey;
    alter table exam_access_codes drop constraint if exists exam_access_codes_student_id_key;
    alter table exam_access_codes drop column if exists student_id;
    alter table exam_access_codes drop column if exists used_at;
  end if;
end $$;

alter table exam_access_code_redemptions enable row level security;

drop policy if exists "Allow all for exam_access_code_redemptions" on exam_access_code_redemptions;
create policy "Allow all for exam_access_code_redemptions"
  on exam_access_code_redemptions for all using (true) with check (true);
