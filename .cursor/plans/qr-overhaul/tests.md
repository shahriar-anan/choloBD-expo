# Tests — QR overhaul (app)

Run against an API that already has the pass table. Manual, on a device or simulator with a camera.

## Traveler

- [ ] Hotel, activity, and bus codes render with no “Expires” line while `checkedInAt` is null.
- [ ] Closing and reopening the code after a scan, before check-in, still shows the QR.
- [ ] After check-in, the hotel card and hotel details, the activity card and activity details, and the bus card and ticket details each show Checked in and no QR control.
- [ ] Opening those screens again after check-in still shows Checked in without calling generate.
- [ ] A rental or unpaid booking does not present a scannable code.

## Hotel desk

- [ ] A successful scan shows the guest and rooms, then the row appears under Recent.
- [ ] Scanning that code again succeeds and adds another row. Check in is still available.
- [ ] Check in changes the verdict. The next scan says already checked in.
- [ ] Checkout and no-show do not reject the next scan by themselves.
- [ ] Leave the screen and come back: the rows are still there. Tapping one opens the booking and does not check the guest in.

## Activity desk

- [ ] An activity admin opens the activity scanner, not the hotel one.
- [ ] A scan lists the booking. Scanning again is allowed until Check in. Reopening a row does not check the guest in.

## Bus desk

- [ ] A bus scan lists the passenger and seat under Recent.
- [ ] Tapping that row reopens the ticket result and does not board the passenger.
- [ ] A second scan is accepted. After Check in, the next scan is rejected.

## Isolation

- [ ] A hotel desk does not list bus or activity scans.
- [ ] Strings used on these screens exist in English and Bangla.
