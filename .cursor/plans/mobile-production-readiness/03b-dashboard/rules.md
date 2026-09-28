# Rules — increment 03b (traveler dashboard home)

## Screen

Traveler home only: `src/components/interface/UserDashboard.tsx`, fed by `src/app/(tabs)/dashboard/index.tsx` and `useDashboardLogic`.

Build the Trip.com-style header inside `UserDashboard`. Do not restyle `ServiceAdminDashboard` into that layout.

`UserInfoUI` is still the service-admin header. Replace its Dicebear URL with the same local initial, and remove its Role card. Leave its logout button and the admin shortcut list alone.

## Profile

- Photo comes from `GET /api/users/profile`, not from the login user object. Show `imageUrl` when `profilePhotoUri` returns an https URL. Upgrade `http://` to `https://`. Skip SVG and Dicebear.
- Missing or failed photo: local initial (first character of `userName`, else email). Primary fill, on-primary letter, circle about 48px.
- Do not call Dicebear or any other placeholder image host.
- Traveler header shows name, email, and status. It does not show role and it does not link to an account editor.
- On the right: bell, then logout. Nothing else.

## Wallet

- Read `getOwnWallet()` only. Show `balance` as a number under the Wallet coins label. Do not show `currency` or the word “Points”.
- The balance is a card, not a full-bleed strip.
- Hide the card when that call fails.
- Do not add a wallet route. Do not call top-up or charge from this screen.

## Rows

- Delete the Explore Hotels row. This screen does not navigate to `/(tabs)/explore`.
- Traveler rows use Ionicons `bed`, `map`, and `compass` inside a pale circle (52px, glyph 28), plus a chevron. Those names come from `UserExploreInterface`.
- Do not use `ExploreMainCard` or `AdminCard` for these three rows.
- Do not add rows for bookmarks, reviews, complaints, settings, help, about, promo codes, or perks.

## Notifications

- Client file: `src/services/api/notifications.ts`. Screens use a hook, not Axios.
- Badge uses `GET /api/notifications/unread-count`. Hide it at 0 and when the call fails.
- Page route: `/(tabs)/dashboard/notifications`, registered before `dashboard/[bookingId]` so the name is not captured as a booking id.
- Mark read on open. Deep link only `HOTEL_BOOKING` and `PACKAGE_BOOKING`. Other types show `content` only.
- Do not `POST /api/notifications` and do not delete from this screen.
- Increment 08 must not add a second inbox.

## Recent booking

- One hotel booking: newest `bookedAt` from the list `useDashboardLogic` already loads. If `bookedAt` is missing, use check-in date. `createdAt` is not on `HotelRoomBooking`.
- Reuse `BookingCard` with `showRooms={false}` and `showGenerateQr`. Do not build a second card layout.
- Press uses the existing `onPressBooking` path (`/(tabs)/dashboard/:bookingId`).
- Do not add a package or trip fetch for this section.

## Copy

New visible strings go through `TRANSLATION_KEYS` and both `en.json` and `bn.json`. The page title is “My Dashboard”. Wallet label matches the Complete Payment “Wallet coins” wording. Section title is “Recent bookings”. Reuse `dashboard.noBookings` when the list is empty.

Colors come from `src/constants/theme.ts`. Do not copy Trip.com’s blue, gold, or membership art.
