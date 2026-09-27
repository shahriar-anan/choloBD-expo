# Rules — increment 04 (activity booking)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Endpoints

Booking module under `/api/bookings/activity-spots` (create, list, get, update, eligibility, cancel, QR generate/scan). Spot catalog uses `/api/activity-spots` with `?locationId=` (increment 01).

## Payment

After create, pay with `serviceType: ACTIVITY_BOOKING` via `usePaymentLogic`.

## Cancel

Eligibility first; `DELETE` cancel. Display refund fields from server (activity day policy).

## QR

Traveler QR: `POST .../qr-generate`. Operator scan: `POST .../qr-scan` with `{ qrToken }` — staff flows out of scope unless already in app.
