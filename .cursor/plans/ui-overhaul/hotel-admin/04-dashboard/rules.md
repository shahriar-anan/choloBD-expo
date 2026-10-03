# Rules — Office and settings

## Scope

`ServiceAdminDashboard` when `hotelOperator` is true. The other branch of that component stays.

## Settings

Language, appearance, and log out are rows on this screen. Do not add a Settings route and do not link the traveller Profile tab.

Appearance cycles `system`, then `light`, then `dark`, the same order as Profile.

## Tools

Each remaining card opens the screen it opens today:

- My hotel → hotel info for this admin’s hotel
- Earnings → `service-admin/earnings`
- Availability → `service-admin/availability`
- Complaints → `service-admin/complaints`
- QR scanner → `service-admin/qr-scanner`

Do not add a tool that has no screen.

## Do not

- Do not show earnings or the hotel desk to a non-hotel service admin.
- Do not put guest check-in on Dashboard. QR scan stays. Generating a guest QR stays on the guest card.
- Do not remove logout.
