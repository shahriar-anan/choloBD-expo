# Tests — increment 12 (hotel desk)

**Last run:** 2026-09-30 — `test-hotel-desk.js` **29/29 passed** against `http://localhost:5000`. `npx tsc --noEmit` from `choloBD-expo` passed. Device cases were not run.

You run these. Do not open an emulator. The API must already be running.

From `ExpressJS-choloBD-backend/nodeapp`:

```bash
node scripts/tests/test-hotel-desk.js --base=http://localhost:5000
```

The script logs in with `POST /api/auth/login-jwt` and password `root1234`. It uses Prisma only to mark a booking paid and to delete rows the cancel API cannot remove. It restores room price and hotel profile lists before it exits.

Accounts match increment 11: hotel admin 1, hotel employee 1, hotel admin 2, hotel employee 2, `user1@gmail.com`.

From `choloBD-expo`, after each mobile round:

```bash
npx tsc --noEmit
```

## Round 1 — stay status, reviews, profile lists

- Create an unpaid future booking on hotel A. Admin 1 `POST .../stay-status` with `COMPLETED` is 400. Cancel that booking.
- Create a booking, set it to `CONFIRMED` and `PAID` with a future check-in. Employee 1 stay-status is 400. Then set check-in to yesterday. Employee 1 `COMPLETED` is 200, `status` is `COMPLETED`, `paymentStatus` is still `PAID`. A room’s `roomStatus` is unchanged. A second stay-status call is 400.
- A second paid in-progress booking: admin 1 `NO_SHOW` is 200. Traveler and employee 2 on a hotel A booking are 403.
- Admin 1 scan of that booking’s QR, before the stay write, does not change `status`.
- `GET /api/reviews?hotelId={hotelA}` is 200 and `data` is an array that contains a review created for hotel A. The same review id is absent from hotel B’s list.
- Admin 1 `PUT` hotel A `amenities` as a string array, then restore the original array.
- Admin 1 `PUT` one room type’s `pricePerNight`, then restore it. Employee 1 `PUT` that room type is 403.
- Admin 1 `GET /api/complaints/inbox` is 200. Traveler creates a complaint for hotel A after a paid booking exists. The new id is in admin 1’s inbox and absent from employee 2’s inbox. Admin 1 adds a comment, then `PATCH` status to `CLOSED`.
- Admin 1 `GET /api/notifications` is 200.

## Rounds 2–5

`npx tsc --noEmit`. Re-run the script after round 5. There is no camera case and no emulator case.

## When a device is available later

- Current bookings chips split today’s confirmed stays.
- Checkout and No-show appear only on a paid confirmed stay whose check-in time has passed.
- Complaints opens the hotel inbox.
- Hotel info lets the admin edit a nightly price and the comma-separated profile lists. The employee sees prices and reviews and does not see those fields.
- The hotel home bell opens the notification inbox.
