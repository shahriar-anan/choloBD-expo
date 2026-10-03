# 04 — Inventory labels

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

**Folder:** `04-inventory-labels` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Not started.** Depends on increment 2. Can run in parallel with increment 3.

Admin **Room Management** treats `totalCount - availableCount` as occupied guests and paints 80% and above red. Those fields are administrative capacity. They do not know who is in the building. The expanded room-type card then repeats the same counts in seven tiles, plus a half-screen image viewer.

## Outcome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

The room-type block describes the catalog: how many rooms exist, how many the hotel marked usable, the nightly price, and each shift price. High “occupancy” is not shown, and it is not colored as a problem. Edit and the sellable facts sit on the row.

## Do this

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

1. Rename the summary so the words match the data:
   - **Rooms** = sum of `totalCount`
   - **Open for sale** = sum of `availableCount`
   - **Held back** = rooms minus open for sale, when the difference is positive
   - Remove **Occupied**, **Overall occupancy**, the percent bar, and the red / amber / teal occupancy coloring.
2. On each room-type row, show:
   - Category label (Single, Double, Suite, Deluxe)
   - Beds
   - `pricePerNight`
   - When `allowShiftBooking` is on: night, morning, and afternoon prices, or “No price” when that field is null
   - `availableCount` / `totalCount` with the caption **open for sale**
   - **Edit** on the row. Do not require Details first.
3. Remove the seven expanded metric tiles, the occupancy percent, and the “Created on” block.
4. Photos: a short thumbnail strip on the row (up to four). The 50vh–65vh `ImageViewerModule` stays in the edit modal if that modal already edits images. It does not sit in the list.
5. Empty state stays: no room types yet, with **Add Room Type** as the next action.

Tonight’s in-house count is increment 5. This increment does not compute it.

## Leave alone

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- Create and edit modal fields and API calls (`POST` / `PUT` room types).
- Employee physical-room status. Increment 6 changes that board.
- `availableCount` writes. Do not recalculate them from bookings.

## Files

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `src/components/modular-components/dashboard/service-admin/hotel/RoomTypeStatsSection.tsx`
- `src/components/modular-components/dashboard/service-admin/hotel/HotelRoomTypeManagementModule.tsx`

## Exit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

[tests.md](tests.md). `npx tsc --noEmit` from `choloBD-expo`.
