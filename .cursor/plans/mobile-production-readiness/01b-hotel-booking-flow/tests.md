# Tests — increment 01b (hotel search flow)

## Agent checks

After Functional, before UI:

```bash
npx tsc --noEmit
```

Helper cases:

- 30 Sep → 2 Oct is 2 nights. Same-day and ranges over 30 nights are invalid. Past dates are not selectable.
- Room count cannot go below 1. There is no guest cap and no child field.
- `5039` formats as `৳5,039`.
- Price buckets and star, name, and amenity filters change the list length to the number of matching rows. That length is N. It is not a city-wide total.
- Bed line is omitted when both bed counts are 0. Bathroom and area are never shown.

## Device cases

Checked on device 2026-09-28. Agents do not start Expo.

### D-01b Search home

- Typing a place name lists divisions and districts first (at most 4), then hotels (at most 3), tour spots (at most 2), and activity spots (at most 2). Dhaka the place comes before hotels and spots. Tour packages are not shown.
- Choosing the location and pressing Search Hotel opens hotel cards for that place. Detail opens from a card.
- Subtitle shows the date range and room count.

### D-01b-b Dates and rooms

- Past dates cannot be selected. The range continues across months.
- Room count can increase and the extra rooms can be removed down to 1. No child row and no maximum-guest message.

### D-01b-c Filters

- “Show N Hotels” equals the cards after sort, name, stars, price bucket, and amenities.
- Reset restores the fetched list. No counts in parentheses.

### D-01b-d Detail and rooms

- No map and no promo. Location is text (name, city, country).
- Room sheet shows price and bed counts only when non-zero. Confirm is disabled until a room type is selected.
- Confirm opens the existing guest-details screen with that room type, quantity, and dates.
