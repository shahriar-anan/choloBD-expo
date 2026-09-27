# 05 — Guides

**Folder:** `05-guides` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: Not started. Depends on increment 03. Can be built in parallel with increments 04 and 06. UI starts only after Functional typechecks.

Guides are request-then-accept. The app must not offer payment while the booking is `PENDING`. Contact email and phone stay hidden until status is `CONFIRMED` or `COMPLETED`. The home “local guides” card currently routes to explore and does not call `/api/guides`.

## Functional

Add `src/services/api/guides.ts`, `src/services/api/guideBookings.ts`, `src/types/guides.ts`, and `src/hooks/useGuideBookingLogic.tsx`.

Catalog:

- `GET /api/guides`
- `GET /api/guides/:guideId`
- `GET /api/guides/:guideId/availability`

Bookings:

| Function | Call |
| --- | --- |
| Create request | `POST /api/bookings/guides` |
| List | `GET /api/bookings/guides` |
| Get | `GET /api/bookings/guides/:bookingId` |
| Eligibility | `GET /api/bookings/guides/:bookingId/cancellation-eligibility` |
| Cancel | `PATCH /api/bookings/guides/:bookingId/status` with `{ action: "cancel" }` |

Create body:

- Required: `guideId`, `userId` (signed-in user), `bookingDate`, `endTime`, `travelerCount` (1–50).
- `startTime` when the guide’s `requiresStartTime` is true. Optional otherwise.
- Optional: `specialRequirements`, `specialRequests` (max 500), `paymentMethod`.

There is no edit endpoint. Changing a request means cancel and create again while it is still `PENDING`.

Pay only when status is `ACCEPTED`, using `serviceType: "GUIDE_SERVICE"`. Strip `contactEmail` and `contactPhone` from any object passed to UI components unless status is `CONFIRMED` or `COMPLETED`.

Traveler clients must not send `action` of `accept`, `decline`, or `complete`. Those are the guide operator’s actions.

### Exit

`npx tsc --noEmit` passes.

## UI

Only after the functional exit.

- Guide list and detail under `src/app/(tabs)/explore/`. Detail shows working days, hours, and blocked dates from the availability payload, plus a request form (date, end time, traveler count, start time when required).
- Point the home local-guides feature (`src/components/homepage/FeaturesGrid.tsx`, id `local-guides`) at the guide list instead of `/explore`.
- Dashboard list of the user’s guide requests. Show status. Show pay only for `ACCEPTED`. Show cancel when eligibility says `canCancel`. Hide contact fields until `CONFIRMED` or `COMPLETED`.
- Do not build a guide-operator accept/decline console in this phase.

Device cases: D-05 and D-05b in [tests.md](tests.md).
