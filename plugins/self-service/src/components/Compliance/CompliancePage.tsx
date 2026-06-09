import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Collapse,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  makeStyles,
} from '@material-ui/core';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import LoopIcon from '@material-ui/icons/Loop';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import AddIcon from '@material-ui/icons/Add';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import EditIcon from '@material-ui/icons/Edit';
import SecurityIcon from '@material-ui/icons/Security';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import { statusColors } from '../common/statusColors';
import {
  INVENTORIES,
  COMPLIANCE_SCANS,
  PROFILE_DEFINITIONS,
  getScan,
  getProfile,
  getProfileScans,
  getProfileHostSummary,
  getInventoryProfiles,
  getInventoryIssueSummary,
  getProfileIssueSeverity,
  getFleetSummary,
  type Inventory,
  type ComplianceProfile,
  type ComplianceScan,
  type ComplianceFramework,
  type ProfileStatus,
  type ProfileDefinition,
} from './complianceDemoData';
import { CompliancePipeline, STEP_DEFINITIONS } from './CompliancePipeline';
import { FindingsContent } from './FindingsContent';
import { NewScanWizard } from './NewScanWizard';

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const SEVERITY_COLORS = {
  critical: statusColors.error,
  high: statusColors.warning,
  low: statusColors.info,
};


// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const tabs = [
  { id: 'inventories', label: 'Inventories' },
  { id: 'scans', label: 'Scans' },
  { id: 'profiles', label: 'Profiles' },
];

const getTabIndex = (pathname: string): number => {
  if (pathname.includes('/compliance/profile')) return 2;
  if (pathname.includes('/compliance/scans') || pathname.includes('/compliance/scan/')) return 1;
  return 0;
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles(theme => ({
  // Fleet summary
  summarySection: { marginBottom: theme.spacing(2.5) },
  issuesRow: { display: 'flex', alignItems: 'center', gap: theme.spacing(1.5), marginBottom: theme.spacing(1) },
  issuesCount: { fontSize: 26, fontWeight: 700, lineHeight: 1 },
  issuesLabel: { fontSize: 14, color: theme.palette.text.secondary },
  severityChips: { display: 'flex', gap: theme.spacing(0.75), flexWrap: 'wrap', marginBottom: theme.spacing(1) },
  metaRow: { display: 'flex', gap: theme.spacing(3), alignItems: 'center' },
  metaItem: { display: 'flex', alignItems: 'baseline', gap: theme.spacing(0.5) },
  metaValue: { fontSize: 14, fontWeight: 600 },
  metaLabel: { fontSize: 13, color: theme.palette.text.secondary },
  helpIcon: { fontSize: 15, color: theme.palette.text.disabled, cursor: 'help', marginLeft: 4, verticalAlign: 'middle', '&:hover': { color: theme.palette.text.secondary } },
  tooltip: { maxWidth: 360, fontSize: 12, lineHeight: 1.5, padding: theme.spacing(1.5) },

  // Inventory table
  table: {
    '& .MuiTableCell-head': { fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.palette.text.secondary, borderBottom: `2px solid ${theme.palette.divider}`, padding: theme.spacing(1.5, 2) },
    '& .MuiTableCell-body': { padding: theme.spacing(1.5, 2), fontSize: 13 },
  },
  invRow: { cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } },
  expandRow: { '& > td': { padding: 0, borderBottom: 'none' } },
  invName: { fontWeight: 600, fontSize: 14 },
  invMeta: { fontSize: 12, color: theme.palette.text.secondary, marginTop: 1 },
  severityInline: { display: 'flex', gap: theme.spacing(0.5), flexWrap: 'wrap', alignItems: 'center' },
  compliantLabel: { fontSize: 12, fontWeight: 600, color: statusColors.success, display: 'flex', alignItems: 'center', gap: 4 },

  // Profile sub-rows inside accordion
  profilePanel: { backgroundColor: theme.palette.background.default, borderBottom: `1px solid ${theme.palette.divider}` },
  profileHeader: {
    display: 'flex', alignItems: 'center', gap: theme.spacing(2),
    padding: theme.spacing(0.75, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  profileHeaderLabel: {
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5,
    color: theme.palette.text.secondary,
  },
  profileRow: {
    display: 'flex', alignItems: 'center', gap: theme.spacing(2),
    padding: theme.spacing(1.25, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
  },
  profileFramework: { fontWeight: 600, fontSize: 13, minWidth: 160 },
  profileScore: { fontSize: 14, fontWeight: 700, minWidth: 50 },
  profileIssues: { display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap', alignItems: 'center' },
  pipelineRunning: { fontSize: 12, animation: '$spin 1.2s linear infinite' },
  '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },

  // Scan history
  scanRow: {
    cursor: 'pointer',
    '&:hover': { backgroundColor: theme.palette.action.hover },
  },
  scanSuperseded: {
    cursor: 'pointer',
    opacity: 0.4,
    '&:hover': { opacity: 0.6, backgroundColor: theme.palette.action.hover },
  },
  scanIdentity: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  scanProfileName: {
    fontWeight: 600,
    fontSize: 14,
    color: theme.palette.primary.main,
  },
  scanMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  scanStatusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  // Inline scan detail
  scanDetailBack: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    color: theme.palette.text.secondary,
    cursor: 'pointer',
    marginBottom: theme.spacing(2),
    '&:hover': { color: theme.palette.primary.main },
  },
  scanDetailTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 2,
  },
  scanDetailMeta: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  scanSummaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
  scanSummaryLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.25),
  },
  scanBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    borderRadius: 4,
    marginBottom: theme.spacing(2),
  },
  scanHostAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: theme.spacing(2),
    transition: 'background-color 0.15s ease',
    '&:hover': { filter: 'brightness(0.95)' },
  },
  spinningIcon: {
    animation: '$spin 1.2s linear infinite',
  },

  // Profile tab
  profileCard: {
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    '&:hover': {
      borderColor: '#b8bbbe',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
  },
  profileCardName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#151515',
  },
  profileCardMeta: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 2,
  },
  profileDetailSection: {
    marginBottom: 20,
  },
  profileDetailLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(0,0,0,0.45)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileDetailValue: {
    fontSize: 13,
    color: '#151515',
    lineHeight: 1.6,
  },
}));

// ---------------------------------------------------------------------------
// Profile sub-row (inside inventory accordion)
// ---------------------------------------------------------------------------

const ProfileSubRow = ({ profile }: { profile: ComplianceProfile }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const breakdown = getProfileIssueSeverity(profile.id);

  const currentScan = getProfileScans(profile.id).find(s => s.isCurrent);
  const scanRoute = currentScan
    ? `/self-service/compliance/scan/${currentScan.scanId}`
    : '/self-service/compliance';

  function scoreColor(score: number | null) {
    if (score === null) return statusColors.pending;
    if (score >= 90) return statusColors.success;
    if (score >= 70) return statusColors.warning;
    return statusColors.error;
  }

  return (
    <Box
      className={classes.profileRow}
      onClick={() => navigate(scanRoute)}
    >
      <Typography className={classes.profileFramework}>
        {profile.framework} {profile.frameworkVersion}
      </Typography>

      <Box display="flex" alignItems="center" style={{ minWidth: 80, gap: 4 }}>
        <Typography className={classes.profileScore} style={{ color: scoreColor(profile.complianceScore) }}>
          {profile.complianceScore !== null ? `${profile.complianceScore}%` : '—'}
        </Typography>
        {profile.trend !== null && profile.trend !== 0 && (
          <Typography style={{
            fontSize: 10,
            fontWeight: 600,
            color: profile.trend > 0 ? statusColors.success : statusColors.error,
            lineHeight: 1,
          }}>
            {profile.trend > 0 ? `▲ +${profile.trend}` : `▼ ${profile.trend}`}
          </Typography>
        )}
      </Box>

      <Box className={classes.profileIssues}>
        {breakdown.total > 0 ? (
          <>
            {breakdown.critical > 0 && <Chip size="small" label={`${breakdown.critical} Critical`} style={{ backgroundColor: `${SEVERITY_COLORS.critical}15`, color: SEVERITY_COLORS.critical, fontWeight: 600, fontSize: 10, height: 20 }} />}
            {breakdown.high > 0 && <Chip size="small" label={`${breakdown.high} High`} style={{ backgroundColor: `${SEVERITY_COLORS.high}15`, color: SEVERITY_COLORS.high, fontWeight: 600, fontSize: 10, height: 20 }} />}
            {breakdown.low > 0 && <Chip size="small" label={`${breakdown.low} Low`} style={{ backgroundColor: `${SEVERITY_COLORS.low}15`, color: SEVERITY_COLORS.low, fontWeight: 600, fontSize: 10, height: 20 }} />}
          </>
        ) : profile.complianceScore !== null ? (
          <Typography className={classes.compliantLabel} style={{ fontSize: 11 }}>
            <CheckCircleIcon style={{ fontSize: 13 }} /> Compliant
          </Typography>
        ) : null}
      </Box>

      <Typography style={{ fontSize: 12, color: statusColors.pending, minWidth: 120 }}>
        {currentScan?.startedAt ?? profile.lastAssessedAt ?? '—'}
      </Typography>

      <Typography
        style={{
          fontSize: 12,
          color: statusColors.info,
          fontWeight: 500,
          minWidth: 80,
          textAlign: 'right',
          cursor: 'pointer',
        }}
      >
        View scan →
      </Typography>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Inventory accordion row
// ---------------------------------------------------------------------------

const InventoryAccordionRow = ({ inventory }: { inventory: Inventory }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);

  const profiles = useMemo(() => getInventoryProfiles(inventory.id), [inventory.id]);
  const issueSummary = useMemo(() => getInventoryIssueSummary(inventory.id), [inventory.id]);
  const hasIssues = issueSummary.total > 0;

  return (
    <>
      <TableRow className={classes.invRow} onClick={() => setExpanded(!expanded)}>
        <TableCell style={{ width: 36, padding: '8px' }}>
          <IconButton size="small">
            {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography className={classes.invName}>{inventory.name}</Typography>
          <Typography className={classes.invMeta}>
            {inventory.hostCount} hosts · {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}
          </Typography>
        </TableCell>
        <TableCell>
          {hasIssues ? (
            <Box className={classes.severityInline}>
              {issueSummary.critical > 0 && <Chip size="small" label={`${issueSummary.critical} Critical`} style={{ backgroundColor: `${SEVERITY_COLORS.critical}15`, color: SEVERITY_COLORS.critical, fontWeight: 600, fontSize: 11, height: 22 }} />}
              {issueSummary.high > 0 && <Chip size="small" label={`${issueSummary.high} High`} style={{ backgroundColor: `${SEVERITY_COLORS.high}15`, color: SEVERITY_COLORS.high, fontWeight: 600, fontSize: 11, height: 22 }} />}
              {issueSummary.low > 0 && <Chip size="small" label={`${issueSummary.low} Low`} style={{ backgroundColor: `${SEVERITY_COLORS.low}15`, color: SEVERITY_COLORS.low, fontWeight: 600, fontSize: 11, height: 22 }} />}
            </Box>
          ) : (
            <Typography className={classes.compliantLabel}>
              <CheckCircleIcon style={{ fontSize: 14 }} /> Compliant
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography style={{ fontSize: 12, color: statusColors.pending }}>
            {profiles[0]?.lastAssessedAt ?? '—'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow className={classes.expandRow}>
        <TableCell colSpan={4}>
          <Collapse in={expanded}>
            <Box className={classes.profilePanel}>
              <Box className={classes.profileHeader}>
                <Typography className={classes.profileHeaderLabel} style={{ minWidth: 160 }}>Profile</Typography>
                <Typography className={classes.profileHeaderLabel} style={{ minWidth: 50 }}>Score</Typography>
                <Typography className={classes.profileHeaderLabel} style={{ flex: 1 }}>Issues</Typography>
                <Typography className={classes.profileHeaderLabel} style={{ minWidth: 120 }}>Last scanned</Typography>
                <Box minWidth={80} />
              </Box>
              {profiles.map(p => (
                <ProfileSubRow key={p.id} profile={p} />
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ---------------------------------------------------------------------------
// Fleet summary bar
// ---------------------------------------------------------------------------

const FleetSummary = () => {
  const classes = useStyles();
  const fleet = getFleetSummary();

  const segments = [
    { key: 'critical', label: 'Critical', count: fleet.bySeverity.critical, color: SEVERITY_COLORS.critical },
    { key: 'high', label: 'High', count: fleet.bySeverity.high, color: SEVERITY_COLORS.high },
    { key: 'low', label: 'Low', count: fleet.bySeverity.low, color: SEVERITY_COLORS.low },
  ].filter(s => s.count > 0);

  return (
    <Box className={classes.summarySection}>
      <Box className={classes.issuesRow}>
        <Typography className={classes.issuesCount} style={{ color: fleet.totalIssues > 0 ? statusColors.error : statusColors.success }}>
          {fleet.totalIssues}
        </Typography>
        <Typography className={classes.issuesLabel}>
          {fleet.totalIssues === 1 ? 'issue' : 'issues'} across {fleet.totalInventories} inventories
        </Typography>
        <Tooltip
          classes={{ tooltip: classes.tooltip }}
          title={
            <>
              <strong>How this page works</strong>
              <br /><br />
              Each inventory can be scanned against one or more compliance standards (profiles). Expand an inventory to see per-profile results.
              <br /><br />
              Issues reflect the latest completed scan for each profile. When a new scan runs and a rule passes, the issue is automatically removed.
            </>
          }
          placement="bottom-start"
          interactive
        >
          <HelpOutlineIcon className={classes.helpIcon} />
        </Tooltip>
      </Box>

      <Box className={classes.severityChips}>
        {segments.map(seg => (
          <Chip key={seg.key} size="small" label={`${seg.count} ${seg.label}`} style={{ backgroundColor: `${seg.color}15`, color: seg.color, fontWeight: 600, fontSize: 12 }} />
        ))}
      </Box>

      <Box className={classes.metaRow}>
        <Box className={classes.metaItem}>
          <Typography className={classes.metaValue}>{fleet.totalHosts}</Typography>
          <Typography className={classes.metaLabel}>hosts</Typography>
        </Box>
        <Box className={classes.metaItem}>
          <Typography className={classes.metaValue}>{fleet.totalProfiles}</Typography>
          <Typography className={classes.metaLabel}>profiles</Typography>
        </Box>
        <Box className={classes.metaItem}>
          <Typography className={classes.metaValue}>{fleet.averageCompliance}%</Typography>
          <Typography className={classes.metaLabel}>avg. compliance</Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Inventories content
// ---------------------------------------------------------------------------

const InventoriesContent = () => {
  const classes = useStyles();

  const sortedInventories = useMemo(() => {
    return [...INVENTORIES].sort((a, b) => {
      const aSum = getInventoryIssueSummary(a.id);
      const bSum = getInventoryIssueSummary(b.id);
      if (aSum.critical !== bSum.critical) return bSum.critical - aSum.critical;
      if (aSum.total !== bSum.total) return bSum.total - aSum.total;
      return a.name.localeCompare(b.name);
    });
  }, []);

  return (
    <TableContainer>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: 36 }} />
            <TableCell>Inventory</TableCell>
            <TableCell>Issues</TableCell>
            <TableCell style={{ width: 130 }}>Last scanned</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedInventories.map(inv => (
            <InventoryAccordionRow key={inv.id} inventory={inv} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ---------------------------------------------------------------------------
// Scan history content
// ---------------------------------------------------------------------------

const ScanWorkflow = ({ scan }: { scan: ComplianceScan }) => {
  const classes = useStyles();

  if (scan.status === 'failed') {
    return (
      <Box className={classes.scanStatusCell}>
        <ErrorIcon style={{ fontSize: 16, color: statusColors.error }} />
        <Typography style={{ fontSize: 13, fontWeight: 600, color: statusColors.error }}>Failed</Typography>
      </Box>
    );
  }
  if (scan.status === 'running') {
    return (
      <Box className={classes.scanStatusCell}>
        <LoopIcon style={{ fontSize: 16, color: statusColors.warning }} className={classes.pipelineRunning} />
        <Typography style={{ fontSize: 13, fontWeight: 600, color: statusColors.warning }}>Scanning</Typography>
      </Box>
    );
  }
  if (!scan.isCurrent) {
    return (
      <Typography style={{ fontSize: 12, color: statusColors.pending, fontWeight: 500 }}>Superseded</Typography>
    );
  }

  const profile = getProfile(scan.profileId);
  const status = profile?.status ?? 'assessed';

  if (scan.rulesFailing === 0) {
    return (
      <Typography style={{ fontSize: 12, color: statusColors.success, fontWeight: 500 }}>
        All passing
      </Typography>
    );
  }

  switch (status) {
    case 'assessed':
      return (
        <Typography style={{ fontSize: 12, color: statusColors.info, fontWeight: 600 }}>
          Pending
        </Typography>
      );
    case 'plan-ready':
      return (
        <Typography style={{ fontSize: 12, color: statusColors.info, fontWeight: 600 }}>
          Reviewing plan
        </Typography>
      );
    case 'remediating':
      return (
        <Box className={classes.scanStatusCell}>
          <LoopIcon style={{ fontSize: 14, color: statusColors.warning }} className={classes.pipelineRunning} />
          <Typography style={{ fontSize: 12, fontWeight: 600, color: statusColors.warning }}>Remediating</Typography>
        </Box>
      );
    case 'verified': {
      const mockFixed = Math.max(1, Math.round(scan.rulesFailing * 0.6));
      return (
        <Typography style={{ fontSize: 12, fontWeight: 600, color: statusColors.success }}>
          {mockFixed} of {scan.rulesFailing} fixed
        </Typography>
      );
    }
    default:
      return null;
  }
};

function getScanSeverityChips(scan: ComplianceScan): React.ReactNode {
  if (scan.status !== 'completed' || scan.rulesFailing === 0) return null;
  const profile = getProfile(scan.profileId);
  if (!profile) return null;
  const sev = getProfileIssueSeverity(profile.id);
  if (sev.total === 0) return null;
  return (
    <Box display="flex" style={{ gap: 4, flexWrap: 'wrap' }}>
      {sev.critical > 0 && <Chip size="small" label={`${sev.critical} Critical`} style={{ backgroundColor: `${SEVERITY_COLORS.critical}15`, color: SEVERITY_COLORS.critical, fontWeight: 600, fontSize: 10, height: 20 }} />}
      {sev.high > 0 && <Chip size="small" label={`${sev.high} High`} style={{ backgroundColor: `${SEVERITY_COLORS.high}15`, color: SEVERITY_COLORS.high, fontWeight: 600, fontSize: 10, height: 20 }} />}
      {sev.low > 0 && <Chip size="small" label={`${sev.low} Low`} style={{ backgroundColor: `${SEVERITY_COLORS.low}15`, color: SEVERITY_COLORS.low, fontWeight: 600, fontSize: 10, height: 20 }} />}
    </Box>
  );
}

const ScanHistoryContent = ({ scans }: { scans: ComplianceScan[] }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [inventoryFilter, setInventoryFilter] = useState<string>('all');
  const [profileFilter, setProfileFilter] = useState<string>('all');

  const inventories = useMemo(() => {
    const names = new Set(scans.map(s => s.inventoryName));
    return Array.from(names).sort();
  }, [scans]);

  const profiles = useMemo(() => {
    const names = new Set(scans.map(s => s.profileName));
    return Array.from(names).sort();
  }, [scans]);

  const filteredScans = useMemo(() => {
    return scans.filter(s => {
      if (inventoryFilter !== 'all' && s.inventoryName !== inventoryFilter) return false;
      if (profileFilter !== 'all' && s.profileName !== profileFilter) return false;
      return true;
    });
  }, [scans, inventoryFilter, profileFilter]);

  const activeFilterCount = (inventoryFilter !== 'all' ? 1 : 0) + (profileFilter !== 'all' ? 1 : 0);

  return (
    <Box>
      <Box display="flex" alignItems="center" style={{ gap: 12, marginBottom: 16 }}>
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          <Typography style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.5)' }}>Inventory</Typography>
          <select
            value={inventoryFilter}
            onChange={e => setInventoryFilter(e.target.value)}
            style={{
              fontSize: 12,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #d0d0d0',
              backgroundColor: inventoryFilter !== 'all' ? `${statusColors.info}08` : '#fff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All inventories</option>
            {inventories.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </Box>
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          <Typography style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.5)' }}>Profile</Typography>
          <select
            value={profileFilter}
            onChange={e => setProfileFilter(e.target.value)}
            style={{
              fontSize: 12,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #d0d0d0',
              backgroundColor: profileFilter !== 'all' ? `${statusColors.info}08` : '#fff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All profiles</option>
            {profiles.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </Box>
        {activeFilterCount > 0 && (
          <Typography
            style={{ fontSize: 12, color: statusColors.info, cursor: 'pointer', fontWeight: 500 }}
            onClick={() => { setInventoryFilter('all'); setProfileFilter('all'); }}
          >
            Clear filters
          </Typography>
        )}
        <Typography style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginLeft: 'auto' }}>
          {filteredScans.length} {filteredScans.length === 1 ? 'scan' : 'scans'}
        </Typography>
      </Box>
    <TableContainer>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Scan</TableCell>
            <TableCell style={{ width: 80 }}>Score</TableCell>
            <TableCell style={{ width: 140 }}>Issues</TableCell>
            <TableCell style={{ width: 180 }}>Remediation</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredScans.map(scan => {
            const isCurrent = scan.isCurrent === true;
            const isRunning = scan.status === 'running';

            return (
              <TableRow
                key={scan.scanId}
                className={isCurrent ? classes.scanRow : classes.scanSuperseded}
                onClick={isRunning ? undefined : () => navigate(`/self-service/compliance/scan/${scan.scanId}`)}
                style={isRunning ? { cursor: 'default' } : undefined}
              >
                <TableCell>
                  <Box className={classes.scanIdentity}>
                    <Typography className={classes.scanProfileName}>
                      {scan.profileName}
                    </Typography>
                    <Typography className={classes.scanMeta}>
                      {scan.inventoryName}
                      <span style={{ color: '#ccc' }}>·</span>
                      {isRunning ? 'Just now' : scan.startedAt}
                      <span style={{ color: '#ccc' }}>·</span>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={scan.triggeredBy === 'scheduled' ? 'Scheduled' : 'Manual'}
                        style={{ fontSize: 10, height: 18, fontWeight: 500 }}
                      />
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {isRunning ? (
                    <Typography style={{ color: statusColors.info, fontSize: 13, fontWeight: 500 }}>—</Typography>
                  ) : scan.complianceScore !== null ? (
                    <Typography style={{ fontWeight: 600, fontSize: 14 }}>{scan.complianceScore}%</Typography>
                  ) : (
                    <Typography style={{ color: statusColors.pending, fontSize: 13 }}>—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {isRunning ? (
                    <Typography style={{ color: statusColors.info, fontSize: 12, fontWeight: 500 }}>Scanning…</Typography>
                  ) : (
                    getScanSeverityChips(scan) ?? (
                      scan.status === 'completed' && scan.rulesFailing === 0 ? (
                        <Typography style={{ fontSize: 12, color: statusColors.success, fontWeight: 500 }}>No issues</Typography>
                      ) : (
                        <Typography style={{ color: statusColors.pending, fontSize: 12 }}>—</Typography>
                      )
                    )
                  )}
                </TableCell>
                <TableCell>
                  <ScanWorkflow scan={scan} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Inline scan detail (renders under Scans tab)
// ---------------------------------------------------------------------------

const SEVERITY_COLORS_DETAIL = {
  critical: statusColors.error,
  high: statusColors.warning,
  low: statusColors.info,
};

function getScoreColor(score: number | null): string {
  if (score === null) return statusColors.pending;
  if (score >= 90) return statusColors.success;
  if (score >= 70) return statusColors.warning;
  return statusColors.error;
}

function getRemediationBanner(status: ProfileStatus, failingCount: number, hostCount: number): {
  message: string; color: string; bg: string; cta?: string;
} | null {
  switch (status) {
    case 'assessed':
      if (failingCount === 0) return null;
      return { message: `${failingCount} failing rules can be remediated. Select the rules you want to fix, then click Remediate.`, color: statusColors.info, bg: `${statusColors.info}10` };
    case 'plan-ready':
      return { message: 'Remediation plan is ready. Review the generated playbook, then approve to proceed.', color: statusColors.info, bg: `${statusColors.info}10` };
    case 'remediating':
      return { message: `Running remediation playbook across ${hostCount} hosts. Verification scan will follow automatically.`, color: statusColors.warning, bg: `${statusColors.warning}10` };
    case 'verified':
      return { message: 'Remediation and verification complete. All selected rules have been addressed.', color: statusColors.success, bg: `${statusColors.success}10` };
    default:
      return null;
  }
}

const PLAN_DELAY_MS = 2000;
const REMEDIATE_DELAY_MS = 4000;
const VERIFY_DELAY_MS = 3000;

const MOCK_PLAYBOOK = `---
- name: Remediate compliance findings
  hosts: all
  become: true
  tasks:

    - name: Ensure password minimum length is 15 characters
      ansible.builtin.lineinfile:
        path: /etc/security/pwquality.conf
        regexp: '^minlen'
        line: 'minlen = 15'
        state: present

    - name: Set SSH MaxAuthTries to 4
      ansible.builtin.lineinfile:
        path: /etc/ssh/sshd_config
        regexp: '^MaxAuthTries'
        line: 'MaxAuthTries 4'
      notify: restart sshd

    - name: Enable FIPS mode
      ansible.builtin.command:
        cmd: fips-mode-setup --enable
      when: ansible_fips.enabled is not defined or not ansible_fips.enabled

    - name: Set audit backlog limit
      ansible.builtin.lineinfile:
        path: /etc/default/grub
        regexp: '^GRUB_CMDLINE_LINUX='
        line: 'GRUB_CMDLINE_LINUX="audit_backlog_limit=8192 audit=1"'
      notify: rebuild grub

  handlers:
    - name: restart sshd
      ansible.builtin.service:
        name: sshd
        state: restarted

    - name: rebuild grub
      ansible.builtin.command:
        cmd: grub2-mkconfig -o /boot/grub2/grub.cfg`;

const InlineScanDetail = ({ scanId }: { scanId: string }) => {
  const classes = useStyles();
  const navigate = useNavigate();

  const scan = getScan(scanId);
  const profile = scan ? getProfile(scan.profileId) : undefined;

  const [localStatus, setLocalStatus] = useState<ProfileStatus>(profile?.status ?? 'not-scanned');
  const [remediatedRuleIds, setRemediatedRuleIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [viewingStepId, setViewingStepId] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  if (!scan || !profile) {
    return (
      <Box>
        <Typography
          className={classes.scanDetailBack}
          onClick={() => navigate('/self-service/compliance/scans')}
        >
          <ArrowBackIcon style={{ fontSize: 16 }} />
          All scans
        </Typography>
        <Typography style={{ color: statusColors.pending, fontSize: 14 }}>Scan not found.</Typography>
      </Box>
    );
  }

  const issueSeverity = getProfileIssueSeverity(profile.id);
  const banner = getRemediationBanner(localStatus, scan.rulesFailing, scan.hostsScanned);
  const triggerLabel = scan.triggeredBy === 'scheduled' ? 'Scheduled' : 'Manual';

  const handleRemediate = (ruleIds: string[]) => {
    setRemediatedRuleIds(ruleIds);
    setLocalStatus('plan-ready');
    setViewingStepId(null);
  };

  const handleApprovePlan = () => {
    setLocalStatus('remediating');
    setProgress(0);
    setViewingStepId(null);

    const totalMs = REMEDIATE_DELAY_MS + VERIFY_DELAY_MS;
    const tick = 200;
    let elapsed = 0;

    progressRef.current = setInterval(() => {
      elapsed += tick;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setProgress(pct);

      if (elapsed >= totalMs) {
        if (progressRef.current) clearInterval(progressRef.current);
        setLocalStatus('verified');
        setProgress(100);
      }
    }, tick);
  };

  const handleStepClick = (stepId: string) => {
    setViewingStepId(prev => prev === stepId ? null : stepId);
  };

  return (
    <Box>
      <Typography
        className={classes.scanDetailBack}
        onClick={() => navigate('/self-service/compliance/scans')}
      >
        <ArrowBackIcon style={{ fontSize: 16 }} />
        All scans
      </Typography>

      <Typography className={classes.scanDetailTitle}>
        {scan.profileName} — {scan.inventoryName}
      </Typography>
      <Typography className={classes.scanDetailMeta}>
        {scan.startedAt} · {scan.hostsScanned} hosts · {triggerLabel} · {scan.duration || 'Running'}
      </Typography>

      <CompliancePipeline
        profileStatus={localStatus}
        activeStepId={viewingStepId}
        onStepClick={handleStepClick}
      />

      {/* Empty state when viewing a non-active step */}
      {(() => {
        const naturalStepMap: Record<string, string> = {
          'assessed': 'review',
          'plan-ready': 'plan',
          'remediating': 'remediate',
          'verified': 'verified',
        };
        const naturalStep = naturalStepMap[localStatus];
        const isViewingOtherStep = viewingStepId && viewingStepId !== naturalStep;

        if (isViewingOtherStep) {
          const stepDef = STEP_DEFINITIONS.find(s => s.id === viewingStepId);
          if (!stepDef) return null;

          const statusIndex: Record<string, number> = { 'review': 0, 'plan': 1, 'remediate': 2 };
          const viewIdx = statusIndex[viewingStepId] ?? 0;
          const currentIdx = statusIndex[naturalStep] ?? 0;
          const isCompleted = viewIdx < currentIdx || localStatus === 'verified';
          const isUpcoming = viewIdx > currentIdx && localStatus !== 'verified';

          return (
            <Box
              style={{
                border: `1px solid ${isCompleted ? `${statusColors.success}25` : '#e8e8e8'}`,
                borderRadius: 8,
                padding: '32px 24px',
                textAlign: 'center',
                backgroundColor: isCompleted ? `${statusColors.success}04` : '#fafafa',
                marginTop: 8,
              }}
            >
              {isCompleted && (
                <CheckCircleIcon style={{ fontSize: 28, color: statusColors.success, marginBottom: 8 }} />
              )}
              <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: isCompleted ? statusColors.success : 'rgba(0,0,0,0.7)' }}>
                {isCompleted ? `${stepDef.label} — completed` : stepDef.label}
              </Typography>
              <Typography style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
                {stepDef.description}
              </Typography>
              {isUpcoming && (
                <Typography style={{ fontSize: 12, color: statusColors.info, marginTop: 12, fontWeight: 500 }}>
                  Complete the current step to get here.
                </Typography>
              )}
            </Box>
          );
        }

        return null;
      })()}

      {/* State-responsive content (hidden when viewing a non-active step) */}
      {!viewingStepId || viewingStepId === (() => {
        const m: Record<string, string> = { 'assessed': 'review', 'plan-ready': 'plan', 'remediating': 'remediate', 'verified': 'verified' };
        return m[localStatus];
      })() ? (
      <>

      {/* State-responsive summary */}
      {(localStatus === 'assessed' || localStatus === 'not-scanned') && (
        <>
          <Box className={classes.scanSummaryRow}>
            <Box className={classes.scanSummaryLeft}>
              <Typography style={{ fontSize: 13 }}>
                <strong>{scan.rulesEvaluated}</strong> rules evaluated
              </Typography>
              <span style={{ color: '#d2d2d2', fontSize: 13 }}>|</span>
              {scan.rulesFailing > 0 ? (
                <>
                  <Typography style={{ fontSize: 13 }}>
                    <strong style={{ color: statusColors.error }}>{scan.rulesFailing}</strong> failing
                  </Typography>
                  <span style={{ color: '#d2d2d2', fontSize: 13 }}>|</span>
                  {issueSeverity.critical > 0 && (
                    <Chip size="small" label={`${issueSeverity.critical} Critical`} style={{ backgroundColor: `${SEVERITY_COLORS_DETAIL.critical}15`, color: SEVERITY_COLORS_DETAIL.critical, fontWeight: 600, fontSize: 11, height: 22 }} />
                  )}
                  {issueSeverity.high > 0 && (
                    <Chip size="small" label={`${issueSeverity.high} High`} style={{ backgroundColor: `${SEVERITY_COLORS_DETAIL.high}15`, color: SEVERITY_COLORS_DETAIL.high, fontWeight: 600, fontSize: 11, height: 22 }} />
                  )}
                  {issueSeverity.low > 0 && (
                    <Chip size="small" label={`${issueSeverity.low} Low`} style={{ backgroundColor: `${SEVERITY_COLORS_DETAIL.low}15`, color: SEVERITY_COLORS_DETAIL.low, fontWeight: 600, fontSize: 11, height: 22 }} />
                  )}
                </>
              ) : (
                <Typography style={{ fontSize: 13, color: statusColors.success, fontWeight: 600 }}>
                  All passing
                </Typography>
              )}
            </Box>
            {scan.complianceScore !== null && (
              <Typography style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(scan.complianceScore) }}>
                {scan.complianceScore}% compliant
              </Typography>
            )}
          </Box>
          {banner && (
            <Box className={classes.scanBanner} style={{ backgroundColor: banner.bg, border: `1px solid ${banner.color}30` }}>
              <Typography style={{ flex: 1, fontSize: 13, color: banner.color }}>
                {banner.message}
              </Typography>
            </Box>
          )}
        </>
      )}

      {localStatus === 'plan-ready' && (
        <Box className={classes.scanSummaryRow} style={{ marginBottom: 16 }}>
          <Box className={classes.scanSummaryLeft}>
            <Typography style={{ fontSize: 13 }}>
              <strong style={{ color: statusColors.info }}>{remediatedRuleIds.length}</strong> {remediatedRuleIds.length === 1 ? 'rule' : 'rules'} selected for remediation
            </Typography>
            <span style={{ color: '#d2d2d2', fontSize: 13 }}>|</span>
            <Typography style={{ fontSize: 13 }}>
              <strong>{scan.rulesFailing - remediatedRuleIds.length}</strong> will remain unfixed
            </Typography>
          </Box>
        </Box>
      )}

      {localStatus === 'verified' && (() => {
        const remaining = scan.rulesFailing - remediatedRuleIds.length;
        const mockNewScore = Math.min(100, Math.round(scan.complianceScore! + (remediatedRuleIds.length / scan.rulesEvaluated) * 100 * 0.4));
        return (
          <>
            <Box className={classes.scanSummaryRow}>
              <Box className={classes.scanSummaryLeft}>
                <Chip
                  size="small"
                  label={`${remediatedRuleIds.length} fixed`}
                  style={{ backgroundColor: `${statusColors.success}15`, color: statusColors.success, fontWeight: 700, fontSize: 11, height: 24 }}
                />
                {remaining > 0 && (
                  <Chip
                    size="small"
                    label={`${remaining} remaining`}
                    style={{ backgroundColor: `${statusColors.warning}15`, color: statusColors.warning, fontWeight: 700, fontSize: 11, height: 24 }}
                  />
                )}
                {remaining === 0 && (
                  <Typography style={{ fontSize: 13, color: statusColors.success, fontWeight: 600 }}>
                    All issues resolved
                  </Typography>
                )}
              </Box>
              {scan.complianceScore !== null && (
                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                  <Typography style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', textDecoration: 'line-through' }}>
                    {scan.complianceScore}%
                  </Typography>
                  <Typography style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(mockNewScore) }}>
                    {mockNewScore}% compliant
                  </Typography>
                </Box>
              )}
            </Box>
            <Box className={classes.scanBanner} style={{ backgroundColor: `${statusColors.success}10`, border: `1px solid ${statusColors.success}30` }}>
              <Typography style={{ flex: 1, fontSize: 13, color: statusColors.success }}>
                {remediatedRuleIds.length} {remediatedRuleIds.length === 1 ? 'rule was' : 'rules were'} remediated and verified across {scan.hostsScanned} hosts.
                {remaining > 0 ? ` ${remaining} ${remaining === 1 ? 'rule remains' : 'rules remain'} unfixed. Scan again to remediate.` : ''}
              </Typography>
            </Box>
          </>
        );
      })()}

      {/* Step 1: Select rules */}
      {localStatus === 'assessed' && (
        <FindingsContent profileId={profile.id} profileStatus={localStatus} onRemediate={handleRemediate} />
      )}

      {/* Step 2: Remediation plan */}
      {localStatus === 'plan-ready' && (
        <Box>
          <Box
            style={{
              border: `1px solid ${statusColors.info}30`,
              borderRadius: 8,
              padding: 20,
              marginBottom: 16,
              backgroundColor: `${statusColors.info}05`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" marginBottom="4px">
              <Typography style={{ fontSize: 14, fontWeight: 600 }}>
                Generated remediation playbook
              </Typography>
              <Typography style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.5)' }}>
                {remediatedRuleIds.length} {remediatedRuleIds.length === 1 ? 'rule' : 'rules'} → {Math.max(remediatedRuleIds.length, remediatedRuleIds.length + Math.ceil(remediatedRuleIds.length * 0.5))} tasks · {scan.hostsScanned} hosts
              </Typography>
            </Box>
            <Typography style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', marginBottom: 12 }}>
              Review the playbook below, then approve to proceed. This will run once across all targeted hosts.
            </Typography>
            <Box
              style={{
                backgroundColor: '#1e1e2e',
                borderRadius: 6,
                padding: 16,
                maxHeight: 360,
                overflowY: 'auto',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 12,
                lineHeight: 1.7,
                color: '#cdd6f4',
                whiteSpace: 'pre',
              }}
            >
              {MOCK_PLAYBOOK}
            </Box>
          </Box>
          <Box display="flex" justifyContent="flex-end" style={{ gap: 8 }}>
            <Button
              variant="outlined"
              size="small"
              style={{ textTransform: 'none' }}
              onClick={() => {
                setLocalStatus('assessed');
                setRemediatedRuleIds([]);
              }}
            >
              Back to findings
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={{ textTransform: 'none', fontWeight: 600 }}
              onClick={handleApprovePlan}
            >
              Approve & run remediation
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Remediate & verify — running */}
      {localStatus === 'remediating' && (
        <Box
          style={{
            border: `1px solid ${statusColors.warning}30`,
            borderRadius: 8,
            padding: 24,
            textAlign: 'center',
            backgroundColor: `${statusColors.warning}05`,
          }}
        >
          <LoopIcon
            className={classes.spinningIcon}
            style={{
              fontSize: 32,
              color: statusColors.warning,
              marginBottom: 12,
            }}
          />
          <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {progress < 60 ? 'Running remediation playbook…' : 'Running verification scan…'}
          </Typography>
          <Typography style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', marginBottom: 16 }}>
            {progress < 60
              ? `Applying fixes for ${remediatedRuleIds.length} rules across ${scan.hostsScanned} hosts`
              : 'Confirming fixes were applied successfully'}
          </Typography>
          <Box
            style={{
              width: '100%',
              maxWidth: 400,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: 3,
                backgroundColor: progress < 60 ? statusColors.warning : statusColors.info,
                transition: 'width 0.2s ease, background-color 0.3s ease',
              }}
            />
          </Box>
          <Typography style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', marginTop: 8 }}>
            {progress}%
          </Typography>
        </Box>
      )}

      {/* Step 3: Remediate & verify — done */}
      {localStatus === 'verified' && (
        <FindingsContent
          profileId={profile.id}
          profileStatus={localStatus}
          remediatedRuleIds={remediatedRuleIds}
        />
      )}

      </>
      ) : null}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Profile dialog (new / edit)
// ---------------------------------------------------------------------------

const FRAMEWORKS: ComplianceFramework[] = ['DISA STIG', 'PCI-DSS', 'CIS', 'NIST 800-53'];

type ProfileDialogProps = {
  open: boolean;
  onClose: () => void;
  existing?: ProfileDefinition;
};

const ProfileDialog = ({ open, onClose, existing }: ProfileDialogProps) => {
  const isEdit = !!existing;
  const [name, setName] = useState(existing?.name ?? '');
  const [framework, setFramework] = useState<ComplianceFramework>(existing?.framework ?? 'DISA STIG');
  const [version, setVersion] = useState(existing?.version ?? '');
  const [targetOS, setTargetOS] = useState(existing?.targetOS ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');

  useEffect(() => {
    if (open) {
      setName(existing?.name ?? '');
      setFramework(existing?.framework ?? 'DISA STIG');
      setVersion(existing?.version ?? '');
      setTargetOS(existing?.targetOS ?? '');
      setDescription(existing?.description ?? '');
    }
  }, [open, existing]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ paddingBottom: 8 }}>
        <Typography style={{ fontSize: 16, fontWeight: 600 }}>
          {isEdit ? 'Edit profile' : 'New compliance profile'}
        </Typography>
        <Typography style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', marginTop: 2 }}>
          {isEdit
            ? 'Update the profile configuration below.'
            : 'Define a compliance profile that can be assigned to inventories for scanning.'}
        </Typography>
      </DialogTitle>
      <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
        <TextField
          label="Profile name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="e.g., DISA STIG for RHEL 9"
        />
        <Box display="flex" style={{ gap: 12 }}>
          <FormControl variant="outlined" size="small" style={{ flex: 1 }}>
            <InputLabel>Framework</InputLabel>
            <Select
              value={framework}
              onChange={e => setFramework(e.target.value as ComplianceFramework)}
              label="Framework"
            >
              {FRAMEWORKS.map(fw => (
                <MenuItem key={fw} value={fw}>{fw}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Version"
            value={version}
            onChange={e => setVersion(e.target.value)}
            variant="outlined"
            size="small"
            style={{ flex: 0.6 }}
            placeholder="e.g., V1R12"
          />
        </Box>
        <TextField
          label="Target OS"
          value={targetOS}
          onChange={e => setTargetOS(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="e.g., RHEL 9"
        />
        <TextField
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          multiline
          minRows={3}
          placeholder="Describe the purpose and scope of this compliance profile."
        />
      </DialogContent>
      <DialogActions style={{ padding: '12px 24px 16px' }}>
        <Button onClick={onClose} style={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          style={{ textTransform: 'none', fontWeight: 600 }}
          disabled={!name.trim() || !version.trim()}
        >
          {isEdit ? 'Save changes' : 'Create profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Profile detail (inline under Profiles tab)
// ---------------------------------------------------------------------------

const ProfileDetailInline = ({ profileDefId, onBack }: { profileDefId: string; onBack: () => void }) => {
  const classes = useStyles();
  const profDef = PROFILE_DEFINITIONS.find(p => p.id === profileDefId);
  const [editOpen, setEditOpen] = useState(false);

  if (!profDef) {
    return (
      <Box>
        <Typography
          className={classes.scanDetailBack}
          onClick={onBack}
        >
          <ArrowBackIcon style={{ fontSize: 16 }} />
          All profiles
        </Typography>
        <Typography style={{ color: statusColors.pending, fontSize: 14 }}>Profile not found.</Typography>
      </Box>
    );
  }

  const assignedInvs = INVENTORIES.filter(inv => profDef.assignedInventories.includes(inv.id));

  return (
    <Box>
      <Typography
        className={classes.scanDetailBack}
        onClick={onBack}
      >
        <ArrowBackIcon style={{ fontSize: 16 }} />
        All profiles
      </Typography>

      <Box display="flex" alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: 16 }}>
        <Box>
          <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 4 }}>
            <Typography className={classes.scanDetailTitle} style={{ marginBottom: 0 }}>
              {profDef.name}
            </Typography>
            {profDef.isBuiltIn && (
              <Chip size="small" label="Built-in" style={{ fontSize: 10, height: 20, backgroundColor: '#e8e8e8' }} />
            )}
            {!profDef.isBuiltIn && (
              <Chip size="small" label="Custom" style={{ fontSize: 10, height: 20, backgroundColor: `${statusColors.info}15`, color: statusColors.info }} />
            )}
          </Box>
          <Typography className={classes.scanDetailMeta}>
            {profDef.framework} {profDef.version} · {profDef.targetOS} · Created {profDef.createdAt}
          </Typography>
        </Box>
        <Box display="flex" style={{ gap: 8 }}>
          {!profDef.isBuiltIn && (
            <Tooltip title="Delete profile">
              <IconButton size="small">
                <DeleteOutlineIcon style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)' }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Duplicate profile">
            <IconButton size="small">
              <FileCopyOutlinedIcon style={{ fontSize: 16, color: 'rgba(0,0,0,0.4)' }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon style={{ fontSize: 14 }} />}
            onClick={() => setEditOpen(true)}
            style={{ textTransform: 'none', fontSize: 12 }}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Description */}
      <Box className={classes.profileDetailSection}>
        <Typography className={classes.profileDetailLabel}>Description</Typography>
        <Typography className={classes.profileDetailValue}>{profDef.description}</Typography>
      </Box>

      {/* Metadata grid */}
      <Box display="flex" style={{ gap: 32, marginBottom: 20 }}>
        <Box>
          <Typography className={classes.profileDetailLabel}>Framework</Typography>
          <Typography className={classes.profileDetailValue}>{profDef.framework}</Typography>
        </Box>
        <Box>
          <Typography className={classes.profileDetailLabel}>Version</Typography>
          <Typography className={classes.profileDetailValue}>{profDef.version}</Typography>
        </Box>
        <Box>
          <Typography className={classes.profileDetailLabel}>Target OS</Typography>
          <Typography className={classes.profileDetailValue}>{profDef.targetOS}</Typography>
        </Box>
        <Box>
          <Typography className={classes.profileDetailLabel}>Created by</Typography>
          <Typography className={classes.profileDetailValue}>{profDef.createdBy}</Typography>
        </Box>
        <Box>
          <Typography className={classes.profileDetailLabel}>Last updated</Typography>
          <Typography className={classes.profileDetailValue}>{profDef.updatedAt}</Typography>
        </Box>
      </Box>

      {/* Rules summary */}
      <Box className={classes.profileDetailSection}>
        <Typography className={classes.profileDetailLabel}>Rules</Typography>
        <Box display="flex" alignItems="center" style={{ gap: 12, marginTop: 4 }}>
          <Typography style={{ fontSize: 24, fontWeight: 700, color: '#151515' }}>
            {profDef.enabledRules}
          </Typography>
          <Typography style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>
            of {profDef.totalRules} rules enabled
          </Typography>
          {profDef.enabledRules < profDef.totalRules && (
            <Chip
              size="small"
              label={`${profDef.totalRules - profDef.enabledRules} disabled`}
              style={{ fontSize: 10, height: 20, backgroundColor: `${statusColors.warning}15`, color: statusColors.warning }}
            />
          )}
        </Box>
      </Box>

      {/* Categories */}
      <Box className={classes.profileDetailSection}>
        <Typography className={classes.profileDetailLabel}>Rule categories</Typography>
        <Box display="flex" flexWrap="wrap" style={{ gap: 6, marginTop: 4 }}>
          {profDef.categories.map(cat => (
            <Chip key={cat} size="small" label={cat} style={{ fontSize: 11, height: 22 }} />
          ))}
        </Box>
      </Box>

      {/* Assigned inventories */}
      <Box className={classes.profileDetailSection}>
        <Typography className={classes.profileDetailLabel}>Assigned inventories</Typography>
        {assignedInvs.length === 0 ? (
          <Typography style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', fontStyle: 'italic', marginTop: 4 }}>
            Not assigned to any inventory. Assign this profile when creating a new scan.
          </Typography>
        ) : (
          <TableContainer style={{ marginTop: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>Inventory</TableCell>
                  <TableCell style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>Hosts</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedInvs.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell style={{ fontSize: 13 }}>{inv.name}</TableCell>
                    <TableCell style={{ fontSize: 13 }}>{inv.hostCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <ProfileDialog open={editOpen} onClose={() => setEditOpen(false)} existing={profDef} />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Profiles list content
// ---------------------------------------------------------------------------

const ProfilesContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { profileDefId } = useParams<{ profileDefId?: string }>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');

  if (profileDefId) {
    return (
      <ProfileDetailInline
        profileDefId={profileDefId}
        onBack={() => navigate('/self-service/compliance/profiles')}
      />
    );
  }

  const filtered = frameworkFilter === 'all'
    ? PROFILE_DEFINITIONS
    : PROFILE_DEFINITIONS.filter(p => p.framework === frameworkFilter);

  const uniqueFrameworks = [...new Set(PROFILE_DEFINITIONS.map(p => p.framework))];

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
        <Box display="flex" alignItems="center" style={{ gap: 12 }}>
          <FormControl variant="outlined" size="small" style={{ minWidth: 160 }}>
            <InputLabel>Framework</InputLabel>
            <Select
              value={frameworkFilter}
              onChange={e => setFrameworkFilter(e.target.value as string)}
              label="Framework"
            >
              <MenuItem value="all">All frameworks</MenuItem>
              {uniqueFrameworks.map(fw => (
                <MenuItem key={fw} value={fw}>{fw}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {frameworkFilter !== 'all' && (
            <Button
              size="small"
              onClick={() => setFrameworkFilter('all')}
              style={{ textTransform: 'none', fontSize: 12 }}
            >
              Clear filter
            </Button>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          style={{ textTransform: 'none', fontWeight: 600 }}
        >
          New profile
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>Profile</TableCell>
              <TableCell style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>Framework</TableCell>
              <TableCell style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>Target OS</TableCell>
              <TableCell style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>Rules</TableCell>
              <TableCell style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>Inventories</TableCell>
              <TableCell style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(profDef => {
              const assignedCount = profDef.assignedInventories.length;
              return (
                <TableRow
                  key={profDef.id}
                  hover
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/self-service/compliance/profiles/${profDef.id}`)}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                      <SecurityIcon style={{ fontSize: 16, color: profDef.isBuiltIn ? 'rgba(0,0,0,0.3)' : statusColors.info }} />
                      <Box>
                        <Typography style={{ fontSize: 13, fontWeight: 600, color: '#151515' }}>
                          {profDef.name}
                        </Typography>
                        <Typography style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
                          {profDef.isBuiltIn ? 'Built-in' : `Created by ${profDef.createdBy}`}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${profDef.framework} ${profDef.version}`}
                      style={{ fontSize: 11, height: 22, fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell style={{ fontSize: 12 }}>{profDef.targetOS}</TableCell>
                  <TableCell>
                    <Typography style={{ fontSize: 12 }}>
                      <strong>{profDef.enabledRules}</strong>
                      <span style={{ color: 'rgba(0,0,0,0.4)' }}> / {profDef.totalRules}</span>
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {assignedCount > 0 ? (
                      <Chip
                        size="small"
                        label={`${assignedCount} ${assignedCount === 1 ? 'inventory' : 'inventories'}`}
                        style={{ fontSize: 11, height: 22, backgroundColor: `${statusColors.success}12`, color: statusColors.success, fontWeight: 500 }}
                      />
                    ) : (
                      <Typography style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', fontStyle: 'italic' }}>
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
                    {profDef.updatedAt}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <ProfileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const SCAN_COMPLETE_DELAY_MS = 6000;

const FRAMEWORK_VERSIONS: Record<ComplianceFramework, string> = {
  'DISA STIG': 'V1R12',
  'PCI-DSS': 'v4.0',
  CIS: 'L1 v8.0',
  'NIST 800-53': 'Rev 5',
};

export const CompliancePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { scanId, profileDefId } = useParams<{ scanId?: string; profileDefId?: string }>();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [runningScan, setRunningScan] = useState<ComplianceScan | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTab = useMemo(() => getTabIndex(location.pathname), [location.pathname]);

  const onTabSelect = useCallback(
    (index: number) => {
      const paths = ['/self-service/compliance', '/self-service/compliance/scans', '/self-service/compliance/profiles'];
      navigate(paths[index] || paths[0]);
    },
    [navigate],
  );

  const handleRunScan = useCallback(
    (inventoryId: string, framework: ComplianceFramework) => {
      const inv = INVENTORIES.find(i => i.id === inventoryId);
      const profileName = `${framework} ${FRAMEWORK_VERSIONS[framework]}`;

      const newScan: ComplianceScan = {
        scanId: `scan-live-${Date.now()}`,
        profileId: `live-${inventoryId}-${framework.toLowerCase().replace(/\s+/g, '-')}`,
        profileName,
        inventoryName: inv?.name ?? inventoryId,
        status: 'running',
        triggeredBy: 'manual',
        startedAt: 'Just now',
        duration: '',
        complianceScore: null,
        rulesEvaluated: 0,
        rulesFailing: 0,
        hostsScanned: inv?.hostCount ?? 0,
        isCurrent: true,
      };

      setRunningScan(newScan);

      navigate('/self-service/compliance/scans');

      scanTimerRef.current = setTimeout(() => {
        setRunningScan(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'completed',
            startedAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
            duration: '2m 38s',
            complianceScore: 74,
            rulesEvaluated: 8,
            rulesFailing: 3,
          };
        });
        setToastMessage(`Scan complete — ${profileName} on ${inv?.name ?? inventoryId}`);
        setToastOpen(true);
      }, SCAN_COMPLETE_DELAY_MS);
    },
    [navigate],
  );

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, []);

  const allScans = useMemo(() => {
    if (!runningScan) return COMPLIANCE_SCANS;
    return [runningScan, ...COMPLIANCE_SCANS];
  }, [runningScan]);

  const content = useMemo(() => {
    if (scanId) return <InlineScanDetail key={scanId} scanId={scanId} />;
    if (selectedTab === 2) return <ProfilesContent key="profiles" />;
    if (selectedTab === 1) return <ScanHistoryContent key="scan-history" scans={allScans} />;
    return <InventoriesContent key="inventories" />;
  }, [selectedTab, allScans, scanId]);

  return (
    <Page themeId="tool">
      <Header
        title="Compliance"
        subtitle="Monitor and enforce security and regulatory compliance across your infrastructure"
      >
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setWizardOpen(true)}
          style={{ textTransform: 'none', fontWeight: 600, marginLeft: 'auto' }}
        >
          New scan
        </Button>
      </Header>
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={tabs.map(({ id, label }) => ({ id, label }))}
      />
      <Content>
        {!scanId && !profileDefId && selectedTab !== 2 && <FleetSummary />}
        {content}
      </Content>
      <NewScanWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onRunScan={handleRunScan}
      />
      <Snackbar
        open={toastOpen}
        autoHideDuration={5000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <CheckCircleIcon style={{ fontSize: 18, color: statusColors.success }} />
            <span>{toastMessage}</span>
          </Box>
        }
        ContentProps={{
          style: {
            backgroundColor: '#fff',
            color: '#151515',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: `1px solid ${statusColors.success}30`,
            fontWeight: 500,
            fontSize: 13,
          },
        }}
      />
    </Page>
  );
};
