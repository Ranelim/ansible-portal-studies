import {
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
import { COMPLIANCE_SCANS, type ComplianceScan, type ScanType, type ScanStatus } from './complianceDemoData';

const useStyles = makeStyles(theme => ({
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
        <Typography style={{ fontWeight: 500, fontSize: 13 }}>{scan.profileName}</Typography>
        <Typography style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{scan.inventoryName}</Typography>
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

export const ScanHistoryContent = () => {
  const classes = useStyles();

  return (
    <TableContainer>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Profile</TableCell>
            <TableCell>Trigger</TableCell>
            <TableCell>Started</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {COMPLIANCE_SCANS.map(scan => (
            <ScanRow key={scan.scanId} scan={scan} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
