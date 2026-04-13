# Klinika Booking

Inpatient bed booking system for clinic staff (admin, registrar, doctor). Uzbek-language UI. Manages departments, rooms, beds, patients, reservations, admissions, and an audit log.

Stack: React 19 + Vite 6 + TypeScript · TailwindCSS · Zustand · TanStack Query · React Router (HashRouter) · Supabase (Postgres + Auth + RLS + Edge Functions + pg_cron) · Electron for desktop packaging.

## Quick start (local dev)

Requires Node 22+, npm, Docker (for local Supabase), and the Supabase CLI.

```bash
# 1. Install deps
npm install

# 2. Start local Supabase (Postgres + GoTrue + Edge runtime)
npx supabase start

# 3. Copy env vars. Values come from `npx supabase status`.
cp .env.example .env
# edit .env with the local URL (http://127.0.0.1:54321) and publishable key

# 4. Run the web app
npm run dev                 # http://localhost:5173

# 5. Run as Electron desktop app (optional)
npm run electron:dev
```

Seeded users (password `password123`):
- `admin@clinic.local` — full access
- `registrar@clinic.local` — reservations, check-in, patients
- `doctor@clinic.local` — discharges, pending-reservation approval

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — type-check + production bundle (`dist/`)
- `npm run typecheck` — `tsc -b` only
- `npm run lint` — ESLint (typescript-eslint)
- `npm run electron:dev` — launch Electron against the Vite dev server
- `npm run electron:build` — build web bundle, then package with electron-builder to `release/`

## Project layout

```
electron/main.cjs                  # Electron entry (loads dist/index.html in prod)
src/
  components/{beds,patients,reservations,ui,layout,...}
  pages/                           # Route pages (one per screen)
  hooks/                           # TanStack Query hooks per entity
  store/authStore.ts               # Zustand auth store (session + profile)
  lib/supabaseClient.ts            # Supabase client (reads VITE_ env vars)
supabase/
  migrations/                      # 001…007, applied in order
  functions/expire-reservations/   # Edge Function (fallback to pg_cron)
  seed.sql                         # Seed users + sample clinic data
tests/e2e/                         # Playwright smoke + file:// verification
```

## Database

Entities: `departments → rooms → beds`, `patients`, `reservations`, `admissions`, `audit_log`, `profiles`. Bed status (`free`/`reserved`/`occupied`/`maintenance`) is derived automatically by the `recompute_bed_status` trigger on reservation/admission changes — do not write `status` directly except for `maintenance` toggles.

Row Level Security is enforced: roles are stored in `profiles.role` and gating is done in SQL policies — the frontend is not a trust boundary.

## Deploying to Supabase Cloud (production)

1. **Create a project** at https://supabase.com/dashboard.

2. **Link the CLI and push migrations:**
   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
   This applies everything in `supabase/migrations/` in order.

3. **Enable extensions** (Dashboard → Database → Extensions): `pg_cron`, `pgcrypto`. `pg_cron` is required for the hourly reservation-expiry job in `007_schedule_expire.sql`.

4. **Create production users** via Dashboard → Authentication → Users (or invite-email flow). Then insert matching rows into `public.profiles` with the correct role. Do not run `supabase/seed.sql` in production — it contains test-only passwords.

5. **Deploy the Edge Function** (optional — pg_cron already runs the same job hourly):
   ```bash
   npx supabase functions deploy expire-reservations
   ```

6. **Point the web app at production:**
   ```bash
   # .env for the production build
   VITE_SUPABASE_URL=https://<your-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable key from Dashboard → API>
   ```

7. **Build:**
   ```bash
   npm run build            # web bundle → dist/
   npm run electron:build   # desktop installers → release/
   ```
   Supabase credentials are baked into the bundle at build time, so build once per environment.

## Electron packaging notes

- HashRouter + `base: './'` in `vite.config.ts` make asset paths work under `file://`.
- `webSecurity: false` is set in production windows so ESM modules can load under `file://` (dev uses the Vite server and keeps web security on).
- Output targets: AppImage + deb (Linux), NSIS (Windows), DMG (macOS). See the `build` block in `package.json`.

## Auto-update (electron-updater + GitHub Releases)

The desktop app checks for updates on startup against GitHub Releases via `electron-updater`. When a newer published release is found, the installer is downloaded in the background and the user is prompted (Uzbek dialog) to install on next quit or immediately. Wired in `electron/main.cjs` → `setupAutoUpdate()`.

### One-time setup

1. Repo is configured as [github.com/xtreme-uz/med-clinic](https://github.com/xtreme-uz/med-clinic) (`build.publish` block in `package.json`).
2. Create a Personal Access Token at https://github.com/settings/tokens with `public_repo` scope and export it locally:
   ```bash
   export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   The token only lives on the publishing machine — it is **not** bundled into the installer. End users need no token.

### Cutting a release

```bash
npm version patch              # bumps 0.0.0 → 0.0.1 in package.json
npm run electron:publish       # build + electron-builder --publish always
```

This builds installers, generates `latest-linux.yml` (and platform equivalents), and uploads everything to a **draft** GitHub Release. Open the repo's Releases page and click **"Publish release"** — `electron-updater` only sees published releases.

Existing installs will pick up the new version on their next launch and show the install prompt.

### Platform support for auto-update

- **Linux AppImage** — works without code signing. Use this as the primary distribution channel.
- **Linux .deb** — auto-update is **not** supported (managed via `apt`). If auto-update is the priority, drop `"deb"` from `build.linux.target`.
- **Windows NSIS** — requires a code-signing certificate (EV/OV). Set `CSC_LINK` + `CSC_KEY_PASSWORD` env vars before publishing.
- **macOS DMG** — requires Apple Developer ID + notarization. Set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` env vars.

Without signing, the unsigned Win/Mac installers will still build but auto-update will fail at install time. Linux-only is the simplest path until certificates are in place.

### Local testing

```bash
chmod +x "release/Klinika Booking-0.0.0.AppImage"
"./release/Klinika Booking-0.0.0.AppImage"
```

To prove the update flow end-to-end: publish v0.0.0, install it, then publish v0.0.1 and reopen the v0.0.0 installer — within a few seconds the "Yangilanish tayyor" dialog should appear.

## CI

`.github/workflows/ci.yml` runs lint + typecheck + build on every push and PR. Playwright tests are not in CI — they need a live Supabase stack.

## Testing

```bash
npx playwright install --with-deps    # first time only
npm run dev                           # or rely on playwright's webServer
npx playwright test                   # 3 smoke tests + file:// packaged-build test
```

## Troubleshooting

- **GoTrue "converting NULL to string" on login** — `auth.users` seed rows are missing the empty-string defaults on token columns. See `supabase/seed.sql`.
- **`supabase start` fails on logflare/analytics** — analytics is disabled in `supabase/config.toml`; if you re-enable it, expect ECR rate limits pulling the image.
- **Bed status not updating after a reservation change** — the `tr_reservation_after` trigger recomputes status. If you add a new reservation mutation path, make sure it goes through the table, not a bypass.
