import { useCallback, useEffect, useMemo, useState } from 'react';
import { Content, Page, Table, TableColumn } from '@backstage/core-components';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Link,
  LinearProgress,
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
import {
  SEVERITY_COLORS,
  getProjectQuality,
  type QualityViolation,
  type SeverityClass,
} from '../detail/qualityDemoData';

/**
 * Brad SPA Scan → Complete workflow, MUI under RHDH theme.
 * Exploration only — Content quality (develop-apme) ephemeral session.
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

type Decision = 'pending' | 'accepted' | 'declined';

type StepDef = { id: StepId; label: string };

const SCAN_LOG = [
  'Queued…',
  'Cloning repository…',
  'Resolving collections and Python dependencies…',
  'Running validators…',
  'Aggregating findings…',
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
  kpis: {
    display: 'flex',
    gap: theme.spacing(3),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  },
  kpi: {
    minWidth: 88,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  kpiLabel: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  log: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1.5),
    minHeight: 88,
  },
  logLine: {
    marginBottom: 4,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(2),
    flexWrap: 'wrap',
  },
  pill: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
  nextSummary: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    width: '100%',
  },
  applying: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(6, 2),
    gap: theme.spacing(1.5),
  },
  formRow: {
    maxWidth: 480,
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

function findingKey(v: QualityViolation): string {
  return `${v.ruleId}:${v.file}:${v.lineStart}`;
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
                  color: isPending ? undefined : undefined,
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

function FindingsTable({
  rows,
  decisions,
  onDecide,
}: {
  rows: QualityViolation[];
  decisions?: Map<string, Decision>;
  onDecide?: (key: string, d: Decision) => void;
}) {
  const columns: TableColumn<QualityViolation>[] = [
    {
      title: 'Severity',
      render: (row: QualityViolation) => (
        <Chip
          size="small"
          label={row.severity}
          style={{
            height: 20,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'capitalize',
            backgroundColor: `${SEVERITY_COLORS[row.severity as SeverityClass]}22`,
            color: SEVERITY_COLORS[row.severity as SeverityClass],
          }}
        />
      ),
    },
    { title: 'Rule', field: 'message' },
    {
      title: 'File',
      render: (row: QualityViolation) => (
        <Typography style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {row.file}:{row.lineStart}
        </Typography>
      ),
    },
    {
      title: 'Fix type',
      render: (row: QualityViolation) => {
        const label =
          row.fixTier === 'deterministic'
            ? 'Quick-fix'
            : row.fixTier === 'ai'
              ? 'AI'
              : 'Manual';
        return <Chip size="small" label={label} style={{ height: 20, fontSize: 11 }} />;
      },
    },
  ];
  if (decisions) {
    columns.push({
      title: 'Decision',
      render: (row: QualityViolation) => {
        const k = findingKey(row);
        const d = decisions.get(k) ?? 'pending';
        if (d === 'pending' && onDecide) {
          return (
            <Box display="flex" style={{ gap: 8 }}>
              <Button
                size="small"
                color="primary"
                variant="contained"
                style={{ textTransform: 'none', borderRadius: 20 }}
                onClick={() => onDecide(k, 'accepted')}
              >
                Accept
              </Button>
              <Button
                size="small"
                style={{ textTransform: 'none', borderRadius: 20 }}
                onClick={() => onDecide(k, 'declined')}
              >
                Decline
              </Button>
            </Box>
          );
        }
        const label =
          d === 'accepted' ? 'Accepted' : d === 'declined' ? 'Declined' : 'Undecided';
        return <Chip size="small" label={label} style={{ height: 20, fontSize: 11 }} />;
      },
    });
  }

  return (
    <Table<QualityViolation>
      columns={columns}
      data={rows}
      title=""
      options={{
        paging: rows.length > 12,
        pageSize: 12,
        search: false,
        padding: 'dense',
        emptyRowsWhenPaging: false,
      }}
    />
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
  const [decisions, setDecisions] = useState<Map<string, Decision>>(new Map());
  const [createPr, setCreatePr] = useState(true);
  const [branchName, setBranchName] = useState(
    `apme/remediate-${(quality?.latestScan.scanId ?? 'fix').slice(0, 12)}`,
  );
  const [committing, setCommitting] = useState(false);
  const [prUrl, setPrUrl] = useState(
    quality?.remediationPrUrl ??
      `https://github.com/${repo?.org ?? 'acme-corp'}/${repoName}/pull/42`,
  );

  useEffect(() => {
    // Drawer still remediates in the repo Quality tab. Tabs uses the same
    // ephemeral session as Content quality (Resume from Remediations / Scans).
    if (experience === 'develop-drawer') {
      navigate(
        `/self-service/repositories/${encodeURIComponent(repoName)}?tab=quality`,
        { replace: true },
      );
    }
  }, [experience, navigate, repoName]);

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
        if (i >= SCAN_LOG.length - 1) {
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
    if (
      step !== 'tier1_applied' &&
      step !== 'ai_assessment' &&
      step !== 'ai_applied'
    ) {
      return;
    }
    const t = window.setTimeout(() => {
      if (step === 'tier1_applied') {
        setStep(includeAi ? 'ai_assessment' : 'commit');
      } else if (step === 'ai_assessment') {
        setStep('ai_proposals');
      } else {
        setStep('commit');
      }
    }, APPLY_MS);
    return () => window.clearTimeout(t);
  }, [step, includeAi]);

  const goBack = useCallback(() => {
    if (fromRepo) {
      navigate(
        `/self-service/repositories/${encodeURIComponent(repoName)}`,
      );
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
  }, [
    experience,
    fromRepo,
    fromList,
    fromScans,
    fromRemediations,
    navigate,
    repoName,
  ]);

  const backLabel = fromRepo
    ? repo?.name ?? 'Repository'
    : fromList
      ? 'Git Repositories'
      : fromScans
        ? 'Scans'
        : fromRemediations
          ? 'Remediations'
          : experience === 'develop-apme'
            ? 'Content quality'
            : 'Git Repositories';

  const setDecision = (key: string, d: Decision) => {
    setDecisions(prev => {
      const next = new Map(prev);
      next.set(key, d);
      return next;
    });
  };

  const pendingCount = (rows: QualityViolation[]) =>
    rows.filter(v => (decisions.get(findingKey(v)) ?? 'pending') === 'pending')
      .length;

  const acceptRemaining = (rows: QualityViolation[]) => {
    setDecisions(prev => {
      const next = new Map(prev);
      rows.forEach(v => {
        const k = findingKey(v);
        if ((next.get(k) ?? 'pending') === 'pending') next.set(k, 'accepted');
      });
      return next;
    });
  };

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
            {experience === 'develop-apme'
              ? 'Back to Content quality'
              : 'Back to Git Repositories'}
          </Button>
        </Content>
      </Page>
    );
  }

  const displayRepo = `${repo.org}/${repo.name}`;

  const renderProposalActions = (rows: QualityViolation[], onNext: () => void, nextSummary: string) => {
    const pending = pendingCount(rows);
    return (
      <Box className={classes.actions}>
        <Button
          className={classes.pill}
          color="primary"
          onClick={() => acceptRemaining(rows)}
          disabled={pending === 0}
        >
          Accept remaining
        </Button>
        <Button
          className={classes.pill}
          color="primary"
          variant="contained"
          onClick={onNext}
          disabled={pending > 0}
        >
          Next
        </Button>
        <Button className={classes.pill} onClick={goBack}>
          Cancel
        </Button>
        <Typography className={classes.nextSummary}>
          {pending > 0
            ? `Accept or decline ${pending} remaining proposal${pending !== 1 ? 's' : ''} to continue.`
            : nextSummary}
        </Typography>
      </Box>
    );
  };

  const body = (() => {
    if (step === 'scan') {
      return (
        <Paper variant="outlined" className={classes.panel}>
          <Typography className={classes.panelTitle}>Scan</Typography>
          <Typography className={classes.hint}>
            Checking Ansible content in this repository. Same session continues
            to findings — no second clone.
          </Typography>
          <LinearProgress />
          <Box className={classes.log}>
            {SCAN_LOG.slice(0, logIndex + 1).map(line => (
              <div key={line} className={classes.logLine}>
                {line}
              </div>
            ))}
          </Box>
          <Box className={classes.actions}>
            <Button className={classes.pill} onClick={goBack}>
              Cancel
            </Button>
          </Box>
        </Paper>
      );
    }

    if (step === 'findings') {
      return (
        <Paper variant="outlined" className={classes.panel}>
          <Typography className={classes.panelTitle}>Review findings</Typography>
          <Typography className={classes.hint}>
            Latest scan results. Remediate continues this session — no rescan.
          </Typography>
          <Box className={classes.kpis}>
            <Box className={classes.kpi}>
              <Typography className={classes.kpiValue}>{quality.totalViolations}</Typography>
              <Typography className={classes.kpiLabel}>Findings</Typography>
            </Box>
            <Box className={classes.kpi}>
              <Typography className={classes.kpiValue}>{quickFix.length}</Typography>
              <Typography className={classes.kpiLabel}>Quick-fix</Typography>
            </Box>
            <Box className={classes.kpi}>
              <Typography className={classes.kpiValue}>{aiFix.length}</Typography>
              <Typography className={classes.kpiLabel}>AI eligible</Typography>
            </Box>
            <Box className={classes.kpi}>
              <Typography className={classes.kpiValue}>{manual.length}</Typography>
              <Typography className={classes.kpiLabel}>Manual</Typography>
            </Box>
          </Box>
          <FindingsTable rows={quality.violations} />
          <Box className={classes.actions}>
            <Button
              className={classes.pill}
              color="primary"
              variant="contained"
              onClick={() => setStep('tier1_proposals')}
            >
              Next
            </Button>
            <Button className={classes.pill} onClick={goBack}>
              Cancel
            </Button>
            <Typography className={classes.nextSummary}>
              {quickFix.length > 0
                ? `Move on to remediation — review quick-fix proposals for ${quickFix.length} finding${quickFix.length !== 1 ? 's' : ''} (same session, no rescan).`
                : 'Move on to remediation — continue this session to review any available fixes (no rescan).'}
            </Typography>
          </Box>
        </Paper>
      );
    }

    if (step === 'tier1_proposals') {
      return (
        <Paper variant="outlined" className={classes.panel}>
          <Typography className={classes.panelTitle}>Quick-fix proposals</Typography>
          <Typography className={classes.hint}>
            Deterministic transforms (Gate 1). Accept or decline each proposal.
          </Typography>
          <FindingsTable rows={quickFix} decisions={decisions} onDecide={setDecision} />
          {renderProposalActions(
            quickFix,
            () => setStep('tier1_applied'),
            'Apply accepted quick-fixes, then continue.',
          )}
        </Paper>
      );
    }

    if (step === 'tier1_applied' || step === 'ai_assessment' || step === 'ai_applied') {
      const label =
        step === 'tier1_applied'
          ? 'Applying quick-fixes…'
          : step === 'ai_assessment'
            ? 'Running AI assessment…'
            : 'Applying AI proposals…';
      return (
        <Paper variant="outlined" className={classes.panel}>
          <Box className={classes.applying}>
            <CircularProgress />
            <Typography className={classes.panelTitle}>{label}</Typography>
            <Typography className={classes.hint} style={{ marginBottom: 0, textAlign: 'center' }}>
              Live operation — this step is attached to the same session.
            </Typography>
          </Box>
        </Paper>
      );
    }

    if (step === 'ai_proposals') {
      return (
        <Paper variant="outlined" className={classes.panel}>
          <Typography className={classes.panelTitle}>AI proposals</Typography>
          <Typography className={classes.hint}>
            AI-assisted fixes (Gate 2). Review before they are applied.
          </Typography>
          <FindingsTable rows={aiFix} decisions={decisions} onDecide={setDecision} />
          {renderProposalActions(
            aiFix,
            () => setStep('ai_applied'),
            'Apply accepted AI proposals, then commit.',
          )}
        </Paper>
      );
    }

    if (step === 'commit') {
      const accepted = [...decisions.values()].filter(d => d === 'accepted').length;
      return (
        <Paper variant="outlined" className={classes.panel}>
          <Typography className={classes.panelTitle}>
            Commit {accepted || quality.latestScan.fixable} remediated change
            {(accepted || quality.latestScan.fixable) !== 1 ? 's' : ''}
          </Typography>
          <Typography className={classes.hint}>
            Push a branch and optionally open a pull request. Merge stays in git.
          </Typography>
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
          <Box className={classes.actions}>
            <Button
              className={classes.pill}
              color="primary"
              variant="contained"
              disabled={committing}
              onClick={() => {
                setCommitting(true);
                window.setTimeout(() => {
                  setCommitting(false);
                  setPrUrl(
                    `https://github.com/${repo.org}/${repo.name}/pull/42`,
                  );
                  setStep('complete');
                }, 1400);
              }}
            >
              {committing ? 'Pushing…' : createPr ? 'Commit and open pull request' : 'Commit'}
            </Button>
            <Button className={classes.pill} onClick={goBack} disabled={committing}>
              Cancel
            </Button>
          </Box>
        </Paper>
      );
    }

    return (
      <Paper variant="outlined" className={classes.panel}>
        <Typography className={classes.panelTitle}>Complete</Typography>
        <Typography className={classes.hint}>
          Remediation session finished. Merge the pull request in git — Portal
          does not mark merged.
        </Typography>
        <Box className={classes.actions}>
          {createPr && (
            <Button
              className={classes.pill}
              color="primary"
              variant="contained"
              onClick={() => window.open(prUrl, '_blank', 'noopener,noreferrer')}
            >
              View pull request
            </Button>
          )}
          <Button className={classes.pill} color="primary" onClick={goBack}>
            {`Back to ${backLabel}`}
          </Button>
        </Box>
      </Paper>
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
            {quality.latestScan.scanId} · commit {quality.lastScannedCommit} ·{' '}
            {quality.lastScannedAt}
          </Typography>
          <WorkflowStepper steps={steps} current={step} spinning={spinning} />
          {body}
        </Box>
      </Content>
    </Page>
  );
};
