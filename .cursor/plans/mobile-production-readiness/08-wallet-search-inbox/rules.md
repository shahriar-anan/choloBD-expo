# Rules — increment 08 (wallet, search, inbox)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Slices (implement in plan order)

1. Search — `GET /api/search/combined?name=` (required query, 1–200 chars); optional `GET /api/search/type`.
2. Wallet — `POST /api/wallets/initialize` with `rechargeAmount`, `rechargeCost`, `bonusAmount`; `GET /api/wallets/own-wallet`. No removed recharge-options id.
3. Bookmarks — `/api/bookmarks` CRUD patterns in plan.
4. Notifications — list + mark read.
5. Reviews — `POST /api/reviews` with valid `reviewType`.
6. Complaints — traveler create + my list only (not staff admin dashboards).

## Payment

Wallet top-up uses `WALLET_TOP_UP` / wallet initialize flow from increment 03 types.

## Search

Do not fire combined search on empty query.
