import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { isTravelerRole } from '../utilities/travelerShell';

export function useIsTraveler(): boolean {
  const role = useSelector((state: RootState) => state.auth.user?.role);
  return isTravelerRole(role);
}
