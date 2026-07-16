# Neighbourly Exchange — Project Status

**Version:** v1 (free release) · **Branch:** `feature/supabase-port` (26 commits, not yet merged to `master`)
**Last updated:** 2026-07-15
**State:** Code complete and reviewed. Not yet run against a live database. Not yet deployed.

---

## What happened

### The starting point

The project began as **NeighborSkill**, a prototype generated on the Base44
platform. It had a good UI (React + Vite + Tailwind/shadcn, emerald-green
theme) but its auth, database, and hosting were locked to Base44's paid
platform, its homepage showed fabricated stats ("2,500+ members"), and its
legal pages contained invented company details.

### What was built

The app was rebuilt as **Neighbourly Exchange** on a fully self-owned stack,
following the approved design spec
([docs/superpowers/specs/2026-07-14-neighbourly-exchange-design.md](superpowers/specs/2026-07-14-neighbourly-exchange-design.md))
and an 18-task implementation plan
([docs/superpowers/plans/2026-07-14-neighbourly-exchange.md](superpowers/plans/2026-07-14-neighbourly-exchange.md)).
Every task was implemented and independently code-reviewed.

**Stack:** React 18 + Vite · Supabase (Postgres, Auth, Realtime, Storage) ·
Leaflet + OpenStreetMap · Netlify. No Base44 code remains.

**Core features:**

- **Auth** — own login page (email/password + magic link), Supabase sessions,
  session timeout (30 min idle / 24 h max), suspended-account screen
- **Skills** — post/browse/search offerings and requests, categories,
  view counters
- **Exchanges** — full lifecycle `pending → accepted → in_progress → completed`
  (plus declined/cancelled/disputed), enforced by a database state machine
- **Messaging** — chat scoped to each exchange, live via Supabase Realtime
- **Reviews** — unlock only after completion, ratings aggregate automatically
  via database trigger
- **Nearby Map** — Leaflet map with privacy-fuzzy pins
- **Verification** — v1 "Verified" badge = confirmed email + completed profile,
  approved by an admin. Explicitly *not* an identity check (the UI says so).
  Phone OTP is behind a config flag (`VITE_PHONE_VERIFICATION`); ID
  verification is deferred to v2
- **Admin moderation** — reports queue, hide listing, warn user (visible in
  the user's Settings), ban/unban, verification queue, full audit log
- **Privacy by architecture** — exact coordinates and phone numbers never
  leave the owner's session. Other users only ever see a location offset by
  ~300 m (computed by a database trigger, so the real value never reaches
  another browser). Row-Level Security on every table. No ads, no trackers,
  no analytics cookies
- **SEO** — per-page titles/descriptions/OG tags, JSON-LD structured data,
  breadcrumbs, robots.txt, generated sitemap.xml, prerendered meta shells for
  public pages
- **Legal** — truthful Terms, Privacy, and Legal Notice pages. Operator
  details are greppable placeholders (`[PLACEHOLDER — …]`) until real ones
  are supplied
- **GDPR-style deletion** — Settings → Delete account (type DELETE to
  confirm); counterparty messages/reviews are kept but de-identified
- **Real stats** — homepage numbers come from a database function, never
  hard-coded

**Key decisions made along the way:**

- v1 is **completely free** — monetization (local business tier, featured
  listings, Stripe) is designed but deferred to v2 (spec §10)
- Google AdSense was rejected: it contradicts the privacy-first positioning
- Marketing copy must be rewritten before use — earlier drafts promised ID
  verification, which v1 deliberately does not do

**Quality state:** 12/12 unit tests pass, ESLint 0 errors, production build
clean. Every commit was reviewed; notable bugs caught and fixed during review
include an RLS gap that would have let anyone message anyone, a TanStack Query
v5 API misuse that invalidated the whole cache on every chat message, and a
session-cap reset bug triggered by hourly token refreshes. Known ship-as-is
minor items are listed in `.superpowers/sdd/progress.md`.

---

## What needs to be done next

### 1. First live test (~10 minutes of setup, owner action required)

The app has **never run against a real database** — this is the most
important next step. Full instructions are in [README.md](../README.md); in
short:

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Run the three migrations in `supabase/migrations/` **in order** (001 → 002
   → 003) via the SQL Editor
3. `cp .env.example .env` and fill in `VITE_SUPABASE_URL` +
   `VITE_SUPABASE_ANON_KEY` (Dashboard → Settings → API)
4. Optional, for easier testing: Authentication → Sign In/Up → Email → turn
   off "Confirm email"
5. `npm install && npm run dev` → http://localhost:5173
6. After signing up, make yourself admin:
   `update profiles set is_admin = true where email = 'you@…';`
7. Optionally seed demo data:
   `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed.mjs`

**Test the full loop with two accounts:** sign up → post a skill → request an
exchange from account 2 → accept → chat (should update live) → complete →
leave reviews → check the map, the Verified flow, and the admin
hide/warn/ban actions.

### 2. Merge

Once the live test passes, merge `feature/supabase-port` into `master`.

### 3. Deploy (Netlify)

1. Push the repo to GitHub, connect it in Netlify (settings come from
   `netlify.toml`)
2. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_SITE_URL`
3. In Supabase → Authentication → URL Configuration, set the Site URL to the
   deployed URL (so email links redirect correctly)

### 4. Before public launch

- [ ] Replace the `[PLACEHOLDER — …]` operator details on the legal pages
      (`grep -rn "PLACEHOLDER" src/pages`) — needs your real operator name,
      contact email, and jurisdiction
- [ ] Remove demo data:
      `delete from auth.users where id in (select id from profiles where is_demo);`
- [ ] Custom domain + update `VITE_SITE_URL`
- [ ] Rewrite the social/marketing posts to match v1's actual trust story
      (profile verification + tracked exchanges + reviews — not ID checks)

### 5. v2 roadmap (designed, not built — spec §10)

- Payments via Stripe: Local Business tier (~$9–15/mo, sponsor cards) and
  featured listings (~$3 one-off). Schema columns already reserved
- ID-Verified premium trust tier (document upload + admin review)
- Phone OTP verification (flip `VITE_PHONE_VERIFICATION=on` once an SMS
  provider like Twilio is connected)
- Full-content prerendering of public pages (current build prerenders
  per-route meta shells)
