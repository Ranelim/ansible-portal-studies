import { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Typography,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { Table, TableColumn } from '@backstage/core-components';
import { useNavigate } from 'react-router-dom';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import {
  getProjectQuality,
  type RemediationStatus,
} from '../detail/qualityDemoData';
import { CommitSha } from './CommitSha';

type ActiveStatus = 'in-progress' | 'proposals-ready';

type ActiveRow = {
  repoName: string;
  org: string;
  status: ActiveStatus;
  stepLabel: string;
  addressed: number;
  remaining: number;
  total: number;
  when: string;
  commitHash: string;
};

const STEP_LABEL: Record<ActiveStatus, string> = {
  'in-progress': 'Review findings',
  'proposals-ready': 'Quick-fix proposals',
};

const useStyles = makeStyles(theme => ({
  cta: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    flexShrink: 0,
  },
  repoLink: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
  progressCell: {
    minWidth: 180,
  },
  progressMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.08)',
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
  select: {
    minWidth: '100%',
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
}));

function isActive(status: RemediationStatus): status is ActiveStatus {
  return status === 'in-progress' || status === 'proposals-ready';
}

export function countLiveRemediations(): number {
  return GIT_REPOSITORIES.filter(repo => {
    const q = getProjectQuality(repo.name);
    return Boolean(q && isActive(q.remediationStatus));
  }).length;
}

function buildRows(): ActiveRow[] {
  const rows: ActiveRow[] = [];
  for (const repo of GIT_REPOSITORIES) {
    const q = getProjectQuality(repo.name);
    if (!q || !isActive(q.remediationStatus)) continue;
    const addressed = q.remediationSummary?.addressed ?? 0;
    const remaining =
      q.remediationSummary?.remaining ?? q.totalViolations;
    rows.push({
      repoName: repo.name,
      org: repo.org,
      status: q.remediationStatus,
      stepLabel: STEP_LABEL[q.remediationStatus],
      addressed,
      remaining,
      total: addressed + remaining,
      when: q.lastScannedAt,
      commitHash: q.latestScan.commitHash || q.lastScannedCommit,
    });
  }
  return rows.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'in-progress' ? -1 : 1;
    }
    return a.repoName.localeCompare(b.repoName);
  });
}

function scannableRepos() {
  return GIT_REPOSITORIES.filter(repo => getProjectQuality(repo.name)).sort(
    (a, b) => a.name.localeCompare(b.name),
  );
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
  const [repoName, setRepoName] = useState('');

  useEffect(() => {
    if (open) setRepoName('');
  }, [open]);

  const selected = getProjectQuality(repoName);
  const replacesLive = selected ? isActive(selected.remediationStatus) : false;

  const start = () => {
    if (!repoName) return;
    navigate(sessionPath(repoName, false));
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
        <FormControl variant="outlined" size="small" className={classes.select}>
          <InputLabel id="start-scan-repo-label">Repository</InputLabel>
          <Select
            labelId="start-scan-repo-label"
            label="Repository"
            value={repoName}
            onChange={e => setRepoName(e.target.value as string)}
          >
            {repos.map(repo => (
              <MenuItem key={repo.name} value={repo.name}>
                {repo.org}/{repo.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
          disabled={!repoName}
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

  const columns: TableColumn<ActiveRow>[] = [
    {
      title: 'Repository',
      render: row => (
        <Typography
          className={classes.repoLink}
          onClick={e => {
            e.stopPropagation();
            openRepo(row.repoName);
          }}
        >
          {row.org}/{row.repoName}
        </Typography>
      ),
    },
    {
      title: 'Current step',
      render: row => (
        <Chip
          size="small"
          label={row.stepLabel}
          style={{
            height: 22,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor:
              row.status === 'in-progress'
                ? 'rgba(0, 102, 204, 0.12)'
                : 'rgba(103, 83, 172, 0.14)',
            color: row.status === 'in-progress' ? '#0066CC' : '#5B3F9E',
          }}
        />
      ),
    },
    {
      title: 'Progress',
      render: row => {
        const pct =
          row.total > 0 ? Math.round((row.addressed / row.total) * 100) : 0;
        return (
          <Box className={classes.progressCell}>
            <Typography className={classes.progressMeta}>
              {row.addressed} of {row.total} findings addressed
            </Typography>
            <LinearProgress
              variant="determinate"
              value={pct}
              className={classes.progressBar}
            />
          </Box>
        );
      },
    },
    {
      title: 'When',
      render: row => (
        <Box>
          <Typography style={{ fontSize: 13 }}>
            {row.when}
          </Typography>
          <CommitSha sha={row.commitHash} />
        </Box>
      ),
    },
    {
      title: 'Action',
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
          Resume
        </Button>
      ),
    },
  ];

  return (
    <Box>
      {rows.length === 0 ? (
        <Box className={classes.empty}>
          <Typography className={classes.emptyTitle}>
            No remediations in progress
          </Typography>
          <Typography className={classes.emptyBody}>
            Start a scan on a git repository to review findings and remediate.
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
        <Table<ActiveRow>
          columns={columns}
          data={rows}
          title=""
          options={{
            paging: false,
            search: false,
            sorting: false,
            padding: 'dense',
            header: true,
            rowStyle: { cursor: 'pointer' },
          }}
          onRowClick={(_e, rowData) => {
            if (rowData) resume((rowData as ActiveRow).repoName);
          }}
        />
      )}
      {!onStartScan && (
        <StartScanDialog open={scanOpen} onClose={() => setScanOpen(false)} />
      )}
    </Box>
  );
};
