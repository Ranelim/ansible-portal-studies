import { useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { Table, TableColumn } from '@backstage/core-components';
import { useNavigate } from 'react-router-dom';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import {
  getProjectQuality,
  type RemediationStatus,
  type ScanRemediationOutcome,
} from '../detail/qualityDemoData';

type RunStatus =
  | 'in-progress'
  | 'proposals-ready'
  | 'pr-open'
  | 'completed'
  | 'superseded'
  | 'available';

type RemediationRunRow = {
  id: string;
  repoName: string;
  org: string;
  scanId: string;
  status: RunStatus;
  summary: string;
  when: string;
  prUrl?: string;
};

const STATUS_LABEL: Record<RunStatus, string> = {
  'in-progress': 'In progress',
  'proposals-ready': 'Proposals ready',
  'pr-open': 'Pull request open',
  completed: 'Completed',
  superseded: 'Superseded',
  available: 'Ready to start',
};

const STATUS_ORDER: Record<RunStatus, number> = {
  'in-progress': 0,
  'proposals-ready': 1,
  'pr-open': 2,
  available: 3,
  completed: 4,
  superseded: 5,
};

const useStyles = makeStyles(theme => ({
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
  },
  hint: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    marginTop: 4,
  },
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
}));

function mapProjectStatus(status: RemediationStatus): RunStatus | null {
  if (status === 'in-progress') return 'in-progress';
  if (status === 'proposals-ready') return 'proposals-ready';
  if (status === 'pr-open') return 'pr-open';
  if (status === 'available') return 'available';
  if (status === 'pr-merged') return 'completed';
  return null;
}

function mapScanOutcome(outcome?: ScanRemediationOutcome): RunStatus | null {
  if (!outcome || outcome === 'none') return null;
  if (outcome === 'in-progress') return 'in-progress';
  if (outcome === 'suggestions-ready') return 'proposals-ready';
  if (outcome === 'pr-open') return 'pr-open';
  if (outcome === 'pr-merged') return 'completed';
  return null;
}

function buildRows(): RemediationRunRow[] {
  const rows: RemediationRunRow[] = [];

  for (const repo of GIT_REPOSITORIES) {
    const q = getProjectQuality(repo.name);
    if (!q) continue;

    const latestId = q.latestScan.scanId;
    const projectStatus = mapProjectStatus(q.remediationStatus);

    // Active / ready run on latest scan from project remediation state
    if (projectStatus && projectStatus !== 'completed') {
      const summaryParts: string[] = [];
      if (q.remediationSummary) {
        summaryParts.push(
          `${q.remediationSummary.addressed} addressed · ${q.remediationSummary.remaining} remaining`,
        );
      } else {
        summaryParts.push(`${q.totalViolations} findings on latest scan`);
      }
      rows.push({
        id: `${repo.name}-active`,
        repoName: repo.name,
        org: repo.org,
        scanId: latestId,
        status: projectStatus,
        summary: summaryParts.join(' · '),
        when: q.lastScannedAt,
        prUrl: q.remediationPrUrl,
      });
    }

    // Historical scan remediations — older than latest = superseded if they had a run
    const history = q.scanHistory.length > 0 ? q.scanHistory : [q.latestScan];
    history.forEach((scan, index) => {
      const fromOutcome = mapScanOutcome(scan.remediationOutcome);
      if (!fromOutcome) return;

      const isLatest = scan.scanId === latestId;
      let status: RunStatus = fromOutcome;
      if (!isLatest && fromOutcome !== 'completed') {
        status = 'superseded';
      }
      // Skip duplicate of active row for latest
      if (
        isLatest &&
        projectStatus &&
        projectStatus !== 'completed' &&
        fromOutcome === projectStatus
      ) {
        return;
      }
      // Prefer listing completed / superseded history; skip if already covered as active
      if (isLatest && projectStatus === fromOutcome) return;

      rows.push({
        id: `${repo.name}-${scan.scanId}`,
        repoName: repo.name,
        org: repo.org,
        scanId: scan.scanId,
        status:
          !isLatest && fromOutcome === 'completed'
            ? 'completed'
            : !isLatest && index > 0
              ? status === 'completed'
                ? 'completed'
                : 'superseded'
              : status,
        summary:
          fromOutcome === 'completed'
            ? `${scan.remediatedCount ?? 0} changes · scan ${scan.scanId}`
            : `Scan ${scan.scanId} · ${scan.totalViolations} findings`,
        when: scan.createdAt,
        prUrl: scan.prUrl,
      });
    });
  }

  return rows.sort((a, b) => {
    const order = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (order !== 0) return order;
    return a.repoName.localeCompare(b.repoName);
  });
}

function statusChipColor(
  status: RunStatus,
): { bg: string; fg: string } {
  switch (status) {
    case 'in-progress':
      return { bg: 'rgba(0, 102, 204, 0.12)', fg: '#0066CC' };
    case 'proposals-ready':
      return { bg: 'rgba(103, 83, 172, 0.14)', fg: '#5B3F9E' };
    case 'pr-open':
      return { bg: 'rgba(46, 132, 64, 0.14)', fg: '#2E8440' };
    case 'available':
      return { bg: 'rgba(240, 171, 0, 0.16)', fg: '#8A6A00' };
    case 'superseded':
      return { bg: 'rgba(0,0,0,0.06)', fg: '#6A6E73' };
    case 'completed':
    default:
      return { bg: 'rgba(0,0,0,0.06)', fg: '#6A6E73' };
  }
}

/**
 * Cross-repo remediation run board — active, completed, and superseded.
 */
export const RemediationsContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const rows = useMemo(() => buildRows(), []);

  const onNewScan = () => {
    window.alert(
      'Prototype: New scan would open a full-screen flow (pick repos → run check / remediate).',
    );
  };

  const openRepoQuality = useCallback(
    (repoName: string) => {
      navigate(`/self-service/repositories/${repoName}?tab=quality`);
    },
    [navigate],
  );

  const columns: TableColumn<RemediationRunRow>[] = [
    {
      title: 'Repository',
      render: (row: RemediationRunRow) => (
        <Typography
          className={classes.repoLink}
          onClick={e => {
            e.stopPropagation();
            openRepoQuality(row.repoName);
          }}
        >
          {row.org}/{row.repoName}
        </Typography>
      ),
    },
    {
      title: 'Status',
      render: (row: RemediationRunRow) => {
        const c = statusChipColor(row.status);
        return (
          <Chip
            size="small"
            label={STATUS_LABEL[row.status]}
            style={{
              height: 22,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: c.bg,
              color: c.fg,
            }}
          />
        );
      },
    },
    {
      title: 'Summary',
      field: 'summary',
      render: (row: RemediationRunRow) => (
        <Typography style={{ fontSize: 13 }}>{row.summary}</Typography>
      ),
    },
    {
      title: 'When',
      field: 'when',
      render: (row: RemediationRunRow) => (
        <Typography style={{ fontSize: 12, color: '#6A6E73' }}>
          {row.when}
        </Typography>
      ),
    },
    {
      title: 'Action',
      render: (row: RemediationRunRow) => {
        if (row.status === 'superseded') {
          return (
            <Typography style={{ fontSize: 12, color: '#6A6E73' }}>
              Newer scan available
            </Typography>
          );
        }
        if (row.prUrl) {
          return (
            <Button
              size="small"
              color="primary"
              style={{ textTransform: 'none', borderRadius: 20 }}
              onClick={e => {
                e.stopPropagation();
                window.open(row.prUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              View pull request
            </Button>
          );
        }
        if (
          row.status === 'in-progress' ||
          row.status === 'proposals-ready' ||
          row.status === 'available'
        ) {
          return (
            <Button
              size="small"
              color="primary"
              variant="outlined"
              style={{ textTransform: 'none', borderRadius: 20 }}
              onClick={e => {
                e.stopPropagation();
                openRepoQuality(row.repoName);
              }}
            >
              {row.status === 'available' ? 'Start remediation' : 'Resume'}
            </Button>
          );
        }
        return (
          <Button
            size="small"
            color="primary"
            style={{ textTransform: 'none', borderRadius: 20 }}
            onClick={e => {
              e.stopPropagation();
              openRepoQuality(row.repoName);
            }}
          >
            Open Quality
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <Box className={classes.header}>
        <Box>
          <Typography className={classes.title} component="h2">
            Remediations
          </Typography>
          <Typography className={classes.hint}>
            Active and recent remediation runs across repositories. Superseded
            means a newer scan replaced this session — start from the latest
            instead.
          </Typography>
        </Box>
        <Button
          className={classes.cta}
          color="primary"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewScan}
        >
          New scan
        </Button>
      </Box>
      <Table<RemediationRunRow>
        columns={columns}
        data={rows}
        title=""
        options={{
          paging: rows.length > 15,
          pageSize: 15,
          pageSizeOptions: [10, 15, 25],
          emptyRowsWhenPaging: false,
          search: true,
          sorting: true,
          padding: 'dense',
          header: true,
        }}
        onRowClick={(_e, rowData) => {
          if (rowData) openRepoQuality((rowData as RemediationRunRow).repoName);
        }}
      />
    </Box>
  );
};
