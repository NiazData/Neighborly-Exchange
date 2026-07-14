-- Neighbourly Exchange schema. Column names deliberately match the ported
-- frontend (created_date, user_id, content, ...). Applied via Supabase SQL
-- editor or `supabase db push`.

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  location jsonb,                    -- {city, lat, lng} — lat/lng PRIVATE
  fuzzy_lat double precision,        -- public, ~±300m offset (trigger)
  fuzzy_lng double precision,
  phone text,
  phone_verified boolean not null default false,
  is_verified boolean not null default false,
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  warnings_count integer not null default 0,
  blocked_users uuid[] not null default '{}',
  total_exchanges integer not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  is_demo boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- ---------- skills ----------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  type text not null check (type in ('offering', 'requesting')),
  availability text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'hidden', 'removed')),
  views integer not null default 0,
  user_name text,          -- denormalized; overwritten by sanitize_skill
  user_avatar text,
  is_verified_user boolean not null default false,
  location jsonb,          -- {city, lat, lng} — trigger forces FUZZY coords
  is_demo boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index skills_status_created_idx on public.skills (status, created_date desc);
create index skills_user_idx on public.skills (user_id);
create index skills_category_idx on public.skills (category);

-- ---------- exchanges ----------
create table public.exchanges (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.skills (id) on delete set null,
  skill_title text,
  provider_id uuid references public.profiles (id) on delete set null,
  provider_name text,
  requester_id uuid references public.profiles (id) on delete set null,
  requester_name text,
  message text,
  exchange_offer text,
  status text not null default 'pending'
    check (status in ('pending','accepted','in_progress','completed',
                      'declined','cancelled','disputed')),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  constraint exchange_parties_differ check (provider_id <> requester_id)
);
create index exchanges_provider_idx on public.exchanges (provider_id);
create index exchanges_requester_idx on public.exchanges (requester_id);

-- ---------- messages ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchanges (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_name text,
  receiver_id uuid references public.profiles (id) on delete set null,
  content text not null check (char_length(content) between 1 and 4000),
  read boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index messages_exchange_idx on public.messages (exchange_id, created_date);
create index messages_receiver_unread_idx on public.messages (receiver_id) where not read;

-- ---------- reviews ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchanges (id) on delete cascade,
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewer_name text,
  reviewee_id uuid references public.profiles (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  constraint one_review_per_reviewer unique (exchange_id, reviewer_id)
);
create index reviews_reviewee_idx on public.reviews (reviewee_id, created_date desc);

-- ---------- verification_requests ----------
create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_email text,
  user_name text,
  kind text not null default 'profile' check (kind in ('profile','phone','id')),
  id_type text,             -- unused in v1; reserved for v2 ID tier
  id_document_url text,     -- unused in v1
  selfie_url text,          -- unused in v1
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- ---------- reports ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reporter_name text,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reported_user_name text,
  reported_content_type text
    check (reported_content_type in ('skill','user','message','exchange')),
  reported_content_id uuid,
  reason text,
  description text,
  status text not null default 'pending'
    check (status in ('pending','resolved','dismissed')),
  admin_notes text,
  resolved_by uuid references public.profiles (id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- ---------- user_warnings ----------
create table public.user_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  created_date timestamptz not null default now()
);

-- ---------- activity_logs ----------
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_name text,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_date timestamptz not null default now()
);

-- ================= functions & triggers =================

-- updated_date maintenance (all tables that have the column)
create or replace function public.touch_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','skills','exchanges','messages',
                           'reviews','verification_requests','reports']
  loop
    execute format(
      'create trigger %I_touch before update on public.%I
       for each row execute function public.touch_updated_date()', t, t);
  end loop;
end $$;

-- profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name',
                   split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- fuzzy location: recompute whenever exact location changes (~±300 m)
create or replace function public.set_fuzzy_location()
returns trigger language plpgsql as $$
declare
  lat double precision := (new.location->>'lat')::double precision;
  lng double precision := (new.location->>'lng')::double precision;
begin
  if lat is null or lng is null then
    new.fuzzy_lat := null;
    new.fuzzy_lng := null;
  elsif tg_op = 'INSERT' or new.location is distinct from old.location then
    -- 0.0054 degrees latitude ≈ 600 m span → offset within ±300 m
    new.fuzzy_lat := lat + (random() - 0.5) * 0.0054;
    new.fuzzy_lng := lng + (random() - 0.5) * 0.0054
                     / greatest(cos(radians(lat)), 0.2);
  end if;
  return new;
end $$;
create trigger profiles_fuzzy
  before insert or update on public.profiles
  for each row execute function public.set_fuzzy_location();

-- skills: force denormalized fields from the owner's profile and force the
-- PUBLIC (fuzzy) location — the client can never publish exact coordinates
-- or spoof another user's name/badge.
create or replace function public.sanitize_skill()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select full_name, avatar_url, is_verified,
         location->>'city' as city, fuzzy_lat, fuzzy_lng
    into p from public.profiles where id = new.user_id;
  new.user_name := p.full_name;
  new.user_avatar := p.avatar_url;
  new.is_verified_user := coalesce(p.is_verified, false);
  new.location := jsonb_strip_nulls(jsonb_build_object(
    'city', p.city, 'lat', p.fuzzy_lat, 'lng', p.fuzzy_lng));
  return new;
end $$;
create trigger skills_sanitize
  before insert or update on public.skills
  for each row execute function public.sanitize_skill();

-- owners cannot un-hide an admin-hidden skill
create or replace function public.guard_skill_unhide()
returns trigger language plpgsql as $$
begin
  if old.status = 'hidden' and new.status <> 'hidden'
     and not public.is_admin() then
    raise exception 'This listing was hidden by a moderator';
  end if;
  return new;
end $$;
-- trigger created in 002 (is_admin() defined there)

-- exchange state machine + timestamps
create or replace function public.validate_exchange_transition()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending'     and new.status in ('accepted','declined','cancelled')) or
      (old.status = 'accepted'    and new.status in ('in_progress','completed','cancelled','disputed')) or
      (old.status = 'in_progress' and new.status in ('completed','cancelled','disputed'))
    ) then
      raise exception 'Invalid exchange transition: % -> %', old.status, new.status;
    end if;
    if new.status = 'accepted'    then new.accepted_at  := now(); end if;
    if new.status = 'in_progress' then new.started_at   := now(); end if;
    if new.status = 'completed'   then new.completed_at := now(); end if;
    if new.status in ('declined','cancelled') then new.cancelled_at := now(); end if;
  end if;
  return new;
end $$;
create trigger exchanges_validate
  before update on public.exchanges
  for each row execute function public.validate_exchange_transition();

-- reviews update the reviewee's aggregates (guard bypassed via local setting)
create or replace function public.apply_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.bypass_guard', 'on', true);
  update public.profiles set
    rating_avg = round((rating_avg * rating_count + new.rating)::numeric
                       / (rating_count + 1), 2),
    rating_count = rating_count + 1
  where id = new.reviewee_id;
  perform set_config('app.bypass_guard', 'off', true);
  return new;
end $$;
create trigger reviews_apply
  after insert on public.reviews
  for each row execute function public.apply_review();

-- warnings increment the counter
create or replace function public.apply_warning()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.bypass_guard', 'on', true);
  update public.profiles set warnings_count = warnings_count + 1
  where id = new.user_id;
  perform set_config('app.bypass_guard', 'off', true);
  return new;
end $$;
create trigger user_warnings_apply
  after insert on public.user_warnings
  for each row execute function public.apply_warning();

-- suspending a user hides their listings
create or replace function public.hide_skills_on_suspend()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_suspended and not old.is_suspended then
    update public.skills set status = 'hidden' where user_id = new.id;
  end if;
  return new;
end $$;
create trigger profiles_suspend_hides_skills
  after update on public.profiles
  for each row execute function public.hide_skills_on_suspend();

-- messages: only the read-flag may change, only flipping to true
create or replace function public.guard_message_update()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.bypass_guard', true), 'off') = 'on' then
    return new;
  end if;
  if new.content is distinct from old.content
     or new.sender_id is distinct from old.sender_id
     or new.receiver_id is distinct from old.receiver_id
     or new.exchange_id is distinct from old.exchange_id
     or (old.read and not new.read) then
    raise exception 'Messages cannot be edited';
  end if;
  return new;
end $$;
create trigger messages_guard
  before update on public.messages
  for each row execute function public.guard_message_update();

-- rate limits (spec §7)
create or replace function public.rate_limit_messages()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages
      where sender_id = new.sender_id
        and created_date > now() - interval '1 hour') >= 60 then
    raise exception 'Rate limit: too many messages, try again later';
  end if;
  return new;
end $$;
create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.rate_limit_messages();

create or replace function public.rate_limit_reports()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reports
      where reporter_id = new.reporter_id
        and created_date > now() - interval '1 day') >= 10 then
    raise exception 'Rate limit: too many reports today';
  end if;
  return new;
end $$;
create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.rate_limit_reports();

create or replace function public.rate_limit_exchanges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.exchanges
      where requester_id = new.requester_id
        and created_date > now() - interval '1 day') >= 20 then
    raise exception 'Rate limit: too many exchange requests today';
  end if;
  return new;
end $$;
create trigger exchanges_rate_limit
  before insert on public.exchanges
  for each row execute function public.rate_limit_exchanges();

-- GDPR-style account deletion (spec §7): anonymize what the counterparty
-- keeps, delete the rest, then delete the auth user (cascades to profile).
-- messages.sender_id/receiver_id, exchanges.provider_id/requester_id and
-- reviews.reviewer_id/reviewee_id are ON DELETE SET NULL (not cascade), so
-- deleting the auth user only nulls those FKs on the counterparty's rows
-- instead of deleting them — the name-anonymization updates below survive.
-- The FK-driven SET NULL updates on messages would otherwise trip
-- guard_message_update's "sender_id changed" check and abort the whole
-- deletion, so bypass that guard for the duration of this transaction.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  perform set_config('app.bypass_guard', 'on', true);
  update public.messages  set sender_name = 'Deleted member' where sender_id = uid;
  update public.reviews   set reviewer_name = 'Deleted member' where reviewer_id = uid;
  update public.exchanges set provider_name  = 'Deleted member' where provider_id  = uid;
  update public.exchanges set requester_name = 'Deleted member' where requester_id = uid;
  delete from public.skills where user_id = uid;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- public homepage stats (real numbers, spec §3.3)
create or replace function public.get_public_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'members',   (select count(*) from public.profiles where not is_suspended),
    'exchanges', (select count(*) from public.exchanges where status = 'completed'),
    'verified',  (select count(*) from public.profiles where is_verified and not is_suspended),
    'avg_rating',(select coalesce(round(avg(rating)::numeric, 1), 0) from public.reviews)
  );
$$;
grant execute on function public.get_public_stats() to anon, authenticated;

-- realtime for chat
alter publication supabase_realtime add table public.messages;
