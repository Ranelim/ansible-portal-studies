import { useMemo, useState } from 'react';
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
  Collapse,
  IconButton,
  makeStyles,
  FormControlLabel,
  Switch,
} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import { statusColors } from '../common/statusColors';
import { getProfileHostSummary, getHostFindings, getProfile } from './complianceDemoData';

interface HostsContentProps {
  profileId: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  'CAT I': statusColors.error,
  'CAT II': statusColors.warning,
  'CAT III': statusColors.info,
};

const useStyles = makeStyles(theme => ({
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
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
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  expandRow: {
    '& > td': {
      padding: 0,
      borderBottom: 'none',
    },
  },
  hostname: {
    fontWeight: 600,
    fontSize: 14,
  },
  severityBar: {
    display: 'flex',
    gap: theme.spacing(0.5),
    alignItems: 'center',
  },
  findingsPanel: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  findingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(0.75, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  findingTitle: {
    fontSize: 13,
    flex: 1,
  },
  findingSeverity: {
    fontSize: 11,
    fontWeight: 600,
    minWidth: 44,
  },
  findingId: {
    fontSize: 11,
    color: theme.palette.text.secondary,
    minWidth: 90,
    fontFamily: 'monospace',
  },
  statusIcon: {
    fontSize: 16,
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
}));

const HostRow = ({
  hostname,
  issues,
  profileId,
  showPassingHosts,
}: {
  hostname: string;
  issues: { critical: number; high: number; low: number; total: number };
  profileId: string;
  showPassingHosts: boolean;
}) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);

  const hostFindings = useMemo(
    () => expanded ? getHostFindings(profileId, hostname) : [],
    [expanded, profileId, hostname],
  );

  const failingFindings = hostFindings.filter(f => f.hostStatus === 'fail');
  const passingFindings = hostFindings.filter(f => f.hostStatus === 'pass');

  return (
    <>
      <TableRow className={classes.row} onClick={() => setExpanded(!expanded)}>
        <TableCell style={{ width: 40, padding: '8px' }}>
          <IconButton size="small">
            {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography className={classes.hostname}>{hostname}</Typography>
        </TableCell>
        <TableCell>
          <Typography
            style={{
              fontWeight: 600,
              color: issues.total > 0 ? statusColors.error : statusColors.success,
            }}
          >
            {issues.total}
          </Typography>
        </TableCell>
        <TableCell>
          <Box className={classes.severityBar}>
            {issues.critical > 0 && (
              <Chip
                size="small"
                label={`${issues.critical} Critical`}
                style={{
                  backgroundColor: `${statusColors.error}15`,
                  color: statusColors.error,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 20,
                }}
              />
            )}
            {issues.high > 0 && (
              <Chip
                size="small"
                label={`${issues.high} High`}
                style={{
                  backgroundColor: `${statusColors.warning}15`,
                  color: statusColors.warning,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 20,
                }}
              />
            )}
            {issues.low > 0 && (
              <Chip
                size="small"
                label={`${issues.low} Low`}
                style={{
                  backgroundColor: `${statusColors.info}15`,
                  color: statusColors.info,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 20,
                }}
              />
            )}
            {issues.total === 0 && (
              <Chip
                size="small"
                label="Compliant"
                style={{
                  backgroundColor: `${statusColors.success}15`,
                  color: statusColors.success,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 20,
                }}
              />
            )}
          </Box>
        </TableCell>
      </TableRow>
      <TableRow className={classes.expandRow}>
        <TableCell colSpan={4}>
          <Collapse in={expanded}>
            <Box className={classes.findingsPanel}>
              {failingFindings.length > 0 && (
                <Box mb={passingFindings.length > 0 && showPassingHosts ? 2 : 0}>
                  <Typography
                    variant="body2"
                    style={{ fontWeight: 600, marginBottom: 8, color: statusColors.error }}
                  >
                    Failing rules ({failingFindings.length})
                  </Typography>
                  {failingFindings.map(f => (
                    <Box key={f.ruleId} className={classes.findingRow}>
                      <ErrorOutlineIcon
                        className={classes.statusIcon}
                        style={{ color: statusColors.error }}
                      />
                      <Typography className={classes.findingId}>{f.ruleId}</Typography>
                      <Typography
                        className={classes.findingSeverity}
                        style={{ color: SEVERITY_COLORS[f.severity] || statusColors.info }}
                      >
                        {f.severity}
                      </Typography>
                      <Typography className={classes.findingTitle}>{f.title}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {passingFindings.length > 0 && showPassingHosts && (
                <Box>
                  <Typography
                    variant="body2"
                    style={{ fontWeight: 600, marginBottom: 8, color: statusColors.success }}
                  >
                    Passing rules ({passingFindings.length})
                  </Typography>
                  {passingFindings.slice(0, 5).map(f => (
                    <Box key={f.ruleId} className={classes.findingRow}>
                      <CheckCircleOutlineIcon
                        className={classes.statusIcon}
                        style={{ color: statusColors.success }}
                      />
                      <Typography className={classes.findingId}>{f.ruleId}</Typography>
                      <Typography className={classes.findingTitle}>{f.title}</Typography>
                    </Box>
                  ))}
                  {passingFindings.length > 5 && (
                    <Typography
                      variant="body2"
                      style={{ color: statusColors.success, marginTop: 4, fontSize: 12 }}
                    >
                      + {passingFindings.length - 5} more passing rules
                    </Typography>
                  )}
                </Box>
              )}
              {failingFindings.length === 0 && (
                <Typography variant="body2" style={{ color: statusColors.success }}>
                  All rules passing on this host
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const HostsContent = ({ profileId }: HostsContentProps) => {
  const classes = useStyles();
  const [showPassing, setShowPassing] = useState(false);

  const profile = getProfile(profileId);
  const hostMap = getProfileHostSummary(profileId);

  const allHosts = useMemo(() => {
    const hostsFromMap = Array.from(hostMap.entries()).map(([hostname, issues]) => ({
      hostname,
      issues,
    }));

    if (showPassing && profile) {
      const existingHostnames = new Set(hostsFromMap.map(h => h.hostname));
      for (let i = 1; i <= profile.hostCount; i++) {
        const name = `${profile.inventoryName.toLowerCase().replace(/\s/g, '-')}-host-${i.toString().padStart(2, '0')}`;
        if (!existingHostnames.has(name)) {
          hostsFromMap.push({ hostname: name, issues: { critical: 0, high: 0, low: 0, total: 0 } });
        }
      }
    }

    return hostsFromMap.sort((a, b) => {
      if (a.issues.critical !== b.issues.critical) return b.issues.critical - a.issues.critical;
      if (a.issues.total !== b.issues.total) return b.issues.total - a.issues.total;
      return a.hostname.localeCompare(b.hostname);
    });
  }, [hostMap, showPassing, profile]);

  const hostsWithIssues = allHosts.filter(h => h.issues.total > 0);

  return (
    <Box>
      <Box className={classes.toolbar}>
        <Typography variant="body2" style={{ color: statusColors.pending }}>
          {hostsWithIssues.length} of {profile?.hostCount ?? 0} hosts have issues
        </Typography>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showPassing}
              onChange={() => setShowPassing(!showPassing)}
              color="primary"
            />
          }
          label={<Typography variant="body2">Show compliant hosts</Typography>}
        />
      </Box>

      {allHosts.length > 0 ? (
        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: 40 }} />
                <TableCell>Host</TableCell>
                <TableCell>Issues</TableCell>
                <TableCell>Severity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allHosts.map(({ hostname, issues }) => (
                <HostRow
                  key={hostname}
                  hostname={hostname}
                  issues={issues}
                  profileId={profileId}
                  showPassingHosts={showPassing}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography className={classes.emptyState}>
          No host results available. Run a scan to see per-host compliance details.
        </Typography>
      )}
    </Box>
  );
};
