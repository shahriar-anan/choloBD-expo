# Tests — increment 01 (trip plan)

Shared agent baseline: [_shared/global-rules.md](../_shared/global-rules.md).

## Agent checks

```bash
cd choloBD-expo
npx tsc --noEmit
npm run check:api-paths
```

`check:api-paths` scans `src/services/api/` and `src/store/` and fails if any of these appear:

- `/api/trip-plans`
- `/tour-builder/by-admin/`
- `/activity-spots/location/`
- `/tour-spots/location/`
- `/api/v1/hotels/my-hotel`
- `/auth/oauth/callback`
- `/auth/oauth/validate`

## Device cases

Traveler JWT. Backend with current `/api/tour-builder/my` routes.

### D-01 Create a multi-day plan

- Setup: a location with at least one tour spot and one activity spot.
- Steps: open the wizard. Enter a name, description, and tour type. Set a start date and duration of 3. Put at least one stop on each day. Set a short description of at least 2 characters on each stop. Review and save.
- Expected: `POST /api/tour-builder/my` with `startDate`, `endDate` after `startDate`, `packageName`, `tourType`, `locationId`, and `daySegments` covering days 1, 2, and 3. No `/api/trip-plans`. The app opens the new plan. List reload uses `GET /api/tour-builder/my`.

### D-01b One-day plan

- Steps: duration 1, one stop, save.
- Expected: the request succeeds. The itinerary is one day. The server does not return “End date must be after start date”.

### D-01c Itinerary constraints

- Steps: try to continue with an empty day. Try to add a fifth stop on one day. Put an overnight hotel on a stop that is not last, then add another stop after it.
- Expected: continue stays blocked until every day has a stop. The fifth stop is refused in the UI. The overnight hotel ends on the last stop of that day, and the UI says it moved.

### D-01d Edit and delete stops

- Steps: on the plan detail day screen, edit a stop’s description, delete a stop, add a stop on a day that had none, delete the plan from the list.
- Expected: each stop change is `PUT /api/tour-builder/my/:id` with the full `daySegments` array. Plan delete is `DELETE /api/tour-builder/my/:id`. No `/segments` URL. Days shown match the plan duration even when a day has no stops yet.

### D-01e Catalog clone

- Steps: start from a catalog package, confirm stops prefilled, clear the selection, confirm the draft resets, then save a plan that still sends `basedOnPackageId` when a catalog package stays selected.
- Expected: create body includes `basedOnPackageId` only when a catalog package is selected. Update does not send `basedOnPackageId`.

### D-01f Spot filter

- Steps: change location and open the spot picker.
- Expected: `GET /api/tour-spots?locationId=` and `GET /api/activity-spots?locationId=`. Not `/location/:id`.

### D-01g Child screens do not offer dead actions

- Steps: open Hotels and Transport on a saved plan. Look for checkout.
- Expected: hotel and transport choices already stored on stops are visible. There is no “link booking” or “book transport” control. There is no checkout button.

### D-01h Copy and theme

- Steps: create, hit a validation block, delete a plan, switch the app to Bengali if the locale toggle exists.
- Expected: those messages come from the translation catalogs. No debug logs are required to understand the screen. Tab labels remain readable on a narrow phone.

### D-00b Social login stays blocked

- Steps: open login and register.
- Expected: Google and Facebook stay disabled and do not call the OAuth callback.
