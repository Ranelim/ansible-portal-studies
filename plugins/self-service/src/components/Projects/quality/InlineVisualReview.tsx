/**
 * Visual redesign of Inline AI Results & Remediation (`?wizard=visual`).
 * Structure follows the ephemeral step-2 prototype: Continue under the
 * stepper, Summary (severity), then findings. Current: Auto-fix / AI-fix /
 * Not fixable. Current redesign: All / Auto-fix / AI-fix / Manual. AI spend
 * lives with Generate AI suggestions (Lightspeed quota — no fake
 * token or dollar estimates). `ctaLayout=footer` parks Continue in a sticky
 * footer instead. `reviewLayout=work` is the density option: compact Summary,
 * hide filters/bulk on small tabs, filled Accept, Continue in the footer.
 * `reviewLayout=redesign` is a fork of Current: All tab, Accept-all-auto
 * checkbox in the footer, Actions + Generate under the showing count,
 * Continue in a sticky footer.
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
  FormControlLabel,
  InputLabel,
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
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
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

export type CtaLayout = 'current' | 'footer';
/** Current = Continue under the stepper. Redesign = fork of Current. Work-first = density proposal. */
export type ReviewLayout = 'current' | 'redesign' | 'work';

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
const FILTER_THRESHOLD = 6;
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

function reviewTabLabel(tab: ReviewTab, redesign: boolean): string {
  if (tab === 'All') return 'All';
  if (tab === 'Manual-fix') return redesign ? 'Manual' : 'Not fixable';
  return TAB_LABEL[tab];
}

function reviewTabCountLabel(tab: ReviewTab, n: number, redesign: boolean): string {
  if (tab === 'All') return `${n} findings`;
  if (tab === 'Manual-fix' && redesign) return `${n} manual findings`;
  return TAB_COUNT_LABEL[tab](n);
}

type BulkPolicyId =
  | 'accept-auto'
  | 'decline-auto'
  | 'accept-all'
  | 'decline-all'
  | 'accept-ai'
  | 'decline-ai'
  | 'mixed';

const BULK_POLICY_LABEL: Record<BulkPolicyId, string> = {
  'accept-auto': 'Accept all auto-fixes',
  'decline-auto': 'Decline auto-fixes',
  'accept-all': 'Accept all',
  'decline-all': 'Decline all',
  'accept-ai': 'Accept AI-fixes',
  'decline-ai': 'Decline AI-fixes',
  mixed: 'Mixed',
};

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
  const catMap = new Map<ApmeRuleCategory, Record<SeverityClass, number>>();
  findings.forEach(f => {
    bySeverity[f.severity] += 1;
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
  return { total: findings.length, bySeverity, categories };
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
    flex: '1 1 220px',
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
    minWidth: 0,
  },
  footerCheck: {
    marginLeft: 0,
    marginRight: 0,
    flexShrink: 0,
  },
  footerCheckBox: {
    padding: 4,
  },
  footerCheckLabel: {
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.4,
    color: theme.palette.text.secondary,
  },
  footerSelected: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
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
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  scanCountHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(2, 2, 0.5),
    '& p': {
      margin: 0,
    },
  },
  scanCountCopy: {
    minWidth: 0,
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 180,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 500,
  },
  catHelp: {
    fontSize: 14,
    color: theme.palette.text.disabled,
    cursor: 'help',
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
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
  },
  search: { width: 220 },
  select: { minWidth: 168 },
  bulkBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(0, 2, 1),
  },
  bulkBarSpaced: {
    paddingTop: theme.spacing(1.5),
  },
  bulkRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    width: '100%',
  },
  bulkCount: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
  bulkNote: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
  },
  bulkActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 'auto',
  },
  actionsMenu: {
    '& .MuiMenuItem-root': {
      fontSize: 14,
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
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
    color: theme.palette.text.primary,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 },
  chip: { height: 22, fontWeight: 600 },
  fileMeta: {
    marginTop: 4,
    fontSize: 12,
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
  diffBlock: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5, 2, 2),
  },
  diffEmpty: {
    padding: theme.spacing(1, 0),
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  suggestionEmpty: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: theme.spacing(1, 0),
    minHeight: 40,
    fontSize: 13,
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
    reviewLayout === 'redesign' ? 'All' : 'Auto-fix',
  );
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [pulseKey, setPulseKey] = useState<string | null>(null);
  const workFirst = reviewLayout === 'work';
  const currentRedesign = reviewLayout === 'redesign';
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

  const autoDecided = auto.filter(v => Boolean(t1Decisions[findingKey(v)])).length;
  const pendingT1 = auto.length - autoDecided;
  const readyAi = ai.filter(v => aiStatus[findingKey(v)] === 'ready');
  const pendingGeneratedAi = readyAi.filter(v => !aiDecisions[findingKey(v)]).length;
  const idleAi = ai.filter(v => (aiStatus[findingKey(v)] ?? 'idle') === 'idle');
  const aiLoading = ai.some(v => aiStatus[findingKey(v)] === 'loading');
  const autoAccepted = auto.filter(v => t1Decisions[findingKey(v)] === 'accept').length;
  const aiAccepted = ai.filter(v => aiDecisions[findingKey(v)] === 'accept').length;
  const selectedSuggestions = autoAccepted + aiAccepted;
  const nextLocked = currentRedesign
    ? selectedSuggestions < 1
    : pendingT1 > 0 || pendingGeneratedAi > 0 || aiLoading;

  const filtered = tabFindings.filter(f => {
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

  const onDecision = (v: QualityViolation, d: WizardDecision) => {
    const k = findingKey(v);
    if (v.fixTier === 'ai') setAiDecisions?.(prev => ({ ...prev, [k]: d }));
    else setT1Decisions?.(prev => ({ ...prev, [k]: d }));
  };

  const generateAll = () => {
    const keys = idleAi.map(findingKey);
    if (keys.length === 0) return;
    if (onGenerateAllAi) onGenerateAllAi(keys);
    else keys.forEach(k => onGenerateAi?.(k));
  };

  const stampAiFixes = (value: WizardDecision) => {
    setAiDecisions?.(prev => {
      const next = { ...prev };
      ai.forEach(v => {
        const k = findingKey(v);
        const status = aiStatus[k] ?? 'idle';
        if (value === 'accept' && status !== 'ready') return;
        next[k] = value;
      });
      return next;
    });
  };

  const stampDecisions = (scope: 'all' | 'auto' | 'ai', value: WizardDecision) => {
    if (scope === 'auto' || scope === 'all') stampAutoFixes(value);
    if (scope === 'ai' || scope === 'all') stampAiFixes(value);
    setActionsAnchor(null);
  };

  const clearAiDecisions = () => {
    setAiDecisions?.(prev => {
      const next = { ...prev };
      ai.forEach(v => {
        delete next[findingKey(v)];
      });
      return next;
    });
  };

  const applyBulkPolicy = (policy: Exclude<BulkPolicyId, 'mixed'>) => {
    if (policy === 'accept-auto') {
      stampAutoFixes('accept');
      clearAiDecisions();
    } else if (policy === 'decline-auto') {
      stampAutoFixes('decline');
      clearAiDecisions();
    } else if (policy === 'accept-all') {
      stampDecisions('all', 'accept');
      return;
    } else if (policy === 'decline-all') {
      stampDecisions('all', 'decline');
      return;
    } else if (policy === 'accept-ai') {
      stampAiFixes('accept');
    } else {
      stampAiFixes('decline');
    }
    setActionsAnchor(null);
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
      ? workFirst
        ? 'Accept or decline each auto-fix.'
        : 'Decide auto-fixes to continue. AI is optional.'
      : aiLoading
        ? 'Wait for AI generation to finish.'
        : pendingGeneratedAi > 0
          ? 'Accept or decline generated AI suggestions to continue.'
          : workFirst
            ? 'Auto-fixes decided. Continue when you are ready.'
            : 'Auto-fixes decided. Ungenerated AI stays in the file.';

  const selectedLabel =
    selectedSuggestions === 1
      ? '1 suggestion accepted'
      : `${selectedSuggestions} suggestions accepted`;

  const decideCount =
    auto.length === 0
      ? 'No auto-fixes to decide'
      : workFirst && pendingT1 > 0
        ? pendingT1 === 1
          ? '1 auto-fix still needs a decision'
          : `${pendingT1} auto-fixes still need a decision`
        : `${autoDecided} of ${auto.length} auto-fixes decided`;

  const findingWord = mix.total === 1 ? 'finding' : 'findings';
  const useFooter = ctaLayout === 'footer' || workFirst || currentRedesign;
  const showListChrome = !workFirst || tabFindings.length >= FILTER_THRESHOLD;
  const pulseWork = () => {
    const first = visibleAuto[0] ?? visibleReadyAi[0];
    if (!first) return;
    const key = findingKey(first);
    setPulseKey(key);
    window.setTimeout(() => {
      document.getElementById(`finding-${key}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
    window.setTimeout(() => setPulseKey(null), 1600);
  };
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
  const remainingForTab = fixType === 'AI-fix' ? visibleReadyAi.length : visibleAuto.length;
  const remainingItems = fixType === 'AI-fix' ? visibleReadyAi : visibleAuto;
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
    <span
      className={workFirst && nextLocked ? classes.continueHit : undefined}
      onClick={workFirst && nextLocked ? pulseWork : undefined}
    >
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
              ? 'Accept at least one suggestion to continue'
              : `${jobTitle} ${decideCount}`
            : undefined
        }
      >
        {workFirst ? 'Continue' : 'Continue to commit'}
      </Button>
    </span>
  );
  const generateButton =
    aiLoading ? (
      <Button size="small" variant="outlined" color="primary" disabled style={PILL}>
        Generating…
      </Button>
    ) : idleAi.length > 0 ? (
      <Tooltip title="Generating suggestions uses Lightspeed quota.">
        <span>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={generateAll}
            style={PILL}
          >
            {readyAi.length > 0
              ? `Generate remaining (${idleAi.length})`
              : `Generate AI suggestions (${idleAi.length})`}
          </Button>
        </span>
      </Tooltip>
    ) : null;
  const bulkActionsMenu = (
    <Menu
      id="finding-actions-menu"
      className={classes.actionsMenu}
      anchorEl={actionsAnchor}
      open={Boolean(actionsAnchor)}
      onClose={() => setActionsAnchor(null)}
      getContentAnchorEl={null}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <MenuItem
        disabled={auto.length === 0}
        selected={bulkPolicy === 'accept-auto'}
        onClick={() => applyBulkPolicy('accept-auto')}
      >
        Accept all auto-fixes
      </MenuItem>
      <MenuItem
        disabled={auto.length === 0}
        selected={bulkPolicy === 'decline-auto'}
        onClick={() => applyBulkPolicy('decline-auto')}
      >
        Decline auto-fixes
      </MenuItem>
      <Divider />
      <MenuItem
        disabled={auto.length === 0 && readyAi.length === 0}
        selected={bulkPolicy === 'accept-all'}
        onClick={() => applyBulkPolicy('accept-all')}
      >
        Accept all
      </MenuItem>
      <MenuItem
        disabled={auto.length === 0 && ai.length === 0}
        selected={bulkPolicy === 'decline-all'}
        onClick={() => applyBulkPolicy('decline-all')}
      >
        Decline all
      </MenuItem>
      <Divider />
      <MenuItem
        disabled={readyAi.length === 0}
        selected={bulkPolicy === 'accept-ai'}
        onClick={() => applyBulkPolicy('accept-ai')}
      >
        Accept AI-fixes
      </MenuItem>
      <MenuItem
        disabled={ai.length === 0}
        selected={bulkPolicy === 'decline-ai'}
        onClick={() => applyBulkPolicy('decline-ai')}
      >
        Decline AI-fixes
      </MenuItem>
    </Menu>
  );
  const allAutoAccepted = auto.length > 0 && auto.every(v => t1Decisions[findingKey(v)] === 'accept');
  const someAutoAccepted = auto.some(v => t1Decisions[findingKey(v)] === 'accept');
  const autoAcceptCheckbox =
    currentRedesign && auto.length > 0 ? (
      <FormControlLabel
        className={classes.footerCheck}
        disableTypography
        control={
          <Checkbox
            className={classes.footerCheckBox}
            size="small"
            color="primary"
            checked={allAutoAccepted}
            indeterminate={someAutoAccepted && !allAutoAccepted}
            onChange={(_event, checked) => stampAutoFixes(checked ? 'accept' : null)}
          />
        }
        label={
          <span className={classes.footerCheckLabel}>Accept all auto-fix suggestions</span>
        }
      />
    ) : null;

  const redesignActionsControl =
    currentRedesign && fixType !== 'Manual-fix' && (auto.length > 0 || ai.length > 0) ? (
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
          Actions
        </Button>
        {bulkActionsMenu}
      </>
    ) : null;

  const redesignGenerate =
    currentRedesign && (fixType === 'All' || fixType === 'AI-fix') ? generateButton : null;

  const summaryMix = (
    <>
      <Typography className={workFirst ? classes.mixTotalCompact : classes.mixTotal} component="span">
        {mix.total}
      </Typography>
      <Typography className={classes.mixMeta} component="span">
        {findingWord} on this scan
      </Typography>
      <div className={workFirst ? classes.compactBar : classes.mixBar}>
        <SeverityMixBar
          breakdown={mix.bySeverity}
          height={FINDINGS_BAR_HEIGHT}
          activeSeverities={severityFilter}
          onSegmentClick={toggleSeverity}
        />
      </div>
      <div className={workFirst ? classes.compactChips : classes.mixChips}>
        <SeverityFilterChips
          breakdown={mix.bySeverity}
          active={severityFilter}
          onToggle={toggleSeverity}
        />
      </div>
      <Button
        variant="text"
        color="inherit"
        size="small"
        className={`${classes.drawerToggle}${workFirst ? ` ${classes.compactToggle}` : ''}`}
        endIcon={breakdownOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        aria-expanded={breakdownOpen}
        onClick={() => setBreakdownOpen(open => !open)}
      >
        {breakdownOpen ? 'Hide breakdown' : 'Show breakdown'}
      </Button>
    </>
  );

  const breakdown = (
    <Collapse in={breakdownOpen}>
      {visibleCategories.map(cat => (
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
          <Typography className={classes.catName} component="div">
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
      ))}
    </Collapse>
  );

  const gateCopy =
    fixType === 'Auto-fix'
      ? pendingT1 > 0
        ? pendingT1 === 1
          ? '1 auto-fix still needs a decision'
          : `${pendingT1} auto-fixes still need a decision`
        : 'Auto-fixes decided'
      : fixType === 'AI-fix'
        ? 'AI is optional. Ungenerated suggestions stay in the file.'
        : 'These findings have no automated fix. They stay in the file.';

  const summaryAndFindings = (
    <>
      {workFirst ? (
        <Typography className={classes.jobLine} component="p">
          <strong>{jobTitle}</strong>
        </Typography>
      ) : null}
      {currentRedesign ? null : (
      <Paper className={classes.box} elevation={0}>
        {workFirst ? (
          <>
            <div className={classes.compactSummary}>
              <div className={classes.compactSummaryRow}>{summaryMix}</div>
            </div>
            <div className={classes.resultsBody} style={{ paddingTop: 0 }}>
              {breakdown}
            </div>
          </>
        ) : (
          <>
            <div className={classes.boxHead}>
              <Typography className={classes.boxTitle}>Summary</Typography>
            </div>
            <div className={classes.resultsBody}>
              <div className={classes.mixHeader}>
                <Typography className={classes.mixTotal} component="span">
                  {mix.total}
                </Typography>
                <Typography className={classes.mixMeta} component="span">
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
          </>
        )}
      </Paper>
      )}

      <Paper className={classes.box} elevation={0}>
        {currentRedesign ? (
          <div className={classes.scanCountHead}>
            <div className={classes.scanCountCopy}>
              <Typography className={classes.mixTotal} component="p">
                {mix.total}
              </Typography>
              <Typography className={classes.mixMeta} component="p">
                {findingWord} on this scan
              </Typography>
            </div>
          </div>
        ) : null}
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

        {showListChrome ? (
        <div className={classes.toolbar}>
          <TextField
            className={classes.search}
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

        {workFirst ? (
          <Typography
            className={`${classes.gate} ${
              fixType === 'Auto-fix' && pendingT1 === 0
                ? classes.gateDone
                : fixType !== 'Auto-fix'
                  ? classes.gateMuted
                  : ''
            }`}
            style={{ paddingLeft: 16, paddingRight: 16, paddingTop: showListChrome ? 0 : 8 }}
          >
            {gateCopy}
          </Typography>
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
            <div className={classes.bulkRow}>
              <Typography className={classes.bulkCount}>{showingLabel}</Typography>
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
                    {readyAi.length > 0
                      ? `Generate remaining (${idleAi.length})`
                      : `Generate AI suggestions (${idleAi.length})`}
                  </Button>
                  {readyAi.length > 0 ? bulkAcceptDecline : null}
                </div>
              ) : (
                <div className={classes.bulkActions}>{bulkAcceptDecline}</div>
              )}
            </div>
            {currentRedesign && (redesignActionsControl || redesignGenerate) ? (
              <div className={classes.bulkListActions} role="region" aria-label="Bulk finding actions">
                <div>{redesignActionsControl}</div>
                <div>{redesignGenerate}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {files.length === 0 ? (
          <Typography className={classes.empty} color="textSecondary">
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
                workFirst={workFirst}
                quietRowActions={currentRedesign}
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
        <div className={classes.scrollBody}>
          {header}
          {summaryAndFindings}
        </div>
      ) : (
        <div className={classes.cards}>{summaryAndFindings}</div>
      )}
      {useFooter ? (
        <div
          className={`${classes.wizardFooter}${
            workFirst || currentRedesign ? ` ${classes.wizardFooterWork}` : ''
          }`}
          role="region"
          aria-label="Remediation step actions"
        >
          <div className={classes.footerStatus}>
            {currentRedesign ? (
              autoAcceptCheckbox
            ) : workFirst ? (
              <>
                <span className={classes.footerCount}>{decideCount}</span>
                {nextLocked ? 'Then you can continue.' : jobTitle}
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
              workFirst || currentRedesign ? ` ${classes.footerClearFab}` : ''
            }`}
            style={currentRedesign ? { gap: 8 } : undefined}
          >
            {currentRedesign ? (
              <>
                <Button size="small" variant="outlined" onClick={onCancel} style={PILL}>
                  Cancel
                </Button>
                <span className={classes.footerSelected}>
                  {selectedLabel}
                </span>
              </>
            ) : (
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
  onDecision: (d: WizardDecision) => void;
  onGenerateAi?: (key: string) => void;
  workFirst?: boolean;
  quietRowActions?: boolean;
  highlight?: boolean;
  showLane?: boolean;
}> = ({
  finding,
  decision,
  aiStatus,
  onDecision,
  onGenerateAi,
  workFirst,
  quietRowActions,
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
        : classes.issueCard;
  const acceptFilled = quietRowActions
    ? false
    : workFirst
      ? decision !== 'decline'
      : decision === 'accept';
  const declineFilled = quietRowActions ? false : decision === 'decline';

  const actions =
    lane === 'Auto-fix' || (lane === 'AI-fix' && aiStatus === 'ready') ? (
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
          onClick={() => onDecision('accept')}
        >
          {decision === 'accept' ? 'Accepted' : 'Accept'}
        </Button>
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
      </>
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
    ) : null;

  return (
    <div
      className={`${rowClass}${highlight ? ` ${classes.pulse}` : ''}`}
      id={`finding-${key}`}
    >
      <div className={classes.cardHead}>
        <div className={classes.cardCopy}>
          <Typography className={classes.title}>{finding.message}</Typography>
          <Typography className={classes.fileMeta}>
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
          <Typography className={classes.suggestionEmpty}>
            No automatic or AI suggestion. Change this in the file, or leave it.
          </Typography>
        )}
      </div>
    </div>
  );
};
