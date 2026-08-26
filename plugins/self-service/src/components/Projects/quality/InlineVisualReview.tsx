/**
 * Visual redesign of Inline AI Results & Remediation (`?wizard=visual`).
 * Structure follows the ephemeral step-2 prototype: Continue under the
 * stepper, Summary (severity), then findings. Current: Auto-fix / AI-fix /
 * Not fixable. Current redesign: All / Auto-fix / AI-fix / Manual. AI spend
 * lives with Generate AI suggestions (Lightspeed quota — no fake
 * token or dollar estimates). `ctaLayout=footer` parks Continue in a sticky
 * footer instead. `reviewLayout=redesign` is a fork of Current: All tab,
 * Actions + Generate under the showing count, Continue in a sticky footer.
 * `redesign3` starts as a duplicate of that fork. `redesign4` copies
 * Redesign 3: compact Accept / Decline toggle (undecided / accepted /
 * declined). Auto-accept all auto-fixes checkbox seeds Accepted. Accept
 * remaining takes only undecided rows. Continue commits accepted remediations.
 */

import { useLayoutEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
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
import { fade, type Theme } from '@material-ui/core/styles';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
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
  type AiRowStatus,
  type WizardDecision,
} from './SpaRemediationReview';
import { snippetForRule } from './spaWizardSnippets';
import { unifiedDiff, type DiffLine } from './qualityDiff';
import { ReadCountBadge } from '../../common/ReadCountBadge';

const PILL = { borderRadius: 20, textTransform: 'none' as const, fontWeight: 600 };
const PILL_COMPACT = { ...PILL, minWidth: 0, padding: '2px 12px' };

const LightspeedSpark = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

export type CtaLayout = 'current' | 'footer';
/** Current = Continue under the stepper. Redesign / 3 / 4 = forks of Current. */
export type ReviewLayout = 'current' | 'redesign' | 'redesign3' | 'redesign4';

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
const TAB_LABEL: Record<FixLane, string> = {
  'Auto-fix': 'Auto-fix',
  'AI-fix': 'AI-fix',
  'Manual-fix': 'Not fixable',
};

const TAB_COUNT_LABEL: Record<FixLane, (n: number) => string> = {
  'Auto-fix': n => `${n} auto-fixes`,
  'AI-fix': n => `${n} AI-fixes`,
  'Manual-fix': n => `${n} not-fixable findings`,
};

function reviewTabLabel(tab: ReviewTab, redesign: boolean, redesign3 = false): string {
  if (redesign3) {
    if (tab === 'All') return 'All findings';
    if (tab === 'Auto-fix') return 'Auto-fix remediations';
    if (tab === 'AI-fix') return 'AI-fix remediations';
    return 'Manual remediations';
  }
  if (tab === 'All') return 'All';
  if (tab === 'Manual-fix') return redesign ? 'Manual' : 'Not fixable';
  return TAB_LABEL[tab];
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
  if (tab === 'Manual-fix' && redesign) return `${n} manual findings`;
  return TAB_COUNT_LABEL[tab](n);
}

const REDESIGN_TAB_HINT: Record<ReviewTab, string> = {
  All: 'Auto-fix, AI-fix, and manual findings together.',
  'Auto-fix': 'Replacements the scan already suggested.',
  'AI-fix': 'Optional Lightspeed suggestions. Generating uses quota.',
  'Manual-fix': 'No suggestion. Change these in the file, or leave them.',
};

/** What each fix type is — no product names, no quota talk. */
const LANE_EXPLAIN: Record<FixLane, string> = {
  'Auto-fix': 'Exact replacement the scan already computed',
  'AI-fix': 'Suggested replacement you generate, then review',
  'Manual-fix': 'No replacement. Change this in the file yourself',
};

const INCLUDE_MENU_EXPLAIN = {
  auto: 'Exact replacements the scan already computed.',
  ai: 'Suggested replacements you generate for a finding, then review.',
};

const AUTO_ACCEPT_EXPLAIN =
  'Exact replacements the scan already computed. They start accepted. Decline any you do not want in the PR.';

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
    flexWrap: 'wrap',
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
    flex: '1 1 220px',
    color: theme.palette.text.secondary,
    minWidth: 0,
  },
  footerLead: {
    display: 'block',
    color: theme.palette.text.primary,
  },
  footerHint: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
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
    marginLeft: 'auto',
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
  scanMixBar: {
    width: '100%',
    height: FINDINGS_BAR_HEIGHT,
  },
  aiBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
    margin: theme.spacing(0, 2, 1.5),
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
  drawerToggleEnd: {
    textTransform: 'none',
    color: theme.palette.text.secondary,
    padding: theme.spacing(0.5, 1.25),
    minWidth: 0,
    borderRadius: 16,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    marginLeft: 'auto',
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
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  showingRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    width: '100%',
  },
  clearFilters: {
    textTransform: 'none',
    minWidth: 0,
    padding: theme.spacing(0.25, 0.75),
  },
  decisionGroup: {
    '& .MuiToggleButton-root': {
      textTransform: 'none',
      padding: theme.spacing(0.25, 1.25),
    },
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
  tabs: {
    minHeight: 40,
    paddingLeft: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  tab: {
    textTransform: 'none',
    fontWeight: 600,
    minHeight: 40,
    minWidth: 0,
    padding: theme.spacing(1, 1.25, 0.75),
    marginRight: theme.spacing(1),
  },
  tabLabel: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  tabPageHint: {
    ...theme.typography.body2,
    padding: theme.spacing(1.25, 2, 0),
    color: theme.palette.text.secondary,
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
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
  },
  cardCopy: { minWidth: 0, flex: 1 },
  title: {
    ...theme.typography.subtitle2,
    color: theme.palette.text.primary,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 },
  chip: { height: 22 },
  fileMeta: {
    ...theme.typography.caption,
    marginTop: 4,
    color: theme.palette.text.secondary,
    wordBreak: 'break-all',
  },
  filePath: {
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
  },
  cardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: 2,
  },
  rowBtnAccepted: {
    backgroundColor: fade(theme.palette.primary.main, 0.08),
  },
  rowBtnDeclined: {
    backgroundColor: fade(theme.palette.text.primary, 0.06),
  },
  rowAccept: { backgroundColor: fade(theme.palette.success.main, 0.06) },
  rowDecline: { backgroundColor: fade(theme.palette.error.main, 0.06) },
  rowNeutral: { backgroundColor: theme.palette.background.paper },
  diffBlock: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5, 2, 2),
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
    gap: 8,
    padding: theme.spacing(1, 0),
    minHeight: 40,
    color: theme.palette.text.secondary,
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
  header,
}) => {
  const classes = useStyles();
  const decisions = { ...t1Decisions, ...aiDecisions };
  const auto = findings.filter(v => v.fixTier === 'deterministic');
  const ai = findings.filter(v => v.fixTier === 'ai');
  const manual = findings.filter(v => v.fixTier !== 'deterministic' && v.fixTier !== 'ai');
  const laneCount: Record<ReviewTab, number> = {
    All: findings.length,
    'Auto-fix': auto.length,
    'AI-fix': ai.length,
    'Manual-fix': manual.length,
  };

  const mix = useMemo(() => mixFromFindings(findings), [findings]);

  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<'all' | string>('all');
  const [category, setCategory] = useState<'all' | ApmeRuleCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<Set<SeverityClass>>(() => new Set());
  const [fixType, setFixType] = useState<ReviewTab>(() =>
    isRedesignLayout(reviewLayout) ? 'All' : 'Auto-fix',
  );
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
  }, [currentRedesign, autoKeys, auto, setT1Decisions]);

  useLayoutEffect(() => {
    setFixType(currentRedesign ? 'All' : 'Auto-fix');
  }, [currentRedesign]);

  const inActiveTab = (f: QualityViolation) =>
    fixType === 'All' || laneOf(f) === fixType;
  const tabFindings = findings.filter(inActiveTab);
  const contentTypes = useMemo(
    () =>
      Array.from(
        new Set(findings.filter(f => fixType === 'All' || laneOf(f) === fixType).map(kindLabel)),
      ).sort(),
    [findings, fixType],
  );
  const presentCategories = useMemo(() => {
    const ids = new Set(
      findings.filter(f => fixType === 'All' || laneOf(f) === fixType).map(apmeCategoryOf),
    );
    return APME_CATEGORY_ORDER.filter(id => ids.has(id));
  }, [findings, fixType]);

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

  const visibleLanes = useMemo(() => {
    const any = severityFilter.size > 0;
    return LANE_TABS.map(lane => {
      const breakdown = { ...mix.byLane[lane] };
      if (any) {
        for (const sev of SEV_ORDER) {
          if (!severityFilter.has(sev)) breakdown[sev] = 0;
        }
      }
      const count = SEV_ORDER.reduce((sum, sev) => sum + (breakdown[sev] ?? 0), 0);
      return { lane, breakdown, count };
    }).filter(row => row.count > 0);
  }, [mix.byLane, severityFilter]);

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
  const aiAccepted = ai.filter(v => aiDecisions[findingKey(v)] === 'accept').length;
  const selectedSuggestions = autoAccepted + aiAccepted;
  const nextLocked = currentRedesign
    ? selectedSuggestions < 1
    : pendingT1 > 0 || pendingGeneratedAi > 0 || aiLoading;

  const filtered = tabFindings.filter(f => {
    if (filterGeneratedAi) {
      if (laneOf(f) !== 'AI-fix' || aiStatus[findingKey(f)] !== 'ready') return false;
    }
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
  });
  const files = groupByFile(filtered);
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
    const k = findingKey(v);
    const setter = v.fixTier === 'ai' ? setAiDecisions : setT1Decisions;
    setter?.(prev => {
      const next = { ...prev };
      if (d === null) delete next[k];
      else next[k] = d;
      return next;
    });
  };

  const generateAll = () => {
    const keys = idleAi.map(findingKey);
    if (keys.length === 0) return;
    if (onGenerateAllAi) onGenerateAllAi(keys);
    else keys.forEach(k => onGenerateAi?.(k));
  };

  const includeItems = (items: QualityViolation[]) => {
    items.forEach(v => {
      const k = findingKey(v);
      const setter = v.fixTier === 'ai' ? setAiDecisions : setT1Decisions;
      setter?.(prev => ({ ...prev, [k]: 'accept' }));
    });
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

  const jobTitle = currentRedesign
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

  const selectedLabel = redesign4
    ? selectedSuggestions === 1
      ? '1 accepted'
      : `${selectedSuggestions} accepted`
    : selectedSuggestions === 1
      ? '1 suggestion accepted'
      : `${selectedSuggestions} suggestions accepted`;
  const selectedBreakdown = [
    auto.length > 0
      ? `${autoAccepted} out of ${auto.length} auto-fix${auto.length === 1 ? '' : 'es'}`
      : null,
    ai.length > 0
      ? `${aiAccepted} out of ${ai.length} AI-fix${ai.length === 1 ? '' : 'es'}`
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  const decideCount =
    auto.length === 0
      ? 'No auto-fixes to decide'
      : `${autoDecided} of ${auto.length} auto-fixes decided`;

  const findingWord = mix.total === 1 ? 'finding' : 'findings';
  const useFooter = ctaLayout === 'footer' || currentRedesign;
  const showListChrome = true;
  const searchPlaceholder =
    fixType === 'All'
      ? 'Search findings'
      : fixType === 'Auto-fix'
      ? 'Search auto-fixes'
      : fixType === 'AI-fix'
        ? 'Search AI-fixes'
        : currentRedesign
          ? 'Search manual findings'
          : 'Search not-fixable findings';

  const severitySelect =
    severityFilter.size === 1 ? Array.from(severityFilter)[0] : 'all';
  const presentSeverities = SEV_ORDER.filter(sev =>
    tabFindings.some(f => f.severity === sev),
  );

  const showingCount = filtered.length;
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
  const autoUndecidedCount = auto.filter(v => {
    const d = t1Decisions[findingKey(v)];
    return d !== 'accept' && d !== 'decline';
  }).length;
  const filtersActive =
    query.trim() !== '' ||
    contentType !== 'all' ||
    category !== 'all' ||
    severityFilter.size > 0 ||
    filterGeneratedAi;
  const clearFilters = () => {
    setQuery('');
    setContentType('all');
    setCategory('all');
    setSeverityFilter(new Set());
    setFilterGeneratedAi(false);
  };
  const generateAiLabel = `Generate remediations with AI (${idleAi.length})`;
  const autoAcceptChecked = auto.length > 0 && autoUndecidedCount === 0 && autoAccepted > 0;
  const autoAcceptIndeterminate = autoAccepted > 0 && autoUndecidedCount > 0;
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
        Decline remaining
      </Button>
    </>
  );
  const continueButton = (
    <span>
      <Button
        size="small"
        variant="contained"
        color="primary"
        disabled={nextLocked}
        onClick={nextLocked ? undefined : onNext}
        style={PILL}
        title={
          nextLocked
            ? currentRedesign
              ? redesign4
                ? 'Accept at least one remediation to continue'
                : 'Accept at least one suggestion to continue'
              : `${jobTitle} ${decideCount}`
            : undefined
        }
      >
        Continue to commit
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
      ? 'Accept all auto-fixes'
      : fixType === 'AI-fix'
        ? 'Accept all AI-fixes'
        : 'Accept all';
  const declineAllLabel =
    fixType === 'Auto-fix'
      ? 'Decline all auto-fixes'
      : fixType === 'AI-fix'
        ? 'Decline all AI-fixes'
        : 'Decline all';

  const includeMenuItems = (
    <>
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
          primary="Accept all auto-fixes"
          secondary={INCLUDE_MENU_EXPLAIN.auto}
        />
      </MenuItem>
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
          primary="Accept AI-fixes"
          secondary={INCLUDE_MENU_EXPLAIN.ai}
        />
      </MenuItem>
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
        Decline auto-fixes
      </MenuItem>
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
        Decline AI-fixes
      </MenuItem>
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
          Decline remaining
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
    currentRedesign && fixType !== 'Manual-fix' && (auto.length > 0 || ai.length > 0) ? (
      redesign4 ? (
        <div className={classes.bulkTwinActions}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<CheckIcon />}
            disabled={remainingSuggestions.length === 0}
            onClick={() => includeItems(remainingSuggestions)}
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
            endIcon={<ArrowDropDownIcon />}
            onClick={event => setActionsAnchor(event.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={Boolean(actionsAnchor)}
            aria-controls={actionsAnchor ? 'accept-remediations-menu' : undefined}
            style={PILL}
          >
            More actions
          </Button>
          <Menu
            id="accept-remediations-menu"
            className={classes.actionsMenu}
            anchorEl={actionsAnchor}
            open={Boolean(actionsAnchor)}
            onClose={closeActions}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            {includeMenuItems}
          </Menu>
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

  const redesignGenerate =
    currentRedesign && !redesign3Plus && (fixType === 'All' || fixType === 'AI-fix')
      ? generateButton
      : null;

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
          Issues by severity
        </Typography>
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
        <Typography
          className={classes.breakdownSectionTitle}
          variant="subtitle2"
          component="h3"
        >
          Issues by fix type
        </Typography>
        {visibleLanes.map(row => (
          <div key={row.lane} className={classes.breakdownLaneRow}>
            <Typography className={classes.catName} variant="body2" component="div">
              {reviewTabLabel(row.lane, true)}
              <Tooltip title={LANE_EXPLAIN[row.lane]} arrow>
                <span
                  className={classes.catHelpHit}
                  tabIndex={0}
                  aria-label={LANE_EXPLAIN[row.lane]}
                >
                  <HelpOutlineIcon className={classes.catHelp} aria-hidden />
                </span>
              </Tooltip>
            </Typography>
            <Chip
              size="small"
              label={row.count}
              className={classes.catCount}
            />
            <div className={classes.catBar}>
              <SeverityMixBar
                breakdown={row.breakdown}
                height={FINDINGS_BAR_HEIGHT}
                shareOfTotal={
                  visibleLaneTotal > 0 ? row.count / visibleLaneTotal : 0
                }
              />
            </div>
          </div>
        ))}
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

  const summaryAndFindings = (
    <>
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

      <Paper className={classes.box} elevation={0}>
        {currentRedesign ? (
          <div className={classes.scanCountHead}>
            <div
              className={`${classes.scanCountRow}${
                redesign4 ? ` ${classes.scanCountRowSplit}` : ''
              }`}
            >
              <div className={classes.scanCountCopy}>
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
                  {redesign4 ? (
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
              {redesign4 ? (
                <Button
                  variant="text"
                  color="inherit"
                  size="small"
                  className={classes.drawerToggleEnd}
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
                  {findingsBreakdownOpen
                    ? 'Hide findings breakdown'
                    : 'Show findings breakdown'}
                </Button>
              ) : redesign3Plus ? null : (
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
            {redesign4 ? (
              <div id="findings-breakdown">{findingsBreakdown}</div>
            ) : null}
            {redesign3Plus ? null : (
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
        {redesign3Plus &&
        (idleAi.length > 0 || aiLoading || pendingGeneratedAi > 0) ? (
          <div className={classes.aiBanner} role="status">
            <InfoOutlinedIcon className={classes.aiBannerIcon} aria-hidden />
            <Typography className={classes.aiBannerCopy} variant="body2">
              {aiLoading
                ? loadingAiCount === 1
                  ? 'Generating 1 AI-fix.'
                  : `Generating ${loadingAiCount} AI-fixes.`
                : idleAi.length > 0
                  ? idleAi.length === 1
                    ? '1 finding has no replacement yet. Generate an AI-fix to review it.'
                    : `${idleAi.length} findings have no replacement yet. Generate AI-fixes to review them.`
                  : pendingGeneratedAi === 1
                    ? '1 AI-fix generated. Review it below.'
                    : `${pendingGeneratedAi} AI-fixes generated. Review them below.`}
            </Typography>
            {idleAi.length > 0 || aiLoading ? (
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
            ) : pendingGeneratedAi > 0 ? (
              <Button
                className={classes.aiBannerLink}
                size="small"
                variant="text"
                color="primary"
                onClick={() => {
                  if (filterGeneratedAi) {
                    setFilterGeneratedAi(false);
                    return;
                  }
                  setFilterGeneratedAi(true);
                  setQuery('');
                  setContentType('all');
                  setCategory('all');
                  setSeverityFilter(new Set());
                }}
              >
                {filterGeneratedAi
                  ? 'Show all findings'
                  : readyAi.length === 1
                    ? 'View AI remediation'
                    : 'View AI remediations'}
              </Button>
            ) : null}
          </div>
        ) : null}
        {redesign3Plus ? null : (
        <Tabs
          className={classes.tabs}
          value={fixType}
          onChange={(_event, next: ReviewTab) => {
            setFixType(next);
            setContentType('all');
            setCategory('all');
          }}
          indicatorColor="primary"
          textColor="primary"
          aria-label="Findings"
        >
          {(currentRedesign ? REDESIGN_TABS : LANE_TABS).map(lane => (
            <Tab
              key={lane}
              className={classes.tab}
              value={lane}
              label={
                <span className={classes.tabLabel}>
                  <span>{reviewTabLabel(lane, currentRedesign)}</span>
                  <ReadCountBadge
                    count={laneCount[lane]}
                    label={reviewTabCountLabel(lane, laneCount[lane], currentRedesign)}
                    tone="read"
                  />
                </span>
              }
            />
          ))}
        </Tabs>
        )}
        {currentRedesign && !redesign3Plus ? (
          <Typography className={classes.tabPageHint}>
            {REDESIGN_TAB_HINT[fixType]}
          </Typography>
        ) : null}

        {showListChrome ? (
        <div className={classes.toolbar}>
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
        </div>
        ) : null}

        {(currentRedesign ||
          (fixType !== 'Manual-fix' &&
            (showListChrome || fixType === 'AI-fix' || fixType === 'All'))) ? (
          <div
            className={`${classes.bulkBar}${
              currentRedesign ? ` ${classes.bulkBarSpaced}` : ''
            }`}
          >
            {!currentRedesign && fixType === 'AI-fix' && idleAi.length > 0 && !aiLoading ? (
              <Typography className={classes.bulkNote}>
                Optional. Generating suggestions uses Lightspeed quota.
              </Typography>
            ) : null}
            {redesign3Plus ? null : (
            <div className={classes.bulkRow}>
              <Typography className={classes.bulkCount} variant="body2" color="textSecondary">
                {showingLabel}
              </Typography>
              {currentRedesign ? null : fixType === 'AI-fix' && aiLoading ? (
                <div className={classes.bulkActions}>
                  <Button size="small" variant="contained" color="primary" disabled style={PILL}>
                    Generating…
                  </Button>
                </div>
              ) : fixType === 'AI-fix' && idleAi.length > 0 ? (
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
                {redesign4 ? (
                  <div className={classes.showingRow}>
                    <Typography
                      className={classes.bulkCount}
                      variant="body2"
                      color="textSecondary"
                    >
                      {showingCount} showing out of {tabFindings.length}
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
                ) : null}
                <div className={classes.bulkListActions} role="region" aria-label="Bulk finding actions">
                  {redesign4 ? (
                    auto.length > 0 ? (
                      <label className={classes.autoAcceptControl}>
                        <Checkbox
                          color="primary"
                          size="small"
                          checked={autoAcceptChecked}
                          indeterminate={autoAcceptIndeterminate}
                          onChange={(_event, checked) =>
                            checked
                              ? acceptUndeclinedAutoFixes()
                              : clearAcceptedAutoFixes()
                          }
                        />
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          component="span"
                          className={classes.autoAcceptLabel}
                        >
                          Auto-accept all auto-fixes
                          <Tooltip title={AUTO_ACCEPT_EXPLAIN} arrow>
                            <span
                              className={classes.catHelpHit}
                              tabIndex={0}
                              aria-label={AUTO_ACCEPT_EXPLAIN}
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
                    ) : (
                      <span />
                    )
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
                  <div>{redesign3Plus ? redesignActionsControl : redesignGenerate}</div>
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {files.length === 0 ? (
          <Typography className={classes.empty} variant="body2" color="textSecondary">
            No findings match the current filters.
          </Typography>
        ) : (
          <div className={classes.fileList}>
            {files.flatMap(group => group.findings).map(f => (
              <FindingRow
                key={findingKey(f)}
                finding={f}
                decision={decisions[findingKey(f)]}
                aiStatus={aiStatus[findingKey(f)] ?? 'idle'}
                onDecision={d => onDecision(f, d)}
                onGenerateAi={onGenerateAi}
                quietRowActions={currentRedesign}
                hideDecline={redesign3}
                includeInPr={redesign4}
                highlight={pulseKey === findingKey(f)}
                showLane={currentRedesign && fixType === 'All'}
              />
            ))}
          </div>
        )}
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
            {currentRedesign ? (
              <>
                <Typography variant="body2" color="textPrimary" className={classes.footerLead}>
                  {selectedLabel}
                </Typography>
                {redesign3Plus ? null : selectedBreakdown || 'No suggestions to accept'}
              </>
            ) : (
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
            {continueButton}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FindingRow: React.FC<{
  finding: QualityViolation;
  decision?: WizardDecision;
  aiStatus: AiRowStatus;
  onDecision: (d: WizardDecision | null) => void;
  onGenerateAi?: (key: string) => void;
  quietRowActions?: boolean;
  hideDecline?: boolean;
  includeInPr?: boolean;
  highlight?: boolean;
  showLane?: boolean;
}> = ({
  finding,
  decision,
  aiStatus,
  onDecision,
  onGenerateAi,
  quietRowActions,
  hideDecline,
  includeInPr,
  highlight,
  showLane,
}) => {
  const classes = useStyles();
  const lane = laneOf(finding);
  const snip = snippetForRule(finding.ruleId);
  const key = findingKey(finding);
  const waitingForAi = lane === 'AI-fix' && aiStatus !== 'ready';
  const showProposed = lane === 'Auto-fix' || (lane === 'AI-fix' && aiStatus === 'ready');
  const issueLines: DiffLine[] = waitingForAi || lane === 'Manual-fix'
    ? snip.current.map(text => ({ kind: 'context' as const, text }))
    : [];
  const lines = showProposed
    ? unifiedDiff(snip.current, snip.proposed)
    : issueLines;
  const rowClass =
    decision === 'accept'
      ? `${classes.issueCard} ${classes.rowAccept}`
      : decision === 'decline'
        ? `${classes.issueCard} ${classes.rowDecline}`
        : includeInPr
          ? `${classes.issueCard} ${classes.rowNeutral}`
          : classes.issueCard;
  const acceptFilled = quietRowActions
    ? false
    : decision === 'accept';
  const declineFilled = quietRowActions ? false : decision === 'decline';

  const suggestionActions = includeInPr ? (
    <ToggleButtonGroup
      exclusive
      size="small"
      className={classes.decisionGroup}
      value={decision ?? null}
      onChange={(_event, next: WizardDecision | null) => onDecision(next)}
      aria-label="Accept or decline this remediation"
    >
      <ToggleButton value="accept">Accept</ToggleButton>
      <ToggleButton value="decline">Decline</ToggleButton>
    </ToggleButtonGroup>
  ) : (
    <>
      <Button
        size="small"
        variant={acceptFilled ? 'contained' : 'outlined'}
        color="primary"
        className={
          quietRowActions && decision === 'accept' ? classes.rowBtnAccepted : undefined
        }
        startIcon={<CheckIcon />}
        style={PILL_COMPACT}
        aria-pressed={hideDecline ? decision === 'accept' : undefined}
        onClick={() =>
          hideDecline && decision === 'accept'
            ? onDecision(null)
            : onDecision('accept')
        }
      >
        {decision === 'accept' ? 'Accepted' : 'Accept'}
      </Button>
      {hideDecline ? null : (
        <Button
          size="small"
          variant={declineFilled ? 'contained' : 'outlined'}
          color="primary"
          className={
            quietRowActions && decision === 'decline' ? classes.rowBtnDeclined : undefined
          }
          startIcon={<CloseIcon />}
          style={PILL_COMPACT}
          onClick={() => onDecision('decline')}
        >
          {decision === 'decline' ? 'Declined' : 'Decline'}
        </Button>
      )}
    </>
  );

  const actions =
    lane === 'Auto-fix' || (lane === 'AI-fix' && aiStatus === 'ready') ? (
      suggestionActions
    ) : lane === 'AI-fix' && aiStatus === 'loading' ? null : lane === 'AI-fix' ? (
      onGenerateAi ? (
        <Button
          size="small"
          variant="contained"
          color="primary"
          style={PILL_COMPACT}
          onClick={() => onGenerateAi(key)}
        >
          Generate AI suggestion
        </Button>
      ) : null
    ) : lane === 'Manual-fix' ? (
      <Button
        size="small"
        variant="outlined"
        color="primary"
        startIcon={<CodeIcon style={{ fontSize: 16 }} />}
        style={PILL_COMPACT}
        onClick={() =>
          window.open(
            `/devspaces-mockup.html?file=${encodeURIComponent(
              finding.file || '',
            )}&line=${finding.lineStart}&tier=${finding.fixTier}&status=open`,
            '_blank',
          )
        }
      >
        Open in Dev Spaces
      </Button>
    ) : null;

  return (
    <div
      className={`${rowClass}${highlight ? ` ${classes.pulse}` : ''}`}
      id={`finding-${key}`}
    >
      <div className={classes.cardHead}>
        <div className={classes.cardCopy}>
          <Typography className={classes.title} variant="subtitle2">
            {finding.message}
          </Typography>
          <Typography className={classes.fileMeta} variant="caption" color="textSecondary">
            <span className={classes.filePath}>
              {finding.file || 'Unknown file'}:{finding.lineStart}
            </span>
            {' · '}
            {kindLabel(finding)}
            {' · '}
            {finding.ruleId}
          </Typography>
          <div className={classes.chips}>
            <Chip
              size="small"
              label={SEV_LABEL[finding.severity] ?? finding.severity}
              className={classes.chip}
              style={{
                backgroundColor: SEVERITY_COLORS[finding.severity],
                color: '#fff',
              }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={APME_CATEGORY_LABEL[apmeCategoryOf(finding)]}
              className={classes.chip}
            />
            {showLane ? (
              <Chip
                size="small"
                variant="outlined"
                label={lane === 'Manual-fix' ? 'Manual' : TAB_LABEL[lane]}
                className={classes.chip}
              />
            ) : null}
          </div>
        </div>
        {actions && <div className={classes.cardActions}>{actions}</div>}
      </div>
      <div className={classes.diffBlock}>
        {lines.length === 0 ? (
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
        {lane === 'AI-fix' && aiStatus === 'loading' && (
          <div className={classes.suggestionEmpty}>
            <CircularProgress size={16} />
            Generating…
          </div>
        )}
        {lane === 'AI-fix' && aiStatus === 'idle' && (
            <div className={classes.suggestionEmpty}>
              No suggestion yet. Generate this row, or generate all on this tab.
            </div>
        )}
        {lane === 'Manual-fix' && (
          <Typography className={classes.suggestionEmpty} variant="body2" color="textSecondary">
            No automatic or AI suggestion. Change this in the file, or leave it.
          </Typography>
        )}
      </div>
    </div>
  );
};
