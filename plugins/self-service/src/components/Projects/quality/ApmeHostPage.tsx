import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Header, Page, HeaderTabs, Content, Table, TableColumn } from '@backstage/core-components';
import { Box, Button, Chip, Typography, makeStyles } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHelpIcon } from '../../common/PageHelpIcon';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import { getProjectQuality, SEVERITY_COLORS, type RemediationStatus } from '../detail/qualityDemoData';
import { QualityDashboardTabContent } from './QualityDashboardTabContent';
import { ScanHistoryContent } from './ScanHistoryContent';
import { SHOW_CONTENT_QUALITY_FINDINGS_TAB } from './contentQualityIa';

type Surface = 'overview' | 'findings' | 'scans';

type QueueStatus = 'in-progress' | 'proposals-ready' | 'pr-open' | 'available';

type QueueFilter = 'critical' | 'findings' | 'in-progress' | 'pr-open';

type QueueRow = {
  id: string;
  name: string;
  org: string;
  findings: number;
  critical: number;
  status: QueueStatus;
  summary: string;
  when: string;
  prUrl?: string;
};

const ALL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'findings', label: 'Findings' },
  { id: 'scans', label: 'Scans' },
];

/** Findings tab parked — set SHOW_CONTENT_QUALITY_FINDINGS_TAB to revive. */
const TABS = SHOW_CONTENT_QUALITY_FINDINGS_TAB
  ? ALL_TABS
  : ALL_TABS.filter(tab => tab.id !== 'findings');

const STATUS_LABEL: Record<QueueStatus, string> = {
  'in-progress': 'In progress',
  'proposals-ready': 'Proposals ready',
  'pr-open': 'Pull request open',
  available: 'Ready to start',
};

const STATUS_ORDER: Record<QueueStatus, number> = {
  'in-progress': 0,
  'proposals-ready': 1,
  'pr-open': 2,
  available: 3,
};

const useStyles = makeStyles(theme => ({
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
  },
  kpiClickable: {
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
  kpiValueCritical: {
    color: SEVERITY_COLORS.critical,
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
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  kpiLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  hint: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    marginBottom: theme.spacing(2),
    maxWidth: 720,
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
  actionBtn: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
}));

function getSurface(pathname: string): Surface {
  if (pathname.includes('/apme/findings')) return 'findings';
  if (pathname.includes('/apme/scans')) return 'scans';
  return 'overview';
}

function queueStatus(status: RemediationStatus, findings: number): QueueStatus | null {
  if (status === 'in-progress') return 'in-progress';
  if (status === 'proposals-ready') return 'proposals-ready';
  if (status === 'pr-open') return 'pr-open';
  if (findings > 0) return 'available';
  return null;
}

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

function matchesFilter(row: QueueRow, filter: QueueFilter): boolean {
  switch (filter) {
    case 'critical':
      return row.critical > 0;
    case 'findings':
      return row.findings > 0;
    case 'in-progress':
      return row.status === 'in-progress' || row.status === 'proposals-ready';
    case 'pr-open':
      return row.status === 'pr-open';
    default:
      return true;
  }
}

function statusChipColor(status: QueueStatus): { bg: string; fg: string } {
  switch (status) {
    case 'in-progress':
      return { bg: 'rgba(0, 102, 204, 0.12)', fg: '#0066CC' };
    case 'proposals-ready':
      return { bg: 'rgba(103, 83, 172, 0.14)', fg: '#5B3F9E' };
    case 'pr-open':
      return { bg: 'rgba(46, 132, 64, 0.14)', fg: '#2E8440' };
    case 'available':
    default:
      return { bg: 'rgba(240, 171, 0, 0.16)', fg: '#8A6A00' };
  }
}

const ApmeOverview = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<QueueFilter | null>(null);

  const stats = useMemo(() => {
    let withFindings = 0;
    let inProgress = 0;
    let prOpen = 0;
    let criticalFindings = 0;
    const attention: QueueRow[] = [];

    for (const repo of GIT_REPOSITORIES) {
      const q = getProjectQuality(repo.name);
      if (!q) continue;
      const critical = q.severityBreakdown.critical;
      criticalFindings += critical;
      if (q.totalViolations > 0) withFindings += 1;
      if (
        q.remediationStatus === 'in-progress' ||
        q.remediationStatus === 'proposals-ready'
      ) {
        inProgress += 1;
      }
      if (q.remediationStatus === 'pr-open') prOpen += 1;

      const status = queueStatus(q.remediationStatus, q.totalViolations);
      if (!status) continue;

      const summary = q.remediationSummary
        ? `${q.remediationSummary.addressed} addressed · ${q.remediationSummary.remaining} remaining`
        : `${q.totalViolations} findings on latest scan`;

      attention.push({
        id: `${repo.org}/${repo.name}`,
        name: repo.name,
        org: repo.org,
        findings: q.totalViolations,
        critical,
        status,
        summary,
        when: q.lastScannedAt,
        prUrl: q.remediationPrUrl,
      });
    }

    attention.sort((a, b) => {
      const order = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (order !== 0) return order;
      return a.name.localeCompare(b.name);
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

  const openRepoQuality = useCallback(
    (name: string) => {
      navigate(
        `/self-service/repositories/${encodeURIComponent(name)}?tab=quality`,
      );
    },
    [navigate],
  );

  const openSession = useCallback(
    (name: string, resumeSession: boolean) => {
      navigate(
        `/self-service/apme/remediate/${encodeURIComponent(name)}${
          resumeSession ? '?resume=1' : ''
        }`,
      );
    },
    [navigate],
  );

  const columns: TableColumn<QueueRow>[] = [
    {
      title: 'Repository',
      field: 'name',
      render: row => (
        <Typography
          className={classes.repoLink}
          onClick={e => {
            e.stopPropagation();
            openRepoQuality(row.name);
          }}
        >
          {row.org}/{row.name}
        </Typography>
      ),
    },
    {
      title: 'Status',
      render: row => {
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
    { title: 'Findings', field: 'findings' },
    {
      title: 'Summary',
      field: 'summary',
      render: row => (
        <Typography style={{ fontSize: 13 }}>{row.summary}</Typography>
      ),
    },
    {
      title: 'When',
      field: 'when',
      render: row => (
        <Typography style={{ fontSize: 12, color: '#6A6E73' }}>
          {row.when}
        </Typography>
      ),
    },
    {
      title: 'Action',
      render: row => {
        if (row.prUrl) {
          return (
            <Button
              size="small"
              color="primary"
              className={classes.actionBtn}
              onClick={e => {
                e.stopPropagation();
                window.open(row.prUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              View pull request
            </Button>
          );
        }
        return (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            className={classes.actionBtn}
            onClick={e => {
              e.stopPropagation();
              openSession(row.name, row.status !== 'available');
            }}
          >
            {row.status === 'available' ? 'Start remediation' : 'Resume'}
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <Typography className={classes.hint}>
        Current quality cycle per repository. Start or resume remediation here.
        Scans lists recent scans.
      </Typography>
      <Box className={classes.kpis}>
        <Box
          className={`${classes.kpi} ${classes.kpiClickable} ${
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
          className={`${classes.kpi} ${classes.kpiClickable} ${
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
          className={`${classes.kpi} ${classes.kpiClickable} ${
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
          className={`${classes.kpi} ${classes.kpiClickable} ${
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
          if (rowData) openRepoQuality((rowData as QueueRow).name);
        }}
      />
    </Box>
  );
};

/**
 * Exploration only — Content quality pin (compare vs host tabs).
 * Overview = current-cycle work queue. Scans = recent scans.
 * Findings (by-rule) parked — SHOW_CONTENT_QUALITY_FINDINGS_TAB.
 */
export const ApmeHostPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const surface = getSurface(location.pathname);
  const selectedTab = Math.max(
    0,
    TABS.findIndex(tab => tab.id === surface),
  );

  useEffect(() => {
    if (!SHOW_CONTENT_QUALITY_FINDINGS_TAB && surface === 'findings') {
      navigate('/self-service/apme', { replace: true });
    }
  }, [surface, navigate]);

  const onTabSelect = useCallback(
    (index: number) => {
      const tab = TABS[index];
      if (tab?.id === 'findings') navigate('/self-service/apme/findings');
      else if (tab?.id === 'scans') navigate('/self-service/apme/scans');
      else navigate('/self-service/apme');
    },
    [navigate],
  );

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Content quality
            <PageHelpIcon
              tooltipLabel="What is content quality?"
              title="What is content quality?"
              description="Scans Ansible content in your git repositories for policy, quality, secrets, and modernization findings. Overview is the current work queue. Scans lists recent scans. Open a repository to review detail and run a remediation session."
            />
          </Box>
        }
        pageTitleOverride="Content quality"
        subtitle="Policy and modernization scanning for Ansible content in your git repositories"
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={TABS.map(({ id, label }) => ({ id, label }))}
      />
      <Content>
        {surface === 'findings' && SHOW_CONTENT_QUALITY_FINDINGS_TAB ? (
          <QualityDashboardTabContent
            hint="Findings grouped by rule across repositories. Open a repository for detail. Start or resume remediation from Overview."
          />
        ) : surface === 'scans' ? (
          <ScanHistoryContent />
        ) : (
          <ApmeOverview />
        )}
      </Content>
    </Page>
  );
};
