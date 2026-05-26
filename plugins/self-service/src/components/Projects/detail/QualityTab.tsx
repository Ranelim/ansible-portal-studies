import { useState, useMemo, useEffect } from 'react';
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
  LinearProgress,
  Checkbox,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CodeIcon from '@material-ui/icons/Code';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import BuildIcon from '@material-ui/icons/Build';
import VerifiedUserOutlinedIcon from '@material-ui/icons/VerifiedUserOutlined';
import { statusColors } from '../../common/statusColors';
import {
  type ProjectQualityData,
  type SeverityClass,
  type QualityViolation,
  type ViolationCategory,
  type RemediationStatus,
  SEVERITY_COLORS,
} from './qualityDemoData';

// ---------------------------------------------------------------------------
// Severity Bar
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
              backgroundColor: activeSeverity === sev ? `${SEVERITY_COLORS[sev]}15` : undefined,
              border: activeSeverity === sev ? `1px solid ${SEVERITY_COLORS[sev]}40` : '1px solid transparent',
              transition: 'all 0.15s ease',
            }}
            onClick={() => onSeverityClick?.(activeSeverity === sev ? null : sev)}
          >
            <Box style={{
              width: 10, height: 10, borderRadius: 2,
              backgroundColor: SEVERITY_COLORS[sev],
            }} />
            <Typography style={{
              fontSize: 12, textTransform: 'capitalize',
              color: activeSeverity === sev ? SEVERITY_COLORS[sev] : '#555',
              fontWeight: activeSeverity === sev ? 600 : 400,
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
// Demo proposals data — maps to violations by ruleId
// ---------------------------------------------------------------------------
const DEMO_PROPOSALS: Record<string, { desc: string; tier: 'deterministic' | 'ai' }> = {
  'fqcn[action-core]': { desc: 'Replace bare module name copy with fully qualified ansible.builtin.copy', tier: 'deterministic' },
  'aap-deprecated-syntax': { desc: 'Replace with_items loop syntax with the loop keyword', tier: 'deterministic' },
  'aap-removed-config': { desc: 'Rename callback_whitelist to callbacks_enabled in ansible.cfg', tier: 'deterministic' },
  'aap-deprecated-module': { desc: 'Replace ansible.builtin.yum with ansible.builtin.dnf (drop-in replacement)', tier: 'deterministic' },
  'aap-removed-param': { desc: 'Remove the warn parameter (no longer supported in ansible-core 2.17+)', tier: 'deterministic' },
  'aap-collection-update': { desc: 'Update community.general version requirement from 7.5.0 to >= 8.0.0', tier: 'deterministic' },
  'yaml[truthy]': { desc: 'Replace yes/no with true/false for YAML boolean consistency', tier: 'deterministic' },
  'risky-file-permissions': { desc: 'Add explicit mode: "0644" to the file task. Inferred from task context — verify permissions match your security requirements.', tier: 'ai' },
  'no-changed-when': { desc: 'Add changed_when: false to this status-check command. The task registers output but does not modify system state.', tier: 'ai' },
  'name[missing]': { desc: 'Add a descriptive task name based on module and parameters used', tier: 'deterministic' },
};

const DEMO_PROPOSALS_CONFIDENCE: Record<string, number> = {
  'risky-file-permissions': 0.94,
  'no-changed-when': 0.91,
  'name[missing]': 0.88,
};

// ---------------------------------------------------------------------------
// Violation Row — evolves per remediation state
// ---------------------------------------------------------------------------
type ViolationRowState = 'default' | 'fixing' | 'proposal' | 'no-fix' | 'skipped' | 'in-pr' | 'merged';

const ViolationRow = ({
  v, repoUrl, branch, rowState, proposalApproved, onToggleApproval, selected, onToggleSelect,
}: {
  v: QualityViolation;
  repoUrl?: string;
  branch?: string;
  rowState: ViolationRowState;
  proposalApproved?: boolean;
  onToggleApproval?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}) => {
  const { hasRole } = useUserRoleContext();
  const [expanded, setExpanded] = useState(false);
  const proposal = DEMO_PROPOSALS[v.ruleId];
  const showProposal = rowState === 'proposal' && proposal;

  const rowOpacity = rowState === 'fixing' ? 0.55
    : (rowState === 'proposal' && proposalApproved === false) ? 0.4
    : rowState === 'merged' ? 0.4
    : rowState === 'skipped' ? 0.6
    : 1;

  return (
    <Box style={{
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      opacity: rowOpacity,
      transition: 'opacity 0.2s',
    }}>
      {/* Main violation line */}
      <Box
        display="flex" alignItems="center"
        style={{ padding: '6px 16px 6px 16px', gap: 10, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.02)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      >
        <Checkbox
          checked={selected ?? false}
          onChange={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
          onClick={(e) => e.stopPropagation()}
          size="small"
          style={{ padding: 2, marginRight: -4 }}
          color="primary"
        />
        <Tooltip title={`Line ${v.lineStart} in ${v.file}`} arrow>
          <Typography style={{ fontSize: 11, fontFamily: 'monospace', color: '#999', cursor: 'default', minWidth: 28 }}>
            L{v.lineStart}
          </Typography>
        </Tooltip>

        <Chip
          size="small"
          label={v.severity}
          style={{
            fontSize: 10, height: 18, textTransform: 'capitalize', fontWeight: 600,
            backgroundColor: `${SEVERITY_COLORS[v.severity]}15`,
            color: SEVERITY_COLORS[v.severity],
          }}
        />

        <Chip
          size="small"
          label={
            v.category === 'aap-compatibility' ? 'Compatibility' :
            v.category === 'best-practice' ? 'Best practice' :
            v.category.charAt(0).toUpperCase() + v.category.slice(1)
          }
          variant="outlined"
          style={{
            fontSize: 10, height: 18,
            borderColor: v.category === 'aap-compatibility' ? `${statusColors.info}40` : 'rgba(0,0,0,0.12)',
            color: v.category === 'aap-compatibility' ? statusColors.info : '#888',
          }}
        />

        <Typography style={{ fontSize: 13, flex: 1, color: '#333' }} noWrap>
          {v.message}
        </Typography>

        {/* Status column — lifecycle + fix type */}
        <Box style={{ minWidth: 90, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        {rowState === 'fixing' ? (
          <Chip size="small" label="Analyzing" style={{
            fontSize: 10, height: 18,
            backgroundColor: `${statusColors.info}15`, color: statusColors.info, fontStyle: 'italic',
          }} />
        ) : rowState === 'no-fix' ? (
          <Tooltip title="APME could not generate a fix — requires manual attention" arrow>
            <Chip size="small" label="Open · Manual" style={{
              fontSize: 10, height: 18, backgroundColor: '#f5f5f5', color: '#999',
            }} />
          </Tooltip>
        ) : rowState === 'skipped' ? (
          <Tooltip title="You declined the suggested fix — violation is still open" arrow>
            <Chip size="small" label="Open · Skipped" style={{
              fontSize: 10, height: 18, backgroundColor: '#f5f5f5', color: '#999',
            }} />
          </Tooltip>
        ) : rowState === 'in-pr' ? (
          <Tooltip title="A fix for this violation is in an open pull request" arrow>
            <Chip size="small" label="Fix in PR" style={{
              fontSize: 10, height: 18,
              backgroundColor: `${statusColors.info}15`, color: statusColors.info,
            }} />
          </Tooltip>
        ) : rowState === 'merged' ? (
          <Tooltip title="This violation was fixed and merged" arrow>
            <Chip size="small" label="Resolved" style={{
              fontSize: 10, height: 18,
              backgroundColor: `${statusColors.success}15`, color: statusColors.success,
            }} />
          </Tooltip>
        ) : showProposal ? (
          <Tooltip title={
            proposalApproved
              ? `Suggested fix approved (${proposal.tier === 'deterministic' ? 'auto' : 'AI'}) — click to decline`
              : `Suggested fix declined — click to approve`
          } arrow>
            <Chip
              size="small"
              label={proposalApproved ? 'Suggested ✓' : 'Suggested'}
              clickable
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggleApproval?.(); }}
              style={{
                fontSize: 10, height: 18, cursor: 'pointer',
                backgroundColor: proposalApproved ? `${statusColors.success}15` : '#fff3e0',
                color: proposalApproved ? statusColors.success : '#e65100',
                border: proposalApproved ? `1px solid ${statusColors.success}40` : '1px solid #ffcc80',
              }}
            />
          </Tooltip>
        ) : v.fixTier === 'manual' ? (
          <Tooltip title="Requires manual fix — no automated suggestion available" arrow>
            <Chip size="small" label="Open · Manual" style={{
              fontSize: 10, height: 18, backgroundColor: '#f5f5f5', color: '#999',
            }} />
          </Tooltip>
        ) : (
          <Tooltip title={v.fixTier === 'deterministic' ? 'Can be auto-fixed with a rule-based transform' : 'Can be fixed with AI assistance'} arrow>
            <Chip size="small" label={v.fixTier === 'deterministic' ? 'Open · Auto' : 'Open · AI'} style={{
              fontSize: 10, height: 18, backgroundColor: '#f5f5f5', color: '#666',
            }} />
          </Tooltip>
        )}
        </Box>

        {/* IDE column — aligned with header */}
        {repoUrl && isDevSpacesConnected && hasRole('developer') ? (
          <Box style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <Tooltip title={`Open ${v.file}:${v.lineStart} in Dev Spaces`} arrow>
              <IconButton
                size="small"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  window.open(`${DEVSPACES_BASE_URL}#${repoUrl}/tree/${branch ?? 'main'}/${v.file}?line=${v.lineStart}`, '_blank');
                }}
                style={{ padding: 4, borderRadius: 4 }}
              >
                <CodeIcon style={{ fontSize: 16, color: '#999' }} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null}
      </Box>

      {/* Expandable detail — violation metadata from APME */}
      <Collapse in={expanded}>
        <Box style={{ padding: '8px 16px 12px 48px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Rule description */}
          <Typography style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>
            {v.ruleDescription}
          </Typography>

          {/* Metadata grid */}
          <Box style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px',
            fontSize: 12, color: '#666',
          }}>
            <Box display="flex" style={{ gap: 6 }}>
              <Typography style={{ fontSize: 11, color: '#999', minWidth: 60 }}>File</Typography>
              <Typography style={{ fontSize: 11, fontFamily: 'monospace', color: '#333' }}>{v.file}:{v.lineStart}</Typography>
            </Box>
            <Box display="flex" style={{ gap: 6 }}>
              <Typography style={{ fontSize: 11, color: '#999', minWidth: 60 }}>Scope</Typography>
              <Typography style={{ fontSize: 11, color: '#333', textTransform: 'capitalize' }}>{v.scope}</Typography>
            </Box>
            {v.yamlPath && (
              <Box display="flex" style={{ gap: 6 }}>
                <Typography style={{ fontSize: 11, color: '#999', minWidth: 60 }}>Path</Typography>
                <Typography style={{ fontSize: 11, fontFamily: 'monospace', color: '#333' }} noWrap>{v.yamlPath}</Typography>
              </Box>
            )}
            <Box display="flex" style={{ gap: 6 }}>
              <Typography style={{ fontSize: 11, color: '#999', minWidth: 60 }}>Source</Typography>
              <Typography style={{ fontSize: 11, color: '#333' }}>{v.validatorSource}</Typography>
            </Box>
            <Box display="flex" style={{ gap: 6 }}>
              <Typography style={{ fontSize: 11, color: '#999', minWidth: 60 }}>Rule</Typography>
              <Typography style={{ fontSize: 11, fontFamily: 'monospace', color: '#333' }}>{v.ruleId}</Typography>
            </Box>
          </Box>

          {/* Proposal explanation — only in proposals state */}
          {showProposal && proposal && (
            <Box style={{ padding: '8px 12px', borderRadius: 4, backgroundColor: proposal.tier === 'ai' ? `${statusColors.info}08` : `${statusColors.success}08`, border: `1px solid ${proposal.tier === 'ai' ? statusColors.info : statusColors.success}20` }}>
              <Typography style={{ fontSize: 11, fontWeight: 600, color: proposal.tier === 'ai' ? statusColors.info : statusColors.success, marginBottom: 2 }}>
                {proposal.tier === 'ai' ? 'AI-generated fix' : 'Deterministic fix'}{proposal.tier === 'ai' ? ` · ${Math.round((DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) * 100)}% confidence` : ''}
              </Typography>
              <Typography style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                {proposal.desc}
              </Typography>
            </Box>
          )}

          {/* Manual violation guidance — AI reason/suggestion when available */}
          {v.fixTier === 'manual' && (v.aiReason || v.aiSuggestion) && (
            <Box style={{ padding: '8px 12px', borderRadius: 4, backgroundColor: '#fff8e1', border: '1px solid #ffe082' }}>
              {v.aiReason && (
                <Typography style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                  {v.aiReason}
                </Typography>
              )}
              {v.aiSuggestion && (
                <Typography style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                  {v.aiSuggestion}
                </Typography>
              )}
            </Box>
          )}

          {/* Actions */}
          <Box display="flex" alignItems="center" style={{ gap: 8, marginTop: 2 }}>
            {repoUrl && isDevSpacesConnected && hasRole('developer') && (
              <Chip
                size="small" clickable
                icon={<CodeIcon style={{ fontSize: 12 }} />}
                label="Review in Dev Spaces"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  window.open(`${DEVSPACES_BASE_URL}#${repoUrl}/tree/${branch ?? 'main'}/${v.file}?line=${v.lineStart}`, '_blank');
                }}
                style={{ fontSize: 10, height: 22, color: statusColors.info, borderColor: statusColors.info }}
                variant="outlined"
              />
            )}
            <Chip
              size="small"
              label={
                v.category === 'aap-compatibility' ? 'Compatibility' :
                v.category === 'best-practice' ? 'Best practice' :
                v.category.charAt(0).toUpperCase() + v.category.slice(1)
              }
              style={{
                fontSize: 10, height: 20,
                backgroundColor: v.category === 'aap-compatibility' ? `${statusColors.info}15` : 'transparent',
                color: v.category === 'aap-compatibility' ? statusColors.info : '#888',
                border: v.category === 'aap-compatibility' ? 'none' : '1px solid rgba(0,0,0,0.12)',
              }}
            />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Unified Violations Card — header evolves, rows evolve per state
// ---------------------------------------------------------------------------
const TRIGGER_LABELS: Record<string, string> = {
  push: 'Push',
  pull_request: 'Pull request',
  schedule: 'Schedule',
  manual: 'Manual',
};

// ---------------------------------------------------------------------------
// Main QualityTab
// ---------------------------------------------------------------------------
const DEMO_REMEDIATION_STATES: RemediationStatus[] = [
  'none', 'available', 'in-progress', 'proposals-ready', 'pr-open', 'pr-merged',
];

const DEMO_STATE_LABELS: Record<RemediationStatus, string> = {
  'none': 'None',
  'available': 'Available',
  'in-progress': 'In progress',
  'proposals-ready': 'Proposals',
  'pr-open': 'PR open',
  'pr-merged': 'Merged',
};

const DemoStateToolbar = ({
  currentState,
  onStateChange,
}: {
  currentState: RemediationStatus;
  onStateChange: (state: RemediationStatus) => void;
}) => (
  <Box style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', marginBottom: 16, borderRadius: 8,
    backgroundColor: '#FFF3CD', border: '1px solid #FFECB5',
  }}>
    <Typography style={{ fontSize: 11, fontWeight: 600, color: '#856404', marginRight: 4 }}>
      DEMO
    </Typography>
    {DEMO_REMEDIATION_STATES.map(state => (
      <Chip
        key={state}
        size="small"
        label={DEMO_STATE_LABELS[state]}
        onClick={() => onStateChange(state)}
        style={{
          fontSize: 10, height: 22, cursor: 'pointer',
          backgroundColor: currentState === state ? '#856404' : 'transparent',
          color: currentState === state ? '#fff' : '#856404',
          border: `1px solid ${currentState === state ? '#856404' : '#FFECB5'}`,
          fontWeight: currentState === state ? 600 : 400,
        }}
      />
    ))}
  </Box>
);

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
  const isDeveloper = hasRole('developer');
  const [categoryFilter, setCategoryFilter] = useState<ViolationCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityClass | null>(initialSeverity ?? null);
  const [demoRemediationState, setDemoRemediationState] = useState<RemediationStatus | null>(null);
  const [approvedProposals, setApprovedProposals] = useState<Set<string>>(new Set());
  const [selectedViolations, setSelectedViolations] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

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
  const activeRemStatus = demoRemediationState ?? quality.remediationStatus;

  const demoQuality: ProjectQualityData = demoRemediationState
    ? {
        ...quality,
        remediationStatus: demoRemediationState,
        remediationBranch: !['none', 'available'].includes(demoRemediationState)
          ? 'apme/remediate-demo' : undefined,
        remediationPrUrl: ['pr-open', 'pr-merged'].includes(demoRemediationState)
          ? `https://github.com/acme-corp/${projectName}/pull/99` : undefined,
        remediationSummary: ['in-progress', 'proposals-ready', 'pr-open', 'pr-merged'].includes(demoRemediationState)
          ? { addressed: fixableCount, remaining: manualCount, autoFixed: Math.ceil(fixableCount * 0.7), aiProposed: Math.floor(fixableCount * 0.3) }
          : undefined,
      }
    : quality;

  // Auto-approve fixable violations (excluding failed ones) when entering proposals-ready
  useEffect(() => {
    if (activeRemStatus === 'proposals-ready') {
      const fixable = quality.violations
        .filter(v => v.fixTier !== 'manual')
        .map(v => getViolationKey(v))
        .filter(k => !failedFixes.has(k));
      setApprovedProposals(new Set(fixable));
    }
  }, [activeRemStatus]);

  // Animate progress for in-progress state
  useEffect(() => {
    if (activeRemStatus !== 'in-progress') { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 6 + Math.random() * 10, 95);
        return next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [activeRemStatus]);

  const handleFixClick = () => {
    setDemoRemediationState('in-progress');
    setProgress(0);
    setTimeout(() => setDemoRemediationState('proposals-ready'), 3500);
  };

  const toggleProposal = (key: string) => {
    setApprovedProposals(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getViolationKey = (v: QualityViolation) => v.ruleId + ':' + v.file + ':' + v.lineStart;

  // Simulate one AI violation that fails to get a fix
  const failedFixes = useMemo(() => {
    const aiViolations = quality.violations.filter(v => v.fixTier === 'ai');
    if (aiViolations.length > 1) return new Set([getViolationKey(aiViolations[aiViolations.length - 1])]);
    return new Set<string>();
  }, [quality.violations]);

  const getRowState = (v: QualityViolation): ViolationRowState => {
    if (v.fixTier === 'manual') return 'default';
    const key = getViolationKey(v);
    const isFailed = failedFixes.has(key);
    const isApproved = approvedProposals.has(key);

    switch (activeRemStatus) {
      case 'in-progress': return 'fixing';
      case 'proposals-ready':
        if (isFailed) return 'no-fix';
        return 'proposal';
      case 'pr-open':
      case 'pr-merged':
        if (isFailed) return 'no-fix';
        if (!isApproved) return 'skipped';
        return activeRemStatus === 'pr-open' ? 'in-pr' : 'merged';
      default: return 'default';
    }
  };

  // Filter violations
  const filteredViolations = useMemo(() => {
    let result = quality.violations;
    if (severityFilter) result = result.filter(v => v.severity === severityFilter);
    if (categoryFilter !== 'all') result = result.filter(v => v.category === categoryFilter);
    return result;
  }, [quality.violations, categoryFilter, severityFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quality.violations.forEach(v => { counts[v.category] = (counts[v.category] || 0) + 1; });
    return counts;
  }, [quality.violations]);

  const grouped = useMemo(() => {
    const map = new Map<string, QualityViolation[]>();
    filteredViolations.forEach(v => {
      const arr = map.get(v.file) || [];
      arr.push(v);
      map.set(v.file, arr);
    });
    return Array.from(map.entries());
  }, [filteredViolations]);

  // Compute header content based on state
  const approvedCount = approvedProposals.size;

  return (
    <Box style={{ marginTop: 24 }}>
      <DemoStateToolbar currentState={activeRemStatus} onStateChange={setDemoRemediationState} />

      {/* Scan context bar */}
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 20 }}>
        <Typography style={{ fontSize: 13, color: '#666' }}>
          Last scan {quality.lastScannedAt} · commit <code style={{ fontSize: 11 }}>{quality.lastScannedCommit?.slice(0, 7)}</code>
          {scan.trigger && ` · ${TRIGGER_LABELS[scan.trigger] ?? scan.trigger}`}
        </Typography>
        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
          {isDeveloper && (
            <Button
              size="small" variant="outlined"
              startIcon={<AutorenewIcon style={{ fontSize: 14 }} />}
              disabled={activeRemStatus === 'in-progress'}
              onClick={() => setDemoRemediationState('none')}
              style={{ textTransform: 'none', fontSize: 12, color: activeRemStatus === 'in-progress' ? '#ccc' : '#666' }}
            >
              Scan
            </Button>
          )}
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
      </Box>

      {/* Empty state */}
      {scan.totalViolations === 0 ? (
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '32px 24px', textAlign: 'center' }}>
            <CheckCircleIcon style={{ fontSize: 40, color: statusColors.success, marginBottom: 8 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500 }}>No violations detected</Typography>
            <Typography style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              This project passed all quality checks.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined" style={{ borderRadius: 12, overflow: 'visible' }}>

          {/* ── Card header — evolves with remediation state ── */}
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
                    {fixableCount} auto-fixable · {manualCount} manual
                  </Typography>
                </Box>
              </Box>

              {/* Action area — changes per state */}
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                {isDevSpacesConnected && isDeveloper && quality.violations.length > 0 && (
                  <Button
                    size="small" variant="outlined"
                    startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                    onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${branch ?? 'main'}`, '_blank')}
                    style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                  >
                    Review in Dev Spaces
                  </Button>
                )}
                {activeRemStatus === 'pr-merged' && (
                  <Chip
                    icon={<CheckCircleIcon style={{ fontSize: 14, color: statusColors.success }} />}
                    label="Fixes merged"
                    style={{ fontSize: 11, backgroundColor: `${statusColors.success}15`, color: statusColors.success }}
                  />
                )}
              </Box>
            </Box>

            {/* Progress bar for in-progress */}
            {activeRemStatus === 'in-progress' && (
              <Box style={{ marginTop: 12 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 4 }}>
                  <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                    <AutorenewIcon style={{ fontSize: 14, color: statusColors.info, animation: 'spin 1.5s linear infinite' }} />
                    <Typography style={{ fontSize: 12, color: statusColors.info, fontWeight: 500 }}>
                      Generating suggestions…
                    </Typography>
                  </Box>
                  <Typography style={{ fontSize: 11, color: '#999' }}>
                    {Math.round(progress)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  style={{ height: 4, borderRadius: 2, backgroundColor: '#eee' }}
                />
              </Box>
            )}

            {/* Proposals summary line */}
            {activeRemStatus === 'proposals-ready' && (
              <Box display="flex" alignItems="center" style={{ marginTop: 10, gap: 16 }}>
                <Typography style={{ fontSize: 12, color: '#666' }}>
                  {approvedCount} of {fixableCount - failedFixes.size} proposals approved
                </Typography>
                <Typography style={{ fontSize: 11, color: '#999' }}>
                  {Math.ceil(fixableCount * 0.7)} deterministic · {Math.floor(fixableCount * 0.3)} AI-assisted
                </Typography>
                {failedFixes.size > 0 && (
                  <Typography style={{ fontSize: 11, color: '#e65100' }}>
                    {failedFixes.size} failed
                  </Typography>
                )}
              </Box>
            )}

            {/* PR/merged summary line */}
            {(activeRemStatus === 'pr-open' || activeRemStatus === 'pr-merged') && demoQuality.remediationSummary && (
              <Box display="flex" alignItems="center" style={{ marginTop: 10, gap: 16 }}>
                <Typography style={{ fontSize: 12, color: statusColors.success, fontWeight: 500 }}>
                  {demoQuality.remediationSummary.addressed} fixed in PR
                </Typography>
                {demoQuality.remediationSummary.remaining > 0 && (
                  <Typography style={{ fontSize: 12, color: '#8a6d00' }}>
                    {demoQuality.remediationSummary.remaining} require manual attention
                  </Typography>
                )}
              </Box>
            )}

            {/* Severity bar — always visible */}
            <Box style={{ marginTop: activeRemStatus === 'in-progress' ? 8 : 12 }}>
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

          {/* ── Inline PR notification ── */}
          {(activeRemStatus === 'proposals-ready' || activeRemStatus === 'pr-open') && (
            <Box
              display="flex" alignItems="center" justifyContent="space-between"
              style={{
                padding: '10px 20px',
                backgroundColor: activeRemStatus === 'pr-open' ? `${statusColors.info}08` : `${statusColors.success}06`,
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {activeRemStatus === 'proposals-ready' && (
                <>
                  <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                    <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                    <Typography style={{ fontSize: 13, color: '#333' }}>
                      <strong>{approvedCount}</strong> fixes approved — ready to create a pull request
                    </Typography>
                  </Box>
                  <Button
                    variant="contained" color="primary" size="small"
                    disabled={approvedCount === 0}
                    onClick={() => setDemoRemediationState('pr-open')}
                    style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                  >
                    Create pull request
                  </Button>
                </>
              )}
              {activeRemStatus === 'pr-open' && (
                <>
                  <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                    <OpenInNewIcon style={{ fontSize: 16, color: statusColors.info }} />
                    <Typography style={{ fontSize: 13, color: '#333' }}>
                      Pull request open with {demoQuality.remediationSummary?.addressed ?? 0} fixes
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                    {isDevSpacesConnected && isDeveloper && (
                      <Button
                        size="small" variant="outlined"
                        startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                        onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${demoQuality.remediationBranch ?? 'main'}`, '_blank')}
                        style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                      >
                        Review in Dev Spaces
                      </Button>
                    )}
                    <Button
                      size="small" variant="contained" color="primary"
                      startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                      onClick={() => window.open(demoQuality.remediationPrUrl, '_blank')}
                      style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                    >
                      View pull request
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* ── Category filter + select/actions bar ── */}
          <Box style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              {/* Left: Select button + actions */}
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <Button
                  size="small" variant="outlined"
                  startIcon={
                    <Checkbox
                      checked={selectedViolations.size > 0 && selectedViolations.size === filteredViolations.length}
                      indeterminate={selectedViolations.size > 0 && selectedViolations.size < filteredViolations.length}
                      size="small"
                      style={{ padding: 0 }}
                      color="primary"
                      tabIndex={-1}
                    />
                  }
                  onClick={() => {
                    if (selectedViolations.size === filteredViolations.length) {
                      setSelectedViolations(new Set());
                    } else {
                      setSelectedViolations(new Set(filteredViolations.map(v => getViolationKey(v))));
                    }
                  }}
                  style={{
                    textTransform: 'none', fontSize: 11, fontWeight: 500, minWidth: 0, padding: '2px 10px',
                    borderColor: selectedViolations.size > 0 ? statusColors.info : 'rgba(0,0,0,0.15)',
                    color: selectedViolations.size > 0 ? statusColors.info : '#666',
                    backgroundColor: selectedViolations.size > 0 ? `${statusColors.info}08` : undefined,
                  }}
                >
                  {selectedViolations.size > 0
                    ? (selectedViolations.size === filteredViolations.length ? `All ${selectedViolations.size} selected` : `${selectedViolations.size} selected`)
                    : 'Select'}
                </Button>
                {isDeveloper && (activeRemStatus === 'none' || activeRemStatus === 'available') && fixableCount > 0 && (
                  <Button
                    variant="outlined" size="small"
                    startIcon={<BuildIcon style={{ fontSize: 14 }} />}
                    disabled={selectedViolations.size === 0}
                    onClick={handleFixClick}
                    style={{ textTransform: 'none', fontSize: 11, fontWeight: 500, padding: '2px 10px' }}
                  >
                    Suggest fixes
                  </Button>
                )}
                {isDevSpacesConnected && isDeveloper && selectedViolations.size > 0 && (
                  <Button
                    size="small" variant="outlined"
                    startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                    onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${branch ?? 'main'}`, '_blank')}
                    style={{ textTransform: 'none', fontSize: 11, fontWeight: 500, padding: '2px 10px' }}
                  >
                    Review in Dev Spaces
                  </Button>
                )}
              </Box>
              {/* Right: Category filters */}
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

          {/* ── Sticky column headers ── */}
          <Box
            display="flex" alignItems="center" justifyContent="space-between"
            style={{
              padding: '4px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: '#fafafa',
              position: 'sticky',
              top: 64,
              zIndex: 10,
            }}
          >
            <Typography style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Violation
            </Typography>
            <Box display="flex" alignItems="center" style={{ gap: 16 }}>
              <Typography style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 80, textAlign: 'right' }}>
                Status
              </Typography>
              {repoUrl && isDevSpacesConnected && (
                <Typography style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, width: 28, textAlign: 'center' }}>
                  IDE
                </Typography>
              )}
            </Box>
          </Box>

          {/* ── Violation rows — each row evolves per state ── */}
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
              {fileViolations.map((v, i) => {
                const key = getViolationKey(v);
                const rowState = getRowState(v);
                return (
                  <ViolationRow
                    key={`${v.ruleId}-${v.lineStart}-${i}`}
                    v={v}
                    repoUrl={repoUrl}
                    branch={branch}
                    rowState={rowState}
                    proposalApproved={rowState === 'proposal' ? approvedProposals.has(key) : undefined}
                    onToggleApproval={rowState === 'proposal' ? () => toggleProposal(key) : undefined}
                    selected={selectedViolations.has(key)}
                    onToggleSelect={() => {
                      setSelectedViolations(prev => {
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      });
                    }}
                  />
                );
              })}
            </Box>
          ))}
        </Card>
      )}
    </Box>
  );
};
