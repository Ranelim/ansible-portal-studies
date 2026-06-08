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
import { statusColors } from '../common/statusColors';
import {
  getProfile,
  getProfileScans,
  type ComplianceScan,
  type ScanType,
  type ScanStatus,
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
}));

const SCAN_TYPE_CONFIG: Record<ScanType, { label: string; color: string }> = {
  assessment: { label: 'Assessment', color: statusColors.info },
  remediation: { label: 'Remediation', color: statusColors.warning },
  verification: { label: 'Verification', color: statusColors.custom },
};

const SCAN_STATUS_CONFIG: Record<ScanStatus, { label: string; color: string }> = {
  running: { label: 'Running', color: statusColors.warning },
  completed: { label: 'Completed', color: statusColors.success },
  failed: { label: 'Failed', color: statusColors.error },
};

function getScoreColor(score: number): string {
  if (score >= 90) return statusColors.success;
  if (score >= 70) return statusColors.warning;
  return statusColors.error;
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

const ScanRow = ({ scan }: { scan: ComplianceScan }) => {
  const classes = useStyles();
  const typeCfg = SCAN_TYPE_CONFIG[scan.scanType];
  const statusCfg = SCAN_STATUS_CONFIG[scan.status];

  return (
    <TableRow className={classes.row}>
      <TableCell>
        <Chip
          size="small"
          label={typeCfg.label}
          style={{
            backgroundColor: `${typeCfg.color}18`,
            color: typeCfg.color,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      </TableCell>
      <TableCell>
        <Chip
          size="small"
          variant="outlined"
          label={scan.triggeredBy === 'scheduled' ? 'Scheduled' : 'Manual'}
          style={{ fontSize: 11, height: 20 }}
        />
      </TableCell>
      <TableCell>{scan.startedAt}</TableCell>
      <TableCell>
        {scan.complianceScore !== null ? (
          <Typography style={{ fontWeight: 600, fontSize: 13 }}>
            {scan.complianceScore}%
          </Typography>
        ) : (
          <Typography style={{ color: statusColors.pending, fontSize: 13 }}>—</Typography>
        )}
      </TableCell>
      <TableCell>{scan.duration}</TableCell>
      <TableCell>
        <Chip
          size="small"
          label={statusCfg.label}
          style={{
            backgroundColor: `${statusCfg.color}18`,
            color: statusCfg.color,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
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
                <TableCell>Type</TableCell>
                <TableCell>Trigger</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scans.map(scan => (
                <ScanRow key={scan.scanId} scan={scan} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};
