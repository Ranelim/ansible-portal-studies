import { useMemo, useCallback } from 'react';
import {
  Box,
  Button,
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
import { useNavIaModel } from '../../../hooks/useNavIaModel';

type GlobalScanRow = ScanResult & {
  repoName: string;
  org: string;
  isCurrent: boolean;
};

export const ScanHistoryContent = () => {
  const navigate = useNavigate();
  const { experience } = useNavIaModel();
  const contentQuality = experience === 'develop-apme';

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
          isCurrent: scan.scanId === latestId,
        });
      }
    }
    return rows;
  }, []);

  const openRepo = useCallback((repoName: string) => {
    navigate(
      `/self-service/repositories/${encodeURIComponent(repoName)}?tab=quality`,
    );
  }, [navigate]);

  const openSession = useCallback((repoName: string, resume: boolean) => {
    const qs = new URLSearchParams({ from: 'scans' });
    if (resume) qs.set('resume', '1');
    navigate(
      `/self-service/apme/remediate/${encodeURIComponent(repoName)}?${qs.toString()}`,
    );
  }, [navigate]);

  const handleRowActivate = useCallback(
    (row: GlobalScanRow) => {
      if (contentQuality && row.isCurrent && row.totalViolations > 0) {
        const q = getProjectQuality(row.repoName);
        const resume =
          q?.remediationStatus === 'in-progress' ||
          q?.remediationStatus === 'proposals-ready';
        openSession(row.repoName, Boolean(resume));
        return;
      }
      if (!contentQuality) openRepo(row.repoName);
    },
    [contentQuality, openRepo, openSession],
  );

  const columns: TableColumn<GlobalScanRow>[] = [
    {
      title: 'Repository',
      render: (row: GlobalScanRow) => (
        <Typography style={{ fontSize: 13, fontWeight: 500, color: statusColors.info, cursor: 'pointer' }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); openRepo(row.repoName); }}
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
      title: 'Status',
      render: (row: GlobalScanRow) => (
        <Chip
          size="small"
          label={row.isCurrent ? 'Current' : 'Superseded'}
          style={{
            fontSize: 11,
            height: 20,
            fontWeight: 600,
            backgroundColor: row.isCurrent
              ? 'rgba(0, 102, 204, 0.12)'
              : 'rgba(0,0,0,0.06)',
            color: row.isCurrent ? '#0066CC' : '#6A6E73',
          }}
        />
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
            {row.totalViolations} finding{row.totalViolations !== 1 ? 's' : ''}
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
    {
      title: 'Action',
      sorting: false,
      render: (row: GlobalScanRow) => {
        if (!contentQuality) return null;
        if (!row.isCurrent) {
          return (
            <Typography style={{ fontSize: 12, color: '#6A6E73' }}>
              Newer scan available
            </Typography>
          );
        }
        if (row.totalViolations === 0) return null;
        const q = getProjectQuality(row.repoName);
        const status = q?.remediationStatus;
        if (status === 'pr-open' && q?.remediationPrUrl) {
          return (
            <Button
              size="small"
              color="primary"
              style={{ textTransform: 'none', borderRadius: 20 }}
              onClick={e => {
                e.stopPropagation();
                window.open(q.remediationPrUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              View pull request
            </Button>
          );
        }
        const resume =
          status === 'in-progress' || status === 'proposals-ready';
        return (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            style={{ textTransform: 'none', borderRadius: 20, fontWeight: 600 }}
            onClick={e => {
              e.stopPropagation();
              openSession(row.repoName, resume);
            }}
          >
            {resume ? 'Resume' : 'Start remediation'}
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <Box style={{ marginBottom: 16 }}>
        <Typography variant="h6" style={{ fontWeight: 600 }}>
          {globalScans.length} scan{globalScans.length !== 1 ? 's' : ''}
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
          Scan history across repositories. Current is the latest scan for that
          repo. Start or resume remediation from a current scan — not from a
          superseded one.
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
          if (rowData) handleRowActivate(rowData as GlobalScanRow);
        }}
      />
    </Box>
  );
};
