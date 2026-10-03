# Tests — Profile

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Confirm `profile/index.tsx` does not import `RecentBookingCard` and does not route to a booking list.

## Device cases

A person runs these. The agent does not launch Expo.

### D-P1 Identity

- Open Profile as a traveller.
- Expected: photo or initial, name, email. Rows for About, Tracking, Offers, Community, and Help. No Active / Unverified line. No booking rows. The tab bar stays.

### D-P1b Empty sections

- Open About, Tracking, Offers, Community, and Help.
- Expected: the title and a way back to Profile. The body is empty. No alert.

### D-P2 Wallet

- With a wallet: the balance number. No currency word.
- Force the wallet call to fail: the card is absent, and the rest of the screen still shows.

### D-P3 Appearance and language

- Set Appearance to Dark, leave the screen, come back. It is still Dark.
- Switch language to বাংলা. Tab labels and this title follow the locale.

### D-P4 Log out

- Log out from the bottom row.
- Expected: the login screen. Signing back in as `USER` opens Home, not a dashboard menu.
