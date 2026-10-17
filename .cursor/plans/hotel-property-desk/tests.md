# Tests — hotel property desk (mobile)

Use `hoteladmin1@gmail.com` and `hotelemployee1@gmail.com`. Password `root1234`. Open My hotel. The hotel shift switch may already be on from an earlier check. Do not turn it off unless you accept the two-month lock.

## Home

- The hotel name and area are fully visible.
- Rows open Property details, Stay times, Shift booking, Room rates, Rooms, and Reviews.
- The review row shows a rating. The rooms row shows a count.
- No green or blue stat tiles. No Overview / Profile / Rooms / Reviews pills.

## Property details

- A long amenity line shows the first word, wrapped or as chips. Nothing is clipped on the left.
- Bangla amenities, policies, tours, and activities each have their own label.
- Add a chip, remove a chip, Save. Leave and come back. The chips match what was saved.
- Phone, email, and website save and reload.
- Save does not change `allowShiftBooking` or the last shift-change date.

## Stay

- Check-in and check-out sit together. A saved pair reloads.
- The shift card shows On or Off and the last change date when one exists.
- The admin confirm still appears before a change. Cancel leaves the switch as it was.
- A rejected change shows the server message.
- The employee sees the times and the switch value, with no Save and no switch.

## Rates

- The list shows each type's guest count, nightly price in `৳`, and only the shifts that are for sale.
- A shift-off type says shifts are off.
- With the hotel switch off, the list still opens and the line about travelers is visible.
- Open Single. The title stays Single while scrolling.
- Change guests and the nightly price. Save. The list shows the new values.
- Add Morning, enter a price, Save. The list names Morning.
- Cross Morning, Save. The list no longer names Morning.
- Add a slot and tap Save with the price empty. Save is blocked. The stored price is unchanged.
- Enter `0`. Save is blocked.
- Back out of an unsaved editor. The app asks before discarding. Discard restores the list values.
- Add a room type from the list, not from a form under the rates. It starts shift-off, and guests match the category until changed.
- The employee can open a type and cannot Add, cross, or Save.

## Rooms

- A row shows the room number, the type, and one status. It does not show bed counts or a nightly price.
- Tap a row. The sheet offers the three statuses. The current one is marked. Choosing another updates the pill.
- Assign cleaning is on the admin sheet and opens tasks for that room.
- The employee can change status and does not see Assign cleaning.
- Nine rooms do not each show three buttons at once.

## Reviews

- Each review is a card with stars, the number, the name, the date, and a short text.
- Read more shows the rest of that review only.
- No reviews shows the empty line in English and in Bangla.

## Regression

- Traveler Night search still uses the slot price saved from the new editor.
- A cleared slot does not appear as that shift's price.
- Guest count on a new booking still uses the saved guests-per-room number.
- `npx tsc --noEmit` in `choloBD-expo` reports no new errors in the hotel-info folder or `src/components/hotelDesk/`.
