# Tests — 07 listing checklist

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Hotel admin. One hotel with photos, room types, and category amenities. If you can, also open a hotel missing description or photos.

- [ ] W-07a Profile loads with no console error about rendering objects.
- [ ] W-07b The checklist marks photos and room types complete on the full hotel, and marks description or photos missing on the sparse hotel.
- [ ] W-07c Location shows the location name. The words Address and City are absent when the payload has no string address.
- [ ] W-07d Amenity and policy chips show names, not `[object Object]`.
- [ ] W-07e **View as traveler** opens `/hotels/:id` for that hotel.
- [ ] W-07f **Edit** opens the existing edit page. Back to hotel admin returns to `/dashboard#hotel_admin_profile` with the profile tab selected.
- [ ] W-07g A `returnTo` value that is not under `/dashboard` does not change the back link’s destination away from the dashboard.
- [ ] W-07h The employee dashboard has no Hotel Profile editor.
- [ ] W-07i The profile lists up to the reviews returned for that hotel: name, rating, text, and date. A hotel with no reviews shows “No reviews yet.” There is no reply field.
- [ ] W-07j **Edit** on a hotel with no photos opens the existing edit page, where the current image uploader still works, and Back returns to the profile tab. The profile tab itself has no second upload control.
