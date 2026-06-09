import { useState } from 'react';
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
  Checkbox,
  Button,
  FormControlLabel,
  Switch,
  Popover,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import BuildIcon from '@material-ui/icons/Build';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { statusColors } from '../common/statusColors';
import {
  getProfileFindings,
  type ComplianceRule,
  type StigSeverity,
  type ProfileStatus,
} from './complianceDemoData';

const useStyles = makeStyles(theme => ({
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    gap: theme.spacing(2),
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  table: {
    '& .MuiTableCell-head': {
      fontWeight: 600,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: theme.palette.text.secondary,
      borderBottom: `2px solid ${theme.palette.divider}`,
      padding: theme.spacing(1, 2),
    },
    '& .MuiTableCell-body': {
      padding: theme.spacing(1, 2),
      fontSize: 13,
    },
  },
  row: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  expandedContent: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2, 3),
  },
  hostGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: theme.spacing(1),
  },
  hostRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 1.5),
    borderRadius: 4,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    fontSize: 13,
  },
  hostName: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 500,
    flex: 1,
  },
  expectedActual: {
    fontSize: 11,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  remediationBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    borderRadius: 4,
    marginBottom: theme.spacing(2),
  },
  passBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.palette.divider,
    flex: 1,
    overflow: 'hidden',
  },
  passBarFill: {
    height: '100%',
    borderRadius: 3,
  },
}));

const SEVERITY_CONFIG: Record<StigSeverity, { label: string; color: string; bg: string; tooltip: string }> = {
  'CAT I': {
    label: 'Critical',
    color: statusColors.error,
    bg: `${statusColors.error}15`,
    tooltip: 'CAT I — Critical severity. Could directly cause loss of confidentiality, availability, or integrity.',
  },
  'CAT II': {
    label: 'High',
    color: statusColors.warning,
    bg: `${statusColors.warning}15`,
    tooltip: 'CAT II — High severity. Could lead to degradation of security posture if not addressed.',
  },
  'CAT III': {
    label: 'Low',
    color: statusColors.info,
    bg: `${statusColors.info}15`,
    tooltip: 'CAT III — Low severity. Could marginally reduce security posture.',
  },
};

const HostsCell = ({ rule }: { rule: ComplianceRule }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const pct = rule.totalHosts > 0 ? (rule.passCount / rule.totalHosts) * 100 : 0;
  const barColor = pct === 100 ? statusColors.success : pct >= 70 ? statusColors.warning : statusColors.error;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const passingHosts = rule.hostResults.filter(h => h.status === 'pass');
  const failingHosts = rule.hostResults.filter(h => h.status === 'fail');

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        style={{ gap: 6, cursor: 'pointer' }}
        onClick={handleClick}
      >
        {rule.failCount > 0 && (
          <Chip
            size="small"
            label={`${rule.failCount} fail`}
            style={{ backgroundColor: `${statusColors.error}15`, color: statusColors.error, fontWeight: 600, fontSize: 10, height: 20 }}
          />
        )}
        {rule.passCount > 0 && (
          <Chip
            size="small"
            label={`${rule.passCount} pass`}
            style={{ backgroundColor: `${statusColors.success}15`, color: statusColors.success, fontWeight: 600, fontSize: 10, height: 20 }}
          />
        )}
        <Box className={classes.passBar} style={{ maxWidth: 60 }}>
          <Box className={classes.passBarFill} style={{ width: `${pct}%`, backgroundColor: barColor }} />
        </Box>
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={(e: React.SyntheticEvent) => { e.stopPropagation(); setAnchorEl(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ style: { borderRadius: 8, padding: 12, maxWidth: 300 } }}
      >
        <Typography style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          {rule.totalHosts} hosts · {rule.passCount} passing · {rule.failCount} failing
        </Typography>
        {failingHosts.length > 0 && (
          <Box marginBottom={passingHosts.length > 0 ? 1 : 0}>
            {failingHosts.map(h => (
              <Box key={h.hostname} display="flex" alignItems="center" style={{ gap: 6, marginBottom: 4 }}>
                <CancelIcon style={{ fontSize: 14, color: statusColors.error }} />
                <Typography style={{ fontSize: 12, fontFamily: 'monospace' }}>{h.hostname}</Typography>
              </Box>
            ))}
          </Box>
        )}
        {passingHosts.length > 0 && (
          <Box>
            {passingHosts.map(h => (
              <Box key={h.hostname} display="flex" alignItems="center" style={{ gap: 6, marginBottom: 4 }}>
                <CheckCircleIcon style={{ fontSize: 14, color: statusColors.success }} />
                <Typography style={{ fontSize: 12, fontFamily: 'monospace' }}>{h.hostname}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Popover>
    </>
  );
};

const RuleRow = ({
  rule,
  selected,
  onToggle,
}: {
  rule: ComplianceRule;
  selected: boolean;
  onToggle: () => void;
}) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const sevCfg = SEVERITY_CONFIG[rule.severity];

  return (
    <>
      <TableRow className={classes.row} onClick={() => setExpanded(!expanded)} style={rule.failCount === 0 ? { opacity: 0.4 } : undefined}>
        <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
          {rule.failCount > 0 && (
            <Checkbox
              checked={selected}
              onChange={onToggle}
              size="small"
              color="primary"
            />
          )}
        </TableCell>
        <TableCell style={{ width: 32, padding: '8px 0 8px 8px' }}>
          <IconButton size="small" style={{ padding: 2 }}>
            {expanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Tooltip title={sevCfg.tooltip} arrow placement="top">
            <Chip
              size="small"
              label={sevCfg.label}
              style={{
                backgroundColor: sevCfg.bg,
                color: sevCfg.color,
                fontWeight: 700,
                fontSize: 11,
                height: 22,
                cursor: 'help',
              }}
            />
          </Tooltip>
        </TableCell>
        <TableCell>
          <Typography style={{ fontWeight: 500, fontSize: 13 }}>{rule.title}</Typography>
          <Typography style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
            STIG: {rule.ruleId}
          </Typography>
        </TableCell>
        <TableCell>{rule.category}</TableCell>
        <TableCell>
          <HostsCell rule={rule} />
        </TableCell>
        <TableCell>
          {rule.failCount > 0 ? (
            <Typography style={{ color: statusColors.error, fontWeight: 600, fontSize: 13 }}>
              {rule.failCount} failing
            </Typography>
          ) : (
            <Typography style={{ color: statusColors.success, fontSize: 13 }}>
              All passing
            </Typography>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} style={{ padding: 0, borderBottom: expanded ? undefined : 'none' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box className={classes.expandedContent}>
              <Typography style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                {rule.description}
              </Typography>
              <Box className={classes.hostGrid}>
                {rule.hostResults.map(host => (
                  <Box key={host.hostname} className={classes.hostRow}>
                    {host.status === 'pass' ? (
                      <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                    ) : (
                      <CancelIcon style={{ fontSize: 16, color: statusColors.error }} />
                    )}
                    <Box flex={1}>
                      <Typography className={classes.hostName}>{host.hostname}</Typography>
                      {host.expected && (
                        <Typography className={classes.expectedActual}>
                          Expected: <strong>{host.expected}</strong> · Actual: <strong>{host.actual}</strong>
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const FindingsContent = ({
  profileId,
  profileStatus,
}: {
  profileId: string;
  profileStatus: ProfileStatus;
}) => {
  const classes = useStyles();
  const allRules = getProfileFindings(profileId);
  const [showPassing, setShowPassing] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());

  const failingRules = allRules.filter(r => r.failCount > 0);
  const passingRules = allRules.filter(r => r.failCount === 0);
  const displayedRules = showPassing ? allRules : failingRules;

  const toggleRule = (ruleId: string) => {
    setSelectedRules(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  };

  const selectAllFailing = () => {
    if (selectedRules.size === failingRules.length) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(failingRules.map(r => r.ruleId)));
    }
  };

  const isRemediating = profileStatus === 'remediation-in-progress';

  return (
    <>
      {isRemediating && (
        <Box
          className={classes.remediationBanner}
          style={{ backgroundColor: `${statusColors.warning}12`, border: `1px solid ${statusColors.warning}40` }}
        >
          <BuildIcon style={{ color: statusColors.warning, fontSize: 20 }} />
          <Typography style={{ flex: 1, fontSize: 13 }}>
            Remediation in progress — 4 rules being addressed across 5 hosts.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            style={{ textTransform: 'none', fontSize: 12 }}
          >
            View progress
          </Button>
        </Box>
      )}

      <Box className={classes.toolbar}>
        <Box className={classes.toolbarLeft}>
          <FormControlLabel
            control={
              <Switch
                checked={showPassing}
                onChange={() => setShowPassing(!showPassing)}
                size="small"
                color="primary"
              />
            }
            label={
              <Typography style={{ fontSize: 13 }}>
                Show passing rules ({passingRules.length})
              </Typography>
            }
          />
        </Box>
        {selectedRules.size > 0 && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PlayArrowIcon />}
            style={{ textTransform: 'none', fontWeight: 600 }}
          >
            Remediate {selectedRules.size} {selectedRules.size === 1 ? 'rule' : 'rules'}
          </Button>
        )}
        {selectedRules.size === 0 && failingRules.length > 0 && !isRemediating && (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<PlayArrowIcon />}
            style={{ textTransform: 'none' }}
            onClick={selectAllFailing}
          >
            Select all failing rules
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                {failingRules.length > 0 && (
                  <Checkbox
                    checked={selectedRules.size === failingRules.length && failingRules.length > 0}
                    indeterminate={selectedRules.size > 0 && selectedRules.size < failingRules.length}
                    onChange={selectAllFailing}
                    size="small"
                    color="primary"
                  />
                )}
              </TableCell>
              <TableCell style={{ width: 32 }} />
              <TableCell style={{ width: 80 }}>Severity</TableCell>
              <TableCell>Rule</TableCell>
              <TableCell>Category</TableCell>
              <TableCell style={{ width: 180 }}>Hosts</TableCell>
              <TableCell style={{ width: 100 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(displayedRules as ComplianceRule[]).map(rule => (
              <RuleRow
                key={rule.ruleId}
                rule={rule}
                selected={selectedRules.has(rule.ruleId)}
                onToggle={() => toggleRule(rule.ruleId)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!showPassing && passingRules.length > 0 && (
        <Box textAlign="center" py={2}>
          <Typography style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
            {passingRules.length} passing {passingRules.length === 1 ? 'rule' : 'rules'} hidden ·{' '}
            <span
              style={{ color: statusColors.info, cursor: 'pointer' }}
              onClick={() => setShowPassing(true)}
            >
              Show all
            </span>
          </Typography>
        </Box>
      )}
    </>
  );
};
