/** Temp Integrations orientation compare — current vs first-time admin. */

export type IntegrationsOrientVariant = 'current' | 'orient';

export const INTEGRATIONS_ORIENT_KEY = 'portal-integrations-orient';

/**
 * Parked: lock first-time admin orientation. Compare bar is hidden.
 * Set to `null` to revive Current vs First-time admin in Administration.
 */
export const FORCED_INTEGRATIONS_ORIENT: IntegrationsOrientVariant | null =
  'orient';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function readIntegrationsOrient(): IntegrationsOrientVariant {
  if (FORCED_INTEGRATIONS_ORIENT) return FORCED_INTEGRATIONS_ORIENT;
  try {
    const raw = localStorage.getItem(INTEGRATIONS_ORIENT_KEY);
    if (raw === 'current' || raw === 'orient') return raw;
  } catch {
    /* ignore */
  }
  return 'orient';
}

export function writeIntegrationsOrient(next: IntegrationsOrientVariant) {
  try {
    localStorage.setItem(INTEGRATIONS_ORIENT_KEY, next);
  } catch {
    /* ignore */
  }
  notify();
}

export function subscribeIntegrationsOrient(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
