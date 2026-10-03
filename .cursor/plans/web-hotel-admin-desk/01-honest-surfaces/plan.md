# 01 — Honest surfaces

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

**Folder:** `01-honest-surfaces` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Not started.**

The hotel admin and hotel employee dashboards currently lead with numbers and tasks that are not from the API, and with buttons that have no handler. The profile tab can also throw because it treats category objects as strings.

## Outcome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

A signed-in hotel admin or hotel employee sees only data the API returned. Empty and unavailable states say so in one sentence. No control looks clickable unless it does something.

## Do this

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

1. Remove `AdminStatsDashboard` from `HotelServiceAdminModule`. Delete the render, including the “feature under development” block. Leave the component file in place if something else still imports it; otherwise delete the unused fake stats with it.
2. Remove `HotelMetricsDashboard` from `HotelServiceEmployeeModule` the same way. Stop passing `FAKE_METRICS`.
3. Keep the employee **Maintenance Tasks** tab and the hash `hotel_maintenance_tasks_management`, because the sidebar links there. Replace the body with one line: maintenance tracking is not available yet. Do not render `FAKE_MAINTENANCE_TASKS`, staff names, or room numbers from `fakeData.ts`. Remove the warning that says “Guest Complaints.”
4. In `HotelRoomBookingsManagement`, remove the **Check In**, **View Details**, and **Cancel Booking** buttons. They have no `onClick`. Real cancel, checkout, and no-show land in increment 6.
5. Make `HotelProfileSection` render the hotel object from `GET` hotel detail without throwing:
   - Missing `address` or `city`: show location name from `location` when present, otherwise omit the row.
   - `amenities` and `policies` may be `Category[]`. Show each item’s `name`. If the value is already a string, show the string. If the list is missing, show “None listed.”
   - Keep the existing **Edit** button. It may still navigate to `/hotels/:id/edit`. Increment 7 replaces this section’s content.

## Leave alone

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- Tab set, default tab, earnings table, room-type stats, and room status saving.
- Sidebar labels and hashes.
- Backend and Expo app.

## Files

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `src/components/modular-components/dashboard/service-admin/HotelServiceAdminModule.tsx`
- `src/components/modular-components/dashboard/service-admin/hotel/AdminStatsDashboard.tsx` (remove from the page; delete only if unused)
- `src/components/modular-components/dashboard/employee/HotelServiceEmployeeModule.tsx`
- `src/components/modular-components/dashboard/employee/hotel/HotelMetricsDashboard.tsx` (same rule)
- `src/components/modular-components/dashboard/employee/hotel/HotelMaintenanceTasksManagement.tsx`
- `src/components/modular-components/dashboard/employee/hotel/fakeData.ts` (stop importing it from the live modules)
- `src/components/modular-components/dashboard/employee/hotel/HotelRoomBookingsManagement.tsx`
- `src/components/modular-components/dashboard/service-admin/hotel/HotelProfileSection.tsx`

## Exit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Browser checks in [tests.md](tests.md) pass. `npx tsc --noEmit` from `choloBD-expo` passes.
