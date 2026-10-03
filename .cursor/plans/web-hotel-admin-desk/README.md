# Mobile hotel admin desk

Incremental UI plan for the hotel **service admin** and hotel **employee** in the Expo app.

The screens live in **choloBD-expo**. Do not implement these increments in `NextJS-choloBD-frontend` or `ExpressJS-choloBD-backend`.

Operator home is `src/components/interface/ServiceAdminDashboard.tsx`, shown when the signed-in user is a hotel admin or hotel employee.

## Order

| # | Folder | What changes | Expo screens |
| --- | --- | --- | --- |
| 1 | [01-honest-surfaces](01-honest-surfaces/plan.md) | Show only API data. Empty states stay one sentence. | Hotel info and current bookings |
| 2 | [02-desk-chrome](02-desk-chrome/plan.md) | One date format, `3 Oct 2026`, and shift labels. | `src/utilities/hotelDesk.ts` |
| 3 | [03-booking-lenses](03-booking-lenses/plan.md) | Arriving, In house, Departing, Unpaid, All. Same-day morning and afternoon stays count as arriving. | `current-bookings.tsx` |
| 4 | [04-inventory-labels](04-inventory-labels/plan.md) | `availableCount` is labeled open for sale, not tonight’s occupancy. | `hotel-info.tsx` |
| 5 | [05-today-home](05-today-home/plan.md) | Today counts open the matching reservation lens. | `service-admin/today.tsx` |
| 6 | [06-desk-versus-office](06-desk-versus-office/plan.md) | Earnings are separate from the reservation list. Checkout can mark rooms needs cleaning. | `earnings.tsx`, `current-bookings.tsx` |
| 7 | [07-listing-checklist](07-listing-checklist/plan.md) | Listing checklist and read-only reviews on hotel info. | `hotel-info.tsx` |
| 8 | [08-shift-availability](08-shift-availability/plan.md) | Week board from the existing availability GET. | `service-admin/availability.tsx` |

## Shared rules

- Work in `choloBD-expo`. Do not change the web app or the backend. Do not run Prisma CLI.
- Do not add a route, a status, or a column. Do not mount `getShiftAvailability`. Do not add `DIRTY` or `CHECKED_IN`. Do not add review replies, mark-cash-paid, or a new upload route.
- Checkout is `COMPLETED`. A missed guest is `NO_SHOW`. `POST /api/bookings/hotel-rooms/:bookingId/stay-status` already exists.
- Cancel uses cancellation eligibility, then `DELETE /api/bookings/hotel-rooms/:bookingId`. Do not call payment or wallet refund routes from these screens.
- Room status writes stay `AVAILABLE`, `MAINTENANCE`, or `OUT_OF_SERVICE`. The labels are Ready to sell, Needs cleaning, and Out of service.
- `availableCount` is catalog capacity. The week board reads `availableRooms` from `GET /api/hotels/:hotelId/availability`.
- Dates display as `3 Oct 2026`. Shift labels: All day, Morning 08:00–15:00, Afternoon 15:00–22:00, Night 22:00–08:00.
