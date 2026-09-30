# Rules — increment 06 (transport)

Shared: [_shared/global-rules.md](../_shared/global-rules.md)

## Scope

**Bus** and **car rental** only. No flight or train UI or API calls. Operator inventory writes stay out of the traveler app.

The search home (`transport-search.tsx`, From / To / journey date / type) stays. The only addition on that screen is an optional return-date row for bus. From and To stay division and district.

Visual style is this app’s theme and the existing explore chrome. Functionally match the bus steps in `plan.md`. Do not restyle screens to match the reference travel app.

## Do not build

- Strike price, coupon, or insurance fields. `totalPrice` is the sum of seat `basePrice`.
- A promo carousel or a list of bank offers.
- A second payment browser. Pay with `usePaymentLogic` and `TRANSPORT_SERVICE`.
- A directions API. A maps link is allowed only when the stop has latitude and longitude.

## Holds

- `POST /api/transport-inventory/trips/:tripId/seat-holds` with `{ seatIds }` before bus create.
- Hold on Continue, for the full selection. A later hold on that trip replaces the previous one for this user.
- Create must include only seats still held. When `expiresAt` passes, drop the selection and require a new hold.
- Rental does not use holds.

## Booking body

Bus create sends `boardingStopId`, `droppingStopId`, `contactPhone`, `contactEmail`, and `passengers[]` with first name, last name, and `MALE` or `FEMALE`. Dropping `stopOrder` must be greater than boarding, and both stops must be on that trip’s route.

`returnLeg` is sent only for a return date. Its trip must be the reverse route. The success payload is either one booking or `{ roundTripGroupId, bookings }`. Handle both.

One-way leaves `roundTripGroupId` empty.

## Cancel and pay

Eligibility GET, then `DELETE`, with an optional `cancellationReason` (max 500). Each leg is cancelled and paid on its own. Bus refund window is 6 hours before that leg’s departure. Rental is 24 hours before pickup. The server decides the amount.

## AC chips

Filter the trips already loaded for that day. AC means a `busServiceTypes` value starting with `AC_`. Non-AC means `NON_AC_SEATER` or `NON_AC_SLEEPER`. Do not rely on the single-value `busServiceType` query for the Non-AC chip.
