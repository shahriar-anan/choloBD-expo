# Rules — Hotel admin tab bar

## Scope

Edit `src/app/(tabs)/_layout.tsx` and the tab label keys only if `tabs.dashboard` is missing in either locale.

Do not move screens. Do not restyle `ServiceAdminDashboard`.

## Role

- Hotel admin bar only when `role` is `SERVICE_ADMIN` and `serviceType` is `HOTEL_BOOKING`.
- `EMPLOYEE` never takes this bar, even when `employeeServiceType` is `HOTEL_BOOKING`.
- A missing or unloaded `serviceType` keeps the bar that role already had. Do not guess `HOTEL_BOOKING`.

## Bar chrome

Use the same pill bar the traveller already uses: height, side inset, and bottom gap from `AppTabBar`. Do not add a fifth tab.

## Hidden routes

`href: null` hides a tab. Explore, trip planner, and community routes stay reachable if some later screen pushes them. This increment does not add those pushes.

## Re-tap

On the hotel admin bar, a `tabPress` while that tab is already focused calls `preventDefault` and navigates to that tab’s index. Leave the traveller listeners on their own branch.

## Do not

- Do not show Profile to a hotel admin.
- Do not show this bar to a traveller.
- Do not change `roleHome` in this increment.
