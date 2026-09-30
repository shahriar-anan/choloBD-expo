# Rules — increment 12 (hotel desk)

Shared: [_shared/global-rules.md](../_shared/global-rules.md). Hotel domain stays on increment 11’s assignment fields.

## Stay status

`POST /api/bookings/hotel-rooms/:bookingId/stay-status`

```json
{ "status": "COMPLETED" }
```

`COMPLETED` is checkout. `NO_SHOW` is a missed guest. Both require `CONFIRMED` and `PAID`, and `checkInDate` must already have been reached. Success returns the booking in `data`. `paymentStatus` stays `PAID`.

The hotel id comes from the booking row. The actor must match that hotel through `serviceEntityId` or `employeeServiceEntityId`. A traveler and another hotel’s staff get 403.

QR scan remains a lookup.

## Desk lists

The phone groups the loaded booking page. It does not send `dateFrom` for past days. `dateFrom` still rejects a past date.

Earnings numbers are sums of that same loaded page. There is no earnings route.

## Complaints

Inbox, comments, and status use the existing complaint routes. The inbox is already limited to the caller’s hotel. Do not add a hotel id query.

## Rates and profile

Room-type writes stay on the existing hotel-room routes. The mobile create body is `hotelId`, `roomType`, `pricePerNight`, and `totalCount` only.

Profile string lists are `amenities`, `policies`, `nearbyTourSpots`, and `nearbyActivitySpots`. Do not send name, location, hotel type, rating, or `isActive`.

## Reviews

`GET /api/reviews?hotelId=` returns `data` as an array. The desk does not create or reply.

## Do not

- Run Prisma CLI.
- Start Expo or an emulator.
- Add staff, cash mark-paid, review replies, maintenance tasks, photo upload, or a shift-booking route.
- Write `roomStatus` from stay status or from the QR scan.
