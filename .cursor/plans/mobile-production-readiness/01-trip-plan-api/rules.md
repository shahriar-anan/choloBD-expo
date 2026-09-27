# Rules — increment 01 (trip plan)

Shared rules: [_shared/global-rules.md](../_shared/global-rules.md)

Web reference: `NextJS-choloBD-frontend` `CustomTourPackageForm` and `.cursor/rules/booking/custom-tour-builder-ui.mdc`.

## Path map

| Mobile must call | Mobile must stop calling |
| --- | --- |
| `GET/POST /api/tour-builder/my`, `GET/PUT/DELETE /api/tour-builder/my/:tourPackageId` | `/api/trip-plans` and `/api/trip-plans/:id/segments` |
| `POST /api/tour-builder/my/:tourPackageId/images` | Uploading covers on a catalog route for a personal plan |
| `GET /api/tour-spots?locationId=` and `GET /api/activity-spots?locationId=` | `/location/:id` spot paths |
| `GET /api/tour-builder` to clone a catalog package | `GET /api/tour-builder/by-admin/:id` |

## Payload

- Days are `daySegments` on create and a full replace on `PUT`.
- `basedOnPackageId` only on create.
- Forbidden on personal plans: `isActive`, `isPopular`, `rating`, client owner id.
- `endDate` is strictly after `startDate`.
- Stop rules, enforced in the client before submit and again by the server:
  - `dayNumber` ≥ 1
  - `shortDescription` length 2–1000
  - `segmentOrder` 1–4, unique within the day
  - at most 4 stops per day
  - at most one overnight hotel per day, on the last stop of that day
- Every day from 1 through `duration` has at least one stop before create or before leaving the itinerary step.
- Do not send `startTime`, `endTime`, or `estimatedCost` on a stop.
- Do not send `hotelRoomBookingId`, `activityBookingId`, or `transportBookingId` in this increment.

## Wizard

The create screen follows the web order: details, optional catalog clone, per-day itinerary, review, then `POST /api/tour-builder/my`.

Hotel options on a stop use the tour spot’s location, not the plan division alone.

## Screens that must not lie

- Hotels and transport tabs do not start a booking or link a booking id.
- No checkout control on the plan detail screen.
- One trip list. Do not keep a second list with different behavior.

## OAuth

Social sign-in stays disabled. No OAuth callback or validate URLs in `src/services/api/` or `src/store/`.
