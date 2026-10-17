# Mail services — Expo

**Folder:** `mail-services` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Phases 4 and 14 implemented** (`X-App-Language`, deep links `/bookings/stay|ticket`, `action=pay`, `app.json` intent filters for `cholo-bd.com`). Universal links need a dev/EAS build and web `assetlinks.json` / AASA on the site host. Manual QA per [tests.md](tests.md). Backend sends are [ExpressJS-choloBD-backend/.cursor/plans/mail-services/plan.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/mail-services/plan.md).

This app does not call Resend. Phase 4 only updates copy. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set on the API. A success response still does not mean a mail went out. Trust `emailDispatched`.

Strings go in `src/locales/en.json`, `src/locales/bn.json`, and `src/constants/translationKeys.ts`.

## Screens

| Moment | File | Copy |
| --- | --- | --- |
| Registration succeeds | `src/app/(auth)/register.tsx` | If `emailDispatched` is true, alert `auth.register.welcomeEmail`, then keep `resolveRoleHome`. If false, redirect as today. |
| Hotel reserved | `src/app/(tabs)/explore/payment.tsx` | `payment.holdEmail` only when create returned `emailDispatched`. Opened from `explore/_provider.tsx`. |
| Gateway payment confirmed | `explore/payment.tsx`, `dashboard/payment.tsx`, `explore/transport-payment.tsx` | `payment.successDesc` says a receipt is sent when payment is confirmed. |
| Wallet payment confirmed | Wallet success path on those screens | Past tense only when the charge response has `emailDispatched: true`. |
| Payment failed | Same three screens | `payment.failedDesc` says the booking is still unpaid. Mention a mail only when that response includes `emailDispatched`. |
| Hotel cancelled | `src/hooks/useBookingLogic.tsx` | Extra sentence only when cancel returned `emailDispatched`. |
| Transport cancelled | `src/hooks/useTransportBookingLogic.tsx` | Same, on that alert only. |
| Bus or rental held | `src/app/(tabs)/explore/transport-payment.tsx` | `transport.holdEmail` only when create returned `emailDispatched`. |

### Exit

English and Bengali strings exist for every new or edited key. Screens that did not receive `emailDispatched: true` do not claim a mail was sent.

---

## Phase 14 — Mail language and email links (planned, not started)

Supports backend Phases 10 and 11 in [ExpressJS-choloBD-backend/.cursor/plans/mail-services/plan.md](../../../../ExpressJS-choloBD-backend/.cursor/plans/mail-services/plan.md). The app still never sends mail.

### 14a — Language header (backend Phase 10)

- In `src/services/api/axiosClient.ts`, the request interceptor sets `X-App-Language` to `bn` or `en`, using the same check as `isBanglaContent()` in `src/services/api/catalogLang.ts`.
- Send it on every request, so register, booking create, wallet charge, and cancel carry it. Do not add a body field.
- Switching the app language changes the header on the next request. Bookings already made keep the language they were created in.

### 14b — Open booking links from email (backend Phase 11)

The mail buttons are `https://{EMAIL_APP_LINK_BASE_URL host}/bookings/stay/{id}` and `/bookings/ticket/{id}`, with optional `?action=pay`. Custom-scheme `cholobd://` links are not used in mail.

- **Android:** add `android.intentFilters` in `app.json` for `https` on the link host, with paths `/bookings/stay/*`, `/bookings/ticket/*`, and `/`, and `autoVerify: true`. The web host serves `/.well-known/assetlinks.json` with the release signing SHA-256 of package `com.anonymous.choloBDmobile` (rename the package before release if needed).
- **iOS:** add `ios.associatedDomains: ["applinks:{host}"]`. The web host serves `apple-app-site-association`.
- Needs a new dev or EAS build. Expo Go cannot verify app links.
- **Routing:** expo-router maps `/bookings/stay/{id}` to `src/app/(tabs)/bookings/stay/[bookingId].tsx` and `/bookings/ticket/{id}` to `src/app/(tabs)/bookings/ticket/[bookingId].tsx`. Confirm those paths resolve with the `(tabs)` group, or add a `src/app/+native-intent.tsx` that rewrites the incoming path.
- **Logged out:** send the user to login, then on to the original path after sign-in. Do not drop the link.
- **Not theirs:** if the booking is not the signed-in user's (the API returns 403 or 404), show the existing not-found state.
- **`action=pay`:** when the booking is unpaid, open the same payment screen the booking detail already uses (`dashboard/payment.tsx` for hotel, `explore/transport-payment.tsx` for transport) once the detail has loaded. When it is already paid or cancelled, ignore the action and show the detail.
- **`/`:** opens the traveler home (`resolveRoleHome`).

### 14c — Copy

- If the backend ships Bangla mail, `auth.register.welcomeEmail`, `payment.holdEmail`, and `transport.holdEmail` need no change.
- A round-trip create (backend Phase 8) sends one mail. `transport.holdEmail` must not say "emails" in the plural, in `en.json` or `bn.json`.

### Dependencies outside this repo

- The web host (Next.js repo) serves `assetlinks.json`, `apple-app-site-association`, and a fallback page at `/bookings/stay/[id]` and `/bookings/ticket/[id]` with store links, for travelers without the app.

### Exit

With the app in Bangla, the booking request carries `X-App-Language: bn`. Tapping Pay now in a hold mail on a phone with the app installed opens that booking's payment screen after login, and an already-paid booking opens its detail instead.
