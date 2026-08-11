import type { NavIaModel } from '@ansible/plugin-backstage-self-service';

export type VisualSeat = 'SME' | 'Developer' | 'Operator' | 'Admin';
export type VisualDim = 'Cognitive load' | 'Clarity' | 'Orientation';
export type VisualGrade = 1 | 2 | 3 | 4 | 5;

const SEATS: VisualSeat[] = ['SME', 'Developer', 'Operator', 'Admin'];
const DIMS: VisualDim[] = ['Cognitive load', 'Clarity', 'Orientation'];

/** Rail item counts from screenshot capture (Ops = ops-both). */
export const NAV_IA_VISUAL_RAIL_ITEMS: Record<
  NavIaModel,
  Record<VisualSeat, number>
> = {
  flat: { SME: 6, Developer: 10, Operator: 9, Admin: 16 },
  curated: { SME: 7, Developer: 11, Operator: 10, Admin: 19 },
  hybrid: { SME: 6, Developer: 12, Operator: 11, Admin: 21 },
  homeband: { SME: 5, Developer: 11, Operator: 10, Admin: 19 },
  // SME Automate lock — no Experience dropdown (Templates, Activity, Catalog, Settings)
  experiences: { SME: 4, Developer: 8, Operator: 4, Admin: 5 },
};

/**
 * 1–5 visual scores from live rail screenshots (cognitive load, clarity, orientation).
 * Source: scratch/nav-ia-visual-eval/ · Aug 11 2026.
 */
export const NAV_IA_VISUAL_SCORES: Record<
  NavIaModel,
  Record<VisualSeat, Record<VisualDim, VisualGrade>>
> = {
  flat: {
    SME: { 'Cognitive load': 4, Clarity: 4, Orientation: 4 },
    Developer: { 'Cognitive load': 3, Clarity: 2, Orientation: 3 },
    Operator: { 'Cognitive load': 3, Clarity: 2, Orientation: 3 },
    Admin: { 'Cognitive load': 1, Clarity: 1, Orientation: 2 },
  },
  curated: {
    SME: { 'Cognitive load': 4, Clarity: 5, Orientation: 5 },
    Developer: { 'Cognitive load': 4, Clarity: 5, Orientation: 5 },
    Operator: { 'Cognitive load': 4, Clarity: 5, Orientation: 5 },
    Admin: { 'Cognitive load': 3, Clarity: 5, Orientation: 4 },
  },
  hybrid: {
    SME: { 'Cognitive load': 5, Clarity: 5, Orientation: 5 },
    Developer: { 'Cognitive load': 4, Clarity: 5, Orientation: 5 },
    Operator: { 'Cognitive load': 4, Clarity: 5, Orientation: 5 },
    Admin: { 'Cognitive load': 3, Clarity: 5, Orientation: 5 },
  },
  homeband: {
    SME: { 'Cognitive load': 4, Clarity: 4, Orientation: 4 },
    Developer: { 'Cognitive load': 4, Clarity: 4, Orientation: 4 },
    Operator: { 'Cognitive load': 4, Clarity: 4, Orientation: 4 },
    Admin: { 'Cognitive load': 3, Clarity: 4, Orientation: 4 },
  },
  experiences: {
    // After SME→Automate lock + hidden switcher (Aug 11 2026)
    SME: { 'Cognitive load': 5, Clarity: 5, Orientation: 5 },
    Developer: { 'Cognitive load': 4, Clarity: 4, Orientation: 4 },
    Operator: { 'Cognitive load': 5, Clarity: 2, Orientation: 1 },
    Admin: { 'Cognitive load': 5, Clarity: 2, Orientation: 1 },
  },
};

const VISUAL_READ: Record<NavIaModel, Record<VisualSeat, string>> = {
  flat: {
    SME: 'Clean short pin list; Learn mixed with work pins',
    Developer: 'Phonebook after divider; no Develop cue',
    Operator: 'Fleets/Inventories unlabeled among pins',
    Admin: 'Long unlabeled list; Admin drawer at bottom',
  },
  curated: {
    SME: 'Pins + LEARN — education clearly separated',
    Developer: 'DEVELOP band reads immediately',
    Operator: 'OPERATE band reads immediately',
    Admin: 'All bands labeled; long but structured',
  },
  hybrid: {
    SME: 'Best SME: RUN + LEARN only (no Home)',
    Developer: 'HOME → RUN → DEVELOP — denser, still clear',
    Operator: 'HOME → RUN → OPERATE — denser, still clear',
    Admin: 'HOME + Run + all bands; Dashboard helps orient',
  },
  homeband: {
    SME: 'Flat pins (no Outcomes); closer to Opt 2 SME density',
    Developer: 'HOME with Dashboard + Search + run + Learn; drawers help',
    Operator: 'HOME then OPERATE; no Outcomes',
    Admin: 'Still dense; collapse required; Dashboard kept',
  },
  experiences: {
    SME: 'Locked Automate — no switcher; Templates landing',
    Developer: 'Focused Develop mode rail',
    Operator: 'Stuck on All — Operate objects missing',
    Admin: 'Stuck on All — work hidden behind mode',
  },
};

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export type NavIaVisualScorecard = {
  model: NavIaModel;
  /** Average of 1–5 grades across seats × dimensions */
  avg: number;
  /** avg mapped to 0–100 for badge parity with JTBD % */
  pct: number;
  byDim: Record<VisualDim, number>;
  bySeat: Array<{
    seat: VisualSeat;
    items: number;
    cognitiveLoad: VisualGrade;
    clarity: VisualGrade;
    orientation: VisualGrade;
    seatAvg: number;
    read: string;
  }>;
};

export function getNavIaVisualScorecard(
  model: NavIaModel,
): NavIaVisualScorecard {
  const scores = NAV_IA_VISUAL_SCORES[model];
  const items = NAV_IA_VISUAL_RAIL_ITEMS[model];
  const all: number[] = [];
  for (const seat of SEATS) {
    for (const dim of DIMS) all.push(scores[seat][dim]);
  }
  const overall = avg(all);
  const byDim = Object.fromEntries(
    DIMS.map(dim => [dim, avg(SEATS.map(s => scores[s][dim]))]),
  ) as Record<VisualDim, number>;

  return {
    model,
    avg: overall,
    pct: Math.round((overall / 5) * 100),
    byDim,
    bySeat: SEATS.map(seat => {
      const s = scores[seat];
      const seatAvg = avg(DIMS.map(d => s[d]));
      return {
        seat,
        items: items[seat],
        cognitiveLoad: s['Cognitive load'],
        clarity: s.Clarity,
        orientation: s.Orientation,
        seatAvg,
        read: VISUAL_READ[model][seat],
      };
    }),
  };
}
