# Rules — Home entries

## Scope

`HomeHeader`, `src/app/(tabs)/index.tsx`, login and register success, and traveller `router.replace` calls that target `dashboard` or `tracking`.

Role-gate every change. A `SERVICE_ADMIN` or `EMPLOYEE` keeps the current home menu, Explore tab, and dashboard landing.

## Drawer

Do not leave a menu item whose handler is `Alert.alert`. Removing the traveller drawer is the fix. Do not rebuild it with a shorter list.

## Back

Back on a flow opened from Home returns to Home, not to `explore/index`. Travellers do not need the Explore card menu (hotel, attractions, tours, plan trip). Those four actions are the home tiles and the community row.

## Payments

Success navigation for a traveller lands on Bookings. Do not clear the booking or skip the existing payment handler. Only the route after success changes.

## Do not

- Do not show the QR scanner on Home for a traveller.
- Do not add Explore back onto the traveller bar.
- Do not move the `explore` folder in this increment. Hide the bar and add back.
