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
  OperationResultCard,
  ReviewFilterBar,
  ReviewHint,
  ReviewInventoryRow,
  ReviewStepShell,
  type WizardDecision,
  groupByNode,
  uniqueNodeCount,
  useAssessFilters,
  useGateFilters,
} from './SpaRemediationReview';

/**
 * Brad SPA Scan → Complete workflow, MUI under RHDH theme.
 * Ephemeral Quality remediation session (`/apme/remediate/:repo`).
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
    maxWidth: 1100,
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
    borderRadius: 16,
    '& .MuiButton-startIcon': {
      marginRight: 6,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
  },
  titleRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(0.5),
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  repo: {
    fontSize: 16,
    fontWeight: 500,
    color: theme.palette.text.secondary,
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

function workflowSteps(includeAi: boolean): StepDef[] {
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
  'tier1_applied',
  'ai_assessment',
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
}: {
  steps: StepDef[];
  current: StepId;
  spinning: boolean;
}) {
  const classes = useStyles();
  const activeIndex = steps.findIndex(s => s.id === current);

  return (
    <Paper variant="outlined" className={classes.stepperCard}>
      <Box className={classes.stepper} role="navigation" aria-label="Remediation workflow progress">
        {steps.map((step, index) => {
          const isComplete =
            index < activeIndex || (current === 'complete' && index === activeIndex);
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
    </Paper>
  );
}

function AssessPanel({
  findings,
  quickFixCount,
  onNext,
  onCancel,
}: {
  findings: QualityViolation[];
  quickFixCount: number;
  onNext: () => void;
  onCancel: () => void;
}) {
  const { filtered, nodes, filterGroups, narrowed } = useAssessFilters(findings);
  const auto = findings.filter(v => v.fixTier === 'deterministic');
  const ai = findings.filter(v => v.fixTier === 'ai');
  const manual = findings.filter(v => v.fixTier === 'manual');
  const nextHint =
    quickFixCount > 0
      ? `Move on to remediation — review quick-fix proposals for ${findingsPhrase(quickFixCount)} (same session, no rescan).`
      : 'Move on to remediation — continue this session to review any available fixes (no rescan).';

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
                label: 'Quick-fix',
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
            Latest scan results. Remediate continues this session — no rescan.
          </ReviewHint>
        </>
      }
      nextHint={nextHint}
      onNext={onNext}
      onCancel={onCancel}
      filterBar={<ReviewFilterBar groups={filterGroups} />}
      empty={nodes.length === 0}
      emptyMessage="No findings match the current filters."
    >
      <NodeReviewList
        nodes={nodes}
        mode="assess"
        decisions={{}}
        pendingVisible={0}
        decidedCount={0}
      />
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
}: {
  findings: QualityViolation[];
  isAi: boolean;
  decisions: Record<string, WizardDecision>;
  setDecisions: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  onNext: () => void;
  onCancel: () => void;
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
          ? `Apply ${acceptedIds.length} accepted AI fix${acceptedIds.length !== 1 ? 'es' : ''}${declinedCount > 0 ? ` (${declinedCount} declined)` : ''}, then finish remediation.`
          : 'Continue with no AI fixes applied, then finish remediation.'
        : acceptedIds.length > 0
          ? `Apply ${acceptedIds.length} accepted quick-fix${acceptedIds.length !== 1 ? 'es' : ''}${declinedCount > 0 ? ` (${declinedCount} declined)` : ''}, then continue to AI assessment if enabled.`
          : 'Continue with no quick-fixes applied, then AI assessment if enabled (or finish if AI is off).';

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

function initialStep(resume: boolean, status?: string): StepId {
  if (!resume) return 'scan';
  if (status === 'pr-open' || status === 'pr-merged') return 'complete';
  if (status === 'proposals-ready') return 'tier1_proposals';
  if (status === 'in-progress') return 'findings';
  return 'scan';
}

export const ApmeRemediationPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { repoName: rawName } = useParams<{ repoName: string }>();
  const repoName = decodeURIComponent(rawName ?? '');
  const [params] = useSearchParams();
  const fromRepo = params.get('from') === 'repo';
  const fromList = params.get('from') === 'list';
  const fromScans = params.get('from') === 'scans';
  const fromRemediations = params.get('from') === 'remediations';
  const resume = params.get('resume') === '1';
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

  const steps = useMemo(() => workflowSteps(includeAi), [includeAi]);

  const [step, setStep] = useState<StepId>(() =>
    initialStep(resume, quality?.remediationStatus),
  );
  const [logIndex, setLogIndex] = useState(0);
  const [applyTick, setApplyTick] = useState(0);
  const [t1Decisions, setT1Decisions] = useState<Record<string, WizardDecision>>({});
  const [aiDecisions, setAiDecisions] = useState<Record<string, WizardDecision>>({});
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
  const manual = quality?.violations.filter(v => v.fixTier === 'manual') ?? [];

  const spinning =
    step === 'scan' ||
    step === 'tier1_applied' ||
    step === 'ai_assessment' ||
    step === 'ai_applied' ||
    (step === 'commit' && committing);

  useEffect(() => {
    if (step !== 'scan') return;
    setLogIndex(0);
    const id = window.setInterval(() => {
      setLogIndex(i => {
        if (i >= SCAN_PHASES.length - 1) {
          window.clearInterval(id);
          setStep('findings');
          return i;
        }
        return i + 1;
      });
    }, 700);
    return () => window.clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== 'tier1_applied' && step !== 'ai_assessment' && step !== 'ai_applied') {
      return;
    }
    setApplyTick(0);
    const tick = window.setInterval(() => {
      setApplyTick(t => Math.min(t + 1, 3));
    }, APPLY_MS / 4);
    const t = window.setTimeout(() => {
      if (step === 'tier1_applied') {
        setStep(includeAi ? 'ai_assessment' : 'commit');
      } else if (step === 'ai_assessment') {
        setStep('ai_proposals');
      } else {
        setStep('commit');
      }
    }, APPLY_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(t);
    };
  }, [step, includeAi]);

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
          : 'Quality';

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
            {experience === 'develop' ? 'Back to Quality' : 'Back to Git Repositories'}
          </Button>
        </Content>
      </Page>
    );
  }

  const displayRepo = `${repo.org}/${repo.name}`;
  const t1Accepted = groupByNode(quickFix).filter(n => t1Decisions[n.id] === 'accept').length;
  const aiAccepted = groupByNode(aiFix).filter(n => aiDecisions[n.id] === 'accept').length;
  const aiDeclined = groupByNode(aiFix).filter(n => aiDecisions[n.id] === 'decline').length;
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
      return (
        <AssessPanel
          findings={quality.violations}
          quickFixCount={quickFix.length}
          onNext={() => setStep('tier1_proposals')}
          onCancel={goBack}
        />
      );
    }

    if (step === 'tier1_proposals') {
      return (
        <GatePanel
          findings={quickFix}
          isAi={false}
          decisions={t1Decisions}
          setDecisions={setT1Decisions}
          onNext={() => setStep('tier1_applied')}
          onCancel={goBack}
        />
      );
    }

    if (step === 'tier1_applied' || step === 'ai_assessment' || step === 'ai_applied') {
      const heading =
        step === 'tier1_applied'
          ? 'Applying approved fixes...'
          : step === 'ai_assessment'
            ? 'Checking...'
            : 'Applying approved fixes...';
      const logs =
        step === 'ai_assessment'
          ? [
              { phase: 'ai', text: 'Running AI assessment…' },
              { phase: 'ai', text: 'Scoring remaining findings…' },
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
      return (
        <GatePanel
          findings={aiFix}
          isAi
          decisions={aiDecisions}
          setDecisions={setAiDecisions}
          onNext={() => setStep('ai_applied')}
          onCancel={goBack}
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
              <Typography className={classes.hint} style={{ marginBottom: 0 }}>
                Create a branch, push the fixes, and optionally open a pull request.
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="flex-end" style={{ gap: 8 }}>
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
                  ? 'Continue to the complete step.'
                  : 'Continue without pushing. Use Commit below to push or open a PR first.'}
              </Typography>
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
              {committing ? 'Pushing…' : createPr ? 'Commit & open PR' : 'Commit & push'}
            </Button>
          </Box>
        </Paper>
      );
    }

    return (
      <OperationResultCard
        violations={quality.totalViolations}
        remediated={remediated}
        manual={manual.length}
        aiProposed={aiFix.length}
        aiAccepted={aiAccepted}
        aiDeclined={aiDeclined}
        prUrl={prUrl}
        createPr={createPr && pushed}
        onDone={goBack}
      />
    );
  })();

  return (
    <Page themeId="app">
      <Content>
        <Box className={classes.wrap}>
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
          <Box className={classes.titleRow}>
            <Typography className={classes.title}>Remediation</Typography>
            <Typography className={classes.repo}>{displayRepo}</Typography>
          </Box>
          <Typography className={classes.meta}>
            {quality.latestScan.scanId} · commit {quality.lastScannedCommit} · {quality.lastScannedAt}
          </Typography>
          <WorkflowStepper steps={steps} current={step} spinning={spinning} />
          {body}
        </Box>
      </Content>
    </Page>
  );
};
