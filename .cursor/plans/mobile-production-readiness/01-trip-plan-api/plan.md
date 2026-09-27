# 01 — Trip plan

**Folder:** `01-trip-plan-api` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** In progress. API retarget is done. Wizard, day editor, and production UI are not.

**Reference:** Next.js personal plan builder `CustomTourPackageForm` and `src/components/forms/tour-package/*` in `NextJS-choloBD-frontend`. Backend contract: `POST/GET/PUT/DELETE /api/tour-builder/my`.

This increment does not add trip checkout, pay, or cancel. Those stay in increment 07.

## Already done

- Personal plan CRUD goes to `/api/tour-builder/my`. Day changes are a full `daySegments` replace on `PUT`. No `/api/trip-plans` or `/segments` URLs.
- Spot lists use `?locationId=`.
- Catalog “my tours” uses `GET /api/tour-builder`. Social login does not call the backend.
- `npm run check:api-paths` exists and passes.

## Still required

Four outcomes. Finish **Functional** mapping and validation helpers, pass `npx tsc --noEmit` and `npm run check:api-paths`, then **UI**.

### 1. Segment API is what the screens send

`src/services/api/tripPlanner.ts` and `src/services/api/personalPlanMapping.ts` must emit a body the personal-plan validators accept.

- Create and update send `packageName`, `shortDescription`, `tourType`, `locationId`, `startDate`, `endDate`, `estimatedBudget`, `participantCount`, `preferredHotelType`, `preferredTransport`, and `daySegments`.
- `basedOnPackageId` and `imageURLs` only on create. Cover upload uses `POST /api/tour-builder/my/:tourPackageId/images` after the plan id exists, same order as the web form.
- Do not send `isActive`, `isPopular`, `rating`, `isPublic`, or a client owner id.
- `endDate` must be strictly after `startDate`. Match the web duration rule: itinerary length is `duration` days, `end = start + duration - 1` as a calendar date. For a one-day plan (equal calendar dates), send start at `T00:00:00` and end at `T23:59:59` on that date so the server’s “end after start” check passes and the itinerary stays one day.
- Each stop: `dayNumber` ≥ 1, `segmentOrder` 1–4 and unique within the day, `shortDescription` 2–1000 characters. Optional `tourSpotId`, `activitySpotId`, `transportOption`, `hotelOption`, `hotelId`, `transportId`, `notes`.
- At most 4 stops per day. At most one overnight hotel per day, and only on the last stop of that day.
- Add, edit, and delete a stop by loading the plan, editing the local array, and `PUT`ting `daySegments`. Do not call a segment URL.
- `startTime`, `endTime`, and `estimatedCost` from the old segment modal are not part of the validated stop. Stop sending them.
- `hotelRoomBookingId`, `activityBookingId`, and `transportBookingId` stay off this increment. Increment 07 attaches those after activity and transport booking exist.

### 2. Creation wizard matches the web builder

Replace the three-step flow in `src/app/(tabs)/trip-planner/create.tsx` (location → dates → spot multi-select → auto-named create). Rebuild it to the web steps. Reference `CustomTourPackageForm`.

1. **Details.** Package name (2–255), short description (max 1000), tour type, division or location, start date, duration (1–60). Party size, estimated budget, preferred hotel type, and preferred transport are editable. They are not hardcoded.
2. **Optional catalog start.** Pick a catalog package (`GET /api/tour-builder`) to prefill details and stops as `basedOnPackageId`. Clearing the selection resets the draft, including stops.
3. **Itinerary.** One tab per day `1…duration`, including empty days. Add, edit, reorder, and delete stops on the draft before save. Continue is blocked until every day has at least one stop. Block a fifth stop on a day. Enforce unique `segmentOrder`. Overnight hotel only on the last stop of the day; if the user adds a later stop, move the hotel onto the new last stop and say so.
4. **Review.** Show name, dates, duration, location, and the stop list. Save calls `POST /api/tour-builder/my`. Success uses translation keys and opens `trip-planner/[id]`.

Spot and activity pickers stay filtered with `?locationId=` for the plan location (tour spot’s location for hotels, matching the web rule in `custom-tour-builder-ui.mdc`).

Remove `spotsToDaySegments` as the create path. Stops are built in the wizard, not dumped onto day 1.

### 3. Plan screens are enough for a full device QA of the plan

These routes must work against a live backend without dead controls:

| Screen | Route | QA must be able to |
| --- | --- | --- |
| List | `src/app/(tabs)/trip-planner/index.tsx` | Load and delete via `/api/tour-builder/my` |
| Wizard | `src/app/(tabs)/trip-planner/create.tsx` | Complete details, itinerary, review, create |
| Detail | `src/app/(tabs)/trip-planner/[id].tsx` | Open the saved plan |
| Days | `DayPlanTab` + `SegmentModal` | Add, edit, and delete stops on any day `1…duration`, then `PUT` `daySegments` |
| Itinerary | `ItineraryTab` | Read the saved stops in day order |

`DayPlanTab` must use the date span / `duration`, not `max(segment.dayNumber)`. A plan with zero stops still shows day 1…N and an add action.

`HotelsTab` and `TransportTab` must not offer a link or book action that does not persist. Show the stop’s `hotelOption` / `transportOption` as read-only on the plan. Remove the hotel-booking link modal from this increment. Live hotel and transport booking stay in later increments.

`src/app/(tabs)/trip-planner/list.tsx` must not be a second, divergent list. One list screen.

### 4. Production UI

After the flows above work:

- User-visible strings go through `TRANSLATION_KEYS` and both `en.json` and `bn.json`. No raw English `Alert` copy for create success, delete, or validation.
- Remove `console.log` from trip-planner screens and trip-planner components.
- Use theme colors (`primary`, `text`, `muted`, `surface`, `border`) for icons and tabs. No hardcoded `#0066FF` or one-off grays on these screens.
- Detail tabs scroll horizontally if the labels do not fit. Do not squeeze four labels into equal columns.
- Empty, loading, and server-error states exist on the list, wizard, and detail screen.
- The detail screen does not show a checkout button. Checkout is increment 07. The screen ends on the saved plan.

## Exit

- `npx tsc --noEmit`
- `npm run check:api-paths`
- Device cases in [tests.md](tests.md) run by a person

Then set this increment to **Done** in [MOBILE_PRODUCTION_READINESS.md](../../MOBILE_PRODUCTION_READINESS.md).
