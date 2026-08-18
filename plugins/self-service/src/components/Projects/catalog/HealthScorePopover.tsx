import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Popover,
  Typography,
  makeStyles,
  useTheme,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import { statusColors } from '../../common/statusColors';
import {
  type SeverityClass,
  type QualityViolation,
  type ProjectQualityData,
  type RemediationStatus,
  SEVERITY_COLORS,
  getProjectQuality,
} from '../detail/qualityDemoData';

const SEVERITY_ORDER: SeverityClass[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

const SEVERITY_LABEL: Record<SeverityClass, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const NODE_KIND_LABEL: Record<QualityViolation['scope'], string> = {
  task: 'Task',
  play: 'Play',
  role: 'Role',
  playbook: 'Playbook',
  collection: 'Collection',
  block: 'Block',
  inventory: 'Inventory',
};

const REMEDIATION_STATUS_LABEL: Record<RemediationStatus, string> = {
  none: 'not started',
  available: 'not started',
  'in-progress': 'in progress',
  'proposals-ready': 'proposals ready',
  'pr-open': 'pull request open',
  'pr-merged': 'pull request merged',
};

type NodeHit = {
  key: string;
  kind: string;
  label: string;
};

function basename(file: string): string {
  const parts = file.split('/');
  return parts[parts.length - 1] || file;
}

function nodeFromFinding(v: QualityViolation): NodeHit {
  const key = (v.yamlPath || '').trim() || `${v.file}:${v.lineStart}`;
  const kind = v.scope ? NODE_KIND_LABEL[v.scope] : 'Task';
  const loc =
    v.lineStart != null && v.lineStart > 0
      ? `${basename(v.file)}:${v.lineStart}`
      : basename(v.file);
  return { key, kind, label: loc };
}

function nodesForSeverity(
  findings: QualityViolation[],
  severity: SeverityClass,
): NodeHit[] {
  const seen = new Set<string>();
  const unique: NodeHit[] = [];
  for (const v of findings) {
    if (v.severity !== severity) continue;
    const node = nodeFromFinding(v);
    if (seen.has(node.key)) continue;
    seen.add(node.key);
    unique.push(node);
  }
  return unique;
}

/** Portal list bands — same as QualityOverviewCard. Not SPA 4-band. */
export const healthColor = (score: number): string => {
  if (score >= 80) return statusColors.success;
  if (score >= 50) return statusColors.warning;
  return statusColors.error;
};

const shortSha = (sha: string) => (sha.length > 7 ? sha.slice(0, 7) : sha);

/** Colored score with muted /100 — scale without implying a percentage. */
export function QualityScoreMark({
  score,
  fontSize = 16,
  denomSize,
}: {
  score: number;
  fontSize?: number;
  denomSize?: number;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 1,
        lineHeight: 1.2,
      }}
    >
      <Typography
        component="span"
        style={{
          fontSize,
          fontWeight: 700,
          lineHeight: 1.2,
          color: healthColor(score),
        }}
      >
        {score}
      </Typography>
      <Typography
        component="span"
        color="textSecondary"
        style={{
          fontSize: denomSize ?? Math.max(11, Math.round(fontSize * 0.7)),
          fontWeight: 500,
          lineHeight: 1.2,
        }}
      >
        /100
      </Typography>
    </span>
  );
}

const useStyles = makeStyles(theme => ({
  popoverContent: {
    padding: theme.spacing(2.5),
    maxWidth: 400,
    minWidth: 300,
  },
  header: {
    marginBottom: theme.spacing(1.5),
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clickTarget: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: 4,
    padding: '2px 6px',
    margin: '-2px -6px',
    border: 'none',
    background: 'none',
    font: 'inherit',
    transition: 'background-color 0.15s',
    '&:hover, &:focus': {
      backgroundColor: theme.palette.action.hover,
      outline: 'none',
    },
  },
  findings: {
    maxHeight: 280,
    overflowY: 'auto',
    marginBottom: theme.spacing(1),
  },
  sevRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0 2px',
  },
  sevCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    height: 18,
    minWidth: 18,
    padding: '0 5px',
    borderRadius: 9,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1,
    flexShrink: 0,
    color: theme.palette.text.primary,
  },
  nodeRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    padding: '2px 0 2px 26px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  meta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
    lineHeight: 1.45,
  },
  pill: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    fontSize: 12,
  },
}));

interface HealthScorePopoverProps {
  repoName: string;
  quality?: ProjectQualityData | null;
  fontSize?: number;
  scanning?: boolean;
  onViewLastScan?: () => void;
  onRemediate?: () => void;
  onViewPullRequest?: () => void;
}

export const HealthScorePopover = ({
  repoName,
  quality: qualityProp,
  fontSize = 16,
  scanning = false,
  onViewLastScan,
  onRemediate,
  onViewPullRequest,
}: HealthScorePopoverProps) => {
  const classes = useStyles();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const quality = qualityProp ?? getProjectQuality(repoName);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  if (scanning) {
    return (
      <Box display="inline-flex" alignItems="center" style={{ gap: 6 }}>
        <CircularProgress size={12} thickness={5} style={{ color: statusColors.info }} />
        <Typography style={{ fontSize: 12, color: statusColors.info, fontWeight: 500 }}>
          Scanning
        </Typography>
      </Box>
    );
  }

  if (!quality) {
    return (
      <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
        Not scanned
      </Typography>
    );
  }

  const { healthScore, totalViolations, lastScannedAt, lastScannedCommit, severityBreakdown } =
    quality;
  const live =
    quality.remediationStatus === 'in-progress' ||
    quality.remediationStatus === 'proposals-ready';
  const presentSev = SEVERITY_ORDER.filter(sev => (severityBreakdown[sev] ?? 0) > 0);
  const sha = lastScannedCommit ? shortSha(lastScannedCommit) : null;
  const findings = quality.violations ?? [];
  const remediateLabel = live
    ? 'Resume remediation'
    : quality.remediationStatus === 'available'
      ? 'Remediate'
      : null;

  return (
    <>
      <button
        type="button"
        className={classes.clickTarget}
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchorEl)}
        aria-label={`Quality score ${healthScore} out of 100. Higher is better. Open scan details.`}
      >
        <QualityScoreMark score={healthScore} fontSize={fontSize} />
      </button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box className={classes.popoverContent}>
          <Box className={classes.header}>
            <Box className={classes.headerTop}>
              <QualityScoreMark score={healthScore} fontSize={28} denomSize={16} />
              <IconButton size="small" onClick={handleClose} aria-label="Close">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography className={classes.meta}>
              {totalViolations === 0 ? 'No findings' : `${totalViolations} findings`}
              {' · '}
              {lastScannedAt}
              {sha && (
                <>
                  {' · '}
                  <span style={{ fontFamily: 'monospace' }}>{sha}</span>
                </>
              )}
            </Typography>
            <Typography className={classes.meta}>
              Remediation: {REMEDIATION_STATUS_LABEL[quality.remediationStatus]}
            </Typography>
            <Typography style={{ fontSize: 11, color: theme.palette.text.disabled, marginTop: 2, lineHeight: 1.45 }}>
              0–100, higher is better. Rollup of finding severities from this scan.
            </Typography>
          </Box>

          {totalViolations > 0 && presentSev.length > 0 && (
            <Box className={classes.findings}>
              {presentSev.map(sev => {
                const nodes = nodesForSeverity(findings, sev);
                const count = severityBreakdown[sev];
                return (
                  <Box key={sev}>
                    <Box className={classes.sevRow}>
                      <span
                        className={classes.sevCount}
                        style={{
                          backgroundColor: fade(
                            SEVERITY_COLORS[sev],
                            theme.palette.type === 'dark' ? 0.28 : 0.16,
                          ),
                          borderColor: SEVERITY_COLORS[sev],
                        }}
                        aria-label={`${count} ${SEVERITY_LABEL[sev].toLowerCase()} finding${count === 1 ? '' : 's'}`}
                      >
                        {count}
                      </span>
                      <Typography style={{ fontSize: 13, fontWeight: 600 }}>
                        {SEVERITY_LABEL[sev]}
                      </Typography>
                    </Box>
                    {nodes.map(node => (
                      <Box key={node.key} className={classes.nodeRow}>
                        <Typography
                          style={{
                            fontSize: 11,
                            color: theme.palette.text.secondary,
                            minWidth: 56,
                          }}
                        >
                          {node.kind}
                        </Typography>
                        <Typography
                          style={{
                            fontSize: 12,
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={node.label}
                        >
                          {node.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Box>
          )}

          <Box className={classes.footer}>
            {onViewLastScan && (
              <Button
                size="small"
                color="primary"
                className={classes.pill}
                onClick={e => {
                  e.stopPropagation();
                  handleClose();
                  onViewLastScan();
                }}
              >
                View last scan
              </Button>
            )}
            {quality.remediationStatus === 'pr-open' && onViewPullRequest && (
              <Button
                size="small"
                color="primary"
                variant="contained"
                className={classes.pill}
                onClick={e => {
                  e.stopPropagation();
                  handleClose();
                  onViewPullRequest();
                }}
              >
                View pull request
              </Button>
            )}
            {remediateLabel && onRemediate && (
              <Button
                size="small"
                color="primary"
                variant="contained"
                className={classes.pill}
                onClick={e => {
                  e.stopPropagation();
                  handleClose();
                  onRemediate();
                }}
              >
                {remediateLabel}
              </Button>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};
