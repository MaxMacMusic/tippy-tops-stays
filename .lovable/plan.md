## Goal

Fix "Could not save booking. Please try again." without adding the service-role key and without exposing bookings PII.

## Root cause

`submitBooking` uses the anon client and calls `.from("bookings").insert(...).select().single()`. The `bookings` table intentionally has no SELECT policy for anon (PII), so the `RETURNING` step fails even when the INSERT itself is allowed.

## Fix

### 1. New migration — `public.create_booking` SECURITY DEFINER RPC

Create a fresh migration file (leave existing migrations untouched) that:

- Defines `public.create_booking(p_guest_name text, p_email text, p_phone text, p_check_in date, p_check_out date, p_guests int, p_nights int, p_total_aud int, p_message text, p_status text) returns table(id uuid, nights int, total_aud int)`.
- `language plpgsql`, `security definer`, `set search_path = public`.
- Re-validates `p_nights >= 2` → raise exception `'MIN_NIGHTS'`.
- Re-checks overlap using `get_unavailable_ranges()` (`start_date < p_check_out AND end_date > p_check_in`) → raise exception `'UNAVAILABLE'`.
- Inserts a single row into `public.bookings` with the passed fields.
- Returns `id, nights, total_aud` of the inserted row.
- Grants: `revoke all on function public.create_booking(...) from public;` then `grant execute ... to anon, authenticated;`.
- Strictly scoped — only touches `bookings` (insert) and `get_unavailable_ranges()`.

No changes to existing policies, grants, or the anon INSERT policy on `bookings`.

### 2. Update `src/lib/bookings.functions.ts`

In `submitBooking`:

- Keep the zod validation, nights/subtotal/discount/total math, and the pre-check via `get_unavailable_ranges` (nice UX, cheap).
- Replace the `.from("bookings").insert(...).select().single()` block with:
  ```ts
  const { data: rows, error } = await supabase.rpc("create_booking", {
    p_guest_name: data.guest_name,
    p_email: data.email,
    p_phone: data.phone || null,
    p_check_in: data.check_in,
    p_check_out: data.check_out,
    p_guests: data.guests,
    p_nights: nights,
    p_total_aud: total,
    p_message: data.message || null,
    p_status: data.kind === "enquiry" ? "enquiry" : "pending",
  });
  ```
- Error mapping:
  - `error.message` contains `UNAVAILABLE` → throw `"Those dates are no longer available."`
  - `error.message` contains `MIN_NIGHTS` → throw `"Minimum 2 nights stay required."`
  - Any other error → log and throw `"Could not save booking. Please try again."`
- Return `{ id, nights, total_aud }` from the first returned row.

No other changes anywhere.

### 3. Verify

- Build succeeds after types regenerate.
- Submit an "enquiry" and a "booking" from `/` — both succeed and the calendar refreshes with the new unavailable range for `booking`.
- Confirm `bookings` remains not publicly readable (anon SELECT still denied).
- Admin dashboard, settings, blocked_dates, env vars, and UI untouched.

## Out of scope

UI, admin functions, settings/blocked_dates logic, env variables, service-role key.
