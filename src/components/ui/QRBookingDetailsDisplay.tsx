import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { QRBookingDetail } from '../../types/qr';

interface QRBookingDetailsDisplayProps {
  booking: QRBookingDetail;
}

const DetailRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <View>
    <View className="flex-row justify-between py-3">
      <Text className="flex-1 text-sm text-muted dark:text-muted-dark">{label}</Text>
      <Text className="flex-1 text-sm font-medium text-right text-text dark:text-text-dark">{value}</Text>
    </View>
    {!last && <View className="h-px bg-border dark:bg-border-dark" />}
  </View>
);

export const QRBookingDetailsDisplay: React.FC<QRBookingDetailsDisplayProps> = ({ booking }) => {
  const guestName =
    booking.guestName ||
    [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(' ') ||
    booking.user?.userName ||
    'Guest';
  const checkOutDate = new Date(booking.checkOutDate);
  const checkInDate = new Date(booking.checkInDate);
  const nights = Math.max(0, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <ScrollView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1">
        {/* Header Section */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-3xl font-bold text-text dark:text-text-dark">{booking.confirmationCode}</Text>
          <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
            {booking.status === 'checked-in' ? '✓ Checked In' : booking.status === 'active' ? 'Active Booking' : booking.status}
          </Text>
        </View>

        {/* Hotel Name */}
        <View className="px-6 py-4 border-b border-border dark:border-border-dark">
          <Text className="text-lg font-semibold text-text dark:text-text-dark">{booking.hotel?.name || 'Hotel'}</Text>
          {booking.hotel?.location && (
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {booking.hotel.location.city || booking.hotel.location.name}
            </Text>
          )}
        </View>

        {/* Guest Section */}
        <View className="px-6 py-4 border-b border-border dark:border-border-dark">
          <Text className="mb-3 text-xs font-bold tracking-wide uppercase text-muted dark:text-muted-dark">
            Guest
          </Text>
          <Text className="text-base font-medium text-text dark:text-text-dark">{guestName}</Text>
          {booking.user?.email ? (
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{booking.user.email}</Text>
          ) : null}
          {booking.user?.phoneNumber ? (
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{booking.user.phoneNumber}</Text>
          ) : null}
        </View>

        {/* Stay Dates Section */}
        <View className="px-6 py-4 border-b border-border dark:border-border-dark">
          <Text className="mb-3 text-xs font-bold tracking-wide uppercase text-muted dark:text-muted-dark">
            Stay Details
          </Text>
          <DetailRow
            label="Check-in"
            value={checkInDate.toLocaleDateString()}
          />
          <DetailRow
            label="Check-out"
            value={checkOutDate.toLocaleDateString()}
          />
          <DetailRow
            label="Number of Nights"
            value={nights.toString()}
            last
          />
        </View>

        {/* Room Details Section */}
        {booking.roomDetails && booking.roomDetails.length > 0 && (
          <View className="px-6 py-4 border-b border-border dark:border-border-dark">
            <Text className="mb-3 text-xs font-bold tracking-wide uppercase text-muted dark:text-muted-dark">
              Rooms & Rates
            </Text>
            {booking.roomDetails.map((item, idx) => (
              <View key={idx}>
                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-text dark:text-text-dark">
                      Room {item.hotelRoom?.roomNumber || 'N/A'}
                    </Text>
                    {item.hotelRoomType?.roomType && (
                      <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                        {item.hotelRoomType.roomType}
                      </Text>
                    )}
                  </View>
                  <Text className="text-sm font-medium text-text dark:text-text-dark">
                    ${item.pricePerNight || 0}/night
                  </Text>
                </View>
                {idx < booking.roomDetails.length - 1 && (
                  <View className="h-px my-2 bg-border dark:bg-border-dark" />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Payment Section */}
        <View className="px-6 py-4 border-b border-border dark:border-border-dark">
          <Text className="mb-3 text-xs font-bold tracking-wide uppercase text-muted dark:text-muted-dark">
            Payment
          </Text>
          <DetailRow
            label="Payment status"
            value={booking.paymentStatus || 'N/A'}
          />
          <DetailRow
            label="Payment Method"
            value={booking.paymentMethod || 'N/A'}
          />
          <DetailRow
            label="Total Amount"
            value={`$${booking.totalPrice}`}
            last
          />
        </View>

        {/* Special Requests Section */}
        {booking.specialRequests && (
          <View className="px-6 py-4 border-b border-border dark:border-border-dark">
            <Text className="mb-2 text-xs font-bold tracking-wide uppercase text-muted dark:text-muted-dark">
              Special Requests
            </Text>
            <Text className="text-sm leading-5 text-text dark:text-text-dark">
              {booking.specialRequests}
            </Text>
          </View>
        )}

        {/* Hotel Contact Section */}
        <View className="px-6 py-4">
          <Text className="mb-3 text-xs font-bold tracking-wide uppercase text-muted dark:text-muted-dark">
            Hotel Contact
          </Text>
          <DetailRow
            label="Phone"
            value={booking.hotel?.phoneNumber || 'N/A'}
          />
          <DetailRow
            label="Email"
            value={booking.hotel?.email || 'N/A'}
            last
          />
        </View>

        {/* Footer Padding */}
        <View className="h-6" />
      </View>
    </ScrollView>
  );
};

export default QRBookingDetailsDisplay;
