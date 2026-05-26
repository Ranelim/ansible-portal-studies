import { useState, useMemo } from 'react';
import { DEVSPACES_BASE_URL, DEMO_CONNECTIONS } from '../../Admin/syncDemoData';
import { useUserRoleContext } from '../../../hooks/useUserRole';

const isDevSpacesConnected = DEMO_CONNECTIONS.find(c => c.id === 'devspaces')?.status === 'Active';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Tooltip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CodeIcon from '@material-ui/icons/Code';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import BuildIcon from '@material-ui/icons/Build';
import HistoryIcon from '@material-ui/icons/History';
import VerifiedUserOutlinedIcon from '@material-ui/icons/VerifiedUserOutlined';
import { statusColors } from '../../common/statusColors';
import {
  type ProjectQualityData,
  type ScanResult,
  type SeverityClass,
  type QualityViolation,
  type ViolationCategory,
  type RemediationStatus,
  SEVERITY_COLORS,
} from './qualityDemoData';

// ---------------------------------------------------------------------------
// Severity Bar — matches APME's compact severity breakdown
// ---------------------------------------------------------------------------
const SeverityBar = ({
  breakdown,
  activeSeverity,
  onSeverityClick,
}: {
  breakdown: Record<SeverityClass, number>;
  activeSeverity?: SeverityClass | null;
  onSeverityClick?: (sev: SeverityClass | null) => void;
}) => {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const order: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];
  const isClickable = Boolean(onSeverityClick);

  return (
    <Box display="flex" style={{ gap: 16, flexWrap: 'wrap' }}>
      {order.map(sev => {
        const count = breakdown[sev];
        if (count === 0) return null;
        const isActive = activeSeverity === sev;
        return (
          <Box
            key={sev}
            display="flex"
            alignItems="center"
            style={{
              gap: 6,
              cursor: isClickable ? 'pointer' : undefined,
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: isActive ? `${SEVERITY_COLORS[sev]}15` : undefined,
              border: isActive ? `1px solid ${SEVERITY_COLORS[sev]}40` : '1px solid transparent',
              transition: 'all 0.15s ease',
            }}
            onClick={() => onSeverityClick?.(isActive ? null : sev)}
          >
            <Box style={{
              width: 10, height: 10, borderRadius: 2,
              backgroundColor: SEVERITY_COLORS[sev],
            }} />
            <Typography style={{
              fontSize: 12, textTransform: 'capitalize',
              color: isActive ? SEVERITY_COLORS[sev] : '#555',
              fontWeight: isActive ? 600 : 400,
            }}>
              {sev}
            </Typography>
            <Typography style={{ fontSize: 12, fontWeight: 700, color: SEVERITY_COLORS[sev] }}>
              {count}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Stacked severity progress bar
// ---------------------------------------------------------------------------
const SeverityProgressBar = ({ breakdown }: { breakdown: Record<SeverityClass, number> }) => {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const order: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];

  return (
    <Box style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', width: '100%' }}>
      {order.map(sev => {
        const count = breakdown[sev];
        if (count === 0) return null;
        return (
          <Box
            key={sev}
            style={{
              width: `${(count / total) * 100}%`,
              backgroundColor: SEVERITY_COLORS[sev],
            }}
          />
        );
      })}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Health Score Ring — compact circular score
// ---------------------------------------------------------------------------
const HealthScoreRing = ({ score }: { score: number }) => {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? statusColors.success : score >= 50 ? statusColors.warning : statusColors.error;

  return (
    <Box style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eee" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <Box style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography style={{ fontSize: 16, fontWeight: 700, color }}>{score}</Typography>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Remediation Status Banner
// ---------------------------------------------------------------------------
const REMEDIATION_CONFIG: Record<RemediationStatus, {
  label: string; color: string; icon: 'spinning' | 'check' | 'error' | 'none';
  description: (summary?: ProjectQualityData['remediationSummary']) => string;
} | null> = {
  none: null,
  available: {
    label: 'Remediation available',
    color: statusColors.info,
    icon: 'none',
    description: () => 'APME can auto-fix some violations. Trigger "Fix with AI" to create a remediation branch.',
  },
  'in-progress': {
    label: 'Remediation in progress',
    color: statusColors.info,
    icon: 'spinning',
    description: () => 'APME is analyzing violations and generating fixes. This runs as a GitHub Actions workflow.',
  },
  'branch-ready': {
    label: 'Remediation branch ready',
    color: statusColors.warning,
    icon: 'none',
    description: (s) => s
      ? `${s.addressed} of ${s.addressed + s.remaining} violations addressed (${s.autoFixed} auto-fixed, ${s.aiProposed} AI-proposed). Review the branch and create a pull request.`
      : 'Fixes are ready on a remediation branch. Review the changes and create a pull request.',
  },
  'pr-open': {
    label: 'Pull request open',
    color: statusColors.warning,
    icon: 'none',
    description: (s) => s
      ? `${s.addressed} violations addressed. Review the pull request, then merge when satisfied.`
      : 'A pull request with remediation fixes is open for review.',
  },
  'pr-merged': {
    label: 'Remediation merged',
    color: statusColors.success,
    icon: 'check',
    description: (s) => s
      ? `${s.addressed} violations fixed. ${s.remaining > 0 ? `${s.remaining} remaining violations require manual attention.` : 'All fixable violations resolved.'}`
      : 'Remediation changes have been merged.',
  },
};

const RemediationBanner = ({
  status, quality, repoUrl, branch,
}: {
  status: RemediationStatus;
  quality: ProjectQualityData;
  repoUrl?: string;
  branch?: string;
}) => {
  const { hasRole } = useUserRoleContext();
  const config = REMEDIATION_CONFIG[status];
  if (!config) return null;

  return (
    <Card variant="outlined" style={{
      borderRadius: 12, marginBottom: 20,
      borderColor: `${config.color}40`, borderWidth: 1,
      backgroundColor: `${config.color}08`,
    }}>
      <CardContent style={{ padding: '16px 20px' }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box display="flex" alignItems="flex-start" style={{ gap: 12 }}>
            {config.icon === 'spinning' && (
              <AutorenewIcon style={{
                fontSize: 20, color: config.color, marginTop: 2,
                animation: 'spin 1.5s linear infinite',
              }} />
            )}
            {config.icon === 'check' && (
              <CheckCircleIcon style={{ fontSize: 20, color: config.color, marginTop: 2 }} />
            )}
            {config.icon === 'error' && (
              <ErrorIcon style={{ fontSize: 20, color: config.color, marginTop: 2 }} />
            )}
            <Box>
              <Typography style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                {config.label}
              </Typography>
              <Typography style={{ fontSize: 13, color: '#666', marginTop: 2, lineHeight: 1.5 }}>
                {config.description(quality.remediationSummary)}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" style={{ gap: 8, flexShrink: 0 }}>
            {status === 'branch-ready' && quality.remediationBranch && isDevSpacesConnected && hasRole('developer') && (
              <Tooltip title="Open the remediation branch in Dev Spaces to review changes" arrow>
                <Button
                  size="small" variant="outlined"
                  startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                  onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${quality.remediationBranch}`, '_blank')}
                  style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                >
                  Review in Dev Spaces
                </Button>
              </Tooltip>
            )}
            {status === 'pr-open' && quality.remediationPrUrl && (
              <>
                {isDevSpacesConnected && hasRole('developer') && (
                  <Tooltip title="Open the pull request branch in Dev Spaces" arrow>
                    <Button
                      size="small" variant="outlined"
                      startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                      onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${quality.remediationBranch ?? 'main'}`, '_blank')}
                      style={{ textTransform: 'none', fontSize: 12 }}
                    >
                      Review in Dev Spaces
                    </Button>
                  </Tooltip>
                )}
                <Button
                  size="small" variant="contained" color="primary"
                  startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                  onClick={() => window.open(quality.remediationPrUrl, '_blank')}
                  style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                >
                  View pull request
                </Button>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Violation Row — a single violation entry (grouped under file headers)
// ---------------------------------------------------------------------------
const ViolationRow = ({
  v, repoUrl, branch,
}: {
  v: QualityViolation;
  repoUrl?: string; branch?: string;
}) => {
  const { hasRole } = useUserRoleContext();
  const [expanded, setExpanded] = useState(false);

  return (
    <Box style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <Box
        display="flex" alignItems="center"
        style={{ padding: '6px 16px 6px 32px', gap: 10, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.02)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      >
        <Typography style={{ fontSize: 12, fontFamily: 'monospace', color: '#666', minWidth: 35 }}>
          L{v.lineStart}
        </Typography>
        <Chip
          size="small"
          label={v.severity}
          style={{
            fontSize: 10, height: 18, textTransform: 'capitalize', fontWeight: 600,
            backgroundColor: `${SEVERITY_COLORS[v.severity]}15`,
            color: SEVERITY_COLORS[v.severity],
          }}
        />
        <Typography style={{ fontSize: 13, flex: 1, color: '#333' }} noWrap>
          {v.message}
        </Typography>
        {v.fixTier !== 'manual' && (
          <Chip
            size="small"
            label={v.fixTier === 'deterministic' ? 'Auto-fixable' : 'AI-fixable'}
            style={{
              fontSize: 10, height: 18,
              backgroundColor: v.fixTier === 'deterministic' ? `${statusColors.success}15` : `${statusColors.info}15`,
              color: v.fixTier === 'deterministic' ? statusColors.success : statusColors.info,
            }}
          />
        )}
        {v.fixTier === 'manual' && (
          <Typography style={{ fontSize: 11, color: '#999' }}>manual</Typography>
        )}
        <Chip size="small" label={v.ruleId} variant="outlined" style={{
          fontSize: 10, height: 18, fontFamily: 'monospace', borderColor: 'rgba(0,0,0,0.15)',
        }} />
        {repoUrl && isDevSpacesConnected && hasRole('developer') && (
          <Tooltip title={`Edit ${v.file}:${v.lineStart} in Dev Spaces`}>
            <IconButton
              size="small"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                window.open(`${DEVSPACES_BASE_URL}#${repoUrl}/tree/${branch ?? 'main'}/${v.file}?line=${v.lineStart}`, '_blank');
              }}
              style={{ padding: 4 }}
            >
              <CodeIcon style={{ fontSize: 14, color: '#666' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Collapse in={expanded}>
        <Box style={{ padding: '4px 16px 12px 48px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <Chip size="small" label={
              v.category === 'aap-compatibility' ? 'Compatibility' :
              v.category === 'best-practice' ? 'Best practice' :
              v.category.charAt(0).toUpperCase() + v.category.slice(1)
            } style={{
              fontSize: 10, height: 18,
              backgroundColor: v.category === 'aap-compatibility' ? `${statusColors.info}20` : 'transparent',
              color: v.category === 'aap-compatibility' ? statusColors.info : '#888',
              border: v.category === 'aap-compatibility' ? 'none' : '1px solid rgba(0,0,0,0.15)',
            }} />
          </Box>
          {v.fixTier !== 'manual' && (
            <Box style={{ padding: '8px 12px', borderRadius: 4, backgroundColor: '#f6f8fa', border: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography component="div" style={{ fontSize: 12, fontFamily: 'monospace', color: '#1a7f37', lineHeight: 1.6 }}>
                + {v.fixTier === 'deterministic'
                  ? `ansible.builtin.${v.ruleId.includes('fqcn') ? 'copy' : 'command'}:`
                  : `# AI-suggested remediation for ${v.ruleId}`}
              </Typography>
              <Typography component="div" style={{ fontSize: 12, fontFamily: 'monospace', color: '#cf222e', lineHeight: 1.6 }}>
                - {v.ruleId.includes('fqcn') ? 'copy:' : `# original at line ${v.lineStart}`}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Violations Card — grouped by file
// ---------------------------------------------------------------------------
const ViolationsCard = ({
  violations,
  categoryFilter,
  setCategoryFilter,
  severityFilter,
  repoUrl,
  branch,
}: {
  violations: QualityViolation[];
  categoryFilter: ViolationCategory | 'all';
  setCategoryFilter: (f: ViolationCategory | 'all') => void;
  severityFilter?: SeverityClass | null;
  repoUrl?: string;
  branch?: string;
}) => {
  const filtered = useMemo(() => {
    let result = violations;
    if (severityFilter) {
      result = result.filter(v => v.severity === severityFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter(v => v.category === categoryFilter);
    }
    return result;
  }, [violations, categoryFilter, severityFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    violations.forEach(v => { counts[v.category] = (counts[v.category] || 0) + 1; });
    return counts;
  }, [violations]);

  const grouped = useMemo(() => {
    const map = new Map<string, QualityViolation[]>();
    filtered.forEach(v => {
      const arr = map.get(v.file) || [];
      arr.push(v);
      map.set(v.file, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Box>
      <Box style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography style={{ fontSize: 14, fontWeight: 600 }}>
            Results ({filtered.length})
          </Typography>
          <Box display="flex" style={{ gap: 4 }}>
            {([
              { key: 'all' as const, label: 'All' },
              { key: 'aap-compatibility' as const, label: 'Compatibility' },
              { key: 'security' as const, label: 'Security' },
              { key: 'lint' as const, label: 'Lint' },
              { key: 'best-practice' as const, label: 'Best practice' },
            ] as const).filter(f => f.key === 'all' || categoryCounts[f.key]).map(f => (
              <Chip
                key={f.key} size="small" clickable
                label={f.key === 'all' ? f.label : `${f.label} (${categoryCounts[f.key]})`}
                onClick={() => setCategoryFilter(f.key)}
                variant={categoryFilter === f.key ? 'default' : 'outlined'}
                style={{
                  fontSize: 11, height: 22,
                  backgroundColor: categoryFilter === f.key ? `${statusColors.info}15` : undefined,
                  color: categoryFilter === f.key ? statusColors.info : '#666',
                  borderColor: categoryFilter === f.key ? statusColors.info : 'rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {grouped.map(([file, fileViolations]) => (
        <Box key={file}>
          <Box
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0,0,0,0.02)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
            display="flex" alignItems="center" justifyContent="space-between"
          >
            <Typography style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 500, color: '#333' }}>
              {file}
            </Typography>
            <Typography style={{ fontSize: 11, color: '#999' }}>
              {fileViolations.length} issue{fileViolations.length !== 1 ? 's' : ''}
              {fileViolations.filter(v => v.fixTier !== 'manual').length > 0 &&
                ` · ${fileViolations.filter(v => v.fixTier !== 'manual').length} fixable`}
            </Typography>
          </Box>
          {fileViolations.map((v, i) => (
            <ViolationRow
              key={`${v.ruleId}-${v.lineStart}-${i}`}
              v={v}
              repoUrl={repoUrl}
              branch={branch}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Scan History Section
// ---------------------------------------------------------------------------
const TRIGGER_LABELS: Record<string, string> = {
  push: 'Push',
  pull_request: 'Pull request',
  schedule: 'Schedule',
  manual: 'Manual',
};

const ScanHistorySection = ({ scans }: { scans: ScanResult[] }) => {
  const [expanded, setExpanded] = useState(false);

  if (scans.length === 0) return null;

  return (
    <Card variant="outlined" style={{ borderRadius: 12, marginTop: 20 }}>
      <Box
        display="flex" alignItems="center" justifyContent="space-between"
        style={{ padding: '12px 20px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
          <HistoryIcon style={{ fontSize: 18, color: '#666' }} />
          <Typography style={{ fontSize: 14, fontWeight: 600 }}>
            Scan history ({scans.length})
          </Typography>
        </Box>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      <Collapse in={expanded}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Date</TableCell>
              <TableCell style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Violations</TableCell>
              <TableCell style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Trigger</TableCell>
              <TableCell style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Commit</TableCell>
              <TableCell style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Source</TableCell>
              <TableCell style={{ fontSize: 12, fontWeight: 600, color: '#666' }} align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {scans.map(scan => (
              <TableRow key={scan.scanId} hover>
                <TableCell style={{ fontSize: 12 }}>{scan.createdAt}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={scan.totalViolations === 0 ? 'Clean' : `${scan.totalViolations} violations`}
                    style={{
                      fontSize: 10, height: 20,
                      backgroundColor: scan.totalViolations === 0 ? `${statusColors.success}15` : `${statusColors.error}15`,
                      color: scan.totalViolations === 0 ? statusColors.success : statusColors.error,
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={TRIGGER_LABELS[scan.trigger ?? 'manual'] ?? scan.trigger} variant="outlined" style={{ fontSize: 10, height: 18 }} />
                </TableCell>
                <TableCell style={{ fontSize: 11, fontFamily: 'monospace', color: '#666' }}>
                  {scan.commitHash.slice(0, 7)}
                </TableCell>
                <TableCell style={{ fontSize: 11, color: '#666' }}>
                  {scan.scanSource === 'github-action' ? 'GitHub Actions' : 'Manual'}
                </TableCell>
                <TableCell align="right">
                  {scan.ciRunUrl && (
                    <Tooltip title="View CI run">
                      <IconButton size="small" onClick={() => window.open(scan.ciRunUrl, '_blank')}>
                        <OpenInNewIcon style={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Collapse>
    </Card>
  );
};


// ---------------------------------------------------------------------------
// Main QualityTab
// ---------------------------------------------------------------------------
export const QualityTab = ({
  quality,
  projectName,
  initialSeverity,
  repoUrl,
  branch,
}: {
  quality: ProjectQualityData | null;
  projectName: string;
  initialView?: 'latest-scan';
  initialScanId?: string | null;
  initialSeverity?: SeverityClass | null;
  repoUrl?: string;
  branch?: string;
}) => {
  const { hasRole } = useUserRoleContext();
  const [categoryFilter, setCategoryFilter] = useState<ViolationCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityClass | null>(initialSeverity ?? null);

  if (!quality) {
    return (
      <Box style={{ marginTop: 24 }}>
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
            <VerifiedUserOutlinedIcon style={{ fontSize: 40, color: '#ccc', marginBottom: 12 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              No quality scans yet
            </Typography>
            <Typography style={{ fontSize: 13, color: '#888', maxWidth: 400, margin: '0 auto' }}>
              Quality scans run automatically as GitHub Actions when you push to this repository.
              Configure the APME scan workflow to check for compatibility issues, security risks, and best practice violations.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const scan = quality.latestScan;
  const fixableCount = scan.fixable;
  const manualCount = scan.manualReview;

  return (
    <Box style={{ marginTop: 24 }}>
      {/* Score + scan context bar */}
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 20 }}>
        <Box display="flex" alignItems="center" style={{ gap: 16 }}>
          <HealthScoreRing score={quality.healthScore} />
          <Box>
            <Typography style={{ fontSize: 14, fontWeight: 600 }}>
              Quality score: {quality.healthScore}/100
            </Typography>
            <Typography style={{ fontSize: 12, color: '#666' }}>
              Last scan {quality.lastScannedAt} · commit <code style={{ fontSize: 11 }}>{quality.lastScannedCommit?.slice(0, 7)}</code>
              {scan.trigger && ` · ${TRIGGER_LABELS[scan.trigger] ?? scan.trigger}`}
            </Typography>
          </Box>
        </Box>
        {scan.ciRunUrl && (
          <Button
            size="small" variant="text"
            startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
            onClick={() => window.open(scan.ciRunUrl, '_blank')}
            style={{ textTransform: 'none', fontSize: 12, color: '#666' }}
          >
            View CI run
          </Button>
        )}
      </Box>

      {/* Remediation banner */}
      {quality.remediationStatus !== 'none' && (
        <RemediationBanner
          status={quality.remediationStatus}
          quality={quality}
          repoUrl={repoUrl}
          branch={branch}
        />
      )}

      {/* Clean state */}
      {scan.totalViolations === 0 ? (
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '32px 24px', textAlign: 'center' }}>
            <CheckCircleIcon style={{ fontSize: 40, color: statusColors.success, marginBottom: 8 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500 }}>
              No violations detected
            </Typography>
            <Typography style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              This project passed all quality checks. Great work!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Violations summary card */}
          <Card variant="outlined" style={{ borderRadius: 12 }}>
            {/* Summary header */}
            <Box style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" style={{ gap: 16 }}>
                  <Typography style={{ fontSize: 28, fontWeight: 700, color: statusColors.error }}>
                    {scan.totalViolations}
                  </Typography>
                  <Box>
                    <Typography style={{ fontSize: 14, fontWeight: 500 }}>
                      Violations
                    </Typography>
                    <Typography style={{ fontSize: 12, color: '#666' }}>
                      {fixableCount} auto-fixable · {manualCount} manual review
                    </Typography>
                  </Box>
                </Box>
                {hasRole('developer') && fixableCount > 0 && quality.remediationStatus === 'none' && (
                  <Box style={{ textAlign: 'right' }}>
                    <Tooltip
                      title="Triggers an APME remediation workflow via GitHub Actions. Fixes will be available on a branch for you to review in Dev Spaces or your IDE."
                      arrow
                      placement="bottom-end"
                    >
                      <Button
                        variant="contained" color="primary" size="small"
                        startIcon={<BuildIcon style={{ fontSize: 16 }} />}
                        style={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Fix with AI
                      </Button>
                    </Tooltip>
                    <Typography style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      Review changes in Dev Spaces before merging
                    </Typography>
                  </Box>
                )}
                {hasRole('developer') && quality.remediationStatus === 'available' && (
                  <Box style={{ textAlign: 'right' }}>
                    <Tooltip
                      title="Triggers an APME remediation workflow via GitHub Actions. Fixes will be available on a branch for you to review."
                      arrow
                      placement="bottom-end"
                    >
                      <Button
                        variant="contained" color="primary" size="small"
                        startIcon={<BuildIcon style={{ fontSize: 16 }} />}
                        style={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Fix with AI
                      </Button>
                    </Tooltip>
                    <Typography style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      Review changes in Dev Spaces before merging
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box style={{ marginTop: 12 }}>
                <SeverityProgressBar breakdown={scan.severityBreakdown} />
                <Box style={{ marginTop: 6 }}>
                  <SeverityBar
                    breakdown={scan.severityBreakdown}
                    activeSeverity={severityFilter}
                    onSeverityClick={setSeverityFilter}
                  />
                </Box>
              </Box>
            </Box>

            {/* Violations list */}
            {quality.violations.length > 0 && (
              <ViolationsCard
                violations={quality.violations}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                severityFilter={severityFilter}
                repoUrl={repoUrl}
                branch={branch}
              />
            )}
          </Card>
        </>
      )}

      {/* Scan history */}
      <ScanHistorySection scans={quality.scanHistory} />
    </Box>
  );
};
