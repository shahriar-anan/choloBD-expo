# Mobile production readiness — overall plan

**Repo:** `choloBD-expo` · **Branch:** `chore/mobile-production-readiness`

The Expo client was built against older API paths and is missing several booking products the Express backend already exposes. This program closes that gap in numbered increments. Each increment lives in its own folder under [mobile-production-readiness/](mobile-production-readiness/) with three files:

| File | Purpose |
| --- | --- |
| [plan.md](mobile-production-readiness/01-trip-plan-api/plan.md) | What to build: Functional then UI, exit criteria |
| [rules.md](mobile-production-readiness/01-trip-plan-api/rules.md) | Constraints and API contracts for that increment |
| [tests.md](mobile-production-readiness/01-trip-plan-api/tests.md) | Agent checks and device QA cases |

Shared conventions for every increment: [mobile-production-readiness/_shared/global-rules.md](mobile-production-readiness/_shared/global-rules.md).

Implement **one increment at a time**. Finish **Functional**, run agent checks in that increment’s `tests.md`, then **UI**. A person runs device cases; agents do not start Expo or drive a phone.

---

## Why this order

1. **Trip plan (01)** — Personal plans use `/api/tour-builder/my`. The create wizard and day editor must match the web builder and the server’s stop rules so a device QA can create, edit, and delete a plan. Checkout stays in increment 07.
2. **Hotel search flow (01b)** — Checked on device 2026-09-28. Traveler search through room confirm uses the ShareTrip screen order with our theme and existing hotel APIs. Confirm hands off to the guest-details screen. Package cancel/refund is not part of this increment.
3. **Cancel/refund (02)** — Checked on device 2026-09-28. Hotel and package eligibility and cancel stay as wired. Hotel list and detail chrome, QR beside the confirmation code, list filters, and Pay with Wallet coins on Complete Payment are in. Do not fold new verticals into 02.
4. **Payment types (03)** — Next. Widen `ServiceType` and send `bookingId` on initialize. Do not add catalog package purchase or pay. Catalog packages are viewed and bought only in a later trip-plan segment. Personal plans stay increment 07 (`TRIP_PACKAGE`).
5. **Dashboard home (03b)** — Checked on device 2026-09-28. Traveler dashboard shows My Dashboard, the profile photo from `GET /api/users/profile`, a wallet-coin balance (number only), the notification bell and inbox, three icon rows, and one newest hotel booking. No membership, promo, or perk blocks. Does not wait on payment types.
6. **Activity, guides, transport (04–06)** — New verticals; can parallelize after 03.
7. **Trip checkout (07)** — Personal plan → `TripBooking` + `TRIP_PACKAGE`. That checkout does not buy a catalog package. Catalog view and buy wait for a later trip-plan segment.
8. **Wallet, search, inbox (08)** — Cross-cutting features; search can start after 01.
9. **Home hero (09)** — Can start any time. Restyles the homepage photo and the booking tiles only. Transport is shown on the row and does not navigate until increment 06.
10. **Home feed (10)** — After 09. Fills the page under the launcher with live catalog rows and static promo cards. Does not add search (08), guides (05), or discounts.

Segment booking FKs on personal plans wait until 04 and 06 clients exist (see increment 07 plan).

---

## Gap summary (mobile vs backend)

| Area | Backend today | Mobile before program |
| --- | --- | --- |
| Personal trip plans | `/api/tour-builder/my` + `daySegments` on PUT, web wizard constraints | Wizard, scrolling detail, and edit passed device QA on 2026-09-28. Checkout stays in increment 07. |
| Hotel search and room choice | `GET /api/hotels` (+ `name`, rating, dates, pagination) and room types on the hotel | Increment 01b checked on device 2026-09-28 (S1–S13, guest details). List perks, strike price, property distance, meal plans, and room-level refund text are not on the API. |
| Spot lists | `?locationId=` query | `/location/:id` paths |
| Admin “my tours” | No `by-admin`; catalog `GET /api/tour-builder` | `GET /api/tour-builder/by-admin/:id` |
| Service-admin hotel | `GET /api/hotels/my` for hotel admin; employee hotel and QR scan still read the wrong user field | Increment 11 wires the operator home. Increment 12 adds the desk day, stay status, complaints, rates, and earnings. Staff and cash desk stay out. |
| Social login | Session OAuth on web only | Calls to `/api/auth/oauth/callback` |
| Cancel/refund | Eligibility + cancel on booking APIs | Increment 02 checked on device 2026-09-28. Hotel list and detail call eligibility and cancel. Package cancel is not limited to `PENDING`. |
| Package pay | `PACKAGE_BOOKING` initialize | Not in increment 03. Catalog view and buy wait for a later trip-plan segment. |
| Activity, guide, transport | Full booking modules | Missing or display-only |
| Trip checkout | `TripBooking` + `TRIP_PACKAGE` | Not wired |
| Wallet, search, bookmarks, notifications | REST modules | Increment 03b checked on device 2026-09-28: profile photo, wallet balance on the traveler home, and the notification inbox. Search, bookmarks, reviews, complaints, and the wallet screen stay in increment 08. |

Refund **policy** lives in the backend; the app calls eligibility and displays `reason`, `refundAllowed`, and `refundAmount`. Do not call standalone admin refund APIs from the traveler app.

---

## Increments and progress

| # | Folder | Focus | Depends on | Status |
| --- | --- | --- | --- | --- |
| 01 | [01-trip-plan-api](mobile-production-readiness/01-trip-plan-api/) | Trip plan wizard, day segments, QA-ready plan screens | — | **Done** — manual QA passed 2026-09-28. Checkout stays in increment 07. |
| 01b | [01b-hotel-booking-flow](mobile-production-readiness/01b-hotel-booking-flow/) | Hotel search S1–S13, then existing guest-details handoff | 01 | **Done** — checked on device 2026-09-28. No children, guest cap, map, promo, or package rows in search. |
| 02 | [02-cancel-refund](mobile-production-readiness/02-cancel-refund/) | Hotel + package cancel/refund | 01 | **Done** — checked on device 2026-09-28. |
| 03 | [03-package-payment](mobile-production-readiness/03-package-payment/) | Widen payment types. No catalog package buy | 02 | **Functional done** — `ServiceType` union + `bookingId` on initialize (needed by increment 06). Device cases not run |
| 03b | [03b-dashboard](mobile-production-readiness/03b-dashboard/) | Traveler dashboard home | — (before 04) | **Done** — checked on device 2026-09-28. |
| 04 | [04-activity-booking](mobile-production-readiness/04-activity-booking/) | Activity book, pay, QR, cancel | 03 | Not started |
| 05 | [05-guides](mobile-production-readiness/05-guides/) | Guide request, pay after accept, cancel | 03 | Not started |
| 06 | [06-transport](mobile-production-readiness/06-transport/) | Bus ticket flow (holds, stops, passengers, return) + rental | 03 | **Implemented** — `npx tsc --noEmit` passed. Device cases not run |
| 07 | [07-trip-checkout](mobile-production-readiness/07-trip-checkout/) | Personal plan checkout + `TRIP_PACKAGE` | 01; segment links after 04+06 | Not started |
| 08 | [08-wallet-search-inbox](mobile-production-readiness/08-wallet-search-inbox/) | Search, wallet, bookmarks, notifications, reviews, complaints | 03 (search after 01) | Not started |
| 09 | [09-home-hero](mobile-production-readiness/09-home-hero/) | Homepage photo and the four-tile booking launcher | — | UI in place — device cases not run |
| 10 | [10-home-feed](mobile-production-readiness/10-home-feed/) | Homepage under the launcher: promos, places, holidays, deals, community | 09 | UI in place — device cases not run |
| 11 | [11-hotel-operator](mobile-production-readiness/11-hotel-operator/) | Hotel admin and hotel employee: fix my-hotel, QR scan, and assignment checks, then wire the existing desk screens | — | **Script green** 2026-09-30 (39/39). Device cases not run |
| 12 | [12-hotel-desk](mobile-production-readiness/12-hotel-desk/) | Hotel desk: day lists, checkout and no-show, complaints, room rates, earnings, notifications, profile lists, reviews | 11 | **Script green** 2026-09-30 (29/29). Device cases not run |

**Status values:** `Not started` → `Functional done` (services/types + agent checks) → `Done` (UI + device cases checked by a person).

Update this table when an increment moves forward.

---

## Out of scope (whole program)

- Staff / employee management screens.
- Google and Facebook JWT exchange until the backend adds a mobile-safe endpoint (buttons stay disabled).
- Password change via JWT (`PUT /api/auth/change-password` is session-only).
- Flight and train booking (bus and car rental only).
- Traveler calls to `POST /api/payments/refund` or wallet transaction refund admin APIs.
- ShareTrip assets, ad-network SDKs, and hotel search fields the backend does not return (called out in increment 01b). Cancel/refund behavior stays in increment 02.

---

## Entry points for agents and humans

- **Start here:** this file.
- **Increment work:** open the folder’s `plan.md`, then `rules.md`, then `tests.md`.
- **Do not edit** the legacy Cursor plan file at `c:\Users\HP\.cursor\plans\mobile_production_readiness_42228bce.plan.md` unless explicitly asked.
