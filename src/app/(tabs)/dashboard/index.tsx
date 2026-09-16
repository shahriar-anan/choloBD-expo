import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../../../providers/LanguageProvider';
import { ServiceAdminDashboard } from '../../../components/interface/ServiceAdminDashboard';
import { UserDashboard } from '../../../components/interface/UserDashboard';
import { EmployeeDashboard } from '../../../components/interface/EmployeeDashboard';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';

export default function DashboardPage() {
  const { auth, bookings, handleLogout, onRefresh, onPressBooking } = useDashboardLogic();
  const { currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    // Ensure content respects top inset on platforms where SafeAreaView alone may not be enough
    // (keeps layout stable when navigating back from nested routes)
  }, [insets.top]);

  // Refresh bookings whenever the dashboard screen is focused to ensure we show the main dashboard
  useFocusEffect(
    React.useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  // Render a different dashboard for service admins
  if (auth.user?.role === 'SERVICE_ADMIN') {
    return (
      <ServiceAdminDashboard
        userName={auth.user?.userName}
        email={auth.user?.email}
        imageUrl={auth.user?.imageUrl}
        role={auth.user?.role}
        userStatus={auth.user?.userStatus}
        onLogout={handleLogout}
      />
    );
  }

  // Render employee dashboard for employees
  if (auth.user?.role === 'EMPLOYEE') {
    return (
      <EmployeeDashboard
        userName={auth.user?.userName}
        email={auth.user?.email}
        imageUrl={auth.user?.imageUrl}
        role={auth.user?.role}
        userStatus={auth.user?.userStatus}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <UserDashboard
      userName={auth.user?.userName}
      email={auth.user?.email}
      imageUrl={auth.user?.imageUrl}
      role={auth.user?.role}
      userStatus={auth.user?.userStatus}
      onLogout={handleLogout}
    />
  );
}
