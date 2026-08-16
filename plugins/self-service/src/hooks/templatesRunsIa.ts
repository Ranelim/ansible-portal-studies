/** Temp Automate shell compare — how Templates · Runs execute inside Automate. */

export type TemplatesRunsIaVariant = 'automate-rail' | 'masthead-plus';

export const TEMPLATES_RUNS_IA_KEY = 'portal-templates-runs-ia';

/** Set to force one option and hide the magenta bar. Null = compare UI on. */
export const FORCED_TEMPLATES_RUNS_IA: TemplatesRunsIaVariant | null = null;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function migrate(raw: string | null): TemplatesRunsIaVariant | null {
  if (raw === 'automate-rail' || raw === 'masthead-plus') return raw;
  // Prior toggler keys
  if (raw === 'siblings') return 'automate-rail';
  if (raw === 'bundled') return 'masthead-plus';
  return null;
}

export function readTemplatesRunsIa(): TemplatesRunsIaVariant {
  if (FORCED_TEMPLATES_RUNS_IA) return FORCED_TEMPLATES_RUNS_IA;
  try {
    const migrated = migrate(localStorage.getItem(TEMPLATES_RUNS_IA_KEY));
    if (migrated) return migrated;
  } catch {
    /* ignore */
  }
  return 'automate-rail';
}

export function writeTemplatesRunsIa(next: TemplatesRunsIaVariant) {
  try {
    localStorage.setItem(TEMPLATES_RUNS_IA_KEY, next);
  } catch {
    /* ignore */
  }
  notify();
}

export function subscribeTemplatesRunsIa(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Automate is always an experience (Bridge card + admin governable).
 * A/B only changes Templates/Runs chrome — not whether Automate exists.
 */
export function isAutomateExperienceEnabled(
  _variant: TemplatesRunsIaVariant = readTemplatesRunsIa(),
): boolean {
  return true;
}
