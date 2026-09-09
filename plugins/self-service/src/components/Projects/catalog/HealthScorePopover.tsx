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
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { statusColors } from '../../common/statusColors';
import {
  type SeverityClass,
  type QualityViolation,
  type ProjectQualityData,
  type RemediationStatus,
  SEVERITY_COLORS,
  getApmeFleetFindings,
  getProjectQuality,
} from '../detail/qualityDemoData';
import { SeverityMixBar } from '../quality/SeverityMixBar';

export const SEVERITY_ORDER: SeverityClass[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

export const SEVERITY_LABEL: Record<SeverityClass, string> = {
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

export const REMEDIATION_STATUS_LABEL: Record<RemediationStatus, string> = {
  none: 'not started',
  available: 'not started',
  'in-progress': 'in progress',
  'proposals-ready': 'proposals ready',
  superseded: 'superseded',
  'pr-open': 'pull request open',
  'pr-merged': 'pull request merged',
};

/** Card + popover: unified status line (replaces per-state remediation labels). */
export function getCardRemediationStatusLabel(
  status: RemediationStatus,
): 'Remediation pending' | 'Superseded' | null {
  if (status === 'superseded') return 'Superseded';
  if (
    status === 'available' ||
    status === 'in-progress' ||
    status === 'proposals-ready'
  ) {
    return 'Remediation pending';
  }
  return null;
}

export function shouldShowRemediateButton(
  status: RemediationStatus,
  totalViolations: number,
): boolean {
  if (totalViolations === 0) return false;
  if (status === 'none' || status === 'pr-open' || status === 'pr-merged') {
    return false;
  }
  return (
    status === 'available' ||
    status === 'in-progress' ||
    status === 'proposals-ready' ||
    status === 'superseded'
  );
}

export function isRemediateButtonDisabled(status: RemediationStatus): boolean {
  return status === 'superseded';
}

export function remediationSessionResume(status: RemediationStatus): boolean {
  return status === 'in-progress' || status === 'proposals-ready';
}

/** @deprecated Use getCardRemediationStatusLabel for card surfaces. */
export const remediationHasStarted = (status: RemediationStatus) =>
  getCardRemediationStatusLabel(status) !== null;

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

/** Hover / ⓘ copy for the 0–100 metric (card title, column header). */
export const HEALTH_SCORE_HINT =
  '0–100, higher is better. Rollup of finding severities from this scan.';

/** Portal list bands — same as QualityOverviewCard. Not SPA 4-band. */
export const healthColor = (score: number): string => {
  if (score >= 80) return statusColors.success;
  if (score >= 50) return statusColors.warning;
  return statusColors.error;
};

const shortSha = (sha: string) => (sha.length > 7 ? sha.slice(0, 7) : sha);

/** Colored score. “out of 100” is for display numbers (Overview, popover) — omit in the list. */
export function QualityScoreMark({
  score,
  fontSize = 16,
  denomSize,
  showDenom = true,
}: {
  score: number;
  fontSize?: number;
  denomSize?: number;
  showDenom?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: showDenom ? 6 : 1,
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
      {showDenom && (
        <Typography
          component="span"
          color="textSecondary"
          style={{
            fontSize: denomSize ?? Math.max(11, Math.round(fontSize * 0.7)),
            fontWeight: 400,
            lineHeight: 1.2,
          }}
        >
          out of 100
        </Typography>
      )}
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
    alignItems: 'baseline',
    gap: 8,
    width: 'auto',
    maxWidth: '100%',
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
    '&:hover $openHint, &:focus $openHint': {
      textDecoration: 'underline',
    },
    '&:hover $findingsLink, &:focus $findingsLink': {
      textDecoration: 'underline',
    },
    '&:hover $openIcon, &:focus $openIcon': {
      color: theme.palette.text.secondary,
    },
  },
  clickTargetStack: {
    display: 'flex',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'nowrap',
    overflow: 'hidden',
    containerType: 'inline-size',
  },
  scoreLock: {
    flexShrink: 0,
  },
  /** Quiet text control — same idea as MUI text button, grey 12px. */
  openHint: {
    fontSize: 12,
    fontWeight: 400,
    color: theme.palette.text.secondary,
    marginLeft: 10,
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
    textDecoration: 'none',
  },
  openIcon: {
    fontSize: 16,
    color: theme.palette.action.disabled,
    marginLeft: 6,
    alignSelf: 'center',
  },
  cellMeta: {
    fontSize: 12,
    fontWeight: 400,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    minWidth: 0,
    overflow: 'hidden',
    '@container (max-width: 12rem)': {
      display: 'none',
    },
  },
  /** Visible verb — whole cell still opens the popover. */
  findingsLink: {
    fontSize: 12,
    fontWeight: 500,
    color: theme.palette.primary.main,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  findings: {
    maxHeight: 220,
    overflowY: 'auto',
    marginBottom: theme.spacing(1),
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  catSection: {
    marginBottom: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.25),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '3px 0',
  },
  catName: {
    fontSize: 12,
    fontWeight: 500,
    minWidth: 108,
    flexShrink: 0,
  },
  catCount: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    minWidth: 16,
    flexShrink: 0,
  },
  catBar: {
    flex: 1,
    minWidth: 56,
    height: 6,
    display: 'flex',
    alignItems: 'center',
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

/** Miniature by-category bars — repo Overview card and the score popover. */
export function CategoryMixMini({
  repoName,
  divided = true,
}: {
  repoName: string;
  divided?: boolean;
}) {
  const classes = useStyles();
  const { total, categories } = getApmeFleetFindings([repoName]);
  if (categories.length === 0) return null;
  return (
    <Box
      className={divided ? classes.catSection : undefined}
      style={divided ? undefined : { marginTop: 12, marginBottom: 4 }}
    >
      <Typography className={classes.sectionLabel}>By category</Typography>
      {categories.map(cat => (
        <Box key={cat.id} className={classes.catRow}>
          <Typography className={classes.catName} component="span">
            {cat.label}
          </Typography>
          <Typography className={classes.catCount} component="span">
            {cat.count}
          </Typography>
          <Box className={classes.catBar}>
            <SeverityMixBar
              breakdown={cat.breakdown}
              height={6}
              shareOfTotal={total > 0 ? cat.count / total : 0}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/** Contrast-safe severity count — tint + border, same ink on every hue. */
export function SeverityCountBadge({
  severity,
  count,
}: {
  severity: SeverityClass;
  count: number;
}) {
  const classes = useStyles();
  const theme = useTheme();
  return (
    <span
      className={classes.sevCount}
      style={{
        backgroundColor: fade(
          SEVERITY_COLORS[severity],
          theme.palette.type === 'dark' ? 0.28 : 0.16,
        ),
        borderColor: SEVERITY_COLORS[severity],
      }}
      aria-label={`${count} ${SEVERITY_LABEL[severity].toLowerCase()} finding${count === 1 ? '' : 's'}`}
    >
      {count}
    </span>
  );
}

interface HealthScorePopoverProps {
  repoName: string;
  quality?: ProjectQualityData | null;
  fontSize?: number;
  denomSize?: number;
  /** Quiet grey text next to a display score (Overview). */
  openHint?: string;
  showOpenIcon?: boolean;
  /**
   * List cell: compact score (no “out of 100”) and findings as the visible open verb.
   * Remediations uses this without scan meta (Scanned column already has time/SHA).
   */
  showFindingsLink?: boolean;
  /** Catalog list: also show muted time · SHA after findings. Implies compact score. */
  showScanMeta?: boolean;
  /** Hide by-category when this cell is a historical scan without finding rows. */
  showCategoryMix?: boolean;
  /** Footer: View scan history (outlined). */
  viewScanLabel?: string;
  scanning?: boolean;
  onViewLastScan?: () => void;
  /** Footer: Start new scan (contained). */
  onStartScan?: () => void;
}

export const HealthScorePopover = ({
  repoName,
  quality: qualityProp,
  fontSize = 16,
  denomSize,
  openHint,
  showOpenIcon = false,
  showFindingsLink = false,
  showScanMeta = false,
  showCategoryMix = true,
  viewScanLabel = 'View scan history',
  scanning = false,
  onViewLastScan,
  onStartScan,
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
  const presentSev = SEVERITY_ORDER.filter(sev => (severityBreakdown[sev] ?? 0) > 0);
  const sha = lastScannedCommit ? shortSha(lastScannedCommit) : null;
  const findings = quality.violations ?? [];
  const cardStatus = getCardRemediationStatusLabel(quality.remediationStatus);
  const listCell = showScanMeta || showFindingsLink;
  const findingsLabel =
    totalViolations === 0
      ? 'No findings'
      : `${totalViolations} finding${totalViolations === 1 ? '' : 's'}`;

  return (
    <>
      <button
        type="button"
        className={`${classes.clickTarget}${showScanMeta ? ` ${classes.clickTargetStack}` : ''}`}
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchorEl)}
        aria-label={`Health score ${healthScore} out of 100. ${findingsLabel}. Opens findings by category and severity.`}
      >
        <span className={classes.scoreLock}>
          <QualityScoreMark
            score={healthScore}
            fontSize={fontSize}
            denomSize={denomSize}
            showDenom={!listCell}
          />
        </span>
        {openHint && <span className={classes.openHint}>{openHint}</span>}
        {showOpenIcon && (
          <InfoOutlinedIcon className={classes.openIcon} aria-hidden />
        )}
        {listCell && (
          <span className={showScanMeta ? classes.cellMeta : undefined}>
            <span className={classes.findingsLink}>{findingsLabel}</span>
            {showScanMeta && (
              <>
                {' · '}
                {lastScannedAt}
                {sha && (
                  <>
                    {' · '}
                    <span style={{ fontFamily: 'monospace' }}>{sha}</span>
                  </>
                )}
              </>
            )}
          </span>
        )}
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
            {cardStatus && (
              <Typography className={classes.meta}>
                Status: {cardStatus}
              </Typography>
            )}
            <Typography style={{ fontSize: 11, color: theme.palette.text.disabled, marginTop: 2, lineHeight: 1.45 }}>
              {HEALTH_SCORE_HINT}
            </Typography>
          </Box>

          {showCategoryMix ? <CategoryMixMini repoName={repoName} /> : null}

          {totalViolations > 0 && presentSev.length > 0 && (
            <Box className={classes.findings}>
              <Typography className={classes.sectionLabel}>
                By severity
              </Typography>
              {presentSev.map(sev => {
                const nodes = nodesForSeverity(findings, sev);
                const count = severityBreakdown[sev];
                return (
                  <Box key={sev}>
                    <Box className={classes.sevRow}>
                      <SeverityCountBadge severity={sev} count={count} />
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
            {onStartScan && (
              <Button
                size="small"
                color="primary"
                variant="contained"
                className={classes.pill}
                onClick={e => {
                  e.stopPropagation();
                  handleClose();
                  onStartScan();
                }}
              >
                Start new scan
              </Button>
            )}
            {onViewLastScan && (
              <Button
                size="small"
                color="primary"
                variant="outlined"
                className={classes.pill}
                onClick={e => {
                  e.stopPropagation();
                  handleClose();
                  onViewLastScan();
                }}
              >
                {viewScanLabel}
              </Button>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};
