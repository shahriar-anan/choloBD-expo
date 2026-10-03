# 07 — Listing checklist

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

**Folder:** `07-listing-checklist` · **Rules:** [rules.md](rules.md) · **Tests:** [tests.md](tests.md)

Status: **Not started.** Depends on increment 1. Can ship before 5 and 6.

Hotel Profile is a public brochure wired to the wrong shape: it expects `address`, `city`, and string amenities, while hotel detail returns `location`, `addressId`, and `Category` relations. Edit leaves the dashboard with no path back. An admin cannot see whether the listing is complete.

## Outcome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

The profile tab is a listing checklist, the fields guests actually see, and the hotel’s recent reviews. Photos are added on the existing edit page, which already uploads them. That page returns to the profile tab.

## Checklist

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Show a short list at the top of `HotelProfileSection`. Each row is complete or missing:

| Row | Complete when |
| --- | --- |
| Name | `name` is non-empty |
| Phone | `phoneNumber` is non-empty |
| Email | `email` is non-empty |
| Location | `location.name` or `location.city` is non-empty |
| Check-in and check-out | both `checkInTime` and `checkOutTime` are set |
| Description | `description` is non-empty |
| Photos | `images` has at least one url |
| Room types | `roomTypes` has at least one type with `pricePerNight` greater than 0 |
| Policies | at least one policy name |

Amenities are shown in the body and are not a failing row. A hotel may list none.

Under the checklist, a **View as traveler** link goes to `/hotels/:id`.

The Photos row, when missing, uses the same **Edit** control. `HotelPageForm` already uploads files and sends `imageURLs` on `PUT /api/hotels/:hotelId`. Room-type photos stay on the existing room-type form, which already does the same for `PUT /api/hotel-rooms/roomTypes/:roomTypeId`. Do not add an upload route or a second uploader on the profile tab. Delete stays `PUT /api/hotels/:hotelId/images` with `imageIds`, which the edit form already calls.

## Reviews

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Under the profile body, list recent guest reviews. Read only.

- Call the existing reviews list. `GET /api/reviews` already filters a hotel when `hotelId` is set, and also when `reviewType` is `HOTEL` and `reviewAssetId` is the hotel id. `getPageReviews` in `src/services/api/reviewApi.ts` already sends `reviewType` and `reviewAssetId`. Use that. Pass `limit` and `sortBy=createdAt` with `sortOrder=desc` if the helper is extended. The default response is 10 rows. Do not raise that on the server.
- Each row: guest name, rating, description, and the date as `3 Oct 2026`.
- Empty list: “No reviews yet.”
- No reply box, no edit, no delete. `Review` has no reply field. `PUT /api/reviews/:reviewId` is the guest editing their own review, not a hotel response.

## Body

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Render from the real `Hotel` type:

- Name, hotel type, rating
- Phone, email, website (website omitted when empty)
- Location name
- Check-in and check-out times
- Description
- Amenity names and policy names (the safe read from increment 1)
- Photo count, with up to four thumbnails

Remove the local `HotelProfile` type that requires `address` and `city`. Do not print those labels unless a string address is actually on the payload.

## Edit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Keep **Edit** as navigation to `/hotels/:id/edit`. Add `?returnTo=` set to `/dashboard#hotel_admin_profile`. The edit page’s back or cancel control uses that path when it is present and starts with `/dashboard`. If the edit page has no back control, add one text link, “Back to hotel admin”, that follows `returnTo`.

Do not embed `HotelPageForm` inside the tab. Do not add a second editor.

Employee dashboard does not get this editor. Employees do not see Hotel Profile.

## Leave alone

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- Public hotel detail page layout, other than the edit page’s return link.
- Room-type editing on the Rooms tab.
- Create-hotel flow.

## Files

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- `src/components/modular-components/dashboard/service-admin/hotel/HotelProfileSection.tsx`
- `src/services/api/reviewApi.ts` — pass `limit` and sort on the existing hotel review query if it does not already
- `src/app/(info)/hotels/[hotel_id]/edit/page.tsx` (return link only)
- The edit form’s cancel or back control, if it lives in `src/components/forms/HotelPageForm.tsx`

## Exit

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

[tests.md](tests.md). `npx tsc --noEmit` from `choloBD-expo`.
