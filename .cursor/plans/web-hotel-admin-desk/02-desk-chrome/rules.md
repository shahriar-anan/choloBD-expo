# Rules — 02 desk chrome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Shared rules: [../README.md](../README.md).

- Hashes that must keep working:
  - Admin: `hotel_admin_profile`, `hotel_admin_rooms`, `hotel_admin_earnings`, `hotel_admin_complaints`
  - Employee: `hotel_room_status_management`, `hotel_room_bookings_management`, `hotel_employee_complaints`, `hotel_maintenance_tasks_management`
  - `?createRoomType=1#hotel_admin_rooms` still opens room management and the create modal.
- `replaceState` on tab click. Do not push a history entry per tab.
- Theme tokens only. No `bg-blue-600`, `text-yellow-800`, `text-red-400`, or sibling palette classes on these screens.
- Do not add count badges in this increment.
