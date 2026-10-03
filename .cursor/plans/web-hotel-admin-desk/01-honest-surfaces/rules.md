# Rules — 01 honest surfaces

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Shared rules: [../README.md](../README.md).

- Do not replace fake metrics with a second set of hardcoded numbers.
- Do not delete the maintenance sidebar entry or change `hotel_maintenance_tasks_management`.
- Do not wire check-in, cancel, or stay-status in this increment. Hiding a dead button is the whole change.
- Profile display must accept both `string` and `{ name: string }` list items. Do not change `PUT /api/hotels/:hotelId`.
- Do not restyle the rest of the dashboard in this increment.
