# Tests — 06 desk versus office

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Hotel admin and hotel employee on the same hotel. Use a paid confirmed stay whose check-in is already in the past, an unpaid booking that eligibility says can be cancelled, and a paid booking inside the no-refund window if one exists.

## Reservations and earnings

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-06a Admin sidebar has Reservations. It opens `#hotel_admin_reservations` and shows the same lenses as the employee Bookings tab.
- [ ] W-06b Admin Today’s Arriving count opens Reservations on Arriving.
- [ ] W-06c Earnings has no guest table. Paid, Unpaid, and Refunded are separate. A refunded booking is not inside Paid.
- [ ] W-06d “This month” changes the three figures. “All loaded” includes older check-ins from the same response. The heading does not call the paid sum “Total Completed.”

## Actions

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-06e A booking eligibility marks cancellable shows one cancel button. The label includes the refund amount only when `refundAllowed` is true. Confirming calls cancel once. The row leaves the active lenses.
- [ ] W-06f When `canCancel` is false, the button is gone and the reason is visible.
- [ ] W-06g Checkout on an eligible paid stay sets status completed. No-show sets no-show. The row no longer offers those buttons.
- [ ] W-06h There is no Check In button. A future check-in does not offer Checkout.
- [ ] W-06i Employee can run the same cancel and checkout actions on their hotel. A booking for the other seed hotel is not in the list.

## Room board

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-06j Rooms are grouped by type. A room with a current confirmed stay shows the guest name.
- [ ] W-06k The status control has Ready to sell, Needs cleaning, and Out of service. It does not have Booked or Dirty.
- [ ] W-06l **Needs cleaning** saves `MAINTENANCE`. After refresh the tile stays in that state, and Today’s room count includes it.
- [ ] W-06n After Checkout, each room on that stay offers **Needs cleaning**. Skipping it leaves `roomStatus` unchanged.
- [ ] W-06o **Ready to sell** sets that room back to `AVAILABLE`. There is no button that marks a booking paid.
- [ ] W-06m Maintenance Tasks is still the unavailable sentence from increment 1.
