/** Admin Quick start — platform jobs, not per-experience wizards. */

export const QUICKSTART_PROGRESS_KEY = 'portal-quickstart-progress';
export const OPEN_QUICKSTART_EVENT = 'portal-open-quickstart';

/** Keep in sync with ADMIN_QUICKSTART_ITEMS in packages/app QuickstartContext. */
export const ADMIN_QUICKSTART_ITEM_IDS = [
  'connect-integrations',
  'configure-access',
  'setup-experiences',
  'review-sync',
] as const;

export type AdminQuickstartItemId = (typeof ADMIN_QUICKSTART_ITEM_IDS)[number];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function readQuickstartCompleted(): Set<string> {
  try {
    const stored = localStorage.getItem(QUICKSTART_PROGRESS_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function writeQuickstartCompleted(ids: Set<string>) {
  try {
    localStorage.setItem(QUICKSTART_PROGRESS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
  notify();
}

export function clearQuickstartCompleted() {
  try {
    localStorage.removeItem(QUICKSTART_PROGRESS_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

export function seedQuickstartCompleted() {
  writeQuickstartCompleted(new Set(ADMIN_QUICKSTART_ITEM_IDS));
}

export function quickstartRemainingCount(): number {
  const done = readQuickstartCompleted();
  return ADMIN_QUICKSTART_ITEM_IDS.filter(id => !done.has(id)).length;
}

export function openQuickstartPanel() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_QUICKSTART_EVENT));
  }
}

export function subscribeQuickstartProgress(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
