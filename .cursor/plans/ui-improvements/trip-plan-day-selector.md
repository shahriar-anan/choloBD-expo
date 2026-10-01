# Trip plan detail — day selector

Status: Implemented (awaiting manual QA).

Screen: personal trip detail, `src/app/(tabs)/trip-planner/[id].tsx`, rendered by `src/components/tripPlanner/TripPlanDetailView.tsx`.

## What changes

The trip summary stays at the top. A horizontal day bar sits in the middle, after that summary. Tapping a day shows only that day’s stops underneath the bar.

Previously the bar was pinned above the cover, and a tap only scrolled to that day. Every day was drawn in one long list, and scrolling the list moved the selected chip.

## Layout

One vertical scroll, in this order:

1. Cover, title, type, duration chips, stat tiles, and About. Unchanged.
2. Horizontal day bar. This is the new middle section.
3. Stops for the selected day only.
4. The existing glance card (budget, dates, Edit, Back). Unchanged, and still below the selected day.

The bar is inside the scroll, after About and before the stops. It is not pinned to the top of the screen.

## Day bar

- One chip per day that has segments, in day-number order. The label stays `tripPlanner.dayPlanDay` (“Day N”). The stop count already on the chip can stay.
- The first day is selected when the screen opens.
- The selected chip uses the current selected style. Unselected chips stay as they are.
- If the days do not fit, the bar scrolls horizontally. The page does not.
- A trip with one day still shows that one chip, and its stops appear under it.
- A trip with no segments shows the existing empty itinerary line and no bar.

## Selected day

- Render the stop cards for the selected day only. Keep the stop order, timeline, and fact rows (spot, activity, transport, hotel on the last stop).
- Keep the day heading above those stops.
- Switching days replaces the stops. It does not scroll to another block further down the page.
- Itinerary title and the existing hint stay above the stops.

## Remove

These existed only to scroll between days that are all on the page:

- `scrollRef`
- `itineraryOffset`, `dayLocalOffsets`, `dayOffsets`
- `scrollToDay`
- `publishDayOffsets`
- the `onScroll` handler that updates the selected day
- the `onLayout` handlers on the itinerary and each day
- the `dayEntries.map` that renders every day at once

`activeDay` stays. It chooses which day’s segments to render. Default remains the first day number.

## Out of scope

- Trip list, create wizard, and edit wizard.
- Cover, stats, About, glance card, Edit, and Back.
- Copy, colors, and stop-card layout, except moving the bar and showing one day.
- Other screens from the UI audit.

## Check

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Do not start the emulator. Device checks below are manual.

## Manual checks

1. Open a trip with three or more days. The summary is on top. The day bar is under About, not stuck to the top. Only the first day’s stops are visible.
2. Tap a later day. That day’s stops replace the previous ones. The summary does not jump away.
3. Swipe the day bar sideways when there are more days than fit. The rest of the page stays still.
4. Open a one-day trip. One chip, and that day’s stops under it.
5. Open a trip with no stops. The empty itinerary line is still there, and there is no day bar.
6. Edit and Back on the glance card still work after a day switch.
