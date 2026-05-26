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
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
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
// ---------------------------------------------------------------------------
// Proposal Review List — inline approval of individual fix proposals
// ---------------------------------------------------------------------------
const DEMO_PROPOSALS = [
  { id: 'p1', rule: 'aap-removed-config', file: 'ansible.cfg:3', tier: 'deterministic' as const, desc: 'Rename callback_whitelist → callbacks_enabled' },
  { id: 'p2', rule: 'aap-deprecated-module', file: 'tasks/patch-apply.yml:14', tier: 'deterministic' as const, desc: 'Replace ansible.builtin.yum → ansible.builtin.dnf' },
  { id: 'p3', rule: 'aap-deprecated-syntax', file: 'tasks/main.yml:22', tier: 'deterministic' as const, desc: 'Replace with_items → loop' },
  { id: 'p4', rule: 'aap-removed-param', file: 'tasks/pre-check.yml:8', tier: 'deterministic' as const, desc: 'Remove deprecated warn parameter' },
  { id: 'p5', rule: 'aap-collection-update', file: 'collections/requirements.yml:6', tier: 'deterministic' as const, desc: 'Update community.general 7.5.0 → 8.0.0' },
  { id: 'p6', rule: 'fqcn[action-core]', file: 'tasks/main.yml:12', tier: 'deterministic' as const, desc: 'Use FQCN ansible.builtin.copy' },
  { id: 'p7', rule: 'yaml[truthy]', file: 'defaults/main.yml:8', tier: 'deterministic' as const, desc: 'Replace yes/no → true/false' },
  { id: 'p8', rule: 'risky-file-permissions', file: 'tasks/patch-apply.yml:34', tier: 'ai' as const, desc: 'Add mode: "0644" to file module' },
  { id: 'p9', rule: 'no-changed-when', file: 'tasks/pre-check.yml:22', tier: 'ai' as const, desc: 'Add changed_when condition to command task' },
  { id: 'p10', rule: 'name[missing]', file: 'tasks/rollback.yml:5', tier: 'deterministic' as const, desc: 'Add descriptive task name' },
];

const ProposalReviewList = ({
  fixableCount, autoFixed, aiProposed, onCreatePr,
}: {
  fixableCount: number; autoFixed: number; aiProposed: number;
  onCreatePr: () => void;
}) => {
  const proposals = DEMO_PROPOSALS.slice(0, fixableCount);
  const [approved, setApproved] = useState<Set<string>>(() => new Set(proposals.map(p => p.id)));
  const [declined, setDeclined] = useState<Set<string>>(new Set());

  const toggleApproval = (id: string) => {
    setApproved(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setDeclined(d => new Set(d).add(id));
      } else {
        next.add(id);
        setDeclined(d => { const n = new Set(d); n.delete(id); return n; });
      }
      return next;
    });
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 8 }}>
        <Typography style={{ fontSize: 12, color: '#666' }}>
          {approved.size} of {proposals.length} proposals approved
        </Typography>
        <Button
          size="small" variant="contained" color="primary"
          disabled={approved.size === 0}
          onClick={onCreatePr}
          style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
        >
          Create pull request ({approved.size} fixes)
        </Button>
      </Box>
      {proposals.map(p => {
        const isApproved = approved.has(p.id);
        const isDeclined = declined.has(p.id);
        return (
          <Box
            key={p.id}
            display="flex" alignItems="center"
            style={{
              gap: 8, padding: '6px 0',
              borderTop: '1px solid rgba(0,0,0,0.04)',
              opacity: isDeclined ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <Tooltip title={isApproved ? 'Click to decline' : 'Click to approve'} arrow>
              <IconButton
                size="small"
                onClick={() => toggleApproval(p.id)}
                style={{ padding: 2 }}
              >
                {isApproved ? (
                  <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                ) : (
                  <Box style={{ width: 16, height: 16, borderRadius: 8, border: '1.5px solid #ccc' }} />
                )}
              </IconButton>
            </Tooltip>
            <Chip
              size="small"
              label={p.tier === 'deterministic' ? 'Auto' : 'AI'}
              style={{
                fontSize: 9, height: 16, fontWeight: 600,
                backgroundColor: p.tier === 'deterministic' ? `${statusColors.success}15` : `${statusColors.info}15`,
                color: p.tier === 'deterministic' ? statusColors.success : statusColors.info,
              }}
            />
            <Typography style={{ fontSize: 12, color: '#333', flex: 1 }} noWrap>
              {p.desc}
            </Typography>
            <Typography style={{ fontSize: 10, fontFamily: 'monospace', color: '#999' }}>
              {p.file}
            </Typography>
            <Chip size="small" label={p.rule} variant="outlined" style={{
              fontSize: 9, height: 16, fontFamily: 'monospace', borderColor: 'rgba(0,0,0,0.12)',
            }} />
          </Box>
        );
      })}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Unified Remediation Banner — single strip for all remediation states
// ---------------------------------------------------------------------------
type BannerState = 'fixable' | RemediationStatus;

const BANNER_CONFIG: Record<BannerState, {
  label: string | ((fixable: number) => string);
  color: string;
  icon: 'build' | 'spinning' | 'check' | 'none';
  description: string | ((s?: ProjectQualityData['remediationSummary']) => string);
} | null> = {
  none: null,
  fixable: {
    label: (f) => `${f} violations can be auto-fixed`,
    color: statusColors.info,
    icon: 'build',
    description: 'APME can generate fixes for you to review and approve before creating a pull request.',
  },
  available: {
    label: (f) => `${f} violations can be auto-fixed`,
    color: statusColors.info,
    icon: 'build',
    description: 'APME can generate fixes for you to review and approve before creating a pull request.',
  },
  'in-progress': {
    label: 'Generating fixes',
    color: statusColors.info,
    icon: 'spinning',
    description: 'APME is analyzing violations and generating fix proposals. You will review each proposal before anything is committed.',
  },
  'proposals-ready': {
    label: 'Review proposed fixes',
    color: '#8a6d00',
    icon: 'none',
    description: (s) => s
      ? `${s.addressed} fix proposals generated for ${s.addressed + s.remaining} violations. Approve the ones you want, then create a pull request.`
      : 'Fix proposals are ready for your review. Approve the ones you want, then create a pull request.',
  },
  'pr-open': {
    label: 'Pull request open',
    color: '#8a6d00',
    icon: 'none',
    description: (s) => s
      ? `${s.addressed} fixes applied. Review in Dev Spaces or merge when satisfied.`
      : 'A pull request with approved fixes is open for review.',
  },
  'pr-merged': {
    label: 'Fixes merged',
    color: statusColors.success,
    icon: 'check',
    description: (s) => s
      ? `${s.addressed} violations fixed. ${s.remaining > 0 ? `${s.remaining} remaining require manual attention.` : 'All fixable violations resolved.'}`
      : 'Fixes have been merged.',
  },
};

const RemediationBanner = ({
  bannerState, fixableCount, quality, repoUrl, onStateChange, totalViolations,
}: {
  bannerState: BannerState;
  fixableCount: number;
  quality: ProjectQualityData;
  repoUrl?: string;
  onStateChange?: (state: RemediationStatus) => void;
  totalViolations: number;
}) => {
  const { hasRole } = useUserRoleContext();
  const config = BANNER_CONFIG[bannerState];
  if (!config) return null;

  const label = typeof config.label === 'function' ? config.label(fixableCount) : config.label;
  const description = typeof config.description === 'function' ? config.description(quality.remediationSummary) : config.description;
  const isDeveloper = hasRole('developer');
  const showFixButton = (bannerState === 'fixable' || bannerState === 'available') && isDeveloper;
  const showDevSpaces = (bannerState === 'pr-open') && isDevSpacesConnected && isDeveloper;
  const showPrLink = bannerState === 'pr-open' && quality.remediationPrUrl;
  const showResults = ['proposals-ready', 'pr-open', 'pr-merged'].includes(bannerState as string) && quality.remediationSummary;
  const showProposals = bannerState === 'proposals-ready' && isDeveloper;

  const handleFixClick = () => {
    if (!onStateChange) return;
    onStateChange('in-progress');
    setTimeout(() => onStateChange('proposals-ready'), 3000);
  };

  // Progress steps for in-progress state
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    'Analyzing violations…',
    `Running deterministic fixes (${Math.ceil(fixableCount * 0.7)} rules)…`,
    `Running AI-assisted fixes (${Math.floor(fixableCount * 0.3)} candidates)…`,
    'Committing changes to branch…',
  ];

  useState(() => {
    if (bannerState !== 'in-progress') return;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 8 + Math.random() * 12, 100);
        if (next > 25 && currentStep < 1) setCurrentStep(1);
        if (next > 55 && currentStep < 2) setCurrentStep(2);
        if (next > 85 && currentStep < 3) setCurrentStep(3);
        return next;
      });
    }, 400);
    return () => clearInterval(interval);
  });

  return (
    <Card variant="outlined" style={{
      borderRadius: 12, marginBottom: 20,
      borderColor: `${config.color}30`, borderWidth: 1,
      backgroundColor: `${config.color}06`,
    }}>
      <CardContent style={{ padding: '14px 20px' }}>
        {/* Header row */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box display="flex" alignItems="flex-start" style={{ gap: 10, flex: 1, minWidth: 0 }}>
            {config.icon === 'build' && (
              <BuildIcon style={{ fontSize: 18, color: config.color, marginTop: 2, flexShrink: 0 }} />
            )}
            {config.icon === 'spinning' && (
              <AutorenewIcon style={{
                fontSize: 18, color: config.color, marginTop: 2, flexShrink: 0,
                animation: 'spin 1.5s linear infinite',
              }} />
            )}
            {config.icon === 'check' && (
              <CheckCircleIcon style={{ fontSize: 18, color: config.color, marginTop: 2, flexShrink: 0 }} />
            )}
            <Box>
              <Typography style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                {label}
              </Typography>
              <Typography style={{ fontSize: 12, color: '#666', marginTop: 2, lineHeight: 1.5 }}>
                {description}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" style={{ gap: 8, flexShrink: 0, marginLeft: 16 }}>
            {showFixButton && (
              <Button
                variant="outlined" size="small"
                startIcon={<BuildIcon style={{ fontSize: 14 }} />}
                onClick={handleFixClick}
                style={{ textTransform: 'none', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}
              >
                Fix violations
              </Button>
            )}
            {showDevSpaces && (
              <Button
                size="small" variant="outlined"
                startIcon={<CodeIcon style={{ fontSize: 14 }} />}
                onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${quality.remediationBranch ?? 'main'}`, '_blank')}
                style={{ textTransform: 'none', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}
              >
                Review in Dev Spaces
              </Button>
            )}
            {showPrLink && (
              <Button
                size="small" variant="contained" color="primary"
                startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                onClick={() => window.open(quality.remediationPrUrl, '_blank')}
                style={{ textTransform: 'none', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}
              >
                View pull request
              </Button>
            )}
          </Box>
        </Box>

        {/* Progress steps — inline in banner during in-progress */}
        {bannerState === 'in-progress' && (
          <Box style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Box style={{
              height: 4, borderRadius: 2, backgroundColor: '#eee', overflow: 'hidden', marginBottom: 12,
            }}>
              <Box style={{
                height: '100%', borderRadius: 2,
                backgroundColor: statusColors.info,
                width: `${Math.min(progress, 95)}%`,
                transition: 'width 0.4s ease',
              }} />
            </Box>
            {steps.map((step, i) => (
              <Box key={i} display="flex" alignItems="center" style={{ gap: 8, padding: '2px 0' }}>
                {i < currentStep ? (
                  <CheckCircleIcon style={{ fontSize: 14, color: statusColors.success }} />
                ) : i === currentStep ? (
                  <AutorenewIcon style={{ fontSize: 14, color: statusColors.info, animation: 'spin 1.5s linear infinite' }} />
                ) : (
                  <Box style={{ width: 14, height: 14, borderRadius: 7, border: '1.5px solid #ddd' }} />
                )}
                <Typography style={{
                  fontSize: 12, color: i <= currentStep ? '#333' : '#bbb',
                  fontWeight: i === currentStep ? 500 : 400,
                }}>
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Results summary — inline in banner after remediation */}
        {showResults && quality.remediationSummary && (
          <Box style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Box display="flex" alignItems="center" style={{ gap: 24 }}>
              <Box display="flex" alignItems="baseline" style={{ gap: 4 }}>
                <Typography style={{ fontSize: 18, fontWeight: 700 }}>{totalViolations}</Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>violations</Typography>
              </Box>
              <Box display="flex" alignItems="baseline" style={{ gap: 4 }}>
                <Typography style={{ fontSize: 18, fontWeight: 700, color: statusColors.success }}>{quality.remediationSummary.addressed}</Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>proposals</Typography>
              </Box>
              <Box display="flex" alignItems="baseline" style={{ gap: 4 }}>
                <Typography style={{ fontSize: 18, fontWeight: 700, color: '#8a6d00' }}>{quality.remediationSummary.remaining}</Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>manual</Typography>
              </Box>
              <Typography style={{ fontSize: 11, color: '#999' }}>
                {quality.remediationSummary.autoFixed} deterministic · {quality.remediationSummary.aiProposed} AI-assisted
              </Typography>
            </Box>
          </Box>
        )}

        {/* Proposal review — approve/decline individual fixes */}
        {showProposals && quality.remediationSummary && (
          <Box style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <ProposalReviewList
              fixableCount={quality.remediationSummary.addressed}
              autoFixed={quality.remediationSummary.autoFixed}
              aiProposed={quality.remediationSummary.aiProposed}
              onCreatePr={() => onStateChange?.('pr-open')}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Violation Row — a single violation entry (grouped under file headers)
// ---------------------------------------------------------------------------
const ViolationRow = ({
  v, repoUrl, branch, isFixing,
}: {
  v: QualityViolation;
  repoUrl?: string; branch?: string;
  isFixing?: boolean;
}) => {
  const { hasRole } = useUserRoleContext();
  const [expanded, setExpanded] = useState(false);

  return (
    <Box style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', opacity: isFixing ? 0.5 : 1, transition: 'opacity 0.2s' }}>
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
        {isFixing ? (
          <Typography style={{ fontSize: 11, color: statusColors.info, fontWeight: 500, fontStyle: 'italic' }}>
            Fixing…
          </Typography>
        ) : v.fixTier !== 'manual' ? (
          <Chip
            size="small"
            label={v.fixTier === 'deterministic' ? 'Auto-fixable' : 'AI-fixable'}
            style={{
              fontSize: 10, height: 18,
              backgroundColor: v.fixTier === 'deterministic' ? `${statusColors.success}15` : `${statusColors.info}15`,
              color: v.fixTier === 'deterministic' ? statusColors.success : statusColors.info,
            }}
          />
        ) : (
          <Typography style={{ fontSize: 11, color: '#999' }}>manual</Typography>
        )}
        <Chip size="small" label={v.ruleId} variant="outlined" style={{
          fontSize: 10, height: 18, fontFamily: 'monospace', borderColor: 'rgba(0,0,0,0.15)',
        }} />
        {repoUrl && isDevSpacesConnected && hasRole('developer') && (
          <Tooltip title={`Open ${v.file}:${v.lineStart} in Dev Spaces`} arrow>
            <IconButton
              size="small"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                window.open(`${DEVSPACES_BASE_URL}#${repoUrl}/tree/${branch ?? 'main'}/${v.file}?line=${v.lineStart}`, '_blank');
              }}
              style={{ padding: 4, borderRadius: 4, transition: 'background-color 0.15s' }}
            >
              <CodeIcon style={{ fontSize: 16, color: '#999' }} />
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
  isRemediating,
}: {
  violations: QualityViolation[];
  categoryFilter: ViolationCategory | 'all';
  setCategoryFilter: (f: ViolationCategory | 'all') => void;
  severityFilter?: SeverityClass | null;
  repoUrl?: string;
  branch?: string;
  isRemediating?: boolean;
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
            <Box display="flex" alignItems="center" style={{ gap: 12 }}>
              <Typography style={{ fontSize: 11, color: '#999' }}>
                {fileViolations.length} issue{fileViolations.length !== 1 ? 's' : ''}
                {fileViolations.filter(v => v.fixTier !== 'manual').length > 0 &&
                  ` · ${fileViolations.filter(v => v.fixTier !== 'manual').length} fixable`}
              </Typography>
              {repoUrl && isDevSpacesConnected && (
                <Typography style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  IDE
                </Typography>
              )}
            </Box>
          </Box>
          {fileViolations.map((v, i) => (
            <ViolationRow
              key={`${v.ruleId}-${v.lineStart}-${i}`}
              v={v}
              repoUrl={repoUrl}
              branch={branch}
              isFixing={isRemediating && v.fixTier !== 'manual'}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

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
  const [categoryFilter, setCategoryFilter] = useState<ViolationCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityClass | null>(initialSeverity ?? null);
  const [demoRemediationState, setDemoRemediationState] = useState<RemediationStatus | null>(null);

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
        remediationBranch: demoRemediationState !== 'none' && demoRemediationState !== 'available'
          ? `apme/remediate-demo` : undefined,
        remediationPrUrl: demoRemediationState === 'pr-open' || demoRemediationState === 'pr-merged'
          ? `https://github.com/acme-corp/${projectName}/pull/99` : undefined,
        remediationSummary: ['in-progress', 'proposals-ready', 'pr-open', 'pr-merged'].includes(demoRemediationState)
          ? { addressed: fixableCount, remaining: manualCount, autoFixed: Math.ceil(fixableCount * 0.7), aiProposed: Math.floor(fixableCount * 0.3) }
          : undefined,
      }
    : quality;

  return (
    <Box style={{ marginTop: 24 }}>
      {/* Demo state toggle */}
      <DemoStateToolbar
        currentState={activeRemStatus}
        onStateChange={setDemoRemediationState}
      />

      {/* Scan context bar */}
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 20 }}>
        <Typography style={{ fontSize: 13, color: '#666' }}>
          Last scan {quality.lastScannedAt} · commit <code style={{ fontSize: 11 }}>{quality.lastScannedCommit?.slice(0, 7)}</code>
          {scan.trigger && ` · ${TRIGGER_LABELS[scan.trigger] ?? scan.trigger}`}
        </Typography>
        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
          {isDevSpacesConnected && hasRole('developer') && quality.violations.length > 0 && (
            <Button
              size="small" variant="outlined"
              startIcon={<CodeIcon style={{ fontSize: 16 }} />}
              onClick={() => window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${branch ?? 'main'}`, '_blank')}
              style={{ textTransform: 'none', fontSize: 12, fontWeight: 600 }}
            >
              Review in Dev Spaces
            </Button>
          )}
          {hasRole('developer') && (
            <Button
              size="small" variant="outlined"
              startIcon={<AutorenewIcon style={{ fontSize: 14 }} />}
              disabled={activeRemStatus === 'in-progress'}
              onClick={() => {
                setDemoRemediationState('none');
              }}
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

      {/* Remediation banner — unified for all states */}
      {(() => {
        const bannerState: BannerState = activeRemStatus === 'none' && fixableCount > 0
          ? 'fixable'
          : activeRemStatus;
        return bannerState !== 'none' ? (
          <RemediationBanner
            bannerState={bannerState}
            fixableCount={fixableCount}
            quality={demoQuality}
            repoUrl={repoUrl}
            onStateChange={setDemoRemediationState}
            totalViolations={scan.totalViolations}
          />
        ) : null;
      })()}

      {/* Violations content */}
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
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          {/* Summary header */}
          <Box style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" style={{ gap: 16 }}>
                {['proposals-ready', 'pr-open', 'pr-merged'].includes(activeRemStatus) && demoQuality.remediationSummary ? (
                  <>
                    <Typography style={{ fontSize: 28, fontWeight: 700, color: '#8a6d00' }}>
                      {demoQuality.remediationSummary.remaining}
                    </Typography>
                    <Box>
                      <Typography style={{ fontSize: 14, fontWeight: 500 }}>
                        Remaining violations
                      </Typography>
                      <Typography style={{ fontSize: 12, color: '#666' }}>
                        Require manual review
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </Box>
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
              violations={
                ['proposals-ready', 'pr-open', 'pr-merged'].includes(activeRemStatus)
                  ? quality.violations.filter(v => v.fixTier === 'manual')
                  : quality.violations
              }
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              severityFilter={severityFilter}
              repoUrl={repoUrl}
              branch={branch}
              isRemediating={activeRemStatus === 'in-progress'}
            />
          )}
        </Card>
      )}

    </Box>
  );
};
