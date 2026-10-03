# General traveller

**Who:** `role === 'USER'`, and a signed-out session. Hotel admin, hotel employee, other service admins, and master admin are out of scope.

The traveller bar is four tabs:

| Tab | Label (en / bn) | Icon | Job |
| --- | --- | --- | --- |
| Home | Home / হোম | `home` | Find a hotel, attraction, tour, or bus, or open a trip plan. |
| Bookings | Bookings / বুকিং | `ticket` | Every reservation this person made. |
| Notifications | Notifications / বিজ্ঞপ্তি | `notifications` | Their inbox. |
| Profile | Profile / প্রোফাইল | `person` | Who they are, language, appearance, and empty rows for About, Tracking, Offers, Community, and Help. |

Settings are rows on Profile. There is no Settings tab.

Explore is no longer a tab. Hotel search, attractions, transport search, and the tour list stay in `src/app/(tabs)/explore/` and open from Home. Trip Planner and Community stay off the bar and open from Home.

## Order

Do these in order. 01 and 02 land together before a device check of the bar. A Bookings tab that still shows only hotels is not done.

| # | Folder | What changes |
| --- | --- | --- |
| 1 | [01-tab-bar](01-tab-bar/plan.md) | Four visible tabs for a traveller. Other roles keep the current bar. |
| 2 | [02-bookings](02-bookings/plan.md) | One bookings screen. Chips: All, Hotels, Tickets, Activities. |
| 3 | [03-notifications](03-notifications/plan.md) | Inbox is the tab. Badge on the icon. |
| 4 | [04-profile](04-profile/plan.md) | Profile replaces the traveller dashboard menu. |
| 5 | [05-home-entries](05-home-entries/plan.md) | Home no longer opens a drawer of dead links. Success paths return to Bookings. |

## Shared rules

- Mobile app only. No new API routes. No Prisma CLI.
- A hotel admin or hotel employee still lands on Dashboard and still sees Homepage, Explore, Dashboard, Tracking.
- Do not put trip plans on Bookings. Home already opens the planner.
- Do not put guest reservations, QR scan, earnings, staff, or hotel tools on any traveller tab.
- Do not add a row that only raises “Coming soon” or “not yet available”.
- Copy for both `src/locales/en.json` and `src/locales/bn.json`. Tab labels stay one word.
- `npx tsc --noEmit` from `choloBD-expo` after each increment.
