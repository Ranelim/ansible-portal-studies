/** Temp A/B — Experiences return chrome (design compare). */

export type ExperienceReturnChrome = 'quiet' | 'waffle';

export const RETURN_CHROME_KEY = 'portal-experience-return-chrome';

/**
 * Compare UI is hidden — force B (chevron by label).
 * Flip to `null` and remount `ExperienceReturnCompareBar` to bring A back.
 */
export const FORCED_RETURN_CHROME: ExperienceReturnChrome | null = 'waffle';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function readExperienceReturnChrome(): ExperienceReturnChrome {
  if (FORCED_RETURN_CHROME) return FORCED_RETURN_CHROME;
  try {
    const raw = localStorage.getItem(RETURN_CHROME_KEY);
    if (raw === 'quiet' || raw === 'waffle') return raw;
    // Former option C (pin) → quiet
    if (raw === 'pin') return 'quiet';
  } catch {
    /* ignore */
  }
  return 'quiet';
}

export function writeExperienceReturnChrome(next: ExperienceReturnChrome) {
  try {
    localStorage.setItem(RETURN_CHROME_KEY, next);
  } catch {
    /* ignore */
  }
  notify();
}

export function subscribeExperienceReturnChrome(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
