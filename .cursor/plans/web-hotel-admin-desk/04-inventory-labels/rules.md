# Rules — 04 inventory labels

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Shared rules: [../README.md](../README.md).

- Do not label `availableCount` or `totalCount - availableCount` as occupied, in house, or occupancy.
- Do not color a high open-for-sale ratio red. Red on this screen is reserved for a later out-of-service count, not for a full hotel.
- Show shift prices from `nightShiftPrice`, `morningShiftPrice`, and `afternoonShiftPrice`. Do not invent a price when the field is null.
- This screen is the catalog. Live rooms-free-by-day is increment 8, and it calls `GET /api/hotels/:hotelId/availability` only. Do not call `getShiftAvailability`. That method is not mounted on a route.
- Keep **Add Room Type** and the `createRoomType=1` modal behavior from increment 2.
