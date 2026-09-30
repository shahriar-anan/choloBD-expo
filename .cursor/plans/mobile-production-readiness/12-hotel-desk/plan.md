# 12 — Hotel desk

**Folder:** `12-hotel-desk` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Implemented.** `npx tsc --noEmit` passed. `test-hotel-desk.js` **29/29 passed** on 2026-09-30 against `http://localhost:5000`. Device cases were not run.

Give a hotel admin and a hotel employee the front-desk day on top of increment 11. Shahriar runs the HTTP script and `tsc`. Do not open an emulator.

Seed pair: `hoteladmin1@gmail.com` and `hotelemployee1@gmail.com` share the first seeded hotel. `hoteladmin2@gmail.com` and `hotelemployee2@gmail.com` share a different hotel. Password `root1234`. Login is `POST /api/auth/login-jwt`.

## Already in place

| Need | Today |
| --- | --- |
| Operator home | My hotel, Current bookings, QR scanner |
| Booking list | `GET /api/bookings/hotel-rooms?hotelId=` nested `data.data` |
| Scan | `POST /api/bookings/hotel-rooms/qr-scan` returns the booking and does not write status |
| Complaints | `GET /api/complaints/inbox`, comments, `PATCH /:complaintId/status` for the assigned hotel |
| Room types | `POST` / `PUT /api/hotel-rooms/roomTypes` for the hotel admin of that hotel. Hotel detail includes `roomTypes` |
| Notifications | `GET /api/notifications` for any signed-in user. The inbox screen already exists |
| Profile lists | `Hotel.amenities`, `policies`, `nearbyTourSpots`, `nearbyActivitySpots` are string arrays on `PUT /api/hotels/:hotelId` |
| Reviews | `GET /api/reviews` is public. Filter by `hotelId` is added in round 1 |

`dateFrom` on the booking list rejects a past date, so the phone buckets the loaded rows itself. Do not change that validator.

## Left off

- Staff assignment. Master admin keeps `PUT /api/users/:userId/role`.
- Cash walk-in and marking `paymentStatus` paid.
- Review replies. There is no reply column.
- Maintenance tasks. The web section is placeholder data.
- New hotel photo upload. Image delete already exists.
- Shift-booking toggle. `updateBookingMode` has no route.
- A new `CHECKED_IN` status. Checkout is `COMPLETED`. A missed guest is `NO_SHOW`.

## Progress

Finish one round, run that round’s command in [tests.md](tests.md), then start the next. Round 1 is backend. Rounds 2–6 are the app.

---

## Round 1 — Stay outcome, review filter, profile string lists

`POST /api/bookings/hotel-rooms/:bookingId/stay-status` body `{ "status": "COMPLETED" | "NO_SHOW" }`.

`HotelRoomBookingService.updateStayStatus`:

- Caller is the hotel `SERVICE_ADMIN` or `EMPLOYEE` of `booking.hotelId`, or `MASTER_ADMIN`. Anyone else gets 403.
- The booking must be `CONFIRMED` and `paymentStatus` `PAID`. Otherwise 400.
- `now` must be on or after `checkInDate`. Before that, 400. Checkout and no-show share this gate.
- Write `status` only. Do not change `paymentStatus` or any `HotelRoom.roomStatus`.
- A second call on the same booking is 400.
- QR scan still does not write status.

`GET /api/reviews?hotelId=` filters `Review.hotelId`. The response stays an array in `data`.

`PUT /api/hotels/:hotelId` accepts `amenities` and `policies` as string arrays and writes those columns. A string list does not delete `HotelCategory` rows. Objects with `id` and `name` keep today’s category behavior. `nearbyTourSpots` and `nearbyActivitySpots` are optional string arrays on the same route.

### Files

- `nodeapp/src/services/hotelRoomBookingService.ts`
- `nodeapp/src/controllers/hotelBookingController.ts`
- `nodeapp/src/validators/hotelBookingValidators.ts`
- `nodeapp/src/routes/hotelBookingRoutes.ts`
- `nodeapp/src/services/reviewService.ts`
- `nodeapp/src/controllers/reviewController.ts`
- `nodeapp/src/services/hotelService.ts`
- `nodeapp/src/validators/hotelValidators.ts`

### Exit

You run [tests.md](tests.md) round 1.

## Round 2 — Day lists, earnings, stay actions

Current bookings loads up to 100 rows for the operator hotel. Chips: Arriving, In house, Departing, All.

- Arriving: `CONFIRMED` and the check-in calendar day is today, and checkout is a later day.
- Departing: `CONFIRMED` and the check-out calendar day is today, and check-in was before today.
- In house: `CONFIRMED`, check-in was before today, and check-out is after today.
- All: the loaded page, including pending and cancelled.

Above the list, show paid total, unpaid total, cancelled count, and row count from the loaded page.

On a row, and on the QR result, when the booking is `CONFIRMED`, `PAID`, and check-in time has passed, show Checkout and No-show. They call `POST .../stay-status`. The scan itself still does not write status. Cancel stays for rows that are not `CANCELLED`.

### Files

- `src/utilities/hotelDesk.ts`
- `src/services/api/bookings.ts` — `updateHotelStayStatus`
- `src/hooks/useCurrentBookingsFetch.tsx` — desk fetch limit 100
- `src/app/(tabs)/dashboard/service-admin/current-bookings.tsx`
- `src/app/(tabs)/dashboard/service-admin/qr-scanner.tsx`

### Exit

`npx tsc --noEmit` from `choloBD-expo`. Round 1 still passes.

## Round 3 — Complaints

Hotel operator home gets a Complaints card. The screen calls `GET /api/complaints/inbox`. A row shows title, status, and description. Open it to load comments, add a comment, and move `OPEN` to `UNSOLVED` or `CLOSED`, and `UNSOLVED` to `CLOSED`.

### Files

- `src/services/api/complaints.ts`
- `src/app/(tabs)/dashboard/service-admin/complaints.tsx`
- `src/components/interface/ServiceAdminDashboard.tsx`
- locale files for the new card

### Exit

`npx tsc --noEmit`. Round 1 complaint cases still pass.

## Round 4 — Room rates

Hotel info lists `roomTypes` from the hotel detail. The admin can change `pricePerNight` with `PUT /api/hotel-rooms/roomTypes/:roomTypeId` and can create a type with `POST /api/hotel-rooms/roomTypes` (`hotelId`, `roomType`, `pricePerNight`, `totalCount`). The employee sees the list and the prices. Hide the price field and the create form when `role !== SERVICE_ADMIN`.

### Files

- `src/services/api/hotels.ts`
- `src/app/(tabs)/dashboard/service-admin/hotel-info.tsx`

### Exit

`npx tsc --noEmit`. Round 1 price cases still pass.

## Round 5 — Profile lists, reviews, notification bell

Hotel info, admin only, edits amenities, policies, nearby tour spots, and nearby activity spots as comma-separated text. Save sends string arrays on the existing profile PUT.

Both roles see a read-only review list from `GET /api/reviews?hotelId=`.

The hotel operator home header links to `/(tabs)/dashboard/notifications`.

### Files

- `src/services/api/users.ts`
- `src/services/api/reviews.ts`
- `src/app/(tabs)/dashboard/service-admin/hotel-info.tsx`
- `src/components/interface/ServiceAdminDashboard.tsx`

### Exit

`npx tsc --noEmit` and the full script in [tests.md](tests.md).
