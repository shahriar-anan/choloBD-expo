# Baseline device regression

Optional before or after any increment. Full policy windows for cancel cases live in increment 02+ `tests.md`.

## D-00 Login and hotel regression

- Setup: existing user, one active hotel with a room type.
- Steps: log in with email and password. Search hotels. Open a hotel. Create a booking. Pay with the in-app browser. Open the booking and show the hotel QR.
- Expected: login returns access and refresh tokens. Booking id is a `HotelRoomBooking`. Payment `serviceType` is `HOTEL_BOOKING`. QR generate hits `POST /api/bookings/hotel-rooms/:id/qr-generate`.
