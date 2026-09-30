# Tests — increment 11 (hotel operator)

**Last run:** 2026-09-30 — `test-hotel-operator-access.js` **39/39 passed** against `http://localhost:5000`. `npx tsc --noEmit` from `choloBD-expo` passed. Device cases below were not run.

You run these. Do not open an emulator. The API must already be running.

From `ExpressJS-choloBD-backend/nodeapp`:

```bash
node scripts/tests/test-hotel-operator-access.js --base=http://localhost:5000
```

The script does not exist until round 1. Each backend round adds its section and keeps the earlier sections. Re-run the whole script after every backend round. It logs in with `POST /api/auth/login-jwt` and password `root1234`.

Accounts, all lowercase:

| Who | Email | Hotel |
| --- | --- | --- |
| Hotel admin 1 | `hoteladmin1@gmail.com` | First seeded hotel |
| Hotel employee 1 | `hotelemployee1@gmail.com` | Same hotel as admin 1 |
| Hotel admin 2 | `hoteladmin2@gmail.com` | A different hotel |
| Hotel employee 2 | `hotelemployee2@gmail.com` | Same hotel as admin 2 |
| Traveler | `user1@gmail.com` | None |
| Activity admin | `activityadmin1@gmail.com` | None |

From `choloBD-expo`, after each mobile round:

```bash
npx tsc --noEmit
```

A mobile round is not done until `tsc` exits 0 and the script sections named below still pass.

The script restores any phone number or `roomStatus` it changes. If a later assertion throws, the `finally` path still restores them. It cancels any booking it creates.

## Round 1 — my hotel

- Admin 1: 200, `data` is an array, length at least 1, first `id` saved as hotel A.
- Employee 1: 200, `data` is an array of one hotel, `id` equals hotel A.
- Admin 2: 200, first `id` is hotel B, and hotel B is not hotel A.
- `user1` and `activityadmin1`: 200 and `data` equals `[]`.
- Employee 1 `GET /api/hotel-rooms/rooms/{hotelA}` is 200.
- Employee 1 `GET /api/hotel-rooms/rooms/{hotelB}` is 403.

## Round 2 — QR scan

Create one unpaid `ALL_DAY` booking on hotel A as `user1` (public `POST /api/bookings/hotel-rooms` with `userId` set to user 1, dates at least seven days out, `selectedRoomsMap` from that hotel’s room types). Generate a token with user 1’s JWT: `POST /api/bookings/hotel-rooms/:bookingId/qr-generate`.

- Admin 1 scan: 200, `data.booking.id` is that booking, `data.booking.hotel.id` is hotel A.
- Employee 1 scan: 200, same booking id.
- Read the booking as admin 1. `status` equals the status from before either scan.
- Employee 2 scan: 401 or 403.
- `user1` scan: 403.
- Missing `qrToken`: 400.
- Cancel the booking as admin 1 before the script exits (`DELETE` after eligibility says `canCancel`).

If create cannot find a room type or returns “not enough available rooms”, the round fails. Do not skip it.

## Round 3 — writes

Read hotel A’s `phoneNumber` and one room’s `roomStatus` first.

- Admin 1 `PUT /api/hotels/{hotelA}` with a different `phoneNumber`: 200, GET shows the new value, then restore the original and GET matches it.
- Admin 1 `PUT /api/hotels/{hotelB}`: 403. Hotel B’s phone is unchanged.
- Employee 1 `PUT /api/hotels/{hotelA}`: 403.
- Employee 1 `PUT /api/hotel-rooms/rooms/{roomId}` with `{ "roomStatus": "MAINTENANCE" }` on a hotel A room: 200, then restore the original status.
- Employee 2 `PUT` that same room id: 403.
- `activityadmin1` `PUT /api/hotels/{hotelA}`: 403.

## Round 4 — operator home

`npx tsc --noEmit` from `choloBD-expo`.

Script rounds 1–3 still pass. No new HTTP cases. The home is not driven here.

## Round 5 — hotel info

`npx tsc --noEmit`.

Round 1’s room GET cases still pass.

## Round 6 — profile and room status

`npx tsc --noEmit`.

Re-run round 3. The restore assertions are the proof the client will call the same routes.

## Round 7 — bookings and cancel

Add this section to the same script.

- Create a second unpaid future booking on hotel A (same rules as round 2).
- Admin 1 `GET /api/bookings/hotel-rooms?hotelId={hotelA}`: 200, the new id is in `data.data`.
- Employee 1 with the same query: 200, same id.
- Employee 2 `GET` with `hotelId={hotelA}`: 403.
- Admin 1 `GET` with `userId` of user 1 is still allowed only when that filter is user 1’s own id. Do not require the operator list to use `userId`. A call with no `hotelId` and no `userId` as admin 1 stays 403 (only master admin lists every booking).
- Employee 1 eligibility on the new booking: `canCancel` is true (unpaid, future).
- Employee 1 `DELETE` that booking: 200, status `CANCELLED`.
- Employee 2 `DELETE` of a hotel A booking: 403. Use the round 2 booking only if it is still active; otherwise create one and cancel it as admin 1 after the 403 check. Do not leave a `PENDING` booking behind.

`npx tsc --noEmit`.

## Round 8 — scanner screen

`npx tsc --noEmit`.

Re-run the full script. Round 2 is the scan contract. There is no camera case.

## When a device is available later

These are not the round gate.

- Hotel admin login opens My hotel, Current bookings, and QR scanner. Staff and Your Bookings are absent.
- Hotel employee login opens the same three cards, not the traveler wallet home.
- Activity admin login does not open the hotel cards.
- Hotel info lists rooms. Admin sees a profile save. Employee does not.
- Current bookings lists hotel A for both hotel 1 users. Cancel on an unpaid row succeeds. A row eligibility marks uncancellable shows the reason and does not delete.
- Scanner shows guest, code, dates, and rooms after a valid token. Checkout and no-show are increment 12.
