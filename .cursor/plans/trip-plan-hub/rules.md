# Rules — Trip plan hub

This folder is the whole spec for the Trip plans screen. Follow it on its own.

## Layers

Functional first: `src/services/api/`, `src/hooks/`. Then UI: `src/app/(tabs)/trip-planner/`, `src/components/tripPlanner/TripPlanCreateWizard.tsx`, the two package detail screens, entry-point routes, `src/constants/translationKeys.ts`, `src/locales/en.json`, `src/locales/bn.json`.

Screens do not import Axios or build hosts. They call hooks. Hooks call services. Services use `getApiInstance()` from `src/services/api/axiosClient.ts`.

Unwrap `response.data.data`. Show `response.data.message` when a call fails.

## Lists

| Tab | Path | Auth | Query this hub sends |
| --- | --- | --- | --- |
| Build your own | `GET /api/tour-builder/my` | Bearer or session | `locationId` of the picked division, `page`, `limit=20` |
| Ready-made trips | `GET /api/tour-builder` | None | `divisionId` of the picked division, `tourType` when a chip is on, `page`, `limit=20` |

List payload is `data.results` plus `data.total`, `data.page`, `data.limit`.

Send `divisionId` on the catalog call so a package stored on that division or on a child district still matches. Send `locationId` on the personal call. Personal plans saved by the wizard store the division id, and `/my` has no `divisionId` filter.

Do not send `locationId` and `divisionId` on the same catalog request. `locationId` wins on the server and drops the child match.

Do not send `name`, `q`, `search`, `isActive`, or a creator-role flag. Catalog search text only filters the division typeahead on the device. The server has no package-name filter. `isActive: true` and `kind: CATALOG` are already forced. Personal rows never appear in that list.

`tourType` chips send one enum value. Clearing the chip omits the param. Do not send `status` on `/my`.

`getTourPlans` in `src/services/api/tourBuilder.ts` keeps returning `TourPackage[]`. Home `useFetchTourPackages` depends on that. Add a separate paged function for the hub.

## Clone and book

These stay different calls.

- **Use as my plan** opens `/(tabs)/trip-planner/create?templateId=`. The wizard loads `GET /api/tour-builder/:templateId`, prefills with `catalogSegmentsToWizardStops`, and saves through the existing personal create, including `basedOnPackageId`.
- **Book this tour** stays the current package-booking route. Do not create a personal plan when the traveler books.
- **Start a blank plan** opens create with no `templateId`.

The create wizard must not fetch `GET /api/tour-builder?limit=100` or render the catalog picker. That list is the Ready-made tab.

A template id that is missing, personal, or inactive fails on save with the server message. Show that message. Do not retry by posting a different id.

## Auth

Ready-made trips load with no session.

Build your own and Use as my plan need a session. Signed out, show login (`/(auth)/login`) and do not call `GET /api/tour-builder/my` or `POST /api/tour-builder/my`. A 403 whose message includes `Unauthorized` on the personal list is the same sign-in state, not a generic error page.

## Copy and theme

User-visible strings use `TRANSLATION_KEYS` and both locale files. Tabs read **Build your own** and **Ready-made trips**. Colors come from `src/constants/theme.ts`. Match the Attractions segmented control: equal flex, radius 12, primary fill when selected.

## Leave out

- Attractions (`explore/attractions.tsx`). Packages stay on this hub.
- A new backend route, a master-admin-only filter, or a package-name query. The public catalog is every active `CATALOG` package.
- Admin package create, edit, and `explore/tour-list` as an operator screen. `AdminExploreInterface` still opens that list.
- Trip checkout, `TRIP_PACKAGE` payment, and package-booking payment changes.
- Putting the wizard inside the tab.
- A new Redux slice. Detail can keep using the trip planner slice.
- District chips copied from Attractions. This search is divisions.

## Check

`npx tsc --noEmit` from `choloBD-expo` after the functional files, and again after the UI files. Do not start Expo, an emulator, or a payment browser from the agent.
