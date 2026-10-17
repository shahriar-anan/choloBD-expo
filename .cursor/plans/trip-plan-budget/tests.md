# Tests — Trip plan budget

## Agent checks

Backend, from `ExpressJS-choloBD-backend/nodeapp`: typecheck, then run `scripts/tests/test-trip-plan-budget-quote.ts`.

Confirm:

- Quote for a set of segments equals the `estimatedCost` values saved by a create with the same segments.
- A resort or luxury hotel quote uses the resolved room, not the cheapest room.
- Over-budget quote returns `isOverBudget: true`; the matching create fails with the existing budget message.
- `budgetSummary.plannedTotal` equals the `totalAmount` of a trip booking created right after.
- Personal plan GET still returns every field it returned before (website safe).
- No Prisma CLI was run.

App, from `choloBD-expo`: `npx tsc --noEmit` after each phase.

Confirm:

- Editing a saved plan loads activity and hotel costs separately (no full cost in `hotelCost`).
- The quote hook does not fire on description or notes edits.
- With the new fields removed from a mocked response, the wizard and detail page still render using the device estimate.

## Device cases

A person runs these. The agent does not launch Expo.

### W1 Budget hint
Set budget 15,000, duration 5, a start date. Under the budget answer: about ৳3,000 per day for 5 days.

### W2 Sticky bar
Add stops on two days. The bar stays visible while scrolling and shows left, planned of budget, and the meter. Tone changes at 80% and 100%.

### W3 Day totals
Day pills show each day's total. Empty days still say empty. The day header shows stop count and total.

### W4 Stop lines
A stop with an activity and hotel shows both lines, the room type, per night, and the stop total. A free activity shows Free. Transport shows Not priced.

### W5 Resort price matches save
Pick a resort hotel. The stop total after the quote matches the cost shown on the detail page after saving.

### W6 Editor preview
In the stop editor, changing the activity updates "This stop" and "left after this". Saving while over budget works and the itinerary shows the banner.

### W7 Over budget fix
Go over budget. Continue is blocked. Raise budget to ৳X sets the budget and unblocks. See what costs the most opens the sheet sorted by cost.

### W8 Template clone
Use a ready-made trip whose stops cost more than its price. The itinerary opens with the banner explaining the starting budget.

### D1 Detail budget card
Saved plan shows the meter, left or over, per-day planned, biggest cost, and View breakdown.

### D2 Breakdown sheet
Category bar and rows, transport Not priced, one row per day, top three stops. Tapping a day selects it.

### D3 Hotel name
Detail stop cards show the hotel's name, not only its type.

### D4 Price changed
Change an activity's entry cost on the backend after saving. Detail shows the price-changed notice with the new total and the difference.

### H1 Hub row
Build your own rows show planned of budget with a meter, or Over by in error tone.

### L1 Bangla
Switch to Bangla. Every budget string is translated, and amounts still format with `formatTaka`.

### A1 Accessibility
Screen reader reads the meter as a progress value with left or over in words.
