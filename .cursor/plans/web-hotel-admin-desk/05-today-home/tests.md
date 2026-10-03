# Tests — 05 today as home

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Same hotel, admin and employee. Have at least one arrival today, one unpaid booking, and one room in maintenance or out of service.

- [ ] W-05a `/dashboard` with no hash opens **Today** for the admin and for the employee.
- [ ] W-05b `/dashboard#hotel_admin_profile` still opens Hotel Profile. Employee room, bookings, complaints, and maintenance hashes still open those tabs.
- [ ] W-05c Sidebar shows Today first. The new links land on `hotel_admin_today` and `hotel_employee_today`.
- [ ] W-05d Arriving, In house, Departing, and Unpaid counts match the chips on the employee bookings tab for the same data.
- [ ] W-05e Employee: choosing the Arriving count opens Bookings on the Arriving chip. Choosing the room count opens Room Management.
- [ ] W-05f The Today panel does not show a taka total, an occupancy percent, or the old placeholder metrics.
- [ ] W-05g The Bookings tab shows a badge only when unpaid is greater than zero. The room tab badge matches maintenance + out of service.
