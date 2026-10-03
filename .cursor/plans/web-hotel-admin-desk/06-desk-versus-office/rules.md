# Rules — 06 desk versus office

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Shared rules: [../README.md](../README.md). Refund behavior: `ExpressJS-choloBD-backend/.cursor/rules/critical/refund-policy-for-services.mdc` and `choloBD-expo/.cursor/rules/refund-wiring.mdc`.

- Cancel uses eligibility, then `DELETE /api/bookings/hotel-rooms/:bookingId`. Never `PaymentApi` refund or wallet refund from this UI.
- Stay outcome is only `COMPLETED` or `NO_SHOW`, and only when the booking is `CONFIRMED`, `PAID`, and check-in time has passed. A second update is the API’s 400; show that message.
- QR scan is out of scope. Do not add a scanner or a traveler QR on these pages.
- Do not set `roomStatus` to `BOOKED` or `DIRTY`. A room looks occupied because a booking detail covers now. Cleaning writes `MAINTENANCE`. Ready writes `AVAILABLE`.
- Do not add a mark-paid or walk-in action. `paymentMethod: "cash"` on create does not set `PAID`.
- Earnings must not be labeled “completed” when the figure is “paid.” Refunded rows are not included in Paid.
- Keep hashes `hotel_admin_earnings`, `hotel_room_bookings_management`, and `hotel_room_status_management`. The new admin hash is `hotel_admin_reservations`.
- Do not change the booking list query to pass `dateFrom`.
