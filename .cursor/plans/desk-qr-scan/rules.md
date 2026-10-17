# Rules — desk QR scan (app)

API: [ExpressJS-choloBD-backend/.cursor/plans/desk-qr-scan/rules.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/desk-qr-scan/rules.md).

## Scope

Polish and recent-scan list for the hotel scanner and the bus scanner only.

Do not change traveler QR generate, activity QR, or car rental.

## Who

The scanner route stays on the hotel desk and the bus desk. Recent rows are for that same signed-in staff member’s property. Do not add the list to a traveler booking.

## Result

- Name, then the room or the seat and time, then the code.
- Verdict is valid, unpaid, or already scanned today. Do not print raw `PENDING`, `CONFIRMED`, `UNPAID`, or `sslcommerz` as the headline.
- Hotel keeps checkout and no-show. Bus does not gain a boarded action.
- A recent-row tap renders the stored summary. It does not call `qr-scan` again.

## History

- Fetch when the scanner page opens and after a successful scan.
- Today, newest first, this property only.
- Do not write `qrToken` to AsyncStorage, SecureStore, or Redux.

## Copy and color

English and Bengali. Theme colors from `src/constants/theme.ts`. Do not add a palette class such as `bg-red-50` on the new result.
