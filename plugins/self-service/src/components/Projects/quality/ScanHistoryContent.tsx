import { useMemo, useCallback, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { Table, TableColumn } from '@backstage/core-components';
import { useNavigate } from 'react-router-dom';
import {
  SEVERITY_COLORS,
  getProjectQuality,
  type QualityViolation,
  type RemediationStatus,
  type ScanResult,
  type SeverityClass,
} from '../detail/qualityDemoData';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';

type GlobalScanRow = ScanResult & {
  repoName: string;
  org: string;
  isLatest: boolean;
};

const SEV_ORDER: SeverityClass[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

const useStyles = makeStyles(theme => ({
  heading: {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: theme.spacing(0.5),
  },
  hint: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    marginBottom: theme.spacing(2),
    maxWidth: 720,
  },
  repoLink: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.text.primary,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
  },
  actionBtn: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
  findingsCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 120,
  },
  bar: {
    display: 'flex',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: 96,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
  },
  drawerPaper: {
    width: 520,
    maxWidth: '100%',
  },
  drawerInner: {
    padding: theme.spacing(3),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  drawerClose: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
  },
  findingRow: {
    display: 'grid',
    gridTemplateColumns: '88px 1fr',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontSize: 13,
  },
}));

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

function severityTooltip(breakdown: Record<SeverityClass, number>): string {
  const parts = SEV_ORDER.filter(sev => breakdown[sev] > 0).map(
    sev => `${sev.charAt(0).toUpperCase()}${sev.slice(1)} ${breakdown[sev]}`,
  );
  return parts.join(' · ') || 'No findings';
}

function FindingsBar({
  breakdown,
  classes,
}: {
  breakdown: Record<SeverityClass, number>;
  classes: ReturnType<typeof useStyles>;
}) {
  const total = SEV_ORDER.reduce((sum, sev) => sum + breakdown[sev], 0);
  if (total === 0) return null;
  return (
    <Box className={classes.bar} aria-hidden>
      {SEV_ORDER.map(sev => {
        const count = breakdown[sev];
        if (count === 0) return null;
        return (
          <Box
            key={sev}
            style={{
              width: `${(count / total) * 100}%`,
              backgroundColor: SEVERITY_COLORS[sev],
            }}
          />
        );
      })}
    </Box>
  );
}

function ScanSnapshotDrawer({
  row,
  onClose,
  onOpenRepo,
  action,
}: {
  row: GlobalScanRow | null;
  onClose: () => void;
  onOpenRepo: (name: string) => void;
  action: ReactNode;
}) {
  const classes = useStyles();
  const quality = row ? getProjectQuality(row.repoName) : undefined;
  const findings: QualityViolation[] =
    row?.isLatest && quality ? quality.violations : [];

  return (
    <Drawer
      anchor="right"
      open={Boolean(row)}
      onClose={onClose}
      PaperProps={{ className: classes.drawerPaper }}
    >
      {row && (
        <Box className={classes.drawerInner} style={{ position: 'relative' }}>
          <IconButton
            aria-label="Close"
            className={classes.drawerClose}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" style={{ fontWeight: 600, paddingRight: 36 }}>
            Scan
          </Typography>
          <Typography
            className={classes.repoLink}
            style={{ marginTop: 4, display: 'inline-block' }}
            onClick={() => onOpenRepo(row.repoName)}
          >
            {row.org}/{row.repoName}
          </Typography>
          <Box display="flex" alignItems="center" style={{ gap: 8, marginTop: 8 }}>
            <Typography variant="body2" color="textSecondary">
              {row.createdAt}
            </Typography>
            {row.isLatest && (
              <Chip
                size="small"
                label="Latest"
                style={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: 'rgba(0, 102, 204, 0.12)',
                  color: '#0066CC',
                }}
              />
            )}
          </Box>
          <Box mt={2} mb={2}>
            <Typography style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {row.totalViolations === 0
                ? 'No findings'
                : `${row.totalViolations} finding${
                    row.totalViolations !== 1 ? 's' : ''
                  }`}
            </Typography>
            <Tooltip title={severityTooltip(row.severityBreakdown)} arrow>
              <span>
                <FindingsBar breakdown={row.severityBreakdown} classes={classes} />
              </span>
            </Tooltip>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ fontSize: 12, marginTop: 8 }}
            >
              Commit {row.commitHash}
            </Typography>
          </Box>
          {!row.isLatest && (
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ fontSize: 13, marginBottom: 16 }}
            >
              This scan is read-only. Remediation starts from the latest scan
              for this repository.
            </Typography>
          )}
          <Box style={{ flex: 1, overflow: 'auto' }}>
            {findings.length > 0 ? (
              findings.map(item => (
                <Box
                  key={`${item.ruleId}-${item.file}-${item.lineStart}`}
                  className={classes.findingRow}
                >
                  <Chip
                    size="small"
                    label={item.severity}
                    style={{
                      height: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      backgroundColor: `${SEVERITY_COLORS[item.severity]}22`,
                      color: SEVERITY_COLORS[item.severity],
                    }}
                  />
                  <Box>
                    <Typography style={{ fontSize: 13 }}>{item.message}</Typography>
                    <Typography
                      style={{ fontSize: 12, fontFamily: 'monospace' }}
                      color="textSecondary"
                    >
                      {item.file}:{item.lineStart}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : row.totalViolations > 0 && !row.isLatest ? (
              <Typography variant="body2" color="textSecondary" style={{ fontSize: 13 }}>
                Issue list is available on the latest scan.
              </Typography>
            ) : null}
          </Box>
          <Box mt={2}>{action}</Box>
        </Box>
      )}
    </Drawer>
  );
}

/** Action is the repo’s current cycle — not this historical scan. */
function workActionLabel(
  status: RemediationStatus | undefined,
  latestFindings: number,
): { label: string; disabled: boolean; kind: 'session' | 'pr' | 'none' } {
  if (status === 'pr-open') {
    return { label: 'View pull request', disabled: false, kind: 'pr' };
  }
  if (status === 'in-progress' || status === 'proposals-ready') {
    return { label: 'Resume', disabled: false, kind: 'session' };
  }
  if (latestFindings === 0) {
    return { label: 'No findings', disabled: true, kind: 'none' };
  }
  return { label: 'Start remediation', disabled: false, kind: 'session' };
}

export const ScanHistoryContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<GlobalScanRow | null>(null);

  const globalScans: GlobalScanRow[] = useMemo(() => {
    const rows: GlobalScanRow[] = [];
    for (const repo of GIT_REPOSITORIES) {
      const q = getProjectQuality(repo.name);
      if (!q) continue;
      const latestId = q.latestScan.scanId;
      const scans = q.scanHistory.length > 0 ? q.scanHistory : [q.latestScan];
      for (const scan of scans) {
        rows.push({
          ...scan,
          repoName: repo.name,
          org: repo.org,
          isLatest: scan.scanId === latestId,
        });
      }
    }
    rows.sort((a, b) => parseScanDate(b.createdAt) - parseScanDate(a.createdAt));
    return rows;
  }, []);

  const openRepo = useCallback(
    (repoName: string) => {
      navigate(
        `/self-service/repositories/${encodeURIComponent(repoName)}?tab=quality`,
      );
    },
    [navigate],
  );

  const openSession = useCallback(
    (repoName: string, resume: boolean) => {
      const qs = new URLSearchParams({ from: 'scans' });
      if (resume) qs.set('resume', '1');
      navigate(
        `/self-service/apme/remediate/${encodeURIComponent(
          repoName,
        )}?${qs.toString()}`,
      );
    },
    [navigate],
  );

  const runWorkAction = useCallback(
    (row: GlobalScanRow) => {
      const q = getProjectQuality(row.repoName);
      const spec = workActionLabel(
        q?.remediationStatus,
        q?.totalViolations ?? 0,
      );
      if (spec.kind === 'none') return;
      if (spec.kind === 'pr' && q?.remediationPrUrl) {
        window.open(q.remediationPrUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      if (spec.kind === 'session') {
        openSession(
          row.repoName,
          q?.remediationStatus === 'in-progress' ||
            q?.remediationStatus === 'proposals-ready',
        );
      }
    },
    [openSession],
  );

  const renderAction = useCallback(
    (row: GlobalScanRow) => {
      const q = getProjectQuality(row.repoName);
      const spec = workActionLabel(
        q?.remediationStatus,
        q?.totalViolations ?? 0,
      );
      const title = !row.isLatest
        ? 'Starts from the latest scan for this repository.'
        : spec.disabled
          ? 'Latest scan has no findings.'
          : undefined;
      return (
        <Tooltip title={title ?? ''} arrow disableHoverListener={!title}>
          <span>
            <Button
              size="small"
              color="primary"
              variant={spec.kind === 'session' ? 'outlined' : 'text'}
              className={classes.actionBtn}
              disabled={spec.disabled}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                runWorkAction(row);
              }}
            >
              {spec.label}
            </Button>
          </span>
        </Tooltip>
      );
    },
    [classes.actionBtn, runWorkAction],
  );

  const columns: TableColumn<GlobalScanRow>[] = [
    {
      title: 'When',
      field: 'createdAt',
      defaultSort: 'desc',
      customSort: (a, b) => parseScanDate(a.createdAt) - parseScanDate(b.createdAt),
      render: (row: GlobalScanRow) => (
        <Tooltip title={row.createdAt} arrow>
          <Typography style={{ fontSize: 13 }}>
            {formatRelativeWhen(row.createdAt)}
          </Typography>
        </Tooltip>
      ),
    },
    {
      title: 'Repository',
      render: (row: GlobalScanRow) => (
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
      title: 'Latest',
      sorting: false,
      render: (row: GlobalScanRow) =>
        row.isLatest ? (
          <Tooltip
            title="Latest scan for this repository. Older scans are read-only."
            arrow
          >
            <Chip
              size="small"
              label="Latest"
              style={{
                height: 20,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: 'rgba(0, 102, 204, 0.12)',
                color: '#0066CC',
              }}
            />
          </Tooltip>
        ) : null,
    },
    {
      title: 'Findings',
      field: 'totalViolations',
      render: (row: GlobalScanRow) => (
        <Tooltip title={severityTooltip(row.severityBreakdown)} arrow>
          <Box className={classes.findingsCell}>
            <Typography style={{ fontSize: 13 }}>
              {row.totalViolations === 0
                ? 'No findings'
                : `${row.totalViolations} finding${
                    row.totalViolations !== 1 ? 's' : ''
                  }`}
            </Typography>
            <FindingsBar breakdown={row.severityBreakdown} classes={classes} />
          </Box>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      sorting: false,
      render: (row: GlobalScanRow) => renderAction(row),
    },
  ];

  return (
    <Box>
      <Typography className={classes.heading}>Recent scans</Typography>
      <Typography className={classes.hint}>
        Last scans per repository — not a full archive. Latest can start
        remediation; older scans are read-only.
      </Typography>
      <Table<GlobalScanRow>
        columns={columns}
        data={globalScans}
        title=""
        options={{
          paging: globalScans.length > 20,
          pageSize: 20,
          pageSizeOptions: [10, 20, 50],
          emptyRowsWhenPaging: false,
          search: true,
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
          if (rowData) setSnapshot(rowData as GlobalScanRow);
        }}
      />
      <ScanSnapshotDrawer
        row={snapshot}
        onClose={() => setSnapshot(null)}
        onOpenRepo={openRepo}
        action={snapshot ? renderAction(snapshot) : null}
      />
    </Box>
  );
};
