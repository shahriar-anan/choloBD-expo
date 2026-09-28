import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ServiceAdminDashboard } from '../../../components/interface/ServiceAdminDashboard';
import { UserDashboard } from '../../../components/interface/UserDashboard';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';

export default function DashboardPage() {
  const {
    auth,
    recentBooking,
    wallet,
    unreadCount,
    profileImageUrl,
    profileStatus,
    handleLogout,
    onPressBooking,
    refreshTravelerHome,
  } = useDashboardLogic();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    // Ensure content respects top inset on platforms where SafeAreaView alone may not be enough
    // (keeps layout stable when navigating back from nested routes)
  }, [insets.top]);

  useFocusEffect(
    React.useCallback(() => {
      if (auth.user?.role === 'SERVICE_ADMIN') {
        return;
      }
      refreshTravelerHome();
    }, [auth.user?.role, refreshTravelerHome])
  );

  // Render a different dashboard for service admins
  if (auth.user?.role === 'SERVICE_ADMIN') {
    return (
      <ServiceAdminDashboard
        userName={auth.user?.userName}
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
      userName={auth.user?.userName}
      email={auth.user?.email}
      imageUrl={profileImageUrl || auth.user?.imageUrl}
      userStatus={profileStatus || auth.user?.userStatus}
      recentBooking={recentBooking}
      wallet={wallet}
      unreadCount={unreadCount}
      onLogout={handleLogout}
      onPressBooking={onPressBooking}
    />
  );
}
