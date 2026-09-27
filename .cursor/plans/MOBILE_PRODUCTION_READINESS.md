# Mobile production readiness — overall plan

**Repo:** `choloBD-expo` · **Branch:** `chore/mobile-production-readiness`

The Expo client was built against older API paths and is missing several booking products the Express backend already exposes. This program closes that gap in **eight increments**. Each increment lives in its own folder under [mobile-production-readiness/](mobile-production-readiness/) with three files:

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
2. **Cancel/refund (02)** — Hotel and package bookings already exist; wire eligibility and cancel like the web dashboard.
3. **Package payment (03)** — Pay catalog `PackageBooking` and widen `ServiceType` for later products.
4. **Activity, guides, transport (04–06)** — New verticals; can parallelize after 03.
5. **Trip checkout (07)** — Personal plan → `TripBooking` + `TRIP_PACKAGE` (not catalog purchase).
6. **Wallet, search, inbox (08)** — Cross-cutting features; search can start after 01.

Segment booking FKs on personal plans wait until 04 and 06 clients exist (see increment 07 plan).

---

## Gap summary (mobile vs backend)

| Area | Backend today | Mobile before program |
| --- | --- | --- |
| Personal trip plans | `/api/tour-builder/my` + `daySegments` on PUT, web wizard constraints | Wizard, scrolling detail, and edit passed device QA on 2026-09-28. Checkout stays in increment 07. |
| Spot lists | `?locationId=` query | `/location/:id` paths |
| Admin “my tours” | No `by-admin`; catalog `GET /api/tour-builder` | `GET /api/tour-builder/by-admin/:id` |
| Service-admin hotel | `GET /api/hotels/my` | Legacy v1 my-hotel path |
| Social login | Session OAuth on web only | Calls to `/api/auth/oauth/callback` |
| Cancel/refund | Eligibility + cancel on booking APIs | Missing or wrong (e.g. package cancel only when `PENDING`) |
| Package pay | `PACKAGE_BOOKING` initialize | Purchase without pay flow |
| Activity, guide, transport | Full booking modules | Missing or display-only |
| Trip checkout | `TripBooking` + `TRIP_PACKAGE` | Not wired |
| Wallet, search, bookmarks, notifications | REST modules | Stubs, wrong paths, or “coming soon” |

Refund **policy** lives in the backend; the app calls eligibility and displays `reason`, `refundAllowed`, and `refundAmount`. Do not call standalone admin refund APIs from the traveler app.

---

## Increments and progress

| # | Folder | Focus | Depends on | Status |
| --- | --- | --- | --- | --- |
| 01 | [01-trip-plan-api](mobile-production-readiness/01-trip-plan-api/) | Trip plan wizard, day segments, QA-ready plan screens | — | **Done** — manual QA passed 2026-09-28. Checkout stays in increment 07. |
| 02 | [02-cancel-refund](mobile-production-readiness/02-cancel-refund/) | Hotel + package cancel/refund UI | 01 | Not started |
| 03 | [03-package-payment](mobile-production-readiness/03-package-payment/) | Pay `PackageBooking` | 02 | Not started |
| 04 | [04-activity-booking](mobile-production-readiness/04-activity-booking/) | Activity book, pay, QR, cancel | 03 | Not started |
| 05 | [05-guides](mobile-production-readiness/05-guides/) | Guide request, pay after accept, cancel | 03 | Not started |
| 06 | [06-transport](mobile-production-readiness/06-transport/) | Bus + rental book, pay, cancel | 03 | Not started |
| 07 | [07-trip-checkout](mobile-production-readiness/07-trip-checkout/) | Personal plan checkout + `TRIP_PACKAGE` | 01; segment links after 04+06 | Not started |
| 08 | [08-wallet-search-inbox](mobile-production-readiness/08-wallet-search-inbox/) | Search, wallet, bookmarks, notifications, reviews, complaints | 03 (search after 01) | Not started |

**Status values:** `Not started` → `Functional done` (services/types + agent checks) → `Done` (UI + device cases checked by a person).

Update this table when an increment moves forward.

---

## Out of scope (whole program)

- Staff / employee management screens.
- Google and Facebook JWT exchange until the backend adds a mobile-safe endpoint (buttons stay disabled).
- Password change via JWT (`PUT /api/auth/change-password` is session-only).
- Flight and train booking (bus and car rental only).
- Traveler calls to `POST /api/payments/refund` or wallet transaction refund admin APIs.

---

## Entry points for agents and humans

- **Start here:** this file.
- **Increment work:** open the folder’s `plan.md`, then `rules.md`, then `tests.md`.
- **Do not edit** the legacy Cursor plan file at `c:\Users\HP\.cursor\plans\mobile_production_readiness_42228bce.plan.md` unless explicitly asked.
