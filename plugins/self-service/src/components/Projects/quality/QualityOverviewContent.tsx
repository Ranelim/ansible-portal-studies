import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Link,
  Button,
  makeStyles,
  Popover,
} from '@material-ui/core';
import { Table, TableColumn } from '@backstage/core-components';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { statusColors } from '../../common/statusColors';
import {
  getFleetQualityData,
  SEVERITY_COLORS,
  type FleetQualityRow,
  type PipelineStep,
  type WorkflowStatus,
} from '../detail/qualityDemoData';

const STATUS_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  'needs-scan': { bg: '#f5f5f5', color: '#666' },
  'issues-found': { bg: `${statusColors.error}10`, color: statusColors.error },
  'fix-in-progress': { bg: `${statusColors.info}10`, color: statusColors.info },
  'pr-open': { bg: `${statusColors.info}10`, color: statusColors.info },
  'remaining': { bg: `${statusColors.warning}10`, color: '#8a6d00' },
  'clean': { bg: `${statusColors.success}10`, color: statusColors.success },
};

const STATUS_FILTER_OPTIONS: { value: WorkflowStatus; label: string }[] = [
  { value: 'issues-found', label: 'Issues found' },
  { value: 'pr-open', label: 'PR open' },
  { value: 'remaining', label: 'Remaining' },
  { value: 'clean', label: 'Clean' },
  { value: 'needs-scan', label: 'Needs scan' },
];

type SummaryFilter = 'needs-attention' | 'clean' | null;

const useStyles = makeStyles(theme => ({
  repoLink: {
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  summaryBar: {
    display: 'flex',
    gap: theme.spacing(0.5),
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
  },
  summaryChip: {
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    userSelect: 'none' as const,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: `${theme.palette.primary.main}04`,
    },
  },
  summaryChipActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}08`,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
    flexWrap: 'wrap' as const,
  },
  filterChip: {
    fontSize: 12,
    height: 26,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  statusChip: {
    cursor: 'pointer',
    fontSize: 12,
    height: 24,
    fontWeight: 500,
    transition: 'box-shadow 0.15s',
    '&:hover': {
      boxShadow: '0 0 0 2px rgba(0,0,0,0.08)',
    },
  },
  popover: {
    padding: theme.spacing(2),
    minWidth: 260,
    maxWidth: 320,
  },
  popoverTitle: {
    fontWeight: 600,
    fontSize: 13,
    marginBottom: theme.spacing(1.5),
  },
  pipelineStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '6px 0',
    position: 'relative' as const,
  },
  stepConnector: {
    position: 'absolute' as const,
    left: 7,
    top: 22,
    bottom: -6,
    width: 1,
    backgroundColor: theme.palette.divider,
  },
  stepIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.3,
  },
  stepDetail: {
    fontSize: 11,
    color: theme.palette.text.secondary,
    marginTop: 1,
  },
}));

const PipelinePopover = ({
  anchorEl,
  onClose,
  repoName,
  pipeline,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  repoName: string;
  pipeline: PipelineStep[];
}) => {
  const classes = useStyles();

  const stepIcon = (step: PipelineStep) => {
    if (step.status === 'done') {
      return <CheckCircleIcon style={{ fontSize: 15, color: statusColors.success }} className={classes.stepIcon} />;
    }
    if (step.status === 'active') {
      return <FiberManualRecordIcon style={{ fontSize: 15, color: statusColors.info }} className={classes.stepIcon} />;
    }
    return <RadioButtonUncheckedIcon style={{ fontSize: 15, color: '#ccc' }} className={classes.stepIcon} />;
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <Box className={classes.popover}>
        <Typography className={classes.popoverTitle}>
          {repoName}
        </Typography>
        {pipeline.map((step, i) => (
          <Box key={i} className={classes.pipelineStep}>
            {i < pipeline.length - 1 && <Box className={classes.stepConnector} />}
            {stepIcon(step)}
            <Box>
              <Typography className={classes.stepLabel} style={{
                color: step.status === 'pending' ? '#999' : undefined,
              }}>
                {step.label}
              </Typography>
              {step.detail && (
                <Typography className={classes.stepDetail}>
                  {step.detail}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Popover>
  );
};

const StatusCell = ({ row }: { row: FleetQualityRow }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const style = STATUS_CHIP_STYLES[row.workflowStatus] ?? STATUS_CHIP_STYLES['needs-scan'];

  return (
    <>
      <Chip
        size="small"
        label={row.statusLabel}
        className={classes.statusChip}
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        style={{
          backgroundColor: style.bg,
          color: style.color,
          border: row.workflowStatus === 'needs-scan' ? '1px solid #ddd' : 'none',
        }}
      />
      <PipelinePopover
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        repoName={row.repoName}
        pipeline={row.pipeline}
      />
    </>
  );
};

export const QualityOverviewContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const fleetData = useMemo(() => getFleetQualityData(), []);

  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>(null);
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | null>(null);

  const totals = useMemo(() => {
    let violations = 0;
    let reposWithIssues = 0;
    let clean = 0;
    for (const row of fleetData) {
      violations += row.remainingCount;
      if (row.workflowStatus !== 'clean') reposWithIssues++;
      else clean++;
    }
    return { violations, reposWithIssues, clean, total: fleetData.length };
  }, [fleetData]);

  const filteredData = useMemo(() => {
    let result = fleetData;

    if (summaryFilter === 'needs-attention') {
      result = result.filter(r => r.workflowStatus !== 'clean');
    } else if (summaryFilter === 'clean') {
      result = result.filter(r => r.workflowStatus === 'clean');
    }

    if (statusFilter) {
      result = result.filter(r => r.workflowStatus === statusFilter);
    }

    return result;
  }, [fleetData, summaryFilter, statusFilter]);

  const hasActiveFilters = summaryFilter !== null || statusFilter !== null;

  const clearFilters = useCallback(() => {
    setSummaryFilter(null);
    setStatusFilter(null);
  }, []);

  const toggleSummaryFilter = useCallback((filter: SummaryFilter) => {
    setSummaryFilter(prev => prev === filter ? null : filter);
    setStatusFilter(null);
  }, []);

  const toggleStatusFilter = useCallback((status: WorkflowStatus) => {
    setStatusFilter(prev => prev === status ? null : status);
    setSummaryFilter(null);
  }, []);

  const columns: TableColumn<FleetQualityRow>[] = [
    {
      title: 'Repository',
      field: 'repoName',
      render: (row: FleetQualityRow) => (
        <Link
          className={classes.repoLink}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            navigate(`/self-service/repositories/${row.repoName}?tab=quality`);
          }}
        >
          {row.repoName}
        </Link>
      ),
    },
    {
      title: 'Status',
      sorting: false,
      render: (row: FleetQualityRow) => <StatusCell row={row} />,
    },
    {
      title: 'Issues',
      field: 'remainingCount',
      defaultSort: 'desc',
      render: (row: FleetQualityRow) => {
        if (row.remainingCount === 0) {
          return <Typography style={{ fontSize: 13, color: '#999' }}>—</Typography>;
        }
        const color = row.highestSeverity ? SEVERITY_COLORS[row.highestSeverity] : '#333';
        return (
          <Typography style={{ fontSize: 13, fontWeight: 600, color }}>
            {row.remainingCount}
          </Typography>
        );
      },
    },
    {
      title: 'Last scan',
      field: 'lastScannedAt',
      render: (row: FleetQualityRow) => (
        <Typography style={{ fontSize: 13, color: '#666' }}>
          {row.lastScannedAt}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      {/* Summary bar — clickable filters */}
      <Box className={classes.summaryBar}>
        <Box
          className={`${classes.summaryChip} ${summaryFilter === 'needs-attention' ? classes.summaryChipActive : ''}`}
          onClick={() => toggleSummaryFilter('needs-attention')}
        >
          <Typography className={classes.summaryValue} style={{ color: totals.reposWithIssues > 0 ? statusColors.error : statusColors.success }}>
            {totals.reposWithIssues}
          </Typography>
          <Typography className={classes.summaryLabel}>
            need attention
          </Typography>
        </Box>
        <Box
          className={`${classes.summaryChip} ${summaryFilter === 'clean' ? classes.summaryChipActive : ''}`}
          onClick={() => toggleSummaryFilter('clean')}
        >
          <Typography className={classes.summaryValue} style={{ color: statusColors.success }}>
            {totals.clean}
          </Typography>
          <Typography className={classes.summaryLabel}>
            clean
          </Typography>
        </Box>
        <Box className={classes.summaryChip} style={{ cursor: 'default', borderColor: 'transparent' }}>
          <Typography className={classes.summaryValue}>
            {totals.violations}
          </Typography>
          <Typography className={classes.summaryLabel}>
            issues remaining
          </Typography>
        </Box>
      </Box>

      {/* Status filter chips */}
      <Box className={classes.filterRow}>
        <Typography style={{ fontSize: 12, color: '#999', marginRight: 4 }}>
          Status:
        </Typography>
        {STATUS_FILTER_OPTIONS.map(opt => {
          const isActive = statusFilter === opt.value;
          const chipStyle = STATUS_CHIP_STYLES[opt.value];
          return (
            <Chip
              key={opt.value}
              size="small"
              label={opt.label}
              className={classes.filterChip}
              onClick={() => toggleStatusFilter(opt.value)}
              variant={isActive ? 'default' : 'outlined'}
              style={isActive ? {
                backgroundColor: chipStyle.bg,
                color: chipStyle.color,
                borderColor: chipStyle.color,
                border: `1px solid ${chipStyle.color}`,
              } : {}}
            />
          );
        })}
        {hasActiveFilters && (
          <Button
            size="small"
            onClick={clearFilters}
            style={{ textTransform: 'none', fontSize: 12, marginLeft: 4 }}
          >
            Clear
          </Button>
        )}
      </Box>

      <Table<FleetQualityRow>
        columns={columns}
        data={filteredData}
        title=""
        options={{
          paging: false,
          search: false,
          sorting: true,
          padding: 'dense',
          rowStyle: { cursor: 'pointer' },
        }}
        style={{ width: '100%', overflowX: 'hidden' }}
        onRowClick={(_event, rowData) => {
          if (rowData) {
            const row = rowData as FleetQualityRow;
            navigate(`/self-service/repositories/${row.repoName}?tab=quality`);
          }
        }}
      />
    </Box>
  );
};
