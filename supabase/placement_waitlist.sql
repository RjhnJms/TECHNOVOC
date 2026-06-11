-- Allows students who did not pass all preferred courses to sit on a placement waitlist
-- until an admin assigns them to a non-preferred course.

alter table rankings alter column course_id drop not null;
