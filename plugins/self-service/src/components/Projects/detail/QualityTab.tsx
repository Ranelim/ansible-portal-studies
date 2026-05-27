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
  Tabs,
  Tab,
  makeStyles,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CodeIcon from '@material-ui/icons/Code';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import BuildIcon from '@material-ui/icons/Build';
import VerifiedUserOutlinedIcon from '@material-ui/icons/VerifiedUserOutlined';
import CloseIcon from '@material-ui/icons/Close';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
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
const DEMO_PROPOSALS: Record<string, { desc: string; tier: 'deterministic' | 'ai'; removed: string[]; added: string[] }> = {
  'fqcn[action-core]': {
    desc: 'Replace bare module name copy with fully qualified ansible.builtin.copy',
    tier: 'deterministic',
    removed: ['    - copy:'],
    added: ['    - ansible.builtin.copy:'],
  },
  'aap-deprecated-syntax': {
    desc: 'Replace with_items loop syntax with the loop keyword',
    tier: 'deterministic',
    removed: ['      with_items: "{{ packages }}"'],
    added: ['      loop: "{{ packages }}"'],
  },
  'aap-removed-config': {
    desc: 'Rename callback_whitelist to callbacks_enabled in ansible.cfg',
    tier: 'deterministic',
    removed: ['callback_whitelist = profile_tasks, timer'],
    added: ['callbacks_enabled = profile_tasks, timer'],
  },
  'aap-deprecated-module': {
    desc: 'Replace ansible.builtin.yum with ansible.builtin.dnf (drop-in replacement)',
    tier: 'deterministic',
    removed: ['    - ansible.builtin.yum:'],
    added: ['    - ansible.builtin.dnf:'],
  },
  'aap-removed-param': {
    desc: 'Remove the warn parameter (no longer supported in ansible-core 2.17+)',
    tier: 'deterministic',
    removed: ['        warn: false'],
    added: [],
  },
  'aap-collection-update': {
    desc: 'Update community.general version requirement from 7.5.0 to >= 8.0.0',
    tier: 'deterministic',
    removed: ['  - name: community.general', '    version: ">=7.5.0"'],
    added: ['  - name: community.general', '    version: ">=8.0.0"'],
  },
  'yaml[truthy]': {
    desc: 'Replace yes/no with true/false for YAML boolean consistency',
    tier: 'deterministic',
    removed: ['enable_reporting: yes'],
    added: ['enable_reporting: true'],
  },
  'risky-file-permissions': {
    desc: 'Add explicit mode: "0644" to the file task. Inferred from task context — verify permissions match your security requirements.',
    tier: 'ai',
    removed: [
      '    - name: Write patch report',
      '      ansible.builtin.copy:',
      '        content: "{{ patch_results | to_nice_yaml }}"',
      '        dest: /var/log/patch-report.yml',
    ],
    added: [
      '    - name: Write patch report',
      '      ansible.builtin.copy:',
      '        content: "{{ patch_results | to_nice_yaml }}"',
      '        dest: /var/log/patch-report.yml',
      '        mode: "0644"',
    ],
  },
  'no-changed-when': {
    desc: 'Add changed_when: false to this status-check command. The task registers output but does not modify system state.',
    tier: 'ai',
    removed: [
      '    - name: Check current patch level',
      '      ansible.builtin.command:',
      '        cmd: rpm -qa --last',
      '      register: patch_level',
    ],
    added: [
      '    - name: Check current patch level',
      '      ansible.builtin.command:',
      '        cmd: rpm -qa --last',
      '      register: patch_level',
      '      changed_when: false',
    ],
  },
  'name[missing]': {
    desc: 'Add a descriptive task name based on module and parameters used',
    tier: 'deterministic',
    removed: ['    - ansible.builtin.file:'],
    added: ['    - name: Ensure rollback directory exists', '      ansible.builtin.file:'],
  },
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

  const statusLabel = rowState === 'fixing' ? 'Generating…'
    : rowState === 'in-pr' ? 'In pull request'
    : rowState === 'merged' ? 'Fixed'
    : rowState === 'proposal' ? 'Review fix'
    : rowState === 'no-fix' ? 'Manual'
    : v.fixTier === 'manual' ? 'Manual'
    : 'Fixable';

  const statusColor = rowState === 'fixing' ? statusColors.info
    : rowState === 'in-pr' ? statusColors.info
    : rowState === 'merged' ? statusColors.success
    : rowState === 'proposal' ? statusColors.success
    : rowState === 'no-fix' ? '#999'
    : v.fixTier === 'manual' ? '#999'
    : statusColors.success;

  return (
    <Box style={{
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      opacity: rowOpacity,
      transition: 'opacity 0.2s',
    }}>
      {/* Main violation line */}
      <Box
        display="flex" alignItems="center"
        style={{ padding: '6px 16px 6px 12px', gap: 10, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.02)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      >
        <ChevronRightIcon style={{
          fontSize: 16, color: '#999',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          flexShrink: 0,
        }} />

        <Checkbox
          checked={selected ?? false}
          onChange={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
          onClick={(e) => e.stopPropagation()}
          size="small"
          style={{ padding: 2, marginRight: -4 }}
          color="primary"
        />

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

        {/* Status */}
        <Typography style={{
          fontSize: 11, color: statusColor, fontWeight: 500,
          minWidth: 80, textAlign: 'right', flexShrink: 0,
          fontStyle: rowState === 'fixing' ? 'italic' : 'normal',
        }}>
          {statusLabel}
        </Typography>

        {/* IDE column */}
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

      {/* Expandable detail */}
      <Collapse in={expanded}>
        <Box style={{ padding: '8px 16px 12px 52px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Description + rule ID */}
          <Box>
            <Typography style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>
              {v.ruleDescription}
            </Typography>
            <Typography style={{ fontSize: 10, fontFamily: 'monospace', color: '#999', marginTop: 2 }}>
              {v.ruleId} · line {v.lineStart}
            </Typography>
          </Box>

          {/* Proposal diff */}
          {showProposal && proposal && (
            <Box style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.15)' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(0,0,0,0.04)',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
              }}>
                <Typography style={{ fontSize: 11, color: '#666' }}>
                  {proposal.desc}
                </Typography>
                {proposal.tier === 'ai' && (
                  <Typography style={{ fontSize: 10, color: statusColors.info, fontWeight: 500 }}>
                    AI-assisted · {Math.round((DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) * 100)}% confidence
                  </Typography>
                )}
              </Box>
              <Box style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}>
                {proposal.removed.map((line, i) => (
                  <Box key={`r-${i}`} style={{
                    padding: '1px 12px 1px 24px',
                    backgroundColor: 'rgba(248, 81, 73, 0.15)',
                    color: '#cf222e',
                    position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', left: 10, userSelect: 'none', color: '#cf222e', opacity: 0.7 }}>−</span>
                    {line}
                  </Box>
                ))}
                {proposal.added.map((line, i) => (
                  <Box key={`a-${i}`} style={{
                    padding: '1px 12px 1px 24px',
                    backgroundColor: 'rgba(46, 160, 67, 0.15)',
                    color: '#1a7f37',
                    position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', left: 10, userSelect: 'none', color: '#1a7f37', opacity: 0.7 }}>+</span>
                    {line}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Manual violation guidance */}
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

          {/* Dev Spaces link */}
          {repoUrl && isDevSpacesConnected && hasRole('developer') && (
            <Box display="flex" alignItems="center" style={{ gap: 6, marginTop: 2 }}>
              <CodeIcon style={{ fontSize: 14, color: statusColors.info }} />
              <Typography
                component="a"
                style={{
                  fontSize: 11, color: statusColors.info, cursor: 'pointer',
                  textDecoration: 'none',
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  window.open(`${DEVSPACES_BASE_URL}#${repoUrl}/tree/${branch ?? 'main'}/${v.file}?line=${v.lineStart}`, '_blank');
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
              >
                Open in Dev Spaces
              </Typography>
            </Box>
          )}
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
  merged = false,
}: {
  quality: ProjectQualityData | null;
  projectName: string;
  initialView?: 'latest-scan';
  initialScanId?: string | null;
  initialSeverity?: SeverityClass | null;
  repoUrl?: string;
  branch?: string;
  merged?: boolean;
}) => {
  const { hasRole } = useUserRoleContext();
  const isDeveloper = hasRole('developer');
  const [categoryFilter, setCategoryFilter] = useState<ViolationCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityClass | null>(initialSeverity ?? null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs-attention' | 'in-pr' | 'fixed'>('all');
  const [demoRemediationState, setDemoRemediationState] = useState<RemediationStatus | null>(null);
  const [approvedProposals, setApprovedProposals] = useState<Set<string>>(new Set());
  const [selectedViolations, setSelectedViolations] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

  // Animate scan progress
  useEffect(() => {
    if (!scanning) { setScanProgress(0); return; }
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const next = Math.min(prev + 8 + Math.random() * 12, 95);
        return next;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [scanning]);

  const handleScanClick = () => {
    setScanning(true);
    setScanProgress(0);
    setDemoRemediationState(null);
    setApprovedProposals(new Set());
    setSelectedViolations(new Set());
    setBannerDismissed(false);
    setActiveTab(0);
    setTimeout(() => {
      setScanning(false);
      setDemoRemediationState('available');
    }, 2500);
  };

  const handleFixClick = () => {
    setDemoRemediationState('in-progress');
    setProgress(0);
    setBannerDismissed(false);
    if (!merged) setActiveTab(1);
    setTimeout(() => {
      setDemoRemediationState('proposals-ready');
      setBannerDismissed(false);
    }, 3500);
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
    if (statusFilter !== 'all') {
      result = result.filter(v => {
        const rs = getRowState(v);
        if (statusFilter === 'needs-attention') return rs === 'default' || rs === 'proposal' || rs === 'no-fix';
        if (statusFilter === 'in-pr') return rs === 'in-pr';
        if (statusFilter === 'fixed') return rs === 'merged';
        return true;
      });
    }
    return result;
  }, [quality.violations, categoryFilter, severityFilter, statusFilter, activeRemStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quality.violations.forEach(v => { counts[v.category] = (counts[v.category] || 0) + 1; });
    return counts;
  }, [quality.violations]);

  const statusCounts = useMemo(() => {
    const counts = { 'needs-attention': 0, 'in-pr': 0, 'fixed': 0 };
    quality.violations.forEach(v => {
      const rs = getRowState(v);
      if (rs === 'default' || rs === 'proposal' || rs === 'no-fix') counts['needs-attention']++;
      else if (rs === 'in-pr') counts['in-pr']++;
      else if (rs === 'merged') counts['fixed']++;
    });
    return counts;
  }, [quality.violations, activeRemStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    const map = new Map<string, QualityViolation[]>();
    filteredViolations.forEach(v => {
      const arr = map.get(v.file) || [];
      arr.push(v);
      map.set(v.file, arr);
    });
    return Array.from(map.entries());
  }, [filteredViolations]);

  // Tab-specific violation lists
  const suggestedViolations = useMemo(() =>
    quality.violations.filter(v => v.fixTier !== 'manual' && !failedFixes.has(getViolationKey(v))),
    [quality.violations, failedFixes]
  );

  const suggestedCount = suggestedViolations.length;

  // Which violations to show based on active tab
  const tabViolations = useMemo(() => {
    if (activeTab === 1) return suggestedViolations;
    return filteredViolations;
  }, [activeTab, filteredViolations, suggestedViolations]);

  const tabGrouped = useMemo(() => {
    let source = tabViolations;
    if (activeTab === 0) {
      if (severityFilter) source = source.filter(v => v.severity === severityFilter);
      if (categoryFilter !== 'all') source = source.filter(v => v.category === categoryFilter);
    }
    const map = new Map<string, QualityViolation[]>();
    source.forEach(v => {
      const arr = map.get(v.file) || [];
      arr.push(v);
      map.set(v.file, arr);
    });
    return Array.from(map.entries());
  }, [tabViolations, activeTab, severityFilter, categoryFilter]);

  const approvedCount = approvedProposals.size;

  const showSuggestionsTab = ['proposals-ready', 'pr-open', 'pr-merged'].includes(activeRemStatus);

  const scanContextBar = (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: scanning ? 8 : 20 }}>
        <Typography style={{ fontSize: 13, color: '#666' }}>
          {scanning ? (
            <>Scanning repository…</>
          ) : (
            <>Last scan {quality.lastScannedAt} · commit <code style={{ fontSize: 11 }}>{quality.lastScannedCommit?.slice(0, 7)}</code>
            {scan.trigger && ` · ${TRIGGER_LABELS[scan.trigger] ?? scan.trigger}`}</>
          )}
        </Typography>
        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
          {isDeveloper && (
            <Button
              size="small" variant="outlined"
              startIcon={<AutorenewIcon style={{ fontSize: 14, ...(scanning ? { animation: 'spin 1s linear infinite' } : {}) }} />}
              disabled={scanning || activeRemStatus === 'in-progress'}
              onClick={handleScanClick}
              style={{ textTransform: 'none', fontSize: 12, color: (scanning || activeRemStatus === 'in-progress') ? '#ccc' : '#666' }}
            >
              {scanning ? 'Scanning…' : 'Scan'}
            </Button>
          )}
          {scan.ciRunUrl && !scanning && (
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
      {scanning && (
        <Box style={{ marginBottom: 20 }}>
          <LinearProgress
            variant="determinate"
            value={scanProgress}
            style={{ height: 4, borderRadius: 2, backgroundColor: '#eee' }}
          />
        </Box>
      )}
    </>
  );

  return (
    <Box style={{ marginTop: 24 }}>

      {scanContextBar}

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
                    {fixableCount} remediable · {manualCount} manual
                  </Typography>
                </Box>
              </Box>

              {/* Action area */}
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
                    label="Remediation merged"
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
                      Generating remediation…
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

          {/* ── Inline notification banners ── */}
          {!bannerDismissed && isDeveloper && (activeRemStatus === 'available') && fixableCount > 0 && (
            <Box
              display="flex" alignItems="center" justifyContent="space-between"
              style={{
                padding: '10px 20px',
                backgroundColor: `${statusColors.info}08`,
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <BuildIcon style={{ fontSize: 16, color: statusColors.info }} />
                <Typography style={{ fontSize: 13 }}>
                  <strong>{fixableCount}</strong> violations can be remediated automatically.
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                <Button
                  variant="contained" color="primary" size="small"
                  onClick={handleFixClick}
                  style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                >
                  Remediate
                </Button>
                <IconButton size="small" onClick={() => setBannerDismissed(true)} style={{ padding: 4 }}>
                  <CloseIcon style={{ fontSize: 16, color: '#999' }} />
                </IconButton>
              </Box>
            </Box>
          )}

          {!bannerDismissed && activeRemStatus === 'proposals-ready' && (
            <Box
              display="flex" alignItems="center" justifyContent="space-between"
              style={{
                padding: '10px 20px',
                backgroundColor: `${statusColors.success}08`,
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                <Typography style={{ fontSize: 13 }}>
                  <strong>{approvedCount}</strong> of {fixableCount - failedFixes.size} remediations ready for review.
                  {failedFixes.size > 0 && <span style={{ color: '#e65100', marginLeft: 8 }}>{failedFixes.size} failed</span>}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                {!merged && (
                  <Button
                    variant="outlined" size="small"
                    onClick={() => setActiveTab(1)}
                    style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                  >
                    Review remediation
                  </Button>
                )}
                <Button
                  variant="contained" color="primary" size="small"
                  disabled={approvedCount === 0}
                  onClick={() => setDemoRemediationState('pr-open')}
                  style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                >
                  Create pull request
                </Button>
                <IconButton size="small" onClick={() => setBannerDismissed(true)} style={{ padding: 4 }}>
                  <CloseIcon style={{ fontSize: 16, color: '#999' }} />
                </IconButton>
              </Box>
            </Box>
          )}

          {!bannerDismissed && activeRemStatus === 'pr-open' && demoQuality.remediationSummary && (
            <Box
              display="flex" alignItems="center" justifyContent="space-between"
              style={{
                padding: '10px 20px',
                backgroundColor: `${statusColors.info}08`,
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <OpenInNewIcon style={{ fontSize: 16, color: statusColors.info }} />
                <Typography style={{ fontSize: 13 }}>
                  Pull request open with <strong>{demoQuality.remediationSummary.addressed}</strong> remediations.
                  {demoQuality.remediationSummary.remaining > 0 && <span style={{ color: '#8a6d00', marginLeft: 8 }}>{demoQuality.remediationSummary.remaining} require manual attention</span>}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                {isDevSpacesConnected && (
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
                <Button
                  size="small" variant="outlined"
                  startIcon={<CheckCircleIcon style={{ fontSize: 14 }} />}
                  onClick={() => { setDemoRemediationState('pr-merged'); setBannerDismissed(false); }}
                  style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
                >
                  Merge
                </Button>
                <IconButton size="small" onClick={() => setBannerDismissed(true)} style={{ padding: 4 }}>
                  <CloseIcon style={{ fontSize: 16, color: '#999' }} />
                </IconButton>
              </Box>
            </Box>
          )}

          {!bannerDismissed && activeRemStatus === 'pr-merged' && (
            <Box
              display="flex" alignItems="center" justifyContent="space-between"
              style={{
                padding: '10px 20px',
                backgroundColor: `${statusColors.success}08`,
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                <Typography style={{ fontSize: 13, color: statusColors.success, fontWeight: 500 }}>
                  Remediation merged successfully.
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setBannerDismissed(true)} style={{ padding: 4 }}>
                <CloseIcon style={{ fontSize: 16, color: '#999' }} />
              </IconButton>
            </Box>
          )}

          {/* ── Tab bar (hidden in merged mode) ── */}
          {!merged && (
            <Box style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Tabs
                value={activeTab > 1 ? 0 : activeTab}
                onChange={(_: any, v: number) => setActiveTab(v)}
                indicatorColor="primary"
                textColor="primary"
                style={{ minHeight: 36 }}
              >
                <Tab
                  label={`Violations (${scan.totalViolations})`}
                  style={{ textTransform: 'none', fontSize: 13, minHeight: 36, fontWeight: activeTab === 0 ? 600 : 400 }}
                />
                <Tab
                  label={`Remediation (${showSuggestionsTab ? suggestedCount : 0})`}
                  style={{ textTransform: 'none', fontSize: 13, minHeight: 36, fontWeight: activeTab === 1 ? 600 : 400 }}
                />
              </Tabs>
            </Box>
          )}

          {/* ── Filter + actions bar ── */}
          {(merged || activeTab === 0) && <Box style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
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
                    onClick={handleFixClick}
                    style={{ textTransform: 'none', fontSize: 11, fontWeight: 500, padding: '2px 10px' }}
                  >
                    Remediate{selectedViolations.size > 0 ? ` (${selectedViolations.size})` : ''}
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
              {/* Right: Category + Status filters */}
              <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                {/* Status filters — only show after remediation has produced mixed states */}
                {(statusCounts['in-pr'] > 0 || statusCounts['fixed'] > 0) && (
                  <Box display="flex" style={{ gap: 4 }}>
                    {([
                      { key: 'all' as const, label: 'All' },
                      { key: 'needs-attention' as const, label: 'Needs attention' },
                      { key: 'in-pr' as const, label: 'In pull request' },
                      { key: 'fixed' as const, label: 'Fixed' },
                    ] as const).filter(f => f.key === 'all' || statusCounts[f.key] > 0).map(f => (
                      <Chip
                        key={f.key} size="small" clickable
                        label={f.key === 'all' ? f.label : `${f.label} (${statusCounts[f.key]})`}
                        onClick={() => setStatusFilter(f.key)}
                        variant={statusFilter === f.key ? 'default' : 'outlined'}
                        style={{
                          fontSize: 11, height: 22,
                          backgroundColor: statusFilter === f.key
                            ? (f.key === 'fixed' ? `${statusColors.success}15` : f.key === 'needs-attention' ? '#fff3e0' : `${statusColors.info}15`)
                            : undefined,
                          color: statusFilter === f.key
                            ? (f.key === 'fixed' ? statusColors.success : f.key === 'needs-attention' ? '#e65100' : statusColors.info)
                            : '#666',
                          borderColor: statusFilter === f.key
                            ? (f.key === 'fixed' ? statusColors.success : f.key === 'needs-attention' ? '#e65100' : statusColors.info)
                            : 'rgba(0,0,0,0.15)',
                        }}
                      />
                    ))}
                    <Box style={{ width: 1, height: 16, backgroundColor: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
                  </Box>
                )}
                {/* Category filters */}
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
          </Box>}

          {/* ══════ Violations list ══════ */}
          {(merged || activeTab === 0) && (
            <>
              {/* Column headers */}
              <Box
                display="flex" alignItems="center" justifyContent="space-between"
                style={{
                  padding: '4px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)',
                  backgroundColor: 'inherit', position: 'sticky', top: 64, zIndex: 10,
                }}
              >
                <Typography style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Violation
                </Typography>
                <Box display="flex" alignItems="center" style={{ gap: 16 }}>
                  <Typography style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 90, textAlign: 'right' }}>
                    Status
                  </Typography>
                  {repoUrl && isDevSpacesConnected && (
                    <Typography style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, width: 28, textAlign: 'center' }}>
                      IDE
                    </Typography>
                  )}
                </Box>
              </Box>

              {tabGrouped.map(([file, fileViolations]) => (
                <Box key={file}>
                  <Box
                    style={{ padding: '8px 16px', backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                    display="flex" alignItems="center" justifyContent="space-between"
                  >
                    <Typography style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 500, color: '#333' }}>
                      {file}
                    </Typography>
                    <Typography style={{ fontSize: 11, color: '#999' }}>
                      {fileViolations.length} issue{fileViolations.length !== 1 ? 's' : ''}
                      {fileViolations.filter(v => v.fixTier !== 'manual').length > 0 &&
                        ` · ${fileViolations.filter(v => v.fixTier !== 'manual').length} remediable`}
                    </Typography>
                  </Box>
                  {fileViolations.map((v, i) => {
                    const key = getViolationKey(v);
                    const rowState = getRowState(v);
                    return (
                      <ViolationRow
                        key={`${v.ruleId}-${v.lineStart}-${i}`}
                        v={v} repoUrl={repoUrl} branch={branch}
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
            </>
          )}

          {/* ══════ Tab 1: Remediation — continuous diff view by file (non-merged only) ══════ */}
          {!merged && activeTab === 1 && !showSuggestionsTab && (
            <Box style={{ padding: '40px 24px', textAlign: 'center' }}>
              <BuildIcon style={{ fontSize: 36, color: '#ccc', marginBottom: 8 }} />
              <Typography style={{ fontSize: 14, fontWeight: 500, color: '#666', marginBottom: 4 }}>
                No remediation yet
              </Typography>
              <Typography style={{ fontSize: 13, color: '#999', maxWidth: 360, margin: '0 auto' }}>
                Click "Remediate" to generate remediation proposals for the detected violations.
              </Typography>
            </Box>
          )}
          {!merged && activeTab === 1 && showSuggestionsTab && (() => {
            const diffByFile = new Map<string, { v: QualityViolation; proposal: typeof DEMO_PROPOSALS[string] }[]>();
            suggestedViolations.forEach(v => {
              const proposal = DEMO_PROPOSALS[v.ruleId];
              if (!proposal) return;
              const arr = diffByFile.get(v.file) || [];
              arr.push({ v, proposal });
              diffByFile.set(v.file, arr);
            });
            const manualViolations = quality.violations.filter(v =>
              v.fixTier === 'manual' || failedFixes.has(getViolationKey(v))
            );

            return (
              <>
                {Array.from(diffByFile.entries()).map(([file, hunks]) => (
                  <Box key={file} style={{ borderBottom: '4px solid rgba(0,0,0,0.06)' }}>
                    {/* File header */}
                    <Box
                      display="flex" alignItems="center" justifyContent="space-between"
                      style={{ padding: '10px 20px', backgroundColor: 'rgba(0,0,0,0.03)' }}
                    >
                      <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                        <Typography style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: '#333' }}>
                          {file}
                        </Typography>
                        <Chip size="small" label={`${hunks.length} change${hunks.length !== 1 ? 's' : ''}`}
                          style={{ fontSize: 10, height: 18, backgroundColor: 'rgba(0,0,0,0.06)', color: '#666' }} />
                      </Box>
                      {repoUrl && isDevSpacesConnected && (
                        <Tooltip title={`Open ${file} in Dev Spaces`} arrow>
                          <IconButton size="small"
                            onClick={() => window.open(`${DEVSPACES_BASE_URL}#${repoUrl}/tree/${branch ?? 'main'}/${file}`, '_blank')}
                            style={{ padding: 4 }}>
                            <CodeIcon style={{ fontSize: 16, color: '#999' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Diff hunks for this file */}
                    {hunks.map(({ v, proposal }, hi) => (
                      <Box key={`${v.ruleId}-${v.lineStart}`}>
                        {/* Hunk annotation — rule + line */}
                        <Box display="flex" alignItems="center" justifyContent="space-between"
                          style={{ padding: '6px 20px', backgroundColor: 'rgba(0,0,0,0.015)', borderTop: hi > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
                        >
                          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                            <Chip size="small" label={v.severity}
                              style={{ fontSize: 9, height: 16, textTransform: 'capitalize', fontWeight: 600,
                                backgroundColor: `${SEVERITY_COLORS[v.severity]}15`, color: SEVERITY_COLORS[v.severity] }} />
                            <Typography style={{ fontSize: 12, color: '#555' }}>{v.message}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                            <Chip size="small"
                              label={proposal.tier === 'ai' ? `AI · ${Math.round((DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) * 100)}%` : 'Deterministic'}
                              style={{ fontSize: 9, height: 16,
                                backgroundColor: proposal.tier === 'ai' ? `${statusColors.info}12` : `${statusColors.success}12`,
                                color: proposal.tier === 'ai' ? statusColors.info : statusColors.success }} />
                            <Typography style={{ fontSize: 11, fontFamily: 'monospace', color: '#999' }}>
                              L{v.lineStart}
                            </Typography>
                          </Box>
                        </Box>

                        {/* The diff */}
                        <Box style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8 }}>
                          {proposal.removed.map((line, i) => (
                            <Box key={`r-${i}`} style={{
                              padding: '0 20px 0 32px', backgroundColor: 'rgba(248, 81, 73, 0.10)',
                              color: '#cf222e', position: 'relative', minHeight: 22, display: 'flex', alignItems: 'center',
                            }}>
                              <span style={{ position: 'absolute', left: 16, userSelect: 'none', opacity: 0.5, fontWeight: 700 }}>−</span>
                              {line}
                            </Box>
                          ))}
                          {proposal.added.map((line, i) => (
                            <Box key={`a-${i}`} style={{
                              padding: '0 20px 0 32px', backgroundColor: 'rgba(46, 160, 67, 0.10)',
                              color: '#1a7f37', position: 'relative', minHeight: 22, display: 'flex', alignItems: 'center',
                            }}>
                              <span style={{ position: 'absolute', left: 16, userSelect: 'none', opacity: 0.5, fontWeight: 700 }}>+</span>
                              {line}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))}

                {/* Manual violations section */}
                {manualViolations.length > 0 && (
                  <Box style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <Box style={{ padding: '10px 20px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <Typography style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Requires manual attention ({manualViolations.length})
                      </Typography>
                    </Box>
                    {manualViolations.map((v, i) => (
                      <Box key={`manual-${i}`} display="flex" alignItems="center"
                        style={{ padding: '6px 20px', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                      >
                        <Typography style={{ fontSize: 11, fontFamily: 'monospace', color: '#999', minWidth: 28 }}>L{v.lineStart}</Typography>
                        <Chip size="small" label={v.severity}
                          style={{ fontSize: 9, height: 16, textTransform: 'capitalize', fontWeight: 600,
                            backgroundColor: `${SEVERITY_COLORS[v.severity]}15`, color: SEVERITY_COLORS[v.severity] }} />
                        <Typography style={{ fontSize: 12, color: '#555', flex: 1 }} noWrap>{v.message}</Typography>
                        <Typography style={{ fontSize: 11, fontFamily: 'monospace', color: '#999' }}>{v.file}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Summary footer */}
                <Box display="flex" alignItems="center" justifyContent="space-between"
                  style={{ padding: '12px 20px', backgroundColor: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <Typography style={{ fontSize: 12, color: '#666' }}>
                    {diffByFile.size} file{diffByFile.size !== 1 ? 's' : ''} changed · {suggestedViolations.length} remediation{suggestedViolations.length !== 1 ? 's' : ''}
                    {manualViolations.length > 0 && ` · ${manualViolations.length} manual`}
                  </Typography>
                </Box>
              </>
            );
          })()}

        </Card>
      )}
    </Box>
  );
};


// ==========================================================================
// Quality Tab — Progressive unified view with makeStyles
// Single view where each violation carries its own progressive fix state.
// No separate tabs. Selection → remediate → review proposals → create PR.
// ==========================================================================

type UnifiedViolationStatus = 'open' | 'proposed' | 'approved' | 'editing' | 'fixed' | 'in-pr' | 'resolved';

const FILLED_SEVERITY: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#a30000', color: '#fff' },
  high: { bg: '#c9190b', color: '#fff' },
  medium: { bg: '#f0ab00', color: '#3e2f00' },
  low: { bg: '#2b9af3', color: '#fff' },
  info: { bg: '#6a6e73', color: '#fff' },
};

const useQualityStyles = makeStyles(theme => ({
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  '@keyframes pulseBorder': {
    '0%, 100%': { borderColor: statusColors.warning },
    '50%': { borderColor: '#c58c00' },
  },
  spinIcon: {
    animation: '$spin 1.5s linear infinite',
  },
  // Native table
  violationsTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
    '& thead': {
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #d2d2d2',
    },
    '& th': {
      textAlign: 'left' as const,
      padding: '10px 12px',
      fontWeight: 600,
      fontSize: 12,
      color: '#6a6e73',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.3,
    },
    '& td': {
      padding: '10px 12px',
      borderBottom: '1px solid #eee',
      verticalAlign: 'middle' as const,
    },
    '& tbody tr:last-child td': {
      borderBottom: 'none',
    },
    '& tbody tr:hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  colCheckbox: { width: 36, textAlign: 'center' as const },
  colSeverity: { width: 80 },
  colFix: { width: 140 },
  colDescription: { minWidth: 200 },
  colFile: { width: 160, whiteSpace: 'nowrap' as const },
  // Row states
  rowSelected: { backgroundColor: '#e8f4ff !important' },
  rowDone: { backgroundColor: '#f8fdf8 !important' },
  rowEditing: { backgroundColor: '#fffcf2 !important' },
  rowInPr: { backgroundColor: '#f5faff !important' },
  rowResolved: {
    backgroundColor: '#f9f9f9 !important',
    '& $description': { textDecoration: 'line-through', color: '#6a6e73', opacity: 0.7 },
  },
  rowClickable: { cursor: 'pointer' },
  rowProcessing: { backgroundColor: '#f5f0ff !important', opacity: 0.7 },
  rowExpanded: {
    backgroundColor: '#faf9fc !important',
    '& td': { borderBottom: 'none' },
  },
  // Fix chips
  fixChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease',
    border: '1px solid',
  },
  fixChipIcon: { fontSize: 11, lineHeight: 1 },
  fixChipDeterministicOpen: { backgroundColor: 'transparent', color: '#004d99', borderColor: '#73bcf7' },
  fixChipDeterministicFixed: { backgroundColor: '#e7f5e7', color: '#1e4620', borderColor: '#5ba352' },
  fixChipAiOpen: { backgroundColor: 'transparent', color: '#6753ac', borderColor: '#b2a3db' },
  fixChipAiProposed: { backgroundColor: '#f5f0ff', color: '#6753ac', borderColor: '#6753ac' },
  fixChipAiApproved: { backgroundColor: '#e7f5e7', color: '#1e4620', borderColor: '#5ba352' },
  fixChipEditing: { backgroundColor: '#fff8e6', color: '#795600', borderColor: statusColors.warning, animation: '$pulseBorder 2s ease-in-out infinite' },
  fixChipInPr: { backgroundColor: '#e8f4ff', color: '#004d99', borderColor: '#73bcf7' },
  fixChipResolved: { backgroundColor: '#e7f5e7', color: '#1e4620', borderColor: '#5ba352', opacity: 0.7 },
  fixChipManual: { backgroundColor: '#f0f0f0', color: '#6a6e73', borderColor: '#d2d2d2' },
  // Rule ID badge
  ruleId: {
    display: 'inline-block',
    fontSize: 11,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: '#6a6e73',
    backgroundColor: '#f0f0f0',
    padding: '1px 5px',
    borderRadius: 3,
    marginRight: 8,
    verticalAlign: 'middle',
  },
  description: { fontSize: 13, color: '#151515' },
  descriptionResolved: { textDecoration: 'line-through', color: '#6a6e73', opacity: 0.7 },
  expandHint: { display: 'block', fontSize: 11, color: '#6753ac', fontStyle: 'italic' as const, marginTop: 4 },
  // File link
  fileLink: {
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: '#06c',
    cursor: 'pointer',
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  // Severity chip (filled)
  severityChip: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  // Banners — visible background + left border accent
  banner: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    border: '1px solid transparent',
  },
  bannerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  bannerIdle: { backgroundColor: '#e8f4ff', borderColor: '#73bcf7' },
  bannerProgress: { backgroundColor: '#f5f0ff', borderColor: '#b2a3db' },
  bannerProposals: { backgroundColor: '#f8fdf8', borderColor: '#5ba352' },
  bannerEditing: { backgroundColor: '#fffcf2', borderColor: '#f0ab00' },
  bannerPrOpen: { backgroundColor: '#e8f4ff', borderColor: '#73bcf7' },
  bannerMerged: { backgroundColor: '#e7f5e7', borderColor: '#5ba352' },
  bannerStat: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13 },
  bannerDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  bannerSubtext: { fontSize: 12, color: '#6a6e73', marginTop: 4 },
  // Proposal preview
  proposalPreview: {
    padding: '12px 16px 16px 48px',
    backgroundColor: 'rgba(103,83,172,0.025)',
    borderTop: '1px solid rgba(103,83,172,0.1)',
  },
  proposalTitle: { fontSize: 13, fontWeight: 600, color: theme.palette.text.primary },
  proposalDiff: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.12)',
    marginBottom: 10,
    marginTop: 8,
  },
  diffPanelHeaderRemoved: { padding: '4px 10px', fontSize: 10, fontWeight: 600, backgroundColor: 'rgba(248,81,73,0.12)', color: '#cf222e', textTransform: 'uppercase' as const },
  diffPanelHeaderAdded: { padding: '4px 10px', fontSize: 10, fontWeight: 600, backgroundColor: 'rgba(46,160,67,0.12)', color: '#1a7f37', textTransform: 'uppercase' as const },
  diffCodeRemoved: { fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, padding: '6px 10px', backgroundColor: 'rgba(248,81,73,0.04)', color: '#cf222e' },
  diffCodeAdded: { fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, padding: '6px 10px', backgroundColor: 'rgba(46,160,67,0.04)', color: '#1a7f37' },
  proposalActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  // Buttons
  btnDevSpaces: {
    textTransform: 'none' as const,
    fontSize: 12,
    fontWeight: 500,
    padding: '4px 12px',
    borderColor: statusColors.warning,
    color: '#795600',
    '&:hover': { backgroundColor: 'rgba(240,171,0,0.08)' },
  },
  btnApprove: {
    textTransform: 'none' as const,
    fontSize: 12,
    padding: '4px 12px',
    backgroundColor: statusColors.success,
    color: '#fff',
    '&:hover': { backgroundColor: '#3e8635' },
  },
  // PR badge
  prBadge: { fontSize: 11, fontWeight: 700, fontFamily: 'monospace', height: 22, backgroundColor: '#004d99', color: '#fff' },
  // Branch code
  branchCode: { fontSize: 11, fontFamily: "'SF Mono', 'Fira Code', monospace", background: '#f0f0f0', padding: '1px 5px', borderRadius: 3 },
}));

const FixChipStyled = ({ method, status, classes }: { method: 'deterministic' | 'ai' | 'manual'; status: UnifiedViolationStatus; classes: ReturnType<typeof useQualityStyles> }) => {
  const icon = method === 'deterministic' ? '⚡' : method === 'ai' ? '✦' : '—';
  let label = method === 'manual' ? 'Manual' : method === 'deterministic' ? 'Auto' : 'AI';
  let chipClass = classes.fixChipManual;

  if (method === 'manual') { chipClass = classes.fixChipManual; }
  else if (status === 'open') { chipClass = method === 'deterministic' ? classes.fixChipDeterministicOpen : classes.fixChipAiOpen; }
  else if (status === 'fixed') { label = 'Fixed'; chipClass = classes.fixChipDeterministicFixed; }
  else if (status === 'proposed') { label = 'Review fix'; chipClass = classes.fixChipAiProposed; }
  else if (status === 'approved') { label = 'Approved'; chipClass = classes.fixChipAiApproved; }
  else if (status === 'editing') { label = 'Editing'; chipClass = classes.fixChipEditing; }
  else if (status === 'in-pr') { label = 'In PR'; chipClass = classes.fixChipInPr; }
  else if (status === 'resolved') { label = 'Resolved'; chipClass = classes.fixChipResolved; }

  return (
    <span className={`${classes.fixChip} ${chipClass}`}>
      <span className={classes.fixChipIcon}>{icon}</span>
      {label}
    </span>
  );
};

export const QualityTabUnified = ({
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
  const classes = useQualityStyles();
  const { hasRole } = useUserRoleContext();
  const isDeveloper = hasRole('developer');
  const [categoryFilter, setCategoryFilter] = useState<ViolationCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityClass | null>(initialSeverity ?? null);
  const [violationStatuses, setViolationStatuses] = useState<Map<string, UnifiedViolationStatus>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pageState, setPageState] = useState<'idle' | 'in-progress' | 'proposals-ready' | 'editing-devspaces' | 'creating-pr' | 'pr-open' | 'pr-merged'>('idle');
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  if (!quality) {
    return (
      <Box style={{ marginTop: 24 }}>
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
            <VerifiedUserOutlinedIcon style={{ fontSize: 40, color: '#ccc', marginBottom: 12 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No quality scans yet</Typography>
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
  const getViolationKey = (v: QualityViolation) => v.ruleId + ':' + v.file + ':' + v.lineStart;
  const getStatus = (v: QualityViolation): UnifiedViolationStatus => violationStatuses.get(getViolationKey(v)) ?? 'open';

  const fixableCount = quality.violations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').length;
  const fixedCount = quality.violations.filter(v => getStatus(v) === 'fixed').length;
  const proposedCount = quality.violations.filter(v => getStatus(v) === 'proposed').length;
  const approvedCount = quality.violations.filter(v => getStatus(v) === 'approved').length;
  const editingCount = quality.violations.filter(v => getStatus(v) === 'editing').length;
  const inPrCount = quality.violations.filter(v => getStatus(v) === 'in-pr').length;
  const resolvedCount = quality.violations.filter(v => getStatus(v) === 'resolved').length;
  const prReadyCount = fixedCount + approvedCount;

  useEffect(() => {
    if (pageState !== 'in-progress') { setProgress(0); return; }
    const interval = setInterval(() => { setProgress(prev => Math.min(prev + 6 + Math.random() * 10, 95)); }, 400);
    return () => clearInterval(interval);
  }, [pageState]);

  useEffect(() => {
    if (!scanning) { setScanProgress(0); return; }
    const interval = setInterval(() => { setScanProgress(prev => Math.min(prev + 8 + Math.random() * 12, 95)); }, 300);
    return () => clearInterval(interval);
  }, [scanning]);

  const handleScanClick = () => {
    setScanning(true);
    setViolationStatuses(new Map());
    setSelectedIds(new Set());
    setPageState('idle');
    setTimeout(() => { setScanning(false); }, 2500);
  };

  const handleRemediate = () => {
    if (selectedIds.size === 0) return;
    setPageState('in-progress');
    setTimeout(() => {
      setViolationStatuses(prev => {
        const next = new Map(prev);
        quality.violations.forEach(v => {
          const key = getViolationKey(v);
          if (!selectedIds.has(key)) return;
          if (v.fixTier === 'deterministic') next.set(key, 'fixed');
          else if (v.fixTier === 'ai') next.set(key, 'proposed');
        });
        return next;
      });
      setSelectedIds(new Set());
      setPageState('proposals-ready');
    }, 3000);
  };

  const handleApprove = (key: string) => { setViolationStatuses(prev => { const n = new Map(prev); n.set(key, 'approved'); return n; }); setExpandedId(null); };
  const handleDecline = (key: string) => { setViolationStatuses(prev => { const n = new Map(prev); n.set(key, 'open'); return n; }); setExpandedId(null); };
  const handleEditInDevSpaces = (key: string) => { setViolationStatuses(prev => { const n = new Map(prev); n.set(key, 'editing'); return n; }); setExpandedId(null); };

  const handleEditAllInDevSpaces = () => {
    setViolationStatuses(prev => {
      const n = new Map(prev);
      quality.violations.forEach(v => { const k = getViolationKey(v); if (n.get(k) === 'proposed') n.set(k, 'editing'); });
      return n;
    });
    setPageState('editing-devspaces');
  };

  const handleCreatePr = () => {
    setPageState('creating-pr');
    setTimeout(() => {
      setViolationStatuses(prev => {
        const n = new Map(prev);
        for (const [key, s] of n) { if (s === 'fixed' || s === 'approved' || s === 'editing') n.set(key, 'in-pr'); }
        return n;
      });
      setPageState('pr-open');
    }, 1500);
  };

  const handleSimulatePush = () => {
    setViolationStatuses(prev => {
      const n = new Map(prev);
      for (const [key, s] of n) { if (s === 'editing' || s === 'fixed') n.set(key, 'in-pr'); }
      return n;
    });
    setPageState('pr-open');
  };

  const handleMergePr = () => {
    setViolationStatuses(prev => {
      const n = new Map(prev);
      for (const [key, s] of n) { if (s === 'in-pr') n.set(key, 'resolved'); }
      return n;
    });
    setPageState('pr-merged');
  };

  const handleSelectAll = () => {
    const fixable = quality.violations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open');
    const allSelected = fixable.every(v => selectedIds.has(getViolationKey(v)));
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(fixable.map(v => getViolationKey(v))));
  };

  const handleReset = () => { setViolationStatuses(new Map()); setSelectedIds(new Set()); setExpandedId(null); setPageState('idle'); };

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

  const remBranch = 'apme/remediate-' + projectName;

  return (
    <Box style={{ marginTop: 24 }}>
      {/* Scan context — compact subtitle style */}
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 8 }}>
        <Typography style={{ fontSize: 13, color: '#6a6e73' }}>
          {scanning ? <>Scanning repository…</> : (
            <>Last scan {quality.lastScannedAt} · commit <code style={{ fontSize: 11 }}>{quality.lastScannedCommit?.slice(0, 7)}</code>
            {scan.trigger && ` · ${TRIGGER_LABELS[scan.trigger] ?? scan.trigger}`}</>
          )}
        </Typography>
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          {isDeveloper && (
            <Button size="small" variant="outlined"
              startIcon={<AutorenewIcon style={{ fontSize: 14 }} className={scanning ? classes.spinIcon : undefined} />}
              disabled={scanning || pageState === 'in-progress'} onClick={handleScanClick}
              style={{ textTransform: 'none', fontSize: 12 }}>
              {scanning ? 'Scanning…' : 'Scan'}
            </Button>
          )}
          {scan.ciRunUrl && !scanning && (
            <Button size="small" variant="text" startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
              onClick={() => window.open(scan.ciRunUrl, '_blank')} style={{ textTransform: 'none', fontSize: 12, color: '#6a6e73' }}>
              View CI run
            </Button>
          )}
          <Button size="small" variant="text" onClick={handleReset} style={{ textTransform: 'none', fontSize: 11, color: '#999' }}>Reset</Button>
        </Box>
      </Box>
      {scanning && <LinearProgress variant="determinate" value={scanProgress} style={{ height: 4, borderRadius: 2, marginBottom: 8 }} />}

      {scan.totalViolations === 0 ? (
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '32px 24px', textAlign: 'center' }}>
            <CheckCircleIcon style={{ fontSize: 40, color: statusColors.success, marginBottom: 8 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500 }}>No violations detected</Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats — inline severity counts, active one gets a pill highlight + dismiss */}
          <Box style={{ marginBottom: 16 }}>
            <Box display="flex" alignItems="center" style={{ gap: 12, marginBottom: 8 }}>
              <Typography style={{ fontSize: 13 }}>
                <strong>{scan.totalViolations}</strong> violations
              </Typography>
              {(['critical', 'high', 'medium', 'low', 'info'] as SeverityClass[]).map(sev => {
                const count = scan.severityBreakdown[sev];
                if (!count) return null;
                const isActive = severityFilter === sev;

                return (
                  <span
                    key={sev}
                    onClick={() => setSeverityFilter(isActive ? null : sev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '2px 8px',
                      borderRadius: 10,
                      backgroundColor: isActive ? `${SEVERITY_COLORS[sev]}18` : 'transparent',
                      border: isActive ? `1px solid ${SEVERITY_COLORS[sev]}40` : '1px solid transparent',
                      opacity: severityFilter && !isActive ? 0.4 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <strong style={{ color: SEVERITY_COLORS[sev] }}>{count}</strong>
                    <span style={{ textTransform: 'capitalize' }}>{sev}</span>
                    {isActive && (
                      <CloseIcon style={{ fontSize: 12, color: SEVERITY_COLORS[sev], marginLeft: 2 }} />
                    )}
                  </span>
                );
              })}
            </Box>
            <SeverityProgressBar breakdown={scan.severityBreakdown} />
          </Box>

          {/* ── BANNERS — floating with margin, not glued to table ── */}
          {pageState === 'idle' && isDeveloper && fixableCount > 0 && (
            <Box className={`${classes.banner} ${classes.bannerIdle}`} style={{ marginBottom: 16, borderRadius: 6 }}>
              <Box className={classes.bannerRow}>
                <Typography style={{ fontSize: 13 }}>
                  <strong>{fixableCount}</strong> violations can be auto-fixed
                  {selectedIds.size > 0 && <span style={{ color: '#004d99', fontWeight: 500 }}> — {selectedIds.size} selected</span>}
                </Typography>
                <Button variant="contained" color="primary" size="small" disabled={selectedIds.size === 0} onClick={handleRemediate}
                  style={{ textTransform: 'none', fontSize: 13, fontWeight: 500 }}>
                  Fix selected violations
                </Button>
              </Box>
            </Box>
          )}

          {pageState === 'in-progress' && (
            <Box className={`${classes.banner} ${classes.bannerProgress}`} style={{ marginBottom: 16, borderRadius: 6 }}>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <AutorenewIcon className={classes.spinIcon} style={{ fontSize: 14, color: '#6753ac' }} />
                <Typography style={{ fontSize: 13, color: '#6753ac', fontWeight: 500 }}>Generating fixes…</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} style={{ height: 4, borderRadius: 2, marginTop: 6 }} />
            </Box>
          )}

          {pageState === 'proposals-ready' && (
            <Box className={`${classes.banner} ${classes.bannerProposals}`} style={{ marginBottom: 16, borderRadius: 6 }}>
              <Box className={classes.bannerRow}>
                <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                  {fixedCount > 0 && <span className={classes.bannerStat}><span className={classes.bannerDot} style={{ backgroundColor: '#5ba352' }} /><strong>{fixedCount}</strong> auto-fixed</span>}
                  {proposedCount > 0 && <span className={classes.bannerStat}><span className={classes.bannerDot} style={{ backgroundColor: '#6753ac' }} /><strong>{proposedCount}</strong> AI to review</span>}
                  {approvedCount > 0 && <span className={classes.bannerStat}><span className={classes.bannerDot} style={{ backgroundColor: '#5ba352' }} /><strong>{approvedCount}</strong> approved</span>}
                  {editingCount > 0 && <span className={classes.bannerStat}><span className={classes.bannerDot} style={{ backgroundColor: '#f0ab00' }} /><strong>{editingCount}</strong> editing</span>}
                </Box>
                <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                  {proposedCount > 0 && isDevSpacesConnected && (
                    <Button size="small" variant="outlined" startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                      onClick={handleEditAllInDevSpaces} className={classes.btnDevSpaces}>
                      Review all in Dev Spaces
                    </Button>
                  )}
                  {selectedIds.size > 0 && (
                    <Button size="small" variant="outlined" onClick={handleRemediate} style={{ textTransform: 'none', fontSize: 12, padding: '4px 12px' }}>
                      Fix {selectedIds.size} more
                    </Button>
                  )}
                  <Button variant="contained" color="primary" size="small" disabled={prReadyCount === 0} onClick={handleCreatePr}
                    style={{ textTransform: 'none', fontSize: 13, fontWeight: 500 }}>
                    Create pull request{prReadyCount > 0 ? ` (${prReadyCount})` : ''}
                  </Button>
                </Box>
              </Box>
              {fixableCount > 0 && selectedIds.size === 0 && (
                <Typography className={classes.bannerSubtext}>{fixableCount} more can be fixed — select and click "Fix more" to include.</Typography>
              )}
            </Box>
          )}

          {pageState === 'editing-devspaces' && (
            <Box className={`${classes.banner} ${classes.bannerEditing}`} style={{ marginBottom: 16, borderRadius: 6 }}>
              <Box className={classes.bannerRow}>
                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                  <CodeIcon style={{ fontSize: 16, color: '#795600' }} />
                  <Box>
                    <Typography style={{ fontSize: 13, fontWeight: 500 }}>Editing {editingCount + fixedCount} fixes in Dev Spaces</Typography>
                    <Typography style={{ fontSize: 12, color: '#6a6e73' }}>Branch: <code className={classes.branchCode}>{remBranch}</code></Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                  <Button size="small" variant="outlined" onClick={handleSimulatePush} style={{ textTransform: 'none', fontSize: 12, padding: '4px 12px' }}>Simulate push</Button>
                  <Button size="small" variant="contained" color="primary" startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                    onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${remBranch}`, '_blank')}
                    style={{ textTransform: 'none', fontSize: 13, fontWeight: 500 }}>Open Dev Spaces</Button>
                </Box>
              </Box>
              <Typography className={classes.bannerSubtext}>Push when ready to create a pull request.</Typography>
            </Box>
          )}

          {pageState === 'creating-pr' && (
            <Box className={`${classes.banner} ${classes.bannerProgress}`} style={{ marginBottom: 16, borderRadius: 6 }}>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <AutorenewIcon className={classes.spinIcon} style={{ fontSize: 14, color: '#06c' }} />
                <Typography style={{ fontSize: 13, color: '#06c', fontWeight: 500 }}>Creating pull request…</Typography>
              </Box>
            </Box>
          )}

          {pageState === 'pr-open' && (
            <Box className={`${classes.banner} ${classes.bannerPrOpen}`} style={{ marginBottom: 16, borderRadius: 6 }}>
              <Box className={classes.bannerRow}>
                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                  <Chip size="small" label="PR #99" className={classes.prBadge} />
                  <Typography style={{ fontSize: 13 }}><strong>{inPrCount}</strong> fixes ready for code review</Typography>
                </Box>
                <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                  <Button size="small" variant="outlined" onClick={handleMergePr} style={{ textTransform: 'none', fontSize: 12, padding: '4px 12px' }}>Merge</Button>
                  {isDevSpacesConnected && (
                    <Button size="small" variant="contained" color="primary" startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                      onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${remBranch}`, '_blank')}
                      style={{ textTransform: 'none', fontSize: 13, fontWeight: 500 }}>Review in Dev Spaces</Button>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {pageState === 'pr-merged' && (
            <Box className={`${classes.banner} ${classes.bannerMerged}`} style={{ marginBottom: 16, borderRadius: 6 }}>
              <Box className={classes.bannerRow}>
                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                  <CheckCircleIcon style={{ fontSize: 16, color: '#5ba352' }} />
                  <Typography style={{ fontSize: 13, color: '#1e4620', fontWeight: 500 }}>PR #99 merged — <strong>{resolvedCount}</strong> violations resolved</Typography>
                </Box>
                {fixableCount > 0 && <Typography style={{ fontSize: 12, color: '#6a6e73' }}>{fixableCount} remaining can be fixed</Typography>}
              </Box>
            </Box>
          )}

          {/* ── Violations table ── */}
          <Box style={{ border: '1px solid #d2d2d2', borderRadius: 6, overflow: 'hidden' }}>
            <table className={classes.violationsTable}>
              <thead>
                <tr>
                  <th className={classes.colCheckbox}>
                    <Checkbox
                      size="small"
                      checked={
                        filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').length > 0 &&
                        filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').every(v => selectedIds.has(getViolationKey(v)))
                      }
                      onChange={handleSelectAll}
                      color="primary"
                      style={{ padding: 0 }}
                      disabled={pageState === 'in-progress'}
                    />
                  </th>
                  <th className={classes.colSeverity}>Severity</th>
                  <th className={classes.colFix}>Fix</th>
                  <th className={classes.colDescription}>Rule &amp; Description</th>
                  <th className={classes.colFile}>File</th>
                </tr>
              </thead>
              <tbody>
                {filteredViolations.map((v, i) => {
                  const key = getViolationKey(v);
                  const status = getStatus(v);
                  const isSelectable = v.fixTier !== 'manual' && status === 'open' && (pageState === 'idle' || pageState === 'proposals-ready');
                  const isProposed = status === 'proposed';
                  const isExpanded = expandedId === key;
                  const proposal = DEMO_PROPOSALS[v.ruleId];
                  const isSelected = selectedIds.has(key);

                  const rowClasses = [
                    isSelected ? classes.rowSelected : '',
                    status === 'fixed' || status === 'approved' ? classes.rowDone : '',
                    status === 'editing' ? classes.rowEditing : '',
                    status === 'in-pr' ? classes.rowInPr : '',
                    status === 'resolved' ? classes.rowResolved : '',
                    isProposed ? classes.rowClickable : '',
                    isExpanded ? classes.rowExpanded : '',
                  ].filter(Boolean).join(' ');

                  const sevStyle = FILLED_SEVERITY[v.severity] || FILLED_SEVERITY.info;

                  return [
                    <tr key={`${v.ruleId}-${v.lineStart}-${i}`} className={rowClasses}>
                      <td className={classes.colCheckbox}>
                        {isSelectable ? (
                          <Checkbox size="small" checked={isSelected} color="primary" style={{ padding: 0 }}
                            onChange={() => setSelectedIds(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })} />
                        ) : <span style={{ display: 'inline-block', width: 16, height: 16 }} />}
                      </td>
                      <td className={classes.colSeverity}>
                        <span className={classes.severityChip} style={{ backgroundColor: sevStyle.bg, color: sevStyle.color }}>
                          {v.severity}
                        </span>
                      </td>
                      <td className={classes.colFix}>
                        <FixChipStyled method={v.fixTier} status={status} classes={classes} />
                      </td>
                      <td className={classes.colDescription} onClick={() => { if (isProposed) setExpandedId(isExpanded ? null : key); }}>
                        <span className={classes.ruleId}>{v.ruleId}</span>
                        <span className={`${classes.description} ${status === 'resolved' ? classes.descriptionResolved : ''}`}>
                          {v.message}
                        </span>
                        {isProposed && !isExpanded && <span className={classes.expandHint}>Click to review proposed fix</span>}
                      </td>
                      <td className={classes.colFile}>
                        {repoUrl && isDevSpacesConnected ? (
                          <a className={classes.fileLink}
                            href="#"
                            title={`Open in Dev Spaces: ${v.file}:${v.lineStart}`}
                            onClick={(e) => { e.preventDefault(); window.open(`${DEVSPACES_BASE_URL}#${repoUrl}/tree/${branch ?? 'main'}/${v.file}?line=${v.lineStart}`, '_blank'); }}>
                            {v.file.split('/').pop()}:{v.lineStart}
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, fontFamily: "'SF Mono', 'Fira Code', monospace", color: '#6a6e73' }}>{v.file.split('/').pop()}:{v.lineStart}</span>
                        )}
                      </td>
                    </tr>,
                    isExpanded && isProposed && proposal ? (
                      <tr key={`${v.ruleId}-${v.lineStart}-${i}-proposal`}>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <Collapse in={true}>
                            <Box className={classes.proposalPreview}>
                              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                <Typography className={classes.proposalTitle}>{proposal.desc}</Typography>
                                {proposal.tier === 'ai' && (
                                  <Chip size="small" label={`${Math.round((DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) * 100)}% confidence`}
                                    style={{ fontSize: 10, height: 18,
                                      backgroundColor: (DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) >= 0.9 ? '#e7f5e7' : '#fdf2e5',
                                      color: (DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) >= 0.9 ? '#1e4620' : '#6b3a00' }} />
                                )}
                              </Box>
                              <Box className={classes.proposalDiff}>
                                <Box>
                                  <Box className={classes.diffPanelHeaderRemoved}>Before</Box>
                                  <Box className={classes.diffCodeRemoved}>
                                    {proposal.removed.map((line, li) => <Box key={li}>{line}</Box>)}
                                  </Box>
                                </Box>
                                <Box>
                                  <Box className={classes.diffPanelHeaderAdded}>After (proposed)</Box>
                                  <Box className={classes.diffCodeAdded}>
                                    {proposal.added.map((line, li) => <Box key={li}>{line}</Box>)}
                                  </Box>
                                </Box>
                              </Box>
                              <Box className={classes.proposalActions}>
                                <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                                  {isDevSpacesConnected && (
                                    <Button size="small" variant="outlined" startIcon={<CodeIcon style={{ fontSize: 13 }} />}
                                      onClick={() => handleEditInDevSpaces(key)} className={classes.btnDevSpaces}>
                                      Edit in Dev Spaces
                                    </Button>
                                  )}
                                  <Typography style={{ fontSize: 11, color: '#6a6e73' }}>Modify before committing</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                                  <Button size="small" variant="outlined" onClick={() => handleDecline(key)}
                                    style={{ textTransform: 'none', fontSize: 12, padding: '4px 12px' }}>Decline</Button>
                                  <Button size="small" variant="contained" onClick={() => handleApprove(key)} className={classes.btnApprove}>
                                    Approve as-is
                                  </Button>
                                </Box>
                              </Box>
                            </Box>
                          </Collapse>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
              </tbody>
            </table>
          </Box>
        </>
      )}
    </Box>
  );
};
