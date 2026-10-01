# Mobile UI improvements

Plans for reducing unnecessary vertical scrolling and improving information grouping on the Expo app. Each item is one markdown file in this folder. Mobile app only.

| Plan | Status |
| --- | --- |
| [trip-plan-day-selector.md](./trip-plan-day-selector.md) | Implemented on `chore/mobile-production-readiness` (awaiting manual QA) |
| [traveler-dashboard-overhaul.md](./traveler-dashboard-overhaul.md) | Implemented on `feat/traveler-dashboard-overhaul` only |

## Branches

`chore/mobile-production-readiness` keeps the previous traveler dashboard layout, plus:

- Trip detail day selector and “About This Tour”
- One thinner recent-booking card, with the title opening a page of up to five bookings
- Section titles **Hotel Bookings** and **Tickets**
- Traveler package-booking screens removed

`feat/traveler-dashboard-overhaul` is that commit plus the hub: greeting, Up next, Needs attention, and counted tiles. Switch to that branch to run the overhaul. It has not been merged back.

Future items from the UI audit (hotel info, booking list density, home duplicate holidays, etc.) should be added here as separate `.md` files, not nested subfolders per feature.
