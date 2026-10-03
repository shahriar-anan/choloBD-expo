import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  isHotelServiceAdmin,
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
    if (!userId || String(role || '').toUpperCase() !== 'SERVICE_ADMIN') {
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
  const isServiceAdmin = String(role || '').toUpperCase() === 'SERVICE_ADMIN';
  const pending = Boolean(userId && isServiceAdmin && !known);

  return {
    pending,
    isHotelAdmin: isHotelServiceAdmin(role, known?.serviceType),
    role,
  };
}
