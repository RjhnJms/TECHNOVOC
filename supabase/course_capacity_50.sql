-- Set the carrying capacity of every course to 50 slots (previously 70).
-- Run this in the Supabase SQL editor.

alter table courses alter column capacity set default 50;

update courses set capacity = 50;
