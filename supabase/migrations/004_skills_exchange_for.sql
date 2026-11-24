-- skills.exchange_for was used by the frontend (post form + detail page)
-- but never added to the table in 001_schema.sql.
alter table public.skills add column if not exists exchange_for text;
