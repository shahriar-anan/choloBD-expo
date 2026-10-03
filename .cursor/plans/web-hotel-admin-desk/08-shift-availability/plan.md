# 08 — Shift availability

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

**Folder:** `08-shift-availability` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Not started.** Depends on increment 4. Can ship without increments 5, 6, or 7.

Increment 4 shows catalog capacity (`totalCount` and `availableCount`). It does not say how many rooms are free on Friday afternoon. `GET /api/hotels/:hotelId/availability` already answers that for one stay. The web client already calls it from `HotelApi.useGetHotelRoomAvailabilityRQ`.

## Outcome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Admin and employee can open a week board and read, for each room type, how many rooms are free for a one-night all-day stay and for each shift on that day. Nothing on the board edits price or closes a date.

## Board

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Add an **Availability** tab for both roles.

- Admin hash: `hotel_admin_availability`. Sidebar entry under Room Management.
- Employee hash: `hotel_employee_availability`. Sidebar entry under Room Management.
- Default week starts today. Previous and next move seven days at a time. Dates display as `3 Oct`.

Rows are room types. Columns are the seven days. Each cell stacks four counts from `availableRoomsByType[].availableRooms`:

| Line | Query `shift` | What the number means |
| --- | --- | --- |
| All day | `ALL_DAY` | Rooms free for a one-night stay that starts that morning and ends the next day |
| Morning | `MORNING` | Rooms free for 08:00–15:00 that day |
| Afternoon | `AFTERNOON` | Rooms free for 15:00–22:00 that day |
| Night | `NIGHT` | Rooms free for 22:00 that day through 08:00 the next morning |

Every request uses the existing query shape:

- `numberOfRooms=1` (the route requires it; the cell shows `availableRooms`, not the `isAvailable` boolean)
- `checkInDate` as that column’s calendar day, ISO
- `checkOutDate` as the next calendar day, ISO. The route requires this field. For a shift, the service replaces the window from `shift` and the check-in day.
- `shift` as the line above

Use `useGetHotelRoomAvailabilityRQ`. One query per day per shift. A failed cell shows a dash. The rest of the week still renders.

Caption on the tab: these counts come from bookings for that stay. They are not the catalog **open for sale** numbers on Room Management.

If the Today tab from increment 5 is already on the page, add a text link **Week availability** to this hash. If Today is not built yet, skip the link.

## Leave alone

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `getShiftAvailability` in the booking service. It has no route, and it ignores all-day bookings.
- Price fields. A date does not have its own price.
- Stop-sell. There is no close-this-date field.
- The traveler booking page. It already calls this route. Do not change its query.

## Files

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `src/services/api/hotelApi.ts` — reuse `useGetHotelRoomAvailabilityRQ`. Add a small helper that builds the query string if one does not already exist.
- A `HotelShiftAvailabilityBoard` used by both dashboards
- `src/components/modular-components/dashboard/service-admin/HotelServiceAdminModule.tsx`
- `src/components/modular-components/dashboard/employee/HotelServiceEmployeeModule.tsx`
- `src/components/structure-components/SIdebarMenu.tsx`
- Today panel from increment 5, only when that file already exists

## Exit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

[tests.md](tests.md). `npx tsc --noEmit` from `choloBD-expo`. No backend diff.
