# 08 — Wallet, search, bookmarks, notifications, reviews, complaints

**Folder:** `08-wallet-search-inbox` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: Not started. Payment types from increment 03 are required for wallet top-up. Search can start after increment 01. Implement the slices in the order below. Each slice finishes Functional before its own UI. The slices may be separate commits. Do not start a slice’s UI before that slice’s service typechecks.

Staff inbox and master-admin complaint tools stay out.

## 1. Search

### Functional

Add `src/services/api/search.ts`.

- `GET /api/search/combined?name=` returns `tourSpots`, `activitySpots`, `hotels`, and `tourPackages`. `name` is required, 1–200 characters.
- `GET /api/search/type` for a single type when a result list needs paging. Do not call search for an empty string.

### UI

Wire the home search control (`src/components/homepage/SearchSection.tsx` and the home screen that hosts it) to combined search. Tapping a result opens the existing hotel, tour-spot, or package detail. Activity results open the phase 04 detail screen when that phase is present; otherwise show the name without a dead route.

Device case: D-08.

## 2. Wallet

### Functional

Add `src/services/api/wallet.ts` and `src/types/wallet.ts`.

- `GET /api/wallets/own-wallet`
- `GET /api/wallets/own-wallet/transactions`
- `GET /api/wallets/own-wallet/transactions/:transactionId`
- `GET /api/wallets/own-wallet/refunds`
- `POST /api/wallets/initialize` with `rechargeAmount`, `rechargeCost`, `bonusAmount`, and optional `title` and `description`. The gateway URL comes back from that call. Finish it with the same browser helper as booking pay, then reload the wallet.
- `POST /api/wallets/own-wallet/charge-credits` with `serviceType` and `serviceTypeId` when a booking screen offers wallet as the method.

Do not call removed `/recharge-options`. Do not call `POST /api/wallets/transactions/:transactionId/refund` from the traveler UI.

### UI

Replace the side-menu wallet alert in `src/app/(tabs)/index.tsx` (`case 'wallet'`) with a wallet screen: balance, transaction list, and top-up. The top-up form sends the three amount fields, not a recharge option id. `FeaturesGrid` id `wallet-deals` uses the same screen instead of `/(shop)/wallet` if that route does not exist.

Device case: D-08b.

## 3. Bookmarks

### Functional

Add `src/services/api/bookmarks.ts`.

- `GET /api/bookmarks` with optional `bookmarkType`, `page`, `limit`.
- `GET /api/bookmarks/check?bookmarkType=&bookmarkAssetId=`
- `POST /api/bookmarks` with `bookmarkType` and `bookmarkAssetId`.
- `DELETE /api/bookmarks/:bookmarkId` or `DELETE /api/bookmarks/by-asset`.

`bookmarkType` is `TOUR_SPOT`, `ACTIVITY_SPOT`, `HOTEL`, or `GUIDE`. There is no update call.

### UI

A save control on hotel, tour spot, activity spot, and guide detail. A saved list screen grouped by type, using `displayName` from the list payload when the server sends it.

Device case: D-08c.

## 4. Notifications

### Functional

Add `src/services/api/notifications.ts`.

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `GET /api/notifications/:notificationId`
- `PATCH /api/notifications/:notificationId/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:notificationId`

Do not call `POST /api/notifications` (master admin only).

### UI

An inbox screen and a badge from `unread-count` on the header. Mark read on open. Deep link only when `relatedEntityType` and `relatedEntityId` match a screen this app already has (hotel booking, package booking, and later activity, guide, transport, trip). Unknown types open the notification text only.

Device case: D-08d.

## 5. Reviews

### Functional

Add `src/services/api/reviews.ts`.

- `GET /api/reviews`
- `POST /api/reviews` with `reviewType` (`HOTEL`, `TOUR_SPOT`, or `ACTIVITY_SPOT`), `reviewAssetId`, `description` (10–2000), `rating`, and optional `title` (max 255).
- `PUT /api/reviews/:reviewId` and `DELETE /api/reviews/:reviewId` for the author’s own review.

Guide reviews are not in the validator. Do not send `reviewType: GUIDE`.

### UI

Tour spot detail already renders embedded reviews. Add a form there, and the same form on hotel and activity detail. Submitting refreshes the list.

Device case: D-08e.

## 6. Complaints

### Functional

Add `src/services/api/complaints.ts`.

- `GET /api/complaints/eligibility?serviceType=&serviceEntityId=`
- `POST /api/complaints` with `title`, `description`, `addressedTo` (`SERVICE_ADMIN` or `MASTER_ADMIN`). Entity complaints also send `targetType` (`HOTEL`, `ACTIVITY_SPOT`, or `GUIDE`) and `targetEntityId`.
- `GET /api/complaints/my`
- `GET /api/complaints/:complaintId`
- `GET/POST /api/complaints/:complaintId/comments` with `content` on post.
- `PATCH /api/complaints/:complaintId/close` for the complainant while the complaint is `OPEN`.

Do not call `GET /inbox` or `PATCH /:id/status` from the traveler app.

Entity complaints require a paid `CONFIRMED` or `COMPLETED` booking for that entity. If eligibility is false, the form stays closed and shows the server message.

### UI

A help entry that replaces the “help is not available” alert in `src/app/(tabs)/index.tsx`. List is `GET /my`. Detail shows the thread and a comment box until status is `CLOSED`. Withdraw uses close. No operator status controls.

Device case: D-08f.

## Slice gate

After each slice’s service file: `npx tsc --noEmit`. Then that slice’s UI. Then the person runs the matching case in [tests.md](tests.md). An agent does not drive the device.
