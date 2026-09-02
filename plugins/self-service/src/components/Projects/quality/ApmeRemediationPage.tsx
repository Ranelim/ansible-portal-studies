import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Content, Page } from '@backstage/core-components';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import ArrowBack from '@material-ui/icons/ArrowBack';
import CheckIcon from '@material-ui/icons/Check';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import {
  qualityHomePath,
  remediationsListPath,
  scansListPath,
} from './qualitySurfacePaths';
import { statusColors } from '../../common/statusColors';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import { getProjectQuality, type QualityViolation } from '../detail/qualityDemoData';
import {
  NodeReviewList,
  OperationProgressPanel,
  ReviewFilterBar,
  ReviewHint,
  ReviewInventoryRow,
  ReviewStepShell,
  findingKey,
  type AiRowStatus,
  type WizardDecision,
  groupByNode,
  uniqueNodeCount,
  useAssessFilters,
  useGateFilters,
} from './SpaRemediationReview';
import {
  InlineVisualReview,
  isRedesignLayout,
  type CtaLayout,
  type ReviewLayout,
} from './InlineVisualReview';
import { RemediationReceipt } from './RemediationReceipt';

/**
 * Quality remediation session (`/apme/remediate/:repo`).
 * Original = SPA 9-step. AI assessment = pick which findings get an AI suggestion.
 * Redesign = Scan → Review auto-fixes → Choose AI findings → Review AI-fixes → Commit.
 * Inline AI = Scan → Results & Remediation → Commit.
 * Inline visual = Scan → Findings → Auto remediations → AI remediations → Commit.
 * Design-options compare (`?steps=without-findings`): With findings (default)
 * keeps a read-only Findings step. Without findings skips it — Scan → Findings
 * and auto remediations → AI remediations → Commit. Stale
 * `?steps=without-results|review|work` maps to without-findings. With findings
 * uses a Current | Remediation split on Findings, Auto, and AI. Findings
 * shows auto remediations; AI and manual are copy-only. Sorted by severity.
 * Chrome: page title is the repo (`org/name`);
 * subtitle is Health scan timestamp · commit SHA (Scans identity).
 * Bundled one-page review (no Results step; Generate AI on Results & Remediation):
 * git tag `remediation-bundled-results-and-ai` (`b82fca95`).
 * CTA compare (`?cta=current|footer`): Current puts Continue + Cancel under
 * the stepper (with auto-fix decided count). Wizard footer pins them to a
 * sticky step footer. Findings bulk actions stay with the open tab.
 * Review-layout compare (`?review=redesign|redesign3|redesign4`):
 * Current redesign, Redesign 3, or Redesign 4 (copy of Redesign 3).
 */

type StepId =
  | 'scan'
  | 'findings'
  | 'tier1_proposals'
  | 'tier1_applied'
  | 'ai_assessment'
  | 'ai_proposals'
  | 'ai_applied'
  | 'commit'
  | 'complete';

type StepDef = { id: StepId; label: string };

/** Prototype compare. Stale `?wizard=fixes|optin` falls back to Original. */
type WizardChrome = 'original' | 'new' | 'inline' | 'visual';

/**
 * Force Inline visual:
 * Scan → Findings → Auto remediations → AI remediations (if any) → Commit.
 * Continue under the stepper — not mixed with Accept/Decline.
 * Prototype wizard + Continue-placement compares stay parked.
 * Results layout compare is parked. Redesign 4 is forced.
 * Current / Current redesign / Redesign 3 stay in code.
 * Set SHOW_REVIEW_LAYOUT_COMPARE `true` and FORCED_REVIEW_LAYOUT `null`
 * to revive `?review=`.
 */
const FORCED_REMEDIATION_WIZARD: WizardChrome | null = 'visual';
const FORCED_CTA_LAYOUT: CtaLayout | null = 'current';
const FORCED_REVIEW_LAYOUT: ReviewLayout | null = 'redesign4';
const SHOW_REVIEW_LAYOUT_COMPARE = false;

function parseWizardChrome(value: string | null): WizardChrome {
  if (FORCED_REMEDIATION_WIZARD) return FORCED_REMEDIATION_WIZARD;
  if (value === 'new') return 'new';
  if (value === 'inline') return 'inline';
  if (value === 'visual') return 'visual';
  return 'original';
}

function parseCtaLayout(value: string | null): CtaLayout {
  if (FORCED_CTA_LAYOUT) return FORCED_CTA_LAYOUT;
  return value === 'current' ? 'current' : 'footer';
}

function parseReviewLayout(value: string | null): ReviewLayout {
  if (FORCED_REVIEW_LAYOUT) return FORCED_REVIEW_LAYOUT;
  if (value === 'redesign4') return 'redesign4';
  if (value === 'redesign3') return 'redesign3';
  if (value === 'redesign') return 'redesign';
  return 'current';
}

function isInlineChrome(chrome: WizardChrome): boolean {
  return chrome === 'inline' || chrome === 'visual';
}

function isVisualChrome(chrome: WizardChrome): boolean {
  return chrome === 'visual';
}

function isCraigRedesign(chrome: WizardChrome): boolean {
  return chrome === 'new';
}

type StepsModel = 'with-findings' | 'without-findings';

function parseStepsModel(value: string | null): StepsModel {
  if (
    value === 'without-findings' ||
    value === 'without-results' ||
    value === 'review' ||
    value === 'work'
  ) {
    return 'without-findings';
  }
  return 'with-findings';
}

/** Without findings — no separate Findings step. */
function skipsFindingsStep(model: StepsModel): boolean {
  return model === 'without-findings';
}

function isResultsFixChrome(chrome: WizardChrome): boolean {
  return isInlineChrome(chrome) || isCraigRedesign(chrome);
}

/** Map engine/progress stations onto the visible stepper. */
function displayStepId(
  step: StepId,
  chrome: WizardChrome,
  stepsModel: StepsModel = 'with-findings',
): StepId {
  if (chrome === 'original') return step;
  if (chrome === 'visual') {
    if (skipsFindingsStep(stepsModel) && step === 'findings') {
      return 'tier1_proposals';
    }
    switch (step) {
      case 'scan':
        return 'scan';
      case 'findings':
        return 'findings';
      case 'tier1_proposals':
      case 'tier1_applied':
        return 'tier1_proposals';
      case 'ai_assessment':
      case 'ai_proposals':
      case 'ai_applied':
        return 'ai_proposals';
      case 'commit':
      case 'complete':
        return 'commit';
      default:
        return 'findings';
    }
  }
  if (chrome === 'new') {
    switch (step) {
      case 'scan':
        return 'scan';
      case 'findings':
      case 'tier1_proposals':
      case 'tier1_applied':
        return 'findings';
      case 'ai_assessment':
        return 'ai_assessment';
      case 'ai_applied':
        return 'ai_proposals';
      case 'complete':
        return 'commit';
      default:
        return step;
    }
  }
  switch (step) {
    case 'scan':
      return 'scan';
    case 'commit':
    case 'complete':
      return 'commit';
    default:
      return 'findings';
  }
}

const SCAN_PHASES: { phase: string; text: string }[] = [
  { phase: 'queued', text: 'Queued…' },
  { phase: 'cloning', text: 'Cloning repository…' },
  { phase: 'format', text: 'Resolving collections and Python dependencies…' },
  { phase: 'checking', text: 'Running validators…' },
  { phase: 'checking', text: 'Aggregating findings…' },
];

const APPLY_MS = 1600;

const useStyles = makeStyles(theme => ({
  wrap: {
    maxWidth: 1200,
  },
  pageFit: {
    minWidth: 0,
    maxWidth: '100%',
    width: '100%',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  visualSession: {
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  wrapVisual: {
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    overflowX: 'hidden',
    paddingBottom: theme.spacing(4),
  },
  pageClip: {
    minWidth: 0,
    maxWidth: '100%',
    width: '100%',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  /**
   * Redesign layouts fill the inset well (`data-portal-remediate-fill` on html).
   * Height comes from that flex chain — do not nest a `100vh` calc here.
   */
  footerSession: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    height: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
  },
  wrapVisualFooter: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    overflowX: 'hidden',
    paddingBottom: 0,
    width: '100%',
    maxWidth: '100%',
  },
  chrome: {
    flexShrink: 0,
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  reviewFill: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  compareStrip: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    margin: theme.spacing(-1, 0, 2),
    padding: theme.spacing(1, 0, 1.5),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px dashed ${theme.palette.divider}`,
  },
  compareLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  },
  compareHint: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  stepsToggle: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.25),
  },
  stepsToggleLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  },
  backButton: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.text.secondary,
    padding: '4px 10px',
    marginLeft: -8,
    marginBottom: theme.spacing(0.5),
    minWidth: 0,
    alignSelf: 'flex-start',
    borderRadius: 16,
    '& .MuiButton-startIcon': {
      marginRight: 6,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: theme.spacing(0.5),
    wordBreak: 'break-all',
  },
  meta: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  stepperCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  stepperBare: {
    padding: theme.spacing(1, 0, 1),
    marginBottom: 0,
  },
  stepperHint: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1.5),
    maxWidth: 720,
  },
  /** Commit panel is a sibling of chrome; findings get this gap from the review stack. */
  stepperHintBeforePanel: {
    marginBottom: theme.spacing(2),
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  arrow: {
    color: theme.palette.text.disabled,
    fontSize: 18,
    margin: '0 4px',
    userSelect: 'none',
  },
  panel: {
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2),
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
  hint: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    maxWidth: 720,
  },
  pill: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
  formRow: {
    maxWidth: 480,
    marginBottom: theme.spacing(2),
  },
  commitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  },
}));

function workflowSteps(
  includeAi: boolean,
  chrome: WizardChrome,
  includeAuto = true,
  includeManual = false,
  stepsModel: StepsModel = 'with-findings',
): StepDef[] {
  if (chrome === 'visual') {
    if (skipsFindingsStep(stepsModel)) {
      const steps: StepDef[] = [{ id: 'scan', label: 'Scan' }];
      if (includeAuto || includeManual) {
        steps.push({
          id: 'tier1_proposals',
          label: 'Findings and auto remediations',
        });
      }
      if (includeAi) {
        steps.push({ id: 'ai_proposals', label: 'AI remediations' });
      }
      steps.push({ id: 'commit', label: 'Commit' });
      return steps;
    }
    const steps: StepDef[] = [
      { id: 'scan', label: 'Scan' },
      { id: 'findings', label: 'Findings' },
    ];
    if (includeAuto) {
      steps.push({ id: 'tier1_proposals', label: 'Auto remediations' });
    }
    if (includeAi) {
      steps.push({ id: 'ai_proposals', label: 'AI remediations' });
    }
    steps.push({ id: 'commit', label: 'Commit' });
    return steps;
  }
  if (chrome === 'inline') {
    return [
      { id: 'scan', label: 'Scan' },
      { id: 'findings', label: 'Results & Remediation' },
      { id: 'commit', label: 'Commit' },
    ];
  }
  if (chrome === 'new') {
    const steps: StepDef[] = [
      { id: 'scan', label: 'Scan' },
      { id: 'findings', label: 'Review auto-fixes' },
    ];
    if (includeAi) {
      steps.push(
        { id: 'ai_assessment', label: 'Choose AI findings' },
        { id: 'ai_proposals', label: 'Review AI-fixes' },
      );
    }
    steps.push({ id: 'commit', label: 'Commit' });
    return steps;
  }
  const steps: StepDef[] = [
    { id: 'scan', label: 'Scan' },
    { id: 'findings', label: 'Review findings' },
    { id: 'tier1_proposals', label: 'Quick-fix proposals' },
    { id: 'tier1_applied', label: 'Quick-fix applied' },
  ];
  if (includeAi) {
    steps.push(
      { id: 'ai_assessment', label: 'AI assessment' },
      { id: 'ai_proposals', label: 'AI proposals' },
      { id: 'ai_applied', label: 'AI applied' },
    );
  }
  steps.push({ id: 'commit', label: 'Commit' }, { id: 'complete', label: 'Complete' });
  return steps;
}

const SPINNING = new Set<StepId>([
  'scan',
  'findings',
  'tier1_proposals',
  'tier1_applied',
  'ai_assessment',
  'ai_proposals',
  'ai_applied',
  'commit',
]);

function findingsPhrase(n: number): string {
  return `${n} finding${n !== 1 ? 's' : ''}`;
}

function WorkflowStepper({
  steps,
  current,
  spinning,
  sessionDone,
  bare,
}: {
  steps: StepDef[];
  current: StepId;
  spinning: boolean;
  sessionDone?: boolean;
  bare?: boolean;
}) {
  const classes = useStyles();
  const activeIndex = steps.findIndex(s => s.id === current);

  const inner = (
      <Box className={classes.stepper} role="navigation" aria-label="Remediation workflow progress">
        {steps.map((step, index) => {
          const isComplete =
            sessionDone ||
            index < activeIndex ||
            (current === 'complete' && index === activeIndex);
          const isActive = index === activeIndex && !isComplete;
          const isPending = index > activeIndex;
          const showSpin = isActive && spinning && SPINNING.has(step.id);

          let badgeBg = 'transparent';
          let badgeFg = undefined as string | undefined;
          let badgeBorder = `2px solid rgba(0,0,0,0.16)`;
          if (isComplete) {
            badgeBg = statusColors.success;
            badgeFg = '#fff';
            badgeBorder = `2px solid ${statusColors.success}`;
          } else if (isActive) {
            badgeBg = statusColors.info;
            badgeFg = '#fff';
            badgeBorder = `2px solid ${statusColors.info}`;
          }

          return (
            <span key={step.id} className={classes.step}>
              {index > 0 && (
                <span className={classes.arrow} aria-hidden>
                  →
                </span>
              )}
              <span
                className={classes.badge}
                style={{
                  backgroundColor: badgeBg,
                  color: badgeFg,
                  border: badgeBorder,
                }}
                aria-label={`${step.label}${isComplete ? ', completed' : isActive ? ', current' : ', pending'}`}
              >
                {isComplete ? (
                  <CheckIcon style={{ fontSize: 14 }} />
                ) : showSpin ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  index + 1
                )}
              </span>
              <Typography
                className={classes.stepLabel}
                style={{
                  fontWeight: isActive ? 600 : 500,
                  opacity: isPending ? 0.55 : 1,
                }}
              >
                {step.label}
              </Typography>
            </span>
          );
        })}
      </Box>
  );

  if (bare) {
    return <div className={classes.stepperBare}>{inner}</div>;
  }

  return (
    <Paper variant="outlined" className={classes.stepperCard}>
      {inner}
    </Paper>
  );
}

function AssessPanel({
  findings,
  quickFixCount,
  onNext,
  onCancel,
  fixColumn,
  includeAi,
  t1Decisions,
  setT1Decisions,
  inlineAi,
  aiStatus,
  onGenerateAi,
  aiDecisions,
  setAiDecisions,
  craigFlow,
}: {
  findings: QualityViolation[];
  quickFixCount: number;
  onNext: () => void;
  onCancel: () => void;
  fixColumn?: boolean;
  includeAi?: boolean;
  t1Decisions?: Record<string, WizardDecision>;
  setT1Decisions?: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  inlineAi?: boolean;
  aiStatus?: Record<string, AiRowStatus>;
  onGenerateAi?: (key: string) => void;
  aiDecisions?: Record<string, WizardDecision>;
  setAiDecisions?: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  craigFlow?: boolean;
}) {
  const { filtered, nodes, filterGroups, narrowed } = useAssessFilters(findings);
  const auto = findings.filter(v => v.fixTier === 'deterministic');
  const ai = findings.filter(v => v.fixTier === 'ai');
  const manual = findings.filter(v => v.fixTier === 'manual');
  const t1Map = t1Decisions ?? {};
  const aiMap = aiDecisions ?? {};
  const decisions = { ...t1Map, ...aiMap };
  const t1Visible = filtered.filter(v => v.fixTier === 'deterministic');
  const readyAiVisible = inlineAi
    ? filtered.filter(v => v.fixTier === 'ai' && aiStatus?.[findingKey(v)] === 'ready')
    : [];
  const pendingVisible =
    t1Visible.filter(v => !decisions[findingKey(v)]).length +
    readyAiVisible.filter(v => !decisions[findingKey(v)]).length;
  const pendingT1 = auto.filter(v => !t1Map[findingKey(v)]).length;
  const pendingGeneratedAi = inlineAi
    ? ai.filter(v => aiStatus?.[findingKey(v)] === 'ready' && !aiMap[findingKey(v)]).length
    : 0;
  const aiLoading = inlineAi
    ? ai.some(v => aiStatus?.[findingKey(v)] === 'loading')
    : false;
  const decidedCount = Object.keys(decisions).length;
  const resultsMode = Boolean(fixColumn && setT1Decisions);

  const nextHint = resultsMode
    ? pendingT1 > 0
      ? `${pendingT1} ${craigFlow ? 'auto-fix' : 'Quick-fix'} finding${pendingT1 !== 1 ? 's' : ''} still undecided. Accept or Decline each one, then Next unlocks.`
      : pendingGeneratedAi > 0
        ? `${pendingGeneratedAi} generated AI suggestion${pendingGeneratedAi !== 1 ? 's' : ''} still undecided. Accept or Decline each one, then Next unlocks.`
        : aiLoading
          ? 'Wait for AI suggestions to finish generating.'
          : inlineAi
            ? 'Apply accepted fixes, then commit. Un-generated AI findings stay in the file.'
            : craigFlow
              ? includeAi
                ? 'Continue to choose which findings get an AI suggestion.'
                : 'Continue to commit.'
              : quickFixCount > 0
                ? 'Apply accepted Quick-fixes, then continue this session — no rescan.'
                : includeAi
                  ? 'Continue to AI fixes — no Quick-fix to apply.'
                  : 'Continue to commit — no Quick-fix to apply.'
    : quickFixCount > 0
      ? `Move on to remediation — review quick-fix proposals for ${findingsPhrase(quickFixCount)} (same session, no rescan).`
      : 'Move on to remediation — continue this session to review any available fixes (no rescan).';

  const decideVisible = (
    setter: Dispatch<SetStateAction<Record<string, WizardDecision>>> | undefined,
    items: QualityViolation[],
    value: WizardDecision | null,
  ) => {
    if (!setter) return;
    setter(prev => {
      const next = { ...prev };
      items.forEach(v => {
        const k = findingKey(v);
        if (value === null) delete next[k];
        else if (!next[k]) next[k] = value;
      });
      return next;
    });
  };

  return (
    <ReviewStepShell
      title={narrowed ? `Showing ${findingsPhrase(filtered.length)} of ${findings.length}` : undefined}
      description={
        <>
          <ReviewInventoryRow
            boxes={[
              {
                key: 'total',
                label: 'Total',
                primary: findings.length,
                secondary: uniqueNodeCount(findings),
              },
              {
                key: 'auto',
                label: craigFlow ? 'Auto-fix' : 'Quick-fix',
                primary: auto.length,
                secondary: uniqueNodeCount(auto),
              },
              {
                key: 'ai',
                label: 'AI eligible',
                primary: ai.length,
                secondary: uniqueNodeCount(ai),
              },
              {
                key: 'manual',
                label: 'Manual',
                primary: manual.length,
                secondary: uniqueNodeCount(manual),
              },
            ]}
          />
          <ReviewHint>
            {inlineAi
              ? 'Accept or Decline each Quick-fix. Generate an AI suggestion on a row when you want one, then Accept or Decline it. Manual findings stay in the file.'
              : craigFlow
                ? 'Accept or Decline each auto-fix. AI findings wait until you choose which ones get a suggestion.'
                : resultsMode
                  ? 'Accept or Decline each Quick-fix. AI and manual findings explain what happens next — no suggestion yet.'
                  : fixColumn
                    ? 'Quick-fix rows show the proposed change. AI and manual findings explain what happens next — no suggestion yet.'
                    : 'Latest scan results. Quick-fix proposals come next. On AI assessment you choose which findings get an AI suggestion — nothing generates yet.'}
          </ReviewHint>
        </>
      }
      nextHint={nextHint}
      nextDisabled={resultsMode && (pendingT1 > 0 || pendingGeneratedAi > 0 || aiLoading)}
      onNext={onNext}
      onCancel={onCancel}
      filterBar={<ReviewFilterBar groups={filterGroups} />}
      empty={nodes.length === 0}
      emptyMessage="No findings match the current filters."
    >
      <NodeReviewList
        nodes={nodes}
        mode="assess"
        decisions={resultsMode ? decisions : {}}
        pendingVisible={resultsMode ? pendingVisible : 0}
        decidedCount={resultsMode ? decidedCount : 0}
        fixColumn={fixColumn}
        inlineAi={inlineAi}
        aiStatus={aiStatus}
        onGenerateAi={onGenerateAi}
        aiFixHint={
          craigFlow
            ? 'AI can suggest a fix after you choose findings in the next step.'
            : 'AI can suggest a fix. On AI assessment, choose which findings get a suggestion — nothing generates yet.'
        }
        onDecision={
          setT1Decisions
            ? (id, d) => {
                const row = findings.find(v => findingKey(v) === id);
                if (row?.fixTier === 'ai' && setAiDecisions) {
                  setAiDecisions(prev => ({ ...prev, [id]: d }));
                  return;
                }
                setT1Decisions(prev => ({ ...prev, [id]: d }));
              }
            : undefined
        }
        onAcceptRemaining={
          resultsMode && setT1Decisions
            ? () => {
                decideVisible(setT1Decisions, t1Visible, 'accept');
                decideVisible(setAiDecisions, readyAiVisible, 'accept');
              }
            : undefined
        }
        onDeclineRemaining={
          resultsMode && setT1Decisions
            ? () => {
                decideVisible(setT1Decisions, t1Visible, 'decline');
                decideVisible(setAiDecisions, readyAiVisible, 'decline');
              }
            : undefined
        }
        onClear={
          resultsMode && setT1Decisions
            ? () => {
                decideVisible(setT1Decisions, t1Visible, null);
                decideVisible(setAiDecisions, readyAiVisible, null);
              }
            : undefined
        }
      />
    </ReviewStepShell>
  );
}

function AiAssessmentPanel({
  findings,
  selected,
  setSelected,
  onNext,
  onCancel,
  stepperLabel,
}: {
  findings: QualityViolation[];
  selected: Record<string, boolean>;
  setSelected: Dispatch<SetStateAction<Record<string, boolean>>>;
  onNext: () => void;
  onCancel: () => void;
  stepperLabel: string;
}) {
  const nodes = groupByNode(findings);
  const selectedCount = findings.filter(v => selected[findingKey(v)]).length;
  const nextHint =
    selectedCount > 0
      ? `Generate AI suggestions for ${selectedCount} selected finding${selectedCount !== 1 ? 's' : ''}. You'll Accept or Decline each one next.`
      : 'Continue without generating AI suggestions.';

  return (
    <ReviewStepShell
      title={stepperLabel}
      description={
        <>
          <ReviewInventoryRow
            boxes={[
              {
                key: 'eligible',
                label: 'AI eligible',
                primary: findings.length,
                secondary: uniqueNodeCount(findings),
              },
              {
                key: 'selected',
                label: 'Selected',
                primary: selectedCount,
                secondary: uniqueNodeCount(findings.filter(v => selected[findingKey(v)])),
              },
            ]}
          />
          <ReviewHint>
            Select the findings you want AI to generate a suggestion for. Nothing runs until you
            choose. Skip this step if you do not want AI suggestions.
          </ReviewHint>
        </>
      }
      nextHint={nextHint}
      nextLabel={selectedCount > 0 ? 'Generate AI suggestions' : 'Skip AI'}
      onNext={onNext}
      onCancel={onCancel}
      filterBar={
        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
          <Button
            size="small"
            color="primary"
            style={{ textTransform: 'none' }}
            onClick={() =>
              setSelected(prev => {
                const next = { ...prev };
                findings.forEach(v => {
                  next[findingKey(v)] = true;
                });
                return next;
              })
            }
          >
            Select all
          </Button>
          <span style={{ opacity: 0.35 }}>|</span>
          <Button
            size="small"
            color="primary"
            style={{ textTransform: 'none' }}
            disabled={selectedCount === 0}
            onClick={() => setSelected({})}
          >
            Clear
          </Button>
        </Box>
      }
      empty={nodes.length === 0}
      emptyMessage="No AI-eligible findings remain."
    >
      {nodes.map(n => (
        <Paper key={n.id} variant="outlined" style={{ padding: 12, marginBottom: 12 }}>
          <Typography
            variant="body2"
            style={{ fontFamily: 'monospace', fontWeight: 600, marginBottom: 8 }}
          >
            {n.title}
          </Typography>
          {n.findings.map(f => {
            const key = findingKey(f);
            return (
              <FormControlLabel
                key={key}
                style={{ display: 'flex', alignItems: 'flex-start', marginLeft: 0, marginBottom: 8 }}
                control={
                  <Checkbox
                    color="primary"
                    checked={Boolean(selected[key])}
                    onChange={e =>
                      setSelected(prev => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" style={{ fontWeight: 600 }}>
                      {f.ruleId}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {f.message}
                      <br />
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {f.file}:{f.lineStart}
                      </span>
                    </Typography>
                  </Box>
                }
              />
            );
          })}
        </Paper>
      ))}
    </ReviewStepShell>
  );
}

function GatePanel({
  findings,
  isAi,
  decisions,
  setDecisions,
  onNext,
  onCancel,
  compact,
  finishWithCommit,
}: {
  findings: QualityViolation[];
  isAi: boolean;
  decisions: Record<string, WizardDecision>;
  setDecisions: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  onNext: () => void;
  onCancel: () => void;
  compact?: boolean;
  finishWithCommit?: boolean;
}) {
  const { nodesAll, filteredNodes, filterGroups, narrowed } = useGateFilters(findings, decisions);
  const pendingAll = nodesAll.filter(n => !decisions[n.id]).length;
  const pendingVisible = filteredNodes.filter(n => !decisions[n.id]).length;
  const decidedCount = nodesAll.filter(n => Boolean(decisions[n.id])).length;
  const acceptedIds = nodesAll.filter(n => decisions[n.id] === 'accept');
  const declinedCount = nodesAll.filter(n => decisions[n.id] === 'decline').length;
  const totalFindings = findings.length;

  const inventory = useMemo(() => {
    let pendingF = 0;
    let pendingL = 0;
    let acceptedF = 0;
    let acceptedL = 0;
    let declinedF = 0;
    let declinedL = 0;
    nodesAll.forEach(n => {
      const d = decisions[n.id];
      if (d === 'accept') {
        acceptedF += n.findings.length;
        acceptedL += 1;
      } else if (d === 'decline') {
        declinedF += n.findings.length;
        declinedL += 1;
      } else {
        pendingF += n.findings.length;
        pendingL += 1;
      }
    });
    return { pendingF, pendingL, acceptedF, acceptedL, declinedF, declinedL };
  }, [nodesAll, decisions]);

  const nextHint =
    pendingAll > 0
      ? `${pendingAll} location${pendingAll !== 1 ? 's' : ''} still undecided. Accept or Decline each one, then Next unlocks. Accept remaining / Decline remaining only decide currently visible rows — widen filters to reach the rest.`
      : isAi
        ? acceptedIds.length > 0
          ? `Apply ${acceptedIds.length} accepted AI fix${acceptedIds.length !== 1 ? 'es' : ''}${declinedCount > 0 ? ` (${declinedCount} declined)` : ''}, then ${finishWithCommit ? 'commit' : 'finish remediation'}.`
          : finishWithCommit
            ? 'Continue with no AI fixes applied, then commit.'
            : 'Continue with no AI fixes applied, then finish remediation.'
        : acceptedIds.length > 0
          ? `Apply ${acceptedIds.length} accepted quick-fix${acceptedIds.length !== 1 ? 'es' : ''}${declinedCount > 0 ? ` (${declinedCount} declined)` : ''}, then continue to ${compact ? 'AI' : 'AI assessment'} if enabled.`
          : `Continue with no quick-fixes applied, then ${compact ? 'AI' : 'AI assessment'} if enabled (or finish if AI is off).`;

  const visibleFindings = filteredNodes.reduce((n, node) => n + node.findings.length, 0);

  return (
    <ReviewStepShell
      title={narrowed ? `Showing ${visibleFindings} finding${visibleFindings !== 1 ? 's' : ''} of ${totalFindings}` : undefined}
      description={
        <>
          <ReviewInventoryRow
            boxes={[
              {
                key: 'total',
                label: 'Total',
                primary: totalFindings,
                secondary: nodesAll.length,
              },
              {
                key: 'pending',
                label: 'Undecided',
                primary: inventory.pendingF,
                secondary: inventory.pendingL,
              },
              {
                key: 'accepted',
                label: 'Accepted',
                primary: inventory.acceptedF,
                secondary: inventory.acceptedL,
              },
              {
                key: 'declined',
                label: 'Declined',
                primary: inventory.declinedF,
                secondary: inventory.declinedL,
              },
            ]}
          />
          <ReviewHint>
            Every location starts undecided. Next stays disabled until you Accept or Decline each
            one. Decided rows collapse. Accept remaining / Decline remaining only apply to currently
            visible rows — widen filters to decide the rest, or Clear to reset and expand again.
          </ReviewHint>
        </>
      }
      nextHint={nextHint}
      nextDisabled={pendingAll > 0}
      onNext={onNext}
      onCancel={onCancel}
      filterBar={<ReviewFilterBar groups={filterGroups} />}
      empty={filteredNodes.length === 0}
      emptyMessage="No proposals match the current filters."
    >
      <NodeReviewList
        nodes={filteredNodes}
        mode="gate"
        decisions={decisions}
        pendingVisible={pendingVisible}
        decidedCount={decidedCount}
        onDecision={(id, d) => setDecisions(prev => ({ ...prev, [id]: d }))}
        onAcceptRemaining={() =>
          setDecisions(prev => {
            const next = { ...prev };
            filteredNodes.forEach(n => {
              if (!next[n.id]) next[n.id] = 'accept';
            });
            return next;
          })
        }
        onDeclineRemaining={() =>
          setDecisions(prev => {
            const next = { ...prev };
            filteredNodes.forEach(n => {
              if (!next[n.id]) next[n.id] = 'decline';
            });
            return next;
          })
        }
        onClear={() =>
          setDecisions(prev => {
            const next = { ...prev };
            filteredNodes.forEach(n => {
              delete next[n.id];
            });
            return next;
          })
        }
      />
    </ReviewStepShell>
  );
}

function initialStep(
  resume: boolean,
  status: string | undefined,
  stepsModel: StepsModel,
): StepId {
  if (!resume) return 'scan';
  if (status === 'pr-open' || status === 'pr-merged') return 'complete';
  if (status === 'proposals-ready') return 'tier1_proposals';
  if (status === 'in-progress') {
    return skipsFindingsStep(stepsModel) ? 'tier1_proposals' : 'findings';
  }
  return 'scan';
}

export const ApmeRemediationPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { repoName: rawName } = useParams<{ repoName: string }>();
  const repoName = decodeURIComponent(rawName ?? '');
  const [params, setParams] = useSearchParams();
  const fromRepo = params.get('from') === 'repo';
  const fromList = params.get('from') === 'list';
  const fromScans = params.get('from') === 'scans';
  const fromRemediations = params.get('from') === 'remediations';
  const resume = params.get('resume') === '1';
  const wizard = parseWizardChrome(params.get('wizard'));
  const ctaLayout = parseCtaLayout(params.get('cta'));
  const reviewLayout = parseReviewLayout(params.get('review'));
  const stepsModel = parseStepsModel(params.get('steps'));
  const compact = wizard !== 'original';
  const inline = isInlineChrome(wizard);
  const visual = isVisualChrome(wizard);
  const craig = isCraigRedesign(wizard);
  const resultsFix = isResultsFixChrome(wizard);
  const { experience } = useNavIaModel();

  const repo = GIT_REPOSITORIES.find(r => r.name === repoName);
  const quality = getProjectQuality(repoName);

  const includeAi = useMemo(() => {
    if (!quality) return false;
    return (
      quality.violations.some(v => v.fixTier === 'ai') ||
      (quality.latestScan.aiCandidates ?? 0) > 0
    );
  }, [quality]);
  const includeAuto = useMemo(() => {
    if (!quality) return false;
    return quality.violations.some(v => v.fixTier === 'deterministic');
  }, [quality]);
  const includeManual = useMemo(() => {
    if (!quality) return false;
    return quality.violations.some(
      v => v.fixTier !== 'deterministic' && v.fixTier !== 'ai',
    );
  }, [quality]);

  const steps = useMemo(
    () =>
      workflowSteps(includeAi, wizard, includeAuto, includeManual, stepsModel),
    [includeAi, includeAuto, includeManual, wizard, stepsModel],
  );

  const [step, setStep] = useState<StepId>(() =>
    initialStep(
      resume,
      quality?.remediationStatus,
      parseStepsModel(params.get('steps')),
    ),
  );
  const [logIndex, setLogIndex] = useState(0);
  const [applyTick, setApplyTick] = useState(0);
  const [t1Decisions, setT1Decisions] = useState<Record<string, WizardDecision>>({});
  const [aiDecisions, setAiDecisions] = useState<Record<string, WizardDecision>>({});
  const [aiOptIn, setAiOptIn] = useState<Record<string, boolean>>({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState<Record<string, AiRowStatus>>({});
  const generateInlineAi = useCallback((key: string) => {
    setAiStatus(prev => ({ ...prev, [key]: 'loading' }));
    window.setTimeout(() => {
      setAiStatus(prev => ({ ...prev, [key]: 'ready' }));
    }, 900);
  }, []);
  const generateAllInlineAi = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setAiStatus(prev => {
      const next = { ...prev };
      keys.forEach(key => {
        next[key] = 'loading';
      });
      return next;
    });
    window.setTimeout(() => {
      setAiStatus(prev => {
        const next = { ...prev };
        keys.forEach(key => {
          next[key] = 'ready';
        });
        return next;
      });
    }, 1100);
  }, []);
  const [createPr, setCreatePr] = useState(true);
  const [branchName, setBranchName] = useState(
    `apme/remediate-${(quality?.latestScan.scanId ?? 'fix').slice(0, 12)}`,
  );
  const [committing, setCommitting] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [prUrl, setPrUrl] = useState(
    quality?.remediationPrUrl ??
      `https://github.com/${repo?.org ?? 'acme-corp'}/${repoName}/pull/42`,
  );

  const quickFix = quality?.violations.filter(v => v.fixTier === 'deterministic') ?? [];
  const aiFix = quality?.violations.filter(v => v.fixTier === 'ai') ?? [];

  const spinning =
    step === 'scan' ||
    step === 'tier1_applied' ||
    (step === 'ai_assessment' && aiGenerating) ||
    step === 'ai_applied' ||
    (step === 'commit' && committing);
  const stepperCurrent = displayStepId(step, wizard, stepsModel);
  const sessionDone = compact && step === 'complete';

  useEffect(() => {
    if (craig && step === 'tier1_proposals') setStep('findings');
    if (
      inline &&
      !visual &&
      (step === 'tier1_proposals' || step === 'ai_assessment' || step === 'ai_proposals')
    ) {
      setStep('findings');
    }
  }, [craig, inline, visual, step]);

  useEffect(() => {
    if (step !== 'scan') return;
    setLogIndex(0);
    const id = window.setInterval(() => {
      setLogIndex(i => {
        if (i >= SCAN_PHASES.length - 1) {
          window.clearInterval(id);
          if (skipsFindingsStep(stepsModel)) {
            setStep(
              includeAuto || includeManual
                ? 'tier1_proposals'
                : includeAi
                  ? 'ai_proposals'
                  : 'commit',
            );
          } else {
            setStep('findings');
          }
          return i;
        }
        return i + 1;
      });
    }, 700);
    return () => window.clearInterval(id);
  }, [step, stepsModel, includeAuto, includeManual, includeAi]);

  useEffect(() => {
    if (!visual || !skipsFindingsStep(stepsModel)) return;
    if (step !== 'findings') return;
    setStep(
      includeAuto || includeManual
        ? 'tier1_proposals'
        : includeAi
          ? 'ai_proposals'
          : 'commit',
    );
  }, [visual, stepsModel, step, includeAuto, includeManual, includeAi]);

  useEffect(() => {
    if (step !== 'tier1_applied' && step !== 'ai_applied' && !(step === 'ai_assessment' && aiGenerating)) {
      return;
    }
    setApplyTick(0);
    const tick = window.setInterval(() => {
      setApplyTick(t => Math.min(t + 1, 3));
    }, APPLY_MS / 4);
    const t = window.setTimeout(() => {
      if (step === 'tier1_applied') {
        if (visual) {
          setStep(includeAi ? 'ai_proposals' : 'commit');
        } else if (inline) {
          setStep('commit');
        } else {
          setStep(includeAi ? 'ai_assessment' : 'commit');
        }
      } else if (step === 'ai_assessment') {
        setAiGenerating(false);
        setStep('ai_proposals');
      } else {
        setStep('commit');
      }
    }, APPLY_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(t);
    };
  }, [step, includeAi, inline, visual, aiGenerating]);

  const fillWell =
    Boolean(quality && repo) &&
    visual &&
    (step === 'findings' || step === 'tier1_proposals' || step === 'ai_proposals') &&
    (ctaLayout === 'footer' || isRedesignLayout(reviewLayout));
  const hidePageChrome =
    fillWell &&
    isRedesignLayout(reviewLayout) &&
    (step === 'findings' || step === 'tier1_proposals' || step === 'ai_proposals');

  useEffect(() => {
    if (!fillWell) return undefined;
    document.documentElement.setAttribute('data-portal-remediate-fill', '');
    return () => {
      document.documentElement.removeAttribute('data-portal-remediate-fill');
    };
  }, [fillWell]);

  const goBack = useCallback(() => {
    if (fromRepo) {
      navigate(`/self-service/repositories/${encodeURIComponent(repoName)}`);
      return;
    }
    if (fromList) {
      navigate('/self-service/repositories');
      return;
    }
    if (fromScans) {
      navigate(scansListPath(experience));
      return;
    }
    if (fromRemediations) {
      navigate(remediationsListPath(experience));
      return;
    }
    navigate(qualityHomePath(experience));
  }, [experience, fromRepo, fromList, fromScans, fromRemediations, navigate, repoName]);

  const backLabel = fromRepo
    ? repo?.name ?? 'Repository'
    : fromList
      ? 'Git Repositories'
      : fromScans
        ? 'Scans'
        : fromRemediations
          ? 'Remediations'
          : 'Content quality';

  if (!quality || !repo) {
    return (
      <Page themeId="app">
        <Content>
          <Typography>Repository not found.</Typography>
          <Button
            className={classes.pill}
            color="primary"
            onClick={() => navigate(qualityHomePath(experience))}
          >
            {experience === 'develop' ? 'Back to Content quality' : 'Back to Git Repositories'}
          </Button>
        </Content>
      </Page>
    );
  }

  const displayRepo = `${repo.org}/${repo.name}`;
  const isWithoutFindings = stepsModel === 'without-findings';
  const scanWhen =
    quality.scanHistory[0]?.createdAt ?? quality.latestScan.createdAt;
  const scanSha = quality.latestScan.commitHash;
  const pageTitle = displayRepo;
  const pageMeta = `Health scan: ${scanWhen} · commit ${scanSha}`;
  const setStepsModel = (next: StepsModel) => {
    const nextParams = new URLSearchParams(params);
    if (next === 'with-findings') {
      nextParams.delete('steps');
    } else {
      nextParams.set('steps', next);
    }
    setParams(nextParams, { replace: true });
  };

  const pageChrome = (
    <Box className={classes.chrome}>
      {visual ? (
        <Box className={classes.stepsToggle} role="region" aria-label="Design options">
          <Typography className={classes.stepsToggleLabel} component="span">
            Design options
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={stepsModel}
            onChange={(_event, next: StepsModel | null) => {
              if (next == null) return;
              setStepsModel(next);
            }}
            aria-label="Remediation design options"
          >
            <ToggleButton value="with-findings">With findings</ToggleButton>
            <ToggleButton value="without-findings">Without findings</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      ) : null}
      <Button
        variant="text"
        color="inherit"
        size="small"
        className={classes.backButton}
        startIcon={<ArrowBack fontSize="small" />}
        onClick={goBack}
      >
        {backLabel}
      </Button>
      <Typography className={classes.title}>{pageTitle}</Typography>
      <Typography className={classes.meta}>{pageMeta}</Typography>
      <WorkflowStepper
        steps={steps}
        current={stepperCurrent}
        spinning={spinning && !sessionDone}
        sessionDone={sessionDone}
        bare={visual}
      />
      {visual &&
      step !== 'tier1_proposals' &&
      (step === 'ai_proposals' || step === 'commit') ? (
        <Typography
          className={`${classes.stepperHint}${
            step === 'commit' ? ` ${classes.stepperHintBeforePanel}` : ''
          }`}
          variant="body2"
          color="textSecondary"
        >
          {step === 'tier1_proposals'
              ? 'Accept or decline auto remediations to include in the commit.'
              : step === 'ai_proposals'
                ? 'Generate AI suggestions for the findings you want.'
                : 'Create a branch, push the remediations you accepted, and optionally open a pull request.'}
        </Typography>
      ) : null}
    </Box>
  );
  const showReviewCompare =
    visual &&
    SHOW_REVIEW_LAYOUT_COMPARE &&
    (step === 'findings' || step === 'tier1_proposals' || step === 'ai_proposals');
  const layoutCompare = showReviewCompare ? (
    <Box
      className={classes.compareStrip}
      role="region"
      aria-label="Remediation layout compare"
    >
      <Typography className={classes.compareLabel}>Layout</Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={reviewLayout}
        onChange={(_event, next) => {
          if (next == null) return;
          const nextParams = new URLSearchParams(params);
          if (next === 'current') {
            nextParams.delete('review');
          } else {
            nextParams.set('review', next);
          }
          setParams(nextParams, { replace: true });
        }}
        aria-label="Remediation layout"
      >
        <ToggleButton value="current">Current</ToggleButton>
        <ToggleButton value="redesign">Current redesign</ToggleButton>
        <ToggleButton value="redesign3">Redesign 3</ToggleButton>
        <ToggleButton value="redesign4">Redesign 4</ToggleButton>
      </ToggleButtonGroup>
      <Typography className={classes.compareHint}>
        {reviewLayout === 'redesign4'
          ? 'Three-state Accept / Decline. Auto-accept auto-fixes. Accept remaining skips declined.'
          : reviewLayout === 'redesign3'
            ? 'Copy of Current redesign. Accepted is a toggle. No Decline.'
            : isRedesignLayout(reviewLayout)
              ? 'All is the default. Tab copy sits above the filters. Footer shows accepted counts by kind, then Continue.'
              : 'Continue sits under the stepper. Summary and filters stay expanded.'}
      </Typography>
    </Box>
  ) : null;
  const sessionAiFix = aiFix.filter(v => Boolean(aiOptIn[findingKey(v)]));
  const t1Accepted = resultsFix
    ? groupByNode(quickFix).filter(n =>
        n.findings.every(f => t1Decisions[findingKey(f)] === 'accept'),
      ).length
    : groupByNode(quickFix).filter(n => t1Decisions[n.id] === 'accept').length;
  const aiAccepted = inline
    ? aiFix.filter(v => aiDecisions[findingKey(v)] === 'accept').length
    : groupByNode(sessionAiFix).filter(n => aiDecisions[n.id] === 'accept').length;
  const remediated = t1Accepted + aiAccepted;

  const body = (() => {
    if (step === 'scan') {
      const pct = Math.round(((logIndex + 1) / SCAN_PHASES.length) * 95);
      return (
        <OperationProgressPanel
          heading={logIndex < 1 ? 'Starting operation...' : 'Checking...'}
          progress={pct}
          lines={SCAN_PHASES.slice(0, logIndex + 1)}
          onCancel={goBack}
        />
      );
    }

    if (step === 'findings') {
      if (visual) {
        return (
          <InlineVisualReview
            findings={quality.violations}
            t1Decisions={t1Decisions}
            setT1Decisions={setT1Decisions}
            aiDecisions={aiDecisions}
            setAiDecisions={setAiDecisions}
            aiStatus={aiStatus}
            onNext={() => {
              if (includeAuto) setStep('tier1_proposals');
              else if (includeAi) setStep('ai_proposals');
              else setStep('commit');
            }}
            onCancel={goBack}
            ctaLayout={ctaLayout}
            reviewLayout={reviewLayout}
            phase="results"
            sideBySide={!isWithoutFindings}
            header={
              isRedesignLayout(reviewLayout) ? (
                <>
                  {layoutCompare}
                  {pageChrome}
                </>
              ) : undefined
            }
          />
        );
      }
      return (
        <AssessPanel
          findings={quality.violations}
          quickFixCount={quickFix.length}
          onNext={() => {
            if (craig) {
              if (includeAi) setStep('ai_assessment');
              else setStep('commit');
              return;
            }
            if (inline) {
              setStep('tier1_applied');
              return;
            }
            setStep('tier1_proposals');
          }}
          onCancel={goBack}
          fixColumn={resultsFix}
          includeAi={includeAi}
          t1Decisions={resultsFix ? t1Decisions : undefined}
          setT1Decisions={resultsFix ? setT1Decisions : undefined}
          inlineAi={inline}
          aiStatus={aiStatus}
          onGenerateAi={inline ? generateInlineAi : undefined}
          aiDecisions={inline ? aiDecisions : undefined}
          setAiDecisions={inline ? setAiDecisions : undefined}
          craigFlow={craig}
        />
      );
    }

    if (step === 'tier1_proposals') {
      if (visual) {
        return (
          <InlineVisualReview
            findings={quality.violations}
            t1Decisions={t1Decisions}
            setT1Decisions={setT1Decisions}
            aiDecisions={aiDecisions}
            setAiDecisions={setAiDecisions}
            aiStatus={aiStatus}
            onNext={() => setStep('tier1_applied')}
            onCancel={goBack}
            ctaLayout={ctaLayout}
            reviewLayout={reviewLayout}
            phase={isWithoutFindings ? 'review' : 'autofix'}
            sideBySide={!isWithoutFindings}
            header={
              isRedesignLayout(reviewLayout) ? (
                <>
                  {layoutCompare}
                  {pageChrome}
                </>
              ) : undefined
            }
          />
        );
      }
      return (
        <GatePanel
          findings={quickFix}
          isAi={false}
          decisions={t1Decisions}
          setDecisions={setT1Decisions}
          onNext={() => setStep('tier1_applied')}
          onCancel={goBack}
          compact={compact}
        />
      );
    }

    if (step === 'ai_assessment' && !aiGenerating && !inline) {
      return (
        <AiAssessmentPanel
          findings={aiFix}
          selected={aiOptIn}
          setSelected={setAiOptIn}
          stepperLabel={craig ? 'Choose AI findings' : 'Choose findings for AI'}
          onNext={() => {
            const picked = aiFix.some(v => aiOptIn[findingKey(v)]);
            if (picked) setAiGenerating(true);
            else setStep('commit');
          }}
          onCancel={goBack}
        />
      );
    }

    if (step === 'tier1_applied' || (step === 'ai_assessment' && aiGenerating) || step === 'ai_applied') {
      const heading =
        step === 'tier1_applied'
          ? 'Applying approved fixes...'
          : step === 'ai_assessment'
            ? 'Generating AI suggestions...'
            : 'Applying approved fixes...';
      const logs =
        step === 'ai_assessment'
          ? [
              { phase: 'ai', text: 'Generating AI suggestions…' },
              { phase: 'ai', text: 'Scoring selected findings…' },
              { phase: 'ai', text: 'Preparing AI proposals…' },
            ]
          : [
              { phase: 'applying', text: 'Applying approved fixes...' },
              { phase: 'tier1', text: 'Pass 1/2 — applying transforms' },
              { phase: 'tier1', text: 'Converged — final scan' },
            ];
      return (
        <OperationProgressPanel
          heading={heading}
          progress={Math.min(20 + applyTick * 25, 95)}
          lines={logs.slice(0, applyTick + 1)}
          onCancel={goBack}
        />
      );
    }

    if (step === 'ai_proposals') {
      if (visual) {
        return (
          <InlineVisualReview
            findings={quality.violations}
            t1Decisions={t1Decisions}
            setT1Decisions={setT1Decisions}
            aiDecisions={aiDecisions}
            setAiDecisions={setAiDecisions}
            aiStatus={aiStatus}
            onGenerateAi={generateInlineAi}
            onGenerateAllAi={generateAllInlineAi}
            onNext={() => setStep('commit')}
            onCancel={goBack}
            ctaLayout={ctaLayout}
            reviewLayout={reviewLayout}
            phase="ai"
            sideBySide={!isWithoutFindings}
            header={
              isRedesignLayout(reviewLayout) ? (
                <>
                  {layoutCompare}
                  {pageChrome}
                </>
              ) : undefined
            }
          />
        );
      }
      return (
        <GatePanel
          findings={sessionAiFix}
          isAi
          decisions={aiDecisions}
          setDecisions={setAiDecisions}
          onNext={() => setStep('ai_applied')}
          onCancel={goBack}
          compact={compact}
          finishWithCommit={craig}
        />
      );
    }

    if (step === 'commit') {
      const count = remediated || quality.latestScan.fixable;
      const commitHeading =
        count > 0
          ? `Commit ${count} remediated change${count !== 1 ? 's' : ''}`
          : 'Commit remediation changes';
      return (
        <Paper variant="outlined" className={classes.panel}>
          <div className={classes.commitHeader}>
            <Box>
              <Typography className={classes.panelTitle}>{commitHeading}</Typography>
              {visual ? null : (
                <Typography className={classes.hint} style={{ marginBottom: 0 }}>
                  Create a branch, push the fixes, and optionally open a pull request.
                </Typography>
              )}
            </Box>
            <Box display="flex" flexDirection="column" alignItems="flex-end" style={{ gap: 8 }}>
              {visual ? (
                <Button className={classes.pill} onClick={goBack} disabled={committing}>
                  Cancel
                </Button>
              ) : (
                <>
                  <Box display="flex" style={{ gap: 8 }}>
                    <Button
                      className={classes.pill}
                      color="primary"
                      variant="contained"
                      onClick={() => setStep('complete')}
                    >
                      Next
                    </Button>
                    <Button className={classes.pill} onClick={goBack} disabled={committing}>
                      Cancel
                    </Button>
                  </Box>
                  <Typography variant="caption" color="textSecondary" style={{ textAlign: 'right', maxWidth: 360 }}>
                    {pushed
                      ? inline || craig
                        ? 'Finish this session.'
                        : 'Continue to the complete step.'
                      : craig
                        ? 'Continue without pushing. Use Create below to push or open a PR first.'
                        : 'Continue without pushing. Use Commit below to push or open a PR first.'}
                  </Typography>
                </>
              )}
            </Box>
          </div>
          <Box className={classes.formRow}>
            <TextField
              fullWidth
              label="Branch name"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={createPr}
                onChange={e => setCreatePr(e.target.checked)}
              />
            }
            label="Open a pull request"
          />
          <Box mt={2}>
            <Button
              className={classes.pill}
              color="primary"
              variant="contained"
              disabled={committing}
              onClick={() => {
                setCommitting(true);
                window.setTimeout(() => {
                  setCommitting(false);
                  setPushed(true);
                  setPrUrl(`https://github.com/${repo.org}/${repo.name}/pull/42`);
                  setStep('complete');
                }, 1400);
              }}
            >
              {committing
                ? 'Pushing…'
                : craig
                  ? createPr
                    ? 'Create pull request'
                    : 'Create'
                  : createPr
                    ? 'Commit & open PR'
                    : 'Commit & push'}
            </Button>
          </Box>
        </Paper>
      );
    }

    return (
      <RemediationReceipt
        repoLabel={displayRepo}
        branchName={branchName}
        prUrl={prUrl}
        hasPullRequest={Boolean(createPr && pushed && prUrl)}
        findings={quality.violations}
        t1Decisions={t1Decisions}
        aiDecisions={aiDecisions}
        onDone={goBack}
        doneLabel={`Back to ${backLabel}`}
      />
    );
  })();

  return (
    <Page themeId="app" className={classes.pageFit}>
      <Content className={classes.pageClip}>
        <Box
          className={
            fillWell
              ? `${classes.visualSession} ${classes.footerSession}`
              : visual
                ? classes.visualSession
                : undefined
          }
        >
        {showReviewCompare && !isRedesignLayout(reviewLayout) ? (
        layoutCompare
        ) : visual && !FORCED_CTA_LAYOUT ? (
        <Box
          className={classes.compareStrip}
          role="region"
          aria-label="Continue button placement compare"
        >
          <Typography className={classes.compareLabel}>Continue</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={ctaLayout}
            onChange={(_event, next) => {
              if (next == null) return;
              const nextParams = new URLSearchParams(params);
              if (next === 'footer') {
                nextParams.delete('cta');
              } else {
                nextParams.set('cta', next);
              }
              setParams(nextParams, { replace: true });
            }}
            aria-label="Continue button placement"
          >
            <ToggleButton value="current">Current</ToggleButton>
            <ToggleButton value="footer">Wizard footer</ToggleButton>
          </ToggleButtonGroup>
          <Typography className={classes.compareHint}>
            {ctaLayout === 'footer'
              ? 'List actions stay with findings. Continue and Cancel stay in the step footer.'
              : 'Continue sits under the stepper, with Accept remaining on the findings list.'}
          </Typography>
        </Box>
        ) : FORCED_REMEDIATION_WIZARD ? null : (
        <Box
          className={classes.compareStrip}
          role="region"
          aria-label="Prototype wizard compare"
        >
          <Typography className={classes.compareLabel}>Prototype</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={wizard}
            onChange={(_event, next) => {
              if (next == null) return;
              const nextParams = new URLSearchParams(params);
              if (next === 'original') {
                nextParams.delete('wizard');
              } else {
                nextParams.set('wizard', next);
              }
              setParams(nextParams, { replace: true });
            }}
            aria-label="Wizard design"
          >
            <ToggleButton value="original">Original</ToggleButton>
            <ToggleButton value="new">Redesign</ToggleButton>
            <ToggleButton value="inline">Inline AI</ToggleButton>
            <ToggleButton value="visual">Inline visual</ToggleButton>
          </ToggleButtonGroup>
          <Typography className={classes.compareHint}>
            {wizard === 'visual'
              ? 'Scan → Findings → Auto remediations → AI remediations → Commit. Findings is all findings. Generate AI only on the AI remediations step.'
              : wizard === 'inline'
              ? 'Scan. One Results & Remediation step: auto-fixes plus Generate AI per row. Then commit.'
              : wizard === 'new'
                ? 'Scan → Review auto-fixes → Choose AI findings (pick, then generate) → Review AI-fixes → Commit.'
                : 'SPA 9-step. On AI assessment, check the findings you want AI to generate — then Generate AI suggestions. Unchecked findings skip AI.'}
          </Typography>
        </Box>
        )}
        <Box
          className={
            visual
              ? `${classes.wrapVisual}${fillWell ? ` ${classes.wrapVisualFooter}` : ''}`
              : classes.wrap
          }
        >
          {hidePageChrome ? null : pageChrome}
          {fillWell ? <Box className={classes.reviewFill}>{body}</Box> : body}
        </Box>
        </Box>
      </Content>
    </Page>
  );
};
