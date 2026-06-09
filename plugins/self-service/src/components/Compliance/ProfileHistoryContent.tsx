import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  makeStyles,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { statusColors } from '../common/statusColors';
import {
  getProfile,
  getProfileScans,
  type ComplianceScan,
} from './complianceDemoData';

const useStyles = makeStyles(theme => ({
  trendSection: {
    marginBottom: theme.spacing(3),
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: theme.spacing(1.5),
  },
  trendChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: theme.spacing(0.5),
    height: 80,
    padding: theme.spacing(1, 0),
  },
  trendBar: {
    flex: 1,
    borderRadius: '4px 4px 0 0',
    minWidth: 32,
    maxWidth: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
  },
  trendLabel: {
    fontSize: 10,
    color: theme.palette.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  trendValue: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 4,
  },
  table: {
    '& .MuiTableCell-head': {
      fontWeight: 600,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: theme.palette.text.secondary,
      borderBottom: `2px solid ${theme.palette.divider}`,
      padding: theme.spacing(1.5, 2),
    },
    '& .MuiTableCell-body': {
      padding: theme.spacing(1.5, 2),
      fontSize: 13,
    },
  },
  row: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  rowSuperseded: {
    opacity: 0.4,
    '&:hover': {
      opacity: 0.6,
      backgroundColor: theme.palette.action.hover,
    },
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  scanMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
}));

function getScoreColor(score: number): string {
  if (score >= 90) return statusColors.success;
  if (score >= 70) return statusColors.warning;
  return statusColors.error;
}

function getScanStatus(scan: ComplianceScan, isLatest: boolean): { icon: React.ReactNode; label: string; color: string } {
  if (scan.status === 'failed') {
    return { icon: <ErrorIcon style={{ fontSize: 16, color: statusColors.error }} />, label: 'Failed', color: statusColors.error };
  }
  if (!isLatest) {
    return { icon: <FiberManualRecordIcon style={{ fontSize: 10, color: statusColors.pending }} />, label: 'Superseded', color: statusColors.pending };
  }
  if (scan.rulesFailing > 0) {
    return { icon: <ErrorIcon style={{ fontSize: 16, color: statusColors.error }} />, label: `${scan.rulesFailing} issues`, color: statusColors.error };
  }
  return { icon: <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />, label: 'Compliant', color: statusColors.success };
}

const TrendChart = ({ profileId }: { profileId: string }) => {
  const classes = useStyles();
  const profile = getProfile(profileId);
  if (!profile || profile.scoreHistory.length === 0) return null;

  const maxScore = 100;

  return (
    <Box className={classes.trendSection}>
      <Typography className={classes.trendTitle}>Compliance trend</Typography>
      <Box className={classes.trendChart}>
        {profile.scoreHistory.map((point, i) => {
          const heightPct = (point.score / maxScore) * 100;
          const color = getScoreColor(point.score);
          return (
            <Box key={i} className={classes.trendBar}>
              <Typography className={classes.trendValue} style={{ color }}>
                {point.score}%
              </Typography>
              <Box
                className={classes.trendBarFill}
                style={{ height: `${heightPct}%`, backgroundColor: `${color}30` }}
              />
              <Typography className={classes.trendLabel}>{point.date}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const ScanRow = ({ scan, isLatest }: { scan: ComplianceScan; isLatest: boolean }) => {
  const classes = useStyles();
  const status = getScanStatus(scan, isLatest);

  return (
    <TableRow className={isLatest ? classes.row : classes.rowSuperseded}>
      <TableCell>
        <Typography style={{ fontWeight: 500, fontSize: 13 }}>{scan.startedAt}</Typography>
        <Typography className={classes.scanMeta}>
          {scan.hostsScanned} hosts scanned
          <span style={{ color: '#ccc' }}>·</span>
          <Chip
            size="small"
            variant="outlined"
            label={scan.triggeredBy === 'scheduled' ? 'Scheduled' : 'Manual'}
            style={{ fontSize: 10, height: 18, fontWeight: 500 }}
          />
        </Typography>
      </TableCell>
      <TableCell>
        {scan.complianceScore !== null ? (
          <Typography style={{ fontWeight: 600, fontSize: 14 }}>
            {scan.complianceScore}%
          </Typography>
        ) : (
          <Typography style={{ color: statusColors.pending, fontSize: 13 }}>—</Typography>
        )}
      </TableCell>
      <TableCell>
        {scan.rulesFailing > 0 ? (
          <Typography style={{ fontWeight: 600, fontSize: 13, color: statusColors.error }}>
            {scan.rulesFailing} of {scan.rulesEvaluated}
          </Typography>
        ) : scan.status === 'completed' ? (
          <Typography style={{ fontSize: 13, color: statusColors.success, fontWeight: 500 }}>
            0 of {scan.rulesEvaluated}
          </Typography>
        ) : (
          <Typography style={{ color: statusColors.pending, fontSize: 13 }}>—</Typography>
        )}
      </TableCell>
      <TableCell>
        <Box className={classes.statusCell}>
          {status.icon}
          <Typography style={{ fontSize: 13, fontWeight: 600, color: status.color }}>
            {status.label}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export const ProfileHistoryContent = ({ profileId }: { profileId: string }) => {
  const classes = useStyles();
  const scans = getProfileScans(profileId);

  return (
    <>
      <TrendChart profileId={profileId} />

      <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        Scan history
      </Typography>

      {scans.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
            No scans have been run for this profile yet.
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell style={{ width: 80 }}>Score</TableCell>
                <TableCell style={{ width: 110 }}>Failing rules</TableCell>
                <TableCell style={{ width: 160 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scans.map((scan, i) => (
                <ScanRow key={scan.scanId} scan={scan} isLatest={i === 0} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};
