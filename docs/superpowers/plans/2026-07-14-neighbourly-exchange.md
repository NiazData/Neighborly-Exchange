# Neighbourly Exchange Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Base44-exported "NeighborSkill" React app to a self-owned stack (Supabase + Netlify), rebrand it as Neighbourly Exchange, and add the spec's privacy, moderation, SEO, and legal features.

**Architecture:** Keep the existing Vite + React 18 + Tailwind/shadcn frontend. Replace the `@base44/sdk` with (a) a Base44-compatible entity adapter (`src/api/entities.js`) backed by Supabase Postgres whose column names match what pages already use, and (b) an auth module (`src/api/auth.js`) + rewritten `AuthContext` backed by Supabase Auth. Privacy (fuzzy locations, column protection) and integrity (exchange state machine, review gating, rate limits) are enforced in Postgres via triggers and RLS, never trusted to the client.

**Tech Stack:** Vite 6, React 18, react-router-dom, @tanstack/react-query, Tailwind + shadcn/Radix, @supabase/supabase-js v2, Leaflet + react-leaflet v4, react-helmet-async, Vitest + React Testing Library, Netlify.

**Spec:** `docs/superpowers/specs/2026-07-14-neighbourly-exchange-design.md` (approved 2026-07-14).

## Global Constraints

- Brand name is exactly **"Neighbourly Exchange"** everywhere user-visible (spec §3.3). The old names "NeighborSkill"/"Neighborly Exchange" must not survive.
- **v1 is completely free** — no Stripe, no payments, no ads, no AdSense, no tracking scripts (spec §2, §10).
- DB column names match the frontend's existing field names: `created_date`/`updated_date` (not `created_at`), `skills.user_id` (not `owner_id`), `messages.content`, `reports.status='pending'` (deviation from spec §4's illustrative names — the spec's *behavior* wins, the export's *naming* wins).
- Exact `location.lat/lng` and `phone` never readable by other users; other users only ever see `fuzzy_lat/fuzzy_lng` (~±300 m) and city (spec §5.4).
- No Supabase **service-role key** in the frontend or in any committed file, ever (spec §7). Frontend uses only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- No `@base44/*` import anywhere when done; `base44/` dir, `src/api/base44Client.js`, `src/lib/app-params.js` deleted.
- react-leaflet must be **v4.x** (v5 requires React 19; this app is React 18).
- UI copy must never claim ID verification — v1 "Verified" = completed profile approved by admin (phone OTP behind `VITE_PHONE_VERIFICATION` flag, off by default) (spec §5.2).
- Legal Notice/Terms/Privacy must not contain fabricated company details; use clearly-marked `[PLACEHOLDER — …]` blocks (spec §7, §11).
- Every task: run `npm run lint` and `npm run test` before its commit; both must pass.

## File Map

**Created:**
- `supabase/migrations/001_schema.sql` — tables, triggers, functions, realtime
- `supabase/migrations/002_rls.sql` — RLS policies, view, storage bucket + policies, grants
- `.env.example`, `src/lib/supabase.js`
- `src/api/entities.js` (adapter), `src/api/auth.js`, `src/api/storage.js`
- `src/lib/geo.js`, `src/hooks/useSessionTimeout.js`
- `src/pages/Login.jsx`, `src/pages/Suspended.jsx`
- `src/components/Seo.jsx`, `public/robots.txt`
- `scripts/generate-sitemap.mjs`, `scripts/prerender-meta.mjs`, `scripts/seed.mjs`
- `netlify.toml`
- Tests: `src/lib/geo.test.js`, `src/api/entities.test.js`, `src/api/auth.test.js`, `src/test/setup.js`
- `README.md`

**Modified:** `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/lib/AuthContext.jsx` (rewritten), `src/Layout.jsx`, `src/components/ProtectedRoute.jsx`, `src/lib/PageNotFound.jsx`, and every file in `src/pages/`.

**Deleted:** `base44/`, `src/api/base44Client.js`, `src/lib/app-params.js`, `src/lib/NavigationTracker.jsx` (if only Base44 telemetry — verify in Task 8).

---

### Task 1: Tooling — dependencies, Vitest, Supabase client

**Files:**
- Modify: `package.json`, `vite.config.js`
- Create: `.env.example`, `src/lib/supabase.js`, `src/test/setup.js`, `src/lib/supabase.test.js`

**Interfaces:**
- Produces: `supabase` (configured `@supabase/supabase-js` client) exported from `src/lib/supabase.js`; `npm run test` runs Vitest; `@` alias resolves to `src/`.

- [ ] **Step 1: Install dependencies**

```bash
npm install @supabase/supabase-js@^2 leaflet@^1.9 react-leaflet@^4.2.1 react-helmet-async@^2
npm install -D vitest@^3 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^26 @vitejs/plugin-react@^4
```

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block add (keep existing scripts):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add Vitest config to `vite.config.js`**

Read the current file first. Do NOT remove the Base44 plugin yet (the app still needs it until Task 8) — only add the `test` block to the exported config object:

```js
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
```

- [ ] **Step 4: Create `src/test/setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Create `.env.example`** (commit this; never commit `.env`)

```bash
# Supabase project (Settings → API in the Supabase dashboard)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY

# Feature flags
VITE_PHONE_VERIFICATION=off
```

Also confirm `.gitignore` contains `.env` — add if missing:

```
.env
.env.local
```

- [ ] **Step 6: Write failing test `src/lib/supabase.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { supabase } from './supabase';

describe('supabase client', () => {
  it('exports a configured client with auth and from()', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(supabase.auth).toBeDefined();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm run test -- src/lib/supabase.test.js`
Expected: FAIL — cannot resolve `./supabase`.

- [ ] **Step 8: Create `src/lib/supabase.js`**

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // handles magic-link redirects
  },
});
```

(The fallbacks keep unit tests import-safe without env vars; real values come from `.env` / Netlify env.)

- [ ] **Step 9: Run test to verify it passes**

Run: `npm run test -- src/lib/supabase.test.js`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.js .env.example .gitignore src/lib/supabase.js src/lib/supabase.test.js src/test/setup.js
git commit -m "feat: add Supabase client, Vitest, and map/SEO dependencies"
```

---

### Task 2: Database schema migration (001_schema.sql)

**Files:**
- Create: `supabase/migrations/001_schema.sql`

**Interfaces:**
- Produces: tables `profiles, skills, exchanges, messages, reviews, verification_requests, reports, user_warnings, activity_logs`; functions `handle_new_user, set_fuzzy_location, sanitize_skill, validate_exchange_transition, apply_review, apply_warning, touch_updated_date, guard_profile_columns, guard_message_update, guard_skill_unhide, rate limit fns, delete_my_account(), get_public_stats()`. Column names match the frontend exactly (see Global Constraints).

**Prerequisite (manual, owner):** Create a free Supabase project at https://supabase.com/dashboard → New project. Note the Project URL and anon key into your local `.env`.

- [ ] **Step 1: Create `supabase/migrations/001_schema.sql`** with exactly:

```sql
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
  provider_id uuid not null references public.profiles (id) on delete cascade,
  provider_name text,
  requester_id uuid not null references public.profiles (id) on delete cascade,
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
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_name text,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
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
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_name text,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
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
  reviewed_by uuid references public.profiles (id),
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
  resolved_by uuid references public.profiles (id),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- ---------- user_warnings ----------
create table public.user_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid not null references public.profiles (id),
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
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
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
```

- [ ] **Step 2: Apply the migration**

Open Supabase dashboard → SQL Editor → paste the file → Run. (Or, if the Supabase CLI is installed and linked: `supabase db push`.)
Expected: "Success. No rows returned".

- [ ] **Step 3: Verify**

Run in SQL Editor:

```sql
select table_name from information_schema.tables
where table_schema = 'public' order by 1;
```

Expected: the 9 tables listed above. Then sanity-check one trigger:

```sql
insert into auth.users (id, email) values (gen_random_uuid(), 'trigger-test@example.com');
select full_name from public.profiles where email = 'trigger-test@example.com';
delete from auth.users where email = 'trigger-test@example.com';
```

Expected: one row, `full_name = 'trigger-test'`, then cleanup.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_schema.sql
git commit -m "feat: Postgres schema with privacy, state-machine, and rate-limit triggers"
```

---

### Task 3: RLS policies, public view, storage (002_rls.sql)

**Files:**
- Create: `supabase/migrations/002_rls.sql`

**Interfaces:**
- Consumes: tables from Task 2.
- Produces: `public.is_admin()`, `public.is_active()`, view `public.public_profiles` (public fields only), RLS on all tables, `avatars` storage bucket. The adapter in Task 5 reads non-self users **only** through `public_profiles`.

- [ ] **Step 1: Create `supabase/migrations/002_rls.sql`** with exactly:

```sql
-- helpers -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select not is_suspended from public.profiles where id = auth.uid()), false) $$;

-- now that is_admin() exists, attach the unhide guard from 001
create trigger skills_guard_unhide
  before update on public.skills
  for each row execute function public.guard_skill_unhide();

-- privileged profile columns are admin-only (triggers bypass via setting)
create or replace function public.guard_profile_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('app.bypass_guard', true), 'off') = 'on' then
    return new;
  end if;
  if not public.is_admin() and (
       new.is_admin       is distinct from old.is_admin
    or new.is_verified    is distinct from old.is_verified
    or new.is_suspended   is distinct from old.is_suspended
    or new.warnings_count is distinct from old.warnings_count
    or new.rating_avg     is distinct from old.rating_avg
    or new.rating_count   is distinct from old.rating_count
    or new.phone_verified is distinct from old.phone_verified
  ) then
    raise exception 'Not allowed to change protected profile fields';
  end if;
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  return new;
end $$;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- public view: the ONLY way other users read a profile ------------------
create view public.public_profiles as
select id, full_name, avatar_url, bio,
       jsonb_strip_nulls(jsonb_build_object(
         'city', location->>'city',
         'lat', fuzzy_lat, 'lng', fuzzy_lng)) as location,
       fuzzy_lat, fuzzy_lng,
       is_verified, rating_avg, rating_count, total_exchanges, created_date
from public.profiles
where not is_suspended;
-- view runs as owner (postgres) → bypasses profiles RLS by design
grant select on public.public_profiles to anon, authenticated;

-- RLS -------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.skills                enable row level security;
alter table public.exchanges             enable row level security;
alter table public.messages              enable row level security;
alter table public.reviews               enable row level security;
alter table public.verification_requests enable row level security;
alter table public.reports               enable row level security;
alter table public.user_warnings         enable row level security;
alter table public.activity_logs         enable row level security;

-- profiles: own row or admin only (others use public_profiles view)
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using ((id = auth.uid() and public.is_active()) or public.is_admin());

-- skills
create policy skills_select_public on public.skills for select
  to anon, authenticated
  using (status = 'active' or user_id = auth.uid() or public.is_admin());
create policy skills_insert on public.skills for insert
  with check (user_id = auth.uid() and public.is_active());
create policy skills_update on public.skills for update
  using ((user_id = auth.uid() and public.is_active()) or public.is_admin());
create policy skills_delete on public.skills for delete
  using (user_id = auth.uid() or public.is_admin());

-- exchanges: participants + admin
create policy exchanges_select on public.exchanges for select
  using (requester_id = auth.uid() or provider_id = auth.uid() or public.is_admin());
create policy exchanges_insert on public.exchanges for insert
  with check ((requester_id = auth.uid() or provider_id = auth.uid())
              and public.is_active());
create policy exchanges_update on public.exchanges for update
  using (((requester_id = auth.uid() or provider_id = auth.uid())
          and public.is_active()) or public.is_admin());

-- messages: participants of a live exchange
create policy messages_select on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());
create policy messages_insert on public.messages for insert
  with check (
    sender_id = auth.uid() and public.is_active()
    and exists (select 1 from public.exchanges e
                where e.id = exchange_id
                  and auth.uid() in (e.requester_id, e.provider_id)
                  and e.status in ('pending','accepted','in_progress'))
  );
create policy messages_update_read on public.messages for update
  using (receiver_id = auth.uid());   -- guard trigger restricts to read-flag

-- reviews: readable by all, insert gated on completed participation
create policy reviews_select on public.reviews for select
  to anon, authenticated using (true);
create policy reviews_insert on public.reviews for insert
  with check (
    reviewer_id = auth.uid() and public.is_active()
    and exists (select 1 from public.exchanges e
                where e.id = exchange_id
                  and e.status = 'completed'
                  and auth.uid() in (e.requester_id, e.provider_id)
                  and reviewee_id in (e.requester_id, e.provider_id)
                  and reviewee_id <> auth.uid())
  );

-- verification_requests
create policy vr_select on public.verification_requests for select
  using (user_id = auth.uid() or public.is_admin());
create policy vr_insert on public.verification_requests for insert
  with check (user_id = auth.uid() and public.is_active());
create policy vr_update on public.verification_requests for update
  using (public.is_admin());

-- reports: write your own, admins manage
create policy reports_select on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());
create policy reports_insert on public.reports for insert
  with check (reporter_id = auth.uid() and public.is_active());
create policy reports_update on public.reports for update
  using (public.is_admin());

-- user_warnings: user sees own, admin manages
create policy warnings_select on public.user_warnings for select
  using (user_id = auth.uid() or public.is_admin());
create policy warnings_insert on public.user_warnings for insert
  with check (public.is_admin());

-- activity_logs: any authenticated writes own actions, only admin reads
create policy logs_select on public.activity_logs for select
  using (public.is_admin());
create policy logs_insert on public.activity_logs for insert
  with check (actor_id = auth.uid());

-- storage: public avatars bucket, users write only their own folder ------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select
  to public using (bucket_id = 'avatars');
create policy avatars_insert on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars'
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 2: Apply in Supabase SQL Editor** (same as Task 2 Step 2). Expected: success.

- [ ] **Step 3: Verify RLS is on and the view hides private fields**

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
select column_name from information_schema.columns
where table_name = 'public_profiles';
```

Expected: `rowsecurity = true` for all 9 tables; `public_profiles` columns do NOT include `email`, `phone`, `is_admin`, `warnings_count`, `blocked_users`, or `is_suspended`, and no raw `location` lat/lng (only the rebuilt fuzzy one).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/002_rls.sql
git commit -m "feat: RLS policies, public_profiles view, and avatars storage bucket"
```

---

### Task 4: Geo utilities

**Files:**
- Create: `src/lib/geo.js`, Test: `src/lib/geo.test.js`

**Interfaces:**
- Produces: `distanceKm(lat1, lng1, lat2, lng2) → number`, `formatDistance(km) → string` (e.g. `"850 m"`, `"1.2 km"`). Used by NearbyMap (Task 10) and skill cards.

- [ ] **Step 1: Write failing tests `src/lib/geo.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { distanceKm, formatDistance } from './geo';

describe('distanceKm', () => {
  it('returns 0 for identical points', () => {
    expect(distanceKm(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });
  it('computes known distance (NYC → Newark ≈ 14.5 km)', () => {
    const d = distanceKm(40.7128, -74.006, 40.7357, -74.1724);
    expect(d).toBeGreaterThan(13.5);
    expect(d).toBeLessThan(15.5);
  });
});

describe('formatDistance', () => {
  it('uses meters under 1 km', () => expect(formatDistance(0.85)).toBe('850 m'));
  it('uses one decimal km at 1 km and above', () => expect(formatDistance(1.234)).toBe('1.2 km'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test -- src/lib/geo.test.js` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/geo.js`**

```js
// Haversine great-circle distance in kilometres.
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
```

- [ ] **Step 4: Run to verify pass** — `npm run test -- src/lib/geo.test.js` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo.js src/lib/geo.test.js
git commit -m "feat: haversine distance utilities"
```

---

### Task 5: Base44-compatible entity adapter

**Files:**
- Create: `src/api/entities.js`, Test: `src/api/entities.test.js`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.js`.
- Produces: named exports `Skill, Exchange, Message, Review, Report, VerificationRequest, ActivityLog, UserWarning, User`, each with:
  - `list(sort?: string, limit?: number) → Promise<Row[]>`
  - `filter(where: object, sort?: string, limit?: number) → Promise<Row[]>` (array values become `IN` queries)
  - `create(payload) → Promise<Row>`, `update(id, payload) → Promise<Row>`, `delete(id) → Promise<true>`
  - Sort strings are Base44-style: `'-created_date'` = descending.
  - `User.filter/list` read the `public_profiles` view for privacy; `User.update` and `User.listAll` (admin) hit `profiles`.

- [ ] **Step 1: Write failing tests `src/api/entities.test.js`**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { lastTable: null, q: null };

function makeQuery(rows = []) {
  const q = {
    select: vi.fn(() => q),
    insert: vi.fn(() => q),
    update: vi.fn(() => q),
    delete: vi.fn(() => q),
    eq: vi.fn(() => q),
    in: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    single: vi.fn(() => Promise.resolve({ data: rows[0] ?? { id: 'x' }, error: null })),
    then: (resolve, reject) =>
      Promise.resolve({ data: rows, error: null }).then(resolve, reject),
  };
  return q;
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      state.lastTable = table;
      state.q = makeQuery([{ id: '1' }]);
      return state.q;
    }),
  },
}));

import { Skill, User } from './entities';

beforeEach(() => { state.lastTable = null; state.q = null; });

describe('entity adapter', () => {
  it('filter() applies eq per key, desc order, and limit', async () => {
    const rows = await Skill.filter({ status: 'active' }, '-created_date', 50);
    expect(state.lastTable).toBe('skills');
    expect(state.q.eq).toHaveBeenCalledWith('status', 'active');
    expect(state.q.order).toHaveBeenCalledWith('created_date', { ascending: false });
    expect(state.q.limit).toHaveBeenCalledWith(50);
    expect(rows).toEqual([{ id: '1' }]);
  });

  it('filter() uses IN for array values', async () => {
    await Skill.filter({ status: ['active', 'paused'] });
    expect(state.q.in).toHaveBeenCalledWith('status', ['active', 'paused']);
  });

  it('create() inserts and returns the single row', async () => {
    const row = await Skill.create({ title: 't' });
    expect(state.q.insert).toHaveBeenCalledWith({ title: 't' });
    expect(row).toEqual({ id: '1' });
  });

  it('User.filter reads the public_profiles view', async () => {
    await User.filter({ id: 'abc' });
    expect(state.lastTable).toBe('public_profiles');
  });

  it('User.update writes to profiles', async () => {
    await User.update('abc', { is_verified: true });
    expect(state.lastTable).toBe('profiles');
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm run test -- src/api/entities.test.js` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/api/entities.js`**

```js
import { supabase } from '@/lib/supabase';

// Base44-style sort strings: '-created_date' → created_date DESC
function parseSort(sort) {
  if (!sort) return null;
  const descending = sort.startsWith('-');
  return { column: descending ? sort.slice(1) : sort, ascending: !descending };
}

function createEntity(table) {
  return {
    async filter(where = {}, sort, limit) {
      let q = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(where)) {
        if (value === undefined) continue;
        q = Array.isArray(value) ? q.in(key, value) : q.eq(key, value);
      }
      const s = parseSort(sort);
      if (s) q = q.order(s.column, { ascending: s.ascending });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    async list(sort, limit) {
      return this.filter({}, sort, limit);
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  };
}

export const Skill = createEntity('skills');
export const Exchange = createEntity('exchanges');
export const Message = createEntity('messages');
export const Review = createEntity('reviews');
export const Report = createEntity('reports');
export const VerificationRequest = createEntity('verification_requests');
export const ActivityLog = createEntity('activity_logs');
export const UserWarning = createEntity('user_warnings');

// Reads about OTHER users go through the privacy-preserving view.
// Admin writes (verify/suspend) and admin lists hit profiles (RLS gates them).
const publicUsers = createEntity('public_profiles');
const rawProfiles = createEntity('profiles');

export const User = {
  filter: (where, sort, limit) => publicUsers.filter(where, sort, limit),
  list: (sort, limit) => rawProfiles.list(sort, limit), // Admin.jsx only; RLS enforces
  update: (id, payload) => rawProfiles.update(id, payload),
};
```

- [ ] **Step 4: Run to verify pass** — `npm run test -- src/api/entities.test.js` — Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/entities.js src/api/entities.test.js
git commit -m "feat: Base44-compatible entity adapter over Supabase"
```

---

### Task 6: Auth module, AuthContext rewrite, Login and Suspended pages

**Files:**
- Create: `src/api/auth.js`, `src/pages/Login.jsx`, `src/pages/Suspended.jsx`, Test: `src/api/auth.test.js`
- Modify: `src/lib/AuthContext.jsx` (full rewrite), `src/App.jsx` and/or `src/pages.config.js` (routes), `src/components/ProtectedRoute.jsx`

**Interfaces:**
- Consumes: `supabase` (Task 1).
- Produces: `auth` object from `src/api/auth.js`:
  - `me() → Promise<profileRow>` (throws `{status: 401}`-shaped error when signed out)
  - `updateMe(payload) → Promise<profileRow>`
  - `signUp({ email, password, fullName })`, `signIn({ email, password })`, `signInWithMagicLink(email)`
  - `logout() → Promise<void>`, `redirectToLogin(fromPath?)` (navigates to `/login?from=…`)
- `useAuth()` keeps its existing consumer contract: `{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings, logout, navigateToLogin, checkAppState, loadUser }` so pages don't break. `user` is the **profiles row** (has `full_name`, `avatar_url`, `is_verified`, `location`, `blocked_users`, `total_exchanges`, `created_date` — same fields pages already read).

- [ ] **Step 1: Write failing test `src/api/auth.test.js`**

```js
import { describe, it, expect, vi } from 'vitest';

const profileRow = { id: 'u1', full_name: 'Test User' };

function makeQuery(row) {
  const q = {
    select: vi.fn(() => q), update: vi.fn(() => q), eq: vi.fn(() => q),
    single: vi.fn(() => Promise.resolve({ data: row, error: null })),
  };
  return q;
}

const getUserMock = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: (...a) => getUserMock(...a),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => makeQuery(profileRow)),
  },
}));

import { auth } from './auth';

describe('auth.me', () => {
  it('returns the profile row when signed in', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } });
    await expect(auth.me()).resolves.toEqual(profileRow);
  });
  it('throws a 401-shaped error when signed out', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(auth.me()).rejects.toMatchObject({ status: 401 });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm run test -- src/api/auth.test.js` — Expected: FAIL.

- [ ] **Step 3: Implement `src/api/auth.js`**

```js
import { supabase } from '@/lib/supabase';

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }
  return user;
}

export const auth = {
  async me() {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error;
    return data;
  },

  async updateMe(payload) {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('profiles').update(payload).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  redirectToLogin(fromPath) {
    const from = encodeURIComponent(fromPath || window.location.pathname);
    window.location.assign(`/login?from=${from}`);
  },
};
```

- [ ] **Step 4: Run to verify pass** — `npm run test -- src/api/auth.test.js` — Expected: PASS.

- [ ] **Step 5: Rewrite `src/lib/AuthContext.jsx`** (replace entire file)

```jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { auth } from '@/api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      const profile = await auth.me();
      if (profile.is_suspended) {
        await auth.logout();
        setUser(null);
        setIsAuthenticated(false);
        window.location.assign('/suspended');
        return;
      }
      setUser(profile);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status && error.status !== 401) {
        setAuthError({ type: 'unknown', message: error.message });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) loadUser();
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadUser]);

  const logout = async (shouldRedirect = true) => {
    await auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.assign('/');
  };

  const navigateToLogin = () => auth.redirectToLogin(window.location.pathname);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // kept so existing pages destructuring these don't crash:
      isLoadingPublicSettings: false,
      appPublicSettings: null,
      authError,
      logout,
      navigateToLogin,
      checkAppState: loadUser,
      loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
```

- [ ] **Step 6: Create `src/pages/Login.jsx`**

```jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Loader2, Mail } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/';
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.signIn({ email, password });
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.signUp({ email, password, fullName });
      toast.success('Account created! Check your email to confirm, then sign in.');
    } catch (error) {
      toast.error(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) return toast.error('Enter your email first');
    setLoading(true);
    try {
      await auth.signInWithMagicLink(email);
      toast.success('Magic link sent — check your email.');
    } catch (error) {
      toast.error(error.message || 'Could not send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
            <Users className="h-6 w-6 text-white" />
          </Link>
          <CardTitle className="text-2xl">Neighbourly Exchange</CardTitle>
          <CardDescription>Exchange skills with your neighbors</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email}
                         onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password}
                         onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
                </Button>
                <Button type="button" variant="outline" className="w-full" disabled={loading}
                        onClick={handleMagicLink}>
                  <Mail className="mr-2 h-4 w-4" /> Email me a magic link
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={fullName}
                         onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input id="new-email" type="email" required value={email}
                         onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input id="new-password" type="password" required minLength={8} value={password}
                         onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Create `src/pages/Suspended.jsx`**

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Suspended() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
      <ShieldAlert className="h-12 w-12 text-red-500" />
      <h1 className="text-2xl font-bold">Account suspended</h1>
      <p className="max-w-md text-slate-500">
        Your account has been suspended by a moderator for violating the
        community guidelines. If you believe this is a mistake, contact support.
      </p>
      <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
    </div>
  );
}
```

- [ ] **Step 8: Register the routes**

Open `src/App.jsx` and `src/pages.config.js` and follow the existing pattern to register `Login` at `/login` and `Suspended` at `/suspended` (both outside the authenticated Layout, like the legal pages). Then open `src/components/ProtectedRoute.jsx`: replace any Base44 redirect (`redirectToLogin`, `appPublicSettings` checks) with `useAuth()`'s `navigateToLogin()` when `!isAuthenticated && !isLoadingAuth`.

- [ ] **Step 9: Run all tests + lint**

Run: `npm run test && npm run lint` — Expected: PASS / no errors. (The app itself still imports Base44 in pages — that's Task 8.)

- [ ] **Step 10: Commit**

```bash
git add src/api/auth.js src/api/auth.test.js src/lib/AuthContext.jsx src/pages/Login.jsx src/pages/Suspended.jsx src/App.jsx src/pages.config.js src/components/ProtectedRoute.jsx
git commit -m "feat: Supabase auth with own login page, suspended screen"
```

---

### Task 7: Avatar upload via Supabase Storage

**Files:**
- Create: `src/api/storage.js`
- Modify: `src/pages/Profile.jsx` (the avatar-upload handler only)

**Interfaces:**
- Produces: `UploadFile({ file }) → Promise<{ file_url }>` — same call/return shape the Base44 integration used, so the page change is minimal. Uploads to `avatars/<uid>/<timestamp>.<ext>`.

- [ ] **Step 1: Create `src/api/storage.js`**

```js
import { supabase } from '@/lib/supabase';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export async function UploadFile({ file }) {
  if (!ALLOWED.includes(file.type)) throw new Error('Only JPEG, PNG, or WebP images are allowed');
  if (file.size > MAX_BYTES) throw new Error('Image must be under 5 MB');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { file_url: data.publicUrl };
}
```

- [ ] **Step 2: Rewire `src/pages/Profile.jsx`**

Find the avatar-upload handler (it produces `file_url` around line 72). Replace its Base44 upload call with:

```js
import { UploadFile } from '@/api/storage';
// …in the handler:
const { file_url } = await UploadFile({ file });
```

Keep the rest of the handler (`auth.updateMe({ avatar_url: file_url })` after Task 8's import swap) unchanged.

- [ ] **Step 3: Lint + commit**

```bash
npm run lint
git add src/api/storage.js src/pages/Profile.jsx
git commit -m "feat: avatar upload via Supabase Storage"
```

---

### Task 8: Port all pages off Base44 and delete the SDK

**Files:**
- Modify: `src/Layout.jsx`, `src/lib/PageNotFound.jsx`, and every page in `src/pages/` that references `base44`
- Delete: `src/api/base44Client.js`, `src/lib/app-params.js`, `base44/` directory
- Modify: `package.json`, `vite.config.js`, `index.html`

This is a mechanical port with three substantive edits at the end.

- [ ] **Step 1: Swap imports in every file that uses `base44`**

For each file found by `grep -rl "base44" src/`, replace the import

```js
import { base44 } from '@/api/base44Client';
```

with (only the names that file actually uses):

```js
import { Skill, Exchange, Message, Review, Report, VerificationRequest, ActivityLog, User } from '@/api/entities';
import { auth } from '@/api/auth';
```

Then apply these textual replacements in each file:

| Old | New |
|---|---|
| `base44.entities.Skill` | `Skill` |
| `base44.entities.Exchange` | `Exchange` |
| `base44.entities.Message` | `Message` |
| `base44.entities.Review` | `Review` |
| `base44.entities.Report` | `Report` |
| `base44.entities.VerificationRequest` | `VerificationRequest` |
| `base44.entities.ActivityLog` | `ActivityLog` |
| `base44.entities.User` | `User` |
| `base44.auth.me()` | `auth.me()` |
| `base44.auth.updateMe(` | `auth.updateMe(` |
| `base44.auth.logout(` | `auth.logout(` |
| `base44.auth.redirectToLogin(` | `auth.redirectToLogin(` |

- [ ] **Step 2: Substantive edit — Exchanges.jsx rating recompute**

In `src/pages/Exchanges.jsx` (~lines 105–110) delete the client-side rating recompute block (`const reviews = await Review.filter({ reviewee_id: … }); const avgRating = …` and its comment) — the `reviews_apply` DB trigger now maintains `rating_avg`/`rating_count` atomically. Keep the `Review.create(…)` call.

- [ ] **Step 3: Substantive edit — SkillDetail.jsx view counter**

The port keeps `Skill.update(skillId, { views: … })`, but RLS only lets owners update their skills, so views from visitors would fail. In `001_schema.sql` we did not add a views RPC — add one now in a new migration `supabase/migrations/003_views_rpc.sql`:

```sql
create or replace function public.increment_skill_views(skill uuid)
returns void language sql security definer set search_path = public as
$$ update public.skills set views = views + 1 where id = skill and status = 'active' $$;
grant execute on function public.increment_skill_views(uuid) to anon, authenticated;
```

Apply it in the SQL editor. In `src/pages/SkillDetail.jsx`, replace the `Skill.update(skillId, { views: … })` line with:

```js
import { supabase } from '@/lib/supabase';
// …
await supabase.rpc('increment_skill_views', { skill: skillId });
```

- [ ] **Step 4: Substantive edit — PageNotFound.jsx and NavigationTracker.jsx**

`src/lib/PageNotFound.jsx`: replace `base44.auth.me()` usage with `useAuth()`'s `user` (or `auth.me()`); remove any Base44 error-screen imports. `src/lib/NavigationTracker.jsx`: read it — if it only reports navigation to Base44, delete the file and remove its usage from `src/App.jsx`/`src/main.jsx`; if it does client-side scroll restoration, keep the scroll part and delete the reporting.

- [ ] **Step 5: Remove Base44 from the toolchain**

```bash
git rm -r base44 src/api/base44Client.js src/lib/app-params.js
npm uninstall @base44/sdk @base44/vite-plugin
```

In `vite.config.js`: remove the Base44 plugin import and its entry in `plugins: []`, keep `react()` and the `@` alias (add `resolve: { alias: { '@': path.resolve(__dirname, './src') } }` if the Base44 plugin was providing it). In `index.html`: remove any Base44 script tags/meta if present. In `src/components/UserNotRegisteredError.jsx`: this Base44-specific error screen is unreachable now — delete it and any imports of it.

- [ ] **Step 6: Verify nothing references base44**

Run: `grep -ri "base44" src/ index.html vite.config.js package.json`
Expected: no matches.

- [ ] **Step 7: Boot the app end-to-end**

Run: `npm run dev` — sign up (confirm via the email Supabase sends, or disable "Confirm email" in Supabase Auth settings during development), sign in, post a skill in My Skills, see it in Explore, open its detail page, request an exchange with a second test account, accept it, send a message, complete it, leave a review. Fix anything that errors (field mismatches will surface here — the schema was derived from the pages' payloads, so differences should be rare).

- [ ] **Step 8: Tests + lint + commit**

```bash
npm run test && npm run lint
git add -A
git commit -m "feat: port all pages to Supabase adapter, remove Base44 SDK"
```

---

### Task 9: Realtime chat

**Files:**
- Modify: `src/pages/Messages.jsx`

**Interfaces:**
- Consumes: `supabase` client; `messages` table is in the `supabase_realtime` publication (Task 2).

- [ ] **Step 1: Add a realtime subscription to `src/pages/Messages.jsx`**

Inside the component (it already has `queryClient` and `selectedExchange`), add:

```js
import { useEffect } from 'react'; // if not already imported
import { supabase } from '@/lib/supabase';

useEffect(() => {
  if (!selectedExchange?.id) return;
  const channel = supabase
    .channel(`messages-${selectedExchange.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `exchange_id=eq.${selectedExchange.id}`,
      },
      () => queryClient.invalidateQueries(['messages', selectedExchange.id]),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [selectedExchange?.id, queryClient]);
```

- [ ] **Step 2: Verify manually**

`npm run dev`, open the same exchange as two different users in two browser windows; a message sent from one appears in the other without refresh.

- [ ] **Step 3: Lint + commit**

```bash
npm run lint
git add src/pages/Messages.jsx
git commit -m "feat: realtime chat via Supabase Realtime"
```

---

### Task 10: Nearby map with Leaflet

**Files:**
- Create: `src/components/map/SkillsMap.jsx`
- Modify: `src/pages/NearbyMap.jsx`, `src/index.css`

**Interfaces:**
- Consumes: `distanceKm`, `formatDistance` (Task 4); skills rows whose `location` is `{city, lat, lng}` **fuzzy** jsonb (guaranteed by `sanitize_skill` trigger).
- Produces: `<SkillsMap center={{lat, lng}} skills={[…]} onSkillClick={fn} />`.

- [ ] **Step 1: Create `src/components/map/SkillsMap.jsx`**

```jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite doesn't resolve Leaflet's default icon URLs — set them explicitly.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function SkillsMap({ center, skills = [], onSkillClick }) {
  if (!center?.lat || !center?.lng) return null;
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', minHeight: '420px', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* your own approximate area, not an exact point */}
      <Circle center={[center.lat, center.lng]} radius={300}
              pathOptions={{ color: '#059669', fillOpacity: 0.15 }} />
      {skills
        .filter((s) => s.location?.lat && s.location?.lng)
        .map((skill) => (
          <Marker key={skill.id} position={[skill.location.lat, skill.location.lng]}>
            <Popup>
              <strong>{skill.title}</strong>
              <br />{skill.user_name} · {skill.location.city}
              <br />
              <button
                type="button"
                className="text-emerald-700 underline"
                onClick={() => onSkillClick?.(skill)}
              >
                View skill
              </button>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
```

- [ ] **Step 2: Wire it into `src/pages/NearbyMap.jsx`**

The page already fetches skills (`Skill.filter(filter, '-created_date', 100)`) and has the current `user`. Replace its placeholder/map area with:

```jsx
import SkillsMap from '@/components/map/SkillsMap';
import { distanceKm, formatDistance } from '@/lib/geo';
import { useNavigate } from 'react-router-dom'; // if not present
// …
const center = user?.fuzzy_lat
  ? { lat: user.fuzzy_lat, lng: user.fuzzy_lng }
  : { lat: user?.location?.lat, lng: user?.location?.lng };
// …in JSX:
<SkillsMap
  center={center}
  skills={skills}
  onSkillClick={(skill) => navigate(`/skilldetail?id=${skill.id}`)}
/>
```

(Check how SkillCard links to detail pages — `createPageUrl('SkillDetail')` most likely — and use the same helper for `onSkillClick` so URLs stay consistent.)

Where the page renders distance for each skill, compute it with the fuzzy coords:

```jsx
const km = distanceKm(center.lat, center.lng, skill.location.lat, skill.location.lng);
// render: formatDistance(km) — e.g. "1.2 km away (approximate)"
```

If the user has no location set, render the existing empty-state card with a button linking to Profile to set their area.

- [ ] **Step 3: Location picking in Profile**

In `src/pages/Profile.jsx` edit mode, the location field(s) must produce `location = { city, lat, lng }`. Add a "Find my area" button using browser geolocation plus a free-text city field:

```jsx
const handleUseMyLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => setEditData((d) => ({
      ...d,
      location: {
        ...(d.location || {}),
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      },
    })),
    () => toast.error('Could not read your location — you can still type your suburb.'),
  );
};
```

UI copy next to it must say: *"Your exact location is never shown — neighbors only ever see an approximate area (~300 m)."*

- [ ] **Step 4: Verify manually**

`npm run dev` → set your location in Profile → post a skill → Nearby Map shows the pin offset from your true position; two page reloads show the pin in the same (offset) place.

- [ ] **Step 5: Lint + commit**

```bash
npm run lint
git add src/components/map/SkillsMap.jsx src/pages/NearbyMap.jsx src/pages/Profile.jsx
git commit -m "feat: Leaflet nearby map with privacy-fuzzy pins"
```

---

### Task 11: Verification page rework (v1 tiered model)

**Files:**
- Modify: `src/pages/Verification.jsx` (replace the ID-document flow)

**Interfaces:**
- Consumes: `VerificationRequest` entity, `useAuth()`.
- Produces: v1 flow — checklist of profile completeness; when complete, user submits `VerificationRequest.create({ user_id, user_email, user_name, kind: 'profile', status: 'pending' })`; admin approval (Task 12/Admin already updates `is_verified`). **No document upload fields anywhere.**

- [ ] **Step 1: Rework `src/pages/Verification.jsx`**

Remove the ID-type selector, document upload, and selfie upload sections entirely. Replace the body with:

1. A checklist card computed from `user`:

```jsx
const checks = [
  { label: 'Email confirmed', done: true }, // signup requires it
  { label: 'Profile photo added', done: Boolean(user?.avatar_url) },
  { label: 'Bio written (20+ characters)', done: (user?.bio || '').length >= 20 },
  { label: 'Neighborhood set', done: Boolean(user?.location?.city || user?.location?.lat) },
];
const complete = checks.every((c) => c.done);
const phoneFlagOn = import.meta.env.VITE_PHONE_VERIFICATION === 'on';
```

Render each check with a green check / gray circle icon and a link to Profile for missing ones.

2. Keep the existing "pending request" and "approved" states (they already query `VerificationRequest.filter({ user_id: user.id })`).

3. Submit button (enabled only when `complete`):

```jsx
await VerificationRequest.create({
  user_id: user.id,
  user_email: user.email,
  user_name: user.full_name,
  kind: 'profile',
  status: 'pending',
});
```

4. If `phoneFlagOn`, render an additional "Verify phone number" step (input + note "SMS verification arriving soon") — but since the flag defaults to `off`, this renders nothing in v1.

5. Page copy must say what the badge means: *"Verified means this member confirmed their email and completed their profile — it is not an identity check."*

- [ ] **Step 2: Verify manually** — incomplete profile shows unmet checks; completing profile enables submit; submitting shows "pending review".

- [ ] **Step 3: Lint + commit**

```bash
npm run lint
git add src/pages/Verification.jsx
git commit -m "feat: rework verification to v1 profile-completeness tier"
```

---

### Task 12: Admin moderation — hide listing, warn, ban, audit log

**Files:**
- Modify: `src/pages/Admin.jsx`, `src/pages/Settings.jsx`

**Interfaces:**
- Consumes: `User, Skill, UserWarning, ActivityLog, Report, VerificationRequest, Exchange` entities; RLS admin policies (Task 3).
- Produces: admin mutations `hideSkill(skill)`, `warnUser({userId, reason})`, `banUser({userId, reason})`, `unbanUser(userId)`; every action also writes an `activity_logs` row.

- [ ] **Step 1: Gate the page**

Admin.jsx already loads `user` — ensure it renders an "Access denied" card unless `user.is_admin` (check the existing guard; the old export used `user.role === 'admin'` in places — normalize to `user.is_admin`).

- [ ] **Step 2: Add the moderation mutations to `src/pages/Admin.jsx`**

Following the page's existing `useMutation` pattern:

```jsx
import { UserWarning, ActivityLog } from '@/api/entities'; // add to existing import

const logAction = (action, targetType, targetId, metadata = {}) =>
  ActivityLog.create({
    actor_id: user.id, actor_name: user.full_name,
    action, target_type: targetType, target_id: targetId, metadata,
  });

const hideSkillMutation = useMutation({
  mutationFn: async ({ skill, reason }) => {
    await Skill.update(skill.id, { status: 'hidden' });
    await logAction('hide_skill', 'skill', skill.id, { reason, title: skill.title });
  },
  onSuccess: () => { queryClient.invalidateQueries(['adminSkills']); toast.success('Listing hidden'); },
});

const warnUserMutation = useMutation({
  mutationFn: async ({ userId, userName, reason }) => {
    await UserWarning.create({ user_id: userId, admin_id: user.id, reason });
    await logAction('warn_user', 'user', userId, { reason, name: userName });
  },
  onSuccess: () => { queryClient.invalidateQueries(['adminUsers']); toast.success('Warning issued'); },
});

const banUserMutation = useMutation({
  mutationFn: async ({ userId, userName, reason }) => {
    await User.update(userId, { is_suspended: true });
    await logAction('ban_user', 'user', userId, { reason, name: userName });
  },
  onSuccess: () => { queryClient.invalidateQueries(['adminUsers']); toast.success('User banned'); },
});

const unbanUserMutation = useMutation({
  mutationFn: async (userId) => {
    await User.update(userId, { is_suspended: false });
    await logAction('unban_user', 'user', userId);
  },
  onSuccess: () => { queryClient.invalidateQueries(['adminUsers']); toast.success('User unbanned'); },
});
```

Note: the DB trigger auto-hides a banned user's skills; the existing suspend mutation (if any, using `is_suspended`) should be replaced by these.

- [ ] **Step 3: Add the UI hooks**

- Users tab: per-row `DropdownMenu` with "Warn user…", "Ban user…" / "Unban user" (based on `is_suspended`), each opening an `AlertDialog` with a required reason `Textarea` before firing the mutation. Show `warnings_count` and a red "Banned" badge on suspended rows.
- Skills tab: per-row "Hide listing…" (status ≠ hidden) with reason dialog; "Hidden" badge otherwise.
- Reports tab: on each open report, add quick actions — "Hide reported skill" (when `reported_content_type === 'skill'`, calls `hideSkillMutation` with `{skill: {id: report.reported_content_id, title: report.reported_user_name}}`), "Warn user", "Ban user" (target `report.reported_user_id`) — alongside the existing resolve/dismiss.

- [ ] **Step 4: Surface warnings to the warned user**

In `src/pages/Settings.jsx`, add a "Account standing" card:

```jsx
import { UserWarning } from '@/api/entities';
const { data: warnings = [] } = useQuery({
  queryKey: ['myWarnings', user?.id],
  queryFn: () => UserWarning.filter({ user_id: user.id }, '-created_date'),
  enabled: !!user?.id,
});
```

If empty: green "Your account is in good standing." Otherwise list each warning's date + reason with an amber alert style.

- [ ] **Step 5: Verify manually**

With an admin account (set via SQL: `update profiles set is_admin = true where email = 'you@…';`): hide a listing (owner sees it gone from Explore, still in My Skills with Hidden badge — add that badge if MySkills doesn't render `status`), warn a user (their Settings shows it), ban a user (their next action logs them out to `/suspended`; their listings vanish), unban restores access.

- [ ] **Step 6: Lint + commit**

```bash
npm run lint
git add src/pages/Admin.jsx src/pages/Settings.jsx
git commit -m "feat: admin moderation — hide listing, warn, ban with audit log"
```

---

### Task 13: Rebrand + real homepage stats

**Files:**
- Modify: `src/Layout.jsx`, `index.html`, `src/pages/Home.jsx`, and every file matching the old brand names

- [ ] **Step 1: Rename the brand**

Run `grep -rn "NeighborSkill\|Neighborly" src/ index.html` and replace every user-visible occurrence with **Neighbourly Exchange** (Layout logo text, translations object, page titles, legal page headings, footer `© 2026 Neighbourly Exchange`). Keep the tagline "No Money Needed · Just Skills & Kindness" and the green visual identity unchanged.

- [ ] **Step 2: Real stats on Home**

`src/pages/Home.jsx` renders hard-coded marketing stats (2,500+ members, 15,000+ exchanges, …). Replace with the RPC:

```jsx
import { supabase } from '@/lib/supabase';
const { data: stats } = useQuery({
  queryKey: ['publicStats'],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('get_public_stats');
    if (error) throw error;
    return data;
  },
});
```

Render `stats?.members ?? '—'` "Neighbors", `stats?.exchanges ?? '—'` "Skills Exchanged", `stats?.verified ?? '—'` "Verified Members", `stats?.avg_rating || '—'` "Average Rating". No fabricated numbers anywhere (Global Constraints).

- [ ] **Step 3: Verify + commit**

`grep -rn "NeighborSkill" src/ index.html` → no matches. `npm run dev` → Home shows real (small) numbers.

```bash
npm run lint && npm run test
git add -A
git commit -m "feat: rebrand to Neighbourly Exchange with real homepage stats"
```

---

### Task 14: SEO & GEO

**Files:**
- Create: `src/components/Seo.jsx`, `public/robots.txt`, `scripts/routes.mjs`, `scripts/generate-sitemap.mjs`, `scripts/prerender-meta.mjs`
- Modify: `src/main.jsx`, `package.json`, public pages (`Home.jsx`, `Explore.jsx`, `SkillDetail.jsx`, `Terms.jsx`, `Privacy.jsx`, `Legal.jsx`), private pages (noindex)

**Interfaces:**
- Produces: `<Seo title description path jsonLd noindex />`; build emits `dist/sitemap.xml` and per-route `dist/<route>/index.html` with route-specific meta.

- [ ] **Step 1: HelmetProvider in `src/main.jsx`**

```jsx
import { HelmetProvider } from 'react-helmet-async';
// wrap the existing root element:
<HelmetProvider>
  {/* existing app tree */}
</HelmetProvider>
```

- [ ] **Step 2: Create `src/components/Seo.jsx`**

```jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE = 'Neighbourly Exchange';
const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://neighbourly-exchange.netlify.app';

export default function Seo({ title, description, path = '/', jsonLd, noindex = false }) {
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Exchange Skills with Your Neighbors`;
  const url = `${BASE_URL}${path}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content={SITE} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
```

- [ ] **Step 3: Add `<Seo …/>` to pages**

Public pages (each with a unique, brand-bearing description):

```jsx
// Home.jsx
<Seo
  path="/"
  description="Neighbourly Exchange connects you with neighbors to swap skills, services, and favors — no money needed. Verified members, tracked exchanges, honest reviews."
  jsonLd={{
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: 'Neighbourly Exchange', url: 'https://neighbourly-exchange.netlify.app' },
      { '@type': 'WebSite', name: 'Neighbourly Exchange', url: 'https://neighbourly-exchange.netlify.app' },
    ],
  }}
/>
// Explore.jsx
<Seo title="Explore Skills" path="/explore"
     description="Browse skills your neighbors on Neighbourly Exchange are offering and requesting — home repairs, tutoring, gardening, cooking, and more." />
// SkillDetail.jsx (when skill is loaded)
<Seo title={skill.title} path={`/skilldetail?id=${skill.id}`}
     description={`${skill.title} — a ${skill.type} on Neighbourly Exchange in ${skill.location?.city || 'your area'}.`}
     jsonLd={{
       '@context': 'https://schema.org', '@type': 'Service',
       name: skill.title, description: skill.description,
       areaServed: skill.location?.city,
       provider: { '@type': 'Person', name: skill.user_name },
     }} />
```

(Adjust `path` values to the app's actual route strings from `createPageUrl` — verify with the router config.) Terms/Privacy/Legal get `title` + description mentioning Neighbourly Exchange. Auth-gated pages (MySkills, Exchanges, Messages, NearbyMap, Profile, Settings, Verification, Admin, Login) get `<Seo title="…" noindex />`.

Add a visible breadcrumb on SkillDetail (`Home → Explore → {skill.title}`) using the existing `src/components/ui/breadcrumb.jsx`, plus BreadcrumbList JSON-LD in its `<Seo jsonLd>`.

- [ ] **Step 4: Create `public/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /messages
Disallow: /exchanges
Disallow: /settings
Disallow: /admin
Disallow: /profile
Sitemap: https://neighbourly-exchange.netlify.app/sitemap.xml
```

- [ ] **Step 5: Create the build scripts**

`scripts/routes.mjs`:

```js
// Public, prerenderable routes: [path, title, description]
export const ROUTES = [
  ['/', 'Neighbourly Exchange — Exchange Skills with Your Neighbors',
   'Connect with neighbors to share skills, services, and favors. No money needed — just skills and kindness.'],
  ['/explore', 'Explore Skills | Neighbourly Exchange',
   'Browse skills your neighbors are offering and requesting on Neighbourly Exchange.'],
  ['/terms', 'Terms of Service | Neighbourly Exchange',
   'The terms that govern using Neighbourly Exchange.'],
  ['/privacy', 'Privacy Policy | Neighbourly Exchange',
   'How Neighbourly Exchange collects, uses, and protects your data.'],
  ['/legal', 'Legal Notice | Neighbourly Exchange',
   'Legal information about the Neighbourly Exchange platform.'],
];
export const BASE_URL = process.env.URL || 'https://neighbourly-exchange.netlify.app';
```

`scripts/generate-sitemap.mjs`:

```js
import { writeFileSync } from 'node:fs';
import { ROUTES, BASE_URL } from './routes.mjs';

const today = new Date().toISOString().slice(0, 10);
const urls = ROUTES.map(([path]) =>
  `  <url><loc>${BASE_URL}${path}</loc><lastmod>${today}</lastmod></url>`).join('\n');
writeFileSync('dist/sitemap.xml',
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
console.log(`sitemap.xml written with ${ROUTES.length} routes`);
```

`scripts/prerender-meta.mjs` (per-route static HTML shells so crawlers get unique meta; full HTML prerender is a possible v2 upgrade):

```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { ROUTES, BASE_URL } from './routes.mjs';

const template = readFileSync('dist/index.html', 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

for (const [route, title, description] of ROUTES) {
  const html = template
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace('</head>', [
      `<meta name="description" content="${esc(description)}">`,
      `<link rel="canonical" href="${BASE_URL}${route}">`,
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(description)}">`,
      `<meta property="og:url" content="${BASE_URL}${route}">`,
      '</head>',
    ].join('\n'));
  const dir = route === '/' ? 'dist' : path.join('dist', route.slice(1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`prerendered meta for ${route}`);
}
```

Add to `package.json` scripts:

```json
"postbuild": "node scripts/generate-sitemap.mjs && node scripts/prerender-meta.mjs"
```

- [ ] **Step 6: Verify**

Run: `npm run build` → `dist/sitemap.xml` exists; `dist/explore/index.html` contains the Explore title/description; `dist/index.html` unchanged apart from Home meta. Run `npm run dev` and check the tab title changes per page.

- [ ] **Step 7: Commit**

```bash
git add src/components/Seo.jsx src/main.jsx public/robots.txt scripts/ package.json src/pages
git commit -m "feat: SEO — per-page meta, JSON-LD, robots, sitemap, prerendered meta shells"
```

---

### Task 15: Legal pages (Terms, Privacy, Legal Notice)

**Files:**
- Modify: `src/pages/Terms.jsx`, `src/pages/Privacy.jsx`, `src/pages/Legal.jsx`

Keep each page's existing card-based visual structure (icon + heading + cards, as in the prototype screenshots); replace the copy. All three: brand = Neighbourly Exchange, effective date = the real deploy date, and **no fabricated details** — operator facts use this exact placeholder pattern so they're greppable before launch:

```
[PLACEHOLDER — OPERATOR NAME]
[PLACEHOLDER — CONTACT EMAIL]
[PLACEHOLDER — JURISDICTION]
```

- [ ] **Step 1: `src/pages/Legal.jsx` — Legal Notice** with these section cards (structure from the prototype, truthful content):
  - **Operator Information** — operator name, contact email, address-if-any: all placeholders.
  - **Platform Description** — "Neighbourly Exchange is a community platform that facilitates skill exchanges between neighbors. The platform operates on a barter basis and does not process monetary transactions between members. We provide the technology to connect members but are not a party to any exchange agreement between them."
  - **Disclaimer** — "Neighbourly Exchange does not guarantee, endorse, or verify the quality, safety, legality, or suitability of any skills, services, or members. Members participate at their own discretion and risk. The Verified badge indicates a confirmed email and completed profile — it is not an identity or background check."
  - **Intellectual Property** — platform content owned by the operator; member content remains the member's, with a non-exclusive display license.
  - **Governing Law & Jurisdiction** — `[PLACEHOLDER — JURISDICTION]`.
  - **Dispute Resolution** — members resolve disputes directly; unresolved issues via the in-app report system or `[PLACEHOLDER — CONTACT EMAIL]`.
  - **Important Notice** — informational purposes only, consult a qualified attorney, notice may be updated at any time.

- [ ] **Step 2: `src/pages/Terms.jsx`** — sections: acceptance; eligibility (16+); the free, non-commercial barter rule (no money between members for exchanges); member conduct (accurate listings, respectful communication, no illegal services); moderation rights (we may hide listings, warn, suspend, or ban accounts that violate these terms, with in-app notice); exchanges are agreements between members — meet safely, platform not liable for outcomes; account termination and the right to delete your account in Settings; limitation of liability; changes to terms; contact placeholder.

- [ ] **Step 3: `src/pages/Privacy.jsx`** — sections: data we collect (account email, profile you write, listings, exchange records, messages); **location privacy** ("We store the area point you set. Other members only ever see an approximated location, offset by up to ~300 metres, and your suburb name — never your exact position or address"); processors (Supabase — database, auth, storage; Netlify — hosting); **no advertising trackers, no data selling, no analytics cookies**; message privacy (visible only to the two exchange participants and, on report review, moderators); retention & deletion (Settings → Delete account anonymizes counterparty records and erases your data); your rights (access, correction, deletion); contact placeholder.

- [ ] **Step 4: Verify + commit**

Check footer links route to all three pages. `grep -rn "Delaware\|DE-12345678\|Community Lane\|neighborskill" src/` → no matches.

```bash
npm run lint
git add src/pages/Terms.jsx src/pages/Privacy.jsx src/pages/Legal.jsx
git commit -m "feat: truthful legal pages with greppable operator placeholders"
```

---

### Task 16: Session timeout + account deletion

**Files:**
- Create: `src/hooks/useSessionTimeout.js`
- Modify: `src/Layout.jsx` (mount the hook), `src/pages/Settings.jsx` (delete-account card)

- [ ] **Step 1: Create `src/hooks/useSessionTimeout.js`**

```js
import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';

const INACTIVITY_MS = 30 * 60 * 1000;      // 30 min idle
const MAX_SESSION_MS = 24 * 60 * 60 * 1000; // 24 h absolute
const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const lastActivity = useRef(Date.now());
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;
    sessionStart.current = Date.now();
    const touch = () => { lastActivity.current = Date.now(); };
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity.current > INACTIVITY_MS ||
          now - sessionStart.current > MAX_SESSION_MS) {
        logout();
      }
    }, 60 * 1000);
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(interval);
    };
  }, [isAuthenticated, logout]);
}
```

Mount it once near the top of the `Layout` component: `useSessionTimeout();`

- [ ] **Step 2: Delete-account card in `src/pages/Settings.jsx`**

Add a "Danger zone" card with a destructive button opening an `AlertDialog` that requires typing `DELETE` into an input before enabling confirm:

```jsx
import { supabase } from '@/lib/supabase';

const handleDeleteAccount = async () => {
  try {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    await supabase.auth.signOut();
    window.location.assign('/');
  } catch (error) {
    toast.error(error.message || 'Account deletion failed');
  }
};
```

Dialog copy: "This permanently deletes your account, profile, and listings. Your past messages and reviews are kept for the other participant but de-identified. This cannot be undone."

- [ ] **Step 3: Verify manually** — delete a test account; sign-in with it fails; its skills are gone; its old messages show "Deleted member".

- [ ] **Step 4: Lint + commit**

```bash
npm run lint
git add src/hooks/useSessionTimeout.js src/Layout.jsx src/pages/Settings.jsx
git commit -m "feat: session timeout and GDPR-style account deletion"
```

---

### Task 17: Demo seed script

**Files:**
- Create: `scripts/seed.mjs`
- Modify: `.env.example` (document seed-only vars), `.gitignore` (ensure `.env*` ignored except `.env.example`)

**Interfaces:**
- Consumes: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars — **run locally only; the service key is never committed or put in Netlify.**
- Produces: 6 demo profiles + 8 demo skills, all rows `is_demo = true`; removal one-liner documented.

- [ ] **Step 1: Create `scripts/seed.mjs`**

```js
// Local-only seeding. Run:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (local use only).');
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false } });

const DEMO = [
  { name: 'Sarah Thompson', city: 'Queens, NY',   lat: 40.7282, lng: -73.7949,
    skills: [{ title: 'Dog Walking & Pet Sitting', category: 'pet care', type: 'offering',
               description: 'Animal lover offering dog walking and pet sitting. Experience with all breeds and sizes.',
               availability: 'Daily, flexible hours' }] },
  { name: 'Mike Johnson', city: 'Brooklyn, NY',   lat: 40.6782, lng: -73.9442,
    skills: [{ title: 'Home Electrical Repairs', category: 'home repairs', type: 'offering',
               description: 'Basic electrical repairs: outlet replacement, light fixtures, switches.',
               availability: 'Weekends' }] },
  { name: 'Maria Garcia', city: 'Astoria, NY',    lat: 40.7644, lng: -73.9235,
    skills: [{ title: 'Spanish Language Tutoring', category: 'languages', type: 'offering',
               description: 'Native speaker offering conversational practice and grammar lessons.',
               availability: 'Weekday evenings' }] },
  { name: 'Antoine Dubois', city: 'Queens, NY',   lat: 40.7128, lng: -73.7900,
    skills: [{ title: 'Professional Chef — Cooking Classes', category: 'cooking', type: 'offering',
               description: 'Retired chef offering lessons in your kitchen or mine. Italian and French cuisine.',
               availability: 'Weekends' }] },
  { name: 'Carol Williams', city: 'Brooklyn, NY', lat: 40.6850, lng: -73.9500,
    skills: [{ title: 'Need Help Setting Up Smart Home', category: 'technology', type: 'requesting',
               description: 'Looking for someone tech-savvy to set up smart home devices.',
               availability: 'Weekday afternoons' }] },
  { name: 'Priya Patel', city: 'Astoria, NY',     lat: 40.7700, lng: -73.9200,
    skills: [
      { title: 'Vegetable Garden Planning', category: 'gardening', type: 'offering',
        description: 'Help planning and planting a small vegetable garden this season.',
        availability: 'Weekends' },
      { title: 'Math Tutoring for High Schoolers', category: 'teaching', type: 'offering',
        description: 'Algebra through calculus. Patient, exam-focused tutoring.',
        availability: 'Weekday evenings' },
      { title: 'Looking for Bike Repair Help', category: 'home repairs', type: 'requesting',
        description: 'My commuter bike needs a tune-up — happy to trade tutoring.',
        availability: 'Flexible' },
    ] },
];

for (const person of DEMO) {
  const email = `${person.name.toLowerCase().replace(/[^a-z]+/g, '.')}@demo.neighbourly.local`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email, password: crypto.randomUUID(), email_confirm: true,
    user_metadata: { full_name: person.name },
  });
  if (error) { console.error(email, error.message); continue; }
  const uid = created.user.id;
  await admin.from('profiles').update({
    bio: `Hi, I'm ${person.name.split(' ')[0]} — happy to swap skills with neighbors!`,
    location: { city: person.city, lat: person.lat, lng: person.lng },
    is_demo: true,
  }).eq('id', uid);
  for (const skill of person.skills) {
    const { error: skillError } = await admin.from('skills')
      .insert({ ...skill, user_id: uid, is_demo: true });
    if (skillError) console.error(skill.title, skillError.message);
  }
  console.log(`seeded ${person.name}`);
}
console.log('Done. Remove all demo data later with:');
console.log("  delete from auth.users where id in (select id from profiles where is_demo);");
```

- [ ] **Step 2: Run it once** against the project (with the service key from Supabase dashboard → Settings → API). Verify Explore and the map show the demo skills.

- [ ] **Step 3: Commit** (script only — never the key)

```bash
git add scripts/seed.mjs
git commit -m "feat: local-only demo seed script with is_demo flags"
```

---

### Task 18: Netlify deployment + README

**Files:**
- Create: `netlify.toml`, `README.md`

- [ ] **Step 1: Create `netlify.toml`**

```toml
[build]
  command = "npm run build && npm run postbuild"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=()"

# SPA fallback — must come after the prerendered routes, which exist as real
# files and therefore win automatically on Netlify.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 2: Create `README.md`** covering: what the app is (one paragraph, brand + spec link); local dev (`cp .env.example .env`, fill Supabase creds, `npm install`, `npm run dev`); applying migrations (SQL editor order: 001 → 002 → 003); seeding; testing (`npm run test`); deploying (Netlify → connect repo → set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL` env vars → deploy); pre-launch checklist (replace `[PLACEHOLDER — …]` legal details, remove demo data, set custom domain, make yourself admin via SQL).

- [ ] **Step 3: Deploy**

Push the repo to GitHub (`gh repo create` or dashboard), connect it in Netlify, set the three env vars, deploy. Verify on the live URL: sign-up → post skill → second account → exchange → chat → complete → review; robots.txt and sitemap.xml resolve; `/explore` view-source shows the Explore-specific title.

- [ ] **Step 4: Final sweep + commit**

```bash
npm run test && npm run lint && npm run build
grep -ri "base44" src/ || echo CLEAN
grep -rn "PLACEHOLDER" src/pages   # expected: only the legal placeholders you know about
git add netlify.toml README.md
git commit -m "feat: Netlify deployment config and README"
```

---

## Plan Self-Review Notes

- **Spec coverage:** §3 stack/seam → Tasks 1, 5, 6, 8; §4 data model + RLS → Tasks 2, 3; §5.1 lifecycle → Task 2 (trigger) + existing Exchanges UI; §5.2 verification → Task 11; §5.3 moderation → Task 12; §5.4 location privacy → Tasks 2, 3, 10; §6 SEO → Task 14; §7 security/legal → Tasks 2, 3, 15, 16, 18 (headers); §8 testing → Tasks 1, 4, 5, 6 + manual gates; §9 deploy → Task 18; §10 v2 → reserved columns only (`kind`, `id_*`, `is_demo`), no payment code (correct — v1 free).
- **Known deviation from spec:** full-content prerendering (§6) is implemented as per-route meta shells (Task 14) — real `<title>/<meta>`/canonical per route, but body HTML still hydrates client-side. Full HTML prerender is listed as a v2 upgrade in the script comment. Accepted trade-off for a Vite SPA without SSR.
- **Type consistency check:** adapter signatures (`filter(where, sort, limit)`) match every call site found in the export; `auth.me()` returns the profiles row whose fields (`full_name`, `avatar_url`, `location.{city,lat,lng}`, `blocked_users`, `total_exchanges`, `is_verified`, `created_date`) match page usage; `UserWarning`/`ActivityLog` payloads in Task 12 match the Task 2 columns; `increment_skill_views(skill uuid)` matches the Task 8 RPC call.

