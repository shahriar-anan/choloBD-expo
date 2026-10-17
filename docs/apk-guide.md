# CholoBD Android app (test APK)

Version 1.0.0. This file is for people installing the sideloaded APK, not for Play Store users.

The app talks only to the live API at `https://api.cholo-bd.com`. It needs a working internet connection. Bookings, accounts, and payments created here are written to that live database.

The APK file from the latest build is:

`android/app/build/outputs/apk/release/app-release.apk`

## Install

1. Copy `app-release.apk` onto the phone.
2. Open it and allow installation from this source if Android asks.
3. If an older CholoBD test build is already installed, uninstall it first, then install this file. Android will not always replace a sideloaded build cleanly, and an old install can keep calling the wrong server.

This build does not update itself. A newer APK has to be installed by hand.

The app is portrait only. The interface is English or Bengali, and appearance can follow the phone, or be set to light or dark, from Profile.

## Sign in

Use email and password. Google and Facebook buttons are on the screen, but they do not sign anyone in.

You can register a new account in the app. That account is a normal traveler on the live server.

These seeded accounts already exist. Every one of them uses the password `root1234`. Type the email in lowercase.

| Who | Email |
|---|---|
| Traveler | `user1@gmail.com` (through `user60@gmail.com`) |
| Hotel admin | `hoteladmin1@gmail.com` |
| Hotel employee | `hotelemployee1@gmail.com` |
| Activity admin | `activityadmin1@gmail.com` |
| Transport admin | `transportadmin1@gmail.com` |


Start with `user1@gmail.com` to browse and book as a traveler. Operator emails open that operator’s own desk (hotel, activity, guide, or transport). An account that only exists on a developer’s computer will not sign in here.

There is no “forgot password” and no password change in this build.

## What a traveler can do

- Search and book hotels, including a stay QR after booking.
- Browse activities and book them.
- Browse guides and request a guide.
- Browse catalog tour packages and book one.
- Build a personal trip plan and check it out.
- Search buses and car rentals, pick a seat or vehicle, and pay.
- See bookings, cancel when the rules below allow it, and open an in-app notification inbox.
- Edit name, phone, and profile photo.
- Read and post in Community.

Wallet balance is shown on Profile. If the balance covers the price, a booking can be paid with wallet points. There is no screen to add money to the wallet.

Card payment opens SSLCommerz in the phone’s browser, then returns to the app. “Pay later” leaves the booking unpaid. Whether a card charge succeeds depends on the live gateway; treat a card payment as a real charge until you confirm it failed.

## Operator accounts

A hotel admin or hotel employee lands on the hotel desk (today’s stays, bookings, QR check-in). A transport admin lands on coaches, vehicles, and transport bookings. Guide and activity admins see their own service. These desks are for the seeded businesses, such as Grand Palace for `hoteladmin1@gmail.com` and Dhaka Express Coach for `transportadmin1@gmail.com`.

## Limitations

- Social sign-in does not work.
- No password reset or password change.
- No push notifications. The bell is an in-app inbox only. The phone will not buzz when a booking changes unless the app is open and you refresh.
- Profile → Offers is a placeholder. There are no promo codes.
- Profile → Help is a placeholder. There is no support chat.
- Flights and trains cannot be booked. Search offers bus and car rental only.
- Listings, reviews, and community posts are mostly seeded demo data. Names often end in `_DEMO`. Empty sections are possible where that data was not seeded.
- Creating a booking, posting in Community, or paying spends or creates real rows on the live server. Do not use a personal card unless you mean to pay.
- Camera permission is required for QR check-in. The scanner will not open if that permission is denied.
- The release build refuses plain `http://` addresses. If sign-in says “Sign-in failed. Please try again.” with no other detail, the phone could not reach the server. Check mobile data or Wi-Fi, then confirm this is the APK built after the live URL was set.

## Cancellation and refunds

Unpaid bookings can be cancelled. Nothing is refunded, because nothing was collected. Cash bookings can be cancelled in status only. Cash never entered the platform, so there is no digital refund.

A paid refund goes back through the same method used to pay. A booking cannot be refunded twice, and the refund cannot be more than what is still refundable. After the service has started, the traveler gets nothing back.

If the operator or a platform admin cancels a paid booking, the traveler gets a full refund.

| Booking | Traveler cancel, full refund | Traveler cancel, no refund |
|---|---|---|
| Hotel | More than 24 hours before check-in. Shift stays use 08:00, 15:00, or 22:00, not midnight. | Within 24 hours of check-in |
| Activity | Before the activity’s calendar day | On the activity day |
| Guide | Paid booking more than 24 hours before the start time. Unpaid requests can be cancelled with no refund. | Paid booking within 24 hours of the start time |
| Package or trip | More than 7 days before the start date | Within 7 days of the start date |
| Bus | More than 6 hours before departure | Within 6 hours of departure |
| Car rental | More than 24 hours before pickup | Within 24 hours of pickup |
