# UI overhaul

Mobile app only. Work in `choloBD-expo`. Do not change `NextJS-choloBD-frontend` or `ExpressJS-choloBD-backend`. Do not run Prisma CLI.

The bar depends on who is signed in. This folder plans one role at a time.

| Folder | Who | Status |
| --- | --- | --- |
| [general-traveller](general-traveller/README.md) | `USER`, and anyone signed out | Planned |
| [hotel-admin](hotel-admin/README.md) | `SERVICE_ADMIN` with `serviceType` `HOTEL_BOOKING` | Implemented |
| Hotel employee | `EMPLOYEE` with `employeeServiceType` `HOTEL_BOOKING` | Not started |

The hotel admin bar is built. A hotel employee still keeps Homepage, Explore, Dashboard, and Tracking. Trip Planner and Community stay hidden. Do not restyle `ServiceAdminDashboard` in the traveller increments.
