# Hotel desk on mobile

Use the backend desk APIs. Do not change booking pay, cancel, or stay-status rules.

## Who sees what

| Screen | Hotel admin | Hotel employee |
| --- | --- | --- |
| Dashboard card **Staff** | Roster from `GET /api/hotels/:hotelId/staff` | Hidden. That route is admin-only. |
| Dashboard card **Cleaning** | All tasks for the hotel | Only tasks assigned to them |
| Room board | **Assign cleaning** creates a task and notifies that employee | Room status only, as today |
| Stay detail | Pick who is handling the arrival, edit the desk note | See the assignee, edit the desk note |
| Notification `HOTEL_TASK` | Opens Cleaning | Opens Cleaning |
| Notification `HOTEL_BOOKING` | Opens that stay, as today | Same |

`userStatus` on the roster is the account flag, not live presence.

Completing a task is `PATCH /api/hotel-tasks/:taskId/complete`. The server marks a cleaning room ready to sell. The app does not set payment or booking status.

Desk save is `PATCH /api/bookings/hotel-rooms/:bookingId/desk`. A note alone does not notify. Choosing an employee does.
