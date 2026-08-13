/** Temp Admin Sync IA compare — Opt 1 (merge) vs Opt 2 (Sync activity + Run sync). */

export type AdminSyncIaVariant = 'opt1' | 'opt2';

export const ADMIN_SYNC_IA_KEY = 'portal-admin-sync-ia';

/**
 * Force Admin Sync IA while magenta compare bar is parked.
 * Opt 1 = Taufique preference (connections-centric / merge under Integrations).
 * Set null to restore the compare bar + localStorage switching.
 * Opt 2 code paths stay intact for A/B revive.
 */
export const FORCED_ADMIN_SYNC_IA: AdminSyncIaVariant | null = 'opt1';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function readAdminSyncIa(): AdminSyncIaVariant {
  if (FORCED_ADMIN_SYNC_IA) return FORCED_ADMIN_SYNC_IA;
  try {
    const raw = localStorage.getItem(ADMIN_SYNC_IA_KEY);
    if (raw === 'opt1' || raw === 'opt2') return raw;
    // Retired "existing" → default Opt 1
  } catch {
    /* ignore */
  }
  return 'opt1';
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
