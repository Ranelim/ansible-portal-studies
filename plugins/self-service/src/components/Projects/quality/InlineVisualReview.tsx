/**
 * Visual redesign of Inline AI Results & Remediation (`?wizard=visual`).
 * Structure follows the ephemeral step-2 prototype: Continue under the
 * stepper, Summary (severity), then findings. Current: Auto-fix / AI-fix /
 * Manual fix. Current redesign: All / Auto-fix / AI-fix / Manual fix. AI spend
 * lives with Generate AI suggestions (Lightspeed quota — no fake
 * token or dollar estimates). `ctaLayout=footer` parks Continue in a sticky
 * footer instead. `reviewLayout=redesign` is a fork of Current: All tab,
 * Actions + Generate under the showing count, Continue in a sticky footer.
 * `redesign3` starts as a duplicate of that fork. `redesign4` copies
 * Redesign 3: compact Accept / Decline toggle (undecided / accepted /
 * declined). Auto-accept all auto-fixes checkbox seeds Accepted. Accept
 * remaining takes only undecided rows. Continue commits accepted remediations.
 * Redesign 4 groups findings that share a ContentGraph path (`yamlPath`) into
 * one card with one Accept / Decline. Single-finding cards stay unchanged.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, Fragment, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { HeaderTabs } from '@backstage/core-components';
import {
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { fade, type Theme } from '@material-ui/core/styles';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import CodeIcon from '@material-ui/icons/Code';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import {
  APME_CATEGORY_HINT,
  APME_CATEGORY_LABEL,
  APME_CATEGORY_ORDER,
  SEVERITY_COLORS,
  apmeCategoryOf,
  type ApmeRuleCategory,
  type QualityViolation,
  type SeverityClass,
} from '../detail/qualityDemoData';
import { SeverityFilterChips } from './SeverityFilterChips';
import { SeverityMixBar } from './SeverityMixBar';
import {
  findingKey,
  kindLabel,
  nodeKey,
  type AiRowStatus,
  type WizardDecision,
} from './SpaRemediationReview';
import { snippetForRule } from './spaWizardSnippets';
import { splitDiff, unifiedDiff, type DiffLine } from './qualityDiff';
import { ReadCountBadge } from '../../common/ReadCountBadge';
import { statusColors } from '../../common/statusColors';

const PILL = { borderRadius: 20, textTransform: 'none' as const, fontWeight: 600 };
const PILL_COMPACT = { ...PILL, minWidth: 0, padding: '2px 12px' };
/** Header-slot control — same 28px row as Accept / Decline. */
const HEADER_ACTION = {
  ...PILL,
  minWidth: 0,
  minHeight: 28,
  height: 28,
  padding: '0 12px',
  boxSizing: 'border-box' as const,
};
const ROW_TOGGLE_SX = {
  height: 28,
  minHeight: 28,
  py: 0,
  px: '10px',
  textTransform: 'none' as const,
  fontWeight: 500,
  '& .MuiSvgIcon-root': { fontSize: 14 },
};

/** MUI v5 ToggleButton theme wins over JSS — selected fill must live in `sx`. */
const ACCEPT_TOGGLE_SX = {
  ...ROW_TOGGLE_SX,
  '&.Mui-selected': {
    backgroundColor: `${statusColors.success} !important`,
    color: '#fff !important',
    borderColor: `${statusColors.success} !important`,
    '& .MuiSvgIcon-root': { color: '#fff !important' },
    '&:hover': {
      backgroundColor: '#3D7317 !important',
      borderColor: '#3D7317 !important',
      color: '#fff !important',
    },
  },
  '&.Mui-selected.Mui-disabled': {
    backgroundColor: `${statusColors.success} !important`,
    color: '#fff !important',
    borderColor: `${statusColors.success} !important`,
    opacity: 1,
    '& .MuiSvgIcon-root': { color: '#fff !important' },
  },
};

const DECLINE_TOGGLE_SX = {
  ...ROW_TOGGLE_SX,
  '&.Mui-selected': {
    backgroundColor: `${statusColors.error} !important`,
    color: '#fff !important',
    borderColor: `${statusColors.error} !important`,
    '& .MuiSvgIcon-root': { color: '#fff !important' },
    '&:hover': {
      backgroundColor: '#A30000 !important',
      borderColor: '#A30000 !important',
      color: '#fff !important',
    },
  },
  '&.Mui-selected.Mui-disabled': {
    backgroundColor: `${statusColors.error} !important`,
    color: '#fff !important',
    borderColor: `${statusColors.error} !important`,
    opacity: 1,
    '& .MuiSvgIcon-root': { color: '#fff !important' },
  },
};
const DIFF_TOGGLE_SX = {
  height: 32,
  minHeight: 32,
  width: 32,
  minWidth: 32,
  p: 0,
};

const DiffStackedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect
      x="1.75"
      y="1.75"
      width="12.5"
      height="5"
      rx="1.25"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="1.75"
      y="9.25"
      width="12.5"
      height="5"
      rx="1.25"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const DiffSplitIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect
      x="1.75"
      y="1.75"
      width="5"
      height="12.5"
      rx="1.25"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="9.25"
      y="1.75"
      width="5"
      height="12.5"
      rx="1.25"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const LightspeedSpark = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

export type CtaLayout = 'current' | 'footer';
/** Current = Continue under the stepper. Redesign / 3 / 4 = forks of Current. */
export type ReviewLayout = 'current' | 'redesign' | 'redesign3' | 'redesign4';
/** Discrete visual session: results (read-only) then auto then AI. Review = without-results post-scan (autos + remainder). Autofix = with-results Auto remediations (autos only). Bundled keeps all lanes on one step. */
export type ReviewPhase = 'bundled' | 'results' | 'work' | 'review' | 'autofix' | 'ai';

function showsResultsMix(phase: ReviewPhase): boolean {
  return phase === 'results' || phase === 'work';
}

/** Severity chips + category bars + search/content type (Findings, Auto, AI). */
function showsFindingsFilters(phase: ReviewPhase): boolean {
  return (
    phase === 'results' ||
    phase === 'autofix' ||
    phase === 'ai' ||
    phase === 'review'
  );
}

/** Combined post-scan step (no separate Results). */
function isCombinedPhase(phase: ReviewPhase): boolean {
  return phase === 'work' || phase === 'review';
}

/** Auto remediations decide chrome — With findings Auto step and Without findings. */
function isAutoDecidePhase(phase: ReviewPhase): boolean {
  return phase === 'review' || phase === 'autofix';
}

/** Visual session: Auto / AI / Manual use “remediation”, not “fix”. */
function usesRemediationVocab(phase: ReviewPhase): boolean {
  return (
    phase === 'results' ||
    phase === 'autofix' ||
    phase === 'ai' ||
    isCombinedPhase(phase)
  );
}

export function isRedesignLayout(layout: ReviewLayout): boolean {
  return layout === 'redesign' || layout === 'redesign3' || layout === 'redesign4';
}

const SEV_LABEL: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

type FixLane = 'Auto-fix' | 'AI-fix' | 'Manual-fix';
type ReviewTab = 'All' | FixLane;
const SEV_ORDER: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];
const FINDINGS_BAR_HEIGHT = 6;
const LANE_TABS: FixLane[] = ['Auto-fix', 'AI-fix', 'Manual-fix'];
const REDESIGN_TABS: ReviewTab[] = ['All', 'Auto-fix', 'AI-fix', 'Manual-fix'];
const WORK_TABS: ReviewTab[] = ['All', 'Auto-fix', 'AI-fix', 'Manual-fix'];
const TAB_LABEL: Record<FixLane, string> = {
  'Auto-fix': 'Auto-fix',
  'AI-fix': 'AI-fix',
  'Manual-fix': 'Manual-fix',
};

const REMEDIATION_LANE_LABEL: Record<FixLane, string> = {
  'Auto-fix': 'Auto remediation',
  'AI-fix': 'AI remediation',
  'Manual-fix': 'Manual remediation',
};

const REVIEW_TAB_LABEL: Record<FixLane, string> = {
  'Auto-fix': 'Auto remediations',
  'AI-fix': 'Needs AI',
  'Manual-fix': 'Manual only',
};

const FINDINGS_TAB_LABEL: Record<ReviewTab, string> = {
  All: 'All',
  'Auto-fix': 'Auto remediations',
  'AI-fix': 'Requires AI remediation',
  'Manual-fix': 'Manual remediation only',
};

function findingsTabCountLabel(tab: ReviewTab, n: number): string {
  if (tab === 'All') return `${n} findings`;
  if (tab === 'Auto-fix') {
    return n === 1 ? '1 auto remediation' : `${n} auto remediations`;
  }
  if (tab === 'AI-fix') {
    return n === 1 ? '1 requires AI remediation' : `${n} require AI remediation`;
  }
  return n === 1 ? '1 manual remediation only' : `${n} manual remediations only`;
}

function laneFilterLabel(lane: FixLane, phase: ReviewPhase): string {
  return usesRemediationVocab(phase) ? REMEDIATION_LANE_LABEL[lane] : TAB_LABEL[lane];
}

function laneBadgeLabel(lane: FixLane, _phase?: ReviewPhase): string {
  return REMEDIATION_LANE_LABEL[lane];
}

const TAB_COUNT_LABEL: Record<FixLane, (n: number) => string> = {
  'Auto-fix': n => `${n} auto-fixes`,
  'AI-fix': n => `${n} AI-fixes`,
  'Manual-fix': n => `${n} manual ${n === 1 ? 'fix' : 'fixes'}`,
};

function reviewTabLabel(tab: ReviewTab, redesign: boolean, redesign3 = false): string {
  if (redesign3) {
    if (tab === 'All') return 'All findings';
    if (tab === 'Auto-fix') return 'Auto-fix remediations';
    if (tab === 'AI-fix') return 'AI-fix remediations';
    return 'Manual remediations';
  }
  if (tab === 'All') return 'All';
  return TAB_LABEL[tab];
}

function reviewLaneCountLabel(tab: ReviewTab, n: number): string {
  if (tab === 'All') return `${n} findings`;
  if (tab === 'Auto-fix') return `${n} auto remediations`;
  if (tab === 'AI-fix') {
    return n === 1 ? '1 finding that needs AI' : `${n} findings that need AI`;
  }
  return n === 1 ? '1 manual-only finding' : `${n} manual-only findings`;
}

function reviewTabCountLabel(
  tab: ReviewTab,
  n: number,
  redesign: boolean,
  redesign3 = false,
): string {
  if (redesign3) {
    if (tab === 'All') return `${n} findings`;
    if (tab === 'Auto-fix') return `${n} auto-fix remediations`;
    if (tab === 'AI-fix') return `${n} AI-fix remediations`;
    return `${n} manual remediations`;
  }
  if (tab === 'All') return `${n} findings`;
  return TAB_COUNT_LABEL[tab](n);
}

const REDESIGN_TAB_HINT: Record<ReviewTab, string> = {
  All: 'Auto-fix, AI-fix, and Manual-fix findings together.',
  'Auto-fix': 'Ready-made replacements from Ansible quality rules.',
  'AI-fix': 'Optional Lightspeed suggestions. Generating uses quota.',
  'Manual-fix': 'No suggestion. Change these in the file, or leave them.',
};

/** Short definition for tab and chip tooltips. */
const LANE_EXPLAIN: Record<FixLane, string> = {
  'Auto-fix': 'Ready-made replacements from Ansible quality rules.',
  'AI-fix': 'Eligible for an AI-generated suggestion you review before it goes in the PR.',
  'Manual-fix': 'No automatic or AI suggestion. Change this in the file, or leave it.',
};

const AUTO_FIX_EXPLAIN =
  'Ready-made replacements from Ansible quality rules.';

const AUTO_STEP_DESC =
  'Each auto remediation is a ready-made replacement from this scan, and is already accepted for the pull request. Decline any you do not want included.';

const AI_STEP_DESC =
  'Generate a suggestion with Lightspeed, then accept or decline it.';

function autoRemediationJobTitle(count: number): string {
  return count === 1
    ? 'Accept or decline 1 auto remediation'
    : `Accept or decline ${count} auto remediations`;
}

function aiRemediationJobTitle(count: number): string {
  return count === 1
    ? 'Generate 1 AI remediation'
    : `Generate ${count} AI remediations`;
}

function findingsJobTitle(count: number): string {
  return count === 1 ? 'Review 1 finding' : `Review ${count} findings`;
}

const RESULTS_MANUAL_BODY =
  'Not auto-fixable or eligible for AI. Change this in the file, or leave it.';

const RESULTS_AI_BODY =
  'Requires an AI suggestion. Generate it on the next step.';

const FINDINGS_AI_BODY =
  'Select this finding on the AI remediations step and generate a suggestion. That step comes after Auto remediations.';

const FINDINGS_MANUAL_BODY =
  'Manual only. Change this in the file. It is not part of this remediation flow.';

const REVIEW_AI_TAB_HINT =
  'Suggestions are generated on the next step.';

const REVIEW_MANUAL_TAB_HINT =
  'No automatic or AI suggestion. Change these in the file, or leave them.';

const INCLUDE_MENU_EXPLAIN = {
  auto: AUTO_FIX_EXPLAIN,
  ai: 'Suggested replacements you generate for a finding, then review.',
};

const AUTO_ACCEPT_EXPLAIN =
  `${AUTO_FIX_EXPLAIN} They start accepted. Decline any you do not want in the PR.`;

const REVIEW_INCLUDE_EXPLAIN =
  `${AUTO_FIX_EXPLAIN} Accept all remaining, or accept or decline each one before you continue.`;

type BulkPolicyId =
  | 'accept-auto'
  | 'decline-auto'
  | 'accept-all'
  | 'decline-all'
  | 'accept-ai'
  | 'decline-ai'
  | 'mixed';

function laneUniform(
  items: QualityViolation[],
  decisions: Record<string, WizardDecision>,
  value: WizardDecision,
): boolean {
  return items.length > 0 && items.every(v => decisions[findingKey(v)] === value);
}

function laneUntouched(
  items: QualityViolation[],
  decisions: Record<string, WizardDecision>,
): boolean {
  return items.every(v => {
    const d = decisions[findingKey(v)];
    return d !== 'accept' && d !== 'decline';
  });
}

function deriveBulkPolicy(
  auto: QualityViolation[],
  ai: QualityViolation[],
  readyAi: QualityViolation[],
  t1Decisions: Record<string, WizardDecision>,
  aiDecisions: Record<string, WizardDecision>,
): BulkPolicyId {
  const autoAccept = laneUniform(auto, t1Decisions, 'accept');
  const autoDecline = laneUniform(auto, t1Decisions, 'decline');
  const autoUntouched = laneUntouched(auto, t1Decisions);
  const aiUntouched = laneUntouched(ai, aiDecisions);
  const readyAccept = laneUniform(readyAi, aiDecisions, 'accept');
  const aiDecline = laneUniform(ai, aiDecisions, 'decline');

  if (autoAccept && aiUntouched) return 'accept-auto';
  if (autoDecline && aiUntouched) return 'decline-auto';
  if (readyAccept && autoUntouched) return 'accept-ai';
  if (aiDecline && autoUntouched) return 'decline-ai';
  if (autoAccept && readyAccept) return 'accept-all';
  if (autoDecline && (ai.length === 0 || aiDecline)) return 'decline-all';
  return 'mixed';
}

function laneOf(v: QualityViolation): FixLane {
  if (v.fixTier === 'deterministic') return 'Auto-fix';
  if (v.fixTier === 'ai') return 'AI-fix';
  return 'Manual-fix';
}

function emptySev(): Record<SeverityClass, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function mixFromFindings(findings: QualityViolation[]) {
  const bySeverity = emptySev();
  const byLane: Record<FixLane, Record<SeverityClass, number>> = {
    'Auto-fix': emptySev(),
    'AI-fix': emptySev(),
    'Manual-fix': emptySev(),
  };
  const catMap = new Map<ApmeRuleCategory, Record<SeverityClass, number>>();
  findings.forEach(f => {
    bySeverity[f.severity] += 1;
    byLane[laneOf(f)][f.severity] += 1;
    const id = apmeCategoryOf(f);
    const rec = catMap.get(id) ?? emptySev();
    rec[f.severity] += 1;
    catMap.set(id, rec);
  });
  const categories = APME_CATEGORY_ORDER.filter(id => catMap.has(id)).map(id => {
    const breakdown = catMap.get(id)!;
    const count = SEV_ORDER.reduce((sum, sev) => sum + breakdown[sev], 0);
    return {
      id,
      label: APME_CATEGORY_LABEL[id],
      hint: APME_CATEGORY_HINT[id],
      count,
      breakdown,
    };
  });
  return { total: findings.length, bySeverity, byLane, categories };
}

const SEV_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function sortNodeFindings(items: QualityViolation[]): QualityViolation[] {
  return [...items].sort((a, b) => {
    const rank = (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9);
    if (rank !== 0) return rank;
    return a.lineStart - b.lineStart;
  });
}

function sortFindingsBySeverity(items: QualityViolation[]): QualityViolation[] {
  return [...items].sort((a, b) => {
    const rank = (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9);
    if (rank !== 0) return rank;
    if (a.file !== b.file) return (a.file || '').localeCompare(b.file || '');
    return a.lineStart - b.lineStart;
  });
}

/** Keep list order; bundle findings that share a ContentGraph path. */
function groupByNodeOrder(items: QualityViolation[]): QualityViolation[][] {
  const order: string[] = [];
  const map = new Map<string, QualityViolation[]>();
  items.forEach(v => {
    const id = nodeKey(v);
    if (!map.has(id)) {
      order.push(id);
      map.set(id, []);
    }
    map.get(id)!.push(v);
  });
  return order.map(id => sortNodeFindings(map.get(id)!));
}

function nodePeers(
  all: QualityViolation[],
  v: QualityViolation,
): QualityViolation[] {
  const id = nodeKey(v);
  return all.filter(f => nodeKey(f) === id);
}

function sharedDecision(
  items: QualityViolation[],
  decisions: Record<string, WizardDecision>,
): WizardDecision | undefined {
  const suggestion = items.filter(
    f => f.fixTier === 'deterministic' || f.fixTier === 'ai',
  );
  if (suggestion.length === 0) return undefined;
  const first = decisions[findingKey(suggestion[0])];
  if (!first) return undefined;
  return suggestion.every(f => decisions[findingKey(f)] === first)
    ? first
    : undefined;
}

function groupByFile(findings: QualityViolation[]): { file: string; findings: QualityViolation[] }[] {
  const map = new Map<string, QualityViolation[]>();
  findings.forEach(f => {
    const file = f.file || 'Unknown file';
    const list = map.get(file) ?? [];
    list.push(f);
    map.set(file, list);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, list]) => ({
      file,
      findings: [...list].sort((a, b) => a.lineStart - b.lineStart),
    }));
}

const useStyles = makeStyles((theme: Theme) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  stackFill: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    gap: theme.spacing(1.5),
  },
  scrollBody: {
    flex: 1,
    minHeight: 0,
    overflowX: 'hidden',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(0, 0.25, 2),
    '& > *': {
      flexShrink: 0,
    },
  },
  scrollBodyRedesign: {
    gap: theme.spacing(1),
  },
  wizardFooter: {
    flexShrink: 0,
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'nowrap',
    margin: theme.spacing(0, 0.25, 0.5),
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
  },
  wizardFooterWork: {
    margin: 0,
    marginLeft: 'calc(-1 * var(--portal-page-gutter, 32px))',
    marginRight: 'calc(-1 * var(--portal-page-gutter, 32px))',
    border: 'none',
    borderRadius: 0,
    borderTop: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
    paddingLeft: 'var(--portal-page-gutter, 32px)',
    paddingRight: 'var(--portal-page-gutter, 32px)',
  },
  footerStatus: {
    ...theme.typography.body2,
    flex: '1 1 auto',
    color: theme.palette.text.secondary,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
  },
  footerBulk: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexShrink: 0,
  },
  footerLink: {
    textTransform: 'none',
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    minHeight: 28,
    padding: '0 8px',
  },
  footerLead: {
    ...theme.typography.body2,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightRegular ?? 400,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  footerStat: {
    ...theme.typography.body2,
    fontFamily: theme.typography.fontFamily,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    whiteSpace: 'nowrap',
    fontWeight: theme.typography.fontWeightRegular ?? 400,
    lineHeight: 1.4,
    flexShrink: 0,
  },
  footerStatAccept: {
    color: statusColors.success,
  },
  footerStatDecline: {
    color: statusColors.error,
  },
  footerStatRemain: {
    color: theme.palette.text.primary,
  },
  footerStatIcon: {
    fontSize: 14,
  },
  footerHint: {
    display: 'block',
    whiteSpace: 'normal',
  },
  footerCount: {
    display: 'block',
    marginTop: 2,
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  footerActions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginLeft: 'auto',
    gap: theme.spacing(1),
  },
  footerAccepted: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    gap: 0,
    minWidth: 'max-content',
  },
  footerContinue: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  footerCancel: {
    ...PILL,
    marginRight: theme.spacing(6),
    color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
  },
  footerClearFab: {
    paddingRight: 72,
  },
  continueHit: {
    display: 'inline-flex',
    cursor: 'not-allowed',
    '& button': {
      pointerEvents: 'none',
    },
  },
  jobLine: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
    '& strong': {
      color: theme.palette.text.primary,
      fontWeight: 600,
    },
  },
  compactSummary: {
    padding: theme.spacing(1.25, 2),
  },
  compactSummaryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
  },
  mixTotalCompact: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  compactBar: {
    width: 140,
    flexShrink: 0,
    height: FINDINGS_BAR_HEIGHT,
    display: 'flex',
    alignItems: 'center',
  },
  compactChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactToggle: {
    marginLeft: 'auto',
  },
  gate: {
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.primary,
    margin: theme.spacing(0, 0, 1.25),
  },
  gateDone: {
    color: theme.palette.success.dark,
  },
  gateMuted: {
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  pulse: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
    boxShadow: `0 0 0 6px ${fade(theme.palette.primary.main, 0.18)}`,
  },
  box: {
    borderRadius: 8,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'visible',
  },
  boxHead: {
    padding: theme.spacing(2, 2, 0),
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  resultsBody: {
    padding: theme.spacing(1.5, 2, 2),
  },
  mixHeader: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
  },
  mixTotal: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  /** Card-section title: below page title (1.5rem / 700), one weight for the whole line. */
  listHeading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.3,
    color: theme.palette.text.primary,
  },
  listSubhead: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    maxWidth: 640,
  },
  jobHint: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    maxWidth: 720,
  },
  findingsCountHead: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2, 0),
  },
  resultsMixAfterCount: {
    paddingTop: theme.spacing(1),
  },
  reviewLaneTabs: {
    minHeight: 36,
    padding: theme.spacing(0, 2),
    '& .MuiTabs-flexContainer': {
      flexWrap: 'nowrap',
    },
    '& .MuiTabs-indicator': {
      height: 2,
    },
    '& .MuiTab-root': {
      minHeight: 36,
      minWidth: 0,
      padding: theme.spacing(0.75, 1.5, 0.75, 0),
      marginRight: theme.spacing(2),
      textTransform: 'none',
      fontSize: 14,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    },
    '& .MuiTab-root:last-child': {
      marginRight: 0,
    },
  },
  laneMix: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginTop: theme.spacing(0.5),
  },
  laneMixItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  laneMixHit: {
    ...theme.typography.body2,
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 4,
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
    '&:hover': {
      textDecoration: 'underline',
    },
    '&:disabled': {
      cursor: 'default',
      color: theme.palette.text.secondary,
      textDecoration: 'none',
    },
  },
  laneMixCount: {
    fontWeight: 600,
  },
  mixMeta: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  scanCountHead: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: theme.spacing(1),
    padding: theme.spacing(2, 2, 1),
    '& p': {
      margin: 0,
    },
  },
  tabsHost: {
    paddingTop: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& [class*="BackstageHeaderTabs-tabsWrapper"]': {
      paddingLeft: `${theme.spacing(2)}px !important`,
      paddingRight: theme.spacing(2),
      minWidth: 0,
      backgroundColor: 'transparent',
    },
    '& .MuiTabs-scrollButtons': {
      display: 'none',
    },
    '& .MuiTabs-flexContainer': {
      overflow: 'visible',
    },
    '& .MuiTabs-indicator': {
      height: 3,
    },
  },
  findingsTabsHost: {
    paddingTop: theme.spacing(0.5),
  },
  commitReview: {
    marginBottom: theme.spacing(2),
    overflow: 'hidden',
  },
  commitFilters: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2, 1),
    width: '100%',
    boxSizing: 'border-box',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  commitFilterSelects: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: theme.spacing(1),
    flex: '0 1 auto',
  },
  commitTabHint: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    margin: 0,
    padding: theme.spacing(1.5, 2, 0),
  },
  commitList: {
    padding: theme.spacing(1.5, 2, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  bulkBarBeforeTabs: {
    paddingBottom: theme.spacing(0.5),
  },
  scanCountRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    width: '100%',
  },
  scanCountRowSplit: {
    alignItems: 'center',
  },
  scanCountCopy: {
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    minWidth: 0,
    flexWrap: 'wrap',
  },
  scanCountSep: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    padding: theme.spacing(0, 0.5),
  },
  countInfo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  workBreakdown: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  workCount: {
    ...theme.typography.body2,
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  scanAside: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
    marginLeft: theme.spacing(1.5),
    '& strong': {
      color: theme.palette.text.primary,
      fontWeight: 700,
      fontSize: 16,
      marginRight: 4,
    },
  },
  scanSevCounts: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    minWidth: 0,
  },
  scanSevCount: {
    ...theme.typography.body2,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.2,
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  reviewReadout: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  reviewReadoutRow: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: theme.spacing(0.75),
    rowGap: theme.spacing(0.25),
  },
  reviewReadoutCluster: {
    display: 'inline-flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: theme.spacing(0.75),
    rowGap: theme.spacing(0.25),
  },
  reviewReadoutHit: {
    ...theme.typography.body2,
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: theme.palette.text.secondary,
    fontWeight: 400,
    lineHeight: 1.35,
    '&:hover': {
      textDecoration: 'underline',
      color: theme.palette.text.primary,
    },
  },
  reviewReadoutHitOn: {
    color: theme.palette.text.primary,
    fontWeight: 600,
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
  reviewReadoutDim: {
    opacity: 0.45,
  },
  reviewReadoutSep: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    userSelect: 'none',
  },
  scanMixBar: {
    width: '100%',
    height: FINDINGS_BAR_HEIGHT,
  },
  aiBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
    margin: theme.spacing(0.25, 2, 0.5),
    padding: theme.spacing(1.25, 1.5),
    backgroundColor:
      theme.palette.type === 'light' ? '#e7f1fa' : 'rgba(38, 117, 195, 0.12)',
    border: `1px solid ${
      theme.palette.type === 'light' ? '#bee1f4' : 'rgba(38, 117, 195, 0.3)'
    }`,
    borderRadius: theme.shape.borderRadius,
  },
  aiBannerIcon: {
    color: '#2b9af3',
    fontSize: 20,
    flexShrink: 0,
  },
  aiBannerCopy: {
    ...theme.typography.body2,
    flex: '1 1 220px',
    minWidth: 0,
    color: theme.palette.text.primary,
    overflowWrap: 'break-word',
  },
  aiBannerAction: {
    flexShrink: 0,
  },
  aiBannerLink: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 13,
    padding: '4px 8px',
    minWidth: 0,
    borderRadius: 16,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      textDecoration: 'none',
    },
  },
  mixBar: {
    height: FINDINGS_BAR_HEIGHT,
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: theme.spacing(1.5),
  },
  drawerToggle: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 13,
    color: theme.palette.text.secondary,
    padding: '4px 10px',
    marginLeft: -10,
    minWidth: 0,
    borderRadius: 16,
    '& .MuiButton-endIcon': {
      marginLeft: 4,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
  },
  findingsBreakdown: {
    paddingTop: theme.spacing(1),
  },
  breakdownSectionTitle: {
    ...theme.typography.subtitle2,
    color: theme.palette.text.primary,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(0.75),
    '&:first-of-type': {
      marginTop: theme.spacing(0.5),
    },
  },
  breakdownLaneRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(1.25),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  mixChips: {
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
  },
  resultsFacets: {
    padding: theme.spacing(1, 2, 0.5),
  },
  resultsMix: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(2, 2, 1.5),
  },
  resultsMixBeforeSearch: {
    paddingBottom: theme.spacing(1),
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    width: '100%',
    boxSizing: 'border-box',
  },
  toolbarOnAi: {
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(2.5),
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(1.25),
    borderTop: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    borderRadius: 4,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  catRowSelected: {
    backgroundColor: theme.palette.action.selected,
  },
  catName: {
    ...theme.typography.body2,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 180,
    flexShrink: 0,
  },
  catHelp: {
    fontSize: 14,
    color: theme.palette.text.disabled,
    cursor: 'help',
  },
  catHelpHit: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'help',
    lineHeight: 0,
  },
  catCount: {
    height: 20,
    fontSize: 11,
    fontWeight: 600,
    flexShrink: 0,
  },
  catBar: {
    flex: 1,
    minWidth: 80,
    height: FINDINGS_BAR_HEIGHT,
    display: 'flex',
    alignItems: 'center',
  },
  stepChrome: {
    position: 'sticky',
    // Scrollport is the inset well under the masthead — not the viewport —
    // so top: 0, not --portal-chrome-top.
    top: 0,
    zIndex: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    marginBottom: 0,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
  },
  stepChromeColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    gap: theme.spacing(1),
  },
  stepChromeTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    width: '100%',
  },
  bulkListActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: 8,
    width: '100%',
    minHeight: 32,
  },
  showingInline: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    flex: '0 1 auto',
    width: 'auto',
    minWidth: 0,
  },
  diffToggle: {
    flexShrink: 0,
    alignSelf: 'center',
    '& .MuiToggleButtonGroup-grouped': {
      margin: 0,
    },
    '& .MuiToggleButton-root': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      minWidth: 32,
      width: 32,
      minHeight: 32,
      height: 32,
      boxSizing: 'border-box',
      borderColor: theme.palette.divider,
      color: theme.palette.text.secondary,
    },
    '& .MuiToggleButton-root.MuiToggleButton-sizeSmall': {
      padding: 0,
      minWidth: 32,
      width: 32,
      minHeight: 32,
      height: 32,
    },
    '& .MuiToggleButton-root.Mui-selected': {
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.action.selected,
    },
    '& svg': {
      display: 'block',
      width: 14,
      height: 14,
    },
  },
  clearFilters: {
    textTransform: 'none',
    minWidth: 0,
    padding: theme.spacing(0.25, 0.75),
  },
  bulkTwinActions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  autoAcceptControl: {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: theme.spacing(-1),
    marginRight: 0,
    cursor: 'pointer',
  },
  autoAcceptLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  stepCopy: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
  },
  stepActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexShrink: 0,
    marginLeft: 'auto',
  },
  stepProgress: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
  tabLabel: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  typeViz: {
    padding: theme.spacing(0.5, 2, 1.25),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  typeVizRow: {
    borderTop: 'none',
    '& + &': {
      borderTop: `1px solid ${theme.palette.divider}`,
    },
  },
  resultsCatViz: {
    padding: 0,
  },
  resultsCatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    paddingTop: 3,
    paddingBottom: 3,
    cursor: 'pointer',
    borderRadius: 4,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  resultsCatRowSelected: {
    backgroundColor: theme.palette.action.selected,
  },
  resultsCatName: {
    ...theme.typography.body2,
    minWidth: 120,
    flexShrink: 0,
  },
  resultsCatCount: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    minWidth: 16,
    flexShrink: 0,
  },
  resultsCatBar: {
    flex: 1,
    minWidth: 80,
    height: FINDINGS_BAR_HEIGHT,
    display: 'flex',
    alignItems: 'center',
  },
  tabPageHint: {
    ...theme.typography.body2,
    padding: theme.spacing(1.25, 2, 0),
    color: theme.palette.text.secondary,
  },
  search: { width: 220 },
  searchFill: {
    flex: '1 1 220px',
    minWidth: 160,
    width: 'auto',
    '& .MuiOutlinedInput-root': {
      width: '100%',
    },
  },
  select: { minWidth: 168, flexShrink: 0 },
  commitSelect: {
    minWidth: 176,
    flex: '0 0 auto',
    '& .MuiSelect-root': { whiteSpace: 'nowrap' },
  },
  bulkBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(0, 2, 1),
  },
  bulkBarSpaced: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(2.5),
  },
  bulkRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    width: '100%',
  },
  bulkCount: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
  bulkNote: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  bulkActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 'auto',
  },
  actionsMenu: {},
  menuItemDescribed: {
    whiteSpace: 'normal',
    alignItems: 'flex-start',
    maxWidth: 360,
    '& .MuiListItemText-root': {
      margin: 0,
    },
    '& .MuiListItemText-secondary': {
      whiteSpace: 'normal',
    },
  },
  fileList: {
    padding: theme.spacing(0, 2, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  reviewRemainder: {
    padding: theme.spacing(2, 2, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  reviewRemainderHead: {
    ...theme.typography.subtitle2,
    fontWeight: 600,
    margin: 0,
    '&:not(:first-child)': {
      paddingTop: theme.spacing(1),
    },
  },
  reviewRemainderHint: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    margin: 0,
  },
  empty: {
    padding: theme.spacing(3, 2),
  },
  issueCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
  },
  cardCopy: { minWidth: 0, flex: 1 },
  title: {
    ...theme.typography.subtitle2,
    color: theme.palette.text.primary,
  },
  bundledCopy: {
    marginTop: theme.spacing(1.5),
  },
  fileMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: { height: 22, maxWidth: '100%' },
  fileMeta: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    wordBreak: 'break-word',
  },
  filePath: {
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
  },
  cardActions: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    minHeight: 28,
    paddingTop: 2,
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
  },
  rowToggle: {
    flexShrink: 0,
    '& .MuiToggleButton-root': {
      textTransform: 'none',
      fontFamily: theme.typography.fontFamily,
      fontWeight: 500,
      fontSize: theme.typography.body2.fontSize,
      lineHeight: 1.2,
      padding: '0 10px',
      minHeight: 28,
      height: 28,
      boxSizing: 'border-box',
      gap: 4,
      whiteSpace: 'nowrap',
      borderColor: theme.palette.divider,
    },
    '& .MuiToggleButton-root.MuiToggleButton-sizeSmall': {
      padding: '0 10px',
      minHeight: 28,
      height: 28,
    },
    '& .MuiSvgIcon-root': {
      fontSize: 14,
    },
  },
  rowToggleAccept: {
    '&.MuiToggleButton-root.Mui-selected': {
      backgroundColor: theme.palette.success.main,
      color: '#fff',
      borderColor: `${theme.palette.success.main} !important`,
      '& .MuiToggleButton-label': {
        color: '#fff',
      },
      '& .MuiSvgIcon-root': {
        color: '#fff',
      },
      '&:hover': {
        backgroundColor: theme.palette.success.dark,
        borderColor: `${theme.palette.success.dark} !important`,
        color: '#fff',
      },
    },
    '&.MuiToggleButton-root.Mui-selected.Mui-disabled': {
      backgroundColor: theme.palette.success.main,
      color: '#fff',
      borderColor: `${theme.palette.success.main} !important`,
      opacity: 1,
      '& .MuiToggleButton-label, & .MuiSvgIcon-root': {
        color: '#fff',
      },
    },
  },
  rowToggleDecline: {
    '&.MuiToggleButton-root.Mui-selected': {
      backgroundColor: theme.palette.error.main,
      color: '#fff',
      borderColor: `${theme.palette.error.main} !important`,
      '& .MuiToggleButton-label': {
        color: '#fff',
      },
      '& .MuiSvgIcon-root': {
        color: '#fff',
      },
      '&:hover': {
        backgroundColor: theme.palette.error.dark,
        borderColor: `${theme.palette.error.dark} !important`,
        color: '#fff',
      },
    },
    '&.MuiToggleButton-root.Mui-selected.Mui-disabled': {
      backgroundColor: theme.palette.error.main,
      color: '#fff',
      borderColor: `${theme.palette.error.main} !important`,
      opacity: 1,
      '& .MuiToggleButton-label, & .MuiSvgIcon-root': {
        color: '#fff',
      },
    },
  },
  rowBtnAccepted: {
    backgroundColor: theme.palette.success.main,
    color: '#fff',
    borderColor: theme.palette.success.main,
    '& .MuiButton-label, & .MuiSvgIcon-root': {
      color: '#fff',
    },
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
      borderColor: theme.palette.success.dark,
      color: '#fff',
    },
  },
  rowBtnDeclined: {
    backgroundColor: theme.palette.error.main,
    color: '#fff',
    borderColor: theme.palette.error.main,
    '& .MuiButton-label, & .MuiSvgIcon-root': {
      color: '#fff',
    },
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
      borderColor: theme.palette.error.dark,
      color: '#fff',
    },
  },
  rowAccept: {
    backgroundColor: fade(
      theme.palette.success.main,
      theme.palette.type === 'dark' ? 0.1 : 0.05,
    ),
    borderColor: fade(
      theme.palette.success.main,
      theme.palette.type === 'dark' ? 0.4 : 0.28,
    ),
  },
  rowDecline: {
    backgroundColor: fade(
      theme.palette.error.main,
      theme.palette.type === 'dark' ? 0.1 : 0.05,
    ),
    borderColor: fade(
      theme.palette.error.main,
      theme.palette.type === 'dark' ? 0.4 : 0.28,
    ),
  },
  rowNeutral: { backgroundColor: theme.palette.background.paper },
  diffBlock: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5, 2, 2),
  },
  splitDiff: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderTop: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  },
  splitPane: {
    minWidth: 0,
    '&:first-child': {
      borderRight: `1px solid ${theme.palette.divider}`,
      [theme.breakpoints.down('sm')]: {
        borderRight: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
    },
  },
  splitPaneHead: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    padding: theme.spacing(0.75, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      theme.palette.type === 'dark'
        ? fade(theme.palette.common.white, 0.04)
        : fade(theme.palette.common.black, 0.03),
  },
  splitPaneBody: {
    padding: theme.spacing(1.25, 2, 1.5),
  },
  splitNote: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    margin: 0,
  },
  splitNoteActions: {
    marginTop: theme.spacing(1),
  },
  diffEmpty: {
    ...theme.typography.body2,
    padding: theme.spacing(1, 0),
    color: theme.palette.text.secondary,
  },
  suggestionEmpty: {
    ...theme.typography.body2,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: theme.spacing(1, 0),
    minHeight: 40,
    color: theme.palette.text.secondary,
  },
  suggestionLead: {
    ...theme.typography.body2,
    padding: theme.spacing(0, 0, 1),
    color: theme.palette.text.secondary,
  },
  suggestionLeadRow: {
    minHeight: 0,
    paddingTop: 0,
    paddingBottom: theme.spacing(1),
  },
  diffLine: {
    display: 'flex',
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
    fontSize: 12,
    lineHeight: 1.55,
    padding: theme.spacing(0, 1),
    whiteSpace: 'pre',
    overflow: 'auto',
  },
  gutter: {
    width: 16,
    flexShrink: 0,
    userSelect: 'none',
    fontWeight: 700,
  },
  del: {
    backgroundColor: fade(theme.palette.error.main, theme.palette.type === 'dark' ? 0.22 : 0.12),
  },
  add: {
    backgroundColor: fade(theme.palette.success.main, theme.palette.type === 'dark' ? 0.22 : 0.12),
  },
  ctx: {
    backgroundColor:
      theme.palette.type === 'dark'
        ? fade(theme.palette.common.white, 0.04)
        : fade(theme.palette.common.black, 0.04),
  },
  delMark: { color: theme.palette.error.main },
  addMark: { color: theme.palette.success.main },
}));

const CountInfo: React.FC<{ label: string; hint: string }> = ({ label, hint }) => {
  const classes = useStyles();
  return (
    <span className={classes.countInfo}>
      <Typography
        className={classes.mixMeta}
        variant="body2"
        color="textSecondary"
        component="span"
      >
        {label}
      </Typography>
      <Tooltip title={hint} arrow>
        <span className={classes.catHelpHit} tabIndex={0} aria-label={hint}>
          <HelpOutlineIcon className={classes.catHelp} aria-hidden />
        </span>
      </Tooltip>
    </span>
  );
};

export const InlineVisualReview: React.FC<{
  findings: QualityViolation[];
  t1Decisions: Record<string, WizardDecision>;
  setT1Decisions?: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  aiDecisions: Record<string, WizardDecision>;
  setAiDecisions?: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  aiStatus: Record<string, AiRowStatus>;
  onGenerateAi?: (key: string) => void;
  onGenerateAllAi?: (keys: string[]) => void;
  onNext: () => void;
  onCancel: () => void;
  ctaLayout?: CtaLayout;
  reviewLayout?: ReviewLayout;
  phase?: ReviewPhase;
  /** Current | Remediation split. Default stacked. */
  sideBySide?: boolean;
  onSideBySideChange?: (next: boolean) => void;
  header?: ReactNode;
}> = ({
  findings,
  t1Decisions,
  setT1Decisions,
  aiDecisions,
  setAiDecisions,
  aiStatus,
  onGenerateAi,
  onGenerateAllAi,
  onNext,
  onCancel,
  ctaLayout = 'current',
  reviewLayout = 'current',
  phase = 'bundled',
  sideBySide = false,
  onSideBySideChange,
  header,
}) => {
  const classes = useStyles();
  const decisions = { ...t1Decisions, ...aiDecisions };
  const reviewFindings = findings;
  const auto = reviewFindings.filter(v => v.fixTier === 'deterministic');
  const ai = reviewFindings.filter(v => v.fixTier === 'ai');
  const manual = reviewFindings.filter(
    v => v.fixTier !== 'deterministic' && v.fixTier !== 'ai',
  );
  const workCountItems = [
    auto.length > 0 && {
      id: 'auto',
      count: auto.length,
      label: auto.length === 1 ? 'auto remediation' : 'auto remediations',
      hint: LANE_EXPLAIN['Auto-fix'],
    },
    ai.length > 0 && {
      id: 'ai',
      count: ai.length,
      label: ai.length === 1 ? 'AI remediation' : 'AI remediations',
      hint: LANE_EXPLAIN['AI-fix'],
    },
    manual.length > 0 && {
      id: 'manual',
      count: manual.length,
      label: manual.length === 1 ? 'manual remediation' : 'manual remediations',
      hint: LANE_EXPLAIN['Manual-fix'],
    },
  ].filter(Boolean) as { id: string; count: number; label: string; hint: string }[];
  const reviewCountItems = [
    auto.length > 0 && {
      id: 'auto',
      count: auto.length,
      label: auto.length === 1 ? 'auto remediation' : 'auto remediations',
      hint: LANE_EXPLAIN['Auto-fix'],
    },
    ai.length > 0 && {
      id: 'ai',
      count: ai.length,
      label: ai.length === 1 ? 'needs AI' : 'need AI',
      hint: 'Eligible for an AI suggestion. Generate it on the next step.',
    },
    manual.length > 0 && {
      id: 'manual',
      count: manual.length,
      label: 'manual only',
      hint: LANE_EXPLAIN['Manual-fix'],
    },
  ].filter(Boolean) as { id: string; count: number; label: string; hint: string }[];
  const inventoryCountItems =
    phase === 'review' ? reviewCountItems : phase === 'work' ? workCountItems : [];

  const mix = useMemo(() => mixFromFindings(reviewFindings), [reviewFindings]);
  const autoMix = useMemo(
    () =>
      mixFromFindings(
        reviewFindings.filter(v => v.fixTier === 'deterministic'),
      ),
    [reviewFindings],
  );
  const readoutMix = phase === 'autofix' ? autoMix : mix;

  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<'all' | string>('all');
  const [category, setCategory] = useState<'all' | ApmeRuleCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<Set<SeverityClass>>(() => new Set());
  const [fixType, setFixType] = useState<ReviewTab>(() =>
    phase === 'ai'
      ? 'AI-fix'
      : showsResultsMix(phase) || phase === 'review'
        ? 'All'
        : 'Auto-fix',
  );
  const [laneFilter, setLaneFilter] = useState<FixLane | 'all'>('all');
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [findingsBreakdownOpen, setFindingsBreakdownOpen] = useState(false);
  const [filterGeneratedAi, setFilterGeneratedAi] = useState(false);
  const [pulseKey, setPulseKey] = useState<string | null>(null);
  const currentRedesign = isRedesignLayout(reviewLayout);
  const redesign3Plus = reviewLayout === 'redesign3' || reviewLayout === 'redesign4';
  const redesign3 = reviewLayout === 'redesign3';
  const redesign4 = reviewLayout === 'redesign4';
  const autoKeys = auto.map(findingKey).join('|');
  const seededAutoAccept = useRef(false);

  useLayoutEffect(() => {
    if (phase === 'ai' || phase === 'results') {
      seededAutoAccept.current = false;
      return;
    }
    if (!currentRedesign) {
      seededAutoAccept.current = false;
      return;
    }
    if (seededAutoAccept.current || auto.length === 0) return;
    seededAutoAccept.current = true;
    setT1Decisions?.(prev => {
      const next = { ...prev };
      auto.forEach(v => {
        next[findingKey(v)] = 'accept';
      });
      return next;
    });
  }, [phase, currentRedesign, autoKeys, auto, setT1Decisions]);

  useLayoutEffect(() => {
    if (phase === 'ai') {
      setFixType('AI-fix');
      return;
    }
    if (phase === 'results' || phase === 'work') {
      setFixType('All');
      setCategory('all');
      setLaneFilter('all');
      return;
    }
    if (phase === 'review') {
      setFixType('All');
      setCategory('all');
      setLaneFilter('all');
      return;
    }
    if (phase === 'autofix') {
      setFixType('Auto-fix');
      setCategory('all');
      setLaneFilter('all');
      return;
    }
    setFixType(currentRedesign ? 'All' : 'Auto-fix');
  }, [currentRedesign, phase]);

  const inActiveTab = (f: QualityViolation) => {
    if (phase === 'autofix' && laneOf(f) !== 'Auto-fix') return false;
    if (phase === 'ai' && laneOf(f) !== 'AI-fix') return false;
    return fixType === 'All' || laneOf(f) === fixType;
  };
  const tabFindings = reviewFindings.filter(inActiveTab);
  const contentTypes = useMemo(
    () => Array.from(new Set(tabFindings.map(kindLabel))).sort(),
    [tabFindings],
  );
  const presentCategories = useMemo(() => {
    const ids = new Set(tabFindings.map(apmeCategoryOf));
    return APME_CATEGORY_ORDER.filter(id => ids.has(id));
  }, [tabFindings]);

  const toggleSeverity = (sev: SeverityClass) => {
    setBreakdownOpen(true);
    setSeverityFilter(prev => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };
  const toggleCategory = (id: ApmeRuleCategory) => {
    setCategory(prev => (prev === id ? 'all' : id));
    setBreakdownOpen(true);
  };
  const toggleLaneFilter = (lane: FixLane) => {
    setLaneFilter(prev => (prev === lane ? 'all' : lane));
  };
  const toggleReviewSeverity = (sev: SeverityClass) => {
    setSeverityFilter(prev => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };
  const clearReviewFacets = () => {
    setLaneFilter('all');
    setCategory('all');
    setSeverityFilter(new Set());
  };

  const visibleCategories = useMemo(() => {
    const any = severityFilter.size > 0;
    return mix.categories
      .map(cat => {
        const breakdown = { ...cat.breakdown };
        if (any) {
          for (const sev of SEV_ORDER) {
            if (!severityFilter.has(sev)) breakdown[sev] = 0;
          }
        }
        const count = SEV_ORDER.reduce((sum, sev) => sum + (breakdown[sev] ?? 0), 0);
        return { ...cat, breakdown, count };
      })
      .filter(cat => cat.count > 0);
  }, [mix.categories, severityFilter]);

  const visibleCatTotal = useMemo(
    () => visibleCategories.reduce((sum, cat) => sum + cat.count, 0),
    [visibleCategories],
  );

  const mixFindings = useMemo(() => {
    if (phase === 'results' || phase === 'review') return reviewFindings;
    if (phase === 'autofix') return auto;
    if (phase === 'ai') return ai;
    return contentType === 'all'
      ? tabFindings
      : tabFindings.filter(f => kindLabel(f) === contentType);
  }, [phase, reviewFindings, auto, ai, tabFindings, contentType]);

  const categoryAsChips = showsFindingsFilters(phase);

  const resultsCatRows = useMemo(() => {
    const source = mixFromFindings(mixFindings).categories;
    const any = severityFilter.size > 0;
    return source
      .map(cat => {
        const breakdown = { ...cat.breakdown };
        if (any) {
          for (const sev of SEV_ORDER) {
            if (!severityFilter.has(sev)) breakdown[sev] = 0;
          }
        }
        const count = SEV_ORDER.reduce((sum, sev) => sum + (breakdown[sev] ?? 0), 0);
        return { ...cat, breakdown, count };
      })
      .filter(cat => cat.count > 0);
  }, [mixFindings, severityFilter]);

  const resultsCatTotal = useMemo(
    () => resultsCatRows.reduce((sum, cat) => sum + cat.count, 0),
    [resultsCatRows],
  );

  const laneMix = useMemo(() => {
    if (showsResultsMix(phase)) return mix;
    if (category === 'all') return mix;
    return mixFromFindings(reviewFindings.filter(f => apmeCategoryOf(f) === category));
  }, [phase, category, reviewFindings, mix]);

  const visibleLanes = useMemo(() => {
    const any = severityFilter.size > 0;
    return LANE_TABS.map(lane => {
      const breakdown = { ...laneMix.byLane[lane] };
      if (any) {
        for (const sev of SEV_ORDER) {
          if (!severityFilter.has(sev)) breakdown[sev] = 0;
        }
      }
      const count = SEV_ORDER.reduce((sum, sev) => sum + (breakdown[sev] ?? 0), 0);
      return { lane, breakdown, count };
    }).filter(row => {
      if (row.count === 0) return false;
      if (phase === 'autofix' && row.lane !== 'Auto-fix') return false;
      if (phase === 'ai' && row.lane !== 'AI-fix') return false;
      return true;
    });
  }, [laneMix.byLane, severityFilter, phase]);

  const visibleLaneTotal = useMemo(
    () => visibleLanes.reduce((sum, row) => sum + row.count, 0),
    [visibleLanes],
  );

  const autoDecided = auto.filter(v => Boolean(t1Decisions[findingKey(v)])).length;
  const pendingT1 = auto.length - autoDecided;
  const readyAi = ai.filter(v => aiStatus[findingKey(v)] === 'ready');
  const pendingGeneratedAi = readyAi.filter(v => !aiDecisions[findingKey(v)]).length;
  const idleAi = ai.filter(v => (aiStatus[findingKey(v)] ?? 'idle') === 'idle');
  const loadingAiCount = ai.filter(v => aiStatus[findingKey(v)] === 'loading').length;
  const aiLoading = loadingAiCount > 0;
  const remediationCount = auto.length + readyAi.length;
  const autoAccepted = auto.filter(v => t1Decisions[findingKey(v)] === 'accept').length;
  const autoDeclined = auto.filter(v => t1Decisions[findingKey(v)] === 'decline').length;
  const aiAccepted = ai.filter(v => aiDecisions[findingKey(v)] === 'accept').length;
  const aiDeclined = ai.filter(v => aiDecisions[findingKey(v)] === 'decline').length;
  const selectedSuggestions = autoAccepted + aiAccepted;
  const nextLocked =
    phase === 'results' || phase === 'work'
      ? false
      : phase === 'autofix' || phase === 'review'
        ? pendingT1 > 0
        : phase === 'ai'
          ? aiLoading || pendingGeneratedAi > 0
          : currentRedesign
            ? selectedSuggestions < 1
            : pendingT1 > 0 || pendingGeneratedAi > 0 || aiLoading;

  const matchesListFacets = (f: QualityViolation) => {
    if (contentType !== 'all' && kindLabel(f) !== contentType) return false;
    if (category !== 'all' && apmeCategoryOf(f) !== category) return false;
    if (severityFilter.size > 0 && !severityFilter.has(f.severity)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      f.ruleId.toLowerCase().includes(q) ||
      f.message.toLowerCase().includes(q) ||
      f.file.toLowerCase().includes(q) ||
      APME_CATEGORY_LABEL[apmeCategoryOf(f)].toLowerCase().includes(q)
    );
  };
  const facetFindings = reviewFindings.filter(f => {
    if (phase === 'autofix' && laneOf(f) !== 'Auto-fix') return false;
    if (phase === 'ai' && laneOf(f) !== 'AI-fix') return false;
    return matchesListFacets(f);
  });
  const laneCount: Record<ReviewTab, number> = {
    All: facetFindings.length,
    'Auto-fix': facetFindings.filter(f => laneOf(f) === 'Auto-fix').length,
    'AI-fix': facetFindings.filter(f => laneOf(f) === 'AI-fix').length,
    'Manual-fix': facetFindings.filter(f => laneOf(f) === 'Manual-fix').length,
  };
  const filtered = facetFindings.filter(f => {
    if (filterGeneratedAi) {
      if (laneOf(f) !== 'AI-fix' || aiStatus[findingKey(f)] !== 'ready') {
        return false;
      }
    }
    if (!showsResultsMix(phase) && laneFilter !== 'all' && laneOf(f) !== laneFilter) {
      return false;
    }
    return inActiveTab(f);
  });
  const files = groupByFile(filtered);
  const reviewAutoItems = filtered.filter(f => laneOf(f) === 'Auto-fix');
  const reviewAi = filtered.filter(f => laneOf(f) === 'AI-fix');
  const reviewManual = filtered.filter(f => laneOf(f) === 'Manual-fix');
  const reviewShowAutos =
    phase !== 'review' || fixType === 'All' || fixType === 'Auto-fix';
  const reviewShowAi =
    phase === 'review' &&
    (fixType === 'All' || fixType === 'AI-fix') &&
    reviewAi.length > 0;
  const reviewShowManual =
    phase === 'review' &&
    (fixType === 'All' || fixType === 'Manual-fix') &&
    reviewManual.length > 0;
  const visibleAuto = filtered.filter(v => v.fixTier === 'deterministic' && !t1Decisions[findingKey(v)]);
  const visibleReadyAi = filtered.filter(
    v => v.fixTier === 'ai' && aiStatus[findingKey(v)] === 'ready' && !aiDecisions[findingKey(v)],
  );

  const decideItems = (items: QualityViolation[], value: WizardDecision | null) => {
    items.forEach(v => {
      const k = findingKey(v);
      const setter = v.fixTier === 'ai' ? setAiDecisions : setT1Decisions;
      setter?.(prev => {
        const next = { ...prev };
        if (value === null) delete next[k];
        else if (!next[k]) next[k] = value;
        return next;
      });
    });
  };

  const stampT1Items = (items: QualityViolation[], value: WizardDecision) => {
    if (items.length === 0) return;
    setT1Decisions?.(prev => {
      const next = { ...prev };
      items.forEach(v => {
        next[findingKey(v)] = value;
      });
      return next;
    });
  };

  const stampAiItems = (items: QualityViolation[], value: WizardDecision) => {
    if (items.length === 0) return;
    setAiDecisions?.(prev => {
      const next = { ...prev };
      items.forEach(v => {
        next[findingKey(v)] = value;
      });
      return next;
    });
  };

  const stampAutoFixes = (value: WizardDecision | null) => {
    setT1Decisions?.(prev => {
      const next = { ...prev };
      auto.forEach(v => {
        const k = findingKey(v);
        if (value === null) delete next[k];
        else next[k] = value;
      });
      return next;
    });
  };

  const acceptUndeclinedAutoFixes = () => {
    setT1Decisions?.(prev => {
      const next = { ...prev };
      auto.forEach(v => {
        const k = findingKey(v);
        if (next[k] !== 'decline') next[k] = 'accept';
      });
      return next;
    });
  };

  const clearAcceptedAutoFixes = () => {
    setT1Decisions?.(prev => {
      const next = { ...prev };
      auto.forEach(v => {
        const k = findingKey(v);
        if (next[k] === 'accept') delete next[k];
      });
      return next;
    });
  };

  const onDecision = (v: QualityViolation, d: WizardDecision | null) => {
    if (!redesign4) {
      const k = findingKey(v);
      const setter = v.fixTier === 'ai' ? setAiDecisions : setT1Decisions;
      setter?.(prev => {
        const next = { ...prev };
        if (d === null) delete next[k];
        else next[k] = d;
        return next;
      });
      return;
    }
    const peers = nodePeers(reviewFindings, v);
    const autoPeers =
      phase === 'ai' ? [] : peers.filter(f => f.fixTier === 'deterministic');
    const aiPeers =
      phase === 'autofix' || isCombinedPhase(phase) ? [] : peers.filter(f => f.fixTier === 'ai');
    if (autoPeers.length > 0) {
      setT1Decisions?.(prev => {
        const next = { ...prev };
        autoPeers.forEach(f => {
          const k = findingKey(f);
          if (d === null) delete next[k];
          else next[k] = d;
        });
        return next;
      });
    }
    if (aiPeers.length > 0) {
      setAiDecisions?.(prev => {
        const next = { ...prev };
        aiPeers.forEach(f => {
          const k = findingKey(f);
          if (d === 'accept' && (aiStatus[k] ?? 'idle') !== 'ready') return;
          if (d === null) delete next[k];
          else next[k] = d;
        });
        return next;
      });
    }
  };

  const generateAll = () => {
    const keys = idleAi.map(findingKey);
    if (keys.length === 0) return;
    if (onGenerateAllAi) onGenerateAllAi(keys);
    else keys.forEach(k => onGenerateAi?.(k));
  };

  const excludeItems = (items: QualityViolation[]) => {
    items.forEach(v => {
      const k = findingKey(v);
      const setter = v.fixTier === 'ai' ? setAiDecisions : setT1Decisions;
      setter?.(prev => ({ ...prev, [k]: 'decline' }));
    });
  };

  const stampAiFixes = (value: WizardDecision | null) => {
    setAiDecisions?.(prev => {
      const next = { ...prev };
      ai.forEach(v => {
        const k = findingKey(v);
        const status = aiStatus[k] ?? 'idle';
        if (value === null) {
          delete next[k];
          return;
        }
        if (value === 'accept' && status !== 'ready') return;
        next[k] = value;
      });
      return next;
    });
  };

  const bulkPolicy = deriveBulkPolicy(auto, ai, readyAi, t1Decisions, aiDecisions);

  const jobTitle =
    phase === 'results'
      ? ''
      : phase === 'autofix' || isCombinedPhase(phase)
      ? pendingT1 > 0
        ? usesRemediationVocab(phase)
          ? 'Accept or decline each auto remediation to continue.'
          : 'Accept or decline each auto-fix to continue.'
        : ''
      : phase === 'ai'
        ? aiLoading
          ? 'Wait for AI generation to finish.'
          : pendingGeneratedAi > 0
            ? 'Accept or decline each generated AI remediation to continue.'
            : ''
        : currentRedesign
          ? pendingGeneratedAi > 0
            ? 'Accept or decline generated AI suggestions to continue.'
            : aiLoading
              ? 'Wait for AI generation to finish.'
              : pendingT1 > 0
                ? 'Accept the auto-fixes you want, then continue.'
                : ''
          : pendingT1 > 0
            ? 'Decide auto-fixes to continue. AI is optional.'
            : aiLoading
              ? 'Wait for AI generation to finish.'
              : pendingGeneratedAi > 0
                ? 'Accept or decline generated AI suggestions to continue.'
                : 'Auto-fixes decided. Ungenerated AI stays in the file.';

  const commitAccepted =
    phase === 'ai' ? aiAccepted : autoAccepted;
  const commitDeclined =
    phase === 'ai' ? aiDeclined : autoDeclined;
  const commitRemaining = pendingGeneratedAi;
  const showFooterRemainCount = phase === 'ai';
  const autoSuggestionLabel =
    auto.length === 1
      ? '1 auto remediation'
      : `${auto.length} auto remediations`;
  const showAutoSuggestionCount = isAutoDecidePhase(phase);
  const commitSummaryLabel = [
    showAutoSuggestionCount ? autoSuggestionLabel : null,
    `${commitAccepted} accepted, ${commitDeclined} declined`,
    showFooterRemainCount ? `${commitRemaining} remaining` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const decideCount =
    auto.length === 0
      ? usesRemediationVocab(phase)
        ? 'No auto remediations to decide'
        : 'No auto-fixes to decide'
      : usesRemediationVocab(phase)
        ? `${autoDecided} of ${auto.length} auto remediations decided`
        : `${autoDecided} of ${auto.length} auto-fixes decided`;

  const findingWord = mix.total === 1 ? 'finding' : 'findings';
  const stepHeading =
    phase === 'results'
      ? findingsJobTitle(mix.total)
      : phase === 'review' || phase === 'autofix'
        ? autoRemediationJobTitle(auto.length)
        : phase === 'ai'
          ? aiRemediationJobTitle(ai.length)
          : '';
  const stepDescription =
    phase === 'review' || phase === 'autofix'
      ? AUTO_STEP_DESC
      : phase === 'ai'
        ? AI_STEP_DESC
        : null;
  const useFooter = ctaLayout === 'footer' || currentRedesign;
  const showListChrome = true;
  const searchPlaceholder =
    showsResultsMix(phase)
      ? 'Search findings'
      : phase === 'review'
        ? 'Search findings'
      : fixType === 'All'
      ? 'Search findings'
      : fixType === 'Auto-fix'
      ? usesRemediationVocab(phase)
        ? 'Search auto remediations'
        : 'Search auto-fixes'
      : fixType === 'AI-fix'
        ? usesRemediationVocab(phase)
          ? 'Search AI remediations'
          : 'Search AI-fixes'
        : usesRemediationVocab(phase)
          ? 'Search manual remediations'
          : 'Search manual fixes';

  const severitySelect =
    severityFilter.size === 1 ? Array.from(severityFilter)[0] : 'all';
  const presentSeverities = SEV_ORDER.filter(sev =>
    tabFindings.some(f => f.severity === sev),
  );

  const showingCount = filtered.length;
  const showingTotal =
    phase === 'review' ? reviewFindings.length : tabFindings.length;
  const showingLabel = `${showingCount} showing`;
  const remainingItems =
    fixType === 'AI-fix'
      ? visibleReadyAi
      : fixType === 'All'
        ? [...visibleAuto, ...visibleReadyAi]
        : visibleAuto;
  const remainingForTab = remainingItems.length;
  const remainingSuggestions = filtered.filter(f => {
    const lane = laneOf(f);
    const d = decisions[findingKey(f)];
    if (d === 'accept' || d === 'decline') return false;
    if (lane === 'Auto-fix') return true;
    if (lane === 'AI-fix') return aiStatus[findingKey(f)] === 'ready';
    return false;
  });
  const remainingAutoAccept = filtered.filter(
    v => v.fixTier === 'deterministic' && t1Decisions[findingKey(v)] !== 'accept',
  );
  const remainingAutoDecline = filtered.filter(
    v => v.fixTier === 'deterministic' && t1Decisions[findingKey(v)] !== 'decline',
  );
  const remainingAiAccept = filtered.filter(f => {
    if (laneOf(f) !== 'AI-fix') return false;
    if (aiStatus[findingKey(f)] !== 'ready') return false;
    return aiDecisions[findingKey(f)] !== 'accept';
  });
  const remainingAiDecline = filtered.filter(f => {
    if (laneOf(f) !== 'AI-fix') return false;
    if (aiStatus[findingKey(f)] !== 'ready') return false;
    return aiDecisions[findingKey(f)] !== 'decline';
  });
  const showFooterRemaining = redesign4 && phase === 'ai';
  const showFooterAll = redesign4 && isAutoDecidePhase(phase);
  const autoAllAccepted =
    auto.length > 0 &&
    auto.every(v => t1Decisions[findingKey(v)] === 'accept');
  const autoAllDeclined =
    auto.length > 0 &&
    auto.every(v => t1Decisions[findingKey(v)] === 'decline');
  const footerRemainingAccept = remainingAiAccept;
  const footerRemainingDecline = remainingAiDecline;
  const autoUndecidedCount = auto.filter(v => {
    const d = t1Decisions[findingKey(v)];
    return d !== 'accept' && d !== 'decline';
  }).length;
  const filtersActive =
    query.trim() !== '' ||
    contentType !== 'all' ||
    category !== 'all' ||
    laneFilter !== 'all' ||
    severityFilter.size > 0 ||
    filterGeneratedAi;
  const clearFilters = () => {
    setQuery('');
    setContentType('all');
    setCategory('all');
    setLaneFilter('all');
    setSeverityFilter(new Set());
    setFilterGeneratedAi(false);
  };
  const showingCountControl = (
    <div className={classes.showingInline}>
      <Typography
        className={classes.bulkCount}
        variant="body2"
        color="textSecondary"
      >
        {showingCount} showing out of {showingTotal}
      </Typography>
      {filtersActive ? (
        <Button
          variant="text"
          color="primary"
          size="small"
          className={classes.clearFilters}
          onClick={clearFilters}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
  const generateAiLabel = `Generate remediations with AI (${idleAi.length})`;
  const diffDisplayToggle = (
    <ToggleButtonGroup
      exclusive
      size="small"
      className={classes.diffToggle}
      value={sideBySide ? 'split' : 'stacked'}
      onChange={(_event, next: 'stacked' | 'split' | null) => {
        if (next == null) return;
        onSideBySideChange?.(next === 'split');
      }}
      aria-label="Diff layout"
    >
      <ToggleButton value="stacked" aria-label="Stacked" title="Stacked" sx={DIFF_TOGGLE_SX}>
        <DiffStackedIcon />
      </ToggleButton>
      <ToggleButton value="split" aria-label="Side by side" title="Side by side" sx={DIFF_TOGGLE_SX}>
        <DiffSplitIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
  const aiGenerateBanner =
    phase === 'ai' && redesign3Plus && (idleAi.length > 0 || aiLoading) ? (
      <div className={classes.aiBanner} role="status">
        <InfoOutlinedIcon className={classes.aiBannerIcon} aria-hidden />
        <Typography className={classes.aiBannerCopy} variant="body2">
          {aiLoading
            ? loadingAiCount === 1
              ? 'Generating 1 AI remediation.'
              : `Generating ${loadingAiCount} AI remediations.`
            : idleAi.length === 1
              ? '1 finding has no remediation suggestion yet. Generate an AI remediation to review it.'
              : `${idleAi.length} findings have no remediation suggestions yet. Generate AI remediations to review them.`}
        </Typography>
        <Button
          className={classes.aiBannerAction}
          size="small"
          variant="contained"
          color="primary"
          disabled={aiLoading || idleAi.length === 0}
          startIcon={<LightspeedSpark size={14} />}
          onClick={generateAll}
          style={PILL}
        >
          {aiLoading ? 'Generating…' : generateAiLabel}
        </Button>
      </div>
    ) : null;
  const phaseTabs: ReviewTab[] =
    phase === 'ai' || phase === 'autofix' || phase === 'review'
      ? []
      : phase === 'results'
          ? REDESIGN_TABS.filter(tab => tab === 'All' || laneCount[tab] > 0)
          : phase === 'work'
            ? WORK_TABS.filter(tab => tab === 'All' || laneCount[tab] > 0)
            : currentRedesign
              ? REDESIGN_TABS
              : LANE_TABS;
  const autoAcceptChecked = auto.length > 0 && autoUndecidedCount === 0 && autoAccepted > 0;
  const autoAcceptIndeterminate = autoAccepted > 0 && autoUndecidedCount > 0;
  const includeAllLabel =
    phase === 'review'
      ? 'Include all auto remediations'
      : `Auto-accept all ${
          usesRemediationVocab(phase) ? 'auto remediations' : 'auto-fixes'
        }`;
  const includeAllExplain =
    phase === 'review' ? REVIEW_INCLUDE_EXPLAIN : AUTO_ACCEPT_EXPLAIN;
  const autoAcceptControl =
    auto.length > 0 ? (
      <label className={classes.autoAcceptControl}>
        <Checkbox
          color="primary"
          size="small"
          checked={autoAcceptChecked}
          indeterminate={autoAcceptIndeterminate}
          onChange={(_event, checked) =>
            checked ? acceptUndeclinedAutoFixes() : clearAcceptedAutoFixes()
          }
        />
        <Typography
          variant="body2"
          color="textSecondary"
          component="span"
          className={classes.autoAcceptLabel}
        >
          {includeAllLabel}
          <Tooltip title={includeAllExplain} arrow>
            <span
              className={classes.catHelpHit}
              tabIndex={0}
              aria-label={includeAllExplain}
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onMouseDown={event => event.preventDefault()}
            >
              <HelpOutlineIcon
                fontSize="inherit"
                color="disabled"
                aria-hidden
              />
            </span>
          </Tooltip>
        </Typography>
      </label>
    ) : null;
  const bulkAcceptDecline = (
    <>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        startIcon={<CheckIcon />}
        disabled={remainingForTab === 0}
        onClick={() => decideItems(remainingItems, 'accept')}
        style={PILL}
      >
        Accept remaining{remainingForTab > 0 ? ` (${remainingForTab})` : ''}
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        startIcon={<CloseIcon />}
        disabled={remainingForTab === 0}
        onClick={() => decideItems(remainingItems, 'decline')}
        style={PILL}
      >
        Decline remaining{remainingForTab > 0 ? ` (${remainingForTab})` : ''}
      </Button>
    </>
  );
  const continueButton = (
    <span className={classes.footerContinue}>
      <Button
        size="small"
        variant="contained"
        color="primary"
        disabled={nextLocked}
        onClick={nextLocked ? undefined : onNext}
        style={PILL}
        title={
          nextLocked
            ? phase === 'autofix' || isCombinedPhase(phase)
              ? usesRemediationVocab(phase)
                ? 'Accept or decline each auto remediation to continue'
                : 'Accept or decline each auto-fix to continue'
              : phase === 'ai'
                ? aiLoading
                  ? 'Wait for AI generation to finish'
                  : 'Accept or decline each generated AI remediation to continue'
                : currentRedesign
                  ? redesign4
                    ? 'Accept at least one remediation to continue'
                    : 'Accept at least one suggestion to continue'
                  : `${jobTitle} ${decideCount}`
            : undefined
        }
      >
        Continue
      </Button>
    </span>
  );
  const generateButton =
    aiLoading ? (
      <Button
        size="small"
        variant="contained"
        color="primary"
        disabled
        startIcon={<LightspeedSpark size={14} />}
        style={PILL}
      >
        Generating…
      </Button>
    ) : idleAi.length > 0 ? (
      <Tooltip title="Generating suggestions uses Lightspeed quota.">
        <span>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<LightspeedSpark size={14} />}
            onClick={generateAll}
            style={PILL}
          >
            {generateAiLabel}
          </Button>
        </span>
      </Tooltip>
    ) : null;
  const closeActions = () => {
    setActionsAnchor(null);
  };

  const stampTabAll = (value: WizardDecision) => {
    if (fixType === 'Auto-fix') stampAutoFixes(value);
    else if (fixType === 'AI-fix') stampAiFixes(value);
    else {
      stampAutoFixes(value);
      stampAiFixes(value);
    }
    closeActions();
  };

  const stampRemaining = (value: WizardDecision) => {
    decideItems(remainingItems, value);
    closeActions();
  };

  const tabCanAcceptAll =
    fixType === 'AI-fix'
      ? readyAi.length > 0
      : fixType === 'Auto-fix'
        ? auto.length > 0
        : auto.length > 0 || readyAi.length > 0;
  const tabCanDeclineAll =
    fixType === 'AI-fix'
      ? ai.length > 0
      : fixType === 'Auto-fix'
        ? auto.length > 0
        : auto.length > 0 || ai.length > 0;
  const acceptAllLabel =
    fixType === 'Auto-fix'
      ? usesRemediationVocab(phase)
        ? 'Accept all auto remediations'
        : 'Accept all auto-fixes'
      : fixType === 'AI-fix'
        ? usesRemediationVocab(phase)
          ? 'Accept all AI remediations'
          : 'Accept all AI-fixes'
        : 'Accept all';
  const declineAllLabel =
    fixType === 'Auto-fix'
      ? usesRemediationVocab(phase)
        ? 'Decline all auto remediations'
        : 'Decline all auto-fixes'
      : fixType === 'AI-fix'
        ? usesRemediationVocab(phase)
          ? 'Decline all AI remediations'
          : 'Decline all AI-fixes'
        : 'Decline all';

  const includeMenuItems = (
    <>
      {phase === 'ai' ? null : (
        <MenuItem
          className={classes.menuItemDescribed}
          disabled={auto.length === 0}
          selected={bulkPolicy === 'accept-auto'}
          onClick={() => {
            stampAutoFixes('accept');
            closeActions();
          }}
        >
          <ListItemText
            primary={
              usesRemediationVocab(phase)
                ? 'Accept all auto remediations'
                : 'Accept all auto-fixes'
            }
            secondary={INCLUDE_MENU_EXPLAIN.auto}
          />
        </MenuItem>
      )}
      {phase === 'autofix' || isCombinedPhase(phase) ? null : (
        <MenuItem
          className={classes.menuItemDescribed}
          disabled={readyAi.length === 0}
          selected={bulkPolicy === 'accept-ai'}
          onClick={() => {
            stampAiFixes('accept');
            closeActions();
          }}
        >
          <ListItemText
            primary={
              usesRemediationVocab(phase) ? 'Accept AI remediations' : 'Accept AI-fixes'
            }
            secondary={INCLUDE_MENU_EXPLAIN.ai}
          />
        </MenuItem>
      )}
      <Divider />
      <MenuItem
        disabled={remainingSuggestions.length === 0}
        onClick={() => {
          excludeItems(remainingSuggestions);
          closeActions();
        }}
      >
        Decline remaining
        {remainingSuggestions.length > 0
          ? ` (${remainingSuggestions.length})`
          : ''}
      </MenuItem>
      {phase === 'ai' ? null : (
        <MenuItem
          disabled={
            auto.length === 0 ||
            auto.every(v => t1Decisions[findingKey(v)] === 'decline')
          }
          onClick={() => {
            stampAutoFixes('decline');
            closeActions();
          }}
        >
          {usesRemediationVocab(phase) ? 'Decline auto remediations' : 'Decline auto-fixes'}
        </MenuItem>
      )}
      {phase === 'autofix' || isCombinedPhase(phase) ? null : (
        <MenuItem
          disabled={
            readyAi.length === 0 ||
            readyAi.every(v => aiDecisions[findingKey(v)] === 'decline')
          }
          onClick={() => {
            stampAiFixes('decline');
            closeActions();
          }}
        >
          {usesRemediationVocab(phase) ? 'Decline AI remediations' : 'Decline AI-fixes'}
        </MenuItem>
      )}
    </>
  );

  const bulkActionsMenu = (
    <Menu
      id="finding-actions-menu"
      className={classes.actionsMenu}
      anchorEl={actionsAnchor}
      open={Boolean(actionsAnchor)}
      onClose={closeActions}
      getContentAnchorEl={null}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <MenuItem disabled={remainingForTab === 0} onClick={() => stampRemaining('accept')}>
        Accept remaining{remainingForTab > 0 ? ` (${remainingForTab})` : ''}
      </MenuItem>
      {redesign3Plus ? null : (
        <MenuItem disabled={remainingForTab === 0} onClick={() => stampRemaining('decline')}>
          Decline remaining{remainingForTab > 0 ? ` (${remainingForTab})` : ''}
        </MenuItem>
      )}
      <Divider />
      <MenuItem disabled={!tabCanAcceptAll} onClick={() => stampTabAll('accept')}>
        {acceptAllLabel}
      </MenuItem>
      {redesign3Plus ? null : (
        <MenuItem disabled={!tabCanDeclineAll} onClick={() => stampTabAll('decline')}>
          {declineAllLabel}
        </MenuItem>
      )}
      {fixType === 'All' ? (
        <>
          <Divider />
          <MenuItem
            disabled={auto.length === 0}
            selected={bulkPolicy === 'accept-auto'}
            onClick={() => {
              stampAutoFixes('accept');
              closeActions();
            }}
          >
            Accept all auto-fixes
          </MenuItem>
          {redesign3Plus ? null : (
            <MenuItem
              disabled={auto.length === 0}
              selected={bulkPolicy === 'decline-auto'}
              onClick={() => {
                stampAutoFixes('decline');
                closeActions();
              }}
            >
              Decline auto-fixes
            </MenuItem>
          )}
          <MenuItem
            disabled={readyAi.length === 0}
            selected={bulkPolicy === 'accept-ai'}
            onClick={() => {
              stampAiFixes('accept');
              closeActions();
            }}
          >
            Accept AI-fixes
          </MenuItem>
          {redesign3Plus ? null : (
            <MenuItem
              disabled={ai.length === 0}
              selected={bulkPolicy === 'decline-ai'}
              onClick={() => {
                stampAiFixes('decline');
                closeActions();
              }}
            >
              Decline AI-fixes
            </MenuItem>
          )}
        </>
      ) : null}
    </Menu>
  );

  const redesignActionsControl =
    phase !== 'results' &&
    currentRedesign &&
    (isAutoDecidePhase(phase) ? fixType === 'Auto-fix' : fixType !== 'Manual-fix') &&
    (auto.length > 0 || ai.length > 0) ? (
      redesign4 ? (
        <div className={classes.bulkTwinActions}>
          {isAutoDecidePhase(phase) ? (
            <div
              className={classes.bulkTwinActions}
              role="group"
              aria-label="Accept or decline remaining auto remediations"
            >
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<CheckIcon />}
                disabled={remainingAutoAccept.length === 0}
                onClick={() => stampT1Items(remainingAutoAccept, 'accept')}
                style={PILL}
              >
                Accept remaining
                {remainingAutoAccept.length > 0
                  ? ` (${remainingAutoAccept.length})`
                  : ''}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<CloseIcon />}
                disabled={remainingAutoDecline.length === 0}
                onClick={() => stampT1Items(remainingAutoDecline, 'decline')}
                style={PILL}
              >
                Decline remaining
                {remainingAutoDecline.length > 0
                  ? ` (${remainingAutoDecline.length})`
                  : ''}
              </Button>
            </div>
          ) : (
            <div
              className={classes.bulkTwinActions}
              role="group"
              aria-label="Accept or decline remaining AI remediations"
            >
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<CheckIcon />}
                disabled={remainingSuggestions.length === 0}
                onClick={() => decideItems(remainingSuggestions, 'accept')}
                style={PILL}
              >
                Accept remaining
                {remainingSuggestions.length > 0
                  ? ` (${remainingSuggestions.length})`
                  : ''}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<CloseIcon />}
                disabled={remainingSuggestions.length === 0}
                onClick={() => decideItems(remainingSuggestions, 'decline')}
                style={PILL}
              >
                Decline remaining
                {remainingSuggestions.length > 0
                  ? ` (${remainingSuggestions.length})`
                  : ''}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            endIcon={<ArrowDropDownIcon />}
            onClick={event => setActionsAnchor(event.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={Boolean(actionsAnchor)}
            aria-controls={actionsAnchor ? 'finding-actions-menu' : undefined}
            style={PILL}
          >
            {redesign3Plus ? 'Accept suggestions' : 'Actions'}
          </Button>
          {bulkActionsMenu}
        </>
      )
    ) : null;

  const footerRemainingControl = showFooterRemaining ? (
    <div
      className={classes.footerBulk}
      role="group"
      aria-label="Accept or decline remaining AI remediations"
    >
      <Button
        size="small"
        variant="outlined"
        color="primary"
        disabled={footerRemainingAccept.length === 0}
        onClick={() => stampAiItems(footerRemainingAccept, 'accept')}
        style={PILL}
      >
        Accept remaining
        {footerRemainingAccept.length > 0
          ? ` (${footerRemainingAccept.length})`
          : ''}
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        disabled={footerRemainingDecline.length === 0}
        onClick={() => stampAiItems(footerRemainingDecline, 'decline')}
        style={PILL}
      >
        Decline remaining
        {footerRemainingDecline.length > 0
          ? ` (${footerRemainingDecline.length})`
          : ''}
      </Button>
    </div>
  ) : null;

  const footerAllControl = showFooterAll ? (
    <div
      className={classes.footerBulk}
      role="group"
      aria-label="Accept or decline all auto remediations"
    >
      <Button
        size="small"
        variant="outlined"
        color="primary"
        disabled={auto.length === 0 || autoAllAccepted}
        onClick={() => stampAutoFixes('accept')}
        style={PILL}
      >
        Accept all remediations
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        disabled={auto.length === 0 || autoAllDeclined}
        onClick={() => stampAutoFixes('decline')}
        style={PILL}
      >
        Decline all remediations
      </Button>
    </div>
  ) : null;

  const redesignGenerate =
    currentRedesign && !redesign3Plus && (fixType === 'All' || fixType === 'AI-fix')
      ? generateButton
      : null;

  const showSeverityDropdown = false;
  const filterToolbar = showListChrome ? (
        <div
          className={`${classes.toolbar}${
            phase === 'ai' ? ` ${classes.toolbarOnAi}` : ''
          }`}
        >
          <TextField
            className={currentRedesign ? classes.searchFill : classes.search}
            size="small"
            variant="outlined"
            placeholder={searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            inputProps={{ 'aria-label': searchPlaceholder }}
          />
          <FormControl variant="outlined" size="small" className={classes.select}>
            <InputLabel id="visual-content-type-label">Content type</InputLabel>
            <Select
              labelId="visual-content-type-label"
              label="Content type"
              value={contentType}
              onChange={e => setContentType(e.target.value as string)}
            >
              <MenuItem value="all">All content types</MenuItem>
              {contentTypes.map(k => (
                <MenuItem key={k} value={k}>
                  {k} ({tabFindings.filter(f => kindLabel(f) === k).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {showsFindingsFilters(phase) ? null : (
          <FormControl variant="outlined" size="small" className={classes.select}>
            <InputLabel id="visual-category-label">Category</InputLabel>
            <Select
              labelId="visual-category-label"
              label="Category"
              value={category}
              onChange={e => setCategory(e.target.value as 'all' | ApmeRuleCategory)}
            >
              <MenuItem value="all">All categories</MenuItem>
              {presentCategories.map(id => (
                <MenuItem key={id} value={id}>
                  {APME_CATEGORY_LABEL[id]} (
                  {tabFindings.filter(f => apmeCategoryOf(f) === id).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          )}
          {showSeverityDropdown ? (
          <FormControl variant="outlined" size="small" className={classes.select}>
            <InputLabel id="visual-severity-label">Severity</InputLabel>
            <Select
              labelId="visual-severity-label"
              label="Severity"
              value={severitySelect}
              onChange={e => {
                const next = e.target.value as 'all' | SeverityClass;
                setSeverityFilter(next === 'all' ? new Set() : new Set([next]));
              }}
            >
              <MenuItem value="all">All severities</MenuItem>
              {presentSeverities.map(sev => (
                <MenuItem key={sev} value={sev}>
                  {SEV_LABEL[sev]} (
                  {tabFindings.filter(f => f.severity === sev).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          ) : null}
        </div>
  ) : null;

  const findingsTabs =
    phase === 'results' && phaseTabs.length > 0 ? (
      <div className={`${classes.tabsHost} ${classes.findingsTabsHost}`}>
        <HeaderTabs
          selectedIndex={Math.max(
            0,
            phaseTabs.findIndex(tab => tab === fixType),
          )}
          onChange={index => {
            const next = phaseTabs[index];
            if (!next) return;
            setFixType(next);
            setContentType('all');
          }}
          tabs={phaseTabs.map(lane => ({
            id: lane,
            label: (
              <span className={classes.tabLabel}>
                <span>{FINDINGS_TAB_LABEL[lane]}</span>
                <ReadCountBadge
                  count={laneCount[lane]}
                  label={findingsTabCountLabel(lane, laneCount[lane])}
                />
              </span>
            ),
          }))}
        />
      </div>
    ) : null;

  const renderCategoryBreakdownRows = () =>
    visibleCategories.map(cat => (
      <div
        key={cat.id}
        className={`${classes.catRow} ${
          category === cat.id ? classes.catRowSelected : ''
        }`}
        role="button"
        tabIndex={0}
        aria-pressed={category === cat.id}
        aria-label={`${cat.label}, ${cat.count} findings. ${
          category === cat.id ? 'Clear' : 'Apply'
        } filter.`}
        onClick={() => toggleCategory(cat.id)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleCategory(cat.id);
          }
        }}
      >
        <Typography className={classes.catName} variant="body2" component="div">
          {cat.label}
          <Tooltip title={cat.hint} arrow>
            <HelpOutlineIcon
              className={classes.catHelp}
              onClick={event => event.stopPropagation()}
              onKeyDown={event => event.stopPropagation()}
            />
          </Tooltip>
        </Typography>
        <Chip size="small" label={cat.count} className={classes.catCount} />
        <div className={classes.catBar}>
          <SeverityMixBar
            breakdown={cat.breakdown}
            height={FINDINGS_BAR_HEIGHT}
            shareOfTotal={
              visibleCatTotal > 0 ? cat.count / visibleCatTotal : 0
            }
          />
        </div>
      </div>
    ));

  const breakdown = (
    <Collapse in={breakdownOpen}>
      {renderCategoryBreakdownRows()}
    </Collapse>
  );

  const findingsBreakdown = (
    <Collapse in={findingsBreakdownOpen}>
      <div className={classes.findingsBreakdown}>
        <Typography
          className={classes.breakdownSectionTitle}
          variant="subtitle2"
          component="h3"
        >
          Issues by category
        </Typography>
        {renderCategoryBreakdownRows()}
      </div>
    </Collapse>
  );

  const renderFindingRows = (items: QualityViolation[]) => {
    const bundles =
      phase === 'results'
        ? sortFindingsBySeverity(items).map(f => [f])
        : redesign4
          ? groupByNodeOrder(items)
          : items.map(f => [f]);
    return bundles.map(bundle => {
      const primary = bundle[0];
      return (
        <FindingRow
          key={
            phase === 'results' || bundle.length === 1
              ? findingKey(primary)
              : nodeKey(primary)
          }
          finding={primary}
          bundled={redesign4 && bundle.length > 1 ? bundle : undefined}
          decision={sharedDecision(bundle, decisions)}
          aiStatus={aiStatus[findingKey(primary)] ?? 'idle'}
          onDecision={d => onDecision(primary, d)}
          onGenerateAi={
            phase === 'autofix' || showsResultsMix(phase) || phase === 'review'
              ? undefined
              : onGenerateAi
          }
          quietRowActions={currentRedesign}
          hideDecline={redesign3}
          includeInPr={redesign4 && !isAutoDecidePhase(phase)}
          highlight={bundle.some(f => pulseKey === findingKey(f))}
          showLane
          phase={phase}
          sideBySide={sideBySide}
          readOnly={
            phase === 'results' ||
            (isCombinedPhase(phase) && laneOf(primary) !== 'Auto-fix')
          }
        />
      );
    });
  };

  const summaryAndFindings = (
    <>
      {stepDescription ? (
        <Typography
          className={classes.jobHint}
          variant="body2"
          color="textSecondary"
        >
          {stepDescription}
        </Typography>
      ) : null}
      {currentRedesign ? null : (
      <Paper className={classes.box} elevation={0}>
            <div className={classes.boxHead}>
              <Typography className={classes.boxTitle}>Summary</Typography>
            </div>
            <div className={classes.resultsBody}>
              <div className={classes.mixHeader}>
                <Typography className={classes.mixTotal} component="span">
                  {mix.total}
                </Typography>
                <Typography
                  className={classes.mixMeta}
                  variant="body2"
                  color="textSecondary"
                  component="span"
                >
                  {findingWord} on this scan
                </Typography>
              </div>
              <div className={classes.mixBar}>
                <SeverityMixBar
                  breakdown={mix.bySeverity}
                  height={FINDINGS_BAR_HEIGHT}
                  activeSeverities={severityFilter}
                  onSegmentClick={toggleSeverity}
                />
              </div>
              <div className={classes.mixChips}>
                <SeverityFilterChips
                  breakdown={mix.bySeverity}
                  active={severityFilter}
                  onToggle={toggleSeverity}
                />
              </div>
              <div className={classes.toggleRow}>
                <Button
                  variant="text"
                  color="inherit"
                  size="small"
                  className={classes.drawerToggle}
                  endIcon={breakdownOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  aria-expanded={breakdownOpen}
                  onClick={() => setBreakdownOpen(open => !open)}
                >
                  {breakdownOpen ? 'Hide breakdown' : 'Show breakdown'}
                </Button>
              </div>
              {breakdown}
            </div>
      </Paper>
      )}

      <Paper className={classes.box} elevation={0} aria-label={stepHeading || undefined}>
        {showsFindingsFilters(phase) ? null : currentRedesign && phase !== 'autofix' ? (
          <div className={classes.scanCountHead}>
            <div
              className={`${classes.scanCountRow}${
                redesign4 ? ` ${classes.scanCountRowSplit}` : ''
              }`}
            >
              <div className={classes.scanCountCopy}>
                <Typography className={classes.mixTotal} component="span">
                  {phase === 'ai' ? ai.length : mix.total}
                </Typography>
                <Typography
                  className={classes.mixMeta}
                  variant="body2"
                  color="textSecondary"
                  component="span"
                >
                  {phase === 'ai'
                    ? ai.length === 1
                      ? 'finding that needs an AI suggestion'
                      : 'findings that need an AI suggestion'
                    : `${findingWord} on this scan`}
                  {phase !== 'ai' &&
                  !showsResultsMix(phase) &&
                  phase !== 'autofix' &&
                  phase !== 'review' &&
                  redesign4 ? (
                    <>
                      {`, ${remediationCount} ${
                        remediationCount === 1 ? 'remediation' : 'remediations'
                      }`}
                    </>
                  ) : null}
                </Typography>
                {redesign3Plus && !redesign4 ? (
                  <Typography className={classes.scanAside} component="span">
                    <strong>{remediationCount}</strong>
                    {remediationCount === 1 ? ' remediation' : ' remediations'}
                  </Typography>
                ) : null}
              </div>
              {redesign3Plus ? null : (
                <div className={classes.scanSevCounts} aria-label="Findings by severity">
                  {SEV_ORDER.filter(sev => (mix.bySeverity[sev] ?? 0) > 0).map(sev => {
                    const count = mix.bySeverity[sev];
                    const isActive = severityFilter.has(sev);
                    const dim = severityFilter.size > 0 && !isActive;
                    return (
                      <button
                        key={sev}
                        type="button"
                        className={classes.scanSevCount}
                        style={{
                          color: SEVERITY_COLORS[sev],
                          opacity: dim ? 0.4 : 1,
                        }}
                        aria-pressed={isActive}
                        onClick={() => toggleSeverity(sev)}
                      >
                        {SEV_LABEL[sev]} {count}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {inventoryCountItems.length > 0 ? (
              <div
                className={classes.workBreakdown}
                role="group"
                aria-label="Findings by how they can be fixed"
              >
                {inventoryCountItems.map((item, index) => (
                  <Fragment key={item.id}>
                    {index > 0 ? (
                      <Typography className={classes.scanCountSep} component="span">
                        ·
                      </Typography>
                    ) : null}
                    <Typography className={classes.workCount} component="span">
                      {item.count}
                    </Typography>
                    <CountInfo label={item.label} hint={item.hint} />
                  </Fragment>
                ))}
              </div>
            ) : null}
            {redesign4 ? (
              showsResultsMix(phase) || phase === 'autofix' || phase === 'ai' || phase === 'review' ? null : (
              <>
                <div className={classes.scanMixBar}>
                  <SeverityMixBar
                    breakdown={mix.bySeverity}
                    height={FINDINGS_BAR_HEIGHT}
                    activeSeverities={severityFilter}
                    onSegmentClick={toggleSeverity}
                  />
                </div>
                <div className={classes.mixChips}>
                  <SeverityFilterChips
                    breakdown={mix.bySeverity}
                    active={severityFilter}
                    onToggle={toggleSeverity}
                  />
                </div>
                <>
                    <div className={classes.toggleRow}>
                      <Button
                        variant="text"
                        color="inherit"
                        size="small"
                        className={classes.drawerToggle}
                        endIcon={
                          findingsBreakdownOpen ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )
                        }
                        aria-expanded={findingsBreakdownOpen}
                        aria-controls="findings-breakdown"
                        onClick={() => setFindingsBreakdownOpen(open => !open)}
                      >
                        {findingsBreakdownOpen ? 'Hide breakdown' : 'Show breakdown'}
                      </Button>
                    </div>
                    <div id="findings-breakdown">{findingsBreakdown}</div>
                </>
              </>
              )
            ) : redesign3Plus ? null : (
              <div className={classes.scanMixBar}>
                <SeverityMixBar
                  breakdown={mix.bySeverity}
                  height={FINDINGS_BAR_HEIGHT}
                  activeSeverities={severityFilter}
                  onSegmentClick={toggleSeverity}
                />
              </div>
            )}
          </div>
        ) : null}

        {showsResultsMix(phase) ||
        (redesign3Plus && phase === 'bundled') ||
        phaseTabs.length === 0 ? null : (
        <div className={classes.tabsHost}>
          <HeaderTabs
            selectedIndex={Math.max(
              0,
              phaseTabs.findIndex(tab => tab === fixType),
            )}
            onChange={index => {
              const next = phaseTabs[index];
              if (!next) return;
              setFixType(next);
              setContentType('all');
              setCategory('all');
            }}
            tabs={phaseTabs.map(lane => ({
              id: lane,
              label: (
                <span className={classes.tabLabel}>
                  <span>
                    {phase === 'review' && lane !== 'All'
                      ? REVIEW_TAB_LABEL[lane]
                      : reviewTabLabel(lane, phase === 'bundled' && currentRedesign)}
                  </span>
                  <ReadCountBadge
                    count={laneCount[lane]}
                    label={
                      phase === 'review'
                        ? reviewLaneCountLabel(lane, laneCount[lane])
                        : reviewTabCountLabel(
                            lane,
                            laneCount[lane],
                            phase === 'bundled' && currentRedesign,
                          )
                    }
                    tone="read"
                  />
                </span>
              ),
            }))}
          />
        </div>
        )}
        {showsResultsMix(phase) || phase === 'autofix' || phase === 'ai' || phase === 'review' ? (
        <>
        {phase === 'review' ? (
          <div className={classes.findingsCountHead}>
            <Typography className={classes.mixTotal} component="span">
              {mix.total}
            </Typography>
            <Typography
              className={classes.mixMeta}
              variant="body2"
              color="textSecondary"
              component="span"
            >
              {findingWord}
            </Typography>
          </div>
        ) : null}
        {showsFindingsFilters(phase) ? (
        <div
          className={`${classes.resultsMix}${
            phase === 'ai' ? ` ${classes.resultsMixBeforeSearch}` : ''
          }${phase === 'review' ? ` ${classes.resultsMixAfterCount}` : ''}`}
          role="group"
          aria-label={
            phase === 'ai'
              ? 'Severity and category mix for AI remediations'
              : phase === 'autofix'
                ? 'Severity and category mix for auto remediations'
                : 'Severity and category mix for this scan'
          }
        >
          <SeverityFilterChips
            breakdown={mixFromFindings(mixFindings).bySeverity}
            active={severityFilter}
            onToggle={toggleSeverity}
            categories={
              categoryAsChips
                ? mixFromFindings(mixFindings).categories.map(cat => ({
                    id: cat.id,
                    label: cat.label,
                    count: cat.count,
                    hint: cat.hint,
                  }))
                : undefined
            }
            activeCategory={categoryAsChips ? category : undefined}
            onToggleCategory={
              categoryAsChips
                ? id => toggleCategory(id as ApmeRuleCategory)
                : undefined
            }
          />
        {resultsCatRows.length > 0 && !categoryAsChips ? (
          <div className={classes.resultsCatViz}>
            {resultsCatRows.map(cat => {
              const selected = category === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`${classes.resultsCatRow} ${
                    selected ? classes.resultsCatRowSelected : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${cat.label}, ${cat.count} findings. ${
                    selected ? 'Clear' : 'Apply'
                  } filter. ${cat.hint}`}
                  onClick={() => toggleCategory(cat.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleCategory(cat.id);
                    }
                  }}
                >
                  <Tooltip title={cat.hint} arrow>
                    <Typography
                      className={classes.resultsCatName}
                      variant="body2"
                      component="span"
                    >
                      {cat.label}
                    </Typography>
                  </Tooltip>
                  <Typography
                    className={classes.resultsCatCount}
                    variant="body2"
                    component="span"
                  >
                    {cat.count}
                  </Typography>
                  <div className={classes.resultsCatBar}>
                    <SeverityMixBar
                      breakdown={cat.breakdown}
                      height={FINDINGS_BAR_HEIGHT}
                      shareOfTotal={
                        resultsCatTotal > 0 ? cat.count / resultsCatTotal : 0
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        </div>
        ) : null}
        {phase === 'review' ? (
          <Tabs
            className={classes.reviewLaneTabs}
            value={fixType}
            onChange={(_event, value: ReviewTab) => setFixType(value)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="off"
            aria-label="Findings by remediation type"
          >
            <Tab value="All" label={`All ${laneCount.All}`} />
            {LANE_TABS.map(id => {
              const count = laneCount[id];
              const hint =
                id === 'Auto-fix'
                  ? `${LANE_EXPLAIN[id]} They start accepted.`
                  : id === 'AI-fix'
                    ? REVIEW_AI_TAB_HINT
                    : LANE_EXPLAIN[id];
              return (
                <Tab
                  key={id}
                  value={id}
                  disabled={count === 0}
                  label={
                    <Tooltip title={hint} arrow>
                      <span>
                        {REMEDIATION_LANE_LABEL[id]} {count}
                      </span>
                    </Tooltip>
                  }
                />
              );
            })}
          </Tabs>
        ) : null}
        {filterToolbar}
        {aiGenerateBanner}
        </>
        ) : null}
        {showsResultsMix(phase) || !currentRedesign || redesign3Plus ? null : (
          <Typography className={classes.tabPageHint}>
            {REDESIGN_TAB_HINT[fixType]}
          </Typography>
        )}

        {showsResultsMix(phase) || phase === 'autofix' || phase === 'ai' || phase === 'review' ? null : filterToolbar}

        {(currentRedesign ||
          (fixType !== 'Manual-fix' &&
            (showListChrome || fixType === 'AI-fix' || fixType === 'All'))) &&
        (phase !== 'review' || (reviewShowAutos && reviewAutoItems.length > 0)) ? (
          <div
            className={`${classes.bulkBar}${
              currentRedesign ? ` ${classes.bulkBarSpaced}` : ''
            }${phase === 'results' ? ` ${classes.bulkBarBeforeTabs}` : ''}`}
          >
            {!currentRedesign &&
            phase === 'ai' &&
            fixType === 'AI-fix' &&
            idleAi.length > 0 &&
            !aiLoading ? (
              <Typography className={classes.bulkNote}>
                Optional. Generating suggestions uses Lightspeed quota.
              </Typography>
            ) : null}
            {redesign3Plus ? null : (
            <div className={classes.bulkRow}>
              <Typography className={classes.bulkCount} variant="body2" color="textSecondary">
                {showingLabel}
              </Typography>
              {currentRedesign ? null : phase === 'ai' && fixType === 'AI-fix' && aiLoading ? (
                <div className={classes.bulkActions}>
                  <Button size="small" variant="contained" color="primary" disabled style={PILL}>
                    Generating…
                  </Button>
                </div>
              ) : phase !== 'results' && phase !== 'autofix' && fixType === 'AI-fix' && idleAi.length > 0 ? (
                <div className={classes.bulkActions}>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={generateAll}
                    style={PILL}
                  >
                    {generateAiLabel}
                  </Button>
                  {readyAi.length > 0 ? bulkAcceptDecline : null}
                </div>
              ) : (
                <div className={classes.bulkActions}>{bulkAcceptDecline}</div>
              )}
            </div>
            )}
            {currentRedesign &&
            (redesign3Plus || redesignActionsControl || redesignGenerate) ? (
              <>
                <div className={classes.bulkListActions} role="region" aria-label="Bulk finding actions">
                  {redesign4 ? (
                    showingCountControl
                  ) : redesign3Plus ? (
                    <Typography
                      className={classes.bulkCount}
                      variant="body2"
                      color="textSecondary"
                    >
                      {showingLabel}
                    </Typography>
                  ) : (
                    <div>{redesignActionsControl}</div>
                  )}
                  {phase === 'results' || showFooterRemaining || showFooterAll
                    ? diffDisplayToggle
                    : (
                    <div className={classes.bulkTwinActions}>
                      {redesign3Plus ? redesignActionsControl : redesignGenerate}
                      {diffDisplayToggle}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {findingsTabs}

        {((phase === 'review'
          ? reviewAutoItems.length === 0 &&
            reviewAi.length === 0 &&
            reviewManual.length === 0
          : files.length === 0) &&
          !reviewShowAi &&
          !reviewShowManual) ||
        (phase === 'review' &&
          !reviewShowAutos &&
          !reviewShowAi &&
          !reviewShowManual) ? (
          <Typography className={classes.empty} variant="body2" color="textSecondary">
            No findings match the current filters.
          </Typography>
        ) : reviewShowAutos &&
          (phase === 'review' ? reviewAutoItems.length > 0 : files.length > 0) ? (
          <div className={classes.fileList} id="review-autos">
            {renderFindingRows(
              phase === 'review'
                ? reviewAutoItems
                : files.flatMap(group => group.findings),
            )}
          </div>
        ) : null}
        {phase === 'review' && (reviewShowAi || reviewShowManual) ? (
          <div className={classes.reviewRemainder}>
            {reviewShowAi ? (
              <>
                {fixType === 'All' ? (
                  <>
                    <Typography
                      className={classes.reviewRemainderHead}
                      component="h3"
                      id="review-needs-ai"
                    >
                      Needs AI
                    </Typography>
                    <Typography className={classes.reviewRemainderHint} component="p">
                      {REVIEW_AI_TAB_HINT}
                    </Typography>
                  </>
                ) : null}
                {renderFindingRows(reviewAi)}
              </>
            ) : null}
            {reviewShowManual ? (
              <>
                {fixType === 'All' ? (
                  <>
                    <Typography
                      className={classes.reviewRemainderHead}
                      component="h3"
                      id="review-manual"
                    >
                      Manual only
                    </Typography>
                    <Typography className={classes.reviewRemainderHint} component="p">
                      {REVIEW_MANUAL_TAB_HINT}
                    </Typography>
                  </>
                ) : null}
                {renderFindingRows(reviewManual)}
              </>
            ) : null}
          </div>
        ) : null}
      </Paper>
    </>
  );

  return (
    <div className={`${classes.stack}${useFooter ? ` ${classes.stackFill}` : ''}`}>
      {currentRedesign ? null : useFooter ? null : (
        <div
          className={classes.stepChrome}
          role="region"
          aria-label="Remediation step actions"
        >
          <div className={classes.stepChromeTop}>
          <Typography className={classes.stepCopy}>{jobTitle}</Typography>
          <div className={classes.stepActions}>
            <Typography className={classes.stepProgress} component="span">
              {decideCount}
            </Typography>
            {continueButton}
            <Button size="small" variant="outlined" onClick={onCancel} style={PILL}>
              Cancel
            </Button>
          </div>
          </div>
        </div>
      )}
      {useFooter ? (
        <div
          className={`${classes.scrollBody}${
            currentRedesign ? ` ${classes.scrollBodyRedesign}` : ''
          }`}
        >
          {header}
          {summaryAndFindings}
        </div>
      ) : (
        <div className={classes.cards}>{summaryAndFindings}</div>
      )}
      {useFooter ? (
        <div
          className={`${classes.wizardFooter}${
            currentRedesign ? ` ${classes.wizardFooterWork}` : ''
          }`}
          role="region"
          aria-label="Remediation step actions"
        >
          <div className={classes.footerStatus}>
            {isCombinedPhase(phase) || phase === 'ai' || phase === 'autofix' ? (
              <div
                className={classes.footerAccepted}
                aria-label={commitSummaryLabel}
              >
                {showAutoSuggestionCount ? (
                  <>
                    <Typography
                      className={`${classes.footerStat} ${classes.footerStatRemain}`}
                      variant="body2"
                      component="span"
                    >
                      {autoSuggestionLabel}
                    </Typography>
                    <Typography
                      className={classes.footerLead}
                      variant="body2"
                      component="span"
                    >
                      ,{' '}
                    </Typography>
                  </>
                ) : null}
                <Typography
                  className={`${classes.footerStat} ${classes.footerStatAccept}`}
                  variant="body2"
                  component="span"
                >
                  <CheckIcon className={classes.footerStatIcon} aria-hidden />
                  {commitAccepted} accepted
                </Typography>
                <Typography
                  className={classes.footerLead}
                  variant="body2"
                  component="span"
                >
                  ,{' '}
                </Typography>
                <Typography
                  className={`${classes.footerStat} ${classes.footerStatDecline}`}
                  variant="body2"
                  component="span"
                >
                  <CloseIcon className={classes.footerStatIcon} aria-hidden />
                  {commitDeclined} declined
                </Typography>
                {showFooterRemainCount ? (
                  <>
                    <Typography
                      className={classes.footerLead}
                      variant="body2"
                      component="span"
                    >
                      ,{' '}
                    </Typography>
                    <Typography
                      className={`${classes.footerStat} ${classes.footerStatRemain}`}
                      variant="body2"
                      component="span"
                    >
                      {commitRemaining} remaining
                    </Typography>
                  </>
                ) : null}
              </div>
            ) : footerRemainingControl ? (
              footerRemainingControl
            ) : phase === 'work' ? (
              autoAcceptControl
            ) : currentRedesign ? null : (
              <>
                {jobTitle}
                <span className={classes.footerCount}>{decideCount}</span>
              </>
            )}
          </div>
          <div
            className={`${classes.footerActions}${
              currentRedesign ? ` ${classes.footerClearFab}` : ''
            }`}
          >
            {currentRedesign ? null : (
              <Button
                size="small"
                variant="text"
                color="inherit"
                className={classes.footerCancel}
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            {footerAllControl}
            {showFooterRemaining ? footerRemainingControl : null}
            {continueButton}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FindingRow: React.FC<{
  finding: QualityViolation;
  bundled?: QualityViolation[];
  decision?: WizardDecision;
  aiStatus: AiRowStatus;
  onDecision: (d: WizardDecision | null) => void;
  onGenerateAi?: (key: string) => void;
  quietRowActions?: boolean;
  hideDecline?: boolean;
  includeInPr?: boolean;
  highlight?: boolean;
  showLane?: boolean;
  phase?: ReviewPhase;
  sideBySide?: boolean;
  readOnly?: boolean;
}> = ({
  finding,
  bundled,
  decision,
  aiStatus,
  onDecision,
  onGenerateAi,
  hideDecline,
  includeInPr,
  highlight,
  showLane = true,
  phase,
  sideBySide = false,
  readOnly,
}) => {
  const classes = useStyles();
  const copies = bundled && bundled.length > 0 ? bundled : [finding];
  const lane = laneOf(finding);
  const key = findingKey(finding);
  const rowClass =
    decision === 'accept'
      ? `${classes.issueCard} ${classes.rowAccept}`
      : decision === 'decline'
        ? `${classes.issueCard} ${classes.rowDecline}`
        : includeInPr
          ? `${classes.issueCard} ${classes.rowNeutral}`
          : classes.issueCard;
  const acceptFilled = decision === 'accept';
  const declineFilled = decision === 'decline';

  const suggestionActions = hideDecline ? (
    <Button
      size="small"
      variant={acceptFilled ? 'contained' : 'outlined'}
      color={acceptFilled ? 'inherit' : 'primary'}
      className={acceptFilled ? classes.rowBtnAccepted : undefined}
      startIcon={<CheckIcon />}
      style={PILL_COMPACT}
      disabled={readOnly}
      aria-pressed={acceptFilled}
      onClick={() => {
        if (readOnly) return;
        onDecision(
          acceptFilled && !isAutoDecidePhase(phase ?? 'bundled')
            ? null
            : 'accept',
        );
      }}
    >
      {acceptFilled ? 'Accepted' : 'Accept'}
    </Button>
  ) : (
    <ToggleButtonGroup
      exclusive
      size="small"
      className={classes.rowToggle}
      disabled={readOnly}
      value={
        decision === 'accept' || decision === 'decline' ? decision : null
      }
      onChange={(_event, next: WizardDecision | null) => {
        if (readOnly) return;
        if (next == null) {
          if (isAutoDecidePhase(phase ?? 'bundled')) return;
          onDecision(null);
          return;
        }
        onDecision(next);
      }}
      aria-label="Accept or decline this remediation"
    >
      <ToggleButton value="accept" className={classes.rowToggleAccept} sx={ACCEPT_TOGGLE_SX}>
        <CheckIcon style={{ fontSize: 14 }} />
        {acceptFilled ? 'Accepted' : 'Accept'}
      </ToggleButton>
      <ToggleButton value="decline" className={classes.rowToggleDecline} sx={DECLINE_TOGGLE_SX}>
        <CloseIcon style={{ fontSize: 14 }} />
        {declineFilled ? 'Declined' : 'Decline'}
      </ToggleButton>
    </ToggleButtonGroup>
  );

  const openDevSpaces = (item: QualityViolation = finding) =>
    window.open(
      `/devspaces-mockup.html?file=${encodeURIComponent(
        item.file || '',
      )}&line=${item.lineStart}&tier=${item.fixTier}&status=open`,
      '_blank',
    );

  const canDecide =
    lane === 'Auto-fix' || (lane === 'AI-fix' && aiStatus === 'ready');
  const devSpacesAction = (
    <Button
      size="small"
      variant="outlined"
      color="primary"
      startIcon={<CodeIcon style={{ fontSize: 14 }} />}
      style={HEADER_ACTION}
      onClick={() => openDevSpaces()}
    >
      Open in Dev Spaces
    </Button>
  );
  const actions = canDecide ? (
      suggestionActions
    ) : lane === 'Manual-fix' ? (
      devSpacesAction
    ) : readOnly ? null : lane === 'AI-fix' && aiStatus === 'loading' ? null : lane === 'AI-fix' ? (
      onGenerateAi ? (
        <Button
          size="small"
          variant="outlined"
          color="primary"
          style={PILL_COMPACT}
          onClick={() => onGenerateAi(key)}
        >
          Generate AI suggestion
        </Button>
      ) : null
    ) : null;

  return (
    <div
      className={`${rowClass}${highlight ? ` ${classes.pulse}` : ''}`}
      id={`finding-${key}`}
    >
      <div className={classes.cardHead}>
        <div className={classes.cardCopy}>
          {copies.map((item, index) => {
            const itemLane = laneOf(item);
            return (
              <div
                key={findingKey(item)}
                className={index === 0 ? undefined : classes.bundledCopy}
              >
                <Typography className={classes.title} variant="subtitle2">
                  {item.message}
                </Typography>
                <div className={classes.fileMetaRow}>
                <Typography
                  className={classes.fileMeta}
                  variant="caption"
                  color="textSecondary"
                >
                  <span className={classes.filePath}>
                    {item.file || 'Unknown file'}:{item.lineStart}
                  </span>
                  {' · '}
                  {kindLabel(item)}
                  {' · '}
                  {item.ruleId}
                </Typography>
                <div className={classes.chips}>
                  <Chip
                    size="small"
                    label={SEV_LABEL[item.severity] ?? item.severity}
                    className={classes.chip}
                    style={{
                      backgroundColor: SEVERITY_COLORS[item.severity],
                      color: '#fff',
                    }}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={APME_CATEGORY_LABEL[apmeCategoryOf(item)]}
                    className={classes.chip}
                  />
                  {showLane ? (
                    <Tooltip title={LANE_EXPLAIN[itemLane]} arrow>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={laneBadgeLabel(itemLane, phase)}
                        className={classes.chip}
                      />
                    </Tooltip>
                  ) : null}
                </div>
                </div>
              </div>
            );
          })}
        </div>
        {actions && <div className={classes.cardActions}>{actions}</div>}
      </div>
      {copies.map(item => {
        const itemLane = laneOf(item);
        const itemSnip = snippetForRule(item.ruleId);
        const fullDiff = unifiedDiff(itemSnip.current, itemSnip.proposed);
        const split = splitDiff(fullDiff);
        const showProposed =
          itemLane === 'Auto-fix' ||
          (itemLane === 'AI-fix' && aiStatus === 'ready');
        const renderDiffLines = (lines: DiffLine[]) =>
          lines.length === 0 ? (
            <Typography className={classes.diffEmpty}>No snippet for this finding.</Typography>
          ) : (
            lines.map((line, idx) => (
              <div
                key={`${line.kind}-${idx}`}
                className={`${classes.diffLine} ${
                  line.kind === 'del'
                    ? classes.del
                    : line.kind === 'add'
                      ? classes.add
                      : classes.ctx
                }`}
              >
                <span className={classes.gutter} />
                <span>{line.text || ' '}</span>
              </div>
            ))
          );
        const currentLines = showProposed
          ? split.current
          : itemSnip.current.map(text => ({ kind: 'context' as const, text }));
        const findingsNote =
          itemLane === 'AI-fix' ? (
            <p className={classes.splitNote}>{FINDINGS_AI_BODY}</p>
          ) : itemLane === 'Manual-fix' ? (
            <p className={classes.splitNote}>{FINDINGS_MANUAL_BODY}</p>
          ) : null;
        const rightBody = showProposed ? (
          renderDiffLines(split.proposed)
        ) : itemLane === 'AI-fix' && aiStatus === 'loading' ? (
          <div className={classes.suggestionEmpty}>
            <CircularProgress size={16} />
            Generating…
          </div>
        ) : phase === 'results' && findingsNote ? (
          findingsNote
        ) : itemLane === 'AI-fix' && aiStatus === 'idle' ? (
          <p className={classes.splitNote}>
            {onGenerateAi
              ? 'No suggestion yet. Generate this row, or generate all on this tab.'
              : 'No suggestion was generated for this finding. It will stay in the file.'}
          </p>
        ) : itemLane === 'Manual-fix' ? (
          <p className={classes.splitNote}>
            No automatic or AI suggestion. Change this in the file, or leave it.
          </p>
        ) : (
          renderDiffLines(currentLines)
        );

        if (sideBySide) {
          return (
            <div className={classes.splitDiff} key={`diff-${findingKey(item)}`}>
              <div className={classes.splitPane}>
                <div className={classes.splitPaneHead}>Current</div>
                <div className={classes.splitPaneBody}>
                  {renderDiffLines(currentLines)}
                </div>
              </div>
              <div className={classes.splitPane}>
                <div className={classes.splitPaneHead}>Remediation</div>
                <div className={classes.splitPaneBody}>{rightBody}</div>
              </div>
            </div>
          );
        }

        const showRemediation =
          !readOnly &&
          (itemLane === 'Auto-fix' ||
            (itemLane === 'AI-fix' && aiStatus === 'ready'));
        const itemLines: DiffLine[] = showRemediation
          ? fullDiff
          : phase === 'results' || (isCombinedPhase(phase) && itemLane === 'AI-fix')
            ? fullDiff.filter(line => line.kind !== 'add')
            : itemSnip.current.map(text => ({ kind: 'context' as const, text }));
        return (
      <div className={classes.diffBlock} key={`diff-${findingKey(item)}`}>
        {readOnly && itemLane === 'Manual-fix' ? (
          <div className={`${classes.suggestionEmpty} ${classes.suggestionLeadRow}`}>
            <span>{RESULTS_MANUAL_BODY}</span>
          </div>
        ) : null}
        {readOnly && itemLane === 'AI-fix' && isCombinedPhase(phase) ? (
          <div className={`${classes.suggestionEmpty} ${classes.suggestionLeadRow}`}>
            <span>{RESULTS_AI_BODY}</span>
          </div>
        ) : null}
        {itemLines.length === 0 ? (
          <Typography className={classes.diffEmpty}>No snippet for this finding.</Typography>
        ) : (
          itemLines.map((line, idx) => (
            <div
              key={`${line.kind}-${idx}`}
              className={`${classes.diffLine} ${
                line.kind === 'del'
                  ? classes.del
                  : line.kind === 'add'
                    ? classes.add
                    : classes.ctx
              }`}
            >
              <span
                className={`${classes.gutter} ${
                  line.kind === 'del' ? classes.delMark : line.kind === 'add' ? classes.addMark : ''
                }`}
              >
                {line.kind === 'del' ? '−' : line.kind === 'add' ? '+' : ' '}
              </span>
              <span>{line.text || ' '}</span>
            </div>
          ))
        )}
        {itemLane === 'AI-fix' && aiStatus === 'loading' && (
          <div className={classes.suggestionEmpty}>
            <CircularProgress size={16} />
            Generating…
          </div>
        )}
        {!readOnly && itemLane === 'AI-fix' && aiStatus === 'idle' && (
            <div className={classes.suggestionEmpty}>
              {onGenerateAi
                ? 'No suggestion yet. Generate this row, or generate all on this tab.'
                : 'No suggestion was generated for this finding. It will stay in the file.'}
            </div>
        )}
        {!readOnly && itemLane === 'Manual-fix' && (
          <Typography className={classes.suggestionEmpty} variant="body2" color="textSecondary">
            No automatic or AI suggestion. Change this in the file, or leave it.
          </Typography>
        )}
      </div>
        );
      })}
    </div>
  );
};

const COMMIT_CARD_EXIT_MS = 280;

function commitMatchesQuery(finding: QualityViolation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${finding.message} ${finding.file} ${finding.ruleId} ${kindLabel(finding)}`.toLowerCase();
  return hay.includes(q);
}

/** Commit step: last-chance review of what goes in the PR vs what stays in the files. */
export const CommitFindingReview: React.FC<{
  findings: QualityViolation[];
  t1Decisions: Record<string, WizardDecision>;
  setT1Decisions: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  aiDecisions: Record<string, WizardDecision>;
  setAiDecisions: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  aiStatus: Record<string, AiRowStatus>;
  sideBySide?: boolean;
  readOnly?: boolean;
}> = ({
  findings,
  t1Decisions,
  setT1Decisions,
  aiDecisions,
  setAiDecisions,
  aiStatus,
  sideBySide = false,
  readOnly = false,
}) => {
  const classes = useStyles();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<'all' | string>('all');
  const [severity, setSeverity] = useState<'all' | SeverityClass>('all');
  const [remediationType, setRemediationType] = useState<'all' | FixLane>('all');
  const [exitingKeys, setExitingKeys] = useState<string[]>([]);
  const accepted = useMemo(
    () =>
      sortFindingsBySeverity(
        findings.filter(v => {
          const key = findingKey(v);
          if (v.fixTier === 'deterministic') return t1Decisions[key] === 'accept';
          if (v.fixTier === 'ai') return aiDecisions[key] === 'accept';
          return false;
        }),
      ),
    [findings, t1Decisions, aiDecisions],
  );
  const remaining = useMemo(
    () =>
      sortFindingsBySeverity(
        findings.filter(v => {
          const key = findingKey(v);
          if (v.fixTier === 'deterministic') return t1Decisions[key] !== 'accept';
          if (v.fixTier === 'ai') return aiDecisions[key] !== 'accept';
          return true;
        }),
      ),
    [findings, t1Decisions, aiDecisions],
  );
  const contentTypes = useMemo(
    () => Array.from(new Set(findings.map(kindLabel))).sort(),
    [findings],
  );
  const presentSeverities = useMemo(
    () => SEV_ORDER.filter(sev => findings.some(f => f.severity === sev)),
    [findings],
  );
  const presentLanes = useMemo(
    () => LANE_TABS.filter(lane => findings.some(f => laneOf(f) === lane)),
    [findings],
  );
  const tabItems = tab === 0 ? accepted : remaining;
  const listed = useMemo(() => {
    const extras = findings.filter(finding => {
      const key = findingKey(finding);
      return exitingKeys.includes(key) && !tabItems.some(item => findingKey(item) === key);
    });
    return sortFindingsBySeverity([...tabItems, ...extras]).filter(finding => {
      if (contentType !== 'all' && kindLabel(finding) !== contentType) return false;
      if (severity !== 'all' && finding.severity !== severity) return false;
      if (remediationType !== 'all' && laneOf(finding) !== remediationType) return false;
      return commitMatchesQuery(finding, query);
    });
  }, [
    findings,
    tabItems,
    exitingKeys,
    query,
    contentType,
    severity,
    remediationType,
  ]);

  useEffect(() => {
    setExitingKeys([]);
  }, [tab]);

  const decideFinding = (finding: QualityViolation, next: WizardDecision | null) => {
    if (readOnly || next == null) return;
    const key = findingKey(finding);
    const leavesTab =
      (tab === 0 && next !== 'accept') || (tab === 1 && next === 'accept');
    if (leavesTab) {
      setExitingKeys(prev => (prev.includes(key) ? prev : [...prev, key]));
    } else {
      setExitingKeys(prev => prev.filter(item => item !== key));
    }
    if (finding.fixTier === 'ai') {
      setAiDecisions(prev => ({ ...prev, [key]: next }));
      return;
    }
    if (finding.fixTier === 'deterministic') {
      setT1Decisions(prev => ({ ...prev, [key]: next }));
    }
  };

  const filtersActive =
    query.trim() !== '' ||
    contentType !== 'all' ||
    severity !== 'all' ||
    remediationType !== 'all';
  const emptyCopy =
    filtersActive
      ? 'No remediations match these filters.'
      : tab === 0
        ? readOnly
          ? 'No remediations were included in this pull request.'
          : 'No remediations will be included in this commit.'
        : readOnly
          ? 'No remaining issues.'
          : 'No remaining issues. Every finding with a remediation is in this commit.';

  return (
    <Paper variant="outlined" className={classes.commitReview} elevation={0}>
      <div className={classes.commitFilters}>
        <TextField
          className={classes.searchFill}
          size="small"
          variant="outlined"
          placeholder="Search remediations"
          value={query}
          onChange={e => setQuery(e.target.value)}
          inputProps={{ 'aria-label': 'Search remediations' }}
        />
        <div className={classes.commitFilterSelects}>
        <FormControl variant="outlined" size="small" className={classes.commitSelect}>
          <InputLabel id="commit-severity-label">Severity</InputLabel>
          <Select
            labelId="commit-severity-label"
            label="Severity"
            value={severity}
            onChange={e =>
              setSeverity(e.target.value as 'all' | SeverityClass)
            }
            renderValue={value =>
              value === 'all'
                ? 'All severities'
                : SEV_LABEL[value as SeverityClass]
            }
          >
            <MenuItem value="all">All severities</MenuItem>
            {presentSeverities.map(sev => (
              <MenuItem key={sev} value={sev}>
                {SEV_LABEL[sev]} (
                {tabItems.filter(f => f.severity === sev).length})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" className={classes.commitSelect}>
          <InputLabel id="commit-remediation-type-label">
            Remediation type
          </InputLabel>
          <Select
            labelId="commit-remediation-type-label"
            label="Remediation type"
            value={remediationType}
            onChange={e =>
              setRemediationType(e.target.value as 'all' | FixLane)
            }
            renderValue={value =>
              value === 'all'
                ? 'All remediation types'
                : REMEDIATION_LANE_LABEL[value as FixLane]
            }
          >
            <MenuItem value="all">All remediation types</MenuItem>
            {presentLanes.map(lane => (
              <MenuItem key={lane} value={lane}>
                {REMEDIATION_LANE_LABEL[lane]} (
                {tabItems.filter(f => laneOf(f) === lane).length})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" className={classes.commitSelect}>
          <InputLabel id="commit-content-type-label">Content type</InputLabel>
          <Select
            labelId="commit-content-type-label"
            label="Content type"
            value={contentType}
            onChange={e => setContentType(e.target.value as string)}
            renderValue={value =>
              value === 'all' ? 'All content types' : String(value)
            }
          >
            <MenuItem value="all">All content types</MenuItem>
            {contentTypes.map(kind => (
              <MenuItem key={kind} value={kind}>
                {kind} ({tabItems.filter(f => kindLabel(f) === kind).length})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </div>
      </div>
      <div className={`${classes.tabsHost} ${classes.findingsTabsHost}`}>
        <HeaderTabs
          selectedIndex={tab}
          onChange={index => setTab(index)}
          tabs={[
            {
              id: 'accepted',
              label: (
                <span className={classes.tabLabel}>
                  <span>Accepted remediations</span>
                  <ReadCountBadge
                    count={accepted.length}
                    label={`${accepted.length} accepted remediations`}
                    showZero
                  />
                </span>
              ),
            },
            {
              id: 'remaining',
              label: (
                <span className={classes.tabLabel}>
                  <span>Remaining issues</span>
                  <ReadCountBadge
                    count={remaining.length}
                    label={`${remaining.length} remaining issues`}
                    showZero
                  />
                </span>
              ),
            },
          ]}
        />
      </div>
      <Typography className={classes.commitTabHint} variant="body2" component="p">
        {tab === 0
          ? readOnly
            ? 'These remediations are in the pull request.'
            : 'These remediations go into the pull request. Decline one to leave it out.'
          : readOnly
            ? 'These were not included in the pull request.'
            : 'These stay in the files. Accept a remediation to include it in this commit.'}
      </Typography>
      <div className={classes.commitList}>
        {listed.length === 0 ? (
          <Typography color="textSecondary" variant="body2">
            {emptyCopy}
          </Typography>
        ) : (
          listed.map(finding => {
            const key = findingKey(finding);
            const decision =
              finding.fixTier === 'ai' ? aiDecisions[key] : t1Decisions[key];
            return (
              <Collapse
                key={key}
                in={!exitingKeys.includes(key)}
                timeout={{ enter: 0, exit: COMMIT_CARD_EXIT_MS }}
                unmountOnExit
                onExited={() =>
                  setExitingKeys(prev => prev.filter(item => item !== key))
                }
              >
                <FindingRow
                  finding={finding}
                  decision={decision}
                  aiStatus={aiStatus[key] ?? 'idle'}
                  onDecision={next => decideFinding(finding, next)}
                  showLane
                  sideBySide={sideBySide}
                  readOnly={readOnly}
                />
              </Collapse>
            );
          })
        )}
      </div>
    </Paper>
  );
};

