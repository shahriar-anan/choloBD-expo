import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ServiceAdminDashboard } from '../../../components/interface/ServiceAdminDashboard';
import { UserDashboard } from '../../../components/interface/UserDashboard';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import { profileDisplayName } from '../../../utilities/profileImage';

export default function DashboardPage() {
  const {
    auth,
    recentBookingItems,
    wallet,
    unreadCount,
    profileImageUrl,
    profileStatus,
    serviceType,
    employeeServiceType,
    operatorProfileLoaded,
    handleLogout,
    onPressRecentBooking,
    refreshTravelerHome,
  } = useDashboardLogic();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    // Ensure content respects top inset on platforms where SafeAreaView alone may not be enough
    // (keeps layout stable when navigating back from nested routes)
  }, [insets.top]);

  const isHotelOperator =
    (auth.user?.role === 'SERVICE_ADMIN' && serviceType === 'HOTEL_BOOKING') ||
    (auth.user?.role === 'EMPLOYEE' && employeeServiceType === 'HOTEL_BOOKING');

  const waitingForAssignment =
    (auth.user?.role === 'SERVICE_ADMIN' || auth.user?.role === 'EMPLOYEE') &&
    !operatorProfileLoaded;

  useFocusEffect(
    React.useCallback(() => {
      if (auth.user?.role === 'SERVICE_ADMIN') {
        return;
      }
      if (auth.user?.role === 'EMPLOYEE' && !operatorProfileLoaded) {
        return;
      }
      if (isHotelOperator) {
        return;
      }
      refreshTravelerHome();
    }, [auth.user?.role, employeeServiceType, isHotelOperator, operatorProfileLoaded, refreshTravelerHome])
  );

  if (waitingForAssignment) {
    return (
      <View className="items-center justify-center flex-1 bg-background dark:bg-background-dark">
        <ActivityIndicator />
      </View>
    );
  }

  if (isHotelOperator) {
    return (
      <ServiceAdminDashboard
        hotelOperator
        userName={profileDisplayName(auth.user) || auth.user?.userName}
        email={auth.user?.email}
        imageUrl={profileImageUrl || auth.user?.imageUrl}
        role={auth.user?.role}
        userStatus={profileStatus || auth.user?.userStatus}
        onLogout={handleLogout}
      />
    );
  }

  // Other service admins keep the dashboard they already had.
  if (auth.user?.role === 'SERVICE_ADMIN') {
    return (
      <ServiceAdminDashboard
        userName={profileDisplayName(auth.user) || auth.user?.userName}
        email={auth.user?.email}
        imageUrl={profileImageUrl || auth.user?.imageUrl}
        role={auth.user?.role}
        userStatus={profileStatus || auth.user?.userStatus}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <UserDashboard
      userName={profileDisplayName(auth.user) || auth.user?.userName}
      email={auth.user?.email}
      imageUrl={profileImageUrl || auth.user?.imageUrl}
      userStatus={profileStatus || auth.user?.userStatus}
      recentBookingItems={recentBookingItems}
      wallet={wallet}
      unreadCount={unreadCount}
      onLogout={handleLogout}
      onPressRecentBooking={onPressRecentBooking}
    />
  );
}
