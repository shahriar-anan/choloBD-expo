# 05 — Today as home

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

**Folder:** `05-today-home` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Not started.** Depends on increments 3 and 4.

Both dashboards still open on catalog work: the admin on Hotel Profile, the employee on the room list. Staff need the operating day first.

## Outcome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

The first view is today’s house, from bookings and rooms already loaded. Profile, room types, earnings, and the room list stay one click away.

## Today panel

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Add a **Today** tab as the first tab and the default for both modules.

- Admin hash: `hotel_admin_today`. Add it to `HOTEL_ADMIN_TABS` and to the hotel admin sidebar in `SIdebarMenu.tsx`, above Hotel Profile.
- Employee hash: `hotel_employee_today`. Add it to `HOTEL_EMPLOYEE_TABS` and to the hotel employee sidebar, above Room Management.
- Unknown hashes still do what they do now. Existing hashes do not change.

The panel shows, for the signed-in hotel:

- Today’s date (`3 Oct 2026`) and a line that names the shift windows used by the product: Morning 08:00–15:00, Afternoon 15:00–22:00, Night 22:00–08:00.
- Counts from the lens helper in increment 3: Arriving, In house, Departing, Unpaid. Each count is a button that opens the bookings list on that chip.
  - Employee: switch to the Bookings tab with that chip.
  - Admin: switch to the reservations list from increment 6 once it exists. Until increment 6 lands, the admin counts are visible and the button opens nothing extra; do not send the admin to the employee module.
- Rooms whose `roomStatus` is `MAINTENANCE` or `OUT_OF_SERVICE`, as a count. The employee count links to Room Management. The admin count is text only until increment 6.
- Do not show earnings, occupancy percent, star rating, or complaint totals on this panel unless the complaint inbox query is already in memory for this hotel. If it is not, omit complaints here. Do not add a new complaints client just for a badge.

## Tab chrome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

After the counts exist, show a numeric badge on:

- Employee **Bookings** when Unpaid is greater than zero
- Employee **Room Management** when maintenance + out of service is greater than zero

Use the same counts on the admin tabs that have a destination. Skip a badge when the count is zero.

## Leave alone

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- Earnings math.
- Profile content (increment 7).
- Manual room-status controls (increment 6).

## Files

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `src/components/modular-components/dashboard/service-admin/HotelServiceAdminModule.tsx`
- `src/components/modular-components/dashboard/employee/HotelServiceEmployeeModule.tsx`
- `src/components/structure-components/SIdebarMenu.tsx`
- A small `HotelTodayPanel` used by both modules, next to the other hotel dashboard components
- `src/utilities/hotelDeskLenses.ts`

## Exit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

[tests.md](tests.md). `npx tsc --noEmit` from `choloBD-expo`.
