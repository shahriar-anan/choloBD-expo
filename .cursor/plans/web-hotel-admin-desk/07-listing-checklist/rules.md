# Rules — 07 listing checklist

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Shared rules: [../README.md](../README.md).

- Read `Category.name` for amenities and policies. Do not require them to be strings.
- `returnTo` is honored only when it starts with `/dashboard`. Ignore any other value so the query cannot send the user off-site.
- Do not move hotel editing into a new form. The existing edit page remains the writer, via `PUT /api/hotels/:hotelId`.
- Do not show this editor to the hotel employee.
- Completeness is display-only. Do not block other admin tabs when a row is missing.
- Reviews are `GET` only. Do not post a reply or call `PUT /api/reviews/:reviewId` from this dashboard.
- Hotel and room-type photos stay on the forms that already send `imageURLs`. Do not add a multipart upload route.
