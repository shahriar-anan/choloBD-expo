# Trip plan budget

**Folder:** `trip-plan-budget` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Scope:** mobile app (`choloBD-expo`) and backend (`ExpressJS-choloBD-backend`) only. The website is not touched. Backend changes only add response fields and one route, so the website keeps working as it does today.

**Status:** Phases 1–15 implemented. Phases 12–15 (§10) cover the 2026-10-17 device QA. `npx tsc --noEmit` is clean for this work. Device cases Q1–Q12 still need a phone.

This is the budget slice of the larger trip planner overhaul. It covers what the traveler sees about money while building a personal plan and after saving it. It does not change how stops, days, or hotels are picked.

---

## 1. How money works today

These facts drive every decision below. They come from the code, not from intent.

### Backend

| Fact | Where |
| --- | --- |
| A personal plan is `TourPackage` with `kind: PERSONAL`. It stores `estimatedBudget` (the traveler's cap), `totalBudget` (set to the same value by the app), `actualCost` (never written by the app), and `participantCount` (defaults to 1, never asked). | `schema.prisma` `TourPackage` |
| Each stop is a `TourDaySegment` with one money field: `estimatedCost`. There is no split between activity and hotel. | `schema.prisma` `TourDaySegment` |
| On every create and update, the server **throws away** the client's `estimatedCost` and recomputes it: activity `entryCost` + one night at the stop's hotel. | `applySegmentComponentCosts` in `tourBuilderService.ts` |
| The hotel night is not the cheapest room. `resolveHotelStayPrice` picks a room category from the stop's `hotelOption` (or the hotel's `hotelType`): cheapest for budget types, most expensive for luxury and resort, the middle one otherwise. | `resolveHotelStayPrice` |
| Activity cost is for **one person**. Real activity bookings charge `entryCost × participantCount`. Hotel cost is **one room, one night**. | `activitySpotBookingService.ts` line 340 |
| Transport is an enum (`transportOption`). It has no price. | `TourDaySegment` |
| Save is rejected with `Itinerary cost cannot exceed the estimated total budget` when the stop sum is over the cap. | `assertItineraryWithinBudget` |
| Trip checkout charges the **sum of stop `estimatedCost`**, not the budget. The budget is only used if every stop costs 0. | `resolveCheckoutTotalAmount` in `tripBookingService.ts` |
| `GET /api/tour-builder/my/:id` returns segments with `tourSpotName` and `activitySpotName`. It does not return `hotelName`, the activity/hotel split, or any budget summary. | `enrichDaySegments` |
| There is no expense or spending model. Only the single `actualCost` float. | schema |

So the number the app calls "planned cost" is the price the traveler would pay at checkout. The budget is a cap they choose. Those are two different numbers, and the UI must never blur them.

### App

| Fact | Where |
| --- | --- |
| The wizard asks for a budget as question 2 on the details step, before duration exists. | `TripPlanCreateWizard.tsx` |
| On the itinerary step, the only money UI is one muted line under the stop list: `Live total ৳X / ৳Y`. Day pills, stop cards, and the photos step summary do not show per-day or per-stop cost. | lines 784–799 |
| The live total is `activityCost + hotelCost` per stop, summed on the device. | `sumStopTotals` |
| The hotel price the device uses is the **cheapest room** (`hotelStartingPrice`). The server uses `resolveHotelStayPrice`. For a resort or luxury hotel the device shows less than the server will save, so the device can say "within budget" and then save fails. | `CatalogPickerModal.tsx`, `StopEditorSheet.tsx` |
| Over budget only shows up as text, and only blocks continuing to the photos step. The stop editor shows nothing about the budget. | `getItineraryContinueReason` |
| Editing a saved plan loses the split. `tripPlanToWizardStops` puts the whole stop `estimatedCost` into `hotelCost` and sets `activityCost` to 0. | `personalPlanMapping.ts` |
| The plan detail page shows the budget and `budget ÷ days` inside the "At a glance" sheet. It never shows planned cost, remaining budget, cost per day, or cost per stop, even though each segment's `estimatedCost` is already in the response. | `TripPlanDetailView.tsx` |
| The detail page falls back to the hotel type enum for the hotel line, because the backend never sends `hotelName`. | same |
| A template clone prefills the budget with the catalog sell price. Cloned stops often cost more than that, so the clone is over budget the moment the traveler arrives on the itinerary step. | wizard `templateId` effect |
| Theme already has `success`, `warning`, `error` (and dark variants). Money is formatted with `formatTaka`. | `theme.ts`, `tripPlanItinerary.ts` |

---

## 2. What popular apps do, and what we take

Only patterns that fit our data are taken. Nothing here needs a feature the backend cannot back.

| Pattern | Seen in | Take it? | Why |
| --- | --- | --- | --- |
| A single **budget meter**: amount spent or planned against the budget, with "left" or "over" as the headline, colored by how close you are. | Wanderlog budget view, TravelSpend, Trail Wallet | Yes | We have the cap and the stop sum. This is the core element. |
| **Daily allowance**: budget ÷ days shown as a guide, with each day showing its own total. | TravelSpend, Trail Wallet | Yes, as a hint only | Hotel nights make days uneven. Show it as a guide in the breakdown, never as a red error on a day. |
| **Category split** (stay, activities, transport) as a stacked bar or list. | Wanderlog, Splitwise trip totals | Yes | Server can return the activity/hotel split. Transport is listed as "not priced" instead of hidden. |
| **Price line items in a bottom sheet** (nightly rate × nights, fees, total). | Airbnb, Booking.com price breakdown | Yes | Used for the breakdown sheet and the per-stop line items. |
| **Price on each card** in a list. | Booking.com, GoZayaan, Wanderlog places | Yes | Stop cards and day pills show their total. |
| **"After this you'll have ৳X left"** before confirming a choice. | Hopper / fintech spending previews | Yes | Stop editor footer and picker header. |
| **Price changed** notice when a saved price no longer matches. | Google Flights, Hopper | Yes | Stored stop cost is a snapshot; live price can drift. |
| Logging real expenses, splitting between travellers, receipts, currency conversion. | Wanderlog, Splitwise, TravelSpend | **No** (later) | Needs an expense model and participants in pricing. Listed in §7. |

---

## 3. Screen-by-screen analysis

Each screen lists: what it shows now, what budget info belongs there, whether the backend supports it, and the pattern used.

### 3.1 Details step — budget question

**Now:** Free number field, shows `৳ 15,000` under it. Asked before duration.

**Should show:**
- The formatted amount as typed (keep).
- Once duration and start date are answered further down, a one-line hint under the budget answer: `About ৳3,000 per day for 5 days`.
- Copy that says what the number is: the most you want this trip to cost, and that stop prices are checked against it.

**Backend:** Yes. Pure client math.

**Pattern:** Daily allowance hint.

**Do not:** Reorder questions in this slice. Question order belongs to the wizard overhaul.

### 3.2 Itinerary step — the main surface

**Now:** Day pills (`Day 2 · empty`), stop cards with names, one muted live-total line at the bottom.

**Should show:**

1. **Sticky budget bar** at the top of the step, under the step tabs. Always visible while scrolling stops.
   - Headline: `৳2,600 left` or `Over by ৳1,400`.
   - Sub line: `৳12,400 planned of ৳15,000`.
   - Thin meter. Tone: under 80% normal (primary), 80–100% warning, over 100% error.
   - Tap opens the **breakdown sheet** (§3.6).
2. **Day pills with totals**: `Day 2 · ৳3,200`. Empty days keep `· empty`. Selected pill unchanged.
3. **Day header** above the stop list for the selected day: `Day 2 · 3 stops · ৳3,200`.
4. **Stop card cost lines**, Booking.com style:
   - `Activity  ৳500` (or `Free` when 0, hidden when no activity)
   - `Stay · Deluxe room  ৳3,000 / night` (last stop only, when a hotel is set)
   - Right-aligned stop total `৳3,500`.
   - `Transport · Bus · not priced` in muted text when transport is set.
5. **Over-budget banner** replaces the plain text reason when over:
   - `This plan is ৳1,400 over your budget.`
   - Actions: `Raise budget to ৳16,400` (one tap, updates the budget field) and `See what costs the most` (opens the breakdown sheet sorted by cost).
   - Continue stays blocked, because the server rejects the save.
6. **Template clone**: if the clone arrives over budget, show the same banner with copy that explains the catalog price was used as the starting budget.

**Backend:** Partly. Totals work today on the device, but the hotel figure is wrong for non-budget hotels and the split is lost on edit. Needs the quote route (§4.3) so the numbers match what the server will save.

**Pattern:** Budget meter, price on each card, line items.

### 3.3 Stop editor sheet

**Now:** Selected activity and hotel rows show a cost. Nothing about the budget.

**Should show:**
- **Footer above Save**: `This stop ৳3,500` on the left; `৳2,600 left after this` or `৳900 over after this` on the right, toned like the meter. Updates as picks change.
- Hotel row subtitle shows the room the price is for and the unit: `Deluxe room · ৳3,000 / night`, because the picker list shows "from" prices.
- Saving is **allowed** when over budget. The itinerary banner then explains and offers the fix. Trapping someone inside a modal is worse than letting them see the whole plan.

**Backend:** Needs the quote route for the exact hotel night.

**Pattern:** "After this you'll have ৳X left."

### 3.4 Catalog picker (activity and hotel)

**Now:** Activity rows show `৳500` or `Free`. Hotel rows show `৳X / night` using the cheapest room.

**Should show:**
- A slim header line: `৳2,600 left in your budget`.
- Hotel prices labeled `From ৳X / night`, since that is what the number is.
- A small muted tag `Over what's left` on items whose price is more than the remaining budget plus whatever the current pick already costs. A tag, not a filter, and not hidden.

**Backend:** Yes. List data already has prices.

**Pattern:** Price on each card, remaining-budget context.

### 3.5 Photos step — review

**Now:** Name, `5 days · ৳12,400 / ৳15,000`, list of spot names.

**Should show a "Cost summary" card:**
- Budget meter (same component, not sticky).
- Rows: `Stays ৳9,000`, `Activities ৳3,400`, `Transport  Not priced`, `Planned total ৳12,400`, `Your budget ৳15,000`, `Left ৳2,600`.
- Footnote: `Prices are for 1 traveller and 1 room. Transport is not included. Checkout charges the planned total.`

**Backend:** Needs the split (quote route).

**Pattern:** Price breakdown summary.

### 3.6 Breakdown sheet (shared)

Bottom sheet opened from the budget bar, the over-budget banner, and the detail page.

- Meter at the top.
- **By category**: stacked bar (stays, activities) plus rows. Transport row says `Not priced`.
- **By day**: one row per day: `Day 2 · ৳3,200`, with a small marker when the day is above the daily allowance (`Above ৳3,000/day guide`). Tapping a day closes the sheet and selects that day.
- **Most expensive stops**: top three, so the traveler knows what to swap.
- Footnote, same as §3.5.

**Backend:** Needs the split (quote route on the wizard, detail summary on the plan page).

### 3.7 Plan detail page

**Now:** Hero, chips, edit button, "At a glance" row, About, day pills, stop timeline. Budget only inside the glance sheet.

**Should show:**
1. **Budget card** directly under the chips, before About:
   - Meter, `৳2,600 left` or `Over by ৳1,400`, `৳12,400 planned of ৳15,000`.
   - Two compact tiles: `Per day ≈ ৳2,480` (planned ÷ days) and `Biggest cost: Stays 73%`.
   - `View breakdown` opens the sheet.
2. **Day pills with totals**, same as the wizard.
3. **Stop timeline cards** gain the same cost lines as §3.2, with the real hotel name.
4. **Price changed notice** on the budget card when the live price differs from what was saved: `Prices changed since you saved: now ৳13,100 (+৳700). Edit and save to update.` This matters because checkout uses the saved number.
5. The glance sheet keeps the budget row and changes `Per day` to planned ÷ days, labeled as planned.

**Backend:** Needs `hotelName`, the per-stop split, and `budgetSummary` on the detail response (§4.2).

**Pattern:** Budget meter, category split, price-change alert.

### 3.8 Hub "Build your own" rows

**Now:** Name, place, days, budget, delete.

**Should show:** `৳12,400 of ৳15,000` with a thin meter, or `Over by ৳1,400` in error tone. Planned total is summed on the device from the segments already in the list response.

**Backend:** Yes. Confirm the list response includes `daySegments.estimatedCost` (it uses the same include as detail).

**Priority:** Last. Optional for this slice.

---

## 4. Backend work

All additive. No schema change, no migration, no Prisma CLI. The website gets extra fields it ignores.

### 4.1 One cost helper

In `tourBuilderService.ts`, split `applySegmentComponentCosts` into:

- `computeSegmentCostBreakdown(segments)`: one batched lookup for activities and hotels, returns per segment `{ activityCost, hotelCost, hotelRoomType, hotelName, total }`. Same pricing rules as today.
- `applySegmentComponentCosts` calls it and sets `estimatedCost = total`. Save behavior does not change.

### 4.2 Richer personal plan responses

For `GET /api/tour-builder/my/:id`, and the create/update responses that return the same shape:

- Each segment gains `activityCost`, `hotelCost`, `hotelRoomType`, `hotelName` (live values from 4.1). `estimatedCost` stays the saved value.
- The plan gains `budgetSummary`:

```ts
interface PlanBudgetSummary {
    budget: number;              // estimatedBudget ?? totalBudget
    plannedTotal: number;        // sum of saved estimatedCost (what checkout charges)
    livePlannedTotal: number;    // sum of live breakdown totals
    remaining: number;           // budget - plannedTotal (negative when over)
    isOverBudget: boolean;
    priceChanged: boolean;       // livePlannedTotal !== plannedTotal
    byCategory: { stays: number; activities: number };
    byDay: Array<{ dayNumber: number; total: number; stays: number; activities: number; stopCount: number }>;
    pricedFor: { travellers: 1; rooms: 1 };
    transportPriced: false;
}
```

Replace the per-segment `findUnique` in `enrichDaySegments` with batched `findMany` for the personal path. Leave the catalog path's output as it is, apart from the extra fields.

### 4.3 Quote route

`POST /api/tour-builder/my/quote`, authenticated, placed with the other `/my` writes.

- Body: `{ daySegments, budget? }`. Validator reuses the personal day-segment rules (day, order, ids, overnight hotel on last stop). No booking-link fields.
- Service runs `validateSegmentReferences` and 4.1 on a copy. Saves nothing.
- Response `data`: `{ stops: [{ dayNumber, segmentOrder, activityCost, hotelCost, hotelRoomType, hotelName, total }], plannedTotal, budget, remaining, isOverBudget, byCategory, byDay }`.
- Stops are keyed by `dayNumber` + `segmentOrder`, which is already unique per plan.
- Errors use the existing messages (`Invalid activity spots…`, `Hotel "X" has no priced room types`). Controller maps them to 400.

Files: `tourBuilderRoutes.ts`, `tourBuilderValidators.ts` (`quotePersonalTourPlanValidation`), `tourBuilderController.ts` (`quotePersonalTourPlan`), `tourBuilderService.ts` (`quotePersonalTourPlan`).

### 4.4 Backend test

Add `scripts/tests/test-trip-plan-budget-quote.ts`: quote matches the `estimatedCost` saved by a following create for the same segments; a resort hotel quote uses the resolved room, not the cheapest; over-budget quote returns `isOverBudget: true` and the create with the same body fails; detail `budgetSummary.plannedTotal` equals the trip booking `totalAmount`.

---

## 5. App work

### 5.1 Functional (before any UI)

- **Types** in `src/types/trips.ts`: `StopCostBreakdown`, `PlanBudgetSummary`, `PlanQuote`. Add `activityCost`, `hotelCost`, `hotelRoomType`, `hotelName` to the segment API type and `UserSegment`; add `budgetSummary?` to `TripPlan`.
- **Mapping** in `personalPlanMapping.ts`: map the new segment fields and `budgetSummary`. Fix `tripPlanToWizardStops` so edit loads `activityCost` and `hotelCost` from the breakdown, falling back to the old behavior only when the fields are missing.
- **Budget math** in a new `src/utils/tripBudget.ts` (pure, tested by `tsc` and reasoning only):
  - `budgetState(planned, budget) → { remaining, ratio, tone: 'ok' | 'warn' | 'over', overBy }`
  - `dailyAllowance(budget, days)`
  - `groupStopCostsByDay(stops)`, `categoryTotals(stops)`, `topCostStops(stops, n)`
  - `stopKey(dayNumber, segmentOrder)`
- **Service** `quotePersonalTourPlan(daySegments, budget)` in `src/services/api/tripPlanner.ts`, using `getApiInstance()` and the same segment body builder as save.
- **Hook** `usePlanQuote(stops, budget, enabled)` in `src/hooks/`:
  - Debounce 500 ms. Cancel the in-flight request when inputs change.
  - Re-quote only when pricing inputs change (day, order, `activitySpotId`, `hotelId`, `hotelOption`, budget), not on description or notes edits.
  - Until the quote returns, show the device estimate with an `Updating…` marker. If the quote fails, keep the estimate and label it `Estimate`.
  - Returns `{ quote, isQuoting, error, totals }` where `totals` is quote-first, estimate-fallback.
- `npx tsc --noEmit`.

### 5.2 Shared components (`src/components/tripPlanner/budget/`)

| Component | Purpose |
| --- | --- |
| `BudgetMeter` | Bar + headline + sub line. `accessibilityRole="progressbar"` with min/max/now. Tone also shown in words, never color alone. Over 100% fills the bar in error tone with an `Over` label. |
| `BudgetSummaryBar` | Sticky compact meter for the wizard. Pressable, opens the sheet. |
| `CostBreakdownSheet` | §3.6. Accepts a summary built from either a quote or `budgetSummary`. |
| `CategorySplitBar` | Stacked stays/activities bar with a legend. |
| `StopCostLines` | §3.2 line items. Used by wizard cards, editor, and detail timeline. |
| `OverBudgetBanner` | Message plus `Raise budget` and `See what costs the most`. |
| `PriceChangedNotice` | §3.7 item 4. |

Colors from `theme.ts` (`primary`, `warning`, `error`, dark variants). Money through `formatTaka` only.

### 5.3 Wizard integration (`TripPlanCreateWizard.tsx`, `StopEditorSheet.tsx`, `CatalogPickerModal.tsx`)

In order: details hint (§3.1) → sticky bar and day totals (§3.2 items 1–3) → stop card lines (item 4) → over-budget banner and clone case (items 5–6) → editor footer (§3.3) → picker header and tag (§3.4) → review card (§3.5). Remove the old `WIZARD_LIVE_TOTAL` line once the bar exists.

### 5.4 Detail integration (`TripPlanDetailView.tsx`)

Budget card, day totals, stop cost lines with hotel name, price-changed notice, glance sheet per-day fix (§3.7).

### 5.5 Hub row (optional)

§3.8.

### 5.6 Copy and locale

Every string through `TRANSLATION_KEYS` with `en.json` and `bn.json`. Keep money words consistent:

| Term | Meaning | Never call it |
| --- | --- | --- |
| Budget | The cap the traveler typed | total, price |
| Planned | Sum of stop costs (what checkout charges) | spent, budget |
| Left / Over by | Budget − planned | balance |
| Not priced | Transport | free, ৳0 |

---

## 6. Phases

| Phase | Repo | Work | Exit |
| --- | --- | --- | --- |
| 1 | Backend | §4.1–4.3 | Typecheck passes; website pages for personal plans still load. |
| 2 | Backend | §4.4 | Script passes against local API. |
| 3 | App | §5.1 | `npx tsc --noEmit`. |
| 4 | App | §5.2 | `npx tsc --noEmit`. |
| 5 | App | §5.3 | `npx tsc --noEmit`; device cases W1–W8. |
| 6 | App | §5.4 | `npx tsc --noEmit`; device cases D1–D4. |
| 7 | App | §5.5 + locale pass | `npx tsc --noEmit`; device cases H1, L1. |

Backend phases must land before app phases 3+ use the new fields. App code must still render when the fields are missing (older API), using the device estimate.

---

## 7. Not in this slice

- **Travellers and per-person pricing.** Pricing is 1 traveller and 1 room. Asking for a traveller count without changing server pricing would show wrong totals. Needs a backend pricing change and a decision on rooms per group.
- **Transport prices.** No price source on the segment today.
- **Real spending** (log expenses, receipts, categories, split between people). Needs a new model and migration.
- **Linked bookings' real prices** on a segment (`hotelRoomBookingId` etc.). Could later show "Booked ৳X" against planned.
- **Last-day hotel.** A hotel on the last day's last stop adds a night after the trip ends (end date is start + duration − 1). Leave as is; the breakdown shows night count per day so it is visible.
- Reordering the details questions, or any non-budget wizard change. (Superseded for the items listed in §8.)
- The website.

---

## 8. UI audit — wizard and plan view

Audit of the code as it stands after phases 1–7. Files: `TripPlanCreateWizard.tsx`, `StopEditorSheet.tsx`, `SelectedPlaceRow.tsx`, `CatalogPickerModal.tsx`, `TripPlanDetailView.tsx`, `trip-planner/[id].tsx`, `trip-planner/edit.tsx`, `budget/*`, `usePlanQuote.ts`.

Each item has an ID, a severity, where it is, what is wrong, the reference practice, and the fix. Severity: **Bug** (wrong data or broken flow), **Gap** (missing piece users expect), **Polish** (works, but inconsistent or unrefined).

References used:

- **Apple HIG / Material 3**: 44×44 pt minimum touch target; destructive actions confirm or offer undo; disabled controls look disabled; date pickers have an explicit Done.
- **Baymard / NN/g form guidelines**: inline validation next to the field instead of modal alerts; show why a primary button is blocked; never lose typed data on back.
- **Wanderlog, TripIt, Google Travel**: day tabs carry the date; trip dates and status are visible without opening a sheet; places in the itinerary are tappable; empty days have a clear call to action.
- **Airbnb, Booking.com**: price rows are label-left / amount-right; a sticky footer shows the total next to the primary action; a review step repeats what will be charged.

### 8.1 Bugs

| ID | Where | Problem | Fix |
| --- | --- | --- | --- |
| U-B1 | `TripPlanCreateWizard` `pricedStops` | Quote stop prices are applied even when the quote is stale (the hook only gates `totals` on the fingerprint). After changing a hotel, stop cards show the old quote while the bar shows the new estimate. | Expose `isFresh` (or `quoteStops` only when fingerprint matches) from `usePlanQuote`; use `applyQuoteToStops` from `tripBudget.ts` and drop the inline duplicate. |
| U-B2 | `pricedStops` keyed by `dayNumber:segmentOrder` | After reorder or delete, a stale quote maps prices onto the wrong stop until the next quote returns. | Same as U-B1: ignore stale quotes. Optionally send a client `stopId` in the quote body and echo it back. |
| U-B3 | Details step date picker (iOS) | `display="spinner"` is rendered inline and `showDate` is never set back to false on iOS, so the spinner can never be closed. No minimum date: past start dates are allowed. | Wrap in a bottom sheet with Done on iOS; set `minimumDate={today}`. |
| U-B4 | `trip-planner/[id].tsx` | Detail loads once on mount (`useEffect([tripId])`). Edit calls `goBack`, so the detail page shows pre-edit data. | Reload on focus (`useFocusEffect`) or pass the saved plan back; add pull-to-refresh. |
| U-B5 | Wizard edit mode, photos step | `initial.images` is ignored. Existing photos are not shown; picking new ones silently adds or replaces without the user seeing the current set. | Show existing images with remove buttons; new picks append up to the limit. |
| U-B6 | Stop editor footer | "This stop" and "left after this" use the picker's cheapest-room price, not the quote. For resort/luxury hotels the editor says "left" and the itinerary then says "over" (W6 contradiction). | Run `usePlanQuote` for the draft (single stop + others) or quote the draft on change; show `Updating…` like the bar. |
| U-B7 | Detail `StopCostLines` on an older API | When `activityCost`/`hotelCost` are missing, they default to 0: activity shows "Free" and the hotel line hides, while the stop total shows `estimatedCost`. Lines do not add up to the total. | When the split is missing, hide the per-line amounts and show only the stop total. |
| U-B8 | Detail day pills | Only days that have segments are listed. Days with no stops disappear, so a 5-day plan can show Day 1, 2, 4. | Render `1..duration`; empty days show an empty state. |
| U-B9 | Wizard Cancel / hardware back | Cancel on step 0 and Android back discard everything without asking. | Confirm discard when the form is dirty (`beforeRemove` listener + Cancel). |
| U-B10 | Wizard during template clone | Only a small spinner at the top; fields stay editable and get overwritten when the clone resolves. | Full-step skeleton or blocking overlay while `cloning`. |

### 8.2 Wizard gaps and polish

| ID | Sev | Where | Problem | Fix |
| --- | --- | --- | --- | --- |
| U-W1 | Gap | `goNext`, `savePlan` | All validation goes through `Alert.alert`. Continue looks enabled when blocked. | Inline error under the offending question; Continue shown disabled with a one-line reason above the footer. |
| U-W2 | Polish | Step tabs | Locked tabs look the same as reachable ones; no completed state. `1. Details` in a `flex-1` pill truncates in Bangla. | Stepper with done / current / locked states (check icon, muted locked); allow two-line labels or shorter labels. |
| U-W3 | Polish | Details step | Questions 5–7 are hidden until division and type are chosen, with no hint that more is coming. | Show them collapsed with "Answer 3 and 4 first" text instead of hiding. |
| U-W4 | Polish | Budget field | Raw digits while typing, then a second formatted line under it. | Format in place with a `৳` prefix and thousand separators; remove the duplicate line. |
| U-W5 | Polish | Itinerary rules card | Static paragraph always shown at the top, pushing stops below the fold on small phones. | Collapsible "How this works" row, collapsed after first view. |
| U-W6 | Gap | Missing days | Plain sentence `Missing: 2, 4`. | Mark the day pills themselves (dot or "needs a stop") and tap to jump. |
| U-W7 | Polish | Day pills | Active pill does not scroll into view; no dates. | `scrollTo` active pill; label `Day 2 · Oct 19 · ৳3,200`. |
| U-W8 | Gap | Empty day | Only the header `Day 2 · 0 stops · ৳0` and the dashed button. | Empty-state card with icon, one line of copy, and the Add stop button inside it; hide `· ৳0`. |
| U-W9 | Bug-ish | Stop card actions | Up arrow shown on the first stop and down on the last (no-ops). Icons are 20 px with `p-2` (~36 pt). Delete has no confirm or undo. | Hide or disable edge arrows; 44 pt targets; delete with an undo snackbar. Consider drag handles (`react-native-draggable-flatlist`) only if already a dependency. |
| U-W10 | Polish | Stop card | Whole card is the edit target but has no affordance (no chevron or "Edit"). Title `Stop 1` plus description repeats the spot name when the description was auto-filled from it. | Add chevron; title = spot name, subtitle = description when different. |
| U-W11 | Polish | Add stop | Button stays visible at the per-day limit and fires an alert. | Disable with `3 / 3 stops` helper text. |
| U-W12 | Polish | Review step cost summary | Rows are `Label amount` run together as text, left aligned. | Use the label-left / amount-right `Row` from `CostBreakdownSheet` (extract to `budget/CostRow.tsx`). |
| U-W13 | Gap | Review step | No start/end dates, location, type, or per-day outline; only a comma list of spot names. | Trip summary card (dates, place, type) and a compact day-by-day list, each with total and an Edit link back to that day. |
| U-W14 | Gap | Photos | Cannot remove or reorder a picked photo; picking again replaces the set; no upload progress. | Thumbnail grid with remove; first photo marked Cover; progress while uploading. |
| U-W15 | Polish | Footer | Save shows a spinner but the button does not look disabled; no total next to the action. | Disabled style while saving; on itinerary and review steps show `৳12,400 planned` beside Continue/Save (Airbnb pattern), and the sticky bar can then be slimmer. |
| U-W16 | Polish | Quote errors | A failed quote only shows `· Estimate`. | Small retry link in the bar when `error` is set. |
| U-W17 | Polish | Theming | Many `text-muted` without `dark:text-muted-dark` (itinerary reason, template card, review rows, photo hint). Template card uses `border-primary` with no dark variant. | Pass through the theme skill rules; use `text-muted dark:text-muted-dark` everywhere. |
| U-W18 | Polish | Icons | Wizard and detail use Feather; picker, editor, and `SelectedPlaceRow` use Ionicons. | Pick one set for the trip planner (Ionicons already covers bed, bicycle, map). |
| U-W19 | Polish | Success | Save navigates away with no confirmation. | Toast/snackbar "Trip saved" on the destination screen. |
| U-W20 | Polish | Stop editor | Footer shows "This stop" plus `StopCostLines` without a total, so the stop cost appears twice in different forms. Close (X) discards edits without asking. | Footer: one line (this stop + left after) and an expandable lines view; confirm discard when dirty. |

### 8.3 Plan view gaps and polish

| ID | Sev | Where | Problem | Fix |
| --- | --- | --- | --- | --- |
| U-D1 | Gap | Hero | No dates or status in the hero; the trip window is only inside the glance sheet. | Under the title: `Oct 18 – Oct 22 · 5 days` and a status chip (Planning / Booked). |
| U-D2 | Gap | "At a glance" sheet | Key facts are hidden behind a tap; the sheet repeats the budget card. | Replace with an inline facts row (dates, place, type, stops). Drop the sheet or keep it only for long extras (based-on package). |
| U-D3 | Polish | Glance → Travellers | Shows `participantCount` although all prices are for 1 traveller; reads like a group price. | Hide until per-person pricing exists, or label "Prices for 1 traveller". |
| U-D4 | Gap | Actions | Only a 40 px edit icon. No delete, share, or a clear primary action. | Header overflow menu (Edit, Delete); primary bottom CTA reserved for booking when the app gets trip checkout. |
| U-D5 | Polish | Price-changed notice | Says "Edit and save to update" without a button. | Inline `Update prices` action that opens edit (or saves directly when only prices changed). |
| U-D6 | Polish | Day pills | No dates; selected day not scrolled into view. | Same as U-W7. |
| U-D7 | Polish | Timeline card | Number circle and `Stop 1` badge say the same thing; four `Fact` rows with icons make each card tall. | Title = spot name; compact rows (activity, hotel) with thumbnails like the wizard's `WizardStopPlacePreview`; transport as a chip between cards (connector). |
| U-D8 | Gap | Places | Tour spot, activity, and hotel names are plain text. | Tappable rows opening the existing detail screens. |
| U-D9 | Gap | Images | No thumbnails per stop although the wizard shows them. | Return image URLs in `enrichDaySegments` (backend, additive) or reuse catalog lookups; show 40 px thumbnails. |
| U-D10 | Polish | Loading / error | Plain spinner; error text uses `text-muted` without dark; edit screen error has no back button. | Skeleton matching hero + cards; themed error with Retry and Back. |
| U-D11 | Polish | Budget card placement | Sits between chips and the glance row; with U-D2 it should follow the facts row. Biggest-cost tile hides when there is no priced stop, leaving one half-width tile. | Order: hero → facts → budget card → about → itinerary. Tiles full width when only one. |
| U-D12 | Polish | Accessibility | Timeline cards have no `accessibilityLabel`; the decorative number circles are read aloud. | Group each card with a label like `Day 2, stop 1, Lalbagh Fort, ৳500`; hide decorative views. |

### 8.4 Shared components

| ID | Sev | Problem | Fix |
| --- | --- | --- | --- |
| U-S1 | Polish | `CostBreakdownSheet` top-stops rows recompute `activityCost + hotelCost` instead of `stopTotal`, so legacy stops show ৳0. | Use `stopTotal`. |
| U-S2 | Polish | `CostBreakdownSheet` "By day" lists only priced days from the quote; empty days are missing. | Pass `duration` and render all days. |
| U-S3 | Polish | `OverBudgetBanner` "Raise budget to" uses the planned total, which may be the stale estimate (see U-B1). Raising to exactly planned lands in warn tone. | Use the fresh quote total; round up to the next ৳500. |
| U-S4 | Polish | Tinted backgrounds (`#FEF2F2`, `#FFFBEB`, rgba) are hard-coded in banners. | Add `error-soft` / `warning-soft` tokens to `theme.ts`. |

---

## 9. UI polish phases

| Phase | Work | Exit |
| --- | --- | --- |
| 8 | Bugs U-B1 … U-B10, U-S1, U-S2 | `npx tsc --noEmit`; re-run W5, W6, D1–D4; new cases U1–U4 below. |
| 9 | Wizard U-W1 … U-W20, U-S3 | `npx tsc --noEmit`; W1–W8 again; U5–U7. |
| 10 | Plan view U-D1 … U-D12 (U-D9 needs an additive backend field) | `npx tsc --noEmit`; D1–D4; U8–U9. |
| 11 | Theme tokens U-S4, icon set U-W18, theming U-W17, Bangla pass | L1, A1, dark-mode screenshots of each step. |

New device cases for these phases:

- **U1** Change a stop's hotel, then look at the card before the quote returns: card and bar agree (both estimate, or both quote).
- **U2** iOS: open the start-date picker, pick a date, tap Done; the picker closes. Yesterday cannot be chosen.
- **U3** Edit a plan, save, land on detail: the new values show without leaving the page.
- **U4** Fill the details step and press Cancel or Android back: a discard prompt appears.
- **U5** Press Continue with a missing field: the field shows the error inline; no alert.
- **U6** Delete a stop: it disappears with an Undo snackbar that restores it.
- **U7** Review step shows dates, place, per-day list, and right-aligned cost rows.
- **U8** Detail of a 5-day plan with an empty day 3 shows Day 3 with an empty state.
- **U9** Detail hero shows dates and status without opening any sheet.

---

## 10. Device QA round 1 (2026-10-17) — findings and fixes

Tested on an Android phone (dark mode) with plan "QA Plan" (Chattogram, 3 days, ৳20,000 budget, ৳9,200 planned). The first five issues were reported by Shahriar. The rest come from the same screenshots and a re-read of the code.

Where this section disagrees with §8, this section wins. Superseded: U-W3 (dimmed questions 5–7), U-W7 and U-D6 (date and price on the day chip), U-D2 (facts card), and the "About" block on the plan view.

### 10.1 Auto-scroll jumps while filling the wizard (blocker)

**What happens.** On the details step the screen scrolls up and down by itself while typing and after a field loses focus. The same happens with less force in the stop editor and on the itinerary step.

**Why.** Five things move the same scroll view, and they disagree:

| # | Source | Where | Effect |
| --- | --- | --- | --- |
| S1 | `KeyboardAvoidingView` around the scroll (iOS `padding`, offset `insets.top + 88`) | `TripPlanCreateWizard.tsx` ~L632 | Shrinks the view when the keyboard opens. |
| S2 | `KeyboardAwareScroll` focus-follow, plus a 200 ms poll that re-scrolls whenever the focused input changes | `ui/KeyboardAwareScroll.tsx` L256–266 | Correctly keeps the focused field above the keyboard. This is the one we keep. |
| S3 | The wizard's own `keyboardHeight` state added to `paddingBottom` (`scrollBottomPadding`) | wizard ~L266 | Counts the keyboard twice on Android (window already resizes) and three times on iOS (KAV + KAS + this). Content height changes on every show/hide, so the offset jumps. |
| S4 | `scrollToQuestion(n)` on `onSubmitEditing` and `onEndEditing` of name and budget, on every division/type/duration chip tap, on date pick, and in an effect when division+type unlock | wizard L195, 271, 660–830 | `onEndEditing` fires on blur. Tapping field B blurs field A, so A scrolls to "next question" while S2 scrolls to B. They fight. |
| S5 | Description focus: `scrollToQuestion(7)` then `scrollToEnd` after a timeout, plus a keyboard listener that calls `scrollToEnd` again | wizard L203–209, L276–285 | Two more scrolls racing S2. |

Two layout bugs make it worse:

- **Wrong targets.** Questions 5–7 were wrapped in a dimmed `View` in phase 9. `onLayout` gives `y` relative to that wrapper, not the scroll content, so `scrollToQuestion(5..7)` jumps near the top.
- **Footer height changes per keystroke.** The footer now shows the blocking reason (`detailsReason`) and the `৳X planned` line. The reason text changes as each field is filled, so the footer grows and shrinks while typing. The scroll view resizes and the content moves. The stop editor footer does the same with the keyboard open (screenshot 5: footer plus Save takes ~40% of the visible area).
- The "Choose a division and a tour type…" hint appears and disappears above question 5, shifting everything below it.

**Fix (one scroll owner):**

| ID | Change |
| --- | --- |
| Q-S1 | `KeyboardAwareScroll` is the only thing that scrolls for the keyboard. Use it with its own avoiding (`avoiding` default) and delete the outer `KeyboardAvoidingView`, the wizard's keyboard listeners, `keyboardHeight`, and `scrollBottomPadding` (fixed bottom padding only). |
| Q-S2 | Delete every automatic `scrollToQuestion` call: name/budget submit and end-editing, chip taps, date pick, the unlock effect, and `scrollDescriptionIntoView`. Keyboard "next" on name and budget moves focus to the next input with a ref (`focus()`), which lets Q-S1 scroll naturally. |
| Q-S3 | Keep one deliberate scroll: Continue with missing fields scrolls to the first invalid question. Measure with `measureLayout(scrollContentRef)` so wrappers do not break it. |
| Q-S4 | Footer has a fixed height. The blocking reason is not shown under the footer. Before Continue is tapped, Continue is visibly disabled and nothing else changes. After a tap, errors appear inline on the questions (already built). The `৳X planned` line only appears on steps 2–3, where it does not change while typing. |
| Q-S5 | Hide the wizard footer and the stop editor footer while the keyboard is open (`Keyboard` show/hide, or `useKeyboardVisible`). This is the standard pattern for long forms (Airbnb listing flow, Google Forms): the keyboard's own return key moves forward, and the footer comes back on dismiss. |
| Q-S6 | Questions 5–7 render normally (no wrapper, no hint). If division or type is missing, their chips are still tappable; validation on Continue covers it. Removes the layout shift and the wrong offsets. |
| Q-S7 | Itinerary step: remove the effect that scrolls the day chip row on `activeDay` change (screenshot 4 shows Day 1 scrolled out of view while Day 1 is selected). Scroll the chip row only when the user picks a day from the breakdown sheet or the review list, and only if the chip is off-screen. |
| Q-S8 | Stop editor: same rules. No programmatic scroll; `KeyboardAwareScroll` handles focus; footer hidden while typing. |

### 10.2 "Trip saved" banner never goes away

**Why.** `savedNotice` is seeded from the `saved=1` route param and only cleared by the X. The param stays in the URL, so a remount shows it again.

**Fix (Q-T1).** Replace the inline banner with a toast that slides in at the top, auto-dismisses after 3 s, and can be swiped or tapped away. On mount, read `saved`, show the toast, then `router.setParams({ saved: undefined })`. If the app already has a toast or snackbar helper, use it; otherwise add one small `Toast` component in `components/ui/` and reuse it for the wizard's "Stop removed · Undo".

### 10.3 Plan view — layout rework

Screenshots 1–3. Today the page repeats itself: the hero shows place and dates, chips show type and days, then a facts card shows dates, place, and type again. The day chips carry date and money, so Day 3 is cut off.

Target order, top to bottom:

1. **Hero:** location, name, `Oct 20 – Oct 22, 2026`. Back and menu (⋯) buttons on the image.
2. **Chip row:** type · `3 days` · `3 stops` · status. The menu button moves to the hero, so the row has room.
3. **Budget card** (unchanged content). The footnote `Prices are for 1 traveller and 1 room.` moves inside this card under the meter. The separate facts card is removed.
4. **About This Tour — removed** (Q-D1). The description is still visible in edit, and the hub row already shows it.
5. **Itinerary header:** `Day-by-day itinerary` · `3 days · 3 stops`.
6. **Day chips: `Day 1`, `Day 2`, `Day 3` only** (Q-D2). No date, no price. Chips are 44 pt tall, fixed min width, so a 7-day plan scrolls cleanly. Empty days get a small dot, not text.
7. **Day summary card** directly under the chips (Q-D3):
   - Line 1 (title, 18 pt bold): `Day 1 · Tue, Oct 20`
   - Line 2 (16 pt): `1 stop · ৳2,600` (pluralized correctly), right side `Details ›` button.
   - If the day is above the daily guide, a muted line `Above ৳6,667/day guide`.
8. **Stop cards** for that day, with larger type (Q-D4): stop title 18 pt bold, description 15 pt, place rows 15 pt with 48 px thumbnails, cost rows 15 pt and the stop total 17 pt bold. Label `Activity` (not `Activity (optional)`, which is wizard copy leaking into the read-only view).

**Day details sheet (Q-D5)**, opened from `Details ›`. A full-height bottom sheet, like Wanderlog's day view and Booking.com's price breakdown:

- Header: `Day 1 · Tue, Oct 20, 2026`, close button.
- Summary row: stops, day total, share of budget (`28% of budget`), daily guide comparison.
- For each stop, in order, a numbered section:
  - Title (tour spot), description, notes (the stop's `customNotes`, shown only here and in edit).
  - Place rows (spot, activity, hotel) with thumbnails, tappable to their detail pages.
  - Transport line `Self managed · not priced`.
  - Cost lines and stop total.
- Footer: day total; `Edit this day` button that opens the wizard on the itinerary step with that day selected (pass `day` param to edit).

**Other plan view fixes:**

| ID | Fix |
| --- | --- |
| Q-D6 | Stop cards show notes only in the sheet; card stays scannable. |
| Q-D7 | Pull-to-refresh spinner shows on top of the hero; use `progressViewOffset` so it is visible on Android. |
| Q-D8 | Menu (⋯) sheet: Edit trip, Delete trip, Cancel. Delete is red and confirms (already built). |
| Q-D9 | Typography scale for the trip planner, used by wizard and plan view: page title 28, section title 20, card title 18, body 15–16, meta 13, caption 12. Nothing below 12. Add as constants in `theme.typography` or a small `tripType` map, not ad hoc classes. |

### 10.4 Wizard — issues seen in screenshots 4–5

| ID | Problem | Fix |
| --- | --- | --- |
| Q-W1 | Stop editor labels read `Activity (optional) (optional)`. The locale string already says "(optional)" and `SelectedPlaceRow` appends it again. | Locale string becomes `Activity`; `SelectedPlaceRow` keeps adding `(optional)`. Same check for the hotel label. |
| Q-W2 | Adding Stop 2 on Day 1 shows `This stop ৳1,800` while every place row is empty. The quote runs `applyOvernightHotelToLastStop`, which moves Stop 1's hotel onto the new last stop, so the new stop is charged for a hotel the editor does not show. | Make the move visible. When the stop being edited is the last of its day and an earlier stop has the hotel, the hotel row shows that hotel with `Moved from Stop 1 · overnight stay is on the last stop` and a Remove action. Prefill `hotelId/hotelName/hotelCost/hotelImageUrl` on the draft from the source stop, so the editor, the card, and the save all agree. |
| Q-W3 | Itinerary header `Day 1 · 1 stops · ৳2,600 · Oct 20, 2026` is long, ungrammatical, and repeats the chip. | Same pattern as the plan view: chips show `Day N` only, and a day summary card below shows `Day 1 · Tue, Oct 20` and `1 stop · ৳2,600`. Use i18next plurals (`_one` / `_other`). |
| Q-W4 | "How this itinerary works" is open again on every edit. The "seen" flag is a module variable that resets on reload. | Store `tripPlanner.rulesSeen` in AsyncStorage; collapsed after the first view. |
| Q-W5 | Step tab `3. Photos` looks disabled even when it is the next step. | Three states: done (check), current (filled), upcoming (outline, full opacity). Only truly blocked steps are dimmed, with the reason in the footer when tapped. |
| Q-W6 | Undo bar is a dark block inside the list. | Use the shared toast from Q-T1, bottom-anchored above the footer, 4 s. |
| Q-W7 | Wizard stop card text is small and dense next to the plan view. | Same type scale as Q-D9 and the same stop card layout (shared `StopCard` component used by both screens, with an `editable` prop that shows the chevron, move, and delete). |

### 10.5 Shared components to extract

Doing this once removes most of the drift between the wizard and the plan view.

- `tripPlanner/DayChips.tsx`: `Day N` chips, empty dot, scroll-into-view helper.
- `tripPlanner/DaySummaryCard.tsx`: date, stop count, day total, guide warning, `Details ›`.
- `tripPlanner/StopCard.tsx`: title, description, place rows, transport, cost lines; `editable` and `showNotes` props.
- `tripPlanner/DayDetailsSheet.tsx`: §10.3 sheet; used on the plan view, and optionally from the wizard's day card.
- `ui/Toast.tsx`: saved notice, undo, quote retry.

### 10.6 Phases

| Phase | Work | Exit |
| --- | --- | --- |
| 12 | Scroll fixes Q-S1 … Q-S8 | Q1–Q4 pass on Android and iOS. No other change in this phase, so scroll can be verified alone. |
| 13 | Saved toast Q-T1, labels Q-W1, overnight hotel Q-W2, rules Q-W4 | Q5–Q7. |
| 14 | Shared components §10.5, plan view rework Q-D1 … Q-D9 | Q8–Q11, D1–D4 again. |
| 15 | Wizard parity Q-W3, Q-W5 … Q-W7, typography pass, Bangla plurals | Q12, L1, W1–W8 again, dark and light screenshots of every step. |

### 10.7 Device cases

- **Q1** Fill the details step top to bottom using only the keyboard's next/done keys. The screen never moves except to keep the focused field above the keyboard.
- **Q2** Tap fields out of order (description, then name, then budget). No jump to another question.
- **Q3** Leave the description field and tap a duration chip. No scroll.
- **Q4** Press Continue with the name empty after scrolling to the bottom. The view scrolls once to question 1 and shows the inline error.
- **Q5** Save a trip. "Trip saved" shows, then disappears within 3 s. Leaving and returning does not show it again.
- **Q6** Stop editor labels read `Activity (optional)` once.
- **Q7** Add Stop 2 to a day whose Stop 1 has a hotel. The editor shows the hotel as moved to this stop; "This stop" matches the rows shown.
- **Q8** Plan view has no "About This Tour" block and no separate facts card.
- **Q9** Day chips read `Day 1`, `Day 2`, `Day 3`; all three fit or scroll without clipping text.
- **Q10** The card under the chips shows the date and the day total in larger type; switching days updates it.
- **Q11** `Details ›` opens a sheet with every stop of that day: description, notes, places, transport, cost lines, and the day total. `Edit this day` opens the wizard on that day.
- **Q12** Wizard itinerary uses the same chips and day card as the plan view; header grammar reads `1 stop` / `2 stops`.

