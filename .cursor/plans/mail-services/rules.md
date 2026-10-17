# Rules — mail services (Expo)

Backend rules: [ExpressJS-choloBD-backend/.cursor/plans/mail-services/rules.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/mail-services/rules.md).

## Scope

Copy on the traveler register, hotel, and transport screens. This app does not send mail and does not read Resend keys.

## What the screen may say

- “We emailed you” only when that response has `emailDispatched: true`.
- Gateway success (SSLCommerz) is asynchronous. Those screens say a receipt is sent when payment is confirmed. They do not say the mail already arrived.
- A missing flag is treated as false.

## Leave unchanged

- `buildCancelSuccessMessage` in `src/utilities/bookingCancelHelpers.ts`. Package cancel uses it, and package mail is out of scope.
- `packageBooking.bookingSuccessDesc`. It already promises a package confirmation email the API does not send.
- Booking, payment, and cancel requests. Do not add a second call to trigger mail.

## Mail language and links (Phase 14)

- `X-App-Language` comes from the axios interceptor only. Screens do not set it per call.
- Incoming mail links carry only a booking id and an optional `action=pay`. Never read an email, phone, or token from a link.
- A link never skips login or ownership checks. The API decides whether the booking is visible.
- `action=pay` opens payment only for an unpaid, non-cancelled booking.

## Languages

Every new or edited key exists in `en.json` and `bn.json`, and is named in `translationKeys.ts`.
