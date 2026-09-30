# 11 — Hotel admin and hotel employee

**Folder:** `11-hotel-operator` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Implemented.** `npx tsc --noEmit` passed. `test-hotel-operator-access.js` **39/39 passed** on 2026-09-30 against `http://localhost:5000`. Device cases in `tests.md` are still unchecked.

Wire the existing mobile hotel-operator screens to the backend. Do the three contract fixes first, then connect the screens that already exist. Shahriar runs the HTTP script and `tsc`. Do not open an emulator or a device for the round gate.

Seed pair for every script: `hoteladmin1@gmail.com` and `hotelemployee1@gmail.com` share the first seeded hotel (Grand Palace - Dhaka 1). `hoteladmin2@gmail.com` and `hotelemployee2@gmail.com` share a different hotel. Password `root1234`. Login is `POST /api/auth/login-jwt`.

## Already in place (do not rebuild)

| Need | Today |
| --- | --- |
| Hotel admin’s hotels | `GET /api/hotels/my` lists hotels where `Hotel.serviceAdminUserId` is that user. Response is an array inside `data`. |
| Hotel profile fields an admin may edit | `PUT /api/hotels/:hotelId` — phone, email, website, amenities, policies, nearby attractions, check-in and check-out times (`HH:MM`) |
| Delete hotel photos | `PUT /api/hotels/:hotelId/images` with `imageIds` |
| Rooms of one hotel | `GET /api/hotel-rooms/rooms/:hotelId` — already behind `ensureUserAssignedToHotel` |
| Room status | `PUT /api/hotel-rooms/rooms/:roomId` — web sends `{ roomStatus }` only |
| Room types and prices | `POST` / `PUT` / `DELETE /api/hotel-rooms/roomTypes` — admin only, assignment already checked |
| Bookings for a hotel | `GET /api/bookings/hotel-rooms?hotelId=` — admin checks `serviceAdminUserId`; employee checks `employeeServiceEntityId` |
| Cancel | `GET .../:bookingId/cancellation-eligibility` then `DELETE .../:bookingId` |
| Traveler QR | `POST /api/bookings/hotel-rooms/:bookingId/qr-generate` — booking owner only |
| Scan | `POST /api/bookings/hotel-rooms/qr-scan` with `{ qrToken }` — returns the booking, does not change status |
| Mobile list helper | `getHotelBookings(hotelId)` in `src/services/api/bookings.ts` |
| Mobile scan helper | `scanQRCode` in `src/services/api/qr.ts` |

Booking list JSON stays nested: HTTP `data` is `{ data: bookings, pagination }`. `getHotelBookings` already unwraps that. Do not flatten it.

## Left off

Stay status, the day lists, complaints, room rates, earnings, the notification bell, profile lists, and read-only reviews are increment 12. This increment does not build them.

- Staff create, invite, or list. Master admin keeps `PUT /api/users/:userId/role`. Remove the Staff card from the operator home. Do not add an employees endpoint.
- Cash desk bookings, marking `paymentStatus` paid, picking a specific room, and editing a confirmed stay.
- Shift-booking toggle (`updateBookingMode` has no route), review replies, maintenance tasks, and new hotel photos.
- Activity, guide, and transport operator homes. A `SERVICE_ADMIN` whose `serviceType` is not `HOTEL_BOOKING` keeps today’s screen.
- Traveler hotel search, pay, and the traveler QR button. Those stay increments 01b and 02.

## Progress

Not started. Finish one round, run that round’s command in [tests.md](tests.md), then start the next. Rounds 1–3 are backend. Rounds 4–8 are the app and assume 1–3 are green.

---

## Round 1 — My hotel is a list for both roles

`GET /api/hotels/my` must return the same shape for a hotel admin and a hotel employee.

`HotelController.getMyHotel`:

- `SERVICE_ADMIN` with `serviceType === HOTEL_BOOKING`: hotels from `HotelService.getHotelsByServiceAdmin(user.id)`. Same query as today.
- `EMPLOYEE` with `employeeServiceType === HOTEL_BOOKING`: one hotel loaded by `employeeServiceEntityId`. Ignore `serviceEntityId`. A missing hotel id yields an empty list.
- Every other authenticated role, including activity and transport admins: an empty list.
- HTTP 200. Body `data` is always an array. An operator with no hotel gets `[]`, not 404.

The JWT `userServiceType` is copied from `User.serviceType` only. Hotel employees have that field null. This route reads the user row, not the token claim.

### Files

- `nodeapp/src/controllers/hotelController.ts` — `getMyHotel`

### Exit

You run round 1 in [tests.md](tests.md). Admin 1 and employee 1 return the same hotel id. Admin 2’s id is different. A traveler gets `[]`.

## Round 2 — QR scan uses the employee’s hotel

`POST /api/bookings/hotel-rooms/qr-scan` today loads `serviceEntityId` and rejects the caller when that field is empty. Hotel employees store the hotel on `employeeServiceEntityId`, so every employee scan fails.

`HotelBookingController.validateQrToken`:

- Allow `SERVICE_ADMIN` and `EMPLOYEE` only. Anyone else gets 403.
- Hotel id is `serviceEntityId` when `serviceType` is `HOTEL_BOOKING`, and `employeeServiceEntityId` when `employeeServiceType` is `HOTEL_BOOKING`.
- A hotel role with no hotel id gets 403.
- Pass that id into `HotelRoomBookingService.validateQrToken`. A token for another hotel still fails with the existing unauthorized error.
- Do not write `status`, `paymentStatus`, or any check-in column. Read the booking status before the scan and require it to be unchanged after.

### Files

- `nodeapp/src/controllers/hotelBookingController.ts` — `validateQrToken`

### Exit

You run round 2. Admin 1 and employee 1 both scan a token for their hotel. Employee 2 and `user1` are rejected. The booking status is the same after a successful scan.

## Round 3 — Hotel and room writes stay on the assigned hotel

`PUT /api/hotels/:hotelId` and `PUT /api/hotels/:hotelId/images` sit behind `checkServiceAdminRole` and do not call `ensureUserAssignedToHotel`. `PUT /api/hotel-rooms/rooms/:roomId` sits behind `checkEmployeeRole` and also skips that guard. The guard already resolves `hotelId`, `roomId`, and `roomTypeId`.

Add `ensureUserAssignedToHotel` on:

- `PUT /api/hotels/:hotelId`
- `PUT /api/hotels/:hotelId/images`
- `PUT /api/hotel-rooms/rooms/:roomId`

Employees remain blocked from hotel profile and image routes by `checkServiceAdminRole`. That 403 stays. Do not let an employee through those routes.

The mobile client will send only `{ roomStatus }` on the room route. Do not add room-type or price fields to that call. Leave the service able to accept `roomNumber` so the web dashboard is unchanged.

The script must put the original phone number and the original `roomStatus` back before it exits, including when an assertion fails after the write.

### Files

- `nodeapp/src/routes/hotelRoutes.ts`
- `nodeapp/src/routes/hotelRoomRoutes.ts`

### Exit

You run round 3. Admin 1 can change and restore their own hotel phone. Admin 1 cannot update admin 2’s hotel. Employee 1 can set and restore a room in hotel 1. Employee 2 cannot. Employee 1 cannot `PUT` the hotel profile.

---

## Round 4 — Operator home

Functional, then UI. Hotel operators are not “any `SERVICE_ADMIN`”.

Load `GET /api/users/profile` before choosing the dashboard. Use:

- `role === SERVICE_ADMIN` and `serviceType === HOTEL_BOOKING`, or
- `role === EMPLOYEE` and `employeeServiceType === HOTEL_BOOKING`

Do not use the login JWT `userServiceType` for this. It is null for employees.

`getMyHotel()` in `src/services/api/users.ts` returns `Hotel[]`. Drop the single-object branch in `service-admin/index.tsx`.

`src/app/(tabs)/dashboard/index.tsx` currently renders `ServiceAdminDashboard` for every `SERVICE_ADMIN` and the traveler home for every `EMPLOYEE`. Hotel admin and hotel employee both get the operator home. Other roles stay on the screen they have today. Do not fetch the traveler wallet or traveler booking lists for a hotel operator.

Operator home cards, in this order:

1. My hotel → `/(tabs)/dashboard/service-admin`
2. Current bookings → `/(tabs)/dashboard/service-admin/current-bookings`
3. QR scanner → `/(tabs)/dashboard/service-admin/qr-scanner`

Remove the Staff card and the Your Bookings card. Leave `staff.tsx` and `your-bookings.tsx` on disk and do not link them. Do not replace the dummy staff rows.

Strings go through `TRANSLATION_KEYS` and both locale files.

### Files

- `src/hooks/useDashboardLogic.tsx` — keep `serviceType` and `employeeServiceType` from the profile
- `src/app/(tabs)/dashboard/index.tsx`
- `src/services/api/users.ts` — `getMyHotel` returns an array
- `src/app/(tabs)/dashboard/service-admin/index.tsx`
- `src/components/interface/ServiceAdminDashboard.tsx`

### Exit

You run `npx tsc --noEmit` from `choloBD-expo`. Rounds 1–3 still pass.

## Round 5 — Hotel info and room list

`service-admin/index.tsx` opens hotel info with the hotel id from round 1’s list.

`hotel-info.tsx` loads that hotel and `GET /api/hotel-rooms/rooms/:hotelId`. Show the hotel name, phone, email, check-in and check-out times, and each room’s number, type, and `roomStatus`. Both roles see this screen. No edit controls in this round.

If `getMyHotel` is empty, the home shows the existing empty line and does not navigate.

### Files

- `src/app/(tabs)/dashboard/service-admin/index.tsx`
- `src/app/(tabs)/dashboard/service-admin/hotel-info.tsx`
- `src/hooks/useServiceAdminLogic.tsx` if the room fetch still assumes a single hotel object

### Exit

You run `npx tsc --noEmit`. The round 1 script still shows both roles can read the hotel, and `GET /api/hotel-rooms/rooms/:hotelId` is included there for employee 2’s denial.

## Round 6 — Profile edit and room status

Admin only, on hotel info: a save action calls `PUT /api/hotels/:hotelId` with the fields the validator already allows. Add `updateMyHotel` next to `getMyHotel`. Do not send name, location, rating, `hotelType`, or `isActive`.

Both roles: each room offers `AVAILABLE`, `MAINTENANCE`, and `OUT_OF_SERVICE`. The call is `PUT /api/hotel-rooms/rooms/:roomId` with `{ roomStatus }` only. Do not send `BOOKED`. The booking service does not use that flag for availability, and the desk must not mark a room booked by hand.

Hide the profile form when `role !== SERVICE_ADMIN`.

### Files

- `src/services/api/users.ts` — `updateMyHotel`
- `src/services/api/hotels.ts` or the hotel-room service file if one already wraps room updates. Add `updateHotelRoomStatus` if it is missing. Screens do not call Axios.
- `src/app/(tabs)/dashboard/service-admin/hotel-info.tsx`

### Exit

You run `npx tsc --noEmit` and round 3 again. The script still restores phone and room status.

## Round 7 — Current bookings and cancel

`useCurrentBookingsFetch` reads `profile.serviceEntityId`. That is empty for an employee, so the bookings screen tells every employee they have no hotel. Take the hotel id from `GET /api/hotels/my` (first hotel). Pass that id to `getHotelBookings`. Do not pass `userId`.

The list shows guest name, confirmation code, check-in, check-out, status, payment status, and total. `BookingCard` treats only `SERVICE_ADMIN` as the desk. Treat a hotel employee the same way: guest name and contact, no traveler “show QR” button.

Cancel, for both roles, on a row that is not already `CANCELLED`:

1. `getHotelCancellationEligibility`
2. If `canCancel` is false, show `reason` and do not call delete.
3. If `canCancel` is true, confirm, then `cancelHotelBooking`. When `refundAllowed` is true, the confirm label includes `refundAmount`. The server decides the amount.

Do not call payment refund or wallet refund routes.

### Files

- `src/hooks/useCurrentBookingsFetch.tsx`
- `src/components/ui/bookingCard.tsx` — desk layout for hotel employee as well as hotel admin
- `src/app/(tabs)/dashboard/service-admin/current-bookings.tsx` — wire cancel from this screen

### Exit

You run `npx tsc --noEmit` and round 7 in the script. The script creates one unpaid future booking on hotel 1, lists it as admin 1 and employee 1, rejects employee 2, cancels it as employee 1, and checks the status is `CANCELLED`.

## Round 8 — QR scanner screen

The screen already posts `{ qrToken }` through `scanQRCode`. After round 2, employee scans succeed.

Show the returned booking: guest name, confirmation code, hotel name, dates, status, payment status, and room numbers. A failed scan shows `response.data.message`. “Scan another” clears that booking and does not call the API.

Do not add a check-in button. Do not generate a traveler QR on this screen.

Camera capture stays in `QRCodeScanner`. This round does not automate the camera. The script’s round 2 cases are the gate.

### Files

- `src/app/(tabs)/dashboard/service-admin/qr-scanner.tsx`
- `src/components/ui/QRBookingDetailsDisplay.tsx` if the scan payload fields are not already shown
- `src/hooks/useQRScanner.ts` — surface the API `message`

### Exit

You run `npx tsc --noEmit` and the full script (rounds 1–3 and 7). Full script green and `tsc` clean means this increment’s backend and client contracts are in place.
