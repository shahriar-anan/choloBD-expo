# Rules — Traveller tab bar

## Scope

Edit `src/app/(tabs)/_layout.tsx`, `src/constants/translationKeys.ts`, `src/locales/en.json`, and `src/locales/bn.json`. Add the three route files only as shells that later increments replace.

Do not move files out of `dashboard/`, `tracking/`, or `explore/` in this increment.

## Role

- Traveller bar when `role` is missing or `USER`.
- Existing `Tabs.Screen` options when `role` is `SERVICE_ADMIN`, `EMPLOYEE`, or `MASTER_ADMIN`.
- Do not branch on `serviceType` here. Hotel versus bus operator is a later plan.

## Bar chrome

Keep `tabBarScreenStyle`, safe area, active and inactive colors, and `headerShown: false`.

Labels stay visible. Font size stays 12. Do not drop labels to fit a fifth tab.

## Hidden routes

`href: null` hides a tab. It does not delete the route. Home tiles may still `push` `/(tabs)/explore/...`, `/(tabs)/trip-planner`, and `/(tabs)/community`.

## Re-tap

On the traveller bar, a `tabPress` while that tab is already focused calls `preventDefault` and navigates to that tab’s index screen. Do not reset a hotel admin’s Explore stack from the traveller listener.
