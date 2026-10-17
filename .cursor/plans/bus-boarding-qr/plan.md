# Bus boarding QR — app

**Folder:** `bus-boarding-qr` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Implemented** (traveler boarding QR + bus desk scanner). Manual QA: [tests.md](tests.md).

Depends on the API in [ExpressJS-choloBD-backend/.cursor/plans/bus-boarding-qr/plan.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/bus-boarding-qr/plan.md). This app only displays and scans. It does not sign tokens.

Hotel is the UI model. The traveler opens a boarding code for one bus ticket. Bus staff scan it and read the passengers. Car rental has no QR. Web is out.

## Already in place (do not rebuild)

| Piece | Where | What it does today |
| --- | --- | --- |
| Hotel generate screen | `src/app/(tabs)/dashboard/[bookingId]/qr-generate.tsx` | Calls hotel generate and renders `QRCodeDisplay` |
| Hotel scanner | `src/app/(tabs)/dashboard/service-admin/qr-scanner.tsx` | Camera posts to hotel `qr-scan`, then shows rooms and stay actions |
| Shared image | `src/components/ui/QRCodeDisplay.tsx` | White QR of the token string, expiry line |
| Shared camera | `src/components/ui/QRCodeScanner.tsx` | Returns the scanned string |
| Activity sheet | `src/components/booking/BookingQrSheet.tsx` | `mode: 'activity'` generates an activity token. Other kinds, including transport, show “not supported” |
| Bookings list | `src/app/(tabs)/bookings/index.tsx` | Hotel navigates to the hotel generate screen. Transport opens that unsupported sheet |
| Ticket screen | `src/app/(tabs)/bookings/ticket/[bookingId].tsx` re-exports `dashboard/transport-bookings/[bookingId].tsx` | Pay and cancel. No QR button |
| Bus desk | `src/components/interface/TransportOperatorDashboard.tsx` | Passengers and coaches when `transportType === 'BUS'`. No scanner |

Do not point the bus scanner at `/api/bookings/hotel-rooms/qr-scan`. Do not render a bus ticket with `QRBookingDetailsDisplay` (that view expects rooms and stay dates).

## Phase 1 — Traveler code

On the ticket screen, when `transportType` is `BUS` and status is not `CANCELLED`, show a QR control beside the confirmation code, same placement as the hotel detail screen.

Tapping it opens a boarding screen that, on mount, calls `POST /api/bookings/transports/:bookingId/qr-generate` and passes `data.qrToken` to `QRCodeDisplay`. Use `data.expiresAt` from the response for the expiry line. Leaving the screen drops the token. Do not write it to storage.

A return leg is a separate ticket. Its button generates that leg only.

Strings in `src/locales/en.json`, `src/locales/bn.json`, and `src/constants/translationKeys.ts`. Boarding copy, not hotel “check-in” copy.

### Exit

A traveler with a live bus ticket can show a code. A cancelled ticket and a rental booking do not show the button.

## Phase 2 — Bookings list

The list already shows a QR action for `kind === 'transport'`. Send a bus row to the Phase 1 screen. Do not open `BookingQrSheet` in `unsupported` mode for a bus ticket.

### Exit

The list QR and the ticket QR show the same code flow.

## Phase 3 — Bus desk scanner

On `TransportOperatorDashboard`, when the company is `BUS`, add a scan-tickets card. Rental desks do not get it.

New scanner screen. Reuse `QRCodeScanner`. Post the string to `POST /api/bookings/transports/qr-scan`. On success, show confirmation code, operator, route, departure, payment, and each passenger with seat. Offer scan-another. No checkout and no no-show.

401, 403, and 410 show the API message. A failed scan does not clear the camera until the user dismisses it.

### Exit

Staff of that bus company can read a traveler’s ticket from the desk. A rental operator never sees the card.

## Out of scope

- Marking a passenger boarded.
- Activity sheet changes, except leaving transport off the unsupported path.
- Web.

Scan-result layout and today’s scan list for the hotel desk and the bus desk are [desk-qr-scan](../desk-qr-scan/plan.md).
