# Rules — 05 today as home

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Shared rules: [../README.md](../README.md).

- Today’s counts use the same functions as the booking lenses, including same-day shift arrivals. Do not reimplement the date math in the component.
- In house on this panel is the lens: `CONFIRMED` stays that cover today. It is not `totalCount - availableCount`.
- Default tab is Today only when the URL has no known hash. `/dashboard#hotel_admin_profile` still opens Profile.
- New hashes are `hotel_admin_today` and `hotel_employee_today`. Do not reuse another section’s id.
- Admin Today does not render employee room-status editors.
- No fake numbers if a request fails. Show the section error already used on these dashboards, or a one-line load failure.
