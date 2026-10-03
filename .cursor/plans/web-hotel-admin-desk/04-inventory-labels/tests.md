# Tests — 04 inventory labels

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Hotel admin, Room Management, with at least one room type that allows shift booking and one shift price left null.

- [ ] W-04a The summary says Rooms and Open for sale. It does not say Occupied or Overall occupancy. There is no percent.
- [ ] W-04b A type with `totalCount` 10 and `availableCount` 8 shows 8/10 open for sale. Nothing on the card calls the other 2 occupied.
- [ ] W-04c No bar turns red because most rooms are marked open for sale.
- [ ] W-04d The row shows the nightly price and the three shift prices. The null shift price reads “No price”.
- [ ] W-04e **Edit** is on the collapsed row and opens the existing edit modal.
- [ ] W-04f The list does not expand into a 50vh or 65vh image viewer. Thumbnails, if present, stay in the row.
- [ ] W-04g **Add Room Type** still creates a type, and `/dashboard?createRoomType=1#hotel_admin_rooms` still opens the create modal.
