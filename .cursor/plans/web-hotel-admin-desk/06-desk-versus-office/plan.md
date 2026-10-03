# 06 — Desk versus back office

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

**Folder:** `06-desk-versus-office` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Not started.** Depends on increments 3 and 5.

The admin’s only reservation list is the Earnings table. That table sums every paid booking and labels it “Total Completed.” The employee can set a physical room to **Booked** with no guest, while the booking service never writes that status. Checkout and cancel exist on the API and are missing on the web desk.

## Outcome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Reservations and money are different screens. The room board shows which rooms a live booking holds, and whether a room is ready to sell or needs cleaning. The buttons that remain call the existing hotel booking and room routes.

## Round A — Shared reservation list

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Extract the employee list from increment 3 into one component both roles render.

- Employee keeps the Bookings tab and hash `hotel_room_bookings_management`.
- Admin gets a **Reservations** tab, hash `hotel_admin_reservations`, sidebar entry under Today. Actions are on for the admin as well: both roles may cancel and record stay outcome for their hotel. The API already allows both.
- Today counts on the admin panel link to this tab with the matching chip.
- Earnings stops being the booking list.

## Round B — Earnings

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

`EarningsSummarySection` becomes a money summary of the loaded bookings:

- **Paid** = sum of `totalPrice` where `paymentStatus` is `PAID`, minus rows whose `status` is `REFUNDED` (do not add those into Paid).
- **Unpaid** = sum where `paymentStatus` is `UNPAID` and `status` is `PENDING` or `CONFIRMED`.
- **Refunded** = count of `REFUNDED`, and the sum of those totals as its own figure.
- A period control: This month, or All loaded. “This month” filters by check-in calendar month. The heading states that the figures are from the bookings loaded for this hotel, not a payout from the payment gateway.
- Remove the guest-by-guest table. A short note points to Reservations.

Do not add an export button.

## Round C — Actions on a reservation

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

On the expanded row, for both roles:

- **Cancel** when `useGetHotelBookingCancellationEligibilityRQ` returns `canCancel`. Label is **Cancel booking** when `refundAllowed` is false, and **Cancel & refund** plus the amount when it is true. Confirm in a modal that states the amount, the method, and that the room hold is released. Call `useCancelBookingRQ` only. Hide the button when `canCancel` is false and show `reason`.
- **Checkout** and **No-show** when status is `CONFIRMED`, payment is `PAID`, and now is on or after `checkInDate`. They `POST /api/bookings/hotel-rooms/:bookingId/stay-status` with `COMPLETED` or `NO_SHOW`. Add the client next to the other hotel booking hooks. There is no Check In button and no `CHECKED_IN` status.
- After a successful cancel or stay update, refresh the booking list and the Today counts.

## Round D — Room board

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Replace the employee room stack with a board grouped by room type:

- Each room is a tile: room number, status, and if a `PENDING` or `CONFIRMED` booking detail covers now, the guest name on the tile. That guest line is read-only. Do not write `roomStatus: BOOKED` to show it.
- Status control offers three writes, all through the existing `PUT /api/hotel-rooms/rooms/:roomId` body `{ roomStatus }`:
  - **Ready to sell** → `AVAILABLE`
  - **Needs cleaning** → `MAINTENANCE`. The booking allocator only offers `AVAILABLE` rooms, so this is the supported way to hold a room after checkout.
  - **Out of service** → `OUT_OF_SERVICE`
- There is no `DIRTY` status. The button label is **Needs cleaning**. The saved value stays `MAINTENANCE`.
- After a successful **Checkout**, offer **Needs cleaning** for each room on that booking. The stay-status route does not change `roomStatus`, so this is a separate save on each room. Staff can skip it.
- Filters for status and room type stay. The filter value for the cleaning hold is the stored status `MAINTENANCE`, labeled **Needs cleaning**.
- Admin Today’s out-of-service count can link to a read-only copy of this board on the admin Room Management tab, under the catalog from increment 4. The admin does not need a second editor if the employee board is the one that saves. If the admin already has room update permission in the API, the same editor is fine on the admin tab. Do not build a different status model per role.

## Leave alone

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- Traveler QR.
- Cash walk-in, and any control that sets `paymentStatus` to `PAID`. Creating a guest booking leaves it `UNPAID`. No existing route records cash as paid. Wallet and SSLCommerz remain the only payment paths.
- Maintenance task CRUD. The tab stays the honest empty state from increment 1.
- Room-type prices and the create modal.

## Files

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `src/components/modular-components/dashboard/employee/hotel/HotelRoomBookingsManagement.tsx` (become the shared list, or extract and keep this file as a wrapper)
- `src/components/modular-components/dashboard/service-admin/HotelServiceAdminModule.tsx`
- `src/components/modular-components/dashboard/service-admin/hotel/EarningsSummarySection.tsx`
- `src/components/modular-components/dashboard/employee/hotel/HotelRoomStatusManagement.tsx`
- `src/components/structure-components/SIdebarMenu.tsx`
- `src/services/api/hotelBookingApi.ts` — stay-status mutation only
- Today panel from increment 5, so admin counts navigate to Reservations

## Exit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

[tests.md](tests.md), round by round. `npx tsc --noEmit` from `choloBD-expo`.
