import React from 'react';
import { HotelGuestBookings } from '../../../../components/hotel/HotelGuestBookings';
import { TRANSLATION_KEYS } from '../../../../constants/translationKeys';

export default function CurrentBookingsPage() {
  return (
    <HotelGuestBookings
      showBack
      showEarningsLink
      showSubtitle
      headingKey={TRANSLATION_KEYS.DASHBOARD.ADMIN_CARDS.CURRENT_BOOKINGS}
      stayPath="dashboard"
    />
  );
}
