# Tests — mail services (Expo)

Backend inbox checks are in [ExpressJS-choloBD-backend/.cursor/plans/mail-services/tests.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/mail-services/tests.md). These checks are the screens only.

Run the app against an API started so it loads `nodeapp/.env`.

## Flag on

With `emailDispatched: true` on the matching response, English and Bengali:

- Register alerts `auth.register.welcomeEmail`, then still opens the traveler home.
- Hotel pay screen (`explore/payment.tsx`), opened right after create, shows `payment.holdEmail`.
- Transport pay screen shows `transport.holdEmail` after a bus or rental create.
- Hotel cancel (`useBookingLogic`) and transport cancel (`useTransportBookingLogic`) add the email sentence to that alert only.
- Wallet pay success uses the past tense.

## Flag off

With `emailDispatched` missing or false:

- Register redirects with no email alert.
- Hotel and transport pay screens do not say a hold mail was sent.
- Cancel alerts do not say a mail was sent.
- Gateway success still uses the future tense (`payment.successDesc`): a receipt is sent when payment is confirmed.
- Payment failure still says the booking is unpaid, and does not claim a mail unless that response included the flag.

## Phase 14 — language and links

Use a dev or EAS build (not Expo Go) with the link host verified.

- App in Bangla: the request log for hotel create, transport create, wallet charge, cancel, and register shows `X-App-Language: bn`. In English it shows `en`.
- Hold mail Pay now, app installed and signed in: opens that booking's payment screen.
- Same link, signed out: login first, then the payment screen.
- Same link on an already-paid booking: the booking detail, no payment screen.
- A receipt's View booking for a bus opens the ticket. For a hotel it opens the stay.
- A link for another user's booking shows not-found.
- The welcome's Open CholoBD button opens the traveler home.
- Round-trip hold copy (`transport.holdEmail`) reads correctly for a single mail in both languages.

## Untouched

- Package booking success still uses `packageBooking.bookingSuccessDesc`.
- `buildCancelSuccessMessage` is unchanged, so a package cancel does not gain an email sentence.
