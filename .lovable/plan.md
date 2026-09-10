# Editable “starting from” price

## What will change
- Replace the booking form’s default `Total: $380 AUD` line with `Starting from only $190 a night` before dates are selected.
- Keep showing the exact `Total: $X AUD` once guests select check-in and check-out dates.
- Drive the starting price from the existing editable midweek nightly rate, which is currently $190.
- Keep the existing owner dashboard control for changing that rate; updates will automatically change the public “starting from” amount.

## Technical details
- Update the booking display to switch between the starting nightly rate and the calculated stay total.
- Reuse the existing `nightly_rate_aud` setting and its admin update action, so no database change is needed.
- Verify the wording and amount before and after selecting dates.
