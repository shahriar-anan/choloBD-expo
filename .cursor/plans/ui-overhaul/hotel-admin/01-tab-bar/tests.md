# Tests — Hotel admin tab bar

## Agent checks

From `choloBD-expo`:

```bash
npx tsc --noEmit
```

Confirm the hotel-admin branch is gated on `SERVICE_ADMIN` plus `HOTEL_BOOKING`, and that `EMPLOYEE` is not in that branch.

## Device cases

A person runs these. The agent does not launch Expo.

### D-H1 Hotel admin bar

- Sign in as a hotel `SERVICE_ADMIN`.
- Expected: Home, Bookings, Dashboard, Notifications, in that order.
- Explore, Tracking, and Profile are absent.
- Bengali labels are হোম, বুকিং, ড্যাশবোর্ড, বিজ্ঞপ্তি, each on one line.

### D-H2 Other operators

- Sign in as a hotel `EMPLOYEE`.
- Expected: Homepage, Explore, Dashboard, Tracking.
- Sign in as a non-hotel `SERVICE_ADMIN`.
- Expected: the same four tabs, not the hotel admin bar.

### D-H3 Traveller unchanged

- Sign in as `USER`.
- Expected: Home, Bookings, Notifications, Profile. No Dashboard tab.

### D-H4 Re-tap

- Open any pushed screen on Dashboard, then tap Dashboard.
- Expected: the Dashboard index.

The traveller test D-T3 said a hotel admin keeps the old bar. After this increment, D-H1 replaces that expectation.
