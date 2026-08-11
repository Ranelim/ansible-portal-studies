import type { NavIaModel } from '@ansible/plugin-backstage-self-service';

export type JtbdScore = 'Pass' | 'Weak' | 'Fail' | 'n/a';

export type JtbdJob = {
  id: number;
  group: 'Core' | 'Cross-cutting' | 'Stress';
  title: string;
  /** One-line plain language for reviewers — what this job is asking. */
  meaning: string;
  scores: Record<NavIaModel, JtbdScore>;
  /** Scoring rationale for this option set (why Pass/Weak/Fail). */
  notes: string;
};

/** JTBD judgment scores for nav IA options (jobs 1–14 in totals; 15 Experiences kill-test). */
export const NAV_IA_JTBD_JOBS: JtbdJob[] = [
  {
    id: 1,
    group: 'Core',
    title: 'Run a template and find the result',
    meaning:
      'Can I start automation and then find that run without getting lost?',
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
    meaning:
      'Can I come back later to an artifact or output of past work (not only the live run list)?',
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
    meaning:
      'Does my seat see the right work area and objects (SME→run, Dev→repos, Ops→inventories/fleets)?',
    scores: {
      flat: 'Pass',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Pass',
    },
    notes:
      '1–4 expose the right objects by seat. Opt 5 SME is locked in Automate (no mode pick). Dev/Ops/Admin still choose an experience.',
  },
  {
    id: 4,
    group: 'Core',
    title: 'Orient after landing',
    meaning:
      'Does the first screen make sense for who I am — or do I land in the wrong Home/mode?',
    scores: {
      flat: 'Weak',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Pass',
    },
    notes:
      'Opt 2/4 seat landings. Opt 3 SME→Templates, others→Dashboard. Opt 5 SME→Automate/Templates (no All bridge); other seats still land All or pick a mode.',
  },
  {
    id: 5,
    group: 'Core',
    title: 'Add a factory plugin without nav sprawl',
    meaning:
      'Can a new capability land as a tab on an existing object — not another left-nav row?',
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
    meaning: 'Can I find a known item quickly without hunting the rail?',
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
    meaning: 'Are docs / learning reachable from the shell without a dead end?',
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
    meaning:
      'Can I move Develop ↔ Operate ↔ Run and still feel like one product with one map (not a mode reboot)?',
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
    meaning:
      'If I work in more than one area, can I see a cross-cutting overview / health when I need it?',
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
    meaning:
      'When Compliance or RHEM is toggled, does related nav appear/disappear cleanly?',
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
    meaning: 'Is the SME rail lean enough for a non-power user?',
    scores: {
      flat: 'Weak',
      curated: 'Pass',
      hybrid: 'Pass',
      homeband: 'Pass',
      experiences: 'Pass',
    },
    notes:
      'Opt 4 SME stays lean (no Home). Opt 3 SME flat pins when Home is sole band. Opt 5 SME: Automate only, Experience dropdown hidden — lean Templates/Activity/Catalog/Settings.',
  },
  {
    id: 12,
    group: 'Stress',
    title: 'Admin / multi-band density',
    meaning:
      'Can an Admin (or multi-band seat) scan the rail without an unlabeled phonebook?',
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
    meaning:
      'Do “my runs,” “my artifacts,” and “discovery catalog” stay distinct — or collide and confuse?',
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
    meaning:
      'Is portal-wide Templates separate from “Scaffold” on an object page — no double story?',
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
    meaning:
      'Is forcing a job-mode switch worth it vs sections + object homes — enough to be the default shell? (Kill-test; not in % total.)',
    scores: {
      flat: 'n/a',
      curated: 'n/a',
      hybrid: 'n/a',
      homeband: 'n/a',
      experiences: 'Fail',
    },
    notes:
      'SME lock removes mode tax for the primary seat, but placement still does not require Experiences. Opt 5 does not beat Opt 2/3/4 enough to be the default shell.',
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
