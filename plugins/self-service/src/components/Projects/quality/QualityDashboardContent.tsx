import { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Chip,
} from '@material-ui/core';
import { Table, TableColumn } from '@backstage/core-components';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import { useNavigate } from 'react-router-dom';
import { statusColors } from '../../common/statusColors';
import {
  SEVERITY_COLORS,
  getProjectQuality,
} from '../detail/qualityDemoData';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';

type RepoQualitySummary = {
  repoName: string;
  org: string;
  totalViolations: number;
  lastScannedAt: string;
  scanCount: number;
  criticalCount: number;
  highCount: number;
};

const FleetStatCard = ({
  value,
  label,
  color,
  sublabel,
}: {
  value: string | number;
  label: string;
  color?: string;
  sublabel?: string;
}) => (
  <Paper variant="outlined" style={{ padding: 20, borderRadius: 12, flex: 1, minWidth: 140 }}>
    <Typography style={{ fontSize: 12, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
      {label}
    </Typography>
    <Typography style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.2 }}>
      {value}
    </Typography>
    {sublabel && (
      <Typography style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{sublabel}</Typography>
    )}
  </Paper>
);

export const QualityDashboardContent = () => {
  const navigate = useNavigate();

  const repoSummaries: RepoQualitySummary[] = useMemo(() => {
    return GIT_REPOSITORIES
      .map(repo => {
        const q = getProjectQuality(repo.name);
        if (!q) return null;
        return {
          repoName: repo.name,
          org: repo.org,
          totalViolations: q.totalViolations,
          lastScannedAt: q.lastScannedAt,
          scanCount: q.scanCount,
          criticalCount: q.severityBreakdown.critical,
          highCount: q.severityBreakdown.high,
        };
      })
      .filter((s): s is RepoQualitySummary => s !== null);
  }, []);

  const totalReposScanned = repoSummaries.length;
  const totalViolations = repoSummaries.reduce((sum, r) => sum + r.totalViolations, 0);
  const reposWithCritical = repoSummaries.filter(r => r.criticalCount > 0).length;

  const handleNavigateToProject = useCallback((repoName: string) => {
    const repo = GIT_REPOSITORIES.find(r => r.name === repoName);
    if (repo && repo.governance !== 'discovered') {
      navigate(`/self-service/projects/${repoName}`);
    } else {
      navigate(`/self-service/projects/repositories/${repoName}`);
    }
  }, [navigate]);

  const repoColumns: TableColumn<RepoQualitySummary>[] = [
    {
      title: 'Repository',
      field: 'repoName',
      render: (row: RepoQualitySummary) => (
        <Typography style={{ fontSize: 13, fontWeight: 500, color: statusColors.info, cursor: 'pointer' }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleNavigateToProject(row.repoName); }}
        >
          {row.org}/{row.repoName}
        </Typography>
      ),
    },
    {
      title: 'Violations',
      field: 'totalViolations',
      render: (row: RepoQualitySummary) => (
        <Typography style={{ fontSize: 13, fontWeight: 600, color: row.totalViolations > 0 ? statusColors.error : statusColors.success }}>
          {row.totalViolations === 0 ? 'Clean' : `${row.totalViolations}`}
        </Typography>
      ),
    },
    {
      title: 'Violations',
      field: 'totalViolations',
      render: (row: RepoQualitySummary) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          {row.totalViolations === 0 ? (
            <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
          ) : (
            <WarningIcon style={{ fontSize: 16, color: statusColors.warning }} />
          )}
          <Typography style={{ fontSize: 13 }}>{row.totalViolations}</Typography>
          {row.criticalCount > 0 && (
            <Chip size="small" label={`${row.criticalCount} critical`} style={{
              fontSize: 10, height: 18,
              backgroundColor: `${SEVERITY_COLORS.critical}20`,
              color: SEVERITY_COLORS.critical,
            }} />
          )}
          {row.highCount > 0 && row.criticalCount === 0 && (
            <Chip size="small" label={`${row.highCount} high`} style={{
              fontSize: 10, height: 18,
              backgroundColor: `${SEVERITY_COLORS.high}20`,
              color: SEVERITY_COLORS.high,
            }} />
          )}
        </Box>
      ),
    },
    {
      title: 'Scans',
      field: 'scanCount',
      render: (row: RepoQualitySummary) => (
        <Typography style={{ fontSize: 13 }}>{row.scanCount}</Typography>
      ),
    },
    {
      title: 'Last scanned',
      field: 'lastScannedAt',
      render: (row: RepoQualitySummary) => (
        <Typography style={{ fontSize: 12, color: '#666' }}>{row.lastScannedAt}</Typography>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" style={{ gap: 16, marginBottom: 24 }}>
        <FleetStatCard
          value={totalReposScanned}
          label="Repos scanned"
          sublabel={`of ${GIT_REPOSITORIES.length} total`}
        />
        <FleetStatCard
          value={totalViolations > 0 ? Math.round(totalViolations * 0.6) : 0}
          label="Auto-fixed"
          sublabel="By remediation"
          color={statusColors.success}
        />
        <FleetStatCard
          value={totalViolations}
          label="Total violations"
          color={totalViolations > 0 ? statusColors.error : statusColors.success}
        />
        <FleetStatCard
          value={reposWithCritical}
          label="Critical repos"
          color={reposWithCritical > 0 ? SEVERITY_COLORS.critical : statusColors.success}
          sublabel={reposWithCritical > 0 ? 'Require attention' : 'No critical issues'}
        />
      </Box>

      <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24 }}>
        <CardContent style={{ padding: 20 }}>
          <Typography style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 16 }}>
            Scanned repositories ({repoSummaries.length})
          </Typography>
          <Table<RepoQualitySummary>
            columns={repoColumns}
            data={repoSummaries}
            title=""
            options={{
              paging: false,
              search: false,
              sorting: true,
              padding: 'dense',
              header: true,
              rowStyle: { cursor: 'pointer' },
            }}
            style={{ boxShadow: 'none' }}
            onRowClick={(_e, rowData) => {
              if (rowData) handleNavigateToProject((rowData as RepoQualitySummary).repoName);
            }}
          />
        </CardContent>
      </Card>

    </Box>
  );
};
