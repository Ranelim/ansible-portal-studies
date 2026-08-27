/**
 * Prototype demo jumper — Day 0 setup vs settled console.
 * Not product chrome. Third beat (just after Apply / Dual) comes later.
 */

export type SetupDemoMode = 'setup' | 'post-setup';

export const SETUP_DEMO_MODE_KEY = 'portal-setup-demo-mode';
export const SETUP_DEMO_EPOCH_KEY = 'portal-setup-demo-epoch';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function readSetupDemoMode(): SetupDemoMode {
  try {
    const raw = localStorage.getItem(SETUP_DEMO_MODE_KEY);
    if (raw === 'setup' || raw === 'post-setup') return raw;
  } catch {
    /* ignore */
  }
  return 'post-setup';
}

export function writeSetupDemoMode(next: SetupDemoMode) {
  try {
    localStorage.setItem(SETUP_DEMO_MODE_KEY, next);
  } catch {
    /* ignore */
  }
  notify();
}

export function readSetupDemoEpoch(): number {
  try {
    const raw = sessionStorage.getItem(SETUP_DEMO_EPOCH_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Remount the wizard so Setup always starts from-scratch. */
export function bumpSetupDemoEpoch(): number {
  const next = readSetupDemoEpoch() + 1;
  try {
    sessionStorage.setItem(SETUP_DEMO_EPOCH_KEY, String(next));
  } catch {
    /* ignore */
  }
  notify();
  return next;
}

export function subscribeSetupDemoMode(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
