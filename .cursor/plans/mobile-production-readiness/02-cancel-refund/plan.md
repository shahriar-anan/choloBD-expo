# 02 — Cancel and refund on hotel and package bookings

**Folder:** `02-cancel-refund` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Depends on increment 01 (done). Increment 01b is done and does not block this.

## Progress

**Done — checked on device 2026-09-28.** Functional wiring stays in place. Device QA accepted the hotel list and detail, including the changes made after the first UI pass:

- Tab bar hidden on both screens. List has no gray band, a hotel cover on each card, no room rows, and filters for All, Unpaid, Confirmed, Pending, and Cancelled.
- Detail hero is short, titled with the hotel name. No guest row. **QR code** sits beside the confirmation code. Cancel stays visible above the bottom of the screen.
- Complete Payment includes **Pay with Wallet coins**.

Do not rebuild eligibility or cancel. Do not fold activity, guide, transport, or trip cancel into this increment.

## Already executed (leave in place)

Shared type `src/types/cancellation.ts`: `CancellationEligibility` with `canCancel`, `refundAllowed`, `refundAmount`, `refundMethod` (`sslcommerz` | `wallet` | `none`), and `reason`.

| Product | Eligibility | Cancel | Where |
| --- | --- | --- | --- |
| Hotel | `GET /api/bookings/hotel-rooms/:bookingId/cancellation-eligibility` | `DELETE /api/bookings/hotel-rooms/:bookingId` | `src/services/api/bookings.ts`, `useBookingLogic` (`loadEligibility`, `cancelBooking`) |
| Package | `GET /api/bookings/package-bookings/:bookingId/cancellation-eligibility` | `PUT /api/bookings/package-bookings/:bookingId/cancel` | `src/services/api/packageBookings.ts`, `usePackageBookingLogic` |

Screens call those hooks. They do not call `POST /api/payments/refund` or wallet admin refund APIs. Hotel detail loads eligibility unless status is `CANCELLED`, `COMPLETED`, `REFUNDED`, or `NO_SHOW`. Package detail does not gate cancel on `status === 'PENDING'`. `src/services/api/hotelBookings.ts` still points at the legacy `/api/hotel-bookings` path; nothing new may call it.

## UI polish (next)

Screenshots: hotel list and hotel detail only. Package list and package detail stay as they are in this pass.

The detail screen is a vertical list of labels and raw values (Guest, “Price per night: 1800”, “Total: 7200”). That is not the layout to keep. Match the hotel search cards already in the app: thumbnail on the list (`explore/hotel-results.tsx`), full-width photo and name on detail (`explore/hotel-stay.tsx`).

### Cover image on the booking payload

`getBookings` and `getBookingDetails` in `hotelRoomBookingService.ts` include `hotel` and `location` and do not include `hotel.images`. List and detail cannot show a photo until those two reads include images.

On both includes, add `images` ordered by `order`, selecting `url` and `altText` only. No schema change. The app uses the first URL as the cover. If the hotel has no image, show a neutral placeholder in the theme background color. Do not substitute a stock photo.

Mobile reads `booking.hotel.images[0].url`. Do not add a second hotel-detail request just to get the photo.

### 1. Hide the bottom tab bar on both screens

`src/app/(tabs)/dashboard/user-bookings.tsx` and `src/app/(tabs)/dashboard/[bookingId].tsx` still show Homepage / Explore / Dashboard / Tracking.

Hide the tab bar while either screen is focused, and restore `tabBarScreenStyle` on blur. Reuse the parent `setOptions` walk in `src/hooks/useHideTabBar.ts` (the hotel-search flow already does this from `explore/_layout.tsx`). Dashboard home keeps the tab bar.

Both screens use `SafeAreaView` with a bottom edge today because the tab bar was on screen. After the bar is hidden, keep a single bottom inset for the home indicator only.

### 2. Hotel list — remove the gray band

On `user-bookings.tsx` a gray strip (`background` `#F5F7FB`) sits between the last card and the tab bar. It comes from `SafeAreaView` `edges={["bottom"]}` plus list `paddingBottom` while the tab bar already occupies the bottom of the screen.

After the tab bar is hidden, the list background runs to the bottom safe area. No second spacer, no gray band above where the tab bar was.

### 3. Hotel list — cover image on every card

`BookingCard` is text only: name, status, confirmation code, dates, price, room rows. On the traveler list (`user-bookings`, and the same card in booking history), each card leads with the hotel cover: a fixed thumbnail on the left (same proportion as hotel search results, about 96×96, rounded), then the existing name, dates, status, payment, and total. Service-admin cards stay guest-first; a thumbnail is fine there when `images` is present, and the guest name stays the title.

### 4. Hotel detail — Cancel must not sit under Generate QR

Cancel booking is inside the `ScrollView`. Generate QR Code is a fixed footer. On device the footer covers the cancel control (a dark cancel bar clipped under the blue QR button, with the tab bar under that).

One bottom action stack, nothing overlapping:

1. Cancellation policy (`reason`, and `refundAmount` / `refundMethod` when `refundAllowed`).
2. Cancel booking, fully visible. Disabled when `canCancel` is false, with the server reason still readable. Hidden only when eligibility is not fetched (`CANCELLED`, `COMPLETED`, `REFUNDED`, `NO_SHOW`).
3. Generate QR Code.
4. Complete payment, only when `paymentStatus === 'UNPAID'`.

Scroll content padding equals the height of that stack so the last card clears it.

### 5. Hotel detail — hero, title, then grouped stay facts

Remove the tall empty bar and the stack of plain text blocks. The page reads top to bottom like a stay receipt, not a debug dump.

1. **Hero.** Full-width hotel photo (about 224px tall, same as hotel stay). Back control sits on the image. Edit stays on the image only when the existing rule allows it (not `CONFIRMED` or `CANCELLED`).
2. **Title.** Hotel name directly under the photo, large. City on the next line when `hotel.location` has one. Confirmation code, booking status, and payment status sit in that title block. The name is visible without scrolling past the photo.
3. **Stay.** One card: check-in and check-out side by side, then total. Currency matches the list (`₹`).
4. **Rooms.** One row per room: room label and price per night, subtotal aligned to the right. Not a paragraph of “Price per night: 1800”.
5. **Guest.** One compact row (name), after the stay and rooms.
6. **Policy and actions.** Item 4. The policy is a short note, not another unlabeled text block.

User-visible strings go through `TRANSLATION_KEYS` (English and Bengali). Do not change eligibility rules, cancel endpoints, or the confirm modal’s copy of `reason` / refund fields.

## Exit

- Tab bar hidden on the hotel list and hotel detail, restored on dashboard home.
- No gray band on the hotel list.
- Each traveler booking card shows the hotel cover (placeholder only when the hotel has no image).
- Detail opens with that same photo, hotel name as the title under it, then stay, rooms, and guest as grouped rows.
- Cancel booking is fully visible above Generate QR.
- Then a person runs D-02-ui* and D-02* in [tests.md](tests.md).
