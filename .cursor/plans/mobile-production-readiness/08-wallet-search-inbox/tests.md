# Tests — increment 08 (wallet, search, inbox)

## Agent checks

```bash
npx tsc --noEmit
```

Run after each slice’s Functional work before that slice’s UI.

## Device cases

### D-08 Search

- Expected: `GET /api/search/combined?name=`. Open hotel/package (and activity when phase 04 present). Empty query does not request.

### D-08b Wallet top-up and balance

- Expected: `POST /api/wallets/initialize` with amount fields; balance via `GET /api/wallets/own-wallet`. No `/recharge-options`.

### D-08c Bookmark a hotel

- Expected: `POST /api/bookmarks` (`bookmarkType: HOTEL`), list, delete.

### D-08d Notification deep links added after 03b

- The inbox and badge are increment 03b. This case only checks later types: an activity, guide, transport, or trip notification opens that booking from the same notifications page.

### D-08e Review a tour spot

- Expected: `POST /api/reviews` with `reviewType: TOUR_SPOT`, description ≥10 chars.

### D-08f File a complaint

- Expected: `POST /api/complaints`, `GET /api/complaints/my`.
