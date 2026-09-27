# Shared rules — all mobile production increments

Apply these on every increment under `mobile-production-readiness/`. Backend business rules stay in `ExpressJS-choloBD-backend/.cursor/rules/`. Do not copy refund math into the app.

## Layer split

**Functional** (do first):

- `src/services/api/`
- `src/types/`
- `src/hooks/`
- `src/store/`

**UI** (after functional exit for that increment):

- `src/app/`
- `src/components/`
- `src/constants/translationKeys.ts` and `src/locales/*.json`

Screens do not import Axios or build URLs. They use hooks or Redux thunks → services → `getApiInstance()` from `src/services/api/axiosClient.ts`.

Each increment’s `plan.md` has **Functional** and **UI** sections. Finish Functional and pass that increment’s agent checks in `tests.md` before UI files.

## API client

- Base URL from `src/constants/api.ts`. No hardcoded hosts.
- Unwrap `response.data.data`. Surface `response.data.message` on failure.
- Do not send `userId` in payment initialize bodies for authorization; JWT identifies the user.
- Do not invent paths. If the backend has no route, leave the screen blocked and note it in the increment plan.

## UI conventions

- User-visible strings via `TRANSLATION_KEYS` and English + Bengali locales.
- Reuse `usePaymentLogic` for SSLCommerz (`expo-web-browser`, then `GET /api/payments/transaction/:transactionId`). No second payment browser helper.
- Home “coming soon” placeholders stay until the increment that replaces them.

## Blocked on the backend (do not implement)

- `POST /api/auth/oauth/callback` and `POST /api/auth/oauth/validate` from the mobile client.
- `PUT /api/auth/change-password` with JWT-only auth.
- Owner-filtered catalog package list (no replacement for removed by-admin list).
- Flight and train inventory booking.

## Phase gate (every increment)

1. Functional types and services exist.
2. `npx tsc --noEmit` from `choloBD-expo`.
3. Increment-specific agent checks in that folder’s `tests.md` (increment 01 also requires `npm run check:api-paths`).
4. Then edit UI files named in the increment `plan.md`.
5. A person runs device cases in `tests.md`. Agents do not launch Expo or emulators.

## Agent must not run

- `npx expo start`, `npm run android`, `npm run ios`
- Detox, Maestro, or other UI drivers
- Camera, QR, or live payment-browser flows in automation
- Prisma CLI in the backend repo

Backend contract scripts live under `ExpressJS-choloBD-backend/nodeapp/scripts/tests/`. Run them only when a mobile increment depends on uncertain backend behavior and the user asked.
