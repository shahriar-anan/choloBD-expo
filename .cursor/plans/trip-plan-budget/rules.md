# Rules — Trip plan budget

This folder is the spec for budget UI on personal trip plans. Scope is the mobile app and the backend. Do not edit the website.

## Money sources

- **Budget** = plan `estimatedBudget`, falling back to `totalBudget`. The wizard keeps sending both with the same value.
- **Planned** = sum of stop costs. On the detail page use `budgetSummary.plannedTotal` (saved values, equal to checkout `totalAmount`). In the wizard use the quote; fall back to the device sum only while the quote is loading or failed, and label it.
- **Stop cost** = activity `entryCost` + one night at the hotel room chosen by `resolveHotelStayPrice`. Never compute a hotel night from the cheapest room in a total. "From ৳X / night" is only for picker lists.
- Transport has no price. Show `Not priced`. Never show ৳0 for it.
- Prices are for 1 traveller and 1 room. Say so in the breakdown footnote and review card.

## Backend

- Additive only. No schema change. Do not run any Prisma CLI command.
- Do not change `applySegmentComponentCosts` results or `assertItineraryWithinBudget` behavior. Refactor through `computeSegmentCostBreakdown` and keep saved `estimatedCost` identical.
- The quote route saves nothing and accepts no booking-link fields.
- Follow the backend constitution: validator array then `checkValidation`, thin controller, service does Prisma, `{ status, message, data }`, `// Use 4 spaces for indentation` on new files.
- Place `POST /my/quote` with the authenticated `/my` routes, before any `/:tourPackageId` param route that could shadow it.
- Batch lookups (`findMany` with `in`). No per-segment `findUnique` in new code.

## App

- Screens call hooks; hooks call services; services use `getApiInstance()`. Unwrap `response.data.data`; show `response.data.message` on failure.
- Budget math lives in `src/utils/tripBudget.ts`. Components do not re-implement remaining/over logic.
- Tone thresholds: ratio < 0.8 `ok` (primary), 0.8–1.0 `warn` (warning), > 1.0 `over` (error). Same thresholds everywhere.
- Color is never the only signal. Every tone has words (`left`, `Over by`).
- Over budget: allow saving a stop in the editor; block Continue and Save on the wizard, because the server rejects it. Always offer `Raise budget to ৳X`.
- Daily allowance is a guide. Never mark a day as an error for being above it.
- Debounce quotes 500 ms, cancel stale requests, and re-quote only when pricing inputs change.
- When new backend fields are missing, render with the device estimate. No crash, no blank card.
- Strings through `TRANSLATION_KEYS` with `en.json` and `bn.json`. Money through `formatTaka`. Colors from `src/constants/theme.ts`.
- Use the terms Budget, Planned, Left / Over by, Not priced exactly as in plan §5.6.

## Leave out

Traveller count, transport pricing, expense logging, linked-booking prices, question reordering, website changes. See plan §7.

## Check

Backend: typecheck from `nodeapp/`, then `scripts/tests/test-trip-plan-budget-quote.ts` against a running local API.
App: `npx tsc --noEmit` from `choloBD-expo` after each phase. Do not start Expo or an emulator from the agent.
