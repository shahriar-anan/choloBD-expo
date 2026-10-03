# Rules — 08 shift availability

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Shared rules: [../README.md](../README.md).

- The only availability call is `GET /api/hotels/:hotelId/availability` with `numberOfRooms`, `checkInDate`, `checkOutDate`, and `shift`.
- Do not add a week endpoint, and do not call `HotelRoomBookingService.getShiftAvailability`.
- The cell number is `availableRooms` on each room type. Do not display `HotelRoomType.availableCount` in that cell.
- Read only. No price input, no close button, no booking create.
- Do not change the traveler `HotelBookingModule` query.
