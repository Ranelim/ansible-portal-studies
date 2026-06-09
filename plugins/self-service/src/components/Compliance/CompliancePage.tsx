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
  makeStyles,
} from '@material-ui/core';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import LoopIcon from '@material-ui/icons/Loop';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import AddIcon from '@material-ui/icons/Add';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { statusColors } from '../common/statusColors';
import {
  INVENTORIES,
  COMPLIANCE_SCANS,
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
} from './complianceDemoData';
import { CompliancePipeline } from './CompliancePipeline';
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
// Pipeline step helpers
// ---------------------------------------------------------------------------

const PIPELINE_STEPS = [
  { id: 'assess', label: 'Scanned' },
  { id: 'review', label: 'Review' },
  { id: 'build', label: 'Build' },
  { id: 'remediate', label: 'Remediate' },
  { id: 'verify', label: 'Verify' },
];

function getActiveStep(status: ProfileStatus): { stepIndex: number; running: boolean } {
  switch (status) {
    case 'not-scanned': return { stepIndex: -1, running: false };
    case 'assessed': return { stepIndex: 1, running: false };
    case 'remediation-in-progress': return { stepIndex: 3, running: true };
    case 'verification-pending': return { stepIndex: 4, running: false };
    case 'verified': return { stepIndex: 5, running: false };
  }
}

function getNextAction(status: ProfileStatus, hasIssues: boolean): { label: string; variant: 'contained' | 'outlined' } | null {
  if (status === 'not-scanned') return { label: 'Scan now', variant: 'outlined' };
  if (status === 'assessed' && hasIssues) return { label: 'Review findings', variant: 'contained' };
  if (status === 'remediation-in-progress') return { label: 'View progress', variant: 'outlined' };
  if (status === 'verification-pending') return { label: 'Verify now', variant: 'contained' };
  return null;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const tabs = [
  { id: 'inventories', label: 'Inventories' },
  { id: 'scans', label: 'Scans' },
];

const getTabIndex = (pathname: string): number => {
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
  pipelineInline: { display: 'flex', alignItems: 'center', gap: 2, minWidth: 120 },
  pipelineDot: { fontSize: 10 },
  pipelineRunning: { fontSize: 12, animation: '$spin 1.2s linear infinite' },
  '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
  pipelineLabel: { fontSize: 11, fontWeight: 600, marginLeft: 3 },
  actionBtn: { textTransform: 'none', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },

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
}));

// ---------------------------------------------------------------------------
// Inline pipeline dots
// ---------------------------------------------------------------------------

const PipelineDots = ({ status }: { status: ProfileStatus }) => {
  const classes = useStyles();
  const { stepIndex, running } = getActiveStep(status);

  if (status === 'not-scanned') {
    return <Typography style={{ fontSize: 12, color: statusColors.pending }}>Not scanned</Typography>;
  }

  const currentStep = PIPELINE_STEPS[Math.min(stepIndex, PIPELINE_STEPS.length - 1)];

  return (
    <Box className={classes.pipelineInline}>
      {PIPELINE_STEPS.map((step, i) => {
        if (i < stepIndex) return <CheckCircleIcon key={step.id} className={classes.pipelineDot} style={{ color: statusColors.success, fontSize: 12 }} />;
        if (i === stepIndex && running) return <LoopIcon key={step.id} className={classes.pipelineRunning} style={{ color: statusColors.warning }} />;
        if (i === stepIndex) return <FiberManualRecordIcon key={step.id} className={classes.pipelineDot} style={{ color: statusColors.info, fontSize: 12 }} />;
        return <RadioButtonUncheckedIcon key={step.id} className={classes.pipelineDot} style={{ color: `${statusColors.pending}50` }} />;
      })}
      <Typography className={classes.pipelineLabel} style={{ color: running ? statusColors.warning : stepIndex >= 5 ? statusColors.success : statusColors.info }}>
        {stepIndex >= 5 ? 'Verified' : currentStep?.label}
      </Typography>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Profile sub-row (inside inventory accordion)
// ---------------------------------------------------------------------------

const ProfileSubRow = ({ profile }: { profile: ComplianceProfile }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const breakdown = getProfileIssueSeverity(profile.id);
  const action = getNextAction(profile.status, breakdown.total > 0);

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

      <Typography className={classes.profileScore} style={{ color: scoreColor(profile.complianceScore) }}>
        {profile.complianceScore !== null ? `${profile.complianceScore}%` : '—'}
      </Typography>

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

      <PipelineDots status={profile.status} />

      <Box minWidth={130} textAlign="right" onClick={e => e.stopPropagation()}>
        {action ? (
          <Button
            variant={action.variant}
            color="primary"
            size="small"
            className={classes.actionBtn}
            onClick={() => navigate(scanRoute)}
          >
            {action.label}
          </Button>
        ) : profile.status === 'verified' && breakdown.total === 0 ? (
          <Typography className={classes.compliantLabel} style={{ fontSize: 11, justifyContent: 'flex-end' }}>
            <CheckCircleIcon style={{ fontSize: 13 }} /> Verified
          </Typography>
        ) : null}
      </Box>
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
                <Typography className={classes.profileHeaderLabel} style={{ minWidth: 120 }}>Remediation</Typography>
                <Box minWidth={130} />
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
  return <PipelineDots status={status} />;
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

  return (
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
          {scans.map(scan => {
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
      return { message: `${failingCount} failing rules can be remediated. Select rules to build a remediation playbook.`, color: statusColors.info, bg: `${statusColors.info}10`, cta: 'Build remediation' };
    case 'remediation-in-progress':
      return { message: `Running remediation playbook across ${hostCount} hosts.`, color: statusColors.warning, bg: `${statusColors.warning}10` };
    case 'verification-pending':
      return { message: 'Remediation complete. Run a verification scan to confirm the fixes.', color: statusColors.info, bg: `${statusColors.info}10`, cta: 'Run verification scan' };
    case 'verified':
      return { message: 'Verification complete. Remediation has been confirmed.', color: statusColors.success, bg: `${statusColors.success}10` };
    default:
      return null;
  }
}

const InlineScanDetail = ({ scanId }: { scanId: string }) => {
  const classes = useStyles();
  const navigate = useNavigate();

  const scan = getScan(scanId);
  const profile = scan ? getProfile(scan.profileId) : undefined;

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

  const hostMap = getProfileHostSummary(profile.id);
  const hostsWithIssues = hostMap.size;
  const hostCritical = Array.from(hostMap.values()).filter(h => h.critical > 0).length;
  const issueSeverity = getProfileIssueSeverity(profile.id);
  const banner = getRemediationBanner(profile.status, scan.rulesFailing, scan.hostsScanned);
  const triggerLabel = scan.triggeredBy === 'scheduled' ? 'Scheduled' : 'Manual';

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
        profileStatus={profile.status}
        onStepClick={() => {}}
      />

      {/* Summary row */}
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

      {/* Remediation banner */}
      {banner && (
        <Box className={classes.scanBanner} style={{ backgroundColor: banner.bg, border: `1px solid ${banner.color}30` }}>
          <Typography style={{ flex: 1, fontSize: 13, color: banner.color }}>
            {banner.message}
          </Typography>
          {banner.cta && (
            <Button size="small" variant="contained" color="primary" style={{ textTransform: 'none', fontSize: 12, fontWeight: 600 }}>
              {banner.cta}
            </Button>
          )}
        </Box>
      )}

      <FindingsContent profileId={profile.id} profileStatus={profile.status} />
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
  const { scanId } = useParams<{ scanId?: string }>();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [runningScan, setRunningScan] = useState<ComplianceScan | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTab = useMemo(() => getTabIndex(location.pathname), [location.pathname]);

  const onTabSelect = useCallback(
    (index: number) => {
      const path = index === 0 ? '/self-service/compliance' : '/self-service/compliance/scans';
      navigate(path);
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
        {!scanId && <FleetSummary />}
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
