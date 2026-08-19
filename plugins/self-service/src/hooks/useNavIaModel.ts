import { useCallback, useEffect, useMemo, useState } from 'react';

/** Prototype IA models — switch to compare side by side. */
export type NavIaModel =
  | 'curated'
  | 'experiences'
  | 'flat'
  | 'hybrid'
  | 'homeband';

/**
 * Experiences for Option 5 (toggle). Availability depends on seat + plugins.
 * Templates/Activity are duplicated inside each experience's rail.
 *
 * Develop is one experience (nested rail under Git Repositories).
 * Legacy ids `develop-tabs` / `develop-drawer` / `develop-apme` normalize to `develop`.
 */
export type NavExperience =
  | 'all'
  | 'automate'
  | 'develop'
  | 'compliance'
  | 'edge'
  | 'admin';

const MODEL_KEY = 'portal-nav-ia-model';
const EXPERIENCE_KEY = 'portal-nav-experience';

/** Default for Experiences shell branch — Bridge + experience rails (not Opt 1–5 bakeoff). */
const DEFAULT_MODEL: NavIaModel = 'experiences';
const DEFAULT_EXPERIENCE: NavExperience = 'all';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function readModel(): NavIaModel {
  // Experiences shell branch: always experiences (ignore leftover bakeoff localStorage).
  try {
    const raw = localStorage.getItem(MODEL_KEY);
    if (raw && raw !== 'experiences') {
      localStorage.setItem(MODEL_KEY, 'experiences');
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_MODEL;
}

function normalizeExperience(raw: string | null): NavExperience | null {
  if (
    raw === 'all' ||
    raw === 'automate' ||
    raw === 'develop' ||
    raw === 'compliance' ||
    raw === 'edge' ||
    raw === 'admin'
  ) {
    return raw;
  }
  // Killed APME A/B ids + older Develop labels → one Develop experience
  if (
    raw === 'develop-tabs' ||
    raw === 'develop-drawer' ||
    raw === 'develop-apme' ||
    raw === 'develop-section'
  ) {
    try {
      localStorage.setItem(EXPERIENCE_KEY, 'develop');
    } catch {
      /* ignore */
    }
    return 'develop';
  }
  return null;
}

function readExperience(): NavExperience {
  try {
    return normalizeExperience(localStorage.getItem(EXPERIENCE_KEY)) ?? DEFAULT_EXPERIENCE;
  } catch {
    return DEFAULT_EXPERIENCE;
  }
}

export function writeNavIaModel(model: NavIaModel) {
  localStorage.setItem(MODEL_KEY, model);
  notify();
}

export function writeNavExperience(experience: NavExperience) {
  localStorage.setItem(EXPERIENCE_KEY, experience);
  notify();
}

/** Develop experience (nested Git Repositories rail). */
export function isDevelopExperience(experience: NavExperience): boolean {
  return experience === 'develop';
}

/** Nested rail: Repositories + Quality (Quality page tabs: Overview / Remediations / Scans). */
export function isDevelopReposRailMode(experience: NavExperience): boolean {
  return experience === 'develop';
}

export function availableExperiences(args: {
  role: string;
  isAdmin: boolean;
  compliance: boolean;
  rhem: boolean;
  /**
   * @deprecated Automate is always an experience. Kept for call-site compat; ignored.
   */
  includeAutomate?: boolean;
}): NavExperience[] {
  // SME locked to Automate.
  if (args.role === 'sme') {
    return ['automate'];
  }
  const list: NavExperience[] = ['all'];
  list.push('automate');
  if (args.role === 'developer' || args.isAdmin) {
    list.push('develop');
  }
  if ((args.role === 'operator' || args.isAdmin) && args.compliance) {
    list.push('compliance');
  }
  if ((args.role === 'operator' || args.isAdmin) && args.rhem) {
    list.push('edge');
  }
  if (args.isAdmin) list.push('admin');
  return list;
}

export const EXPERIENCE_LABELS: Record<NavExperience, string> = {
  all: 'Experiences',
  automate: 'Automate',
  develop: 'Develop',
  compliance: 'Compliance',
  edge: 'Edge',
  admin: 'Administration',
};

/** Shared across header + sidebar so IA model / experience stay in sync. */
export function useNavIaModel() {
  const [model, setModelState] = useState<NavIaModel>(readModel);
  const [experience, setExperienceState] = useState<NavExperience>(readExperience);

  useEffect(() => {
    const sync = () => {
      setModelState(readModel());
      setExperienceState(readExperience());
    };
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const setModel = useCallback((next: NavIaModel) => {
    localStorage.setItem(MODEL_KEY, next);
    setModelState(next);
    notify();
  }, []);

  const setExperience = useCallback((next: NavExperience) => {
    localStorage.setItem(EXPERIENCE_KEY, next);
    setExperienceState(next);
    notify();
  }, []);

  return useMemo(
    () => ({ model, setModel, experience, setExperience }),
    [model, setModel, experience, setExperience],
  );
}
