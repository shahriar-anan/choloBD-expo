# Rules — bus boarding QR (app)

API contract and staff rules: [ExpressJS-choloBD-backend/.cursor/plans/bus-boarding-qr/rules.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/bus-boarding-qr/rules.md).

## Scope

Traveler boarding code and bus-operator scan in this app. `BUS` only. Car rental, flight, and train stay without a QR control.

## Traveler

- Show the control only when the booking is a bus ticket and status is not `CANCELLED`. Unpaid tickets still show it, matching the hotel detail screen.
- Fetch the token when the boarding screen opens. Discard it on leave. Do not put `qrToken` in AsyncStorage, SecureStore, or Redux.
- The QR value is `data.qrToken` only. Do not encode the login JWT, the confirmation code alone, or the booking id alone.
- One screen per booking id. Do not merge a round trip into one image.
- Reuse `QRCodeDisplay`. New copy is boarding copy in English and Bengali, registered in `translationKeys.ts`.

## Operator

- The scan card is on the bus desk only (`transportType === 'BUS'`).
- The scanner posts to `/api/bookings/transports/qr-scan`. It does not call the hotel or activity scan routes.
- The result view is a bus ticket: route, time, seats, passengers, confirmation code, payment. It does not offer stay status.
- Scan does not cancel, pay, or otherwise write the booking from this screen.

## Do not

- Change hotel generate, hotel scan, or activity generate while adding this.
- Style the code with a new QR library. `QRCodeDisplay` already uses `react-native-qrcode-svg`.
- Claim the passenger is boarded after a successful scan.
