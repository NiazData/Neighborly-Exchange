# Neighborly Exchange

Neighborly Exchange is a neighborhood skill-exchange web app: residents create a
profile, post skills they offer or need, find nearby neighbors on a
privacy-preserving map, agree on exchanges, chat in realtime, and review each
other after completion. No money changes hands between neighbors — v1 is
completely free, with no ads and no tracking.

Design spec: [docs/superpowers/specs/2026-07-14-neighborly-exchange-design.md](docs/superpowers/specs/2026-07-14-neighbourly-exchange-design.md)
Implementation plan: [docs/superpowers/plans/2026-07-14-neighborly-exchange.md](docs/superpowers/plans/2026-07-14-neighborly-exchange.md)

**Stack:** React 18 + Vite + Tailwind/shadcn · Supabase (Postgres, Auth,
Realtime, Storage) · Leaflet + OpenStreetMap · Netlify

## Local development

```bash
cp .env.example .env      # then fill in your Supabase project values
npm install
npm run dev
```

`.env` needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your
Supabase project (Dashboard → Settings → API). Never put the service-role key
in any file.

## Database setup

Create a free project at [supabase.com](https://supabase.com), then run the
migrations **in order** in the SQL Editor (Dashboard → SQL Editor → paste →
Run):

1. `supabase/migrations/001_schema.sql` — tables, triggers (fuzzy location,
   exchange state machine, rating aggregation, rate limits), RPCs
2. `supabase/migrations/002_rls.sql` — row-level security, `public_profiles`
   view, avatars storage bucket
3. `supabase/migrations/003_views_rpc.sql` — view-counter RPC

Make yourself an admin afterwards:

```sql
update profiles set is_admin = true where email = 'you@example.com';
```

## Demo data (optional)

Seeds 6 demo neighbors + 8 skills, all flagged `is_demo`:

```bash
SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-KEY \
node scripts/seed.mjs
```

Remove all demo data later:

```sql
delete from auth.users where id in (select id from profiles where is_demo);
```

## Testing

```bash
npm run test     # Vitest unit tests
npm run lint     # ESLint
npm run build    # production build + sitemap + prerendered meta shells
```

## Deploying (Netlify)

1. Push this repo to GitHub and connect it in Netlify (build settings come
   from `netlify.toml`).
2. Set environment variables in Netlify → Site settings → Environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL` — your canonical site URL (keeps client meta, sitemap,
     and prerendered shells in lockstep; required when you add a custom domain)
3. Deploy. Verify on the live URL: sign-up → post skill → second account →
   exchange → chat → complete → review; `/robots.txt` and `/sitemap.xml`
   resolve; view-source of `/Explore` shows its own title.
4. In Supabase → Authentication → URL Configuration, set the Site URL to your
   deployed URL so email confirmation/magic links redirect correctly.

## Pre-launch checklist

- [ ] Replace the `[PLACEHOLDER — …]` operator details in the Terms, Privacy,
      and Legal Notice pages (`grep -rn "PLACEHOLDER" src/pages`)
- [ ] Apply all three migrations to the production Supabase project
- [ ] Set yourself as admin; verify hide/warn/ban work
- [ ] Remove demo data (SQL above)
- [ ] Add a custom domain and set `VITE_SITE_URL` to it
- [ ] Run the full exchange loop end-to-end with two real accounts
