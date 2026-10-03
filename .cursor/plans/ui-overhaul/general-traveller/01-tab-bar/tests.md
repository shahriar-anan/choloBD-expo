# Tests — Traveller tab bar

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Confirm `_layout.tsx` sets `href: null` on `explore`, `dashboard`, `tracking`, `trip-planner`, and `community` only in the traveller branch.

## Device cases

A person runs these. The agent does not launch Expo.

### D-T1 Traveller bar

- Sign in as `USER`.
- Expected: four tabs, in order: Home, Bookings, Notifications, Profile.
- Explore, Dashboard, and Tracking are absent.
- Bengali labels are হোম, বুকিং, বিজ্ঞপ্তি, প্রোফাইল, each on one line.

### D-T2 Re-tap

- Open a booking detail, then tap Bookings.
- Expected: the Bookings index, not the detail.

### D-T3 Hotel admin

- Sign in as a hotel `SERVICE_ADMIN`.
- Expected: the hotel admin bar from `hotel-admin/01-tab-bar`: Home, Bookings, Dashboard, Notifications.
