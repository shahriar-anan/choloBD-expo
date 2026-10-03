# Trip plan hub

**Folder:** `trip-plan-hub` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

**Status:** Implemented in the app. `npx tsc --noEmit` passed. Device cases in tests.md are not run yet.

The trip planner index is a saved-plans list with a plus button. Catalog packages live in a separate Explore tour list, and again as a picker inside step 1 of the create wizard. A traveler should land on one Trip plans screen and switch between building their own plan and browsing published templates. Those two stay separate lists. They are different products, and the APIs already treat them that way.

GoZayaan uses the same split: a published tour catalog, and a separate path when the traveler wants their own plan. This folder copies the Attractions hub chrome (`explore/attractions.tsx`), not GoZayaan’s “request a custom tour” form. The existing three-step wizard stays the builder.

## What the traveler sees

```
← Trip plans
Search divisions
[ Build your own ]  [ Ready-made trips ]

— list for the selected tab —
```

Default tab is **Build your own** when the route has no `tab`. Home’s featured-holidays “see all” and Explore’s browse-tours card open **Ready-made trips**.

The division search stays when the tab changes. Tour-type chips exist only on Ready-made trips and clear when that tab is left.

| Tab | What it lists | Card leads with | Tap |
| --- | --- | --- | --- |
| Build your own | The signed-in traveler’s personal plans | Name, place, days, budget, delete | Open the saved plan. A blank-plan action opens the wizard. |
| Ready-made trips | Active catalog packages | Photo, name, place, tour type, days, price | Open the package detail. |

The wizard is not a third view inside the tab. It stays on `trip-planner/create`.

## Two products the server already separates

Both rows are `TourPackage`. `kind` decides which list they belong to.

| | Build your own | Ready-made trips |
| --- | --- | --- |
| `kind` | `PERSONAL` | `CATALOG` |
| Who writes it | The signed-in traveler | `SERVICE_ADMIN` or `MASTER_ADMIN` via `POST /api/tour-builder` |
| Owner | `ownerUserId` | `createdByUserId` |
| List | `GET /api/tour-builder/my` | `GET /api/tour-builder` |
| Detail | `GET /api/tour-builder/my/:id` | `GET /api/tour-builder/:id` |
| In the public list | No. Personal rows are `isActive: false` and `kind` is not `CATALOG`. | Yes, when `isActive` is true. |
| Paying | Later, `TripBooking` + `TRIP_PACKAGE` on the personal plan. Out of this folder. | `PackageBooking` + `PACKAGE_BOOKING` from the existing Book button. |

There is no query that returns only packages whose creator role is `MASTER_ADMIN`. The public list is every active catalog package, including ones a service admin published. Seeded rows follow `ConfigService.applySeededListFilter("tourPackages")`. The app does not send a seed flag and does not filter by creator role.

Starting from a template does not buy it. `POST /api/tour-builder/my` with `basedOnPackageId` copies the catalog days onto a new personal plan and stores the link. The source package must be `kind: CATALOG` and `isActive`. The server rejects anything else with “Personal plans can only be derived from active catalog packages”.

## Backend the app already has

Responses use `{ status, message, data }`. List `data` is `{ results, total, page, limit }`.

Catalog default page size is 20, maximum 100 (`resolvePagination`). Personal list defaults to 10 when `limit` is omitted, and the validator rejects `limit` above 50. The hub sends `limit=20` on both.

Neither list accepts a package-name search. Do not send `name`, `q`, or `search`.

### Ready-made trips — `GET /api/tour-builder`

Public. No auth. Controller reads `locationId`, `divisionId`, `tourType`, `tourSpotId`, `isPopular`, `minBudget` / `maxBudget`, `page`, `limit`. `isActive` in the query is ignored; the service forces `isActive: true` and `kind: CATALOG`.

`locationId` is an exact match. `divisionId` matches that location or any child (`parentLocationId`). Sending `locationId` wins and `divisionId` is ignored (`locationOrDivisionWhere`).

`tourType` is one of `ADVENTURE`, `CULTURAL`, `BEACH`, `CITY_TOUR`, `NATURE`, `RELIGIOUS`, `HISTORICAL`, `MIXED`.

Sort is `isPopular` desc, then `rating` desc, then `packageName` asc.

Detail: `GET /api/tour-builder/:tourPackageId`. Returns the package, images, location, and day segments enriched with spot names. A personal id 404s here.

### Build your own — `GET /api/tour-builder/my`

Auth: `authenticateSessionOrToken`. Missing user is 403 with a message that includes `Unauthorized`.

Query: `status`, `locationId` (exact only — no `divisionId`), `page`, `limit`. `status` is `PLANNING`, `SAVED`, `BOOKED`, `IN_PROGRESS`, `COMPLETED`, or `CANCELLED`. The hub does not send `status`.

The traveler’s plans are stored with the wizard’s division id on `locationId`. Filter this tab with that same id.

Create stays `POST /api/tour-builder/my`. When the body includes both `daySegments` and `basedOnPackageId`, the server keeps the traveler’s segments and still links `basedOnPackageId`. The wizard already sends both after a clone. Leave that save path as it is.

### Clone

`GET /api/tour-builder/:id` loads the template. The wizard maps `daySegments` with `catalogSegmentsToWizardStops` and saves with `basedOnPackageId`. The traveler still picks a start date in the wizard; catalog packages have `duration`, not calendar dates.

## What the app has today

- `src/app/(tabs)/trip-planner/index.tsx` lists personal plans from `useTripPlannerLogic` → `GET /api/tour-builder/my`, with create and delete. No tabs, no division search, no catalog.
- `src/components/tripPlanner/TripPlanCreateWizard.tsx` loads up to 100 catalog rows on create and pages them 4 at a time inside step 1. Choosing one calls `GET /api/tour-builder/:id` and fills the form.
- `src/services/api/tourBuilder.ts` `getTourPlans` unwraps `results` and drops `total`, `page`, and `limit`. Home (`useFetchTourPackages`) depends on that array return.
- `src/services/api/tripPlanner.ts` `getTrips` already returns `{ trips, pagination }` and accepts `locationId`, `page`, `limit`.
- Catalog detail with Book is `src/app/(tabs)/explore/tour-detail.tsx` (`PackageBooking`). A second copy is `src/app/tour-package-detail.tsx`, opened by home package cards. Neither offers “use this as my plan”.
- Traveler browse entry points still open `/(tabs)/explore/tour-list`: Explore browse-tours, `TourPackagesSection` see all, `HomeDealsSection` holidays chip, `QuickBookingWidget` tours, home `handleNavigate` item `tours`.
- Admin create and “my tours” stay on `explore/tour-create` and `explore/my-tours`. `AdminExploreInterface` opens `tour-list` to manage packages. Leave those admin routes.

Wizard location choices are divisions (`locationType === 'DIVISION'`). Attractions search is districts. This hub searches divisions, because personal plans and the wizard store a division id. A district id would miss those rows.

## Functional

Screens do not call Axios. Hooks call services. Services use `getApiInstance()`. On failure, surface `response.data.message`.

1. **Catalog page object.** Add a paged catalog fetch that returns `{ results, total, page, limit }` for `GET /api/tour-builder`. Query: `divisionId`, `tourType`, `page`, `limit`. Leave `getTourPlans` returning `TourPackage[]` so the home feed does not break.
2. **Personal page object.** `getTrips` already paginates. The hub hook passes `locationId` (the picked division) and `limit: 20`. Do not add a new Redux slice. The existing trip slice can keep serving plan detail.
3. **Hub hook.** One hook, or two thin wrappers around `usePagedCatalog`, enabled only for the open tab. Same shape Attractions uses: `items`, `total`, `isLoading`, `error`, `hasMore`, `loadMore`, `refresh`.

No payment changes. No new booking call.

### Exit

`npx tsc --noEmit` from `choloBD-expo`.

## UI

Only after the functional exit.

### Hub

Rewrite `src/app/(tabs)/trip-planner/index.tsx`. Keep the route. `trip-planner/list.tsx` already redirects here.

- Title **Trip plans**. Back: if `fromHome=true`, `router.replace('/(tabs)')`; otherwise `router.back()`.
- Division search matches Attractions: typeahead over `useFetchLocations` rows with `locationType === 'DIVISION'`. Picking one stores its id. Clearing it lists every division’s rows again.
- Segmented control, equal width, same selected treatment as Attractions. Query `tab` is `mine` (default) or `templates`.
- Changing tabs keeps the division and clears `tourType`.
- Each tab: loading, empty, error with retry, result count from `total`, load more when `page * limit < total`.

**Build your own**

- Signed out: sign-in prompt to `/(auth)/login`. Do not call `/my`.
- Signed in: a primary **Start a blank plan** action → `/(tabs)/trip-planner/create` with no `templateId`.
- Then the saved plans. Keep the current row: image when present, name, short description, location, duration, budget, open, delete confirm. Full width. Delete stays `deleteTrip` from `useTripPlannerLogic`.
- Empty copy points at the blank-plan action.
- Open still goes to `/(tabs)/trip-planner/:id`.

**Ready-made trips**

- Public. Loads with or without a session.
- Tour-type chips under the tabs. Tapping the selected chip clears it.
- Two-column photo cards: image, `packageName`, `location.name`, tour type, duration, `totalBudget`. Tap opens `/(tabs)/explore/tour-detail` with `id`.
- No edit, delete, or inactive badge. The list is already active catalog rows.

### Wizard

On `TripPlanCreateWizard`, remove the catalog list, its paging, and the `GET /api/tour-builder?limit=100` effect from create step 1.

`trip-planner/create.tsx` reads `templateId`. When it is set, the wizard loads `GET /api/tour-builder/:templateId` once and runs the existing prefill (`catalogSegmentsToWizardStops`, `basedOnPackageId`). Save still posts the filled segments plus `basedOnPackageId`. A failed load shows the server message and leaves a blank form. Edit mode does not load a template.

### Package detail

On both `explore/tour-detail.tsx` and `tour-package-detail.tsx`, keep **Book this tour** (`PackageBooking`). Add **Use as my plan**:

- Signed in: `/(tabs)/trip-planner/create?templateId=<id>`.
- Signed out: `/(auth)/login`. Do not post a personal plan.

Admin edit on `tour-detail` stays. This folder does not add edit actions to the hub grid.

### Entry points

| From | To |
| --- | --- |
| `QuickActionGrid` plan-trip | `/(tabs)/trip-planner?tab=mine&fromHome=true` |
| Dashboard trip planner card, `HomeCommunityRow`, `TransportTypeSelector` | `/(tabs)/trip-planner?tab=mine` |
| `ExploreInterface` / `UserExploreInterface` browse tours | `/(tabs)/trip-planner?tab=templates` |
| `ExploreInterface` create trip plan | `/(tabs)/trip-planner?tab=mine` |
| `TourPackagesSection` see all, `HomeDealsSection` holidays chip, `QuickBookingWidget` tours, home `tours` navigate | `/(tabs)/trip-planner?tab=templates&fromHome=true` |
| A single home package card | Stays on `tour-package-detail` (now with both actions). |
| `AdminExploreInterface` tour list, tour create, my tours | Unchanged. |

`explore/tour-list.tsx` stays for operators. Traveler browse no longer opens it.

Strings go through `TRANSLATION_KEYS` plus `src/locales/en.json` and `src/locales/bn.json`. Tabs read **Build your own** and **Ready-made trips**. Colors come from `src/constants/theme.ts`.

### Exit

Device cases in [tests.md](tests.md). A person runs them. Do not start Expo from the agent.
