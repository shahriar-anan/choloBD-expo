# Rules — increment 11 (hotel operator)

Shared: [_shared/global-rules.md](../_shared/global-rules.md). Hotel domain: `ExpressJS-choloBD-backend/.cursor/rules/booking/hotel-booking-rules.mdc`. Roles: `user-hierarchy.mdc`.

## Who this increment is for

| Role | Assignment fields | Hotel id used by the API |
| --- | --- | --- |
| Hotel `SERVICE_ADMIN` | `serviceType = HOTEL_BOOKING`, `serviceEntityId`, and `Hotel.serviceAdminUserId` | `serviceEntityId` / `serviceAdminUserId` |
| Hotel `EMPLOYEE` | `employeeServiceType = HOTEL_BOOKING`, `employeeServiceEntityId` | `employeeServiceEntityId` only |

`GET /api/users/profile` is the source for those fields. Login JWT `userServiceType` is `User.serviceType` and is null for employees. Do not branch the employee UI on the token claim.

## Response shapes

`GET /api/hotels/my`

```json
{ "status": "success", "message": "...", "data": [ { "id": "..." } ] }
```

`data` is always an array. Empty assignment is 200 and `[]`.

`POST /api/bookings/hotel-rooms/qr-scan` body is `{ "qrToken": "..." }`. Success `data.booking` is the booking include the service already returns. Status is not modified.

`GET /api/bookings/hotel-rooms?hotelId=` keeps the nested list: `data.data` is the rows and `data.pagination` is the page. Do not change that envelope.

## Writes

- Hotel profile: `PUT /api/hotels/:hotelId` as `SERVICE_ADMIN` of that hotel. Fields already on `HotelValidators.updateHotelInfoValidation`.
- Room status: `PUT /api/hotel-rooms/rooms/:roomId` with `{ "roomStatus": "AVAILABLE" | "MAINTENANCE" | "OUT_OF_SERVICE" }`.
- Cancel: eligibility GET, then `DELETE /api/bookings/hotel-rooms/:bookingId`. Optional `reason` in the delete body. No `POST /api/payments/refund`.

`ensureUserAssignedToHotel` is the hotel boundary. Master admin still bypasses it. Do not duplicate that check in the controller.

## Mobile layering

Screens call hooks. Hooks call `src/services/api/`. No Axios in `src/app/` or `src/components/`.

Operator home is only the hotel admin and the hotel employee. Other `SERVICE_ADMIN` values stay on their current dashboard.

Desk booking cards show the guest. They do not show the traveler check-in QR button.

## Do not

Increment 12 owns stay status, earnings, complaints, and room rates. Do not add them in this increment.

- Run Prisma CLI.
- Start Expo, an emulator, Detox, or Maestro. Shahriar runs `node` scripts and `tsc`.
- Add a staff, earnings, maintenance, check-in, or cash-payment route.
- Point the app at public `POST /api/bookings/hotel-rooms` for walk-ins.
- Send `userId` on the operator booking list.
- Change traveler hotel search or traveler cancel behavior.
