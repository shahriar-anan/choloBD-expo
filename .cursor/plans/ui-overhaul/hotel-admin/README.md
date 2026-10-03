# Hotel admin

**Who:** `SERVICE_ADMIN` whose assignment is `HOTEL_BOOKING`.

Out of scope: travellers, signed-out sessions, hotel employees, bus and activity operators, guides, and master admin. They keep the bar they have today.

The hotel admin bar is four tabs:

| Tab | Label (en / bn) | Icon | Job |
| --- | --- | --- | --- |
| Home | Home / হোম | `home` | Today at this hotel: arriving, in house, departing, unpaid. |
| Bookings | Bookings / বুকিং | `ticket` | Guest stays at this hotel. |
| Dashboard | Dashboard / ড্যাশবোর্ড | `grid` | The office: hotel, earnings, availability, complaints, QR scanner, and settings. |
| Notifications | Notifications / বিজ্ঞপ্তি | `notifications` | The operator inbox. |

Settings are rows on Dashboard. There is no Settings tab. QR scan stays on Dashboard. A QR tab belongs to the hotel employee plan, which is not this folder.

The traveller Home and the traveller Bookings list stay mounted. A hotel admin must not see them.

## Order

Do these in order. 01 only changes who sees which tab. 02 and 03 fill Home and Bookings. Do not ship 01 alone as the finished admin bar: Home would still be the traveller homepage.

| # | Folder | What changes |
| --- | --- | --- |
| 1 | [01-tab-bar](01-tab-bar/plan.md) | Four tabs for a hotel admin. Everyone else stays as they are. |
| 2 | [02-home](02-home/plan.md) | Home is today’s house, not hotel search. |
| 3 | [03-bookings](03-bookings/plan.md) | Bookings is the guest list already on Current bookings. |
| 4 | [04-dashboard](04-dashboard/plan.md) | Office tools, plus language, appearance, and log out. |
| 5 | [05-notifications](05-notifications/plan.md) | Inbox is the tab. Badge on the icon. |

## Shared rules

- Mobile app only. No new API routes. No Prisma CLI.
- Read the hotel assignment the way `useDashboardLogic` already does: `serviceType === 'HOTEL_BOOKING'` on a `SERVICE_ADMIN`.
- While that profile request is in flight, keep the last known bar. Do not flash the traveller bar.
- A hotel employee (`EMPLOYEE`) keeps Homepage, Explore, Dashboard, and Tracking.
- Another service admin keeps that same bar. Do not show hotel cards to a bus operator or a guide.
- Do not put the admin’s personal trips, community, or trip planner on this bar.
- Do not add a row that only raises “Coming soon”.
- Copy for both `src/locales/en.json` and `src/locales/bn.json`. Tab labels stay one word.
- `npx tsc --noEmit` from `choloBD-expo` after each increment.
