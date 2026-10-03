# Rules — 03 booking lenses

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Shared rules: [../README.md](../README.md).

- Bucket on the calendar day in the browser’s local timezone, same as `hotelDesk.ts`. Do not send `dateFrom` to the booking list. That query rejects a past date; the page filters rows it already loaded.
- Arriving, In house, and Departing include `CONFIRMED` only. Pending unpaid stays appear under **Unpaid** and **All**.
- Same-day morning and afternoon stays are Arriving on that day. Do not drop them because check-out equals check-in.
- Do not change `choloBD-expo/src/utilities/hotelDesk.ts` in this increment.
- Phone links use `tel:`. Do not add a QR button.
- Do not add checkout, no-show, or cancel controls here.
