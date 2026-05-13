import { useMemo, useCallback } from 'react';
import { Header, Page, Content } from '@backstage/core-components';
import { Table, TableColumn } from '@backstage/core-components';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Tooltip,
} from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { PageHelpIcon } from '../../common/PageHelpIcon';
import { statusColors } from '../../common/statusColors';
import {
  type ScanResult,
  SEVERITY_COLORS,
  getProjectQuality,
} from '../detail/qualityDemoData';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';

type GlobalScanRow = ScanResult & {
  repoName: string;
  org: string;
};

const healthColor = (score: number): string => {
  if (score >= 80) return statusColors.success;
  if (score >= 50) return statusColors.warning;
  return statusColors.error;
};

const StatCard = ({
  value, label, color, sublabel,
}: {
  value: string | number; label: string; color?: string; sublabel?: string;
}) => (
  <Paper variant="outlined" style={{ padding: '14px 18px', borderRadius: 10, flex: 1, minWidth: 120 }}>
    <Typography style={{ fontSize: 11, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
      {label}
    </Typography>
    <Typography style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.2 }}>
      {value}
    </Typography>
    {sublabel && (
      <Typography style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{sublabel}</Typography>
    )}
  </Paper>
);

export const QualityDashboardPage = () => {
  const navigate = useNavigate();

  const repoData = useMemo(() => {
    return GIT_REPOSITORIES
      .map(repo => {
        const q = getProjectQuality(repo.name);
        if (!q) return null;
        return { repo, quality: q };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, []);

  const globalScans: GlobalScanRow[] = useMemo(() => {
    const rows: GlobalScanRow[] = [];
    for (const { repo, quality } of repoData) {
      const scans = quality.scanHistory.length > 0 ? quality.scanHistory : [quality.latestScan];
      for (const scan of scans) {
        rows.push({ ...scan, repoName: repo.name, org: repo.org });
      }
    }
    return rows;
  }, [repoData]);

  const totalReposScanned = repoData.length;
  const totalViolations = repoData.reduce((sum, d) => sum + d.quality.totalViolations, 0);
  const reposWithCritical = repoData.filter(d => d.quality.severityBreakdown.critical > 0).length;
  const avgHealth = totalReposScanned > 0
    ? Math.round(repoData.reduce((sum, d) => sum + d.quality.healthScore, 0) / totalReposScanned)
    : 0;

  const navigateToScan = useCallback((row: GlobalScanRow) => {
    navigate(`/self-service/repositories/${row.repoName}?tab=quality&scan=${row.scanId}`);
  }, [navigate]);

  const fleetSeverity = useMemo(() => {
    const totals = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const { quality } of repoData) {
      totals.critical += quality.severityBreakdown.critical;
      totals.high += quality.severityBreakdown.high;
      totals.medium += quality.severityBreakdown.medium;
      totals.low += quality.severityBreakdown.low;
      totals.info += quality.severityBreakdown.info;
    }
    return totals;
  }, [repoData]);

  const severityTotal = fleetSeverity.critical + fleetSeverity.high + fleetSeverity.medium + fleetSeverity.low + fleetSeverity.info;

  const columns: TableColumn<GlobalScanRow>[] = [
    {
      title: 'Scan',
      field: 'scanId',
      render: (row: GlobalScanRow) => (
        <Typography
          style={{ fontSize: 13, fontWeight: 500, color: statusColors.info, cursor: 'pointer' }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigateToScan(row); }}
        >
          {row.scanId}
        </Typography>
      ),
    },
    {
      title: 'Project',
      render: (row: GlobalScanRow) => (
        <Typography style={{ fontSize: 12, color: '#999' }}>
          {row.org}/{row.repoName}
        </Typography>
      ),
    },
    {
      title: 'Type',
      field: 'scanType',
      render: (row: GlobalScanRow) => (
        <Chip size="small" label={row.scanType === 'remediate' ? 'Remediate' : 'Check'}
          style={{
            fontSize: 10, height: 20, fontWeight: 500,
            backgroundColor: row.scanType === 'remediate' ? `${statusColors.info}20` : `${statusColors.success}20`,
            color: row.scanType === 'remediate' ? statusColors.info : statusColors.success,
          }}
        />
      ),
    },
    {
      title: 'Result',
      sorting: false,
      render: (row: GlobalScanRow) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          {row.totalViolations === 0 ? (
            <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
          ) : (
            <WarningIcon style={{ fontSize: 16, color: statusColors.warning }} />
          )}
          <Typography style={{ fontSize: 13 }}>
            {row.totalViolations} violation{row.totalViolations !== 1 ? 's' : ''}
          </Typography>
          {row.scanType === 'remediate' && row.remediatedCount > 0 && (
            <Typography style={{ fontSize: 12, color: statusColors.success }}>
              ({row.remediatedCount} fixed)
            </Typography>
          )}
        </Box>
      ),
    },
    {
      title: 'AI',
      sorting: false,
      render: (row: GlobalScanRow) => {
        if (row.aiCandidates === 0) return <Typography style={{ fontSize: 12, color: '#555' }}>—</Typography>;
        return (
          <Tooltip title={`${row.aiAccepted} accepted, ${row.aiDeclined} declined`} arrow>
            <Chip size="small" label={`${row.aiCandidates}`}
              style={{ fontSize: 10, height: 18, backgroundColor: '#F0AB0020', color: '#73510D' }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Date',
      field: 'createdAt',
      render: (row: GlobalScanRow) => (
        <Typography style={{ fontSize: 12, color: '#888' }}>{row.createdAt}</Typography>
      ),
    },
  ];

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Quality
            <PageHelpIcon
              tooltipLabel="What is Quality?"
              title="What is Quality?"
              description="Quality provides automated static analysis of your Ansible automation content. It scans repositories for compatibility, security, and best practice violations — and uses AI to propose fixes. Health scores summarize the overall quality of each repository based on violation severity."
            />
          </Box>
        }
        pageTitleOverride="Quality"
        subtitle="Fleet-wide scan history and quality metrics across all projects"
      />
      <Content>
        {/* Stat cards */}
        <Box display="flex" style={{ gap: 12, marginBottom: 24 }}>
          <StatCard value={totalReposScanned} label="Projects scanned" sublabel={`of ${GIT_REPOSITORIES.length} total`} />
          <StatCard value={avgHealth} label="Average health" color={healthColor(avgHealth)} />
          <StatCard value={totalViolations} label="Total violations" color={totalViolations > 0 ? statusColors.error : statusColors.success} />
          <StatCard value={reposWithCritical} label="Critical" color={reposWithCritical > 0 ? SEVERITY_COLORS.critical : statusColors.success}
            sublabel={reposWithCritical > 0 ? 'Require attention' : 'No critical issues'} />
        </Box>

        {/* Severity breakdown */}
        {severityTotal > 0 && (
          <Paper variant="outlined" style={{ borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
            <Typography style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Violations by severity
            </Typography>
            <Box display="flex" style={{ height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
              {fleetSeverity.critical > 0 && (
                <Box style={{ flex: fleetSeverity.critical, backgroundColor: SEVERITY_COLORS.critical }} />
              )}
              {fleetSeverity.high > 0 && (
                <Box style={{ flex: fleetSeverity.high, backgroundColor: SEVERITY_COLORS.high }} />
              )}
              {fleetSeverity.medium > 0 && (
                <Box style={{ flex: fleetSeverity.medium, backgroundColor: SEVERITY_COLORS.medium }} />
              )}
              {fleetSeverity.low > 0 && (
                <Box style={{ flex: fleetSeverity.low, backgroundColor: SEVERITY_COLORS.low }} />
              )}
              {fleetSeverity.info > 0 && (
                <Box style={{ flex: fleetSeverity.info, backgroundColor: SEVERITY_COLORS.info }} />
              )}
            </Box>
            <Box display="flex" style={{ gap: 20 }}>
              {([
                ['Critical', fleetSeverity.critical, SEVERITY_COLORS.critical],
                ['High', fleetSeverity.high, SEVERITY_COLORS.high],
                ['Medium', fleetSeverity.medium, SEVERITY_COLORS.medium],
                ['Low', fleetSeverity.low, SEVERITY_COLORS.low],
                ['Info', fleetSeverity.info, SEVERITY_COLORS.info],
              ] as [string, number, string][]).map(([label, count, color]) => (
                <Box key={label} display="flex" alignItems="center" style={{ gap: 6 }}>
                  <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
                  <Typography style={{ fontSize: 12, color: '#999' }}>
                    {label}
                  </Typography>
                  <Typography style={{ fontSize: 13, fontWeight: 600, color }}>
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Scan history */}
        <Table<GlobalScanRow>
          columns={columns}
          data={globalScans}
          title={`${globalScans.length} scans`}
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
          onRowClick={(_e, rowData) => {
            if (rowData) navigateToScan(rowData as GlobalScanRow);
          }}
        />
      </Content>
    </Page>
  );
};
