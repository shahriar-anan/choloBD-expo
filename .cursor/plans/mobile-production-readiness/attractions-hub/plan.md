# Attractions hub

**Folder:** `attractions-hub` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** UI in place. `npx tsc --noEmit` passed. Device cases in tests.md are not run yet.

The binoculars tile on the home hero is labeled Attractions and opens the tour-spot list only. A traveler should land on one Attractions screen and switch between places, things to do, and guides. Those three stay separate lists. They are different products, and the public APIs already treat them that way.

## What the traveler sees

```
← Attractions
Search
Location chips (shared)

[ Places ]  [ Things to do ]  [ Guides ]

— list for the selected tab —
```

Default tab is **Places**. The location chip and the search box apply to whichever tab is open. Changing tabs keeps the location and clears nothing else except tab-only filters.

Traveler labels, not schema names:

| Tab | Catalog | Card leads with | Detail action |
| --- | --- | --- | --- |
| Places | Tour spots | Photo, name, location, tour-type badge, rating | View. No price and no book button. |
| Things to do | Activity spots | Photo, name, location, duration, entry price | Book, then pay. |
| Guides | Guides | Photo, name, verified, languages, price per day | Send a request. No pay on this screen. |

Tour packages stay on the tour list and the trip planner. This screen does not add a map.

## Backend the app already has

All three catalogs are public `GET`s. Responses use `{ status, message, data }`. List `data` is `{ results, total, page, limit }`. Default page size is 20. Maximum is 100. Active rows only, unless `isActive` is sent. Seeded rows follow the site demo-data switch on the server; the app does not send a seed flag.

Search text is the query `name` (the server also accepts `q`, `search`, and `searchTerm`). Send `name`.

### Places — `/api/tour-spots`

| Call | Use |
| --- | --- |
| `GET /api/tour-spots` | List. Query: `locationId`, `divisionId`, `name`, `isPopular`, `minRating`, `page`, `limit`. |
| `GET /api/tour-spots/:tourSpotId` | Detail. Includes `location`, `images`, up to 10 `reviews`, `bestTimeToVisit`, `seasonalInfo`, and counts `nearbyHotelsCount`, `nearbyActivitySpotsCount`, `nearbyGuidesCount`. |
| `GET /api/tour-spots/popular?limit=` | Already used by the home feed. Leave that caller alone. |

`tourType` on each row is one of `ADVENTURE`, `CULTURAL`, `BEACH`, `CITY_TOUR`, `NATURE`, `RELIGIOUS`, `HISTORICAL`, `MIXED`. Show it as a badge. Do not send it as a filter. The list handler reads `spotType` and writes a column the TourSpot model does not have.

### Things to do — `/api/activity-spots`

| Call | Use |
| --- | --- |
| `GET /api/activity-spots` | List. Query: `locationId`, `divisionId`, `activityType`, `name`, `isPopular`, `minRating`, `maxEntryCost`, `page`, `limit`. |
| `GET /api/activity-spots/:activitySpotId` | Detail. Includes hours, `duration`, `ageRestriction`, `entryCost`, `bestTimeToVisit`, `activityType`, images, reviews, `nearbyHotelsCount`, `nearbyGuidesCount`. |
| `POST /api/bookings/activity-spots` | Create the booking from the detail form. Auth required. |

`activityType` is one of `SIGHTSEEING`, `ADVENTURE_SPORTS`, `WATER_ACTIVITIES`, `CULTURAL_EXPERIENCE`, `FOOD_TASTING`, `SHOPPING`, `WILDLIFE`. This filter is real. A chip row on the Things to do tab may send `activityType`.

Create body:

- Required: `activitySpotId`, `userId` (signed-in user), `bookingDate` (ISO-8601, not before today), `participantCount` (1–100).
- Optional: `specialRequirements`, `specialRequests` (max 500), `paymentMethod` of `wallet`, `sslcommerz`, or `cash`.

After create, pay with the existing `usePaymentLogic` / `initializePayment`: `serviceType: "ACTIVITY_BOOKING"`, `serviceTypeId` and `bookingId` set to the new booking id. `ServiceType` already includes `ACTIVITY_BOOKING`.

### Guides — `/api/guides`

| Call | Use |
| --- | --- |
| `GET /api/guides` | List. Query: `locationId`, `divisionId`, `specialization`, `language`, `name`, `isVerified`, `minRating`, `page`, `limit`. |
| `GET /api/guides/:guideId` | Public profile. |
| `GET /api/guides/:guideId/availability` | Slot check while the request form is filled. Query: `bookingDate`, `endTime`, optional `startTime`. |
| `POST /api/bookings/guides` | Create the request. Auth required. |

List and public detail strip `contactEmail` and `phoneNumber`. Do not render those fields from catalog payloads.

Guide row fields to show: `firstName`, `lastName`, `bio`, `specializations` (`TourType[]`), `languages` (`Language` strings), `experienceYears`, `toursCompleted`, `rating`, `pricePerDay`, `isVerified`, `location`, `images`, `workingDays` (0–6, Sunday = 0), `workingHoursStart`, `workingHoursEnd`, `requiresStartTime`, `unavailableDates`.

`specialization` filters with one `TourType`. `language` filters with one `Language` value (`ENGLISH`, `BENGALI`, `HINDI`, and the rest of the server enum). A language chip on the Guides tab may send `language`.

Create body:

- Required: `guideId`, `userId`, `bookingDate` (ISO-8601), `endTime` (ISO-8601), `travelerCount` (1–50).
- `startTime` when `requiresStartTime` is true. Omit it otherwise.
- Optional: `specialRequirements`, `specialRequests` (max 500).

The request is `PENDING`. This screen does not open payment. Payment is allowed only after the guide accepts, and that step is outside this folder. Hide contact on the confirmation.

Call availability when the traveler has a date and an end time (and a start time when required). Show `data.available` and `data.reason`. Submit only when the check returns available, or when the check has not been run yet and the server will reject a bad slot with its message.

## What the app has today

- `src/app/(tabs)/explore/tour-spots-list.tsx` lists places. `getTourSpots` in `src/services/api/tourSpots.ts` unwraps `results` and drops `total`, `page`, and `limit`.
- `src/app/(tabs)/explore/tour-spots-detail.tsx` and `TourSpotDetailView` show one place. Nearby counts from the detail payload are unused.
- `src/services/api/activitySpots.ts` can list by `locationId`, load one spot, and load popular spots. The mapper drops duration, hours, type, age, and `locationId`. `entryCost` is kept only when it is greater than 0.
- `src/app/(tabs)/explore/activity-preview.tsx` shows name, location, rating, and entry price.
- There is no `src/services/api/guides.ts` and no guide screen.
- Home tile: `QuickActionGrid` id `browse-tours` routes to `/(tabs)/explore/tour-spots-list?fromHome=true`.
- Explore card: `ExploreInterface` `handleBrowseAttractions` routes to the same list.
- Popular-places “see all” also opens that list. It should keep opening **Places**, now as a tab of this hub.
- `FeaturesGrid` is not mounted. Leave it unmounted.

## Functional

Screens do not call Axios. Hooks call services. Services use `getApiInstance()` from `src/services/api/axiosClient.ts` and unwrap `response.data.data`. On failure, surface `response.data.message`.

1. **Places.** Extend `getTourSpots` so the caller receives `{ results, total, page, limit }` and can request the next page. Keep the existing `TourSpot` card fields. Map `location.id` and `images[0].url` as today. Add `nearbyActivitySpotsCount` and `nearbyGuidesCount` on the detail type (they are already on `GET /api/tour-spots/:id`).
2. **Activities.** Extend `ActivitySpot` with `locationId`, `locationName`, `activityType`, `duration`, `openingHours`, `closingHours`, `ageRestriction`, `bestTimeToVisit`, and `entryCost` (including 0). `getActivitySpots` accepts the list query above and returns the page object. Keep `getActivitySpotById` and `getPopularActivitySpots` working for the home deals row.
3. **Activity booking.** Add `src/services/api/activityBookings.ts` with `createActivityBooking`. Add `src/hooks/useActivityBookingLogic.tsx` that creates the booking and then calls `startPayment({ serviceType: 'ACTIVITY_BOOKING', serviceTypeId: bookingId, bookingId })` from `usePaymentLogic`.
4. **Guides.** Add `src/services/api/guides.ts` (`getGuides`, `getGuideById`, `checkGuideAvailability`) and `src/services/api/guideBookings.ts` (`createGuideBooking`). Add `src/types/guides.ts`. Add `src/hooks/useGuides.ts` for the list page and `src/hooks/useGuideRequest.ts` for the form. Strip `contactEmail` and `phoneNumber` in the mapper even if a payload contains them.

No new Redux slice. No new payment helper.

### Exit

`npx tsc --noEmit` from `choloBD-expo`.

## UI

Only after the functional exit.

### Hub

New screen `src/app/(tabs)/explore/attractions.tsx`.

- Title **Attractions**. Back: if `fromHome=true`, `router.replace('/(tabs)')`; otherwise `router.back()`.
- Search field writes `name` for the active tab. Debounce the request.
- Location chips reuse `useFetchLocations`. The selected id is `locationId` on all three lists. “All locations” clears it.
- Segmented control: Places, Things to do, Guides. Query param `tab` is `places` (default), `activities`, or `guides`. `locationId` stays in the route params so a nearby link can open a tab already filtered.
- Each tab: loading, empty, error with retry, result count from `total`, and a load-more control when `page * limit < total`.
- Tab-only chips sit under the segmented control. Things to do: `activityType`. Guides: `language`, and a verified-only chip that sends `isVerified=true`. Places have no type chip.

### Cards

- Places: keep `TourSpotListCard`. Tap opens `/(tabs)/explore/tour-spots-detail` with `id`.
- Things to do: new card in `src/components/activitySpots/`. Photo, name, location, duration when present, entry price via `formatBdt`. A zero entry cost is shown as free. Tap opens `/(tabs)/explore/activity-preview` with `id`.
- Guides: new card in `src/components/guides/`. Photo or initial, full name, verified mark when `isVerified`, up to two languages, price per day. Tap opens `/(tabs)/explore/guide-detail` with `id`.

### Place detail

On `TourSpotDetailView`, under the description, add two rows when the counts are greater than 0:

- Things to do here → hub `tab=activities` and `locationId` of this place.
- Guides here → hub `tab=guides` and the same `locationId`.

A nearby-hotels count can be shown as text. Do not build a hotel list on this screen.

### Activity detail

Grow `activity-preview.tsx` into the Things to do detail: gallery or the first image, type, hours, duration, age, best time, description, rating, entry price. Signed-in travelers get a form: date, participant count, optional note (max 500). Submit creates the booking and starts payment. Signed-out travelers get a button to `/(auth)/login`. Show the server message when create or pay fails.

### Guide detail

New `src/app/(tabs)/explore/guide-detail.tsx`. Bio, languages, specializations, years, tours completed, rating, price per day, working days and hours, blocked dates listed from `unavailableDates`. Request form: date, end time, traveler count, start time only when `requiresStartTime` is true, optional note (max 500). Run the availability check before submit once date and end time are set. Success is a pending confirmation with no pay button and no phone or email. Signed-out travelers go to login.

### Entry points

| From | To |
| --- | --- |
| `QuickActionGrid` attractions tile | `/(tabs)/explore/attractions?tab=places&fromHome=true` |
| `ExploreInterface` browse-attractions card | `/(tabs)/explore/attractions?tab=places` |
| Popular places “see all” | `/(tabs)/explore/attractions?tab=places&fromHome=true` |
| Home deals activity card | Stays on `activity-preview` (the richer detail). |
| A single popular place card | Stays on `tour-spots-detail`. |

Strings go through `TRANSLATION_KEYS` plus `src/locales/en.json` and `src/locales/bn.json`. Theme colors from `src/constants/theme.ts`.

### Exit

Device cases in [tests.md](tests.md). A person runs them. Do not start Expo from the agent.
