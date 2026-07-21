## Goal

Make the app deployable to Netlify using only `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` (plus their `VITE_` twins). No server code will need `SUPABASE_SERVICE_ROLE_KEY`.

## What changes

### 1. Database migration (RLS + grants)

Two gaps today: the admin dashboard needs to read `bookings`, and the public booking form needs to call `get_unavailable_ranges()` — both currently work only because the code uses the service-role client.

- Add RLS policy on `bookings`: admins can `SELECT`, `UPDATE`, `DELETE` (via `has_role(auth.uid(), 'admin')`). The existing anon `INSERT` policy stays.
- Grant `SELECT, UPDATE, DELETE` on `public.bookings` to `authenticated` (currently only `INSERT` is reachable).
- `GRANT EXECUTE` on `public.get_unavailable_ranges()` and `public.get_booked_ranges()` to `anon` and `authenticated` so the publishable-key client can call them.

No new tables, no schema changes to `settings` / `blocked_dates` / `user_roles` — their policies already work with a user-scoped or anon client.

### 2. `src/lib/admin.functions.ts` — use the user-scoped client

Replace every `supabaseAdmin` call with `context.supabase` from `requireSupabaseAuth`. The existing admin RLS policies on `settings`, `blocked_dates`, and (new) `bookings` will authorize the admin automatically — no more manual `assertAdmin()` helper needed (RLS is the check).

Reads/writes affected: fetch settings, list blocked dates, list bookings, update contact email, update nightly rate, insert blocked range, delete blocked range.

### 3. `src/lib/bookings.functions.ts` — use a server publishable client

Create a small helper inside the file (per `tanstack-server-functions` guidance) that builds a `createClient` with `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, no session persistence, and the `sb_`-key `fetch` shim (harmless for legacy JWT keys).

- `getUnavailableRanges`, `getNightlyRate`, `getContactEmail`: call through the publishable client. All three targets have public SELECT / SECURITY DEFINER access.
- `submitBooking`: read `settings.nightly_rate_aud`, call `get_unavailable_ranges` RPC, and `insert` into `bookings` — all allowed for `anon` by the existing policies. The nights/total/discount math stays server-side, so the client can't tamper with the price.

### 4. Remove the service-role import path

After the two files above stop using it, `supabaseAdmin` is no longer imported anywhere. Leave `src/integrations/supabase/client.server.ts` in place (it's auto-generated and harmless when unused) — just don't reference it.

### 5. Netlify env vars

Configure in **Netlify → Site settings → Environment variables**:

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

No `SUPABASE_SERVICE_ROLE_KEY` needed.

## Order of operations

1. Run the migration (add admin policies on `bookings`, grants, RPC EXECUTE grants). You'll approve it before it runs.
2. After the migration is applied and types regenerate, edit `admin.functions.ts` and `bookings.functions.ts`.
3. Verify: build succeeds, `/admin` still lists bookings + edits settings/blocks when signed in as the admin, `/` booking widget still shows unavailable dates and accepts a submission.

## Behavior preserved

- Same admin email gate (RLS on the `admin` role via `user_roles`).
- Same 2-night minimum, same 10%-over-4-nights discount, same overlap check, same fields written to `bookings`.
- No UI changes.
