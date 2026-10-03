# Tests — Trip plan hub

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Run once when the paged catalog fetch and hub hook compile, and again after the screens exist.

Confirm:

- `getTourPlans` still returns an array. `useFetchTourPackages` is unchanged.
- The create wizard no longer requests `GET /api/tour-builder` with `limit=100`.
- Traveler browse routes in the plan’s entry table point at `/(tabs)/trip-planner` with `tab=templates` or `tab=mine`.
- `AdminExploreInterface` still opens `/(tabs)/explore/tour-list`.
- The hub does not send `name`, `q`, `search`, or `isActive` on either list.

## Device cases

A person runs these. The agent does not launch Expo.

### D-T1 Open Trip plans from the home tile

- Tap Plan trip.
- Expected: Trip plans hub, Build your own selected.
- Signed in with saved plans: those plans are listed, with delete.
- Signed out: a sign-in prompt, and no request to `/api/tour-builder/my`.
- Back with `fromHome=true` returns to the home tab.

### D-T2 Switch tabs and keep the division

- Open Ready-made trips. Catalog cards show a photo when the package has one, a name, a place, a tour type, days, and a price.
- Pick a division. Both tabs use that division after switching back to Build your own.
- On Ready-made trips, turn on one tour-type chip, then switch to Build your own and back. The chip is cleared.
- Clearing the division lists packages and plans again without a location filter.
- An empty tab shows the empty state, not a spinner that never ends.

### D-T3 Blank plan

- From Build your own, start a blank plan.
- Expected: the create wizard, with no catalog picker at the top of step 1.
- Saving still opens `/(tabs)/trip-planner/:id`.

### D-T4 Template detail, book, and clone

- Open a ready-made card.
- Expected: existing package detail, itinerary, and **Book this tour**.
- **Use as my plan** while signed in opens the wizard with the template’s name, division, duration, budget, and stops filled, and no catalog list.
- Saving that wizard creates a personal plan (`POST /api/tour-builder/my`) and does not open package payment.
- **Book this tour** still opens the existing package booking flow and does not open the wizard.
- Signed out, **Use as my plan** goes to login and does not post.

### D-T5 Entry points

- Featured holidays “see all”, the holidays chip, and Explore’s browse-tours card open Ready-made trips.
- A single holiday card still opens package detail, and that screen has both Book and Use as my plan.
- Admin explore still opens the operator tour list, not this hub.
