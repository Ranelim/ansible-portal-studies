import { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@material-ui/core';
import { Table, TableColumn } from '@backstage/core-components';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import { useNavigate } from 'react-router-dom';
import { statusColors } from '../../common/statusColors';
import {
  type ScanResult,
  getProjectQuality,
} from '../detail/qualityDemoData';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';

type GlobalScanRow = ScanResult & {
  repoName: string;
  org: string;
};

export const ScanHistoryContent = () => {
  const navigate = useNavigate();

  const globalScans: GlobalScanRow[] = useMemo(() => {
    const rows: GlobalScanRow[] = [];
    for (const repo of GIT_REPOSITORIES) {
      const q = getProjectQuality(repo.name);
      if (!q) continue;
      const scans = q.scanHistory.length > 0 ? q.scanHistory : [q.latestScan];
      for (const scan of scans) {
        rows.push({ ...scan, repoName: repo.name, org: repo.org });
      }
    }
    return rows;
  }, []);

  const handleNavigateToProject = useCallback((repoName: string) => {
    const repo = GIT_REPOSITORIES.find(r => r.name === repoName);
    if (repo && repo.governance !== 'discovered') {
      navigate(`/self-service/projects/${repoName}`);
    } else {
      navigate(`/self-service/projects/repositories/${repoName}`);
    }
  }, [navigate]);

  const columns: TableColumn<GlobalScanRow>[] = [
    {
      title: 'Repository',
      render: (row: GlobalScanRow) => (
        <Typography style={{ fontSize: 13, fontWeight: 500, color: statusColors.info, cursor: 'pointer' }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleNavigateToProject(row.repoName); }}
        >
          {row.org}/{row.repoName}
        </Typography>
      ),
    },
    {
      title: 'Scan',
      field: 'scanId',
      render: (row: GlobalScanRow) => (
        <Typography style={{ fontSize: 12, fontFamily: 'monospace', color: '#555' }}>{row.scanId}</Typography>
      ),
    },
    {
      title: 'Type',
      field: 'scanType',
      render: (row: GlobalScanRow) => (
        <Chip size="small" label={row.scanType === 'remediate' ? 'Remediate' : 'Check'}
          style={{
            fontSize: 11, height: 20, fontWeight: 500,
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
        if (row.aiCandidates === 0) return <Typography style={{ fontSize: 12, color: '#999' }}>—</Typography>;
        return (
          <Tooltip title={`${row.aiAccepted} accepted, ${row.aiDeclined} declined`} arrow>
            <Chip size="small" label={`${row.aiCandidates}`}
              style={{ fontSize: 10, height: 18, backgroundColor: '#F0AB0020', color: '#73510D' }}
            />
          </Tooltip>
        );
      },
    },
    { title: 'Date', field: 'createdAt' },
  ];

  return (
    <Box>
      <Box style={{ marginBottom: 16 }}>
        <Typography variant="h6" style={{ fontWeight: 600 }}>
          {globalScans.length} scan{globalScans.length !== 1 ? 's' : ''}
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
          All quality scans across all repositories, sorted by most recent
        </Typography>
      </Box>
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
        onRowClick={(_e, rowData) => {
          if (rowData) handleNavigateToProject((rowData as GlobalScanRow).repoName);
        }}
      />
    </Box>
  );
};
