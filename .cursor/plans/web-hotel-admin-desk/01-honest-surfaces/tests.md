# Tests — 01 honest surfaces

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Run the Next.js app and sign in as a hotel service admin, then as a hotel employee, for the same hotel. Use a hotel that has amenities stored as categories.

## Admin

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-01a The page has no “Admin Statistics” heading and no “feature under development” block for statistics.
- [ ] W-01b No earnings figure on the page header area other than the Earnings tab itself.
- [ ] W-01c Hotel Profile opens and lists amenity and policy names. The console has no React “objects are not valid as a React child” error.
- [ ] W-01d A hotel with no website still shows the profile. Missing address does not print `undefined`.

## Employee

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-01e The page has no “Hotel Metrics Overview” heading and no placeholder metrics.
- [ ] W-01f Maintenance Tasks shows the unavailable sentence only. No “Room 202”, “Ahmed Hassan”, or “Guest Complaints”.
- [ ] W-01g Sidebar **Maintenance Tasks** still opens that tab.
- [ ] W-01h Bookings rows have no Check In, View Details, or Cancel Booking button.

## Build

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-01i `npx tsc --noEmit` in `choloBD-expo` exits 0.
