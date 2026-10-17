# Rules — QR overhaul (app)

The API plan is the source of truth for issue, check-in, and history. This app only displays and scans.

## Traveler

- Encode `data.qrToken` only. Do not cache it in storage.
- Do not show an expiry time.
- Show the code only while `checkedInAt` is null.
- When `checkedInAt` is set, the card and the details show Checked in and do not call generate.

## Desk

- Hotel, activity, and bus each call their own scan, check-in, and history routes.
- Recent rows come from the server list for today. Tapping a row uses the history detail route and does not check the guest in.
- Check in is a button on the result. It is not implied by a scan, by checkout, or by no-show.
- Do not keep scans in component state as the only copy. Leaving the screen and coming back reloads the list.
- Checkout and no-show stay on the hotel result only.
- A traveler never sees Recent.

## Copy and theme

Strings in `en.json`, `bn.json`, and `translationKeys.ts`. Use `theme.ts` colors. No new QR library.

## Do not

- Do not implement [desk-qr-scan](../desk-qr-scan/plan.md).
- Do not point the activity scanner at the hotel scan route.
- Do not add a rental, guide, package, or trip QR screen.
