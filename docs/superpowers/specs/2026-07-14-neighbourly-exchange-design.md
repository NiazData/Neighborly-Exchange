# Neighbourly Exchange — Design Spec

**Date:** 2026-07-14
**Status:** Approved pending user review
**Author:** Niaz Mahmud with Claude Code

## 1. Summary

Neighbourly Exchange is a neighborhood skill-exchange web app: residents create a
profile, post skills they offer or need, find nearby neighbors on a map, agree on
exchanges, chat, and review each other after completion. No money changes hands
between neighbors.

It is a rebuild of the Base44-generated prototype "NeighborSkill". The exported
frontend (React + Vite + Tailwind + shadcn/Radix) is kept; the Base44 platform
(SDK, auth, data, hosting) is replaced with Supabase and Netlify, which the owner
fully controls.

**Version 1 is completely free for all users.** Monetization (local business
tier, featured listings, Stripe) is deferred to v2 and documented in the roadmap
section so v1 decisions do not block it.

## 2. Goals and non-goals

### Goals (v1)

- Own the entire stack: code, auth, data, hosting. No Base44 dependency.
- Core loop: profile → post/browse skills → request exchange → chat → complete → review.
- Nearby map with privacy-preserving fuzzy locations.
- Tiered trust: email confirm (automatic) → "Verified" badge (profile completeness,
  phone OTP when SMS provider is connected) → "ID Verified" (v2).
- Admin moderation: reports queue, hide listing, warn user, ban user.
- SEO/GEO: prerendered public pages, per-page meta, JSON-LD, sitemap, robots.txt.
- Legal pages: Terms, Privacy, Legal Notice.
- Free hosting tier friendly (Supabase free tier + Netlify free tier).

### Non-goals (v1)

- Payments of any kind (v2).
- ID document upload/review (v2, opt-in premium trust tier).
- Safety alerts, events, gifting, news feeds (possible v3+; out of scope).
- Native mobile apps (responsive web only).
- Google AdSense or any tracking-based advertising (conflicts with the
  privacy-first positioning; revisit only if positioning changes).

## 3. Architecture

### 3.1 Stack

| Layer | Choice |
|---|---|
| Frontend | Existing Vite + React 18 + Tailwind + shadcn/Radix export, React Router |
| Backend | Supabase: Postgres, Auth, Realtime, Storage |
| Map | Leaflet + OpenStreetMap tiles (no API key) |
| Hosting | Netlify free tier, SPA redirects, prerendered public pages |
| Repo | New standalone git repo in this folder (it currently sits inside a repo accidentally rooted at `C:\Users\niazs`) |

### 3.2 Backend seam

All Base44 SDK usage is replaced behind a thin data layer so pages change
minimally:

```
src/lib/supabase.js     Supabase client (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
src/api/auth.js         signUp, signIn, signOut, me(), updateMe()
src/api/skills.js       list/filter/create/update/delete, view counter
src/api/exchanges.js    request, accept, decline, start, complete, cancel
src/api/messages.js     list by exchange, send, mark read, realtime subscribe
src/api/reviews.js      create (gated), list by user/skill
src/api/profiles.js     public profile reads, own-profile updates
src/api/admin.js        reports queue, hide listing, warn, ban, verification queue
```

Each module exposes call shapes close to what pages already use
(`Skill.list()`, `Exchange.update()` etc.) to minimize page churn.

`AuthContext.jsx` is rewritten around Supabase sessions. Base44's hosted login
is replaced by our own `/login` page (email/password + magic link).
`redirectToLogin` becomes a route navigation.

### 3.3 Pages (ported from export)

Home, Explore, SkillDetail, MySkills, Exchanges, Messages, NearbyMap, Profile,
UserProfile, Settings, Verification, Admin, Login (new), Terms, Privacy,
Legal Notice. Branding: "Neighbourly Exchange" replaces "NeighborSkill"
throughout; the light green/sleek visual language is kept as-is.

Home-page stats (members, exchanges, ratings) are computed from real data, not
hard-coded marketing numbers.

## 4. Data model (Postgres)

All tables have `created_at`/`updated_at`. RLS enabled on every table.

| Table | Columns (key ones) | Notes |
|---|---|---|
| `profiles` | id (= auth.users.id), display_name, avatar_url, bio, area_text (e.g. "Queens, NY"), lat, lng (private), fuzzy_lat, fuzzy_lng (public), phone, phone_verified, is_verified, is_admin, warnings_count, banned_at, rating_avg, rating_count | Row created by trigger on signup. Fuzzy coords computed by DB trigger (~300 m random offset), so exact location never reaches other clients. |
| `skills` | id, owner_id → profiles, title, description, category, type (`offering`\|`requesting`), availability, status (`active`\|`paused`\|`hidden`\|`removed`), views | `hidden` = admin action; `paused`/`removed` = owner action. Fixed category list to start (matches prototype: home repairs, technology, gardening, cooking, teaching, pet care, languages, …). |
| `exchanges` | id, skill_id, requester_id, provider_id, status, accepted_at, started_at, completed_at, cancelled_at | Status machine in §5.1. |
| `messages` | id, exchange_id, sender_id, body, read_at | Chat scoped to an exchange. Realtime enabled. |
| `reviews` | id, exchange_id, reviewer_id, reviewee_id, rating 1–5, comment | One review per participant per exchange; only when exchange `completed` (enforced by RLS + trigger). Trigger updates `profiles.rating_avg/rating_count`. |
| `verification_requests` | id, user_id, kind (`phone`), status (`pending`\|`approved`\|`rejected`), reviewed_by | `kind='id'` added in v2. |
| `reports` | id, reporter_id, target_type (`skill`\|`user`\|`message`\|`exchange`), target_id, reason, details, status (`open`\|`resolved`\|`dismissed`), resolved_by | Feeds Admin queue; exchange disputes use `target_type='exchange'`. |
| `user_warnings` | id, user_id, admin_id, reason | Trigger increments `profiles.warnings_count`; user sees warnings in Settings. |
| `activity_logs` | id, actor_id, action, target_type, target_id, metadata jsonb | Admin dashboard feed; also records admin actions (hide/warn/ban) for audit. |

### RLS policy summary

- `profiles`: public fields (display_name, avatar_url, area_text, rating,
  is_verified) readable by anyone — including anonymous, so prerendered public
  pages work — via a `public_profiles` view; lat, lng, phone, warnings_count
  excluded. Owner reads/updates own row; admins read all. Banned users
  (`banned_at` set) fail all write policies.
- `skills`: anyone (including anonymous, for SEO) reads `active` skills; owner
  full CRUD on own; admin can set `hidden`.
- `exchanges`/`messages`: only the two participants read/write; messages
  insert-only (no edits), `read_at` updatable by recipient.
- `reviews`: participants insert post-completion; everyone reads.
- `reports`/`user_warnings`/`activity_logs`/`verification_requests`: writer
  inserts own; only admins read the queues; users read their own warnings.

## 5. Key flows

### 5.1 Exchange lifecycle

```
pending ──accept──► accepted ──start──► in_progress ──complete──► completed
   │                    │                    │
   └─decline──► declined└─cancel──► cancelled┘  (either party may cancel
                                                 before completion)
```

- Requester creates exchange on a skill (one open exchange per user per skill).
- Provider accepts or declines. Both parties see the timestamped status trail.
- Either party marks "start" when work begins; both must confirm completion
  (provider marks complete → requester confirms) to reach `completed`.
- Reviews unlock at `completed` only. Both parties may review each other once.
- Messaging is available from `pending` onward, closed at terminal states
  (thread stays readable).

### 5.2 Verification tiers

1. **Email confirmed** — automatic via Supabase Auth; required to do anything.
2. **Verified badge** — profile completeness: photo + bio + location set, plus
   phone OTP when an SMS provider (e.g. Twilio) is configured. Until then the
   badge requires only the completeness checks; the OTP requirement is a single
   config flag (`VITE_PHONE_VERIFICATION=on`). UI copy never claims ID checks.
3. **ID Verified** — v2, optional premium trust tier (document upload + admin
   review). All marketing copy for v1 must be rewritten to promise phone/profile
   verification + tracked exchanges + reviews — not ID verification.

### 5.3 Moderation (Admin page)

- **Reports queue:** open reports with target preview; resolve or dismiss.
- **Hide listing:** sets skill status `hidden`; owner notified in-app, can appeal
  via report; hidden skills invisible everywhere except to owner + admins.
- **Warn user:** creates `user_warnings` row with reason; user sees a banner and
  the warning in Settings.
- **Ban user:** sets `profiles.banned_at`; all write RLS policies fail; on next
  load the app signs the user out to a "account suspended" screen; their active
  skills auto-hide. Unban clears the flag.
- All admin actions are written to `activity_logs`.
- Verification queue: approve/reject phone verification requests (manual
  fallback while OTP flag is off).

### 5.4 Location privacy

- User sets location by picking a point on a map or entering suburb/postcode
  (geocoded via Nominatim, respecting its usage policy).
- Exact lat/lng stored privately; DB trigger writes fuzzy coords offset randomly
  within ~300 m; only fuzzy coords are exposed via the public view.
- Map pins and "1.2 km away" labels use fuzzy coords. Exact addresses are never
  collected at all.
- Distance filtering happens server-side (Postgres `earthdistance`/PostGIS on
  fuzzy coords) so clients never see other users' raw coordinates.

## 6. SEO & GEO

- **Meta:** react-helmet-async; unique title + description per page, brand name
  included; Open Graph + Twitter cards with a branded share image.
- **Structured data (JSON-LD):** `Organization` + `WebSite` on Home,
  `BreadcrumbList` on detail pages, `Service` on public skill pages.
- **Breadcrumbs:** visible breadcrumbs on SkillDetail and profile pages.
- **Crawlability:** `public/robots.txt`; `sitemap.xml` generated at build from
  the route list; public pages (Home, Explore, SkillDetail, Terms, Privacy,
  Legal Notice) prerendered to static HTML at build time so crawlers and AI
  tools see real content. Auth-gated pages excluded from sitemap and noindexed.
- Addresses every issue from the Base44 SEO scan: brand info, website label,
  app name in description, per-page titles/descriptions, sitemap, robots.

## 7. Security & privacy

- RLS on every table (§4); no service-role key in the frontend, ever.
- Exact coordinates and phone numbers never leave the owner's session.
- Rate limiting: Postgres policies/triggers cap message sends, report creation,
  and exchange requests per user per hour to blunt spam.
- Session timeout: inactivity + max-age sign-out (same pattern as the owner's
  e-commerce site).
- Account deletion: user-initiated, cascades (skills, exchanges anonymized,
  messages retained for the counterparty but de-identified) — GDPR-style.
- Input sanitation on all user content; messages/bios rendered as plain text.
- No analytics trackers in v1; if analytics are wanted, use a cookieless option.

### Legal pages

- **Terms of Service** — exchange conduct, no-commercial-transactions rule,
  moderation rights (hide/warn/ban), liability disclaimer for neighbor meetups.
- **Privacy Policy** — data collected, fuzzy-location explanation, processors
  (Supabase, Netlify), no ad tracking, deletion rights, contact.
- **Legal Notice** — operator identity/contact (like the original app's Legal
  page). Footer links to all three, as in the prototype.

## 8. Testing

- Vitest + React Testing Library.
- Priority coverage: exchange status machine (valid/invalid transitions),
  review gating (no review before `completed`), fuzzy-location offset utility,
  api-layer modules against a mocked Supabase client, RLS policies via SQL
  tests (supabase test or pgTAP-lite approach).
- Seed script: demo neighbors/skills/exchanges so the app never looks empty;
  demo rows flagged `is_demo` for one-command removal at real launch.

## 9. Deployment

- Netlify: build (`vite build` + prerender + sitemap steps), SPA redirect rule,
  env vars for Supabase URL/anon key.
- Supabase: schema + RLS + triggers managed as SQL migration files committed in
  `supabase/migrations/`.
- Custom domain recommended at launch (trust + SEO); Netlify handles TLS.

## 10. v2 roadmap (designed-for, not built)

- **Payments (Stripe Checkout + webhook via Supabase Edge Function):**
  - Local Business tier (~$9–15/mo): business profile, logo, website link,
    "Local Business" badge, rotating clearly-labeled "Local Sponsors" card on
    Home/Explore. Direct-sold, no user tracking.
  - Featured listings (~$3 one-off): pin a skill to top of Explore for 7 days.
  - Schema additions reserved: `profiles.plan`, `profiles.stripe_customer_id`,
    `business_profiles`, `payments`, `skills.featured_until`.
- **ID Verified tier:** document upload to private Storage bucket + admin
  review + auto-purge of documents after decision.
- **Phone OTP on:** flip config flag once Twilio (or similar) is connected.
- Marketing copy can then be upgraded to match the ID-verification story.

## 11. Open items

- Operator details for the Legal Notice page (name/contact) — needed from the
  owner before launch, placeholder until then.
- Final category list for skills (start with the prototype's eight).
