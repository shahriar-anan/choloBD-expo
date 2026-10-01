# Traveler dashboard overhaul

Status: Planned. Mobile app (`choloBD-expo`) only. Not on this branch.

Screen: traveler dashboard only, `src/components/interface/UserDashboard.tsx`, data from `src/hooks/useDashboardLogic.tsx` and `loadTravelerBookingSources`. Hotel operator and other service-admin dashboards stay as they are.

## Goal

Turn the dashboard from a profile plus menu into a travel hub. The first screen answers “what is next” and “what needs me,” then offers shortcuts with counts. It does not add new APIs.

## Layout (top to bottom)

1. **Header.** Greeting using the user’s name, notification bell (badge stays), logout icon stays. Drop the large “Dashboard” title and the account-status dot. Email stays under the name in smaller type.
2. **Up next.** One card: the soonest non-cancelled hotel or transport booking whose service time is still ahead (or in progress). Title, when, payment or booking status, and a tap that opens the same detail route as today. If nothing qualifies, a short empty line with a link to trip planner.
3. **Needs attention.** Up to three rows, only when something matches: unpaid hotel or transport, or a booking that starts within 24 hours. Each row opens that booking. Hide the whole block when the list is empty.
4. **Wallet.** Keep the balance strip when a wallet exists. Display only. No new recharge screen.
5. **Manage.** Three compact tiles in one row (or wrapping): Hotel Bookings, Tickets, Trip Planner. Subtitle is a count for hotel and transport (non-cancelled). Trip Planner has no count. Same routes as the current rows. Remove the tall chevron list.
6. **Recent.** Unchanged behavior: section title opens recent bookings (up to five), one compact preview card underneath.

## Data rules

Compute these in the dashboard hook (or a small helper next to `recentBookingItems`) from sources already loaded:

- **Up next** and **attention** use hotel and transport only. Those are the kinds with traveler detail screens.
- Ignore cancelled bookings for up next, counts, and the “starts soon” alert.
- **Unpaid** means `paymentStatus` is unpaid (same idea as the hotel bookings filter).
- **Starts within 24 hours** uses hotel check-in and transport departure when those fields exist. If a date cannot be parsed, skip that alert for that row.
- Hotel tile count = non-cancelled hotel bookings in the loaded list. Tickets tile count = non-cancelled transport bookings in the loaded list.
- Recent preview stays the first item from the existing recent list (already capped and sorted).

## Empty and loading

- No upcoming booking: one muted sentence, not a fake card.
- No attention items: omit the section.
- No wallet: omit the strip (current behavior).
- First load can keep the existing dashboard behavior (content appears when `refreshTravelerHome` finishes). No new skeleton system in this pass.

## Out of scope

- Service admin / hotel operator dashboard.
- New backend routes, wallet top-up UI, or restoring package bookings.
- Activity, guide, package, and trip-booking rows on this screen (data may load, but they have no traveler dashboard destination in this pass).
- Pull-to-refresh on the whole dashboard (optional later).

## Files

- `src/hooks/useDashboardLogic.tsx` — expose `upNext`, `attentionItems`, `hotelActiveCount`, `transportActiveCount` (names can match existing style).
- `src/utilities/` — date and “soonest” helpers if the hook would get long.
- `src/components/interface/UserDashboard.tsx` — new layout.
- `src/locales/en.json` and `bn.json` — greeting, empty up-next, attention labels, tile subtitles.
- `src/app/(tabs)/dashboard/index.tsx` — pass the new props.

## Manual QA

1. Traveler with a future hotel and a future bus: Up next is the earlier one; tap opens the right detail.
2. Unpaid booking appears under Needs attention and opens that booking.
3. Cancelled-only user: no up next card, counts are 0, recent empty state still works.
4. Hotel Bookings, Tickets, Trip Planner, recent title, notifications, and logout still navigate correctly.
5. Hotel operator dashboard is unchanged.
