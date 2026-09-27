# Rules — increment 05 (guides)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Lifecycle

- Create → `PENDING`. No payment until guide **accepts** (`ACCEPTED`).
- Pay with `GUIDE_SERVICE` only when payment window is open per backend rules.
- Cancel: `PATCH /api/bookings/guides/:bookingId/status` with `{ action: "cancel" }` after eligibility GET.

## Privacy

Hide guide contact email/phone until booking is `CONFIRMED` or `COMPLETED` (match backend field visibility).

## Catalog

`GET /api/guides`, detail, and availability endpoints for discovery.
