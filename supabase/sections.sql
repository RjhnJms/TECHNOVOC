-- Manageable student sections (Add / Edit / Delete from Admin).
-- Run this in the Supabase SQL editor.

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

alter table sections enable row level security;

create policy "Allow all for sections"
  on sections for all using (true) with check (true);

insert into sections (name) values
  ('Amity'),
  ('Courtesy'),
  ('Dharma'),
  ('Faith'),
  ('Honesty'),
  ('Integrity'),
  ('Joy'),
  ('Kindness'),
  ('Loyalty'),
  ('Obedience')
on conflict (name) do nothing;
