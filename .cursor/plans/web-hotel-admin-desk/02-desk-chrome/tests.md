# Tests — 02 desk chrome

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

Hotel admin and hotel employee, desktop width and a narrow viewport (about 390px). Check light theme and dark theme.

## Navigation

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-02a Click each admin tab. The address bar hash matches the sidebar href for that section. Refresh keeps the same tab.
- [ ] W-02b Same for each employee tab, including Maintenance Tasks.
- [ ] W-02c Open `/dashboard?createRoomType=1#hotel_admin_rooms` as the hotel admin. Room management is selected and the create-room-type modal opens.
- [ ] W-02d Browser Back after a tab click does not cycle through every tab. Tab clicks do not add history entries.

## Layout

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-02e The words “Room Management” (or “Hotel Profile”, “Earnings”, “Bookings”) appear once as the selected tab, not again as a second and third heading in the panel.
- [ ] W-02f A long booking list scrolls the page. There is no inner region stuck at 40vh–80vh with its own scrollbar.
- [ ] W-02g Earnings dates read like `3 Oct 2026`, not a two-digit year.

## Theme

**Target app:** `choloBD-expo`. Do not change the Next.js web app or the backend.

- [ ] W-02h Pending, confirmed, cancelled, and room status chips are readable in dark theme. Text is not a dark blue or dark red on a dark card.
