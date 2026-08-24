import { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { Table, TableColumn } from '@backstage/core-components';
import { useNavigate } from 'react-router-dom';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import { statusColors } from '../../common/statusColors';
import { HEALTH_SCORE_HINT, HealthScorePopover } from '../catalog/HealthScorePopover';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import {
  getProjectQuality,
  type RemediationStatus,
} from '../detail/qualityDemoData';
import { CommitSha } from './CommitSha';
import { SHOW_REMEDIATION_PROGRESS_COLUMN } from './contentQualityIa';
import { scanSnapshotPath } from './qualitySurfacePaths';
import { QualityTabIntro } from './QualityTabIntro';

type ActiveStatus = 'in-progress' | 'proposals-ready';

type ActiveRow = {
  repoName: string;
  org: string;
  status: ActiveStatus;
  currentStep: 0 | 1 | 2;
  scanId: string;
  when: string;
  commitHash: string;
  sortAt: number;
};

/** Same 3 steps as the inline visual session. Compact on the list; labeled in the session. */
const SESSION_STEPS: { label: string; meaning: string }[] = [
  { label: 'Scan', meaning: 'Scan this repository' },
  {
    label: 'Results & Remediation',
    meaning: 'Review findings and accept or decline fixes',
  },
  { label: 'Commit', meaning: 'Push accepted fixes or open a pull request' },
];

function sessionStepIndex(_status: ActiveStatus): 0 | 1 | 2 {
  // Live remediations sit on Results & Remediation. Scan already ran.
  return 1;
}

const useStyles = makeStyles(theme => ({
  cta: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    flexShrink: 0,
  },
  scanLink: {
    display: 'inline',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    '&:hover': { textDecoration: 'underline' },
  },
  repoLink: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  helpIcon: {
    fontSize: 14,
    color: theme.palette.text.disabled,
    cursor: 'help',
  },
  empty: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(6, 3),
    textAlign: 'center',
    backgroundColor: theme.palette.background.paper,
  },
  emptyTitle: {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: theme.spacing(1),
  },
  emptyBody: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    maxWidth: 420,
    margin: '0 auto',
    marginBottom: theme.spacing(2),
  },
  tableHost: {
    '& table': {
      width: '100%',
    },
    '& thead th:last-child, & tbody td:last-child': {
      width: '1% !important',
      whiteSpace: 'nowrap',
    },
  },
  dialogTitleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
  },
  dialogSubtitle: {
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 400,
  },
  dialogWarn: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1.5),
  },
  option: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  optionMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  dialogActions: {
    padding: theme.spacing(1.5, 3, 2),
    alignItems: 'center',
  },
  dialogBtn: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    minHeight: 36,
  },
  compactStepper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0,
  },
  compactConnector: {
    width: 8,
    height: 2,
    margin: '0 2px',
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.22)'
        : 'rgba(0,0,0,0.18)',
    flexShrink: 0,
  },
  compactBadge: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1,
    boxSizing: 'border-box',
    cursor: 'default',
  },
}));

function CompactSessionStepper({ currentStep }: { currentStep: 0 | 1 | 2 }) {
  const classes = useStyles();
  const summary = `On ${SESSION_STEPS[currentStep].label}. ${SESSION_STEPS.map(
    (step, index) => {
      const state =
        index < currentStep
          ? 'complete'
          : index === currentStep
            ? 'current'
            : 'not started';
      return `${step.label} ${state}`;
    },
  ).join('. ')}.`;

  return (
    <Box className={classes.compactStepper} role="img" aria-label={summary}>
      {SESSION_STEPS.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const state = isComplete
          ? 'Complete'
          : isCurrent
            ? 'Current'
            : 'Not started';
        const tooltip = `${step.label} — ${step.meaning}. ${state}.`;
        let backgroundColor = 'transparent';
        let color = statusColors.pending;
        let border = `2px solid ${statusColors.pending}`;
        if (isComplete) {
          backgroundColor = statusColors.success;
          color = '#fff';
          border = `2px solid ${statusColors.success}`;
        } else if (isCurrent) {
          backgroundColor = statusColors.info;
          color = '#fff';
          border = `2px solid ${statusColors.info}`;
        }

        return (
          <Box key={step.label} display="inline-flex" alignItems="center">
            {index > 0 && (
              <span className={classes.compactConnector} aria-hidden />
            )}
            <Tooltip title={tooltip} arrow>
              <span
                className={classes.compactBadge}
                style={{ backgroundColor, color, border }}
              >
                {isComplete ? (
                  <CheckIcon style={{ fontSize: 12 }} />
                ) : (
                  index + 1
                )}
              </span>
            </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
}

function isActive(status: RemediationStatus): status is ActiveStatus {
  return status === 'in-progress' || status === 'proposals-ready';
}

export function countLiveRemediations(): number {
  return GIT_REPOSITORIES.filter(repo => {
    const q = getProjectQuality(repo.name);
    return Boolean(q && isActive(q.remediationStatus));
  }).length;
}

function parseScanDate(createdAt: string): number {
  const t = Date.parse(createdAt);
  return Number.isNaN(t) ? 0 : t;
}

function formatRelativeWhen(createdAt: string): string {
  const t = parseScanDate(createdAt);
  if (!t) return createdAt;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return createdAt;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return createdAt;
}

function buildRows(): ActiveRow[] {
  const rows: ActiveRow[] = [];
  for (const repo of GIT_REPOSITORIES) {
    const q = getProjectQuality(repo.name);
    if (!q || !isActive(q.remediationStatus)) continue;
    const scan = q.latestScan;
    rows.push({
      repoName: repo.name,
      org: repo.org,
      status: q.remediationStatus,
      currentStep: sessionStepIndex(q.remediationStatus),
      scanId: scan.scanId,
      when: scan.createdAt,
      commitHash: scan.commitHash || q.lastScannedCommit,
      sortAt: parseScanDate(scan.createdAt),
    });
  }
  return rows.sort((a, b) => b.sortAt - a.sortAt);
}

type ScanRepoOption = {
  name: string;
  org: string;
  label: string;
  lastScannedAt?: string;
  live: boolean;
};

function scannableRepos(): ScanRepoOption[] {
  return GIT_REPOSITORIES.filter(repo => getProjectQuality(repo.name))
    .map(repo => {
      const quality = getProjectQuality(repo.name)!;
      return {
        name: repo.name,
        org: repo.org,
        label: `${repo.org}/${repo.name}`,
        lastScannedAt: quality.lastScannedAt,
        live: isActive(quality.remediationStatus),
      };
    })
    .sort((a, b) => {
      const aNever = a.lastScannedAt ? 1 : 0;
      const bNever = b.lastScannedAt ? 1 : 0;
      if (aNever !== bNever) return aNever - bNever;
      return a.label.localeCompare(b.label);
    });
}

function sessionPath(repoName: string, resume: boolean) {
  const qs = new URLSearchParams({ from: 'remediations' });
  if (resume) qs.set('resume', '1');
  return `/self-service/apme/remediate/${encodeURIComponent(
    repoName,
  )}?${qs.toString()}`;
}

export function StartScanDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const classes = useStyles();
  const navigate = useNavigate();
  const repos = useMemo(() => scannableRepos(), []);
  const [picked, setPicked] = useState<ScanRepoOption | null>(null);

  useEffect(() => {
    if (open) setPicked(null);
  }, [open]);

  const replacesLive = Boolean(picked?.live);

  const start = () => {
    if (!picked) return;
    navigate(sessionPath(picked.name, false));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="start-scan-title"
    >
      <DialogTitle disableTypography>
        <Box className={classes.dialogTitleRow}>
          <Box>
            <Typography
              id="start-scan-title"
              variant="h6"
              style={{ fontWeight: 600, fontSize: 18 }}
            >
              Start scan
            </Typography>
            <Typography className={classes.dialogSubtitle}>
              Choose a git repository. After the scan, you review findings and
              can remediate in the same session.
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Autocomplete
          options={repos}
          value={picked}
          onChange={(_event, value) => setPicked(value)}
          getOptionLabel={option => option.label}
          getOptionSelected={(option, value) => option.name === value.name}
          autoHighlight
          openOnFocus
          clearOnEscape
          noOptionsText="No repositories match"
          renderOption={option => (
            <div className={classes.option}>
              <span>{option.label}</span>
              <span className={classes.optionMeta}>
                {option.lastScannedAt
                  ? `Last scan ${option.lastScannedAt}`
                  : 'Never scanned'}
                {option.live ? ' · Remediation in progress' : ''}
              </span>
            </div>
          )}
          renderInput={params => (
            <TextField
              {...params}
              label="Repository"
              variant="outlined"
              size="small"
              placeholder="Find a repository"
            />
          )}
        />
        {replacesLive && (
          <Typography className={classes.dialogWarn}>
            This repository already has a remediation in progress. Starting a
            scan replaces that session.
          </Typography>
        )}
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Button onClick={onClose} color="primary" className={classes.dialogBtn}>
          Cancel
        </Button>
        <Button
          onClick={start}
          color="primary"
          variant="contained"
          disabled={!picked}
          className={classes.dialogBtn}
        >
          Start scan
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Live remediation sessions only — not scan history, not open PRs.
 * Start scan lives on the Quality page Header; empty state can reuse it.
 */
export const RemediationsContent = ({
  onStartScan,
}: {
  onStartScan?: () => void;
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { experience } = useNavIaModel();
  const [scanOpen, setScanOpen] = useState(false);
  const rows = useMemo(() => buildRows(), []);
  const startScan = () => (onStartScan ? onStartScan() : setScanOpen(true));

  const openRepo = (repoName: string) => {
    navigate(
      `/self-service/repositories/${encodeURIComponent(repoName)}`,
    );
  };

  const resume = (repoName: string) => {
    navigate(sessionPath(repoName, true));
  };

  const viewScan = (row: ActiveRow) => {
    navigate(
      scanSnapshotPath(experience, row.scanId, { repo: row.repoName }),
    );
  };

  const columns: TableColumn<ActiveRow>[] = [
    {
      title: 'Scan',
      width: '33%',
      defaultSort: 'desc',
      customSort: (a: ActiveRow, b: ActiveRow) => a.sortAt - b.sortAt,
      cellStyle: { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const },
      headerStyle: { whiteSpace: 'nowrap' as const },
      render: row => (
        <Box>
          <Tooltip title={formatRelativeWhen(row.when)} arrow>
            <Link
              className={classes.scanLink}
              href={scanSnapshotPath(experience, row.scanId, {
                repo: row.repoName,
              })}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                viewScan(row);
              }}
            >
              {row.when}
            </Link>
          </Tooltip>
          <CommitSha sha={row.commitHash} />
        </Box>
      ),
    },
    {
      title: 'Repository',
      width: '33%',
      cellStyle: { overflow: 'hidden' },
      render: row => (
        <Link
          className={classes.repoLink}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            openRepo(row.repoName);
          }}
        >
          {row.org}/{row.repoName}
        </Link>
      ),
    },
    {
      title: (
        <Box display="flex" alignItems="center" style={{ gap: 4, whiteSpace: 'nowrap' }}>
          Health
          <Tooltip title={HEALTH_SCORE_HINT} arrow>
            <HelpOutlineIcon className={classes.helpIcon} />
          </Tooltip>
        </Box>
      ) as unknown as string,
      width: '33%',
      customSort: (a: ActiveRow, b: ActiveRow) => {
        const sa = getProjectQuality(a.repoName)?.healthScore ?? -1;
        const sb = getProjectQuality(b.repoName)?.healthScore ?? -1;
        return sa - sb;
      },
      render: row => (
        <HealthScorePopover
          repoName={row.repoName}
          quality={getProjectQuality(row.repoName)}
          showFindingsLink
          onViewLastScan={() => viewScan(row)}
          onRemediate={() => resume(row.repoName)}
        />
      ),
    },
    ...(SHOW_REMEDIATION_PROGRESS_COLUMN
      ? [
          {
            title: 'Remediation progress',
            sorting: false,
            render: (row: ActiveRow) => (
              <CompactSessionStepper currentStep={row.currentStep} />
            ),
          } as TableColumn<ActiveRow>,
        ]
      : []),
    {
      title: 'Action',
      width: '1%',
      sorting: false,
      cellStyle: {
        whiteSpace: 'nowrap' as const,
        textAlign: 'left' as const,
        width: 1,
        paddingLeft: 16,
        paddingRight: 16,
      },
      headerStyle: {
        textAlign: 'left' as const,
        whiteSpace: 'nowrap' as const,
        width: 1,
        paddingLeft: 16,
        paddingRight: 16,
      },
      render: row => (
        <Button
          size="small"
          color="primary"
          variant="outlined"
          className={classes.cta}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            resume(row.repoName);
          }}
        >
          Remediate
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <QualityTabIntro>
        Unfinished fix sessions on a repository’s latest scan. Remediate to
        review remaining findings or commit accepted fixes.
      </QualityTabIntro>
      {rows.length === 0 ? (
        <Box className={classes.empty}>
          <Typography className={classes.emptyTitle}>
            No pending remediations
          </Typography>
          <Typography className={classes.emptyBody}>
            Start a scan on a git repository to review findings and open a fix
            session. Finished sessions leave this list.
          </Typography>
          <Button
            className={classes.cta}
            color="primary"
            variant="contained"
            onClick={startScan}
          >
            Start scan
          </Button>
        </Box>
      ) : (
        <Box className={classes.tableHost}>
        <Table<ActiveRow>
          columns={columns}
          data={rows}
          title=""
          options={{
            paging: false,
            search: false,
            sorting: true,
            padding: 'dense',
            header: true,
            rowStyle: { cursor: 'pointer' },
          }}
          onRowClick={(event, rowData) => {
            const el = (event as { target?: EventTarget } | undefined)?.target;
            if (el instanceof Element && el.closest('button, a, [role="button"]')) {
              return;
            }
            if (rowData) resume((rowData as ActiveRow).repoName);
          }}
        />
        </Box>
      )}
      {!onStartScan && (
        <StartScanDialog open={scanOpen} onClose={() => setScanOpen(false)} />
      )}
    </Box>
  );
};
