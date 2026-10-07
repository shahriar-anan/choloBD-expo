import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  isHotelEmployee,
  isHotelServiceAdmin,
  isTransportServiceAdmin,
  loadOperatorAssignment,
  readOperatorAssignment,
  subscribeOperatorAssignment,
} from '../utilities/operatorAssignment';

export function useHotelAdminSession() {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const [, setTick] = useState(0);

  useEffect(() => subscribeOperatorAssignment(() => setTick((value) => value + 1)), []);

  useEffect(() => {
    const normalized = String(role || '').toUpperCase();
    if (!userId || (normalized !== 'SERVICE_ADMIN' && normalized !== 'EMPLOYEE')) {
      return;
    }
    let active = true;
    void loadOperatorAssignment(userId).finally(() => {
      if (active) {
        setTick((value) => value + 1);
      }
    });
    return () => {
      active = false;
    };
  }, [userId, role]);

  const known = readOperatorAssignment(userId);
  const normalized = String(role || '').toUpperCase();
  const needsAssignment = normalized === 'SERVICE_ADMIN' || normalized === 'EMPLOYEE';
  const pending = Boolean(userId && needsAssignment && !known);

  return {
    pending,
    isHotelAdmin: isHotelServiceAdmin(role, known?.serviceType),
    isHotelEmployee: isHotelEmployee(role, known?.employeeServiceType),
    isTransportAdmin: isTransportServiceAdmin(role, known?.serviceType),
    role,
  };
}
