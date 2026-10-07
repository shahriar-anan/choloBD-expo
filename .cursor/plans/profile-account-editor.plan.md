# Profile account editor

Mobile only. The live API already accepts these updates. No backend deploy.

Out of scope: change password, and any email that resets a forgotten password. Those routes are not usable from the phone.

## Who

One editor for every signed-in role: traveler, service admin, employee, master admin. `PUT /api/users/profile` updates the user on the JWT. The profile tab is already shared.

## API

| Call | Purpose |
| --- | --- |
| `GET /api/users/profile` | Load the form. Already used by `getUserProfile()`. |
| `PUT /api/users/profile` | Save. Body fields below only. |
| Cloudinary unsigned upload | Photo file. Already used by `uploadCommunityImageToCloudinary()`. |

Save body:

| Field | Rule |
| --- | --- |
| `userName` | Optional. 2–50 characters. Letters, numbers, `_`, `-`. |
| `email` | Optional. Valid email. Server rejects an address already used. |
| `firstName` | Optional. |
| `lastName` | Optional. |
| `phoneNumber` | Optional. Unique on the server. |
| `imageUrl` | Optional. The Cloudinary URL. |

Send `imageUrl`, not `image`. Do not send `role`, `password`, or `passwordHashed`. The handler writes the body onto the user row.

Photo steps: pick or take a picture, upload to Cloudinary in folder `cholo-bd/profiles`, then put the returned URL in `imageUrl` on the same save as the text fields.

## Screens

Profile tab (`src/app/(tabs)/profile/index.tsx`):

- The avatar and name row opens Edit account.
- Add an Account row at the top of the Account section, same chevron style as About and Help.

New screen `src/app/(tabs)/profile/account.tsx`:

- Loads `GET /api/users/profile` on focus.
- Shows the current photo, with actions to choose from the library or take a photo. A failed photo falls back to the initial, as `ProfileAvatar` already does.
- Fields: username, first name, last name, phone, email.
- Save uploads a newly chosen photo first, then `PUT`s the text plus `imageUrl`.
- Save stays disabled while a request is in flight.
- Success returns to the profile tab. The header, dashboard avatar, and stored user show the new name, email, and photo.
- The server message is shown when save fails (duplicate email, duplicate phone, validation).

Signed-out users keep the existing sign-in row. Edit account is only for a signed-in user.

## After save

`AuthUser` today has `userName`, `email`, and `imageUrl`. Extend it with `firstName`, `lastName`, and `phoneNumber` when the profile response includes them.

Update the Redux user and the saved user from the `PUT` response, then reload `getUserProfile()` so `profileImageUrl` in `useDashboardLogic` matches. Login responses can omit first name and phone, so the editor must not rely on the login payload alone.

## Files

- `src/services/api/users.ts` — `updateUserProfile()`.
- `src/app/(tabs)/profile/account.tsx` — the form.
- `src/app/(tabs)/profile/index.tsx` — entry row and tappable header.
- `src/types/auth.ts` — extra profile fields.
- `src/store/slices/authSlice.ts` — write the updated user back.
- `src/constants/translationKeys.ts`, `src/locales/en.json`, `src/locales/bn.json` — labels and errors.
- Reuse `uploadCommunityImageToCloudinary` with a `cholo-bd/profiles` folder. Reuse `expo-image-picker`, already in the app.

## Check

- Traveler: change photo, username, both names, phone, and email. Profile header and dashboard avatar update without signing in again.
- Hotel admin and a hotel employee: same screen, same save. Their hotel desk assignment is untouched.
- Duplicate email and duplicate phone show the server message and leave the previous values in place.
- Cancel or leaving the screen without save keeps the old profile.
- A photo that fails to upload does not send a `PUT`.
