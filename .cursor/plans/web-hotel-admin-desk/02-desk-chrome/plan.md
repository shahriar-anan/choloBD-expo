# 02 — Desk chrome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

**Folder:** `02-desk-chrome` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Not started.** Depends on increment 1.

The page title, the selected tab, and the section heading repeat the same words. Changing a tab does not update the URL, so refresh and the sidebar disagree. Lists scroll inside a second scroller. Status chips use fixed blue, yellow, and red that ignore the theme.

## Outcome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

One title on the page, one title inside the tab. The URL hash is the open tab. The window scrolls the list. Status and dates use the shared theme and one date format.

## Do this

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

1. **Titles.** Keep the page `h1` (“Hotel Admin Dashboard” or “Hotel Management Dashboard”) and the hotel name. Remove the extra `h2` that repeats the tab label inside `HotelServiceAdminModule` and `HotelServiceEmployeeModule`. Inside a tab, keep a single section heading only when the tab contains two blocks (room stats and room-type list). Do not stack a third copy of “Room Management.”
2. **Hash.** `handleTabChange` writes the tab hash with `history.replaceState` (`/dashboard#hotel_admin_profile`, and the employee hashes already in `HOTEL_EMPLOYEE_TABS`). Refresh reopens that tab. Existing sidebar links keep working. Do not rename hashes.
3. **Scroll.** Remove `max-h-[80vh]`, `min-h-[40vh]`, and `overflow-y-auto` from the list shells in:
   - `HotelRoomBookingsManagement`
   - `HotelRoomStatusManagement`
   - `EarningsSummarySection` (mobile card list)
   - `HotelMaintenanceTasksManagement` if a scroll shell remains
   The page itself scrolls.
4. **Status chips.** Replace Tailwind palette classes in booking and room status badges with theme variables (`--theme-teal`, `--theme-star`, `--theme-text`, and the existing red/green variables already used for room status). Selected and unselected chips stay readable on the light theme and the dark theme.
5. **Dates.** Add one small formatter used by earnings and bookings: `3 Oct 2026`. Stop using `en-US` two-digit years (`2/2/26` style from `year: "2-digit"`). Shift text waits for increment 3; this increment only unifies the calendar date.

Tab badges (unpaid count, open complaints) wait until increment 5, when the counts are real.

## Leave alone

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- Which tab is the default. Increment 5 changes the home tab.
- Booking filter behavior. Increment 3 replaces it.
- Room-type occupancy math. Increment 4 replaces the labels.

## Files

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `src/components/modular-components/dashboard/service-admin/HotelServiceAdminModule.tsx`
- `src/components/modular-components/dashboard/employee/HotelServiceEmployeeModule.tsx`
- `src/components/modular-components/dashboard/employee/hotel/HotelRoomBookingsManagement.tsx`
- `src/components/modular-components/dashboard/employee/hotel/HotelRoomStatusManagement.tsx`
- `src/components/modular-components/dashboard/service-admin/hotel/EarningsSummarySection.tsx`
- `src/components/modular-components/dashboard/employee/hotel/HotelMaintenanceTasksManagement.tsx`
- A date helper next to the dashboard code, for example `src/utilities/deskFormat.ts`, if one does not already exist. Do not put it in the Expo repo.

## Exit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

[tests.md](tests.md). `npx tsc --noEmit` from `choloBD-expo`.
