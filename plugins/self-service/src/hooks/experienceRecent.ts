import type { NavExperience } from './useNavIaModel';

/** Switcher destinations — not Bridge (`all`). */
export type ExperienceId = Exclude<NavExperience, 'all'>;

/** Job-mode cards on Bridge. Administration = header CTA. Assistant = its own card. */
export const JOB_EXPERIENCE_IDS = [
  'automate',
  'develop',
  'compliance',
  'edge',
] as const;

export type JobExperienceId = (typeof JOB_EXPERIENCE_IDS)[number];

const SWITCHER_ORDER: ExperienceId[] = [
  'automate',
  'develop',
  'compliance',
  'edge',
  'assistant',
  'admin',
];

export const EXPERIENCE_LANDING: Record<ExperienceId, string> = {
  automate: '/create?scope=experience',
  develop: '/self-service/repositories/list',
  compliance: '/self-service/experience-dashboard',
  edge: '/self-service/experience-dashboard',
  assistant: '/self-service/assistant',
  admin: '/self-service/admin/overview',
};

function asExperienceId(raw: unknown): ExperienceId | null {
  if (
    raw === 'develop-tabs' ||
    raw === 'develop-drawer' ||
    raw === 'develop-apme' ||
    raw === 'develop-section'
  ) {
    return 'develop';
  }
  if (typeof raw === 'string' && (SWITCHER_ORDER as string[]).includes(raw)) {
    return raw as ExperienceId;
  }
  return null;
}

const RECENT_KEY = 'portal-experience-recent';

export function readRecentExperiences(): ExperienceId[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const seen = new Set<ExperienceId>();
    const out: ExperienceId[] = [];
    for (const item of raw) {
      const id = asExperienceId(item);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  } catch {
    return [];
  }
}

export function pushRecentExperience(id: ExperienceId) {
  const next = [id, ...readRecentExperiences().filter(x => x !== id)].slice(
    0,
    8,
  );
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Available destinations: recents first, Administration last. */
export function sortExperiencesByRecent(
  available: ExperienceId[],
  recent: ExperienceId[] = readRecentExperiences(),
): ExperienceId[] {
  const rank = new Map(recent.map((id, i) => [id, i]));
  const order = new Map(SWITCHER_ORDER.map((id, i) => [id, i]));
  return [...available].sort((a, b) => {
    if (a === 'admin' || b === 'admin') {
      if (a === 'admin') return 1;
      if (b === 'admin') return -1;
    }
    const ra = rank.has(a) ? rank.get(a)! : 999;
    const rb = rank.has(b) ? rank.get(b)! : 999;
    if (ra !== rb) return ra - rb;
    return (order.get(a) ?? 99) - (order.get(b) ?? 99);
  });
}
