import type { Router } from 'expo-router';
import { store } from '../store/store';
import { roleHome } from './travelerShell';

/** `router.back()` that lands on the role home when the screen was opened without history. */
export function goBack(router: Router): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(roleHome(store.getState().auth.user?.role));
}
