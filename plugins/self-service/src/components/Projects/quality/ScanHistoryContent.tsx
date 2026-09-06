import { useMemo, useCallback, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ArrowBack from '@material-ui/icons/ArrowBack';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { fade } from '@material-ui/core/styles';
import { Table, TableColumn } from '@backstage/core-components';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import {
  APME_CATEGORY_HINT,
  APME_CATEGORY_LABEL,
  APME_CATEGORY_ORDER,
  SEVERITY_COLORS,
  apmeCategoryOf,
  getProjectQuality,
  qualityForScan,
  type ApmeRuleCategory,
  type QualityViolation,
  type RemediationStatus,
  type ScanResult,
  type SeverityClass,
} from '../detail/qualityDemoData';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import {
  HEALTH_SCORE_HINT,
  HealthScorePopover,
  QualityScoreMark,
} from '../catalog/HealthScorePopover';
import { CommitSha, shortSha } from './CommitSha';
import { snippetForFinding } from './findingCodeContext';
import { snippetForRule } from './spaWizardSnippets';
import { beforeOnlyDiff } from './qualityDiff';
import { SeverityFilterChips } from './SeverityFilterChips';
import { parseScanCategoryParam, scansListPath } from './qualitySurfacePaths';
import { QualityTabIntro } from './QualityTabIntro';
import { kindLabel } from './SpaRemediationReview';

type GlobalScanRow = ScanResult & {
  repoName: string;
  org: string;
  isLatest: boolean;
};

const SEV_ORDER: SeverityClass[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

const SEV_LABELS: Record<SeverityClass, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const SEV_TIPS: Record<SeverityClass, string> = {
  critical: 'Critical — Must fix before deployment',
  high: 'High — Should fix soon',
  medium: 'Medium — Recommended improvement',
  low: 'Low — Optional enhancement',
  info: 'Info — No action required',
};

type ScanFixLane = 'Auto-fix' | 'AI-fix' | 'Manual-fix';

const REMEDIATION_LANE_LABEL: Record<ScanFixLane, string> = {
  'Auto-fix': 'Auto remediation',
  'AI-fix': 'AI remediation',
  'Manual-fix': 'Manual remediation',
};

const LANE_EXPLAIN: Record<ScanFixLane, string> = {
  'Auto-fix': 'Ready-made replacements from Ansible quality rules.',
  'AI-fix':
    'Needs an AI-generated suggestion you review before it goes in the pull request.',
  'Manual-fix': 'No remediation found. Remediate this manually.',
};

function laneOf(item: QualityViolation): ScanFixLane {
  if (item.fixTier === 'deterministic') return 'Auto-fix';
  if (item.fixTier === 'ai') return 'AI-fix';
  return 'Manual-fix';
}

function findingKey(item: QualityViolation): string {
  return `${item.ruleId}-${item.file}-${item.lineStart}`;
}

const pill = {
  textTransform: 'none' as const,
  fontWeight: 600,
  borderRadius: 20,
};

const useStyles = makeStyles(theme => ({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  repoFilter: {
    minWidth: 260,
  },
  showFilter: {
    minWidth: 168,
  },
  tableHost: {
    '& table': {
      width: '100%',
    },
    '& thead th:last-child, & tbody td:last-child': {
      width: '1% !important',
      whiteSpace: 'nowrap',
    },
  },
  scanLink: {
    display: 'inline',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    '&:hover': { textDecoration: 'underline' },
  },
  repoLink: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  helpIcon: {
    fontSize: 14,
    color: theme.palette.text.disabled,
    cursor: 'help',
  },
  cta: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    flexShrink: 0,
  },
  findingsCount: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.4,
    color: theme.palette.text.primary,
  },
  viewDetailsBtn: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 14,
    whiteSpace: 'nowrap',
    minWidth: 'auto',
    paddingLeft: 8,
    paddingRight: 8,
  },
  findingsCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  bar: {
    display: 'flex',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
  },
  barCompact: {
    width: 96,
  },
  barFull: {
    width: '100%',
    marginTop: theme.spacing(1.5),
  },
  barSegment: {
    minWidth: 4,
    height: '100%',
  },
  findingToolbar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: theme.spacing(1),
    width: '100%',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  laneTabs: {
    minHeight: 36,
    '& .MuiTabs-flexContainer': {
      flexWrap: 'nowrap',
    },
    '& .MuiTabs-indicator': {
      height: 2,
    },
    '& .MuiTab-root': {
      minHeight: 36,
      minWidth: 0,
      padding: theme.spacing(0.75, 1.5, 0.75, 0),
      marginRight: theme.spacing(2),
      textTransform: 'none',
      fontSize: 14,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    },
    '& .MuiTab-root:last-child': {
      marginRight: 0,
    },
  },
  toolbarFilters: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    width: '100%',
  },
  searchFill: {
    flex: '1 1 220px',
    minWidth: 160,
    width: 'auto',
    '& .MuiOutlinedInput-root': {
      width: '100%',
    },
  },
  kindSelect: {
    minWidth: 168,
    flexShrink: 0,
  },
  findingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  backButton: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.text.secondary,
    padding: '4px 10px',
    marginLeft: -8,
    marginBottom: theme.spacing(1),
    minWidth: 0,
    borderRadius: 16,
    '& .MuiButton-startIcon': {
      marginRight: 6,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
  },
  detailTitle: {
    fontWeight: 700,
    fontSize: '1.5rem',
    lineHeight: 1.3,
    color: theme.palette.text.primary,
  },
  meta: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
  },
  metaDot: {
    color: theme.palette.text.disabled,
  },
  metaFindings: {
    fontWeight: 500,
  },
  healthMark: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'nowrap',
  },
  healthLabel: {
    fontSize: 13,
    fontWeight: 400,
    color: theme.palette.text.secondary,
  },
  filterStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
    marginBottom: 0,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  filterRowLabel: {
    ...theme.typography.caption,
    fontWeight: 600,
    letterSpacing: 0.2,
    color: theme.palette.text.secondary,
    minWidth: 64,
    textTransform: 'none' as const,
  },
  issueCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  findingHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
  },
  findingBody: {
    minWidth: 0,
    flex: 1,
  },
  findingTitle: {
    ...theme.typography.subtitle2,
    color: theme.palette.text.primary,
  },
  fileMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    height: 22,
    maxWidth: '100%',
  },
  fileMeta: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    wordBreak: 'break-word',
  },
  filePath: {
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
  },
  findingPreview: {
    padding: theme.spacing(0, 2, 1.5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  findingDesc: {
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
  },
  codeContext: {
    borderRadius: 4,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.divider}`,
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: 12,
    lineHeight: 1.6,
    backgroundColor:
      theme.palette.type === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa',
  },
  codeLine: {
    display: 'flex',
    padding: '0 12px',
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
    fontSize: 12,
    lineHeight: 1.55,
    whiteSpace: 'pre' as const,
  },
  codeLineDel: {
    backgroundColor: fade(theme.palette.error.main, theme.palette.type === 'dark' ? 0.22 : 0.12),
  },
  codeLineCtx: {
    backgroundColor:
      theme.palette.type === 'dark'
        ? fade(theme.palette.common.white, 0.04)
        : fade(theme.palette.common.black, 0.04),
  },
  codeLineText: {
    whiteSpace: 'pre' as const,
    color: theme.palette.text.primary,
  },
}));

function parseScanDate(createdAt: string): number {
  const t = Date.parse(createdAt);
  return Number.isNaN(t) ? 0 : t;
}

function formatRelativeWhen(createdAt: string): string {
  const t = parseScanDate(createdAt);
  if (!t) return createdAt;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return createdAt;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return createdAt;
}

function liveSession(status: RemediationStatus | undefined): boolean {
  return status === 'in-progress' || status === 'proposals-ready';
}

function FindingsBar({
  breakdown,
  classes,
  fullWidth = false,
  activeSeverities,
  onSegmentClick,
}: {
  breakdown: Record<SeverityClass, number>;
  classes: ReturnType<typeof useStyles>;
  fullWidth?: boolean;
  activeSeverities?: Set<SeverityClass>;
  onSegmentClick?: (sev: SeverityClass) => void;
}) {
  const total = SEV_ORDER.reduce((sum, sev) => sum + (breakdown[sev] ?? 0), 0);
  if (total === 0) return null;
  const anyActive = (activeSeverities?.size ?? 0) > 0;
  return (
    <Box
      className={`${classes.bar} ${fullWidth ? classes.barFull : classes.barCompact}`}
      role={onSegmentClick ? 'group' : undefined}
      aria-label={onSegmentClick ? 'Filter findings by severity' : undefined}
    >
      {SEV_ORDER.map(sev => {
        const count = breakdown[sev];
        if (count === 0) return null;
        const isActive = activeSeverities?.has(sev) ?? false;
        const segment = (
          <Box
            className={classes.barSegment}
            role={onSegmentClick ? 'button' : undefined}
            tabIndex={onSegmentClick ? 0 : undefined}
            aria-label={
              onSegmentClick
                ? `${SEV_LABELS[sev]} ${count}, ${isActive ? 'selected' : 'not selected'}`
                : undefined
            }
            onClick={onSegmentClick ? () => onSegmentClick(sev) : undefined}
            onKeyDown={
              onSegmentClick
                ? e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSegmentClick(sev);
                    }
                  }
                : undefined
            }
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: SEVERITY_COLORS[sev],
              cursor: onSegmentClick ? 'pointer' : 'default',
              opacity: anyActive && !isActive ? 0.35 : 1,
            }}
          />
        );
        return (
          <Box key={sev} style={{ flex: count, minWidth: 4, height: '100%' }}>
            {fullWidth ? (
              <Tooltip
                title={`${SEV_TIPS[sev]}. ${count} finding${count !== 1 ? 's' : ''}. Click to ${
                  isActive ? 'remove' : 'add'
                } filter.`}
                arrow
              >
                {segment}
              </Tooltip>
            ) : (
              segment
            )}
          </Box>
        );
      })}
    </Box>
  );
}

const LANE_ORDER: ScanFixLane[] = ['Auto-fix', 'AI-fix', 'Manual-fix'];

function SeverityFilterRow({
  breakdown,
  active,
  onToggle,
  categories,
  activeCategory,
  onToggleCategory,
  classes,
}: {
  breakdown: Record<SeverityClass, number>;
  active: Set<SeverityClass>;
  onToggle: (sev: SeverityClass) => void;
  categories: { id: string; label: string; count: number; hint: string }[];
  activeCategory: string;
  onToggleCategory: (id: string) => void;
  classes: ReturnType<typeof useStyles>;
}) {
  return (
    <Box className={classes.filterStack}>
      <Box className={classes.filterRow}>
        <Typography className={classes.filterRowLabel} component="span">
          Severity
        </Typography>
        <SeverityFilterChips
          breakdown={breakdown}
          active={active}
          onToggle={onToggle}
        />
      </Box>
      {categories.length > 0 ? (
        <Box className={classes.filterRow}>
          <Typography className={classes.filterRowLabel} component="span">
            Category
          </Typography>
          <SeverityFilterChips
            breakdown={{
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              info: 0,
            }}
            active={new Set()}
            onToggle={() => undefined}
            categories={categories}
            activeCategory={activeCategory}
            onToggleCategory={onToggleCategory}
          />
        </Box>
      ) : null}
    </Box>
  );
}

function ScanStateChip({ current }: { current: boolean }) {
  return current ? (
    <Tooltip title="Active scan for this repository. The health score is based on this snapshot." arrow>
      <Chip
        size="small"
        label="Active"
        style={{
          height: 20,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: 'rgba(0, 102, 204, 0.12)',
          color: '#0066CC',
        }}
      />
    </Tooltip>
  ) : (
    <Tooltip title="A later scan replaced this snapshot." arrow>
      <Chip
        size="small"
        label="Superseded"
        style={{
          height: 20,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: 'rgba(0,0,0,0.06)',
          color: '#6A6E73',
        }}
      />
    </Tooltip>
  );
}

function FindingPreviewRow({
  item,
  classes,
}: {
  item: QualityViolation;
  classes: ReturnType<typeof useStyles>;
}) {
  const snippet = snippetForFinding(item);
  const wizard = snippetForRule(item.ruleId);
  const beforeLines = beforeOnlyDiff(wizard.current, wizard.proposed);
  const description = snippet?.detail || item.ruleDescription;
  const itemLane = laneOf(item);
  const previewLines =
    beforeLines.length > 0
      ? beforeLines
      : (snippet?.lines ?? []).map(line => ({
          kind: line.highlighted ? ('del' as const) : ('context' as const),
          text: line.text,
        }));

  return (
    <Box className={classes.issueCard}>
      <Box className={classes.findingHeader}>
        <Box className={classes.findingBody}>
          <Typography className={classes.findingTitle} variant="subtitle2">
            {item.message}
          </Typography>
          <Box className={classes.fileMetaRow}>
            <Typography
              className={classes.fileMeta}
              variant="caption"
              color="textSecondary"
            >
              <span className={classes.filePath}>
                {item.file || 'Unknown file'}:{item.lineStart}
              </span>
              {' · '}
              {kindLabel(item)}
              {' · '}
              {item.ruleId}
            </Typography>
            <Box className={classes.chips}>
              <Chip
                size="small"
                label={SEV_LABELS[item.severity]}
                className={classes.chip}
                style={{
                  backgroundColor: SEVERITY_COLORS[item.severity],
                  color: '#fff',
                }}
              />
              <Chip
                size="small"
                variant="outlined"
                label={APME_CATEGORY_LABEL[apmeCategoryOf(item)]}
                className={classes.chip}
              />
              <Tooltip title={LANE_EXPLAIN[itemLane]} arrow>
                <Chip
                  size="small"
                  variant="outlined"
                  label={REMEDIATION_LANE_LABEL[itemLane]}
                  className={classes.chip}
                />
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
      {(description || previewLines.length > 0) && (
        <Box className={classes.findingPreview}>
          {description ? (
            <Typography className={classes.findingDesc}>{description}</Typography>
          ) : null}
          {previewLines.length > 0 ? (
            <Box className={classes.codeContext} aria-label="Code excerpt">
              {previewLines.map((line, i) => (
                <Box
                  key={`${line.kind}-${i}`}
                  className={`${classes.codeLine} ${
                    line.kind === 'del' ? classes.codeLineDel : classes.codeLineCtx
                  }`}
                >
                  <span className={classes.codeLineText}>{line.text || ' '}</span>
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

function ScanSnapshotDetail({
  row,
  currentScanId,
  initialCategory = 'all',
  onBack,
  onViewCurrent,
  onRemediate,
  onResume,
  onViewPullRequest,
}: {
  row: GlobalScanRow;
  currentScanId?: string;
  initialCategory?: ApmeRuleCategory | 'all';
  onBack: () => void;
  onViewCurrent: () => void;
  onRemediate: () => void;
  onResume: () => void;
  onViewPullRequest?: () => void;
}) {
  const classes = useStyles();
  const [severityFilters, setSeverityFilters] = useState<Set<SeverityClass>>(
    () => new Set(),
  );
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<
    ApmeRuleCategory | 'all'
  >(initialCategory);
  const [laneFilter, setLaneFilter] = useState<ScanFixLane | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const quality = getProjectQuality(row.repoName);
  const scanQuality = qualityForScan(row.repoName, row, row.isLatest);
  const findings: QualityViolation[] =
    row.isLatest && quality ? quality.violations : [];
  const laneCounts = useMemo(() => {
    const counts: Record<ScanFixLane, number> = {
      'Auto-fix': 0,
      'AI-fix': 0,
      'Manual-fix': 0,
    };
    for (const item of findings) {
      counts[laneOf(item)] += 1;
    }
    return counts;
  }, [findings]);
  const categoryOptions = useMemo(() => {
    const counts = new Map<ApmeRuleCategory, number>();
    for (const item of findings) {
      const id = apmeCategoryOf(item);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return APME_CATEGORY_ORDER.filter(id => (counts.get(id) ?? 0) > 0).map(
      id => ({
        id,
        count: counts.get(id) ?? 0,
      }),
    );
  }, [findings]);
  const categoryChips = useMemo(
    () =>
      categoryOptions.map(opt => ({
        id: opt.id,
        label: APME_CATEGORY_LABEL[opt.id],
        count: opt.count,
        hint: APME_CATEGORY_HINT[opt.id],
      })),
    [categoryOptions],
  );
  const kindOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of findings) {
      const label = kindLabel(item);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()].map(([kind, count]) => ({ kind, count }));
  }, [findings]);
  const visibleFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = findings.filter(item => {
      if (severityFilters.size > 0 && !severityFilters.has(item.severity)) {
        return false;
      }
      if (
        categoryFilter !== 'all' &&
        apmeCategoryOf(item) !== categoryFilter
      ) {
        return false;
      }
      if (kindFilter !== 'all' && kindLabel(item) !== kindFilter) return false;
      if (laneFilter !== 'all' && laneOf(item) !== laneFilter) return false;
      if (!q) return true;
      return (
        item.ruleId.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.file.toLowerCase().includes(q) ||
        APME_CATEGORY_LABEL[apmeCategoryOf(item)].toLowerCase().includes(q)
      );
    });
    return [...filtered].sort((a, b) => {
      const rank = SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity);
      if (rank !== 0) return rank;
      if (a.file !== b.file) return (a.file || '').localeCompare(b.file || '');
      return a.lineStart - b.lineStart;
    });
  }, [
    findings,
    severityFilters,
    categoryFilter,
    kindFilter,
    laneFilter,
    searchQuery,
  ]);
  const filtersActive =
    severityFilters.size > 0 ||
    categoryFilter !== 'all' ||
    kindFilter !== 'all' ||
    laneFilter !== 'all' ||
    searchQuery.trim() !== '';
  const status = quality?.remediationStatus;
  const showRemediate =
    row.isLatest && row.totalViolations > 0 && !liveSession(status) && status !== 'pr-open';
  const showResume = row.isLatest && liveSession(status);
  const showPr = row.isLatest && status === 'pr-open' && onViewPullRequest;

  const toggleSeverity = useCallback((sev: SeverityClass) => {
    setSeverityFilters(prev => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setCategoryFilter(prev => (prev === id ? 'all' : (id as ApmeRuleCategory)));
  }, []);

  return (
    <Box>
      <Button
        variant="text"
        color="inherit"
        size="small"
        className={classes.backButton}
        startIcon={<ArrowBack fontSize="small" />}
        onClick={onBack}
      >
        All scans
      </Button>
      <Box className={classes.headerRow}>
        <Box minWidth={0}>
          <Link
            component={RouterLink}
            to={`/self-service/repositories/${encodeURIComponent(row.repoName)}`}
            color="inherit"
            underline="hover"
            className={classes.detailTitle}
          >
            {row.org}/{row.repoName}
          </Link>
          <Box className={classes.meta} mt={0.5}>
            {scanQuality != null && (
              <>
                <Tooltip title={HEALTH_SCORE_HINT} arrow>
                  <span
                    className={classes.healthMark}
                    aria-label={`Health score ${scanQuality.healthScore} out of 100`}
                  >
                    <span className={classes.healthLabel}>Health score</span>
                    <QualityScoreMark
                      score={scanQuality.healthScore}
                      fontSize={16}
                    />
                  </span>
                </Tooltip>
                <span className={classes.metaDot}>·</span>
              </>
            )}
            <span className={classes.metaFindings}>
              {row.totalViolations === 0
                ? 'No findings'
                : `${row.totalViolations} finding${
                    row.totalViolations !== 1 ? 's' : ''
                  }`}
            </span>
            <span className={classes.metaDot}>·</span>
            <span>{row.createdAt}</span>
            <span className={classes.metaDot}>·</span>
            <span style={{ fontFamily: 'monospace' }}>{shortSha(row.commitHash)}</span>
            <ScanStateChip current={row.isLatest} />
          </Box>
        </Box>
        <Box display="flex" style={{ gap: 8, flexShrink: 0 }}>
          {showResume && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={pill}
              onClick={onResume}
            >
              Remediate
            </Button>
          )}
          {showPr && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={pill}
              onClick={onViewPullRequest}
            >
              View pull request
            </Button>
          )}
          {showRemediate && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={pill}
              onClick={onRemediate}
            >
              Remediate
            </Button>
          )}
        </Box>
      </Box>
      <FindingsBar
        breakdown={row.severityBreakdown}
        classes={classes}
        fullWidth
        activeSeverities={severityFilters}
        onSegmentClick={toggleSeverity}
      />
      {findings.length > 0 ? (
        <>
          <SeverityFilterRow
            breakdown={row.severityBreakdown}
            active={severityFilters}
            onToggle={toggleSeverity}
            categories={categoryChips}
            activeCategory={categoryFilter}
            onToggleCategory={toggleCategory}
            classes={classes}
          />
          <Box className={classes.findingToolbar}>
            <Tabs
              className={classes.laneTabs}
              value={laneFilter}
              onChange={(_event, value: ScanFixLane | 'all') =>
                setLaneFilter(value)
              }
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="off"
              aria-label="Findings by remediation type"
            >
              <Tab value="all" label={`All ${findings.length}`} />
              {LANE_ORDER.map(id => {
                const count = laneCounts[id];
                return (
                  <Tab
                    key={id}
                    value={id}
                    disabled={count === 0}
                    label={
                      <Tooltip title={LANE_EXPLAIN[id]} arrow>
                        <span>
                          {REMEDIATION_LANE_LABEL[id]} {count}
                        </span>
                      </Tooltip>
                    }
                  />
                );
              })}
            </Tabs>
            <Box className={classes.toolbarFilters}>
              <TextField
                className={classes.searchFill}
                size="small"
                variant="outlined"
                placeholder="Search findings"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                inputProps={{ 'aria-label': 'Search findings' }}
              />
              <FormControl
                variant="outlined"
                size="small"
                className={classes.kindSelect}
              >
                <InputLabel id="scan-content-type-filter-label">
                  Content type
                </InputLabel>
                <Select
                  labelId="scan-content-type-filter-label"
                  label="Content type"
                  value={kindFilter}
                  onChange={e => setKindFilter(e.target.value as string)}
                >
                  <MenuItem value="all">All content types</MenuItem>
                  {kindOptions.map(opt => (
                    <MenuItem key={opt.kind} value={opt.kind}>
                      {opt.kind} ({opt.count})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </>
      ) : null}
      {!row.isLatest && (
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ fontSize: 13, marginBottom: 16 }}
        >
          A later scan replaced this snapshot. Remediation uses the active scan.
          {currentScanId ? (
            <>
              {' '}
              <Link component="button" onClick={onViewCurrent} underline="always">
                View active scan
              </Link>
            </>
          ) : null}
        </Typography>
      )}
      {visibleFindings.length > 0 ? (
        <Box className={classes.findingList}>
          {visibleFindings.map(item => (
              <FindingPreviewRow
                key={findingKey(item)}
                item={item}
                classes={classes}
              />
            ))}
        </Box>
      ) : findings.length > 0 && filtersActive ? (
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 13 }}>
          No findings match the current filters.
        </Typography>
      ) : row.totalViolations > 0 && !row.isLatest ? (
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 13 }}>
          Finding list is on the latest scan.
        </Typography>
      ) : row.totalViolations === 0 ? (
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 13 }}>
          No findings on this scan.
        </Typography>
      ) : null}
    </Box>
  );
}

export const ScanHistoryContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { experience } = useNavIaModel();
  const [searchParams, setSearchParams] = useSearchParams();
  const [repoFilter, setRepoFilter] = useState(
    () => searchParams.get('repo') || 'all',
  );
  const [showFilter, setShowFilter] = useState<'all' | 'latest' | 'superseded'>(
    'all',
  );

  const globalScans: GlobalScanRow[] = useMemo(() => {
    const rows: GlobalScanRow[] = [];
    for (const repo of GIT_REPOSITORIES) {
      const q = getProjectQuality(repo.name);
      if (!q) continue;
      const latestId = q.latestScan.scanId;
      const scans = q.scanHistory.length > 0 ? q.scanHistory : [q.latestScan];
      for (const scan of scans) {
        const isLatest = scan.scanId === latestId;
        rows.push({
          ...scan,
          repoName: repo.name,
          org: repo.org,
          isLatest,
        });
      }
    }
    rows.sort((a, b) => parseScanDate(b.createdAt) - parseScanDate(a.createdAt));
    return rows;
  }, []);

  const snapshot = useMemo(() => {
    const scanId = searchParams.get('scan');
    if (!scanId) return null;
    return globalScans.find(s => s.scanId === scanId) ?? null;
  }, [globalScans, searchParams]);

  const repoOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of globalScans) {
      if (!seen.has(row.repoName)) {
        seen.set(row.repoName, `${row.org}/${row.repoName}`);
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [globalScans]);

  const filteredScans = useMemo(
    () =>
      globalScans.filter(row => {
        if (repoFilter !== 'all' && row.repoName !== repoFilter) return false;
        if (showFilter === 'latest' && !row.isLatest) return false;
        if (showFilter === 'superseded' && row.isLatest) return false;
        return true;
      }),
    [globalScans, repoFilter, showFilter],
  );

  const setScanParam = useCallback(
    (scanId: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (scanId) next.set('scan', scanId);
      else next.delete('scan');
      next.delete('category');
      if (repoFilter !== 'all') next.set('repo', repoFilter);
      else next.delete('repo');
      setSearchParams(next);
    },
    [repoFilter, searchParams, setSearchParams],
  );

  const openRepo = useCallback(
    (repoName: string) => {
      navigate(`/self-service/repositories/${encodeURIComponent(repoName)}`);
    },
    [navigate],
  );

  const sessionPath = (repoName: string, resume?: boolean) => {
    const qs = new URLSearchParams({ from: 'scans' });
    if (resume) qs.set('resume', '1');
    return `/self-service/apme/remediate/${encodeURIComponent(repoName)}?${qs.toString()}`;
  };

  const openScan = useCallback(
    (scanId: string) => {
      setScanParam(scanId);
    },
    [setScanParam],
  );

  const columns: TableColumn<GlobalScanRow>[] = [
    {
      title: 'Scan',
      field: 'createdAt',
      width: '33%',
      defaultSort: 'desc',
      customSort: (a, b) => parseScanDate(a.createdAt) - parseScanDate(b.createdAt),
      cellStyle: { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const },
      headerStyle: { whiteSpace: 'nowrap' as const },
      render: (row: GlobalScanRow) => (
        <Box>
          <Box display="flex" alignItems="center" style={{ gap: 8, minWidth: 0 }}>
            <Tooltip title={formatRelativeWhen(row.createdAt)} arrow>
              <Link
                className={classes.scanLink}
                onClick={e => {
                  e.stopPropagation();
                  openScan(row.scanId);
                }}
              >
                {row.createdAt}
              </Link>
            </Tooltip>
            <ScanStateChip current={row.isLatest} />
          </Box>
          <CommitSha sha={row.commitHash} />
        </Box>
      ),
    },
    {
      title: 'Repository',
      width: '33%',
      cellStyle: {
        overflow: 'hidden',
      },
      render: (row: GlobalScanRow) => (
        <Link
          className={classes.repoLink}
          onClick={e => {
            e.stopPropagation();
            openRepo(row.repoName);
          }}
        >
          {row.org}/{row.repoName}
        </Link>
      ),
    },
    {
      title: (
        <Box display="flex" alignItems="center" style={{ gap: 4, whiteSpace: 'nowrap' }}>
          Health
          <Tooltip title={HEALTH_SCORE_HINT} arrow>
            <HelpOutlineIcon className={classes.helpIcon} />
          </Tooltip>
        </Box>
      ) as unknown as string,
      width: '33%',
      cellStyle: { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const },
      customSort: (a: GlobalScanRow, b: GlobalScanRow) => {
        const qa = qualityForScan(a.repoName, a, a.isLatest);
        const qb = qualityForScan(b.repoName, b, b.isLatest);
        return (qa?.healthScore ?? -1) - (qb?.healthScore ?? -1);
      },
      render: (row: GlobalScanRow) => (
        <HealthScorePopover
          repoName={row.repoName}
          quality={qualityForScan(row.repoName, row, row.isLatest)}
          showFindingsLink
          showCategoryMix={row.isLatest}
          onStartScan={() => navigate(sessionPath(row.repoName))}
          onViewLastScan={() =>
            navigate(
              `${scansListPath(experience)}?${new URLSearchParams({
                repo: row.repoName,
              }).toString()}`,
            )
          }
        />
      ),
    },
    {
      title: 'Action',
      width: '1%',
      sorting: false,
      cellStyle: {
        whiteSpace: 'nowrap' as const,
        textAlign: 'left' as const,
        width: 1,
        paddingLeft: 16,
        paddingRight: 16,
      },
      headerStyle: {
        textAlign: 'left' as const,
        whiteSpace: 'nowrap' as const,
        width: 1,
        paddingLeft: 16,
        paddingRight: 16,
      },
      render: (row: GlobalScanRow) => (
        <Button
          size="small"
          color="primary"
          variant="outlined"
          className={classes.cta}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            openScan(row.scanId);
          }}
        >
          View details
        </Button>
      ),
    },
  ];

  if (snapshot) {
    const currentForRepo = globalScans.find(
      s => s.repoName === snapshot.repoName && s.isLatest,
    );
    const quality = getProjectQuality(snapshot.repoName);
    return (
      <ScanSnapshotDetail
        key={`${snapshot.scanId}-${searchParams.get('category') || 'all'}`}
        row={snapshot}
        currentScanId={currentForRepo?.scanId}
        initialCategory={parseScanCategoryParam(searchParams.get('category'))}
        onBack={() => setScanParam(null)}
        onViewCurrent={() => {
          if (currentForRepo) setScanParam(currentForRepo.scanId);
        }}
        onRemediate={() => navigate(sessionPath(snapshot.repoName))}
        onResume={() => navigate(sessionPath(snapshot.repoName, true))}
        onViewPullRequest={
          quality?.remediationPrUrl
            ? () =>
                window.open(quality.remediationPrUrl, '_blank', 'noopener,noreferrer')
            : undefined
        }
      />
    );
  }

  return (
    <Box>
      <QualityTabIntro>
        Every scan as a receipt. Active is the most recent completed scan per
        repository; older scans are superseded.
      </QualityTabIntro>
      <Box className={classes.toolbar}>
        <FormControl
          variant="outlined"
          size="small"
          className={classes.repoFilter}
        >
          <InputLabel id="scan-history-repo-label">Repository</InputLabel>
          <Select
            labelId="scan-history-repo-label"
            label="Repository"
            value={repoFilter}
            onChange={e => setRepoFilter(e.target.value as string)}
          >
            <MenuItem value="all">All repositories</MenuItem>
            {repoOptions.map(([name, label]) => (
              <MenuItem key={name} value={name}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          variant="outlined"
          size="small"
          className={classes.showFilter}
        >
          <InputLabel id="scan-history-show-label">Show</InputLabel>
          <Select
            labelId="scan-history-show-label"
            label="Show"
            value={showFilter}
            onChange={e =>
              setShowFilter(e.target.value as 'all' | 'latest' | 'superseded')
            }
          >
            <MenuItem value="all">All scans</MenuItem>
            <MenuItem value="latest">Active</MenuItem>
            <MenuItem value="superseded">Superseded</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box className={classes.tableHost}>
      <Table<GlobalScanRow>
        columns={columns}
        data={filteredScans}
        title=""
        options={{
          paging: filteredScans.length > 20,
          pageSize: 20,
          pageSizeOptions: [10, 20, 50],
          emptyRowsWhenPaging: false,
          search: false,
          sorting: true,
          padding: 'dense',
          header: true,
          rowStyle: { cursor: 'pointer' },
        }}
        style={{ width: '100%', overflowX: 'hidden' }}
        emptyContent={
          <Box py={4} textAlign="center">
            <Typography color="textSecondary">
              No scans match these filters.
            </Typography>
          </Box>
        }
        onRowClick={(event, rowData) => {
          const el = (event as { target?: EventTarget } | undefined)?.target;
          if (el instanceof Element && el.closest('button, a, [role="button"]')) {
            return;
          }
          if (rowData) setScanParam((rowData as GlobalScanRow).scanId);
        }}
      />
      </Box>
    </Box>
  );
};
