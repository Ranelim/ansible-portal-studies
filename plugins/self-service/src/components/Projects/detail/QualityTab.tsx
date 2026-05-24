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
import { Table, TableColumn } from '@backstage/core-components';
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
import { useProjectDetailStyles } from './styles';
import { statusColors } from '../../common/statusColors';
import {
  type ProjectQualityData,
  type ScanResult,
  type AiProposal,
  type TrendPoint,
  type SeverityClass,
  type QualityViolation,
  type ViolationCategory,
  SEVERITY_COLORS,
} from './qualityDemoData';

export type OperationStatus = 'idle' | 'running' | 'awaiting_approval' | 'complete';

const StatCard = ({ value, label, color }: { value: string | number; label: string; color?: string }) => {
  const classes = useProjectDetailStyles();
  return (
    <Paper className={classes.summaryCard} variant="outlined">
      <Typography className={classes.summaryLabel}>{label}</Typography>
      <Typography className={classes.summaryValue} style={{ color, fontSize: 24, fontWeight: 700 }}>
        {value}
      </Typography>
    </Paper>
  );
};

const SeverityBar = ({ breakdown }: { breakdown: Record<SeverityClass, number> }) => {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const order: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];

  return (
    <Box display="flex" style={{ gap: 24, flexWrap: 'wrap' }}>
      {order.map(sev => {
        const count = breakdown[sev];
        if (count === 0) return null;
        return (
          <Box key={sev} display="flex" alignItems="center" style={{ gap: 8 }}>
            <Box style={{
              width: 12, height: 12, borderRadius: 2,
              backgroundColor: SEVERITY_COLORS[sev],
            }} />
            <Typography style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>
              {sev}
            </Typography>
            <Typography style={{ fontSize: 13, fontWeight: 700, color: SEVERITY_COLORS[sev] }}>
              {count}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

const TrendChart = ({ data }: { data: TrendPoint[] }) => {
  if (data.length < 2) return null;

  const width = 560;
  const height = 140;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const maxVal = Math.max(...data.map(d => d.totalViolations), ...data.map(d => d.fixable));
  const scaleX = (i: number) => padX + (i / (data.length - 1)) * chartW;
  const scaleY = (v: number) => padY + chartH - (v / (maxVal || 1)) * chartH;

  const violationPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(d.totalViolations)}`).join(' ');
  const fixablePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(d.fixable)}`).join(' ');

  return (
    <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24 }}>
      <CardContent style={{ padding: 20 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" style={{ marginBottom: 12 }}>
          <Typography style={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Violation trend
          </Typography>
          <Box display="flex" style={{ gap: 16 }}>
            <Box display="flex" alignItems="center" style={{ gap: 6 }}>
              <Box style={{ width: 16, height: 3, backgroundColor: statusColors.error, borderRadius: 1 }} />
              <Typography style={{ fontSize: 11, color: '#666' }}>Violations</Typography>
            </Box>
            <Box display="flex" alignItems="center" style={{ gap: 6 }}>
              <Box style={{ width: 16, height: 3, borderRadius: 1, borderTop: '2px dashed #3E8635' }} />
              <Typography style={{ fontSize: 11, color: '#666' }}>Fixable</Typography>
            </Box>
          </Box>
        </Box>
        <svg width={width} height={height} style={{ display: 'block', maxWidth: '100%' }}>
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = padY + chartH * (1 - pct);
            return (
              <g key={pct}>
                <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="#e0e0e0" strokeWidth={1} />
                <text x={padX - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#999">
                  {Math.round(maxVal * pct)}
                </text>
              </g>
            );
          })}
          <path d={violationPath} fill="none" stroke={statusColors.error} strokeWidth={2} />
          <path d={fixablePath} fill="none" stroke={statusColors.success} strokeWidth={2} strokeDasharray="5,3" />
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={scaleX(i)} cy={scaleY(d.totalViolations)} r={3} fill={statusColors.error} />
              <circle cx={scaleX(i)} cy={scaleY(d.fixable)} r={3} fill={statusColors.success} />
              <text x={scaleX(i)} y={height - 4} textAnchor="middle" fontSize={10} fill="#999">
                #{i + 1}
              </text>
            </g>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
};

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

export const ProgressPanel = () => (
  <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24 }}>
    <CardContent style={{ padding: 24, textAlign: 'center' }}>
      <AutorenewIcon style={{ fontSize: 36, color: statusColors.info, marginBottom: 8, animation: 'spin 1.5s linear infinite' }} />
      <Typography style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Analyzing content...</Typography>
      <LinearProgress style={{ marginBottom: 16, borderRadius: 4 }} />
      <Box style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
        {[
          { label: 'Cloning repository', done: true },
          { label: 'Parsing content structure', done: true },
          { label: 'Running validators', done: false },
          { label: 'AI analysis', done: false },
        ].map((step, i) => (
          <Box key={i} display="flex" alignItems="center" style={{ gap: 8, padding: '4px 0' }}>
            {step.done ? (
              <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
            ) : (
              <Box style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #ccc' }} />
            )}
            <Typography style={{ fontSize: 13, color: step.done ? 'inherit' : '#999' }}>{step.label}</Typography>
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Scan Detail View (inline, same pattern as PipelineRunDetail)
// ---------------------------------------------------------------------------
// Violation row — matches APME's row style
// ---------------------------------------------------------------------------
const ViolationRowItem = ({
  v, selected, onToggle, repoUrl, branch,
}: {
  v: QualityViolation; selected: boolean; onToggle: () => void;
  repoUrl?: string; branch?: string;
}) => {
  const { hasRole } = useUserRoleContext();
  const [expanded, setExpanded] = useState(false);
  const confidencePct = v.fixTier === 'deterministic' ? 95 : v.fixTier === 'ai' ? 78 : 0;

  return (
    <Box style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
      <Box
        display="flex" alignItems="center"
        style={{ padding: '7px 16px', gap: 10, cursor: 'pointer' }}
        onClick={() => onToggle()}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      >
        <Box style={{
          width: 16, height: 16, borderRadius: '50%',
          border: selected ? 'none' : '2px solid #999',
          backgroundColor: selected ? statusColors.info : 'transparent',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && (
            <CheckCircleIcon style={{ fontSize: 16, color: '#fff' }} />
          )}
        </Box>
        <Typography style={{ fontSize: 12, fontFamily: 'monospace', color: '#666', minWidth: 55, textAlign: 'right' }}>
          L{v.lineStart}
        </Typography>
        <Typography style={{ fontSize: 13, flex: 1, color: '#333' }} noWrap>
          {v.file}
        </Typography>
        {v.fixTier !== 'manual' && (
          <Typography style={{ fontSize: 11, color: '#666' }}>
            Tier {v.fixTier === 'deterministic' ? '1' : '2'}
          </Typography>
        )}
        {confidencePct > 0 && (
          <Box display="flex" alignItems="center" style={{ gap: 4, minWidth: 65 }}>
            <Box style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <Box style={{
                width: `${confidencePct}%`, height: '100%', borderRadius: 2,
                backgroundColor: statusColors.success,
              }} />
            </Box>
            <Typography style={{ fontSize: 10, color: '#666' }}>{confidencePct}%</Typography>
          </Box>
        )}
        <Button
          size="small"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{
            textTransform: 'none', fontSize: 11, minWidth: 38, padding: '1px 8px',
            color: '#999', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 4,
          }}
        >
          {expanded ? 'Hide' : 'Show'}
        </Button>
        {repoUrl && isDevSpacesConnected && hasRole('developer') && (
          <Tooltip title={`Edit ${v.file}:${v.lineStart} in Dev Spaces`}>
            <IconButton
              size="small"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                window.open(`${DEVSPACES_BASE_URL}/#${repoUrl}/tree/${branch || 'main'}/${v.file}?line=${v.lineStart}`, '_blank');
              }}
              style={{ padding: 4 }}
            >
              <CodeIcon style={{ fontSize: 14, color: '#666' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Collapse in={expanded}>
        <Box style={{ padding: '4px 16px 12px 42px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            {v.severity === 'critical' || v.severity === 'high' ? (
              <ErrorIcon style={{ fontSize: 14, color: SEVERITY_COLORS[v.severity] }} />
            ) : (
              <WarningIcon style={{ fontSize: 14, color: SEVERITY_COLORS[v.severity] }} />
            )}
            <Chip size="small" label={v.ruleId} variant="outlined" style={{ fontSize: 10, height: 18, fontFamily: 'monospace', borderColor: 'rgba(0,0,0,0.2)' }} />
            <Chip size="small" label={
              v.category === 'aap-compatibility' ? 'Compatibility' :
              v.category === 'best-practice' ? 'Best practice' :
              v.category.charAt(0).toUpperCase() + v.category.slice(1)
            } style={{
              fontSize: 10, height: 18,
              backgroundColor: v.category === 'aap-compatibility' ? `${statusColors.info}20` : 'transparent',
              color: v.category === 'aap-compatibility' ? statusColors.info : '#888',
              border: v.category === 'aap-compatibility' ? 'none' : '1px solid rgba(0,0,0,0.2)',
            }} />
            <Typography style={{ fontSize: 12, color: '#999' }}>{v.message}</Typography>
          </Box>
          {v.fixTier !== 'manual' && (
            <Box style={{ padding: '8px 12px', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.12)' }}>
              <Typography component="div" style={{ fontSize: 12, fontFamily: 'monospace', color: statusColors.success, lineHeight: 1.6 }}>
                + {v.fixTier === 'deterministic'
                  ? `ansible.builtin.${v.ruleId.includes('fqcn') ? 'copy' : 'command'}:`
                  : `# AI-suggested remediation for ${v.ruleId}`}
              </Typography>
              <Typography component="div" style={{ fontSize: 12, fontFamily: 'monospace', color: statusColors.error, lineHeight: 1.6 }}>
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
// Scan Detail View
// ---------------------------------------------------------------------------
const ScanDetailView = ({
  scan,
  quality,
  onBack,
  hideBackButton = false,
  repoUrl,
  branch,
}: {
  scan: ScanResult;
  quality: ProjectQualityData;
  onBack: () => void;
  hideBackButton?: boolean;
  repoUrl?: string;
  branch?: string;
}) => {
  const isLatest = scan.scanId === quality.latestScan.scanId;
  const [categoryFilter, setCategoryFilter] = useState<ViolationCategory | 'all'>('all');
  const filteredViolations = useMemo(() =>
    categoryFilter === 'all' ? quality.violations : quality.violations.filter(v => v.category === categoryFilter),
  [quality.violations, categoryFilter]);
  const fixableViolations = filteredViolations.filter(v => v.fixTier !== 'manual');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applied, setApplied] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    quality.violations.forEach(v => { counts[v.category] = (counts[v.category] || 0) + 1; });
    return counts;
  }, [quality.violations]);

  const toggleItem = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };
  const selectAll = () => {
    const all = new Set<number>();
    filteredViolations.forEach((v, i) => { if (v.fixTier !== 'manual') all.add(i); });
    setSelected(all);
  };
  const skipAll = () => setSelected(new Set());
  const handleApply = () => { setApplied(true); setSelected(new Set()); };

  return (
    <Box style={{ marginTop: hideBackButton ? 0 : 24 }}>
      {!hideBackButton && (
        <Button
          startIcon={<ExpandLessIcon style={{ transform: 'rotate(-90deg)' }} />}
          onClick={onBack}
          style={{ textTransform: 'none', fontWeight: 500, marginBottom: 16 }}
        >
          All scans
        </Button>
      )}

      {/* Compact scan summary */}
      <Box
        display="flex" alignItems="center" flexWrap="wrap"
        style={{
          gap: 10, padding: '10px 16px', marginBottom: 16,
          backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)',
        }}
      >
        <Typography style={{ fontWeight: 600, fontSize: 14 }}>{scan.scanId}</Typography>
        <Chip
          size="small"
          label={scan.scanType === 'remediate' ? 'Remediate' : 'Check'}
          style={{
            fontSize: 10, height: 20, fontWeight: 600,
            backgroundColor: scan.scanType === 'remediate' ? `${statusColors.info}20` : `${statusColors.success}20`,
            color: scan.scanType === 'remediate' ? statusColors.info : statusColors.success,
          }}
        />
        <Typography style={{ fontSize: 12, color: '#888' }}>|</Typography>
        <Typography style={{ fontSize: 12, color: '#999' }}>{scan.totalViolations} violations</Typography>
        <Typography style={{ fontSize: 12, color: '#999' }}>· {scan.fixable} fixable</Typography>
        {scan.manualReview > 0 && (
          <Typography style={{ fontSize: 12, color: statusColors.warning }}>· {scan.manualReview} manual</Typography>
        )}
        <Box flex={1} />
        <Typography style={{ fontSize: 11, color: '#555' }}>
          {scan.createdAt} · <code style={{ fontSize: 11 }}>{scan.commitHash}</code>
        </Typography>
      </Box>

      {/* Violations card with APME-style header and actions */}
      {isLatest && quality.violations.length > 0 && (
        <Card variant="outlined" style={{ borderRadius: 8, overflow: 'hidden' }}>
          {/* Header with count and category filters */}
          <Box style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 6 }}>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                {scan.totalViolations > 0 && (
                  <Chip size="small" label={`${scan.totalViolations} Violations`}
                    style={{ fontSize: 11, height: 22, backgroundColor: `${statusColors.error}20`, color: statusColors.error, fontWeight: 600 }}
                  />
                )}
                {fixableViolations.length > 0 && (
                  <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                    {fixableViolations.length} AI Proposals
                  </Typography>
                )}
              </Box>
              <Box display="flex" style={{ gap: 4 }}>
                {([
                  { key: 'all' as const, label: 'All' },
                  { key: 'lint' as const, label: 'Lint' },
                  { key: 'aap-compatibility' as const, label: 'Compatibility' },
                  { key: 'security' as const, label: 'Security' },
                  { key: 'best-practice' as const, label: 'Best practice' },
                ] as const).filter(f => f.key === 'all' || categoryCounts[f.key]).map(f => (
                  <Chip
                    key={f.key} size="small" clickable
                    label={f.key === 'all' ? f.label : `${f.label} (${categoryCounts[f.key]})`}
                    onClick={() => { setCategoryFilter(f.key); setSelected(new Set()); }}
                    variant={categoryFilter === f.key ? 'default' : 'outlined'}
                    style={{
                      fontSize: 11, height: 22,
                      backgroundColor: categoryFilter === f.key ? `${statusColors.info}30` : undefined,
                      color: categoryFilter === f.key ? statusColors.info : '#999',
                      borderColor: categoryFilter === f.key ? statusColors.info : 'rgba(0,0,0,0.2)',
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Typography style={{ fontSize: 12, color: '#888' }}>
              Review each proposed change and select which to apply.
            </Typography>
          </Box>

          {/* Action bar */}
          <Box
            display="flex" alignItems="center" justifyContent="flex-end"
            style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.12)', backgroundColor: 'rgba(0,0,0,0.02)', gap: 8 }}
          >
            {!applied ? (
              <>
                <Button size="small" onClick={selectAll}
                  style={{ textTransform: 'none', fontSize: 11, color: '#666', padding: '2px 10px' }}>
                  Select All
                </Button>
                <Button size="small" onClick={skipAll}
                  style={{ textTransform: 'none', fontSize: 11, color: '#666', padding: '2px 10px' }}>
                  Skip All
                </Button>
                <Button size="small" variant="contained" color="primary" onClick={handleApply}
                  disabled={selected.size === 0}
                  style={{
                    textTransform: 'none', fontSize: 12, fontWeight: 600, padding: '4px 16px',
                  }}>
                  Apply {selected.size} Selected
                </Button>
              </>
            ) : (
              <Button
                size="small" variant="contained" color="primary"
                startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                component="a" href="https://github.com/acme-corp/rhel-patching/pull/42" target="_blank" rel="noopener noreferrer"
                style={{ textTransform: 'none', fontSize: 12, padding: '4px 14px' }}
              >
                View pull request
              </Button>
            )}
          </Box>

          {/* Rows */}
          {filteredViolations.map((v, i) => (
            <ViolationRowItem
              key={`${v.ruleId}-${v.lineStart}`} v={v}
              selected={selected.has(i)}
              onToggle={() => { if (v.fixTier !== 'manual') toggleItem(i); }}
              repoUrl={repoUrl}
              branch={branch}
            />
          ))}
        </Card>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Scan History Table
// ---------------------------------------------------------------------------
const ScanHistoryTable = ({
  scans,
  onSelectScan,
}: {
  scans: ScanResult[];
  onSelectScan: (scanId: string) => void;
}) => {
  const scanStatusIcon = (scan: ScanResult) => {
    if (scan.scanType === 'remediate' && scan.remediatedCount > 0) {
      return <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />;
    }
    if (scan.totalViolations === 0) {
      return <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />;
    }
    return <WarningIcon style={{ fontSize: 16, color: statusColors.warning }} />;
  };

  const columns: TableColumn<ScanResult>[] = [
    {
      title: 'Scan',
      field: 'scanId',
      render: (row: ScanResult) => (
        <Box>
          <Typography variant="body2" style={{ fontWeight: 500, color: statusColors.info, fontSize: 13 }}>
            {row.scanId}
          </Typography>
          <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 1 }}>
            <code style={{ fontSize: 11 }}>{row.commitHash}</code>
          </Typography>
        </Box>
      ),
    },
    {
      title: 'Type',
      field: 'scanType',
      render: (row: ScanResult) => (
        <Chip
          size="small"
          label={row.scanType === 'remediate' ? 'Remediate' : 'Check'}
          style={{
            fontSize: 11, height: 20, fontWeight: 500,
            backgroundColor: row.scanType === 'remediate' ? `${statusColors.info}20` : `${statusColors.success}20`,
            color: row.scanType === 'remediate' ? statusColors.info : statusColors.success,
          }}
        />
      ),
    },
    {
      title: 'Result',
      sorting: false,
      render: (row: ScanResult) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          {scanStatusIcon(row)}
          <Typography style={{ fontSize: 13 }}>
            {row.totalViolations} violation{row.totalViolations !== 1 ? 's' : ''}
          </Typography>
          {row.scanType === 'remediate' && row.remediatedCount > 0 && (
            <Typography style={{ fontSize: 12, color: statusColors.success }}>
              ({row.remediatedCount} fixed)
            </Typography>
          )}
        </Box>
      ),
    },
    {
      title: 'AI',
      sorting: false,
      render: (row: ScanResult) => {
        if (row.aiCandidates === 0) return <Typography style={{ fontSize: 12, color: '#999' }}>—</Typography>;
        return (
          <Tooltip title={`${row.aiAccepted} accepted, ${row.aiDeclined} declined`} arrow>
            <Chip size="small" label={`${row.aiCandidates} proposals`} style={{ fontSize: 10, height: 18, backgroundColor: '#F0AB0020', color: '#73510D' }} />
          </Tooltip>
        );
      },
    },
    { title: 'Date', field: 'createdAt' },
  ];

  return (
    <Card variant="outlined" style={{ borderRadius: 12 }}>
      <CardContent style={{ padding: 20 }}>
        <Typography style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 16 }}>
          Scan history ({scans.length})
        </Typography>
        <Table<ScanResult>
          columns={columns}
          data={scans}
          title=""
          options={{
            paging: scans.length > 5,
            pageSize: 5,
            pageSizeOptions: [5, 10],
            emptyRowsWhenPaging: false,
            search: false,
            sorting: false,
            padding: 'dense',
            header: true,
            rowStyle: { cursor: 'pointer' },
          }}
          style={{ boxShadow: 'none' }}
          onRowClick={(_e, rowData) => {
            if (rowData) onSelectScan((rowData as ScanResult).scanId);
          }}
        />
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Inline result banner (replaces the full-tab takeover)
// ---------------------------------------------------------------------------
export const ResultBanner = ({
  scan,
  onViewDetails,
  onDismiss,
}: {
  scan: ScanResult;
  onViewDetails: () => void;
  onDismiss: () => void;
}) => {
  const isRemediate = scan.scanType === 'remediate' && scan.remediatedCount > 0;
  return (
    <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24, borderColor: statusColors.success, borderWidth: 2 }}>
      <CardContent style={{ padding: '16px 20px' }}>
        <Box display="flex" alignItems="center" style={{ gap: 12 }}>
          <CheckCircleIcon style={{ fontSize: 28, color: statusColors.success }} />
          <Box flex={1}>
            <Typography style={{ fontWeight: 600, fontSize: 15 }}>
              {isRemediate ? 'Remediation complete' : 'Check complete'}
            </Typography>
            <Typography style={{ fontSize: 12, color: '#666' }}>
              {scan.totalViolations} violation{scan.totalViolations !== 1 ? 's' : ''} found
              {isRemediate && ` · ${scan.remediatedCount} fixed`}
              {' · '}commit <code style={{ fontSize: 11 }}>{scan.commitHash}</code>
            </Typography>
          </Box>
          {isRemediate && (
            <Button
              size="small" variant="contained" color="primary"
              startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
              component="a" href="https://github.com/acme-corp/rhel-patching/pull/42" target="_blank" rel="noopener noreferrer"
              style={{ textTransform: 'none', fontSize: 12 }}
            >
              View pull request
            </Button>
          )}
          <Button size="small" variant={isRemediate ? 'outlined' : 'contained'} color="primary" onClick={onViewDetails} style={{ textTransform: 'none', fontSize: 12 }}>
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
// Main QualityTab — latest scan report + drill-down to history
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
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(() => {
    if (initialScanId && quality) {
      const allScansCheck = quality.scanHistory.length > 0 ? quality.scanHistory : [quality.latestScan];
      if (allScansCheck.find(s => s.scanId === initialScanId)) return initialScanId;
    }
    if (initialView === 'latest-scan' && quality) return quality.latestScan.scanId;
    return null;
  });

  const allScans = useMemo(() => {
    if (!quality) return [];
    if (quality.scanHistory.length > 0) return quality.scanHistory;
    return [quality.latestScan];
  }, [quality]);

  const selectedScan = selectedScanId
    ? allScans.find(s => s.scanId === selectedScanId) ?? null
    : null;

  if (!quality) {
    return (
      <Box style={{ marginTop: 24 }}>
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '64px 24px', textAlign: 'center' }}>
            <WarningIcon style={{ fontSize: 48, opacity: 0.2, marginBottom: 12 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              No quality data available
            </Typography>
            <Typography style={{ fontSize: 13, color: '#666', maxWidth: 400, margin: '0 auto', marginBottom: 16 }}>
              Use the Check button above to analyze this project for compatibility, security, and best practice violations.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Drill-down: viewing a specific historical scan
  if (selectedScan) {
    return <ScanDetailView scan={selectedScan} quality={quality} onBack={() => setSelectedScanId(null)} repoUrl={repoUrl} branch={branch} />;
  }

  // Drill-down: scan history list
  if (showHistory) {
    return (
      <Box style={{ marginTop: 24 }}>
        <Box display="flex" alignItems="center" style={{ marginBottom: 16 }}>
          <Button size="small" onClick={() => setShowHistory(false)} style={{ textTransform: 'none', marginRight: 8 }}>
            ← Latest scan
          </Button>
          <Typography style={{ fontSize: 16, fontWeight: 600 }}>
            Scan history ({allScans.length})
          </Typography>
        </Box>
        <ScanHistoryTable scans={allScans} onSelectScan={setSelectedScanId} />
      </Box>
    );
  }

  // Default: latest scan report
  const scan = quality.latestScan;
  return (
    <Box style={{ marginTop: 24 }}>
      {/* Actions bar */}
      {(onCheck || onRemediate) && (
        <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            {onCheck && (
              <Button
                variant="outlined" size="small"
                startIcon={opStatus === 'running' ? <AutorenewIcon style={{ animation: 'spin 1.5s linear infinite' }} /> : <PlayArrowIcon />}
                onClick={onCheck}
                disabled={opStatus === 'running'}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                {opStatus === 'running' ? 'Checking...' : 'Check'}
              </Button>
            )}
            {onRemediate && quality.latestScan.fixable > 0 && (
              <Button
                variant="outlined" color="primary" size="small"
                startIcon={<BuildIcon />}
                onClick={onRemediate}
                disabled={opStatus === 'running'}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                Remediate ({quality.latestScan.fixable} fixable)
              </Button>
            )}
          </Box>
          {opStatus === 'running' && (
            <Typography style={{ fontSize: 12, color: statusColors.info }}>
              Analyzing content...
            </Typography>
          )}
        </Box>
      )}

      {/* Latest scan header */}
      <ScanDetailView
        scan={scan}
        quality={quality}
        onBack={() => {}}
        hideBackButton
        repoUrl={repoUrl}
        branch={branch}
      />

      {/* Footer: link to scan history */}
      {allScans.length > 1 && (
        <Box display="flex" justifyContent="center" style={{ marginTop: 24 }}>
          <Button
            color="primary"
            onClick={() => setShowHistory(true)}
            style={{ textTransform: 'none', fontWeight: 500 }}
          >
            View all {allScans.length} scans →
          </Button>
        </Box>
      )}
    </Box>
  );
};
