# 03b — Traveler dashboard home

**Folder:** `03b-dashboard` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Done — checked on device 2026-09-28.** Does not depend on increment 03. Do this before increment 04.

Scope is the traveler dashboard (`UserDashboard` on `src/app/(tabs)/dashboard/index.tsx`). The layout follows the Trip.com account screen: a **My Dashboard** title, a slim profile row, one wallet card, then plain rows with a pale icon and a chevron. Content is only what this app already has.

Service-admin shortcut cards stay `AdminCard` rows. `UserInfoUI` loses the Dicebear fallback and the extra Role card so that home stops showing a blue square. It does not get the Trip.com layout.

## What is shown

| Block | Source in this app | How it looks |
| --- | --- | --- |
| Profile row | Name and email from `auth.user`. Photo and status from `GET /api/users/profile` | Circle, name, email, status. Bell, then logout, on the right. |
| Notifications | `GET /api/notifications/unread-count` and `GET /api/notifications` | Badge on the bell. Opens a list page. |
| Wallet coins | `GET /api/wallets/own-wallet` (`balance`) | One card. The number only. Display only. |
| My Bookings | `/(tabs)/dashboard/user-bookings` | Row, Ionicons `bed` |
| My Package Bookings | `/(tabs)/dashboard/package-bookings` | Row, Ionicons `map` |
| Trip Planner | `/(tabs)/trip-planner` | Row, Ionicons `compass` |
| Recent bookings | Newest hotel booking from `fetchUserBookings` | Same `BookingCard` as My Bookings |

Those three icons are the ones Explore already uses for Book a Hotel, Browse Tours, and Plan Your Trip.

## Left off

Trip.com also shows a membership tier, reward cards, promo codes, recently viewed, saved cards, frequent-traveler info, bookmarks, perks, gift cards, and a posts strip. This app has no traveler screen for those. Bookmarks, reviews, complaints, and the wallet screen belong to increment 08. The notification list moves here; increment 08 does not build a second inbox. Settings, help, and about only raise alerts. The QR scanner is the service-admin tool. Do not add those rows, chips, or header icons.

Explore Hotels is removed. Do not link this screen to `/(tabs)/explore`.

## Progress

**Done — checked on device 2026-09-28.** `npx tsc --noEmit` passed. Device cases D-03c-profile, D-03c-wallet, D-03c-cards, D-03c-recent, and D-03c-notifications passed, including the changes made during QA:

- The page title **My Dashboard** stays. “Welcome back” stays off.
- The photo comes from `GET /api/users/profile` (`imageUrl`), the same read the web profile uses. Login JWT does not include `imageUrl`. A missing or failed photo is a local initial. No Dicebear.
- Wallet coins is a card under the profile. It shows the balance number only. No currency code and no “Points” word. A failed own-wallet call still hides the card.
- My Bookings, My Package Bookings, and Trip Planner use a larger pale circle (52px, glyph 28).
- Hotel bookings have no `createdAt`. The newest card sorts by `bookedAt`, then check-in date.

Do not rebuild the inbox. Increment 08 extends the same notifications page for later booking types. Do not add a second inbox or a wallet screen here.

## Functional

`useDashboardLogic` already loads hotel bookings with `fetchUserBookings(1, 20)`. Keep that call.

Add a helper that returns the newest booking: sort by `createdAt` descending and take the first. Hotel rows have no `createdAt`; use `bookedAt`, then check-in date. An empty list returns nothing.

Load the wallet with the existing `getOwnWallet()` in `src/services/api/wallet.ts`. Keep `balance`. A failed wallet call leaves the card hidden. Do not show `0` in place of an error. Do not display `currency` on this screen.

Load the profile photo with the existing `getUserProfile()` (`GET /api/users/profile`). Login JWT does not include `imageUrl`.

Add `src/services/api/notifications.ts`. The traveler inbox lives in this increment.

- `GET /api/notifications/unread-count` → `data.count`
- `GET /api/notifications` → `data.results` (newest first on the server)
- `PATCH /api/notifications/:notificationId/read`
- `PATCH /api/notifications/read-all`

Do not call `POST /api/notifications`. Do not call delete. Reload the unread count when the dashboard gains focus, next to the booking refresh that already runs.

No new endpoints. Do not fetch package, activity, guide, trip, or bookmark lists for this screen. Do not add a wallet page.

### Exit

`npx tsc --noEmit` from `choloBD-expo`.

## UI

Page background stays `background`. “Welcome back” stays off. The title is **My Dashboard**. The tab bar stays.

### Profile row

The blue rounded square is a Dicebear SVG. React Native does not draw it.

One horizontal row, not a card and not a second Role card:

- Circular avatar, about 48px.
- Photo from `GET /api/users/profile` when `imageUrl` is an https image URL (http is upgraded to https). Otherwise the first letter of `userName` (else the email) on a primary circle. No placeholder host and no stock photo.
- Name in the heading weight. Email under it in muted text. There is no account-settings screen, so there is no “Manage my account” link.
- Status as a small dot and the existing status label, on this row.
- On the right: a bell, then logout. No scan, support, or settings icons.
- The bell shows a badge when `count` is greater than 0. Show the number up to 99, then `99+`. No badge at 0. A failed count hides the badge and leaves the bell tappable.
- The bell opens `/(tabs)/dashboard/notifications`.

### Notification page

A dashboard stack screen, not a modal. Title **Notifications**.

- List `content` and the created time. Unread rows are visually distinct.
- Opening a row calls mark-as-read, then:
  - `HOTEL_BOOKING` opens `/(tabs)/dashboard/:relatedEntityId`
  - `PACKAGE_BOOKING` opens `/(tabs)/dashboard/package-bookings/:relatedEntityId`
  - Any other `relatedEntityType` stays on the notification text. Activity, transport, wallet, payment, and complaint screens are not in this increment.
- A **Mark all read** action calls `PATCH /api/notifications/read-all` and clears the badge.
- Empty list: a short empty line. No fake rows.
- Returning to the dashboard refreshes the badge.

Role is not shown on the traveler home. It is always “User” here.

### Wallet coins

One card under the profile: a small coin icon, the label **Wallet coins** (same wording as Complete Payment), then the balance number only. Do not show `currency` or the word “Points”. No promo-code column and no membership card beside it. The card does not navigate. Increment 08 owns the wallet screen.

### Rows

Replace `AdminCard` on this screen. Each remaining section is a Trip.com-style row: pale circular icon (52px, glyph 28), title, chevron, hairline divider. No subtitle and no 60px colored Explore tile.

| Row | Icon | Route |
| --- | --- | --- |
| My Bookings | `bed` | `/(tabs)/dashboard/user-bookings` |
| My Package Bookings | `map` | `/(tabs)/dashboard/package-bookings` |
| Trip Planner | `compass` | `/(tabs)/trip-planner` |

Keep the current titles. English and Bengali strings stay on `TRANSLATION_KEYS`.

### Recent bookings

Under the rows.

- Heading: **Recent bookings** (English and Bengali).
- One card: the newest hotel booking, rendered with `BookingCard` the same way My Bookings does (`showRooms={false}`, QR code beside the confirmation code).
- Tap opens the same booking detail. QR opens QR generate.
- No bookings: the existing “No bookings yet” line. No placeholder card.

## Out of scope

- Service-admin shortcut list.
- A wallet, settings, help, or profile-edit screen.
- Uploading a profile photo.
- Package, trip, activity, or guide rows inside Recent bookings.
- Catalog package purchase.
