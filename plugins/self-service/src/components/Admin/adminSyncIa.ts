/** Temp Admin Sync IA compare — Existing vs Opt 1 (merge) vs Opt 2 (scoped Run sync). */

export type AdminSyncIaVariant = 'existing' | 'opt1' | 'opt2';

export const ADMIN_SYNC_IA_KEY = 'portal-admin-sync-ia';

/** Null while magenta compare bar is active. */
export const FORCED_ADMIN_SYNC_IA: AdminSyncIaVariant | null = null;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function readAdminSyncIa(): AdminSyncIaVariant {
  if (FORCED_ADMIN_SYNC_IA) return FORCED_ADMIN_SYNC_IA;
  try {
    const raw = localStorage.getItem(ADMIN_SYNC_IA_KEY);
    if (raw === 'existing' || raw === 'opt1' || raw === 'opt2') return raw;
  } catch {
    /* ignore */
  }
  return 'existing';
}

export function writeAdminSyncIa(next: AdminSyncIaVariant) {
  try {
    localStorage.setItem(ADMIN_SYNC_IA_KEY, next);
  } catch {
    /* ignore */
  }
  notify();
}

export function subscribeAdminSyncIa(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
