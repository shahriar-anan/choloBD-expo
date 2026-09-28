# Tests — increment 03b (traveler dashboard home)

## Agent checks

```bash
npx tsc --noEmit
```

Run from `choloBD-expo` after the newest-booking helper and wallet read exist, and again after UI.

## Device cases

**Passed on device 2026-09-28.**

Traveler JWT. Dashboard tab. Agents do not start Expo.

### D-03c-profile Profile row

- Open Dashboard as a user with no profile photo.
- Expected: title **My Dashboard**. No “Welcome back”. A circle with an initial, the name, the email, and the status on one row. A bell, then logout, on the right. No Role card, no blue rounded square, no scan, support, or settings icons.
- If `GET /api/users/profile` has `imageUrl`, the circle shows that photo.

### D-03c-wallet Wallet strip

- Expected: one card under the profile with Wallet coins and the balance number only. No currency code and no “Points” word. It does not open another screen. No promo-code count and no membership card.
- If own-wallet fails, the card is absent. The rest of the page still renders.

### D-03c-cards Rows

- Expected: My Bookings (`bed`), My Package Bookings (`map`), Trip Planner (`compass`). Each icon is a pale circle about 52px with a chevron. Explore Hotels is gone. No Silver, rewards, saved, perks, or posts blocks.
- My Bookings opens the hotel list. My Package Bookings opens the package list. Trip Planner opens the trip planner. The tab bar stays on this home screen.

### D-03c-recent Recent booking

- With at least one hotel booking: under the rows, heading “Recent bookings” and one card matching My Bookings (cover, confirmation code, QR code on the right, no rooms). It is the newest booking. Tap opens that booking’s detail. QR opens QR generate.
- With no hotel bookings: “No bookings yet”. No empty card.

### D-03c-notifications Notification badge and page

- With unread notifications: the bell shows the unread count. Tap opens the notifications page. Each row shows the message. Opening one marks it read. A hotel booking notification opens that booking. A package booking notification opens that package booking. Any other type stays on the message text.
- Mark all read clears the badge after returning to the dashboard.
- With zero unread: the bell has no badge and still opens the page. An empty inbox shows the empty line.
