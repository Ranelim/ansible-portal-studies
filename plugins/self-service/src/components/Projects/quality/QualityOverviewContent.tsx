import { useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Link,
  makeStyles,
  Tooltip,
} from '@material-ui/core';
import { Table, TableColumn } from '@backstage/core-components';
import { useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import { statusColors } from '../../common/statusColors';
import {
  getFleetQualityData,
  SEVERITY_COLORS,
  type FleetQualityRow,
  type SeverityClass,
} from '../detail/qualityDemoData';

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
    gap: theme.spacing(3),
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  prChip: {
    fontSize: 11,
    height: 20,
    fontWeight: 500,
  },
}));

export const QualityOverviewContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const fleetData = useMemo(() => getFleetQualityData(), []);

  const totals = useMemo(() => {
    let violations = 0;
    let fixable = 0;
    let reposWithIssues = 0;
    for (const row of fleetData) {
      violations += row.totalViolations;
      fixable += row.fixable;
      if (row.totalViolations > 0) reposWithIssues++;
    }
    return { violations, fixable, reposWithIssues, total: fleetData.length };
  }, [fleetData]);

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
      title: 'Violations',
      field: 'totalViolations',
      defaultSort: 'desc',
      render: (row: FleetQualityRow) => {
        if (row.totalViolations === 0) {
          return (
            <Typography style={{ fontSize: 13, color: statusColors.success, fontWeight: 500 }}>
              Clean
            </Typography>
          );
        }
        const highest: SeverityClass = row.severityBreakdown.critical > 0 ? 'critical'
          : row.severityBreakdown.high > 0 ? 'high'
          : row.severityBreakdown.medium > 0 ? 'medium'
          : 'low';
        const color = SEVERITY_COLORS[highest];
        return (
          <Box display="flex" alignItems="center" style={{ gap: 6 }}>
            <Typography style={{ fontSize: 14, fontWeight: 600, color }}>
              {row.totalViolations}
            </Typography>
            <Chip
              size="small"
              label={`${row.severityBreakdown[highest]} ${highest}`}
              style={{
                fontSize: 10,
                height: 18,
                backgroundColor: `${color}14`,
                color,
                fontWeight: 500,
              }}
            />
          </Box>
        );
      },
    },
    {
      title: 'Fixable',
      field: 'fixable',
      render: (row: FleetQualityRow) => {
        if (row.fixable === 0) {
          return (
            <Typography style={{ fontSize: 13, color: '#999' }}>—</Typography>
          );
        }
        return (
          <Tooltip title={`${row.fixable} issues can be auto-fixed`} arrow>
            <Typography style={{ fontSize: 13, fontWeight: 500 }}>
              {row.fixable}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      title: 'Last scan',
      field: 'lastScannedAt',
      render: (row: FleetQualityRow) => (
        <Box>
          <Typography style={{ fontSize: 13 }}>
            {row.lastScannedAt}
          </Typography>
          <Typography style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>
            {row.lastScannedCommit}
          </Typography>
        </Box>
      ),
    },
    {
      title: 'Remediation',
      sorting: false,
      render: (row: FleetQualityRow) => {
        if (row.lastRemediationStatus === 'pr-merged') {
          return (
            <Chip
              size="small"
              icon={<CheckCircleOutlineIcon style={{ fontSize: 14, color: statusColors.success }} />}
              label="PR merged"
              className={classes.prChip}
              style={{ backgroundColor: `${statusColors.success}12`, color: statusColors.success }}
            />
          );
        }
        if (row.lastRemediationStatus === 'pr-open') {
          return (
            <Chip
              size="small"
              icon={<ErrorOutlineIcon style={{ fontSize: 14, color: statusColors.info }} />}
              label="PR open"
              className={classes.prChip}
              style={{ backgroundColor: `${statusColors.info}12`, color: statusColors.info }}
            />
          );
        }
        return (
          <Typography style={{ fontSize: 12, color: '#999' }}>—</Typography>
        );
      },
    },
  ];

  return (
    <Box>
      <Box className={classes.summaryBar}>
        <Box className={classes.summaryItem}>
          <Typography className={classes.summaryValue} style={{ color: totals.reposWithIssues > 0 ? statusColors.error : statusColors.success }}>
            {totals.reposWithIssues}
          </Typography>
          <Typography className={classes.summaryLabel}>
            / {totals.total} repos with issues
          </Typography>
        </Box>
        <Box className={classes.summaryItem}>
          <Typography className={classes.summaryValue}>
            {totals.violations}
          </Typography>
          <Typography className={classes.summaryLabel}>
            total violations
          </Typography>
        </Box>
        <Box className={classes.summaryItem}>
          <Typography className={classes.summaryValue} style={{ color: statusColors.success }}>
            {totals.fixable}
          </Typography>
          <Typography className={classes.summaryLabel}>
            auto-fixable
          </Typography>
        </Box>
      </Box>

      <Table<FleetQualityRow>
        columns={columns}
        data={fleetData}
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
