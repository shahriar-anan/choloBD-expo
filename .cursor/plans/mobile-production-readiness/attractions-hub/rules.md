# Rules — Attractions hub

This folder is the whole spec for the Attractions screen. Follow it on its own.

## Layers

Functional first: `src/services/api/`, `src/types/`, `src/hooks/`. Then UI: `src/app/`, `src/components/`, `src/constants/translationKeys.ts`, `src/locales/en.json`, `src/locales/bn.json`.

Screens do not import Axios or build hosts. They call hooks. Hooks call services. Services use `getApiInstance()` from `src/services/api/axiosClient.ts`.

Unwrap `response.data.data`. Show `response.data.message` when a call fails.

## Catalog calls

Public. No auth header is required to browse.

| List | Path | Shared query | Extra query |
| --- | --- | --- | --- |
| Places | `GET /api/tour-spots` | `locationId`, `name`, `page`, `limit` | `isPopular`, `minRating`, `divisionId` |
| Things to do | `GET /api/activity-spots` | same | `activityType`, `isPopular`, `minRating`, `maxEntryCost`, `divisionId` |
| Guides | `GET /api/guides` | same | `language`, `specialization`, `isVerified`, `minRating`, `divisionId` |

List payload is `data.results` plus `data.total`, `data.page`, `data.limit`. Page size defaults to 20 on the server and must stay at or under 100.

Leave these off tour-spot queries: `spotType`, `maxEntryCost`. The handler maps them onto fields TourSpot does not have.

Send `locationId` for a chosen location. Send `divisionId` only when the chosen row is a parent division and the spots hang off its children. Do not send both for the same chip.

Place type is a badge taken from `tourType` on the row. Things-to-do chips send `activityType`. Guide chips send `language` or `isVerified=true`.

## Detail calls

- `GET /api/tour-spots/:tourSpotId`
- `GET /api/activity-spots/:activitySpotId`
- `GET /api/guides/:guideId`
- `GET /api/guides/:guideId/availability?bookingDate=&endTime=&startTime=`

Availability is a check for the request form. The list does not call it.

## Booking calls from these screens

Activity, after a valid form, `POST /api/bookings/activity-spots` with `activitySpotId`, `userId`, `bookingDate`, `participantCount`. Then `startPayment` with `serviceType: "ACTIVITY_BOOKING"` and both id fields set to the booking id.

Guide, after a valid form, `POST /api/bookings/guides` with `guideId`, `userId`, `bookingDate`, `endTime`, `travelerCount`, plus `startTime` when `requiresStartTime` is true. The confirmation stays on this screen. Do not call `initializePayment` with `GUIDE_SERVICE` from the Attractions flow. A `PENDING` request cannot be paid.

`userId` on these two create bodies is required by the validators. Use the signed-in user id. Send the traveler to login when there is no session.

## Privacy

Guide list and public detail omit `contactEmail` and `phoneNumber`. The mapper drops both if they appear. The request confirmation does not show them.

## Copy and theme

User-visible strings use `TRANSLATION_KEYS` and both locale files. Tabs read **Places**, **Things to do**, and **Guides**. Colors come from `src/constants/theme.ts`.

## Leave out

- Tour package catalog and the trip planner.
- A map.
- Guide accept, decline, and complete.
- `GET /api/guides/my` and any operator profile edit.
- Activity QR generate/scan, booking lists, and cancel.
- Combined search (`/api/search`). The hub search box only sends `name` to the active list.
- Mounting `FeaturesGrid`.

## Check

`npx tsc --noEmit` from `choloBD-expo` after the functional files, and again after the UI files. Do not start Expo, an emulator, or a payment browser from the agent.
