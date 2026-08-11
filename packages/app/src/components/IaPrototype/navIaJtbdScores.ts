import type { NavIaModel } from '@ansible/plugin-backstage-self-service';

export type JtbdScore = 'Pass' | 'Weak' | 'Fail' | 'n/a';

export type JtbdJob = {
  id: number;
  group: 'Core' | 'Cross-cutting' | 'Stress';
  title: string;
  scores: Record<NavIaModel, JtbdScore>;
  notes: string;
};

/** JTBD judgment scores for nav IA options (jobs 1–14 in totals; 15 Experiences kill-test). */
export const NAV_IA_JTBD_JOBS: JtbdJob[] = [
  {
    id: 1,
    group: 'Core',
    title: 'Run a template and find the result',
    scores: {
      flat: 'Weak',
      curated: 'Weak',
      hybrid: 'Weak',
      homeband: 'Weak',
      experiences: 'Pass',
    },
    notes:
      'All have Templates + Activity. Opt 5 experience Dashboard helps next step. Opt 1–4 stop at Activity (no Outcomes).',
  },
  {
    id: 2,
    group: 'Core',
    title: 'Return to something I created',
    scores: {
      flat: 'Weak',
      curated: 'Weak',
      hybrid: 'Weak',
      homeband: 'Weak',
      experiences: 'Weak',
    },
    notes:
      'No option has a dedicated Outcomes/artifact catalog now. Opt 1 Catalog is the wrong mental model for SME.',
  },
  {
    id: 3,
    group: 'Core',
    title: 'Do my primary day job in the right band',
    scores: {
      flat: 'Pass',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Weak',
    },
    notes:
      '1–4 expose the right objects by seat. Opt 5 requires entering the right experience first.',
  },
  {
    id: 4,
    group: 'Core',
    title: 'Orient after landing',
    scores: {
      flat: 'Weak',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Weak',
    },
    notes:
      'Opt 2/4 seat landings (Templates / repos / inventories). Opt 3 SME→Templates, others→Dashboard. Opt 1 always Home; Opt 5 mode-dependent.',
  },
  {
    id: 5,
    group: 'Core',
    title: 'Add a factory plugin without nav sprawl',
    scores: {
      flat: 'Weak',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Weak',
    },
    notes:
      '2–4 encode host+slots + job bands. Opt 1 invites phonebook growth. Opt 5 risks Experiences as product folders.',
  },
  {
    id: 6,
    group: 'Cross-cutting',
    title: 'Search for a known thing',
    scores: {
      flat: 'Pass',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Weak',
    },
    notes:
      '1/2 rail modal; 3 Home→Search page; 4 header + gated Home→Search (multi-band). Opt 5 adds mode-switcher chrome.',
  },
  {
    id: 7,
    group: 'Cross-cutting',
    title: 'Learn without leaving the product',
    scores: {
      flat: 'Pass',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Weak',
    },
    notes:
      'Docs + Learning Paths on the rail in Opt 1–4. Opt 5 has no Learn band — education not in the experience rails.',
  },
  {
    id: 8,
    group: 'Cross-cutting',
    title: 'Switch kind of work without losing the model',
    scores: {
      flat: 'Weak',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Weak',
      experiences: 'Fail',
    },
    notes:
      'Labeled bands (2/4) win. Opt 3 Home is fat (drawers help). Opt 5 forces a mode change.',
  },
  {
    id: 9,
    group: 'Cross-cutting',
    title: 'See posture across my areas (when multi-band)',
    scores: {
      flat: 'Weak',
      curated: 'Weak',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Pass',
    },
    notes:
      'Opt 3/4 gated Home Dashboard (multi-band). Opt 5 experience Dashboard. Opt 2 still no posture surface.',
  },
  {
    id: 10,
    group: 'Cross-cutting',
    title: 'Turn a plugin on/off',
    scores: {
      flat: 'Pass',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Pass',
    },
    notes: 'Compliance / RHEM toggles show-hide Operate objects in all models.',
  },
  {
    id: 11,
    group: 'Stress',
    title: 'SME density',
    scores: {
      flat: 'Weak',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Pass',
    },
    notes:
      'Opt 4 SME stays lean (no Home). Opt 3 SME now flat pins when Home is sole band. Multi-band Opt 3 still denser (drawers).',
  },
  {
    id: 12,
    group: 'Stress',
    title: 'Admin / multi-band density',
    scores: {
      flat: 'Fail',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Weak',
    },
    notes: 'Opt 1 fails scan test. Sections and collapsible bands scale better.',
  },
  {
    id: 13,
    group: 'Stress',
    title: 'Outcomes vs Activity vs Catalog',
    scores: {
      flat: 'Fail',
      curated: 'Weak',
      hybrid: 'Weak',
      homeband: 'Weak',
      experiences: 'Weak',
    },
    notes:
      'No Outcomes rail item in any option now. Opt 1 Catalog conflates discovery; 2–5 rely on Activity.',
  },
  {
    id: 14,
    group: 'Stress',
    title: 'Global Templates vs host Scaffold',
    scores: {
      flat: 'Pass',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Pass',
    },
    notes: 'Shared entity tab pattern; no second global Templates on the rail.',
  },
  {
    id: 15,
    group: 'Stress',
    title: 'Experiences worth the mode tax?',
    scores: {
      flat: 'n/a',
      curated: 'n/a',
      hybrid: 'n/a',
      homeband: 'n/a',
      experiences: 'Fail',
    },
    notes:
      'Placement does not require Experiences. Opt 5 does not beat Opt 2/3/4 enough to be the default shell.',
  },
];

function points(s: JtbdScore): number {
  if (s === 'Pass') return 2;
  if (s === 'Weak') return 1;
  return 0;
}

export type NavIaScorecard = {
  model: NavIaModel;
  sum: number;
  max: number;
  pct: number;
  passes: number;
  weaks: number;
  fails: number;
  jobs: Array<JtbdJob & { score: JtbdScore }>;
  killTest?: JtbdScore;
};

/** Totals for jobs 1–14; job 15 included in jobs list for display, not in sum. */
export function getNavIaScorecard(model: NavIaModel): NavIaScorecard {
  const all = NAV_IA_JTBD_JOBS.map(j => ({ ...j, score: j.scores[model] }));
  const countable = all.filter(j => j.id <= 14 && j.score !== 'n/a');
  const sum = countable.reduce((a, j) => a + points(j.score), 0);
  const max = countable.length * 2;
  const kill = all.find(j => j.id === 15)?.score;
  return {
    model,
    sum,
    max,
    pct: max ? Math.round((sum / max) * 100) : 0,
    passes: countable.filter(j => j.score === 'Pass').length,
    weaks: countable.filter(j => j.score === 'Weak').length,
    fails: countable.filter(j => j.score === 'Fail').length,
    jobs: all,
    killTest: kill && kill !== 'n/a' ? kill : undefined,
  };
}
