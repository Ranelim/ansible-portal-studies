import { useState, useCallback, useMemo } from 'react';
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
  Paper,
  LinearProgress,
  Tooltip,
  Collapse,
  IconButton,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import BuildIcon from '@material-ui/icons/Build';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CodeIcon from '@material-ui/icons/Code';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import { statusColors } from '../../common/statusColors';
import {
  type ProjectQualityData,
  type ScanResult,
  type AiProposal,
  type SeverityClass,
  type QualityViolation,
  type ViolationCategory,
  SEVERITY_COLORS,
} from './qualityDemoData';

export type OperationStatus = 'idle' | 'running' | 'awaiting_approval' | 'complete';

// Progress steps for the inline running state
type ProgressStep = { label: string; status: 'done' | 'active' | 'pending' };

// ---------------------------------------------------------------------------
// Severity Bar — matches APME's compact severity breakdown
// ---------------------------------------------------------------------------
const SeverityBar = ({ breakdown }: { breakdown: Record<SeverityClass, number> }) => {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const order: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];

  return (
    <Box display="flex" style={{ gap: 16, flexWrap: 'wrap' }}>
      {order.map(sev => {
        const count = breakdown[sev];
        if (count === 0) return null;
        return (
          <Box key={sev} display="flex" alignItems="center" style={{ gap: 6 }}>
            <Box style={{
              width: 10, height: 10, borderRadius: 2,
              backgroundColor: SEVERITY_COLORS[sev],
            }} />
            <Typography style={{ fontSize: 12, textTransform: 'capitalize', color: '#555' }}>
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
// Stacked severity progress bar (like APME's colored horizontal bar)
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
// Inline Progress — shows pipeline-like steps when Check/Remediate runs
// ---------------------------------------------------------------------------
const InlineProgress = ({ isRemediate }: { isRemediate?: boolean }) => {
  const [activeStep, setActiveStep] = useState(0);
  const steps: ProgressStep[] = isRemediate
    ? [
        { label: 'Cloning repository', status: 'done' },
        { label: 'Formatting files', status: 'active' },
        { label: 'Running Tier 1 remediation', status: 'pending' },
        { label: 'Running AI analysis', status: 'pending' },
      ]
    : [
        { label: 'Cloning repository', status: 'done' },
        { label: 'Scanning content', status: 'active' },
        { label: 'Analyzing violations', status: 'pending' },
      ];

  // Simulate progress
  useState(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 1200);
    return () => clearInterval(timer);
  });

  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24 }}>
      <CardContent style={{ padding: '20px 24px' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
          <Typography style={{ fontSize: 14, fontWeight: 600 }}>
            {isRemediate ? 'Remediating...' : 'Checking...'}
          </Typography>
          <Typography style={{ fontSize: 12, color: '#666' }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          style={{ height: 6, borderRadius: 3, marginBottom: 16 }}
        />
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {steps.map((step, i) => (
            <Box key={i} display="flex" alignItems="center" style={{ gap: 8 }}>
              <Chip
                size="small"
                label={step.label.split(' ')[0].toLowerCase()}
                style={{
                  fontSize: 10, height: 18, fontFamily: 'monospace',
                  backgroundColor: i <= activeStep ? `${statusColors.info}15` : 'rgba(0,0,0,0.04)',
                  color: i <= activeStep ? statusColors.info : '#999',
                }}
              />
              <Typography style={{
                fontSize: 12,
                color: i <= activeStep ? '#333' : '#999',
                fontWeight: i === activeStep ? 500 : 400,
              }}>
                {step.label}{i === activeStep ? '...' : ''}
              </Typography>
              {i < activeStep && (
                <CheckCircleIcon style={{ fontSize: 14, color: statusColors.success }} />
              )}
            </Box>
          ))}
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
            label={v.fixTier === 'deterministic' ? 'Fixed' : 'AI'}
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
// Violations Card — grouped by file (matches APME's violations view)
// ---------------------------------------------------------------------------
const ViolationsCard = ({
  violations,
  categoryFilter,
  setCategoryFilter,
  repoUrl,
  branch,
}: {
  violations: QualityViolation[];
  categoryFilter: ViolationCategory | 'all';
  setCategoryFilter: (f: ViolationCategory | 'all') => void;
  repoUrl?: string;
  branch?: string;
}) => {
  const filtered = useMemo(() =>
    categoryFilter === 'all' ? violations : violations.filter(v => v.category === categoryFilter),
  [violations, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    violations.forEach(v => { counts[v.category] = (counts[v.category] || 0) + 1; });
    return counts;
  }, [violations]);

  // Group by file
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
    <Card variant="outlined" style={{ borderRadius: 12, overflow: 'hidden' }}>
      {/* Filter bar */}
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

      {/* File groups */}
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
                ` · ${fileViolations.filter(v => v.fixTier !== 'manual').length} fixed`}
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
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Proposal Review Panel (AI proposals for review)
// ---------------------------------------------------------------------------
const ProposalCard = ({
  proposal,
  selected,
  onToggle,
}: {
  proposal: AiProposal;
  selected: boolean;
  onToggle: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isDeclined = proposal.status === 'declined';
  const confidencePercent = Math.round(proposal.confidence * 100);

  return (
    <Paper
      variant="outlined"
      style={{
        marginBottom: 8, borderRadius: 8,
        borderColor: selected ? statusColors.info : undefined,
        borderWidth: selected ? 2 : 1,
        opacity: isDeclined ? 0.7 : 1,
      }}
    >
      <Box
        display="flex" alignItems="center"
        style={{ padding: '10px 14px', gap: 10, cursor: isDeclined ? 'default' : 'pointer' }}
        onClick={isDeclined ? undefined : onToggle}
      >
        {!isDeclined && (
          <input type="checkbox" checked={selected} readOnly style={{ accentColor: statusColors.info, width: 16, height: 16 }} />
        )}
        <Box flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <Chip size="small" label={proposal.ruleId} variant="outlined" style={{ fontSize: 11, height: 20, fontFamily: 'monospace' }} />
            <Typography style={{ fontSize: 12, color: '#666' }}>{proposal.file}:{proposal.lineStart}</Typography>
            <Chip size="small" label={`Tier ${proposal.tier}`} variant="outlined" style={{ fontSize: 10, height: 18 }} />
          </Box>
        </Box>
        {!isDeclined && (
          <Tooltip title={`${confidencePercent}% confidence`} arrow>
            <Box style={{ width: 60, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', overflow: 'hidden' }}>
                <Box style={{
                  width: `${confidencePercent}%`, height: '100%', borderRadius: 2,
                  backgroundColor: confidencePercent >= 80 ? statusColors.success : confidencePercent >= 50 ? statusColors.warning : statusColors.error,
                }} />
              </Box>
              <Typography style={{ fontSize: 10, color: '#666', minWidth: 28 }}>{confidencePercent}%</Typography>
            </Box>
          </Tooltip>
        )}
        <Button
          size="small"
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          style={{ textTransform: 'none', fontSize: 11, minWidth: 'auto', padding: '2px 8px' }}
        >
          {expanded ? 'Hide' : isDeclined ? 'Why?' : 'Show'}
        </Button>
      </Box>
      <Collapse in={expanded}>
        <Box style={{ padding: '0 14px 12px', borderTop: '1px solid #eee' }}>
          {proposal.explanation && (
            <Typography style={{ fontSize: 12, color: '#555', marginTop: 8, lineHeight: 1.5 }}>
              {isDeclined ? <><strong>Reason: </strong>{proposal.explanation}</> : proposal.explanation}
            </Typography>
          )}
          {proposal.suggestion && (
            <Typography style={{ fontSize: 12, color: '#555', marginTop: 4, lineHeight: 1.5 }}>
              <strong>Suggestion: </strong>{proposal.suggestion}
            </Typography>
          )}
          {proposal.diffHunk && (
            <Paper variant="outlined" style={{ marginTop: 8, padding: 10, borderRadius: 6, backgroundColor: '#f6f8fa', overflow: 'auto' }}>
              <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: '#24292f', fontFamily: "'Consolas', monospace" }}>
                {proposal.diffHunk.split('\n').map((line, i) => {
                  let color = '#24292f';
                  if (line.startsWith('+') && !line.startsWith('+++')) color = '#1a7f37';
                  if (line.startsWith('-') && !line.startsWith('---')) color = '#cf222e';
                  if (line.startsWith('@@')) color = '#6639ba';
                  return <span key={i} style={{ color, display: 'block' }}>{line}</span>;
                })}
              </pre>
            </Paper>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export const ProposalReviewPanel = ({
  proposals,
  onApprove,
}: {
  proposals: AiProposal[];
  onApprove: (ids: string[]) => void;
}) => {
  const proposed = useMemo(() => proposals.filter(p => p.status !== 'declined'), [proposals]);
  const declined = useMemo(() => proposals.filter(p => p.status === 'declined'), [proposals]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [showDeclined, setShowDeclined] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === proposed.length ? new Set() : new Set(proposed.map(p => p.id)),
    );
  }, [proposed]);

  return (
    <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24 }}>
      <CardContent style={{ padding: 20 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" style={{ marginBottom: 16 }}>
          <Box>
            <Chip size="small" label="AI review" style={{ backgroundColor: '#F0AB0020', color: '#73510D', fontWeight: 600, fontSize: 11, marginBottom: 4 }} />
            <Typography style={{ fontWeight: 600, fontSize: '1.25rem', marginTop: 4 }}>
              {proposed.length} AI proposal{proposed.length !== 1 ? 's' : ''}
            </Typography>
            <Typography style={{ fontSize: 13, color: '#666' }}>Review each proposed change and select which to apply.</Typography>
          </Box>
          <Box display="flex" style={{ gap: 8 }}>
            <Button size="small" variant="outlined" onClick={toggleAll} style={{ textTransform: 'none', fontSize: 12 }}>
              {selected.size === proposed.length ? 'Deselect all' : 'Select all'}
            </Button>
            <Button size="small" onClick={() => onApprove([])} style={{ textTransform: 'none', fontSize: 12 }}>Skip all</Button>
            <Button size="small" variant="contained" color="primary" onClick={() => onApprove(Array.from(selected))} style={{ textTransform: 'none', fontSize: 12 }}>
              Apply {selected.size} selected
            </Button>
          </Box>
        </Box>
        {proposed.map(p => (
          <ProposalCard key={p.id} proposal={p} selected={selected.has(p.id)} onToggle={() => toggleSelect(p.id)} />
        ))}
        {declined.length > 0 && (
          <Box style={{ marginTop: 16 }}>
            <Box display="flex" alignItems="center" style={{ gap: 8, cursor: 'pointer' }} onClick={() => setShowDeclined(v => !v)}>
              {showDeclined ? <ExpandLessIcon style={{ fontSize: 16 }} /> : <ExpandMoreIcon style={{ fontSize: 16 }} />}
              <Chip size="small" label="Declined by AI" style={{ backgroundColor: '#F0AB0020', color: '#73510D', fontSize: 10 }} />
              <Typography style={{ fontSize: 12, color: '#666' }}>
                {declined.length} violation{declined.length !== 1 ? 's' : ''} the AI could not fix
              </Typography>
            </Box>
            <Collapse in={showDeclined}>
              <Box style={{ marginTop: 8 }}>
                {declined.map(p => (<ProposalCard key={p.id} proposal={p} selected={false} onToggle={() => {}} />))}
              </Box>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Result Banner — shown after operation completes
// ---------------------------------------------------------------------------
export const ResultBanner = ({
  scan,
  isRemediate,
  onViewDetails,
  onDismiss,
  onCreatePR,
}: {
  scan: ScanResult;
  isRemediate?: boolean;
  onViewDetails: () => void;
  onDismiss: () => void;
  onCreatePR?: () => void;
}) => {
  return (
    <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24, borderColor: statusColors.success, borderWidth: 2 }}>
      <CardContent style={{ padding: '24px 24px', textAlign: 'center' }}>
        <CheckCircleIcon style={{ fontSize: 40, color: statusColors.success, marginBottom: 8 }} />
        <Typography style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
          {isRemediate ? 'Remediation complete' : 'Operation Complete'}
        </Typography>
        <Box display="flex" justifyContent="center" style={{ gap: 24, marginTop: 12, marginBottom: 16 }}>
          <Box style={{ textAlign: 'center' }}>
            <Typography style={{ fontSize: 22, fontWeight: 700 }}>{scan.totalViolations}</Typography>
            <Typography style={{ fontSize: 11, color: '#666' }}>Violations</Typography>
          </Box>
          <Box style={{ textAlign: 'center' }}>
            <Typography style={{ fontSize: 22, fontWeight: 700, color: statusColors.success }}>{scan.fixable}</Typography>
            <Typography style={{ fontSize: 11, color: '#666' }}>Fixable</Typography>
          </Box>
          <Box style={{ textAlign: 'center' }}>
            <Typography style={{ fontSize: 22, fontWeight: 700, color: statusColors.warning }}>{scan.manualReview}</Typography>
            <Typography style={{ fontSize: 11, color: '#666' }}>Manual</Typography>
          </Box>
        </Box>
        <Box display="flex" justifyContent="center" style={{ gap: 8 }}>
          {isRemediate && onCreatePR && (
            <Button
              size="small" variant="contained" color="primary"
              startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
              onClick={onCreatePR}
              style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
            >
              Create pull request
            </Button>
          )}
          <Button size="small" variant="outlined" color="primary" onClick={onViewDetails} style={{ textTransform: 'none', fontSize: 12 }}>
            View details
          </Button>
          <Button size="small" onClick={onDismiss} style={{ textTransform: 'none', fontSize: 12 }}>
            Dismiss
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Main QualityTab
// ---------------------------------------------------------------------------
export const QualityTab = ({
  quality,
  projectName,
  initialView,
  initialScanId,
  repoUrl,
  branch,
  onCheck,
  onRemediate,
  opStatus,
  onDismissResult,
}: {
  quality: ProjectQualityData | null;
  projectName: string;
  initialView?: 'latest-scan';
  initialScanId?: string | null;
  repoUrl?: string;
  branch?: string;
  onCheck?: () => void;
  onRemediate?: () => void;
  opStatus?: OperationStatus;
  onDismissResult?: () => void;
}) => {
  const [categoryFilter, setCategoryFilter] = useState<ViolationCategory | 'all'>('all');
  const [lastWasRemediate, setLastWasRemediate] = useState(false);

  // Empty state — never scanned
  if (!quality) {
    return (
      <Box style={{ marginTop: 24 }}>
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '64px 24px', textAlign: 'center' }}>
            <PlayArrowIcon style={{ fontSize: 48, opacity: 0.15, marginBottom: 12 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              No quality data available
            </Typography>
            <Typography style={{ fontSize: 13, color: '#666', maxWidth: 400, margin: '0 auto', marginBottom: 20 }}>
              Run your first scan to check this project for compatibility issues, security risks, and best practice violations.
            </Typography>
            {onCheck && (
              <Button
                variant="contained" color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={onCheck}
                style={{ textTransform: 'none', fontWeight: 600 }}
              >
                Run first scan
              </Button>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Running state — inline progress
  if (opStatus === 'running') {
    return (
      <Box style={{ marginTop: 24 }}>
        <InlineProgress isRemediate={lastWasRemediate} />
      </Box>
    );
  }

  // Complete state — show result banner
  if (opStatus === 'complete') {
    return (
      <Box style={{ marginTop: 24 }}>
        <ResultBanner
          scan={quality.latestScan}
          isRemediate={lastWasRemediate}
          onViewDetails={() => { onDismissResult?.(); }}
          onDismiss={() => { onDismissResult?.(); }}
          onCreatePR={() => {
            window.open('https://github.com/acme-corp/rhel-patching/pull/42', '_blank');
          }}
        />
      </Box>
    );
  }

  const scan = quality.latestScan;
  const fixableCount = scan.fixable;
  const manualCount = scan.manualReview;

  return (
    <Box style={{ marginTop: 24 }}>
      {/* Summary header card */}
      <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 20 }}>
        <CardContent style={{ padding: '16px 20px' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Box display="flex" alignItems="center" style={{ gap: 16 }}>
              <Typography style={{ fontSize: 28, fontWeight: 700, color: statusColors.error }}>
                {scan.totalViolations}
              </Typography>
              <Box>
                <Typography style={{ fontSize: 14, fontWeight: 500 }}>
                  Violations
                </Typography>
                <Typography style={{ fontSize: 12, color: '#666' }}>
                  {fixableCount} fixable · {manualCount} manual
                </Typography>
              </Box>
            </Box>
            {onRemediate && fixableCount > 0 && (
              <Button
                variant="contained" color="primary" size="small"
                startIcon={<BuildIcon style={{ fontSize: 16 }} />}
                onClick={() => { setLastWasRemediate(true); onRemediate(); }}
                style={{ textTransform: 'none', fontWeight: 600 }}
              >
                Remediate ({fixableCount} fixable)
              </Button>
            )}
          </Box>

          {/* Severity breakdown bar + labels */}
          <SeverityProgressBar breakdown={scan.severityBreakdown} />
          <Box style={{ marginTop: 8 }}>
            <SeverityBar breakdown={scan.severityBreakdown} />
          </Box>

          {/* Last checked + re-scan */}
          <Box display="flex" alignItems="center" style={{ gap: 4, marginTop: 12 }}>
            <Typography style={{ fontSize: 11, color: '#999' }}>
              Last checked {quality.lastScannedAt} · commit <code style={{ fontSize: 11 }}>{quality.lastScannedCommit}</code>
            </Typography>
            {onCheck && (
              <Button
                size="small"
                onClick={() => { setLastWasRemediate(false); onCheck(); }}
                style={{ textTransform: 'none', fontSize: 11, color: statusColors.info, minWidth: 0, padding: '0 4px' }}
              >
                Re-scan
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Violations list — grouped by file */}
      {quality.violations.length > 0 && (
        <ViolationsCard
          violations={quality.violations}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          repoUrl={repoUrl}
          branch={branch}
        />
      )}
    </Box>
  );
};
