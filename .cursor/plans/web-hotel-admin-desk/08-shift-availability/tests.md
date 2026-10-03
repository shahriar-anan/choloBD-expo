# Tests — 08 shift availability

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Hotel admin and hotel employee. Use a hotel that allows shift booking, with one confirmed all-day stay and one confirmed morning stay on a known day.

- [ ] W-08a Both sidebars open Availability. The hashes are `hotel_admin_availability` and `hotel_employee_availability`. Refresh keeps the tab.
- [ ] W-08b The board shows seven days and four lines per room type: All day, Morning, Afternoon, Night.
- [ ] W-08c On the day of the morning booking, that room type’s Morning count is lower than on an empty day. The Afternoon line for that type is not reduced by the morning booking.
- [ ] W-08d On the day the all-day stay starts, All day, Morning, Afternoon, and Night for that room type are all reduced. An all-day stay blocks every shift.
- [ ] W-08e The numbers are not the catalog **open for sale** figure from Room Management. The caption says they come from bookings.
- [ ] W-08f Previous and next week change the columns. A failed request dashes that cell and leaves the other cells visible.
- [ ] W-08g The board has no price field and no control that closes a date.
- [ ] W-08h The traveler hotel booking page still loads availability for a search. This increment does not change that form.
