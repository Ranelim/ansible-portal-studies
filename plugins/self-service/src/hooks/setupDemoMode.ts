/**
 * Prototype demo jumper — three beats of the admin journey.
 * Not product chrome.
 *
 * landing    — Day 0 CLI → temp login → setup wizard
 * setup      — first session on the Portal (experiences still need Setup)
 * post-setup — integrations connected, every experience enabled
 */

export type SetupDemoMode = 'landing' | 'setup' | 'post-setup';

export const SETUP_DEMO_MODE_KEY = 'portal-setup-demo-mode';
export const SETUP_DEMO_EPOCH_KEY = 'portal-setup-demo-epoch';
const SETUP_DEMO_MODE_VERSION_KEY = 'portal-setup-demo-mode-v';
const MODE_VERSION = '3';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function isMode(raw: string | null): raw is SetupDemoMode {
  return raw === 'landing' || raw === 'setup' || raw === 'post-setup';
}

function migrateStoredMode(): SetupDemoMode {
  try {
    const version = localStorage.getItem(SETUP_DEMO_MODE_VERSION_KEY);
    const raw = localStorage.getItem(SETUP_DEMO_MODE_KEY);
    if (version === MODE_VERSION && isMode(raw)) return raw;
    // v2: setup = Day 0 wizard, post-setup = first Portal session
    let next: SetupDemoMode = 'setup';
    if (raw === 'setup') next = 'landing';
    else if (raw === 'post-setup') next = 'setup';
    else if (isMode(raw)) next = raw;
    localStorage.setItem(SETUP_DEMO_MODE_KEY, next);
    localStorage.setItem(SETUP_DEMO_MODE_VERSION_KEY, MODE_VERSION);
    return next;
  } catch {
    return 'setup';
  }
}

export function readSetupDemoMode(): SetupDemoMode {
  return migrateStoredMode();
}

export function writeSetupDemoMode(next: SetupDemoMode) {
  try {
    localStorage.setItem(SETUP_DEMO_MODE_KEY, next);
    localStorage.setItem(SETUP_DEMO_MODE_VERSION_KEY, MODE_VERSION);
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

/** Remount the Day 0 wizard so Landing always starts from-scratch. */
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
