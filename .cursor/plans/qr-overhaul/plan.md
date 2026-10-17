# QR overhaul — app

**Folder:** `qr-overhaul` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **In progress** (hotel desk + traveler hotel/bus/activity partial; activity desk + bus desk added).

Depends on the API in [ExpressJS-choloBD-backend/.cursor/plans/qr-overhaul/plan.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/qr-overhaul/plan.md). This app shows the stored pass and scans it until staff check the guest in. It does not sign tokens and it does not keep a local scan log.

This replaces [desk-qr-scan](../desk-qr-scan/plan.md). Do not build that separate history client.

Web is out.

## What the screens do today

| Screen | File | Behavior |
| --- | --- | --- |
| Hotel traveler code | `src/app/(tabs)/dashboard/[bookingId]/qr-generate.tsx` | Calls hotel generate on open and shows `QRCodeDisplay`, including an expiry line |
| Hotel desk | `src/app/(tabs)/dashboard/service-admin/qr-scanner.tsx` | Camera posts to hotel `qr-scan`. Result is `QRBookingDetailsDisplay` plus checkout and no-show. “Scan another” drops the result |
| Hotel tab alias | `src/app/(tabs)/qr-scanner.tsx` | Re-exports the hotel desk |
| Activity traveler sheet | `src/components/booking/BookingQrSheet.tsx` | Generates an activity token and shows the expiry line. No activity scanner exists |
| Bus traveler code | `src/components/transport/BusBoardingQrScreen.tsx` | Generates a bus token and shows the expiry line |
| Bus desk | `src/app/(tabs)/dashboard/transport-admin/qr-scanner.tsx` | Camera posts to transport `qr-scan`, then `TransportQrScanResult`. No history |
| Shared image | `src/components/ui/QRCodeDisplay.tsx` | Renders the token and, when `expiresAt` is set, “Expires: …” |
| Shared camera | `src/components/ui/QRCodeScanner.tsx` | Returns the scanned string |

Leaving either scanner forgets the scan. There is no list to reopen it.

## Traveler code

Hotel generate, the activity sheet, and the bus boarding screen call the same generate routes. They render `data.qrToken` and stop reading `expiresAt`.

Remove the expiry line from `QRCodeDisplay`. Copy that still says the code expires in 10 minutes changes to: show this code at the desk until you are checked in. Strings in `en.json`, `bn.json`, and `translationKeys.ts`.

When the booking’s `checkedInAt` is set, do not open a QR screen and do not call generate. The card and the details section show **Checked in** instead of the QR action. If generate is called anyway, a 409 `already checked in` shows that same state and no QR.

Unpaid and cancelled bookings keep their current hidden or error states. Do not add a QR control for rental, guide, package, or trip.

## Traveler checked-in state

`checkedInAt` arrives on the hotel, activity, and bus booking objects the app already loads. No second request. Refetch those queries when the card list or the details screen gains focus, so a check-in done while the traveler was away is visible the next time that screen is shown.

Show **Checked in** on both the card and the details, and hide the QR control, in these places:

| Kind | Card | Details |
| --- | --- | --- |
| Hotel | `BookingCard` (`user-bookings`, and any card with `showGenerateQr`) and `RecentBookingCard` on the bookings list | `dashboard/[bookingId].tsx` and `bookings/stay/[bookingId].tsx` |
| Activity | The activity rows on the bookings list and `dashboard/attraction-bookings.tsx` | `dashboard/attraction-bookings/[bookingId].tsx` and `bookings/activity/[bookingId].tsx` |
| Bus | `TransportBookingCard` and the bus row on the bookings list | `TravelerTicketView` via `dashboard/transport-bookings/[bookingId].tsx` |

Guide, package, and trip cards do not grow a checked-in label. They have no pass.

## Desk history

Hotel scanner and bus scanner, and a new activity scanner, share one page shape.

**Idle.** Camera on top (`QRCodeScanner`). Under it, **Recent**: today’s scans for this property, from `GET` qr-scans. Each row shows time, guest name, the detail label (room, activity date, or seat), and a checked-in mark when `checkedInAt` is set. Empty copy when today has no scans. Tap a row to open the result from `GET` qr-scans/:scanId. Do not send the old token. Opening a row does not check the guest in.

**Result.** After a live scan, or after tapping a row:

1. Verdict. Not checked in says valid. Checked in says checked in at `checkedInAt`.
2. Guest or lead passenger name.
3. Hotel: rooms, dates, shift. Activity: date and participant count. Bus: seats, passengers, departure.
4. Confirmation code and booking status in words.
5. **Check in**, when `checkedInAt` is null. It calls that booking type’s `qr-check-in` route. After it succeeds, the verdict changes to checked in and the button goes away.
6. Hotel only: checkout and no-show stay where they are, and they still call the stay-status route. They are not check-in. They work from a history row because the detail includes `bookingId`.
7. One primary button back to the camera. Recent is visible again.

A scan after check-in shows the API’s already-checked-in message and stays on the camera. Earlier scans of that guest remain under Recent and can still be opened.

Load the list when the scanner opens and again after a successful scan. Do not store the QR string on the device.

Activity desk is new: `src/app/(tabs)/dashboard/service-admin/activity-qr-scanner.tsx`, linked from the activity operator dashboard the same way the hotel card links to the hotel scanner. It posts to activity `qr-scan` and lists activity `qr-scans`. It does not use the hotel scanner.

## Exit

A traveler sees one code with no countdown until staff press Check in. After that, the booking card and the details section show Checked in, and the QR control is gone. Hotel, activity, and bus desks can scan that code again until they press Check in. After check-in, a new scan is rejected, and today’s scans stay under the camera so a result can be opened again. Another property’s scans never appear.
