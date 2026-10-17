# Tests — bus boarding QR (app)

API cases: [ExpressJS-choloBD-backend/.cursor/plans/bus-boarding-qr/tests.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/bus-boarding-qr/tests.md). Run those before treating a device failure as an app bug.

The Metro bundler is already the way to open the app. Sign in as the traveler who owns a bus ticket, then as that company’s bus `SERVICE_ADMIN`. A rental admin and a cancelled ticket are the negative cases.

## Traveler

- Open a non-cancelled bus ticket. The QR control is visible in English and Bengali. Tapping it shows a code and an expiry time.
- Leave and open it again. The request runs again (a new token).
- The Bookings list QR on that ticket opens the same screen.
- A cancelled bus ticket has no QR control on the detail screen, and the list does not open the unsupported sheet for it.
- A car-rental booking has no QR control.
- A return leg opens a code for that leg’s id only.
- Airplane mode or a 400/403 shows the failure state and a way back. The previous token is not left on screen.

## Operator

- A bus desk shows Scan tickets. A rental desk does not.
- Scanning a live code from the traveler shows confirmation code, route, departure, seats, and passenger names.
- Scan another returns to the camera.
- Scanning a hotel check-in code, an expired code, or a code for another company shows the error and stays on the scanner after dismiss.
- After a successful scan, the ticket’s status in the passenger list is unchanged.
