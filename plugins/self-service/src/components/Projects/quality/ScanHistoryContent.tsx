import { useMemo, useCallback, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ArrowBack from '@material-ui/icons/ArrowBack';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { Table, TableColumn } from '@backstage/core-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  APME_CATEGORY_LABEL,
  APME_CATEGORY_ORDER,
  SEVERITY_COLORS,
  apmeCategoryOf,
  getProjectQuality,
  type ApmeRuleCategory,
  type QualityViolation,
  type RemediationStatus,
  type ScanResult,
  type SeverityClass,
} from '../detail/qualityDemoData';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import { CommitSha, shortSha } from './CommitSha';
import { snippetForFinding } from './findingCodeContext';
import { SeverityFilterChips } from './SeverityFilterChips';
import { parseScanCategoryParam } from './qualitySurfacePaths';

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

type FindingKind = QualityViolation['scope'];

const KIND_ORDER: FindingKind[] = [
  'task',
  'block',
  'play',
  'playbook',
  'role',
  'collection',
  'inventory',
];

const KIND_LABELS: Record<FindingKind, string> = {
  task: 'Task',
  block: 'Block',
  play: 'Play',
  playbook: 'Playbook',
  role: 'Role',
  collection: 'Collection',
  inventory: 'Inventory',
};

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
  tableHost: {
    '& table': {
      tableLayout: 'fixed',
      width: '100%',
    },
  },
  scanLink: {
    display: 'block',
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
    fontSize: 14,
    fontWeight: 400,
    color: theme.palette.text.primary,
    cursor: 'pointer',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '&:hover': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
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
  sevRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  kindControls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(2),
  },
  expandBox: {
    minWidth: 40,
    width: 40,
    height: 40,
    padding: 0,
    borderRadius: 4,
    textTransform: 'none',
    color: theme.palette.text.secondary,
  },
  kindSelect: {
    minWidth: 168,
  },
  categorySelect: {
    minWidth: 200,
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
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.3,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
    },
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
  findingRow: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  findingHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  chevron: {
    fontSize: 18,
    color: theme.palette.text.secondary,
    marginTop: 2,
    flexShrink: 0,
    transition: 'transform 0.15s ease',
  },
  chevronOpen: {
    transform: 'rotate(90deg)',
  },
  findingBody: {
    minWidth: 0,
    flex: 1,
  },
  findingPreview: {
    padding: theme.spacing(0, 0, 1.5, 4.5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  findingDesc: {
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
  },
  ruleId: {
    fontSize: 11,
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    color: theme.palette.text.disabled,
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
  },
  codeLineError: {
    backgroundColor:
      theme.palette.type === 'dark' ? 'rgba(201,25,11,0.12)' : '#ffeaea',
    borderLeft: `3px solid ${SEVERITY_COLORS.high}`,
    paddingLeft: 9,
  },
  codeLineNum: {
    width: 36,
    textAlign: 'right' as const,
    color: theme.palette.text.disabled,
    userSelect: 'none' as const,
    paddingRight: 12,
    flexShrink: 0,
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

function severityTooltip(breakdown: Record<SeverityClass, number>): string {
  const parts = SEV_ORDER.filter(sev => breakdown[sev] > 0).map(
    sev => `${sev.charAt(0).toUpperCase()}${sev.slice(1)} ${breakdown[sev]}`,
  );
  return parts.join(' · ') || 'No findings';
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

function SeverityFilterRow({
  breakdown,
  active,
  onToggle,
  category,
  categoryOptions,
  onCategoryChange,
  kind,
  kindOptions,
  onKindChange,
  canExpand,
  allExpanded,
  onToggleAll,
  classes,
}: {
  breakdown: Record<SeverityClass, number>;
  active: Set<SeverityClass>;
  onToggle: (sev: SeverityClass) => void;
  category: ApmeRuleCategory | 'all';
  categoryOptions: { id: ApmeRuleCategory; count: number }[];
  onCategoryChange: (category: ApmeRuleCategory | 'all') => void;
  kind: FindingKind | 'all';
  kindOptions: { kind: FindingKind; count: number }[];
  onKindChange: (kind: FindingKind | 'all') => void;
  canExpand?: boolean;
  allExpanded?: boolean;
  onToggleAll?: () => void;
  classes: ReturnType<typeof useStyles>;
}) {
  const present = SEV_ORDER.filter(sev => (breakdown[sev] ?? 0) > 0);
  const showCategory = categoryOptions.length >= 1;
  const showKind = kindOptions.length >= 2;
  if (present.length === 0 && !showCategory && !showKind && !canExpand) {
    return null;
  }
  return (
    <Box className={classes.sevRow}>
      <SeverityFilterChips
        breakdown={breakdown}
        active={active}
        onToggle={onToggle}
      />
      {(showCategory || showKind || canExpand) && (
        <Box className={classes.kindControls}>
            {canExpand && onToggleAll && (
              <Tooltip
                title={allExpanded ? 'Collapse all' : 'Expand all'}
                arrow
              >
                <Button
                  variant="outlined"
                  className={classes.expandBox}
                  onClick={onToggleAll}
                  aria-label={allExpanded ? 'Collapse all' : 'Expand all'}
                  aria-pressed={allExpanded}
                >
                  <ChevronRight
                    className={`${classes.chevron}${
                      allExpanded ? ` ${classes.chevronOpen}` : ''
                    }`}
                    style={{ marginTop: 0 }}
                  />
                </Button>
              </Tooltip>
            )}
            {showCategory && (
              <FormControl variant="outlined" size="small" className={classes.categorySelect}>
                <InputLabel id="scan-category-filter-label">Category</InputLabel>
                <Select
                  labelId="scan-category-filter-label"
                  label="Category"
                  value={category}
                  onChange={e =>
                    onCategoryChange(e.target.value as ApmeRuleCategory | 'all')
                  }
                >
                  <MenuItem value="all">All categories</MenuItem>
                  {categoryOptions.map(opt => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {APME_CATEGORY_LABEL[opt.id]} ({opt.count})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {showKind && (
              <FormControl variant="outlined" size="small" className={classes.kindSelect}>
                <InputLabel id="scan-kind-filter-label">Kind</InputLabel>
                <Select
                  labelId="scan-kind-filter-label"
                  label="Kind"
                  value={kind}
                  onChange={e => onKindChange(e.target.value as FindingKind | 'all')}
                >
                  <MenuItem value="all">All kinds</MenuItem>
                  {kindOptions.map(opt => (
                    <MenuItem key={opt.kind} value={opt.kind}>
                      {KIND_LABELS[opt.kind]} ({opt.count})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
      )}
    </Box>
  );
}

function ScanStateChip({ current }: { current: boolean }) {
  return current ? (
    <Tooltip title="Latest scan for this repository. The quality score is based on this snapshot." arrow>
      <Chip
        size="small"
        label="Latest"
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
  expanded,
  onToggle,
  classes,
}: {
  item: QualityViolation;
  expanded: boolean;
  onToggle: () => void;
  classes: ReturnType<typeof useStyles>;
}) {
  const snippet = snippetForFinding(item);
  const description = snippet?.detail || item.ruleDescription;

  return (
    <Box className={classes.findingRow}>
      <Box
        className={classes.findingHeader}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <ChevronRight
          className={`${classes.chevron}${expanded ? ` ${classes.chevronOpen}` : ''}`}
        />
        <Chip
          size="small"
          label={item.severity}
          style={{
            height: 20,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'capitalize',
            marginTop: 1,
            backgroundColor: `${SEVERITY_COLORS[item.severity]}22`,
            color: SEVERITY_COLORS[item.severity],
          }}
        />
        <Box className={classes.findingBody}>
          <Typography style={{ fontSize: 13 }}>{item.message}</Typography>
          <Typography
            style={{ fontSize: 12, fontFamily: 'monospace' }}
            color="textSecondary"
          >
            {item.file}:{item.lineStart}
          </Typography>
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Box className={classes.findingPreview}>
          {description ? (
            <Typography className={classes.findingDesc}>{description}</Typography>
          ) : null}
          {snippet ? (
            <Box className={classes.codeContext} aria-label="Code excerpt">
              {snippet.lines.map((line, i) => (
                <Box
                  key={`${line.num}-${i}`}
                  className={`${classes.codeLine}${
                    line.highlighted ? ` ${classes.codeLineError}` : ''
                  }`}
                >
                  <span className={classes.codeLineNum}>{line.num}</span>
                  <span className={classes.codeLineText}>{line.text}</span>
                </Box>
              ))}
            </Box>
          ) : null}
          <Typography className={classes.ruleId}>
            {item.ruleId}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

function ScanSnapshotDetail({
  row,
  currentScanId,
  initialCategory = 'all',
  onBack,
  onOpenRepo,
  onViewCurrent,
  onRemediate,
  onResume,
  onViewPullRequest,
}: {
  row: GlobalScanRow;
  currentScanId?: string;
  initialCategory?: ApmeRuleCategory | 'all';
  onBack: () => void;
  onOpenRepo: (name: string) => void;
  onViewCurrent: () => void;
  onRemediate: () => void;
  onResume: () => void;
  onViewPullRequest?: () => void;
}) {
  const classes = useStyles();
  const [severityFilters, setSeverityFilters] = useState<Set<SeverityClass>>(
    () => new Set(),
  );
  const [kindFilter, setKindFilter] = useState<FindingKind | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<
    ApmeRuleCategory | 'all'
  >(initialCategory);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const quality = getProjectQuality(row.repoName);
  const findings: QualityViolation[] =
    row.isLatest && quality ? quality.violations : [];
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
  const kindOptions = useMemo(() => {
    const counts = new Map<FindingKind, number>();
    for (const item of findings) {
      counts.set(item.scope, (counts.get(item.scope) ?? 0) + 1);
    }
    return KIND_ORDER.filter(kind => (counts.get(kind) ?? 0) > 0).map(kind => ({
      kind,
      count: counts.get(kind) ?? 0,
    }));
  }, [findings]);
  const visibleFindings = useMemo(() => {
    return findings.filter(item => {
      if (severityFilters.size > 0 && !severityFilters.has(item.severity)) {
        return false;
      }
      if (
        categoryFilter !== 'all' &&
        apmeCategoryOf(item) !== categoryFilter
      ) {
        return false;
      }
      if (kindFilter !== 'all' && item.scope !== kindFilter) return false;
      return true;
    });
  }, [findings, severityFilters, categoryFilter, kindFilter]);
  const filtersActive =
    severityFilters.size > 0 ||
    categoryFilter !== 'all' ||
    kindFilter !== 'all';
  const visibleKeys = useMemo(
    () => visibleFindings.map(findingKey),
    [visibleFindings],
  );
  const allExpanded =
    visibleKeys.length > 0 && visibleKeys.every(key => expandedKeys.has(key));
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

  const toggleFinding = useCallback((key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
          <Typography
            className={classes.detailTitle}
            onClick={() => onOpenRepo(row.repoName)}
          >
            {row.org}/{row.repoName}
          </Typography>
          <Box className={classes.meta} mt={0.5}>
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
              Resume remediation
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
      <SeverityFilterRow
        breakdown={row.severityBreakdown}
        active={severityFilters}
        onToggle={toggleSeverity}
        kind={kindFilter}
        kindOptions={kindOptions}
        onKindChange={setKindFilter}
        category={categoryFilter}
        categoryOptions={categoryOptions}
        onCategoryChange={setCategoryFilter}
        canExpand={visibleFindings.length > 0}
        allExpanded={allExpanded}
        onToggleAll={() =>
          setExpandedKeys(allExpanded ? new Set() : new Set(visibleKeys))
        }
        classes={classes}
      />
      {!row.isLatest && (
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ fontSize: 13, marginBottom: 16 }}
        >
          A later scan replaced this snapshot. Remediation uses the latest scan.
          {currentScanId ? (
            <>
              {' '}
              <Link component="button" onClick={onViewCurrent} underline="always">
                View latest scan
              </Link>
            </>
          ) : null}
        </Typography>
      )}
      {visibleFindings.length > 0 ? (
        visibleFindings.map(item => {
          const key = findingKey(item);
          return (
            <FindingPreviewRow
              key={key}
              item={item}
              expanded={expandedKeys.has(key)}
              onToggle={() => toggleFinding(key)}
              classes={classes}
            />
          );
        })
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
          This scan found no issues.
        </Typography>
      ) : null}
    </Box>
  );
}

export const ScanHistoryContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [repoFilter, setRepoFilter] = useState(
    () => searchParams.get('repo') || 'all',
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
      repoFilter === 'all'
        ? globalScans
        : globalScans.filter(row => row.repoName === repoFilter),
    [globalScans, repoFilter],
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
      title: 'When',
      field: 'createdAt',
      width: '22%',
      defaultSort: 'desc',
      customSort: (a, b) => parseScanDate(a.createdAt) - parseScanDate(b.createdAt),
      cellStyle: { whiteSpace: 'nowrap' as const },
      headerStyle: { whiteSpace: 'nowrap' as const },
      render: (row: GlobalScanRow) => (
        <Box>
          <Tooltip title={row.createdAt} arrow>
            <Link
              className={classes.scanLink}
              onClick={e => {
                e.stopPropagation();
                openScan(row.scanId);
              }}
            >
              {formatRelativeWhen(row.createdAt)}
            </Link>
          </Tooltip>
          <CommitSha sha={row.commitHash} />
        </Box>
      ),
    },
    {
      title: 'Repository',
      width: '30%',
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
      title: 'Scan',
      width: '16%',
      sorting: false,
      cellStyle: { whiteSpace: 'nowrap' as const },
      headerStyle: { whiteSpace: 'nowrap' as const },
      render: (row: GlobalScanRow) => <ScanStateChip current={row.isLatest} />,
    },
    {
      title: 'Findings',
      field: 'totalViolations',
      width: '20%',
      cellStyle: { whiteSpace: 'nowrap' as const },
      render: (row: GlobalScanRow) => (
        <Tooltip title={severityTooltip(row.severityBreakdown)} arrow>
          <Box className={classes.findingsCell}>
            <span className={classes.findingsCount}>
              {row.totalViolations === 0
                ? 'No findings'
                : `${row.totalViolations} finding${
                    row.totalViolations !== 1 ? 's' : ''
                  }`}
            </span>
            <FindingsBar breakdown={row.severityBreakdown} classes={classes} />
          </Box>
        </Tooltip>
      ),
    },
    {
      title: '',
      width: '12%',
      sorting: false,
      cellStyle: {
        whiteSpace: 'nowrap' as const,
        textAlign: 'right' as const,
        paddingRight: 8,
      },
      headerStyle: {
        textAlign: 'right' as const,
        paddingRight: 8,
      },
      render: (row: GlobalScanRow) => (
        <Button
          size="small"
          color="primary"
          variant="text"
          className={classes.viewDetailsBtn}
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
        onOpenRepo={openRepo}
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
          tableLayout: 'fixed',
          rowStyle: { cursor: 'pointer' },
        }}
        style={{ width: '100%', overflowX: 'hidden' }}
        emptyContent={
          <Box py={4} textAlign="center">
            <Typography color="textSecondary">
              No scans match this repository.
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
