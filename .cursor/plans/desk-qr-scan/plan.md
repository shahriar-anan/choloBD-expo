# Desk QR scan — result and history

**Folder:** `desk-qr-scan` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Result UI in progress.** Scan history waits on the log table in the API plan. Do not add that table in this pass.

The hotel check-in scanner and the bus ticket scanner already validate a code. What opens after a successful scan is a raw field dump, and leaving that screen forgets the scan. This plan polishes that result and keeps a recent list on the same scanner page.

API log: [ExpressJS-choloBD-backend/.cursor/plans/desk-qr-scan/plan.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/desk-qr-scan/plan.md).

Boarding-code generate stays in [bus-boarding-qr](../bus-boarding-qr/plan.md). Do not change traveler QR screens.

## Who sees it

Only staff assigned to that property.

| Desk | Roles | Entity |
| --- | --- | --- |
| Hotel scanner | `SERVICE_ADMIN`, `EMPLOYEE` | That hotel (`HOTEL_BOOKING`) |
| Bus scanner | `SERVICE_ADMIN`, `EMPLOYEE` | That bus company (`TRANSPORT_SERVICE`, type `BUS`) |

A traveler never sees this page. A rental desk has no scanner. Staff of another hotel or another bus company do not see this property’s history. `MASTER_ADMIN` is not a desk user here.

Activity scan is out.

## What a desk expects

A gate or front desk reads three things in under two seconds, at arm’s length: is this code good, who is this person, and which room or seat. Everything else is secondary. The last scans of this shift stay on the same screen so a second look does not need the traveler to open a new code.

## Gaps on the screens today

Both results replace the camera with a long text page. Hotel: `QRBookingDetailsDisplay` from `service-admin/qr-scanner.tsx`. Bus: `TransportQrScanResult` from `transport-admin/qr-scanner.tsx`.

| Gap | Hotel | Bus | Desk practice |
| --- | --- | --- | --- |
| First line is the confirmation code | Yes | Yes | Name first. Code is a reference under the name. |
| Status is a raw enum | `CONFIRMED`, and labels for `checked-in` / `active` that the API never sends | `PENDING`, `CONFIRMED` | A verdict: valid, unpaid, or already seen today. Human status beside it. |
| The decision fact is buried | Room number sits mid-page. Shift is missing. Dates have no clock. | Seat and departure are body text. The company name is repeated to its own staff. | Room, or seat plus departure time, is the second line. |
| Payment is an enum string | `UNPAID` / `sslcommerz` in a details table | Same, under a “payment method” label | Unpaid is a warning on the verdict. Paid is a short word, not the gateway name. |
| Useless block | The hotel’s own phone and email | Hard-coded English “Passenger 1” | Drop the property’s own contact. Name every passenger from the booking. |
| No memory | “Scan another” clears the booking | Same | Today’s scans stay on this page. |
| Errors | `red-50` banner, and the alert can show a stale message | Theme-adjacent, alert uses the thrown message | One message, theme colors, camera stays until dismiss. |

Checkout and no-show stay on the hotel result only. They are not a boarding stamp. The bus result still does not mark anyone boarded.

## Page shape (both scanners)

One screen. Two states.

**Idle.** Camera on top, same `QRCodeScanner`. Under it, **Recent**, the last scans for this property today. Each row: time, guest name, room or seat, and a small verdict. Empty copy when the shift has no scans yet. Tap a row to open the result built from that log entry. Do not ask the API to validate the old token again.

**Result.** After a live scan, or after tapping a row:

1. Verdict band. Valid uses the theme primary. Unpaid uses the theme warning. Already scanned earlier today says so and shows the earlier time.
2. Guest or lead passenger name.
3. Hotel: room numbers and type, check-in and check-out with time, shift when it is not all day. Bus: seats, each passenger name, departure time, boarding stop, route.
4. Confirmation code, booking status in words, paid or unpaid.
5. Hotel only: checkout and no-show, unchanged behavior, below the facts.
6. One primary button: back to the camera. Recent is visible again underneath.

Strings in `en.json`, `bn.json`, and `translationKeys.ts`. Use `theme.ts` colors. No new QR library.

## History on the page

Load `GET` scan history when the scanner opens and again after each successful scan. Show today’s rows, newest first. The list is this property’s log, so a second staff phone sees the same rows.

Do not store the QR string on the device.

### Exit

A hotel desk and a bus desk each show a readable result and today’s scans on the scanner page. Another property’s scans never appear. A traveler screen is unchanged.
