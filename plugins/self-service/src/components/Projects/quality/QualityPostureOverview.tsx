import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import { Box, Button, Chip, Typography, makeStyles } from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import {
  SEVERITY_COLORS,
  getProjectQuality,
  type RemediationStatus,
} from '../detail/qualityDemoData';
import { statusColors } from '../../common/statusColors';

type QueueFilter = 'critical' | 'findings' | 'in-progress' | 'pr-open';

type AttentionWhy =
  | 'critical'
  | 'in-progress'
  | 'pr-open'
  | 'findings'
  | 'stale';

type AttentionRow = {
  name: string;
  org: string;
  health: number;
  findings: number;
  critical: number;
  status: RemediationStatus;
  why: AttentionWhy;
  whyLabel: string;
  when: string;
};

const WHY_ORDER: Record<AttentionWhy, number> = {
  critical: 0,
  'in-progress': 1,
  'pr-open': 2,
  findings: 3,
  stale: 4,
};

const FILTER_HINT: Record<QueueFilter, string> = {
  critical: 'Showing repositories with critical findings.',
  findings: 'Showing repositories with findings.',
  'in-progress': 'Showing remediations in progress.',
  'pr-open': 'Showing repositories with an open pull request.',
};

const FILTER_TITLE: Record<QueueFilter, string> = {
  critical: 'Needs attention · Critical',
  findings: 'Needs attention · With findings',
  'in-progress': 'Needs attention · In progress',
  'pr-open': 'Needs attention · Pull requests open',
};

const useStyles = makeStyles(theme => ({
  hint: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    marginBottom: theme.spacing(2),
    maxWidth: 720,
  },
  liveBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    borderLeft: `4px solid ${statusColors.info}`,
    backgroundColor: theme.palette.background.paper,
  },
  liveText: {
    fontSize: 14,
    fontWeight: 600,
  },
  liveMeta: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  cta: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    flexShrink: 0,
  },
  kpis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  kpi: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  kpiSelected: {
    borderColor: theme.palette.primary.main,
    boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}`,
  },
  kpiSelectedCritical: {
    borderColor: SEVERITY_COLORS.critical,
    boxShadow: `inset 0 0 0 1px ${SEVERITY_COLORS.critical}`,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  kpiValueCritical: {
    color: SEVERITY_COLORS.critical,
  },
  kpiLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  filterHint: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    marginBottom: theme.spacing(1.5),
  },
  clearFilter: {
    color: theme.palette.primary.main,
    cursor: 'pointer',
    fontWeight: 500,
    marginLeft: theme.spacing(1),
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: theme.spacing(1),
  },
  repoLink: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.primary.main,
    cursor: 'pointer',
  },
}));

function healthColor(score: number): string {
  if (score >= 80) return statusColors.success;
  if (score >= 50) return statusColors.warning;
  return statusColors.error;
}

function isLive(status: RemediationStatus): boolean {
  return status === 'in-progress' || status === 'proposals-ready';
}

function isStale(when: string): boolean {
  return /\d+\s+days?\s+ago/i.test(when);
}

function attentionWhy(
  status: RemediationStatus,
  critical: number,
  findings: number,
  when: string,
): AttentionWhy | null {
  if (critical > 0) return 'critical';
  if (isLive(status)) return 'in-progress';
  if (status === 'pr-open') return 'pr-open';
  if (findings > 0) return 'findings';
  if (isStale(when)) return 'stale';
  return null;
}

function whyLabel(why: AttentionWhy, status: RemediationStatus): string {
  switch (why) {
    case 'critical':
      return 'Critical findings';
    case 'in-progress':
      return status === 'proposals-ready'
        ? 'Proposals ready'
        : 'Remediation in progress';
    case 'pr-open':
      return 'Pull request open';
    case 'findings':
      return 'Findings to review';
    case 'stale':
      return 'Scan is stale';
    default:
      return why;
  }
}

function matchesFilter(row: AttentionRow, filter: QueueFilter): boolean {
  switch (filter) {
    case 'critical':
      return row.critical > 0;
    case 'findings':
      return row.findings > 0;
    case 'in-progress':
      return isLive(row.status);
    case 'pr-open':
      return row.status === 'pr-open';
    default:
      return true;
  }
}

function whyChipColor(why: AttentionWhy): { bg: string; fg: string } {
  switch (why) {
    case 'critical':
      return { bg: `${SEVERITY_COLORS.critical}22`, fg: SEVERITY_COLORS.critical };
    case 'in-progress':
      return { bg: 'rgba(0, 102, 204, 0.12)', fg: '#0066CC' };
    case 'pr-open':
      return { bg: 'rgba(46, 132, 64, 0.14)', fg: '#2E8440' };
    case 'findings':
      return { bg: 'rgba(240, 171, 0, 0.16)', fg: '#8A6A00' };
    case 'stale':
    default:
      return { bg: 'rgba(0,0,0,0.06)', fg: '#6A6E73' };
  }
}

/**
 * Fleet posture for Content quality — not the work queue.
 * Resume / Start scan live on Remediations.
 */
export const QualityPostureOverview = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<QueueFilter | null>(null);

  const stats = useMemo(() => {
    let withFindings = 0;
    let inProgress = 0;
    let prOpen = 0;
    let criticalFindings = 0;
    const attention: AttentionRow[] = [];

    for (const repo of GIT_REPOSITORIES) {
      const q = getProjectQuality(repo.name);
      if (!q) continue;
      const critical = q.severityBreakdown.critical;
      criticalFindings += critical;
      if (q.totalViolations > 0) withFindings += 1;
      if (isLive(q.remediationStatus)) inProgress += 1;
      if (q.remediationStatus === 'pr-open') prOpen += 1;

      const why = attentionWhy(
        q.remediationStatus,
        critical,
        q.totalViolations,
        q.lastScannedAt,
      );
      if (!why) continue;

      attention.push({
        name: repo.name,
        org: repo.org,
        health: q.healthScore,
        findings: q.totalViolations,
        critical,
        status: q.remediationStatus,
        why,
        whyLabel: whyLabel(why, q.remediationStatus),
        when: q.lastScannedAt,
      });
    }

    attention.sort((a, b) => {
      const order = WHY_ORDER[a.why] - WHY_ORDER[b.why];
      if (order !== 0) return order;
      return a.health - b.health;
    });

    return { withFindings, inProgress, prOpen, criticalFindings, attention };
  }, []);

  const rows = useMemo(
    () =>
      filter
        ? stats.attention.filter(row => matchesFilter(row, filter))
        : stats.attention,
    [filter, stats.attention],
  );

  const toggleFilter = useCallback((next: QueueFilter) => {
    setFilter(current => (current === next ? null : next));
  }, []);

  const onKpiKey = useCallback(
    (next: QueueFilter) => (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleFilter(next);
      }
    },
    [toggleFilter],
  );

  const openRepo = useCallback(
    (name: string) => {
      navigate(
        `/self-service/repositories/${encodeURIComponent(name)}`,
      );
    },
    [navigate],
  );

  const columns: TableColumn<AttentionRow>[] = [
    {
      title: 'Repository',
      field: 'name',
      render: row => (
        <Typography
          className={classes.repoLink}
          onClick={e => {
            e.stopPropagation();
            openRepo(row.name);
          }}
        >
          {row.org}/{row.name}
        </Typography>
      ),
    },
    {
      title: 'Health',
      field: 'health',
      render: row => (
        <Typography
          style={{ fontSize: 16, fontWeight: 700, color: healthColor(row.health) }}
        >
          {row.health}
        </Typography>
      ),
    },
    { title: 'Findings', field: 'findings' },
    {
      title: 'Why',
      render: row => {
        const c = whyChipColor(row.why);
        return (
          <Chip
            size="small"
            label={row.whyLabel}
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
      title: 'Last scanned',
      field: 'when',
      render: row => (
        <Typography style={{ fontSize: 12 }} color="textSecondary">
          {row.when}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <Typography className={classes.hint}>
        How content quality looks across your git repositories. Resume or start
        a scan from Remediations.
      </Typography>
      {stats.inProgress > 0 && (
        <Box className={classes.liveBanner}>
          <Box>
            <Typography className={classes.liveText}>
              {stats.inProgress} remediation
              {stats.inProgress === 1 ? '' : 's'} in progress
            </Typography>
            <Typography className={classes.liveMeta}>
              Live sessions are on the Remediations tab.
            </Typography>
          </Box>
          <Button
            className={classes.cta}
            color="primary"
            variant="outlined"
            onClick={() => navigate('/self-service/apme/remediations')}
          >
            View remediations
          </Button>
        </Box>
      )}
      <Box className={classes.kpis}>
        <Box
          className={`${classes.kpi} ${
            filter === 'critical' ? classes.kpiSelectedCritical : ''
          }`}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'critical'}
          onClick={() => toggleFilter('critical')}
          onKeyDown={onKpiKey('critical')}
        >
          <Typography className={`${classes.kpiValue} ${classes.kpiValueCritical}`}>
            {stats.criticalFindings}
          </Typography>
          <Typography className={classes.kpiLabel}>Critical</Typography>
        </Box>
        <Box
          className={`${classes.kpi} ${
            filter === 'findings' ? classes.kpiSelected : ''
          }`}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'findings'}
          onClick={() => toggleFilter('findings')}
          onKeyDown={onKpiKey('findings')}
        >
          <Typography className={classes.kpiValue}>{stats.withFindings}</Typography>
          <Typography className={classes.kpiLabel}>With findings</Typography>
        </Box>
        <Box
          className={`${classes.kpi} ${
            filter === 'in-progress' ? classes.kpiSelected : ''
          }`}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'in-progress'}
          onClick={() => toggleFilter('in-progress')}
          onKeyDown={onKpiKey('in-progress')}
        >
          <Typography className={classes.kpiValue}>{stats.inProgress}</Typography>
          <Typography className={classes.kpiLabel}>Remediations in progress</Typography>
        </Box>
        <Box
          className={`${classes.kpi} ${
            filter === 'pr-open' ? classes.kpiSelected : ''
          }`}
          role="button"
          tabIndex={0}
          aria-pressed={filter === 'pr-open'}
          onClick={() => toggleFilter('pr-open')}
          onKeyDown={onKpiKey('pr-open')}
        >
          <Typography className={classes.kpiValue}>{stats.prOpen}</Typography>
          <Typography className={classes.kpiLabel}>Pull requests open</Typography>
        </Box>
      </Box>
      {filter && (
        <Typography className={classes.filterHint}>
          {FILTER_HINT[filter]}
          <span
            className={classes.clearFilter}
            role="button"
            tabIndex={0}
            onClick={() => setFilter(null)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setFilter(null);
              }
            }}
          >
            Clear
          </span>
        </Typography>
      )}
      <Typography className={classes.sectionTitle}>
        {filter ? FILTER_TITLE[filter] : 'Needs attention'}
      </Typography>
      <Table
        options={{ search: false, paging: false, padding: 'dense' }}
        columns={columns}
        data={rows}
        onRowClick={(_e, rowData) => {
          if (rowData) openRepo((rowData as AttentionRow).name);
        }}
      />
    </Box>
  );
};
