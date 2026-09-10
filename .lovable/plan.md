# Booking dates and request button — what I found and what to fix

## What I checked

I opened the live site at your screen size and tried to book. The result:

- The calendar does render and dates **are** clickable. I selected 28–30 Sep and it priced it correctly ($620, school holiday rate).
- The "Request these dates" button did work — my test click actually saved a booking request into your bookings list.
- Earlier today the whole page was failing to load because of three broken photo links. That has since been fixed, so a stale/blank page in your browser tab is the most likely reason it felt dead.

So nothing is fundamentally broken, but three things make it *feel* broken, and one thing needs cleaning up.

## What to fix

1. **Remove my test booking.** My check created a request from "Test / a@b.com" for 28–30 Sep, which is now greying those dates out. Delete that row.
2. **Explain why the button is greyed out.** Right now the button silently disables until dates are picked *and* name and email are filled. Add a short line under it saying exactly what's still needed ("Pick your dates", "Add your name and email"), so it never looks broken.
3. **Make the button respond instantly.** Submitting currently waits for the notification email to be sent before it reacts, which can leave it sitting on "Sending…" for several seconds. Show progress immediately and stop the email step from holding up the guest's confirmation.
4. **Show that a single tapped date is registered.** After the first tap the panel still says "Select your check-in and check-out dates", which reads as "my tap did nothing". Show the chosen check-in date and prompt for check-out.

Also worth knowing: a lot of late-September dates are greyed out because of old test enquiries and bookings still sitting in your list (27–30 Sep, 26–29 Sep, 22–24 Sep). You can cancel or delete those from the owner dashboard to open the dates back up — tell me if you'd like me to clear the obvious test ones.

## Technical details

- Delete booking `a668d8d6-a33e-402c-bda5-d79e9b0cedc1` from `public.bookings`.
- In `src/components/BookingWidget.tsx`: derive a `missing` reason from `nights`, `guest_name`, `email` and render it below the submit buttons; render a "check-in selected → pick check-out" state in the summary panel when `range.from` exists without `range.to`.
- In `src/lib/bookings.functions.ts` `submitBooking`: keep the Resend notification but stop awaiting it on the critical path (fire it and log failures) so the RPC result returns straight away; behaviour on failure stays unchanged.
- Re-verify in the browser: tap one date, tap a second, fill the form, submit, and confirm the toast appears without a multi-second stall.
