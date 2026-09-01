import { useState, useMemo, useEffect } from 'react';
import { isDevSpacesConnected } from '../../../hooks/devSpacesSetup';
import { useUserRoleContext } from '../../../hooks/useUserRole';
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
  Menu,
  MenuItem,
  ListItemText,
  Divider,
  makeStyles,
  withStyles,
  Theme,
  useTheme,
} from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CodeIcon from '@material-ui/icons/Code';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import BuildIcon from '@material-ui/icons/Build';
import VerifiedUserOutlinedIcon from '@material-ui/icons/VerifiedUserOutlined';
import CloseIcon from '@material-ui/icons/Close';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { statusColors } from '../../common/statusColors';
import HistoryIcon from '@material-ui/icons/History';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import {
  type ProjectQualityData,
  type ScanResult,
  type ScanRemediationOutcome,
  type SeverityClass,
  type QualityViolation,
  type ApmeRuleCategory,
  type RemediationStatus,
  APME_CATEGORY_LABEL,
  APME_CATEGORY_ORDER,
  apmeCategoryOf,
  SEVERITY_COLORS,
} from './qualityDemoData';

const DarkTooltip = withStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: '#1b1d21',
    color: '#fff',
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 4,
    maxWidth: 320,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  arrow: {
    color: '#1b1d21',
  },
}))(Tooltip);

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
  const theme = useTheme();
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
              color: activeSeverity === sev ? SEVERITY_COLORS[sev] : theme.palette.text.secondary,
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

  const sevTooltips: Record<SeverityClass, string> = {
    critical: 'Critical — Must fix before deployment. Security or breaking changes.',
    high: 'High — Should fix soon. Compatibility or significant quality issues.',
    medium: 'Medium — Recommended fix. Best practices and modernization.',
    low: 'Low — Optional improvement. Code style and minor enhancements.',
    info: 'Info — Informational finding. No action required.',
  };

  return (
    <Box style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', width: '100%' }}>
      {order.map(sev => {
        const count = breakdown[sev];
        if (count === 0) return null;
        return (
          <DarkTooltip key={sev} title={`${sevTooltips[sev]} (${count} violation${count !== 1 ? 's' : ''})`} arrow enterDelay={200}>
            <Box
              style={{
                width: `${(count / total) * 100}%`,
                backgroundColor: SEVERITY_COLORS[sev],
                cursor: 'default',
              }}
            />
          </DarkTooltip>
        );
      })}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Demo proposals data — maps to violations by ruleId
// ---------------------------------------------------------------------------
const DEMO_PROPOSALS: Record<string, { desc: string; tier: 'deterministic' | 'ai'; removed: string[]; added: string[] }> = {
  'L026': {
    desc: 'Replace bare module name copy with fully qualified ansible.builtin.copy',
    tier: 'deterministic',
    removed: ['    - copy:'],
    added: ['    - ansible.builtin.copy:'],
  },
  'M009': {
    desc: 'Replace with_items loop syntax with the loop keyword',
    tier: 'deterministic',
    removed: ['      with_items: "{{ packages }}"'],
    added: ['      loop: "{{ packages }}"'],
  },
  'M022': {
    desc: 'Rename callback_whitelist to callbacks_enabled in ansible.cfg',
    tier: 'deterministic',
    removed: ['callback_whitelist = profile_tasks, timer'],
    added: ['callbacks_enabled = profile_tasks, timer'],
  },
  'M002': {
    desc: 'Replace ansible.builtin.yum with ansible.builtin.dnf (drop-in replacement)',
    tier: 'deterministic',
    removed: ['    - ansible.builtin.yum:'],
    added: ['    - ansible.builtin.dnf:'],
  },
  'L059': {
    desc: 'Remove the warn parameter (no longer supported in ansible-core 2.17+)',
    tier: 'deterministic',
    removed: ['        warn: false'],
    added: [],
  },
  'M011': {
    desc: 'Update community.general version requirement from 7.5.0 to >= 8.0.0',
    tier: 'deterministic',
    removed: ['  - name: community.general', '    version: ">=7.5.0"'],
    added: ['  - name: community.general', '    version: ">=8.0.0"'],
  },
  'L061': {
    desc: 'Replace yes/no with true/false for YAML boolean consistency',
    tier: 'deterministic',
    removed: ['enable_reporting: yes'],
    added: ['enable_reporting: true'],
  },
  'L021': {
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
  'L013': {
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
  'L024': {
    desc: 'Add a descriptive task name based on module and parameters used',
    tier: 'deterministic',
    removed: ['    - ansible.builtin.file:'],
    added: ['    - name: Ensure rollback directory exists', '      ansible.builtin.file:'],
  },
};

const DEMO_PROPOSALS_CONFIDENCE: Record<string, number> = {
  'L021': 0.94,
  'L013': 0.91,
  'L024': 0.88,
};

const DEMO_CODE_CONTEXT: Record<string, { lines: { num: number; text: string; highlighted?: boolean }[]; detail?: string }> = {
  'L027': { lines: [
    { num: 1, text: '# meta/main.yml' },
    { num: 2, text: '---' },
    { num: 3, text: 'galaxy_info:', highlighted: true },
    { num: 4, text: '  author: ""' },
    { num: 5, text: '  description: ""' },
  ], detail: 'Role metadata should include author, description, license, and supported platforms to help users discover and evaluate this role.' },
  'L061': { lines: [
    { num: 6, text: 'gather_facts: true' },
    { num: 7, text: '' },
    { num: 8, text: 'enable_reporting: yes', highlighted: true },
    { num: 9, text: 'verbose_output: no' },
  ], detail: 'YAML 1.1 accepts yes/no as booleans, but YAML 1.2 does not. Use true/false for forward compatibility.' },
  'M002': { lines: [
    { num: 16, text: '    - name: Apply patches to all packages' },
    { num: 17, text: '      ansible.builtin.include_tasks: patch-apply.yml' },
    { num: 18, text: '      ansible.builtin.yum:', highlighted: true },
    { num: 19, text: '        name: "*"' },
    { num: 20, text: '        state: latest' },
  ], detail: 'ansible.builtin.yum is deprecated in AAP 2.7+. Use ansible.builtin.dnf which is a drop-in replacement.' },
  'L026': { lines: [
    { num: 11, text: '    - name: Copy patching script to target' },
    { num: 12, text: '      copy:', highlighted: true },
    { num: 13, text: '        src: files/patch.sh' },
    { num: 14, text: '        dest: /tmp/patch.sh' },
    { num: 15, text: '        mode: "0755"' },
  ], detail: 'Use the fully qualified collection name (ansible.builtin.copy) to avoid ambiguity with custom modules sharing the same short name.' },
  'L013': { lines: [
    { num: 20, text: '    - name: Check current patch level' },
    { num: 21, text: '      ansible.builtin.command:', highlighted: true },
    { num: 22, text: '        cmd: rpm -qa --last' },
    { num: 23, text: '      register: patch_level' },
  ], detail: 'Commands that only read state should declare changed_when: false so Ansible reports them as "ok" rather than "changed".' },
  'L024': { lines: [
    { num: 3, text: '    - ansible.builtin.file:', highlighted: true },
    { num: 4, text: '        path: /var/backup/rollback' },
    { num: 5, text: '        state: directory' },
  ], detail: 'Unnamed tasks make playbook output hard to read and debug. Every task should have a descriptive name.' },
  'L059': { lines: [
    { num: 6, text: '    - name: Check disk space' },
    { num: 7, text: '      ansible.builtin.command:' },
    { num: 8, text: '        cmd: df -h', highlighted: true },
    { num: 9, text: '        warn: false', highlighted: true },
  ], detail: 'The warn parameter was removed in ansible-core 2.17 (AAP 2.7). Commands no longer emit deprecation warnings by default.' },
  'M011': { lines: [
    { num: 4, text: 'collections:' },
    { num: 5, text: '  - name: community.general' },
    { num: 6, text: '    version: ">=7.5.0"', highlighted: true },
  ], detail: 'community.general 7.5.0 is unsupported in AAP 2.7. Update to >= 8.0.0 for compatibility.' },
  'L021': { lines: [
    { num: 32, text: '    - name: Write patch report' },
    { num: 33, text: '      ansible.builtin.copy:' },
    { num: 34, text: '        content: "{{ patch_results | to_nice_yaml }}"', highlighted: true },
    { num: 35, text: '        dest: /var/log/patch-report.yml' },
  ], detail: 'File created without explicit permissions inherits umask defaults, which may be too permissive. Set mode explicitly.' },
  'M009': { lines: [
    { num: 20, text: '    - name: Apply security updates' },
    { num: 21, text: '      ansible.builtin.dnf:' },
    { num: 22, text: '        name: "{{ item }}"', highlighted: true },
    { num: 23, text: '      with_items: "{{ packages }}"', highlighted: true },
  ], detail: 'with_items is deprecated loop syntax. Use loop for forward compatibility with future Ansible versions.' },
  'M022': { lines: [
    { num: 1, text: '[defaults]' },
    { num: 2, text: 'inventory = ./inventory' },
    { num: 3, text: 'callback_whitelist = profile_tasks, timer', highlighted: true },
  ], detail: 'callback_whitelist was renamed to callbacks_enabled in ansible-core 2.17. The old name is no longer recognized.' },
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
        {repoUrl && isDevSpacesConnected() && hasRole('developer') ? (
          <Box style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <DarkTooltip title={`Open ${v.file}:${v.lineStart} in Dev Spaces`} arrow>
              <IconButton
                size="small"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const rsStatus = rowState === 'fixing' ? 'fixed' : rowState === 'proposal' ? 'proposed' : 'open';
                  window.open(`/devspaces-mockup.html?file=${encodeURIComponent(v.file)}&line=${v.lineStart}&tier=${v.fixTier}&status=${rsStatus}`, '_blank');
                }}
                style={{ padding: 4, borderRadius: 4 }}
              >
                <CodeIcon style={{ fontSize: 16, color: '#999' }} />
              </IconButton>
            </DarkTooltip>
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
          {repoUrl && isDevSpacesConnected() && hasRole('developer') && (
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
                  const rsStatus = rowState === 'fixing' ? 'fixed' : rowState === 'proposal' ? 'proposed' : 'open';
                  window.open(`/devspaces-mockup.html?file=${encodeURIComponent(v.file)}&line=${v.lineStart}&tier=${v.fixTier}&status=${rsStatus}`, '_blank');
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
}) => {
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  return (
    <Box style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', marginBottom: 16, borderRadius: 8,
      backgroundColor: isDark ? 'rgba(240,171,0,0.1)' : '#FFF3CD',
      border: `1px solid ${isDark ? 'rgba(240,171,0,0.25)' : '#FFECB5'}`,
    }}>
      <Typography style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#f0d080' : '#856404', marginRight: 4 }}>
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
            backgroundColor: currentState === state ? (isDark ? '#b8860b' : '#856404') : 'transparent',
            color: currentState === state ? '#fff' : (isDark ? '#f0d080' : '#856404'),
            border: `1px solid ${currentState === state ? (isDark ? '#b8860b' : '#856404') : (isDark ? 'rgba(240,171,0,0.25)' : '#FFECB5')}`,
            fontWeight: currentState === state ? 600 : 400,
          }}
        />
      ))}
    </Box>
  );
};

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
  const [categoryFilter, setCategoryFilter] = useState<ApmeRuleCategory | 'all'>('all');
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
    if (categoryFilter !== 'all') result = result.filter(v => apmeCategoryOf(v) === categoryFilter);
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
    quality.violations.forEach(v => {
      const id = apmeCategoryOf(v);
      counts[id] = (counts[id] || 0) + 1;
    });
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
      if (categoryFilter !== 'all') source = source.filter(v => apmeCategoryOf(v) === categoryFilter);
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
          {!scanning && (quality?.scanHistory?.length ?? 0) > 0 && (
            <Button
              size="small" variant="text"
              startIcon={<HistoryIcon style={{ fontSize: 14 }} />}
              onClick={() => {/* scan history not available in legacy tab */}}
              style={{ textTransform: 'none', fontSize: 12, color: '#666' }}
            >
              Scan history
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
                {isDevSpacesConnected() && isDeveloper && quality.violations.length > 0 && (
                  <Button
                    size="small" variant="outlined"
                    startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                    onClick={() => window.open('/devspaces-mockup.html', '_blank')}
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
                {isDevSpacesConnected() && (
                  <Button
                    size="small" variant="outlined"
                    startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                    onClick={() => window.open('/devspaces-mockup.html?state=remediated', '_blank')}
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
            <Box style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Box
                display="flex" alignItems="center" justifyContent="space-between"
                style={{
                  padding: '10px 20px',
                  backgroundColor: `${statusColors.success}08`,
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
              <Box style={{ padding: '6px 20px 8px', backgroundColor: `${statusColors.success}04` }}>
                <Typography style={{ fontSize: 12, color: '#6a6e73' }}>
                  <AutorenewIcon style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                  A re-scan will run automatically on the merged commit to confirm resolution before your AAP upgrade.
                </Typography>
              </Box>
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
                {isDevSpacesConnected() && isDeveloper && selectedViolations.size > 0 && (
                  <Button
                    size="small" variant="outlined"
                    startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                    onClick={() => window.open('/devspaces-mockup.html', '_blank')}
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
                    ...APME_CATEGORY_ORDER.map(key => ({
                      key,
                      label: APME_CATEGORY_LABEL[key],
                    })),
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
                  {repoUrl && isDevSpacesConnected() && (
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
                      {repoUrl && isDevSpacesConnected() && (
                        <DarkTooltip title={`Open ${file} in Dev Spaces`} arrow>
                          <IconButton size="small"
                            onClick={() => window.open(`/devspaces-mockup.html?file=${encodeURIComponent(file)}`, '_blank')}
                            style={{ padding: 4 }}>
                            <CodeIcon style={{ fontSize: 16, color: '#999' }} />
                          </IconButton>
                        </DarkTooltip>
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

type UnifiedViolationStatus = 'open' | 'proposed' | 'approved' | 'declined' | 'fixed' | 'in-pr' | 'resolved';

type QualityPageState = 'idle' | 'in-progress' | 'proposals-ready' | 'creating-pr' | 'pr-open' | 'pr-merged';

const CATEGORY_LABELS: Record<ApmeRuleCategory, string> = APME_CATEGORY_LABEL;

const TIER_TOOLTIPS = {
  deterministic: 'Deterministic rule-based transform. Ready immediately with high confidence — like a linter auto-fix.',
  ai: 'AI analyzes the context and generates a suggestion. Requires your review before including in a pull request.',
  manual: 'No automated fix available. Requires manual changes in your code editor.',
};

const REMEDIATION_STEPS = [
  { id: 'select', label: 'Select violations', num: 1 },
  { id: 'review', label: 'Review suggestions', num: 2 },
  { id: 'pr', label: 'Create pull request', num: 3 },
] as const;

type StepStatus = 'completed' | 'active' | 'active-running' | 'upcoming';

const FILLED_SEVERITY: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#a30000', color: '#fff' },
  high: { bg: '#c9190b', color: '#fff' },
  medium: { bg: '#f0ab00', color: '#3e2f00' },
  low: { bg: '#2b9af3', color: '#fff' },
  info: { bg: '#6a6e73', color: '#fff' },
};

function pageStateToStepIndex(pageState: QualityPageState): number {
  if (pageState === 'idle' || pageState === 'in-progress') return 0;
  if (pageState === 'proposals-ready') return 1;
  return 2;
}

function getRemediationStepStatus(stepIndex: number, pageState: QualityPageState): StepStatus {
  const activeIndex = pageStateToStepIndex(pageState);
  if (pageState === 'pr-merged' && stepIndex === 2) return 'completed';
  if (stepIndex < activeIndex) return 'completed';
  if (stepIndex > activeIndex) return 'upcoming';
  if (pageState === 'in-progress' && stepIndex === 0) return 'active-running';
  if (pageState === 'creating-pr' && stepIndex === 2) return 'active-running';
  return 'active';
}

const useQualityStyles = makeStyles(theme => {
  const isDark = theme.palette.type === 'dark';
  return ({
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  spinIcon: {
    animation: '$spin 1.2s linear infinite',
  },
  // Stepper
  pipeline: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2, 0),
    marginBottom: theme.spacing(1),
    overflowX: 'auto',
  },
  stepSegment: {
    display: 'flex',
    alignItems: 'center',
  },
  stepButton: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.75, 1.5),
    borderRadius: 20,
    whiteSpace: 'nowrap' as const,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1,
  },
  stepArrow: {
    fontSize: 14,
    margin: theme.spacing(0, 0.5),
    color: theme.palette.divider,
  },
  stepArrowCompleted: {
    color: `${statusColors.success}80`,
  },
  numberBadge: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
  },
  iconCompleted: {
    fontSize: 20,
    color: statusColors.success,
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: theme.spacing(0.5),
    padding: theme.spacing(0.75, 1.5),
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(91, 163, 82, 0.15)' : '#e7f5e7',
    color: isDark ? '#8bc986' : '#1e4620',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
  // Native table
  violationsTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
    '& thead': {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '& th': {
      textAlign: 'left' as const,
      padding: '10px 12px',
      fontWeight: 600,
      fontSize: 12,
      color: theme.palette.text.secondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.3,
    },
    '& td': {
      padding: '10px 12px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      verticalAlign: 'middle' as const,
    },
    '& tbody tr:last-child td': {
      borderBottom: 'none',
    },
    '& tbody tr:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  colCheckbox: { width: 48, paddingLeft: 14 },
  colExpand: { width: 36, padding: '10px 4px' },
  colSeverity: { width: 80 },
  colFix: { width: 180 },
  colDescription: { minWidth: 200 },
  colFile: { whiteSpace: 'nowrap' as const },
  colActions: { width: 44, textAlign: 'center' as const, paddingRight: 8 },
  expandButton: {
    padding: 2,
    borderRadius: 4,
    color: theme.palette.text.secondary,
  },
  // Row states
  rowSelected: { backgroundColor: `${isDark ? 'rgba(0,102,204,0.12)' : '#e8f4ff'} !important` },
  rowDone: { backgroundColor: `${isDark ? 'rgba(91,163,82,0.08)' : '#f8fdf8'} !important` },
  rowDeclined: { backgroundColor: `${isDark ? 'rgba(255,255,255,0.02)' : '#fafafa'} !important`, opacity: 0.75 },
  rowInPr: { backgroundColor: `${isDark ? 'rgba(0,102,204,0.06)' : '#f5faff'} !important` },
  rowResolved: {
    backgroundColor: `${isDark ? 'rgba(255,255,255,0.02)' : '#f9f9f9'} !important`,
    '& $description': { textDecoration: 'line-through', color: theme.palette.text.disabled, opacity: 0.7 },
  },
  rowClickable: { cursor: 'pointer' },
  rowProcessing: { backgroundColor: `${isDark ? 'rgba(103,83,172,0.1)' : '#f5f0ff'} !important`, opacity: 0.7 },
  rowExpanded: {
    backgroundColor: `${isDark ? 'rgba(103,83,172,0.05)' : '#faf9fc'} !important`,
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
  fixChipCategory: { opacity: 0.75, fontWeight: 400 },
  fixChipDeterministic: { backgroundColor: isDark ? 'rgba(91,163,82,0.15)' : '#e7f5e7', color: isDark ? '#8bc986' : '#1e4620', borderColor: isDark ? 'rgba(91,163,82,0.4)' : '#5ba352' },
  fixChipAi: { backgroundColor: isDark ? 'rgba(103,83,172,0.15)' : '#f5f0ff', color: isDark ? '#c4b5e3' : '#6753ac', borderColor: isDark ? 'rgba(178,163,219,0.4)' : '#b2a3db' },
  fixChipManual: { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0', color: theme.palette.text.secondary, borderColor: theme.palette.divider },
  fixChipApplied: { backgroundColor: isDark ? 'rgba(91,163,82,0.15)' : '#e7f5e7', color: isDark ? '#8bc986' : '#1e4620', borderColor: isDark ? 'rgba(91,163,82,0.4)' : '#5ba352' },
  fixChipReview: { backgroundColor: isDark ? 'rgba(103,83,172,0.15)' : '#f5f0ff', color: isDark ? '#c4b5e3' : '#6753ac', borderColor: isDark ? 'rgba(103,83,172,0.5)' : '#6753ac' },
  fixChipApproved: { backgroundColor: isDark ? 'rgba(91,163,82,0.15)' : '#e7f5e7', color: isDark ? '#8bc986' : '#1e4620', borderColor: isDark ? 'rgba(91,163,82,0.4)' : '#5ba352' },
  fixChipDeclined: { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0', color: theme.palette.text.secondary, borderColor: theme.palette.divider },
  fixChipInPr: { backgroundColor: isDark ? 'rgba(0,77,153,0.15)' : '#e8f4ff', color: isDark ? '#73bcf7' : '#004d99', borderColor: isDark ? 'rgba(115,188,247,0.4)' : '#73bcf7' },
  // Rule ID badge
  ruleId: {
    display: 'inline-block',
    fontSize: 11,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: theme.palette.text.secondary,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
    padding: '1px 5px',
    borderRadius: 3,
    marginRight: 8,
    verticalAlign: 'middle',
  },
  description: { fontSize: 13, color: theme.palette.text.primary },
  descriptionResolved: { textDecoration: 'line-through', color: theme.palette.text.disabled, opacity: 0.7 },
  chevron: { fontSize: 16, color: theme.palette.text.disabled, transition: 'transform 0.15s ease' },
  chevronOpen: { transform: 'rotate(90deg)' },
  codeContext: {
    margin: '8px 0',
    borderRadius: 4,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.divider}`,
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: 12,
    lineHeight: 1.6,
  },
  codeLine: { display: 'flex', padding: '0 12px', '&:hover': { backgroundColor: theme.palette.action.hover } },
  codeLineError: {
    backgroundColor: isDark ? 'rgba(201,25,11,0.12)' : '#ffeaea',
    borderLeft: '3px solid #c9190b',
    paddingLeft: 9,
  },
  codeLineNum: { width: 36, textAlign: 'right' as const, color: theme.palette.text.disabled, userSelect: 'none' as const, paddingRight: 12, flexShrink: 0 },
  codeLineText: { whiteSpace: 'pre' as const, color: theme.palette.text.primary },
  detailMeta: { display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: theme.palette.text.secondary },
  detailMetaItem: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  fileLink: {
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: theme.palette.primary.main,
    cursor: 'pointer',
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  severityChip: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  // Banners
  banner: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    border: '1px solid transparent',
    borderRadius: 6,
    marginBottom: 12,
  },
  bannerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  bannerIdle: { backgroundColor: isDark ? 'rgba(0,102,204,0.1)' : '#e8f4ff', borderColor: isDark ? 'rgba(115,188,247,0.3)' : '#73bcf7' },
  bannerProgress: { backgroundColor: isDark ? 'rgba(103,83,172,0.1)' : '#f5f0ff', borderColor: isDark ? 'rgba(178,163,219,0.3)' : '#b2a3db' },
  bannerReview: { backgroundColor: isDark ? 'rgba(103,83,172,0.1)' : '#f5f0ff', borderColor: isDark ? 'rgba(178,163,219,0.3)' : '#b2a3db' },
  bannerSuccess: { backgroundColor: isDark ? 'rgba(91,163,82,0.1)' : '#e7f5e7', borderColor: isDark ? 'rgba(91,163,82,0.3)' : '#5ba352' },
  bannerPrOpen: { backgroundColor: isDark ? 'rgba(91,163,82,0.1)' : '#e7f5e7', borderColor: isDark ? 'rgba(91,163,82,0.3)' : '#5ba352' },
  bannerMerged: { backgroundColor: isDark ? 'rgba(91,163,82,0.1)' : '#e7f5e7', borderColor: isDark ? 'rgba(91,163,82,0.3)' : '#5ba352' },
  // Confirm dialog overlay
  confirmOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: theme.zIndex.modal,
    padding: theme.spacing(2),
  },
  confirmCard: {
    maxWidth: 480,
    width: '100%',
    borderRadius: 8,
    outline: 'none',
  },
  confirmHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  confirmBreakdown: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    margin: '12px 0',
  },
  confirmBreakdownRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 13,
    color: theme.palette.text.primary,
  },
  confirmNote: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
    lineHeight: 1.5,
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  // Proposal preview
  proposalPreview: {
    padding: '12px 16px 16px 48px',
    backgroundColor: isDark ? 'rgba(103,83,172,0.05)' : 'rgba(103,83,172,0.025)',
    borderTop: `1px solid ${isDark ? 'rgba(103,83,172,0.2)' : 'rgba(103,83,172,0.1)'}`,
  },
  proposalTitle: { fontSize: 13, fontWeight: 600, color: theme.palette.text.primary },
  proposalDiff: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderRadius: 6,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: 10,
    marginTop: 8,
  },
  diffPanelHeaderRemoved: { padding: '4px 10px', fontSize: 10, fontWeight: 600, backgroundColor: 'rgba(248,81,73,0.12)', color: isDark ? '#f97583' : '#cf222e', textTransform: 'uppercase' as const },
  diffPanelHeaderAdded: { padding: '4px 10px', fontSize: 10, fontWeight: 600, backgroundColor: 'rgba(46,160,67,0.12)', color: isDark ? '#85e89d' : '#1a7f37', textTransform: 'uppercase' as const },
  diffCodeRemoved: { fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, padding: '6px 10px', backgroundColor: isDark ? 'rgba(248,81,73,0.08)' : 'rgba(248,81,73,0.04)', color: isDark ? '#f97583' : '#cf222e' },
  diffCodeAdded: { fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, padding: '6px 10px', backgroundColor: isDark ? 'rgba(46,160,67,0.08)' : 'rgba(46,160,67,0.04)', color: isDark ? '#85e89d' : '#1a7f37' },
  proposalActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  btnApprove: {
    textTransform: 'none' as const,
    fontSize: 12,
    padding: '4px 12px',
    backgroundColor: statusColors.success,
    color: '#fff',
    '&:hover': { backgroundColor: '#3e8635' },
  },
  prBadge: { fontSize: 11, fontWeight: 700, fontFamily: 'monospace', height: 22, backgroundColor: isDark ? '#1a5fb4' : '#004d99', color: '#fff' },
  branchCode: { fontSize: 11, fontFamily: "'SF Mono', 'Fira Code', monospace", background: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', padding: '1px 5px', borderRadius: 3 },
});
});

function QualityStepper({ pageState }: { pageState: QualityPageState }) {
  const classes = useQualityStyles();
  const theme = useTheme();

  return (
    <Box className={classes.pipeline}>
      {REMEDIATION_STEPS.map((step, i) => {
        const stepStatus = getRemediationStepStatus(i, pageState);
        const labelColor =
          stepStatus === 'completed' ? statusColors.success
            : stepStatus === 'active' ? statusColors.info
              : stepStatus === 'active-running' ? statusColors.warning
                : statusColors.pending;

        return (
          <Box key={step.id} className={classes.stepSegment}>
            {i > 0 && (
              <Typography
                component="span"
                className={`${classes.stepArrow} ${stepStatus !== 'upcoming' ? classes.stepArrowCompleted : ''}`}
              >
                →
              </Typography>
            )}
            <Box
              className={classes.stepButton}
              style={{
                opacity: stepStatus === 'upcoming' ? 0.55 : 1,
                backgroundColor: stepStatus === 'active' || stepStatus === 'active-running'
                  ? `${labelColor}08`
                  : undefined,
              }}
            >
              {stepStatus === 'completed' ? (
                <CheckCircleIcon className={classes.iconCompleted} />
              ) : stepStatus === 'active-running' ? (
                <AutorenewIcon className={classes.spinIcon} style={{ fontSize: 18, color: statusColors.warning }} />
              ) : (
                <Box
                  className={classes.numberBadge}
                  style={
                    stepStatus === 'active'
                      ? { backgroundColor: statusColors.info, color: '#fff' }
                      : { border: `1.5px solid ${theme.palette.text.disabled}`, color: theme.palette.text.disabled }
                  }
                >
                  {step.num}
                </Box>
              )}
              <Typography className={classes.stepLabel} style={{ color: labelColor }}>
                {step.label}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

const FixChipStyled = ({
  mode,
  method,
  status,
  category,
  classes,
}: {
  mode: 'tier' | 'status';
  method: 'deterministic' | 'ai' | 'manual';
  status: UnifiedViolationStatus;
  category?: ApmeRuleCategory;
  classes: ReturnType<typeof useQualityStyles>;
}) => {
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;

  if (mode === 'tier') {
    const icon = method === 'deterministic' ? '⚡' : method === 'ai' ? '✦' : '—';
    const label = method === 'deterministic' ? 'Auto-fixable' : method === 'ai' ? 'AI-fixable' : 'Manual only';
    const chipClass =
      method === 'deterministic' ? classes.fixChipDeterministic
        : method === 'ai' ? classes.fixChipAi
          : classes.fixChipManual;
    const tooltip = TIER_TOOLTIPS[method];

    return (
      <DarkTooltip title={tooltip} arrow enterDelay={200}>
        <span className={`${classes.fixChip} ${chipClass}`}>
          <span className={classes.fixChipIcon}>{icon}</span>
          {label}
          {categoryLabel && (
            <>
              <span style={{ opacity: 0.5 }}>·</span>
              <span className={classes.fixChipCategory}>{categoryLabel}</span>
            </>
          )}
        </span>
      </DarkTooltip>
    );
  }

  let label = 'Manual only';
  let chipClass = classes.fixChipManual;
  let tooltip = TIER_TOOLTIPS.manual;
  let icon: string | null = null;

  if (status === 'fixed') {
    label = 'Ready'; chipClass = classes.fixChipApplied; icon = '✓';
    tooltip = 'Auto-fix suggestion ready — will be included in the pull request';
  } else if (status === 'proposed') {
    label = 'Needs review'; chipClass = classes.fixChipReview;
    tooltip = 'AI-generated suggestion — expand to review, then accept or decline';
  } else if (status === 'approved') {
    label = 'Ready'; chipClass = classes.fixChipApproved; icon = '✓';
    tooltip = 'Suggestion accepted — will be included in the pull request';
  } else if (status === 'declined') {
    label = 'Declined'; chipClass = classes.fixChipDeclined;
    tooltip = 'Suggestion declined — will not be included in the pull request';
  } else if (status === 'in-pr') {
    label = 'In PR'; chipClass = classes.fixChipInPr;
    tooltip = 'Included in the open pull request — awaiting review and merge';
  } else if (status === 'resolved') {
    label = 'Resolved'; chipClass = classes.fixChipApplied; icon = '✓';
    tooltip = 'Resolved — change was merged and the violation is addressed';
  } else if (method !== 'manual') {
    label = method === 'deterministic' ? 'Auto-fixable' : 'AI-fixable';
    chipClass = method === 'deterministic' ? classes.fixChipDeterministic : classes.fixChipAi;
    tooltip = TIER_TOOLTIPS[method];
    icon = method === 'deterministic' ? '⚡' : '✦';
  }

  return (
    <DarkTooltip title={tooltip} arrow enterDelay={200}>
      <span className={`${classes.fixChip} ${chipClass}`}>
        {icon && <span className={classes.fixChipIcon}>{icon}</span>}
        {label}
      </span>
    </DarkTooltip>
  );
};

const ConfirmRemediationDialog = ({
  open,
  autoFixCount,
  aiCount,
  onConfirm,
  onCancel,
  classes,
}: {
  open: boolean;
  autoFixCount: number;
  aiCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  classes: ReturnType<typeof useQualityStyles>;
}) => {
  if (!open) return null;
  const total = autoFixCount + aiCount;

  return (
    <Box className={classes.confirmOverlay} onClick={onCancel}>
      <Card className={classes.confirmCard} onClick={e => e.stopPropagation()} elevation={8}>
        <CardContent style={{ padding: '20px 24px' }}>
          <Box className={classes.confirmHeader}>
            <BuildIcon style={{ fontSize: 20, color: statusColors.warning }} />
            <Typography style={{ fontSize: 16, fontWeight: 600 }}>Suggest fixes</Typography>
          </Box>
          <Typography style={{ fontSize: 13 }}>
            Generate fix suggestions for <strong>{total} violation{total !== 1 ? 's' : ''}</strong>.
          </Typography>
          <Box className={classes.confirmBreakdown}>
            {autoFixCount > 0 && (
              <Box className={classes.confirmBreakdownRow}>
                <span className={`${classes.fixChip} ${classes.fixChipDeterministic}`} style={{ flexShrink: 0 }}>
                  <span className={classes.fixChipIcon}>⚡</span>
                  Auto-fixable
                </span>
                <span>{autoFixCount} auto-fix suggestions — ready immediately</span>
              </Box>
            )}
            {aiCount > 0 && (
              <Box className={classes.confirmBreakdownRow}>
                <span className={`${classes.fixChip} ${classes.fixChipAi}`} style={{ flexShrink: 0 }}>
                  <span className={classes.fixChipIcon}>✦</span>
                  AI-fixable
                </span>
                <span>{aiCount} AI suggestions — need your review</span>
              </Box>
            )}
          </Box>
          <Typography className={classes.confirmNote}>
            After reviewing the suggestions, you can create a pull request with the accepted changes.
            To address additional violations, start a new cycle.
          </Typography>
          <Box className={classes.confirmActions}>
            <Button onClick={onCancel} style={{ textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={onConfirm} style={{ textTransform: 'none' }}>
              Suggest fixes for {total} violation{total !== 1 ? 's' : ''}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

/* ─── Scan History Drawer ─── */

const HISTORY_TRIGGER_LABELS: Record<string, { label: string; icon: string }> = {
  push: { label: 'Push', icon: '↑' },
  pull_request: { label: 'Pull request', icon: '⑂' },
  schedule: { label: 'Scheduled', icon: '⏱' },
  manual: { label: 'Manual', icon: '▶' },
};

const HISTORY_FLOW_STEPS = [
  { key: 'scan', label: 'Scanned' },
  { key: 'suggest', label: 'Suggestions generated' },
  { key: 'pr', label: 'Pull request created' },
  { key: 'merge', label: 'Pull request merged' },
] as const;

const OUTCOME_STEP_REACH: Record<ScanRemediationOutcome, number> = {
  'none': 0,
  'in-progress': 0,
  'suggestions-ready': 1,
  'pr-open': 2,
  'pr-merged': 3,
};

const SCAN_ACTION_CONFIG: Record<ScanRemediationOutcome, { label: string; variant: 'text' | 'outlined' } | null> = {
  'none': null,
  'in-progress': { label: 'Generating…', variant: 'text' },
  'suggestions-ready': { label: 'Review suggestions', variant: 'outlined' },
  'pr-open': { label: 'View pull request', variant: 'outlined' },
  'pr-merged': { label: 'View pull request', variant: 'text' },
};

const ScanHistoryView = ({
  scanHistory, isDark, theme, classes, onBack,
}: {
  scanHistory: ScanResult[];
  isDark: boolean;
  theme: Theme;
  classes: Record<string, string>;
  onBack: () => void;
}) => {
  const subtleText = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const sevOrder: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];
  const inactiveIcon = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';

  return (
    <Box>
      <Box display="flex" alignItems="center" style={{ marginBottom: 16 }}>
        <Button size="small" variant="text"
          startIcon={<ChevronRightIcon style={{ fontSize: 16, transform: 'rotate(180deg)' }} />}
          onClick={onBack}
          style={{ textTransform: 'none', fontSize: 13, fontWeight: 500, color: theme.palette.text.secondary, padding: '4px 8px', minWidth: 0 }}>
          Back to latest scan
        </Button>
      </Box>

      <Card variant="outlined" style={{ borderRadius: 8, overflow: 'hidden' }}>
        <Box style={{ overflow: 'auto' }}>
          <table className={classes.violationsTable}>
            <thead>
              <tr>
                <th style={{ width: 170 }}>DATE</th>
                <th style={{ width: 90 }}>TRIGGER</th>
                <th style={{ width: 80 }}>COMMIT</th>
                <th style={{ width: 130 }}>VIOLATIONS</th>
                <th>SEVERITY</th>
                <th style={{ width: 120 }}>REMEDIATION</th>
                <th style={{ width: 140, textAlign: 'right' as const }}></th>
              </tr>
            </thead>
            <tbody>
              {scanHistory.map((scan, idx) => {
                const trigger = HISTORY_TRIGGER_LABELS[scan.trigger ?? 'push'];
                const outcome = scan.remediationOutcome ?? 'none';
                const remaining = scan.remainingViolations ?? scan.totalViolations;
                const fixed = scan.totalViolations - remaining;
                const allResolved = remaining === 0 && scan.totalViolations > 0;
                const stepsReached = OUTCOME_STEP_REACH[outcome];
                const actionCfg = SCAN_ACTION_CONFIG[outcome];
                const isLatest = idx === 0;

                return (
                  <tr key={scan.scanId}>
                    {/* Date */}
                    <td>
                      <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                        <span style={{ fontWeight: isLatest ? 600 : 400 }}>{scan.createdAt}</span>
                        {isLatest && (
                          <Chip label="Active" size="small" style={{
                            height: 16, fontSize: 9, fontWeight: 600,
                            background: isDark ? 'rgba(56,139,253,0.15)' : '#dbeafe',
                            color: isDark ? '#58a6ff' : '#1d4ed8',
                          }} />
                        )}
                      </Box>
                    </td>
                    {/* Trigger */}
                    <td style={{ color: theme.palette.text.secondary, fontSize: 12 }}>
                      {trigger.icon} {trigger.label}
                    </td>
                    {/* Commit */}
                    <td>
                      <code style={{ fontSize: 11, color: subtleText }}>{scan.commitHash}</code>
                    </td>
                    {/* Violations — merged column */}
                    <td>
                      {allResolved ? (
                        <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                          <CheckCircleIcon style={{ fontSize: 13, color: statusColors.success }} />
                          <span style={{ color: statusColors.success, fontWeight: 500, fontSize: 12 }}>
                            All resolved
                          </span>
                        </Box>
                      ) : fixed > 0 ? (
                        <Box>
                          <span style={{ fontWeight: 500 }}>{remaining} unresolved</span>
                          <span style={{ color: subtleText, fontSize: 11, marginLeft: 4 }}>/ {scan.totalViolations}</span>
                        </Box>
                      ) : (
                        <span style={{ fontWeight: 500 }}>{scan.totalViolations} found</span>
                      )}
                    </td>
                    {/* Severity mini-chips */}
                    <td>
                      <Box display="flex" alignItems="center" style={{ gap: 3, flexWrap: 'wrap' }}>
                        {sevOrder.map(sev => {
                          const found = scan.severityBreakdown[sev] ?? 0;
                          const remain = scan.remainingSeverity?.[sev] ?? found;
                          const resolved = found - remain;
                          if (found === 0) return null;
                          return (
                            <DarkTooltip key={sev} title={`${sev}: ${remain} remaining${resolved > 0 ? `, ${resolved} resolved` : ''}`} arrow>
                              <Box display="inline-flex" alignItems="center" style={{ gap: 2 }}>
                                {remain > 0 && (
                                  <Box style={{
                                    padding: '0 5px', borderRadius: 3, fontSize: 10, fontWeight: 600, lineHeight: '18px',
                                    background: SEVERITY_COLORS[sev].bg, color: SEVERITY_COLORS[sev].text,
                                  }}>
                                    {sev.charAt(0).toUpperCase()}{remain}
                                  </Box>
                                )}
                                {resolved > 0 && (
                                  <Box style={{
                                    padding: '0 5px', borderRadius: 3, fontSize: 10, fontWeight: 500, lineHeight: '18px',
                                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                                    color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)',
                                    textDecoration: 'line-through',
                                  }}>
                                    {sev.charAt(0).toUpperCase()}{resolved}
                                  </Box>
                                )}
                              </Box>
                            </DarkTooltip>
                          );
                        })}
                      </Box>
                    </td>
                    {/* Remediation — pipeline-style status circles */}
                    <td>
                      <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                        {HISTORY_FLOW_STEPS.map((step, i) => {
                          const reached = i === 0 || i <= stepsReached;
                          return (
                            <DarkTooltip key={step.key} title={reached ? step.label : step.label} arrow>
                              {reached ? (
                                <CheckCircleIcon style={{ fontSize: 16, color: isDark ? '#3fb950' : '#1a7f37' }} />
                              ) : (
                                <RadioButtonUncheckedIcon style={{ fontSize: 16, color: inactiveIcon }} />
                              )}
                            </DarkTooltip>
                          );
                        })}
                      </Box>
                    </td>
                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      {actionCfg ? (
                        <Button size="small" variant={actionCfg.variant}
                          disabled={outcome === 'in-progress'}
                          onClick={() => {
                            if (scan.prUrl && (outcome === 'pr-open' || outcome === 'pr-merged')) {
                              window.open(scan.prUrl, '_blank');
                            } else if (outcome === 'suggestions-ready') {
                              onBack();
                            }
                          }}
                          style={{ textTransform: 'none', fontSize: 12, padding: '2px 10px', minWidth: 0 }}>
                          {actionCfg.label}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Card>
    </Box>
  );
};

export const QualityTabUnified = ({
  quality,
  projectName,
  initialSeverity,
  initialRuleFilter,
  initialCategoryFilter,
  repoUrl,
  branch,
}: {
  quality: ProjectQualityData | null;
  projectName: string;
  initialView?: 'latest-scan';
  initialScanId?: string | null;
  initialSeverity?: SeverityClass | null;
  initialRuleFilter?: string | null;
  initialCategoryFilter?: ApmeRuleCategory | null;
  repoUrl?: string;
  branch?: string;
}) => {
  const classes = useQualityStyles();
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  const { hasRole } = useUserRoleContext();
  const isDeveloper = hasRole('developer');

  const [categoryFilter, setCategoryFilter] = useState<ApmeRuleCategory | 'all'>(initialCategoryFilter ?? 'all');
  const [severityFilters, setSeverityFilters] = useState<Set<SeverityClass>>(initialSeverity ? new Set([initialSeverity]) : new Set());
  const [ruleFilter, setRuleFilter] = useState<string | null>(initialRuleFilter ?? null);
  type FixTierFilter = 'deterministic' | 'ai' | 'manual';
  const [fixFilters, setFixFilters] = useState<Set<FixTierFilter>>(new Set());
  const [violationStatuses, setViolationStatuses] = useState<Map<string, UnifiedViolationStatus>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pageState, setPageState] = useState<QualityPageState>('idle');
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remediatingCount, setRemediatingCount] = useState(0);
  const [selectMenuAnchor, setSelectMenuAnchor] = useState<null | HTMLElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  type SortColumn = 'severity' | 'fix' | 'rule' | 'file';
  const [sortColumn, setSortColumn] = useState<SortColumn>('severity');
  const [sortAsc, setSortAsc] = useState(false);

  const getViolationKey = (v: QualityViolation) => v.ruleId + ':' + v.file + ':' + v.lineStart;
  const getStatus = (v: QualityViolation): UnifiedViolationStatus => violationStatuses.get(getViolationKey(v)) ?? 'open';

  const violations = quality?.violations ?? [];
  const scan = quality?.latestScan;

  const toggleSeverityFilter = (sev: SeverityClass) => {
    setSeverityFilters(prev => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev); else next.add(sev);
      return next;
    });
  };

  const toggleFixFilter = (tier: FixTierFilter) => {
    setFixFilters(prev => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier); else next.add(tier);
      return next;
    });
  };

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) setSortAsc(!sortAsc);
    else { setSortColumn(col); setSortAsc(col === 'file' || col === 'rule'); }
  };

  useEffect(() => {
    if (!ruleFilter || !quality) return;
    const matching = quality.violations.filter(v => v.ruleId === ruleFilter);
    if (matching.length > 0 && matching.length <= 3) {
      setExpandedIds(new Set(matching.map(v => getViolationKey(v))));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const FIX_ORDER: Record<string, number> = { deterministic: 0, ai: 1, manual: 2 };
  const STATUS_SORT_ORDER: Record<UnifiedViolationStatus, number> = {
    proposed: 0,
    fixed: 1,
    approved: 2,
    declined: 3,
    'in-pr': 4,
    resolved: 5,
    open: 6,
  };

  const filteredViolations = useMemo(() => {
    if (!quality) return [];
    let result = quality.violations;

    // Step 2+: only show violations that are part of the current remediation cycle
    if (pageState !== 'idle' && pageState !== 'in-progress') {
      result = result.filter(v => getStatus(v) !== 'open');
    }

    if (ruleFilter) result = result.filter(v => v.ruleId === ruleFilter);
    if (severityFilters.size > 0) result = result.filter(v => severityFilters.has(v.severity));
    if (fixFilters.size > 0) result = result.filter(v => fixFilters.has(v.fixTier));
    if (categoryFilter !== 'all') result = result.filter(v => apmeCategoryOf(v) === categoryFilter);

    const sorted = [...result].sort((a, b) => {
      if (pageState !== 'idle' && pageState !== 'in-progress') {
        const statusCmp = STATUS_SORT_ORDER[getStatus(a)] - STATUS_SORT_ORDER[getStatus(b)];
        if (statusCmp !== 0) return statusCmp;
      }
      let cmp = 0;
      switch (sortColumn) {
        case 'severity': cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]; break;
        case 'fix': cmp = FIX_ORDER[a.fixTier] - FIX_ORDER[b.fixTier]; break;
        case 'rule': cmp = a.ruleId.localeCompare(b.ruleId); break;
        case 'file': cmp = a.file.localeCompare(b.file) || a.lineStart - b.lineStart; break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [quality, categoryFilter, severityFilters, fixFilters, ruleFilter, violationStatuses, sortColumn, sortAsc, pageState, getStatus]);

  const fixableCount = violations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').length;
  const autoFixableTotal = violations.filter(v => v.fixTier === 'deterministic' && getStatus(v) === 'open').length;
  const aiFixableTotal = violations.filter(v => v.fixTier === 'ai' && getStatus(v) === 'open').length;
  const fixedCount = violations.filter(v => getStatus(v) === 'fixed').length;
  const proposedCount = violations.filter(v => getStatus(v) === 'proposed').length;
  const approvedCount = violations.filter(v => getStatus(v) === 'approved').length;
  const declinedCount = violations.filter(v => getStatus(v) === 'declined').length;
  const inPrCount = violations.filter(v => getStatus(v) === 'in-pr').length;
  const resolvedCount = violations.filter(v => getStatus(v) === 'resolved').length;
  const prReadyCount = fixedCount + approvedCount;
  const remediatedTotal = violations.filter(v => getStatus(v) !== 'open').length;
  const remainingCount = violations.length - remediatedTotal;
  const isStep1 = pageState === 'idle' || pageState === 'in-progress';
  const showCheckboxes = pageState === 'idle';

  const selectedAutoFixCount = useMemo(
    () => violations.filter(v => selectedIds.has(getViolationKey(v)) && v.fixTier === 'deterministic').length,
    [violations, selectedIds, getViolationKey],
  );
  const selectedAiCount = useMemo(
    () => violations.filter(v => selectedIds.has(getViolationKey(v)) && v.fixTier === 'ai').length,
    [violations, selectedIds, getViolationKey],
  );

  const handleScanClick = () => {
    setScanning(true);
    setViolationStatuses(new Map());
    setSelectedIds(new Set());
    setPageState('idle');
    setTimeout(() => { setScanning(false); }, 2500);
  };

  const remediateKeys = (keys: Set<string>) => {
    if (keys.size === 0 || !quality) return;
    setShowConfirm(false);
    setRemediatingCount(keys.size);
    setPageState('in-progress');
    setTimeout(() => {
      const proposedKeys = new Set<string>();
      setViolationStatuses(prev => {
        const next = new Map(prev);
        quality.violations.forEach(v => {
          const key = getViolationKey(v);
          if (!keys.has(key)) return;
          if (v.fixTier === 'deterministic') next.set(key, 'fixed');
          else if (v.fixTier === 'ai') {
            next.set(key, 'proposed');
            proposedKeys.add(key);
          }
        });
        return next;
      });
      setSelectedIds(new Set());
      setPageState('proposals-ready');
      setExpandedIds(proposedKeys);
    }, 3000);
  };

  const handleRemediateClick = () => setShowConfirm(true);
  const handleConfirmRemediate = () => remediateKeys(selectedIds);

  const collapseOne = (key: string) => setExpandedIds(prev => { const n = new Set(prev); n.delete(key); return n; });
  const toggleExpanded = (key: string) => setExpandedIds(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  const handleApprove = (key: string) => { setViolationStatuses(prev => { const n = new Map(prev); n.set(key, 'approved'); return n; }); collapseOne(key); };
  const handleDecline = (key: string) => { setViolationStatuses(prev => { const n = new Map(prev); n.set(key, 'declined'); return n; }); collapseOne(key); };

  const handleCreatePr = () => {
    setPageState('creating-pr');
    setTimeout(() => {
      setViolationStatuses(prev => {
        const n = new Map(prev);
        for (const [key, s] of n) { if (s === 'fixed' || s === 'approved') n.set(key, 'in-pr'); }
        return n;
      });
      setPageState('pr-open');
    }, 1500);
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
    if (!quality) return;
    const fixable = quality.violations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open');
    const allSelected = fixable.every(v => selectedIds.has(getViolationKey(v)));
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(fixable.map(v => getViolationKey(v))));
  };

  const handleReset = () => {
    setViolationStatuses(new Map());
    setSelectedIds(new Set());
    setExpandedIds(new Set());
    setPageState('idle');
    setShowConfirm(false);
    setRemediatingCount(0);
  };

  const selectByPredicate = (predicate: (v: QualityViolation) => boolean) => {
    const keys = filteredViolations.filter(v => predicate(v) && getStatus(v) === 'open').map(v => getViolationKey(v));
    setSelectedIds(prev => { const n = new Set(prev); keys.forEach(k => n.add(k)); return n; });
    setSelectMenuAnchor(null);
  };

  const remBranch = 'apme/remediate-' + projectName;

  if (!quality || !scan) {
    return (
      <Box style={{ marginTop: 24 }}>
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
            <VerifiedUserOutlinedIcon style={{ fontSize: 40, color: theme.palette.text.disabled, marginBottom: 12 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No quality scans yet</Typography>
            <Typography style={{ fontSize: 13, color: theme.palette.text.secondary, maxWidth: 400, margin: '0 auto' }}>
              Quality scans run automatically as GitHub Actions when you push to this repository.
              Configure the APME scan workflow to check for compatibility issues, security risks, and best practice violations.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const renderBanner = () => {
    if (pageState === 'idle' && fixableCount > 0) {
      return (
        <Box className={`${classes.banner} ${classes.bannerIdle}`}>
          <Typography style={{ fontSize: 13 }}>
            <strong>{fixableCount} violation{fixableCount !== 1 ? 's' : ''}</strong> have available fix suggestions
            {' — '}{autoFixableTotal} auto-fixable{aiFixableTotal > 0 ? `, ${aiFixableTotal} AI-fixable` : ''}.
            {' '}Select the violations you want to address, then click Suggest fixes.
          </Typography>
        </Box>
      );
    }
    if (pageState === 'in-progress') {
      return (
        <Box className={`${classes.banner} ${classes.bannerProgress}`}>
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <AutorenewIcon className={classes.spinIcon} style={{ fontSize: 14, color: isDark ? '#c4b5e3' : '#6753ac' }} />
            <Typography style={{ fontSize: 13, color: isDark ? '#c4b5e3' : '#6753ac', fontWeight: 500 }}>
              Generating fixes for {remediatingCount} violation{remediatingCount !== 1 ? 's' : ''}…
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} style={{ height: 4, borderRadius: 2, marginTop: 6 }} />
        </Box>
      );
    }
    if (pageState === 'proposals-ready') {
      if (proposedCount > 0) {
        return (
          <Box className={`${classes.banner} ${classes.bannerReview}`}>
            <Typography style={{ fontSize: 13, color: isDark ? '#c4b5e3' : '#6753ac' }}>
              <strong>{fixedCount} suggestion{fixedCount !== 1 ? 's' : ''} ready.</strong>
              {' '}{proposedCount} AI suggestion{proposedCount !== 1 ? 's' : ''} need{proposedCount === 1 ? 's' : ''} your review before creating a pull request.
            </Typography>
          </Box>
        );
      }
      if (prReadyCount > 0) {
        return (
          <Box className={`${classes.banner} ${classes.bannerSuccess}`}>
            <Box className={classes.bannerRow}>
              <Typography style={{ fontSize: 13, color: isDark ? '#8bc986' : '#1e4620' }}>
                <strong>{prReadyCount} suggestion{prReadyCount !== 1 ? 's' : ''} ready for pull request.</strong>
                {declinedCount > 0 && ` ${declinedCount} declined.`}
              </Typography>
              {isDeveloper && (
                <Button variant="contained" color="primary" size="small" onClick={handleCreatePr}
                  style={{ textTransform: 'none', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                  Create pull request with {prReadyCount} change{prReadyCount !== 1 ? 's' : ''}
                </Button>
              )}
            </Box>
          </Box>
        );
      }
    }
    if (pageState === 'creating-pr') {
      return (
        <Box className={`${classes.banner} ${classes.bannerProgress}`}>
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <AutorenewIcon className={classes.spinIcon} style={{ fontSize: 14, color: theme.palette.primary.main }} />
            <Typography style={{ fontSize: 13, color: theme.palette.primary.main, fontWeight: 500 }}>Creating pull request…</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} style={{ height: 4, borderRadius: 2, marginTop: 6 }} />
        </Box>
      );
    }
    if (pageState === 'pr-open') {
      return (
        <Box className={`${classes.banner} ${classes.bannerPrOpen}`}>
          <Box className={classes.bannerRow}>
            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
              <Chip size="small" label="PR #99" className={classes.prBadge} />
              <Typography style={{ fontSize: 13 }}>
                Pull request created with {inPrCount} change{inPrCount !== 1 ? 's' : ''} on branch <code className={classes.branchCode}>{remBranch}</code>.
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" style={{ gap: 6, flexShrink: 0 }}>
              <Button size="small" variant="outlined" startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                onClick={() => window.open(`${repoUrl}/pull/99`, '_blank')}
                style={{ textTransform: 'none', fontSize: 13, fontWeight: 500 }}>
                View pull request
              </Button>
              {isDevSpacesConnected() && isDeveloper && (
                <Button size="small" variant="contained" color="primary" startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                  onClick={() => window.open(`/devspaces-mockup.html?state=pr-review&branch=${encodeURIComponent(remBranch)}`, '_blank')}
                  style={{ textTransform: 'none', fontSize: 13, fontWeight: 500 }}>
                  Review in Dev Spaces
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      );
    }
    if (pageState === 'pr-merged') {
      return (
        <Box className={`${classes.banner} ${classes.bannerMerged}`}>
          <Box className={classes.bannerRow}>
            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
              <CheckCircleIcon style={{ fontSize: 16, color: '#5ba352' }} />
              <Typography style={{ fontSize: 13, color: isDark ? '#8bc986' : '#1e4620', fontWeight: 500 }}>
                Pull request merged — <strong>{resolvedCount}</strong> violation{resolvedCount !== 1 ? 's' : ''} resolved.
                {remainingCount > 0 && ` ${remainingCount} remaining in this scan.`}
              </Typography>
            </Box>
            {isDeveloper && (
              <Button size="small" variant="outlined"
                startIcon={<AutorenewIcon style={{ fontSize: 14 }} />}
                onClick={handleScanClick}
                style={{ textTransform: 'none', fontSize: 12, padding: '4px 12px', borderColor: isDark ? 'rgba(91,163,82,0.5)' : '#5ba352', color: isDark ? '#8bc986' : '#1e4620' }}>
                Scan again
              </Button>
            )}
          </Box>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box style={{ marginTop: 24 }}>
      {/* Scan context */}
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
        <Typography style={{ fontSize: 13, color: theme.palette.text.secondary }}>
          {scanning ? <>Scanning repository…</> : (
            <><strong style={{ color: theme.palette.text.primary, fontWeight: 600 }}>Scanning against: AAP 2.7</strong> <span style={{ opacity: 0.7 }}>(ansible-core 2.17)</span> · Last scan {quality.lastScannedAt} · commit <code style={{ fontSize: 11 }}>{quality.lastScannedCommit?.slice(0, 7)}</code>
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
          {!scanning && (quality?.scanHistory?.length ?? 0) > 0 && (
            <Button size="small" variant="text" startIcon={<HistoryIcon style={{ fontSize: 14 }} />}
              onClick={() => setHistoryOpen(true)} style={{ textTransform: 'none', fontSize: 12, color: theme.palette.text.secondary }}>
              Scan history
            </Button>
          )}
        </Box>
      </Box>
      {scanning && <LinearProgress variant="determinate" value={scanProgress} style={{ height: 4, borderRadius: 2, marginBottom: 8 }} />}

      {/* Scan history drilldown */}
      {historyOpen ? (
        <ScanHistoryView
          scanHistory={quality?.scanHistory ?? []}
          isDark={isDark}
          theme={theme}
          classes={classes}
          onBack={() => setHistoryOpen(false)}
        />
      ) : scan.totalViolations === 0 ? (
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '32px 24px', textAlign: 'center' }}>
            <CheckCircleIcon style={{ fontSize: 40, color: statusColors.success, marginBottom: 8 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500 }}>No violations detected</Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <QualityStepper pageState={pageState} />
          {renderBanner()}

          {/* Toolbar — selection + suggest fixes (step 1 only) */}
          {isDeveloper && showCheckboxes && (
            <Box display="flex" alignItems="center" justifyContent="space-between" style={{ padding: '8px 0', marginBottom: 8 }}>
              <Box display="flex" alignItems="center" style={{ gap: 10 }}>
                <Box display="inline-flex" alignItems="center"
                  style={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, padding: '4px 6px 4px 10px', backgroundColor: theme.palette.background.paper, cursor: 'pointer' }}>
                  <Checkbox
                    size="small"
                    checked={
                      filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').length > 0 &&
                      filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').every(v => selectedIds.has(getViolationKey(v)))
                    }
                    indeterminate={
                      selectedIds.size > 0 &&
                      !filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').every(v => selectedIds.has(getViolationKey(v)))
                    }
                    onChange={handleSelectAll}
                    color="primary"
                    style={{ padding: 0 }}
                  />
                  <ArrowDropDownIcon
                    style={{ fontSize: 18, color: theme.palette.text.secondary, cursor: 'pointer', marginLeft: 2 }}
                    onClick={(e) => setSelectMenuAnchor((e.currentTarget.parentElement ?? e.currentTarget) as HTMLElement)}
                  />
                </Box>
                <Menu
                  anchorEl={selectMenuAnchor}
                  open={Boolean(selectMenuAnchor)}
                  onClose={() => setSelectMenuAnchor(null)}
                  getContentAnchorEl={null}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{ style: { minWidth: 260, padding: '4px 0' } }}
                >
                  <Box style={{ padding: '4px 16px 8px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Select by fix type
                    </Typography>
                  </Box>
                  <MenuItem onClick={() => selectByPredicate(v => v.fixTier !== 'manual')}>
                    <ListItemText
                      primary={<span style={{ fontSize: 13 }}>All fixable violations ({filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').length})</span>}
                      secondary={<span style={{ fontSize: 11 }}>Includes both automated and AI-assisted fixes</span>}
                    />
                  </MenuItem>
                  <MenuItem onClick={() => selectByPredicate(v => v.fixTier === 'deterministic')}>
                    <ListItemText
                      primary={<span style={{ fontSize: 13 }}>Automated fixes only ({filteredViolations.filter(v => v.fixTier === 'deterministic' && getStatus(v) === 'open').length})</span>}
                      secondary={<span style={{ fontSize: 11 }}>Safe, deterministic transformations</span>}
                    />
                  </MenuItem>
                  <MenuItem onClick={() => selectByPredicate(v => v.fixTier === 'ai')}>
                    <ListItemText
                      primary={<span style={{ fontSize: 13 }}>AI-assisted fixes only ({filteredViolations.filter(v => v.fixTier === 'ai' && getStatus(v) === 'open').length})</span>}
                      secondary={<span style={{ fontSize: 11 }}>Requires review before applying</span>}
                    />
                  </MenuItem>
                  <Box style={{ padding: '8px 16px 4px', borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, marginTop: 4 }}>
                    <Typography style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Select by severity
                    </Typography>
                  </Box>
                  {(['critical', 'high', 'medium', 'low'] as SeverityClass[]).map(sev => {
                    const count = filteredViolations.filter(v => v.severity === sev && v.fixTier !== 'manual' && getStatus(v) === 'open').length;
                    if (!count) return null;
                    return (
                      <MenuItem key={sev} onClick={() => selectByPredicate(v => v.severity === sev && v.fixTier !== 'manual')}>
                        <ListItemText
                          primary={
                            <span style={{ fontSize: 13 }}>
                              <strong style={{ color: SEVERITY_COLORS[sev], textTransform: 'capitalize' }}>{sev}</strong> — {count} fixable
                            </span>
                          }
                        />
                      </MenuItem>
                    );
                  })}
                  <Divider style={{ margin: '4px 0' }} />
                  <MenuItem onClick={() => { setSelectedIds(new Set()); setSelectMenuAnchor(null); }}>
                    <ListItemText primary={<span style={{ fontSize: 13 }}>Clear selection</span>} />
                  </MenuItem>
                </Menu>
                <Button variant="contained" color="primary" size="small"
                  disabled={selectedIds.size === 0}
                  onClick={handleRemediateClick}
                  style={{ textTransform: 'none', fontSize: 13, fontWeight: 500, padding: '5px 16px' }}>
                  Suggest fixes{selectedIds.size > 0 ? ` for ${selectedIds.size} violation${selectedIds.size !== 1 ? 's' : ''}` : ''}
                </Button>
                {selectedIds.size > 0 && (
                  <>
                    <Typography style={{ fontSize: 12, color: theme.palette.text.secondary }}>
                      {selectedAutoFixCount > 0 && `${selectedAutoFixCount} auto-fixable`}
                      {selectedAutoFixCount > 0 && selectedAiCount > 0 && ' · '}
                      {selectedAiCount > 0 && `${selectedAiCount} AI-fixable`}
                    </Typography>
                    <Button size="small" variant="text"
                      onClick={() => setSelectedIds(new Set())}
                      style={{ textTransform: 'none', fontSize: 12, color: theme.palette.text.secondary, padding: '5px 10px', minWidth: 0 }}>
                      Clear
                    </Button>
                  </>
                )}
              </Box>
              {ruleFilter && (
                <Chip
                  size="small"
                  label={(() => {
                    const matchingRule = quality.violations.find(v => v.ruleId === ruleFilter);
                    return matchingRule ? matchingRule.message : ruleFilter;
                  })()}
                  onDelete={() => setRuleFilter(null)}
                  style={{ fontSize: 11, height: 24, maxWidth: 360 }}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}

          {/* Summary + quick filters — full breakdown in step 1, focused summary in step 2+ */}
          {isStep1 ? (
            <Box style={{ marginBottom: 16 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 8 }}>
                <Box display="flex" alignItems="center" style={{ gap: 10 }}>
                  <Typography style={{ fontSize: 13 }}>
                    <strong>{scan.totalViolations}</strong> violations
                  </Typography>
                  <span style={{ color: theme.palette.divider, fontSize: 13 }}>|</span>
                  {(['critical', 'high', 'medium', 'low', 'info'] as SeverityClass[]).map(sev => {
                    const count = scan.severityBreakdown[sev];
                    if (!count) return null;
                    const isActive = severityFilters.has(sev);
                    const anyActive = severityFilters.size > 0;
                    const sevTips: Record<SeverityClass, string> = {
                      critical: 'Critical — Must fix before deployment',
                      high: 'High — Should fix soon',
                      medium: 'Medium — Recommended improvement',
                      low: 'Low — Optional enhancement',
                      info: 'Info — No action required',
                    };
                    return (
                      <DarkTooltip key={sev} title={`${sevTips[sev]}. Click to ${isActive ? 'remove' : 'add'} filter. (${count})`} arrow enterDelay={200}>
                        <span
                          onClick={() => toggleSeverityFilter(sev)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer',
                            padding: '2px 8px', borderRadius: 10,
                            backgroundColor: isActive ? `${SEVERITY_COLORS[sev]}18` : 'transparent',
                            border: isActive ? `1px solid ${SEVERITY_COLORS[sev]}40` : '1px solid transparent',
                            opacity: anyActive && !isActive ? 0.4 : 1, transition: 'all 0.15s ease',
                          }}
                        >
                          <strong style={{ color: SEVERITY_COLORS[sev] }}>{count}</strong>
                          <span style={{ textTransform: 'capitalize' }}>{sev}</span>
                          {isActive && <CloseIcon style={{ fontSize: 12, color: SEVERITY_COLORS[sev], marginLeft: 2 }} />}
                        </span>
                      </DarkTooltip>
                    );
                  })}
                </Box>
                <Box display="flex" alignItems="center" style={{ gap: 10 }}>
                  {([
                    { tier: 'deterministic' as FixTierFilter, label: 'Auto-fix', color: '#2e7d32', tip: TIER_TOOLTIPS.deterministic },
                    { tier: 'ai' as FixTierFilter, label: 'AI-assisted', color: '#6a1b9a', tip: TIER_TOOLTIPS.ai },
                    { tier: 'manual' as FixTierFilter, label: 'Manual', color: '#6a6e73', tip: TIER_TOOLTIPS.manual },
                  ]).map(({ tier, label, color, tip }) => {
                    const count = quality.violations.filter(v => v.fixTier === tier).length;
                    if (!count) return null;
                    const isActive = fixFilters.has(tier);
                    const anyActive = fixFilters.size > 0;
                    return (
                      <DarkTooltip key={tier} title={`${tip} Click to ${isActive ? 'remove' : 'add'} filter. (${count})`} arrow enterDelay={200}>
                        <span
                          onClick={() => toggleFixFilter(tier)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer',
                            padding: '2px 8px', borderRadius: 10,
                            backgroundColor: isActive ? `${color}18` : 'transparent',
                            border: isActive ? `1px solid ${color}40` : '1px solid transparent',
                            opacity: anyActive && !isActive ? 0.4 : 1, transition: 'all 0.15s ease',
                          }}
                        >
                          <strong style={{ color }}>{count}</strong>
                          <span>{label}</span>
                          {isActive && <CloseIcon style={{ fontSize: 12, color, marginLeft: 2 }} />}
                        </span>
                      </DarkTooltip>
                    );
                  })}
                </Box>
              </Box>
              <SeverityProgressBar breakdown={scan.severityBreakdown} />
              {(severityFilters.size > 0 || fixFilters.size > 0 || categoryFilter !== 'all') && (
                <Box display="flex" alignItems="center" style={{ marginTop: 8, gap: 8 }}>
                  <Typography style={{ fontSize: 12, color: theme.palette.text.secondary }}>
                    Showing {filteredViolations.length} of {scan.totalViolations} violations
                  </Typography>
                  {categoryFilter !== 'all' && (
                    <Chip size="small" label={categoryFilter === 'all' ? 'All' : APME_CATEGORY_LABEL[categoryFilter]}
                      onDelete={() => setCategoryFilter('all')}
                      style={{ height: 20, fontSize: 11, fontWeight: 600 }} />
                  )}
                  <span
                    onClick={() => { setSeverityFilters(new Set()); setFixFilters(new Set()); setCategoryFilter('all'); }}
                    style={{ fontSize: 12, color: theme.palette.primary.main, cursor: 'pointer' }}
                  >
                    Clear filters
                  </span>
                </Box>
              )}
            </Box>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <Typography style={{ fontSize: 13, color: theme.palette.text.secondary }}>
                Reviewing <strong style={{ color: theme.palette.text.primary }}>{remediatedTotal}</strong> of {scan.totalViolations} violations
                {remainingCount > 0 && <> · {remainingCount} remaining</>}
              </Typography>
            </Box>
          )}

          {/* Violations table */}
          {pageState !== 'in-progress' && pageState !== 'creating-pr' && (
            <Box style={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 6, overflow: 'hidden' }}>
              <table className={classes.violationsTable}>
                <thead>
                  <tr>
                    {showCheckboxes && (
                      <th className={classes.colCheckbox}>
                        <Checkbox
                          size="small"
                          checked={
                            filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').length > 0 &&
                            filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').every(v => selectedIds.has(getViolationKey(v)))
                          }
                          indeterminate={
                            selectedIds.size > 0 &&
                            !filteredViolations.filter(v => v.fixTier !== 'manual' && getStatus(v) === 'open').every(v => selectedIds.has(getViolationKey(v)))
                          }
                          onChange={handleSelectAll}
                          color="primary"
                          style={{ padding: 0 }}
                        />
                      </th>
                    )}
                    <th className={classes.colExpand} />
                    <th className={classes.colSeverity} onClick={() => handleSort('severity')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Severity
                      {sortColumn === 'severity' && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>{sortAsc ? '▲' : '▼'}</span>}
                    </th>
                    <th className={classes.colFix} onClick={() => handleSort('fix')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      {isStep1 ? 'Fix method' : 'Status'}
                      {sortColumn === 'fix' && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>{sortAsc ? '▲' : '▼'}</span>}
                    </th>
                    <th className={classes.colDescription} onClick={() => handleSort('rule')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Rule & Description
                      {sortColumn === 'rule' && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>{sortAsc ? '▲' : '▼'}</span>}
                    </th>
                    <th className={classes.colFile} onClick={() => handleSort('file')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      File
                      {sortColumn === 'file' && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>{sortAsc ? '▲' : '▼'}</span>}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredViolations.map((v, i) => {
                    const key = getViolationKey(v);
                    const status = getStatus(v);
                    const isSelectable = showCheckboxes && v.fixTier !== 'manual' && status === 'open';
                    const isProposed = status === 'proposed';
                    const isExpanded = expandedIds.has(key);
                    const proposal = DEMO_PROPOSALS[v.ruleId];
                    const isSelected = selectedIds.has(key);
                    const showDiff = !isStep1 && proposal && status !== 'open' && status !== 'declined';
                    const showCodeSnippet = isStep1 || !showDiff;

                    const rowClasses = [
                      isSelected ? classes.rowSelected : '',
                      status === 'fixed' || status === 'approved' ? classes.rowDone : '',
                      status === 'declined' ? classes.rowDeclined : '',
                      status === 'in-pr' ? classes.rowInPr : '',
                      status === 'resolved' ? classes.rowResolved : '',
                      isExpanded ? classes.rowExpanded : '',
                    ].filter(Boolean).join(' ');

                    const sevStyle = FILLED_SEVERITY[v.severity] || FILLED_SEVERITY.info;
                    const codeCtx = DEMO_CODE_CONTEXT[v.ruleId];
                    return [
                      <tr key={`${v.ruleId}-${v.lineStart}-${i}`} className={rowClasses}>
                        {showCheckboxes && (
                          <td className={classes.colCheckbox} onClick={e => e.stopPropagation()}>
                            <Checkbox size="small" checked={isSelected} color="primary" style={{ padding: 0 }}
                              disabled={!isSelectable}
                              onChange={() => setSelectedIds(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })} />
                          </td>
                        )}
                        <td className={classes.colExpand} onClick={() => toggleExpanded(key)}>
                          <IconButton size="small" className={classes.expandButton} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                            <ChevronRightIcon className={`${classes.chevron} ${isExpanded ? classes.chevronOpen : ''}`} />
                          </IconButton>
                        </td>
                        <td className={classes.colSeverity}>
                          <DarkTooltip title={{
                            critical: 'Critical — Must fix before deployment',
                            high: 'High — Should fix soon',
                            medium: 'Medium — Recommended improvement',
                            low: 'Low — Optional enhancement',
                            info: 'Info — No action required',
                          }[v.severity] ?? ''} arrow enterDelay={200}>
                            <span className={classes.severityChip} style={{ backgroundColor: sevStyle.bg, color: sevStyle.color }}>
                              {v.severity}
                            </span>
                          </DarkTooltip>
                        </td>
                        <td className={classes.colFix}>
                          <FixChipStyled
                            mode={isStep1 ? 'tier' : 'status'}
                            method={v.fixTier}
                            status={status}
                            category={v.category}
                            classes={classes}
                          />
                        </td>
                        <td className={classes.colDescription} onClick={() => toggleExpanded(key)} style={{ cursor: 'pointer' }}>
                          <span className={classes.ruleId}>{v.ruleId}</span>
                          <span className={`${classes.description} ${status === 'resolved' ? classes.descriptionResolved : ''}`}>
                            {v.message}
                          </span>
                        </td>
                        <td className={classes.colFile}>
                          <a className={classes.fileLink}
                            href="#"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`${repoUrl}/blob/${branch ?? 'main'}/${v.file}#L${v.lineStart}`, '_blank'); }}>
                            {v.file.split('/').pop()}:{v.lineStart}
                            <OpenInNewIcon style={{ fontSize: 11, marginLeft: 3, verticalAlign: 'middle', opacity: 0.6 }} />
                          </a>
                        </td>
                      </tr>,
                      isExpanded ? (
                        <tr key={`${v.ruleId}-${v.lineStart}-${i}-detail`}>
                          <td colSpan={showCheckboxes ? 6 : 5} style={{ padding: 0 }}>
                            <Collapse in={true}>
                              {showDiff ? (
                                <Box className={classes.proposalPreview}>
                                  <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                    <Typography className={classes.proposalTitle}>{proposal.desc}</Typography>
                                    {proposal.tier === 'ai' && isProposed && (
                                      <Chip size="small" label={`${Math.round((DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) * 100)}% confidence`}
                                        style={{ fontSize: 10, height: 18,
                                          backgroundColor: (DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) >= 0.9
                                            ? (isDark ? 'rgba(91,163,82,0.15)' : '#e7f5e7')
                                            : (isDark ? 'rgba(240,171,0,0.15)' : '#fdf2e5'),
                                          color: (DEMO_PROPOSALS_CONFIDENCE[v.ruleId] ?? 0.85) >= 0.9
                                            ? (isDark ? '#8bc986' : '#1e4620')
                                            : (isDark ? '#f0d080' : '#6b3a00') }} />
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
                                      <Box className={classes.diffPanelHeaderAdded}>
                                        {status === 'fixed' || status === 'approved' || status === 'in-pr' || status === 'resolved' ? 'After (applied)' : 'After (proposed)'}
                                      </Box>
                                      <Box className={classes.diffCodeAdded}>
                                        {proposal.added.map((line, li) => <Box key={li}>{line}</Box>)}
                                      </Box>
                                    </Box>
                                  </Box>
                                  {isProposed && pageState === 'proposals-ready' && (
                                    <Box className={classes.proposalActions}>
                                      <Typography style={{ fontSize: 11, color: isDark ? '#c4b5e3' : '#6753ac', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span className={classes.fixChipIcon}>✦</span>
                                        AI-generated suggestion
                                      </Typography>
                                      <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                                        <Button size="small" variant="outlined" onClick={() => handleDecline(key)}
                                          style={{ textTransform: 'none', fontSize: 12, padding: '4px 12px' }}>Decline</Button>
                                        <Button size="small" variant="contained" onClick={() => handleApprove(key)} className={classes.btnApprove}>
                                          Accept
                                        </Button>
                                      </Box>
                                    </Box>
                                  )}
                                  <Box className={classes.detailMeta}>
                                    <span className={classes.detailMetaItem}>Validator: <strong>{v.validatorSource}</strong></span>
                                    <span className={classes.detailMetaItem}>Scope: <strong>{v.scope}</strong></span>
                                    <span className={classes.detailMetaItem}>Category: <strong>{CATEGORY_LABELS[v.category]}</strong></span>
                                  </Box>
                                </Box>
                              ) : showCodeSnippet ? (
                                <Box style={{ padding: '12px 16px 16px 48px' }}>
                                  <Typography style={{ fontSize: 12, color: theme.palette.text.primary, marginBottom: 8, lineHeight: 1.5 }}>
                                    {codeCtx?.detail || v.ruleDescription}
                                  </Typography>
                                  {codeCtx && (
                                    <Box className={classes.codeContext}>
                                      {codeCtx.lines.map((line, li) => (
                                        <Box key={li} className={`${classes.codeLine} ${line.highlighted ? classes.codeLineError : ''}`}>
                                          <span className={classes.codeLineNum}>{line.num}</span>
                                          <span className={classes.codeLineText}>{line.text}</span>
                                        </Box>
                                      ))}
                                    </Box>
                                  )}
                                  <Box className={classes.detailMeta}>
                                    <span className={classes.detailMetaItem}>Validator: <strong>{v.validatorSource}</strong></span>
                                    <span className={classes.detailMetaItem}>Scope: <strong>{v.scope}</strong></span>
                                    <span className={classes.detailMetaItem}>Category: <strong>{CATEGORY_LABELS[v.category]}</strong></span>
                                  </Box>
                                </Box>
                              ) : null}
                            </Collapse>
                          </td>
                        </tr>
                      ) : null,
                    ];
                  })}
                </tbody>
              </table>
            </Box>
          )}

          <ConfirmRemediationDialog
            open={showConfirm}
            autoFixCount={selectedAutoFixCount}
            aiCount={selectedAiCount}
            onConfirm={handleConfirmRemediate}
            onCancel={() => setShowConfirm(false)}
            classes={classes}
          />
        </>
      )}
    </Box>
  );
};
