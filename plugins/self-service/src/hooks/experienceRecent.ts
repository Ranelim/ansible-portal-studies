import type { NavExperience } from './useNavIaModel';

/** Job-mode experiences — not Bridge (`all`) or Administration. */
export type ExperienceId = Exclude<NavExperience, 'all' | 'admin'>;

const RECENT_KEY = 'portal-experience-recent';

const JOB_IDS: ExperienceId[] = [
  'automate',
  'develop',
  'compliance',
  'edge',
];

export const EXPERIENCE_LANDING: Record<ExperienceId, string> = {
  automate: '/create?scope=experience',
  develop: '/self-service/repositories/list',
  compliance: '/self-service/experience-dashboard',
  edge: '/self-service/experience-dashboard',
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
  if (typeof raw === 'string' && (JOB_IDS as string[]).includes(raw)) {
    return raw as ExperienceId;
  }
  return null;
}

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

/** Available experiences, most recently entered first. */
export function sortExperiencesByRecent(
  available: ExperienceId[],
  recent: ExperienceId[] = readRecentExperiences(),
): ExperienceId[] {
  const rank = new Map(recent.map((id, i) => [id, i]));
  return [...available].sort((a, b) => {
    const ra = rank.has(a) ? rank.get(a)! : 999;
    const rb = rank.has(b) ? rank.get(b)! : 999;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}
