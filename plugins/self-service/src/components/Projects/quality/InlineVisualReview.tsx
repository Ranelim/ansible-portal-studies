/**
 * Visual redesign of Inline AI Results & Remediation (`?wizard=visual`).
 * Results (scan mix) + Remediation (findings). Does not change Inline AI.
 */

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { fade, type Theme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import {
  APME_CATEGORY_HINT,
  APME_CATEGORY_LABEL,
  APME_CATEGORY_ORDER,
  SEVERITY_COLORS,
  apmeCategoryOf,
  type ApmeRuleCategory,
  type QualityViolation,
  type SeverityClass,
} from '../detail/qualityDemoData';
import { SeverityFilterChips } from './SeverityFilterChips';
import { SeverityMixBar } from './SeverityMixBar';
import {
  findingKey,
  kindLabel,
  type AiRowStatus,
  type WizardDecision,
} from './SpaRemediationReview';
import { snippetForRule } from './spaWizardSnippets';
import { unifiedDiff, type DiffLine } from './qualityDiff';

const PILL = { borderRadius: 20, textTransform: 'none' as const, fontWeight: 600 };
const PILL_COMPACT = { ...PILL, minWidth: 0, padding: '2px 12px' };

const SEV_LABEL: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

type FixLane = 'Auto-fix' | 'AI-fix' | 'Manual-fix';
const SEV_ORDER: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];
const FINDINGS_BAR_HEIGHT = 6;

const LANE_TIP: Record<FixLane, string> = {
  'Auto-fix': 'Can be applied automatically. Accept or Decline the proposed change.',
  'AI-fix': 'Needs an AI suggestion. Generate one, then Accept or Decline it.',
  'Manual-fix': 'No automatic or AI suggestion. Change this in the file.',
};

function laneOf(v: QualityViolation): FixLane {
  if (v.fixTier === 'deterministic') return 'Auto-fix';
  if (v.fixTier === 'ai') return 'AI-fix';
  return 'Manual-fix';
}

function emptySev(): Record<SeverityClass, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function mixFromFindings(findings: QualityViolation[]) {
  const bySeverity = emptySev();
  const catMap = new Map<ApmeRuleCategory, Record<SeverityClass, number>>();
  findings.forEach(f => {
    bySeverity[f.severity] += 1;
    const id = apmeCategoryOf(f);
    const rec = catMap.get(id) ?? emptySev();
    rec[f.severity] += 1;
    catMap.set(id, rec);
  });
  const categories = APME_CATEGORY_ORDER.filter(id => catMap.has(id)).map(id => {
    const breakdown = catMap.get(id)!;
    const count = SEV_ORDER.reduce((sum, sev) => sum + breakdown[sev], 0);
    return {
      id,
      label: APME_CATEGORY_LABEL[id],
      hint: APME_CATEGORY_HINT[id],
      count,
      breakdown,
    };
  });
  return { total: findings.length, bySeverity, categories };
}

function groupByFile(findings: QualityViolation[]): { file: string; findings: QualityViolation[] }[] {
  const map = new Map<string, QualityViolation[]>();
  findings.forEach(f => {
    const file = f.file || 'Unknown file';
    const list = map.get(file) ?? [];
    list.push(f);
    map.set(file, list);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, list]) => ({
      file,
      findings: [...list].sort((a, b) => a.lineStart - b.lineStart),
    }));
}

const useStyles = makeStyles((theme: Theme) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  box: {
    borderRadius: 8,
    backgroundColor: theme.palette.background.paper,
  },
  boxHead: {
    padding: theme.spacing(2, 2, 0),
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  resultsBody: {
    padding: theme.spacing(1.5, 2, 2),
  },
  mixHeader: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
  },
  mixTotal: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  mixMeta: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  mixBar: {
    height: FINDINGS_BAR_HEIGHT,
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: theme.spacing(1.5),
  },
  drawerToggle: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 13,
    color: theme.palette.text.secondary,
    padding: '4px 10px',
    marginLeft: -10,
    minWidth: 0,
    borderRadius: 16,
    '& .MuiButton-endIcon': {
      marginLeft: 4,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
  },
  mixChips: {
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(1.25),
    borderTop: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    borderRadius: 4,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  catRowSelected: {
    backgroundColor: theme.palette.action.selected,
  },
  catName: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 180,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 500,
  },
  catHelp: {
    fontSize: 14,
    color: theme.palette.text.disabled,
    cursor: 'help',
  },
  catCount: {
    height: 20,
    fontSize: 11,
    fontWeight: 600,
    flexShrink: 0,
  },
  catBar: {
    flex: 1,
    minWidth: 80,
    height: FINDINGS_BAR_HEIGHT,
    display: 'flex',
    alignItems: 'center',
  },
  remediationHead: {
    position: 'sticky',
    top: 52,
    zIndex: 1,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  remediationRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    marginTop: theme.spacing(1.25),
  },
  summaryNote: {
    flex: '1 1 220px',
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
  },
  jobCount: {
    display: 'block',
    marginTop: 2,
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  jobActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
  },
  progress: { marginTop: theme.spacing(1.5), height: 4, borderRadius: 2 },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 2, 0),
  },
  search: { width: 220 },
  select: { minWidth: 168 },
  fileList: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  empty: {
    padding: theme.spacing(3, 2),
  },
  issueCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
  },
  cardCopy: { minWidth: 0, flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
    color: theme.palette.text.primary,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 },
  chip: { height: 22, fontWeight: 600 },
  fileMeta: {
    marginTop: 4,
    fontSize: 12,
    color: theme.palette.text.secondary,
    wordBreak: 'break-all',
  },
  filePath: {
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
  },
  cardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    flexShrink: 0,
    paddingTop: 2,
  },
  rowAccept: { backgroundColor: fade(theme.palette.success.main, 0.06) },
  rowDecline: { backgroundColor: fade(theme.palette.error.main, 0.06) },
  diffBlock: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5, 2, 2),
  },
  diffEmpty: {
    padding: theme.spacing(1, 0),
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  suggestionEmpty: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: theme.spacing(1, 0),
    minHeight: 40,
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  diffLine: {
    display: 'flex',
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
    fontSize: 12,
    lineHeight: 1.55,
    padding: theme.spacing(0, 1),
    whiteSpace: 'pre',
    overflow: 'auto',
  },
  gutter: {
    width: 16,
    flexShrink: 0,
    userSelect: 'none',
    fontWeight: 700,
  },
  del: {
    backgroundColor: fade(theme.palette.error.main, theme.palette.type === 'dark' ? 0.22 : 0.12),
  },
  add: {
    backgroundColor: fade(theme.palette.success.main, theme.palette.type === 'dark' ? 0.22 : 0.12),
  },
  delMark: { color: theme.palette.error.main },
  addMark: { color: theme.palette.success.main },
}));

export const InlineVisualReview: React.FC<{
  findings: QualityViolation[];
  t1Decisions: Record<string, WizardDecision>;
  setT1Decisions?: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  aiDecisions: Record<string, WizardDecision>;
  setAiDecisions?: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  aiStatus: Record<string, AiRowStatus>;
  onGenerateAi?: (key: string) => void;
  onNext: () => void;
  onCancel: () => void;
}> = ({
  findings,
  t1Decisions,
  setT1Decisions,
  aiDecisions,
  setAiDecisions,
  aiStatus,
  onGenerateAi,
  onNext,
  onCancel,
}) => {
  const classes = useStyles();
  const decisions = { ...t1Decisions, ...aiDecisions };
  const auto = findings.filter(v => v.fixTier === 'deterministic');
  const ai = findings.filter(v => v.fixTier === 'ai');
  const lanes = useMemo(() => {
    const set = new Set<FixLane>();
    findings.forEach(f => set.add(laneOf(f)));
    return Array.from(set);
  }, [findings]);
  const contentTypes = useMemo(() => Array.from(new Set(findings.map(kindLabel))).sort(), [findings]);
  const sevs = useMemo(() => Array.from(new Set(findings.map(f => f.severity))), [findings]);

  const mix = useMemo(() => mixFromFindings(findings), [findings]);
  const presentCategories = useMemo(
    () => mix.categories.map(c => c.id),
    [mix.categories],
  );

  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<'all' | string>('all');
  const [category, setCategory] = useState<'all' | ApmeRuleCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<Set<SeverityClass>>(() => new Set());
  const [fixType, setFixType] = useState<'all' | FixLane>('all');
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const toggleSeverity = (sev: SeverityClass) => {
    setBreakdownOpen(true);
    setSeverityFilter(prev => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };
  const toggleCategory = (id: ApmeRuleCategory) => {
    setCategory(prev => (prev === id ? 'all' : id));
    setBreakdownOpen(true);
  };

  const visibleCategories = useMemo(() => {
    const any = severityFilter.size > 0;
    return mix.categories
      .map(cat => {
        const breakdown = { ...cat.breakdown };
        if (any) {
          for (const sev of SEV_ORDER) {
            if (!severityFilter.has(sev)) breakdown[sev] = 0;
          }
        }
        const count = SEV_ORDER.reduce((sum, sev) => sum + (breakdown[sev] ?? 0), 0);
        return { ...cat, breakdown, count };
      })
      .filter(cat => cat.count > 0);
  }, [mix.categories, severityFilter]);

  const pendingT1 = auto.filter(v => !t1Decisions[findingKey(v)]).length;
  const readyAi = ai.filter(v => aiStatus[findingKey(v)] === 'ready');
  const pendingGeneratedAi = readyAi.filter(v => !aiDecisions[findingKey(v)]).length;
  const aiLoading = ai.some(v => aiStatus[findingKey(v)] === 'loading');
  const mustDecide = auto.length + readyAi.length;
  const decidedMust =
    auto.filter(v => Boolean(t1Decisions[findingKey(v)])).length +
    readyAi.filter(v => Boolean(aiDecisions[findingKey(v)])).length;
  const nextLocked = pendingT1 > 0 || pendingGeneratedAi > 0 || aiLoading;

  const filtered = findings.filter(f => {
    if (contentType !== 'all' && kindLabel(f) !== contentType) return false;
    if (category !== 'all' && apmeCategoryOf(f) !== category) return false;
    if (severityFilter.size > 0 && !severityFilter.has(f.severity)) return false;
    if (fixType !== 'all' && laneOf(f) !== fixType) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      f.ruleId.toLowerCase().includes(q) ||
      f.message.toLowerCase().includes(q) ||
      f.file.toLowerCase().includes(q)
    );
  });
  const files = groupByFile(filtered);
  const visibleAuto = filtered.filter(v => v.fixTier === 'deterministic' && !t1Decisions[findingKey(v)]);
  const visibleReadyAi = filtered.filter(
    v => v.fixTier === 'ai' && aiStatus[findingKey(v)] === 'ready' && !aiDecisions[findingKey(v)],
  );
  const pendingVisible = visibleAuto.length + visibleReadyAi.length;
  const hiddenPending =
    pendingT1 - visibleAuto.length + (pendingGeneratedAi - visibleReadyAi.length);

  const decideItems = (items: QualityViolation[], value: WizardDecision | null) => {
    items.forEach(v => {
      const k = findingKey(v);
      const setter = v.fixTier === 'ai' ? setAiDecisions : setT1Decisions;
      setter?.(prev => {
        const next = { ...prev };
        if (value === null) delete next[k];
        else if (!next[k]) next[k] = value;
        return next;
      });
    });
  };

  const onDecision = (v: QualityViolation, d: WizardDecision) => {
    const k = findingKey(v);
    if (v.fixTier === 'ai') setAiDecisions?.(prev => ({ ...prev, [k]: d }));
    else setT1Decisions?.(prev => ({ ...prev, [k]: d }));
  };

  const jobTitle =
    pendingT1 > 0
      ? 'Accept or Decline every auto-fix to continue.'
      : pendingGeneratedAi > 0
        ? 'Accept or Decline every generated AI suggestion to continue.'
        : aiLoading
          ? 'Wait for AI suggestions to finish generating.'
          : 'Continue to commit. Un-generated AI findings stay in the file.';

  const jobCount =
    mustDecide === 0
      ? 'No auto-fixes to decide.'
      : `${decidedMust} of ${mustDecide} decided${
          hiddenPending > 0 ? ' · some hidden by filters' : ''
        }.`;

  const severitySelect =
    severityFilter.size === 1 ? Array.from(severityFilter)[0] : 'all';
  const findingWord = mix.total === 1 ? 'finding' : 'findings';

  return (
    <div className={classes.stack}>
      <Paper className={classes.box} elevation={2}>
        <div className={classes.boxHead}>
          <Typography className={classes.boxTitle}>Summary</Typography>
        </div>
        <div className={classes.resultsBody}>
          <div className={classes.mixHeader}>
            <Typography className={classes.mixTotal} component="span">
              {mix.total}
            </Typography>
            <Typography className={classes.mixMeta} component="span">
              {findingWord} on this scan
            </Typography>
          </div>
          <div className={classes.mixBar}>
            <SeverityMixBar
              breakdown={mix.bySeverity}
              height={FINDINGS_BAR_HEIGHT}
              activeSeverities={severityFilter}
              onSegmentClick={toggleSeverity}
            />
          </div>
          <div className={classes.toggleRow}>
            <Button
              variant="text"
              color="inherit"
              size="small"
              className={classes.drawerToggle}
              endIcon={breakdownOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              aria-expanded={breakdownOpen}
              onClick={() => setBreakdownOpen(open => !open)}
            >
              {breakdownOpen ? 'Hide breakdown' : 'Show breakdown'}
            </Button>
          </div>
          <Collapse in={breakdownOpen}>
            <div className={classes.mixChips}>
              <SeverityFilterChips
                breakdown={mix.bySeverity}
                active={severityFilter}
                onToggle={toggleSeverity}
              />
            </div>
            {visibleCategories.map(cat => (
              <div
                key={cat.id}
                className={`${classes.catRow} ${
                  category === cat.id ? classes.catRowSelected : ''
                }`}
                role="button"
                tabIndex={0}
                aria-pressed={category === cat.id}
                aria-label={`${cat.label}, ${cat.count} findings. ${
                  category === cat.id ? 'Clear' : 'Apply'
                } filter.`}
                onClick={() => toggleCategory(cat.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleCategory(cat.id);
                  }
                }}
              >
                <Typography className={classes.catName} component="div">
                  {cat.label}
                  <Tooltip title={cat.hint} arrow>
                    <HelpOutlineIcon
                      className={classes.catHelp}
                      onClick={event => event.stopPropagation()}
                      onKeyDown={event => event.stopPropagation()}
                    />
                  </Tooltip>
                </Typography>
                <Chip size="small" label={cat.count} className={classes.catCount} />
                <div className={classes.catBar}>
                  <SeverityMixBar breakdown={cat.breakdown} height={FINDINGS_BAR_HEIGHT} />
                </div>
              </div>
            ))}
          </Collapse>
        </div>
      </Paper>

      <Paper className={classes.box} elevation={2}>
        <div className={classes.remediationHead}>
          <Typography className={classes.boxTitle}>Findings and remediations</Typography>
          <div className={classes.remediationRow}>
            <Typography className={classes.summaryNote}>
              {jobTitle}
              <span className={classes.jobCount}>{jobCount}</span>
            </Typography>
            <div className={classes.jobActions}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<CheckIcon />}
                disabled={pendingVisible === 0}
                onClick={() => decideItems([...visibleAuto, ...visibleReadyAi], 'accept')}
                style={PILL}
              >
                Accept remaining{pendingVisible > 0 ? ` (${pendingVisible})` : ''}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<CloseIcon />}
                disabled={pendingVisible === 0}
                onClick={() => decideItems([...visibleAuto, ...visibleReadyAi], 'decline')}
                style={PILL}
              >
                Decline remaining
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={nextLocked}
                onClick={onNext}
                style={PILL}
              >
                Continue to commit
              </Button>
              <Button size="small" variant="outlined" onClick={onCancel} style={PILL}>
                Cancel
              </Button>
            </div>
          </div>
          {mustDecide > 0 && (
            <LinearProgress
              className={classes.progress}
              variant="determinate"
              value={Math.round((decidedMust / mustDecide) * 100)}
            />
          )}
        </div>

        <div className={classes.toolbar}>
          <TextField
            className={classes.search}
            size="small"
            variant="outlined"
            placeholder="Search findings"
            value={query}
            onChange={e => setQuery(e.target.value)}
            inputProps={{ 'aria-label': 'Search findings' }}
          />
          <FormControl variant="outlined" size="small" className={classes.select}>
            <InputLabel id="visual-content-type-label">Content type</InputLabel>
            <Select
              labelId="visual-content-type-label"
              label="Content type"
              value={contentType}
              onChange={e => setContentType(e.target.value as string)}
            >
              <MenuItem value="all">All content types</MenuItem>
              {contentTypes.map(k => (
                <MenuItem key={k} value={k}>
                  {k} ({findings.filter(f => kindLabel(f) === k).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" className={classes.select}>
            <InputLabel id="visual-category-label">Category</InputLabel>
            <Select
              labelId="visual-category-label"
              label="Category"
              value={category}
              onChange={e => setCategory(e.target.value as 'all' | ApmeRuleCategory)}
            >
              <MenuItem value="all">All categories</MenuItem>
              {presentCategories.map(id => (
                <MenuItem key={id} value={id}>
                  {APME_CATEGORY_LABEL[id]} (
                  {findings.filter(f => apmeCategoryOf(f) === id).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" className={classes.select}>
            <InputLabel id="visual-severity-label">Severity</InputLabel>
            <Select
              labelId="visual-severity-label"
              label="Severity"
              value={severitySelect}
              onChange={e => {
                const value = e.target.value as string;
                setSeverityFilter(
                  value === 'all' ? new Set() : new Set([value as SeverityClass]),
                );
              }}
            >
              <MenuItem value="all">All severities</MenuItem>
              {sevs.map(s => (
                <MenuItem key={s} value={s}>
                  {SEV_LABEL[s] ?? s} ({findings.filter(f => f.severity === s).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" className={classes.select}>
            <InputLabel id="visual-fix-type-label">Fix type</InputLabel>
            <Select
              labelId="visual-fix-type-label"
              label="Fix type"
              value={fixType}
              onChange={e => setFixType(e.target.value as 'all' | FixLane)}
            >
              <MenuItem value="all">All fix types</MenuItem>
              {lanes.map(lane => (
                <MenuItem key={lane} value={lane}>
                  {lane} ({findings.filter(f => laneOf(f) === lane).length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {files.length === 0 ? (
          <Typography className={classes.empty} color="textSecondary">
            No findings match the current filters.
          </Typography>
        ) : (
          <div className={classes.fileList}>
            {files.flatMap(group => group.findings).map(f => (
              <FindingRow
                key={findingKey(f)}
                finding={f}
                decision={decisions[findingKey(f)]}
                aiStatus={aiStatus[findingKey(f)] ?? 'idle'}
                onDecision={d => onDecision(f, d)}
                onGenerateAi={onGenerateAi}
              />
            ))}
          </div>
        )}
      </Paper>
    </div>
  );
};

const FindingRow: React.FC<{
  finding: QualityViolation;
  decision?: WizardDecision;
  aiStatus: AiRowStatus;
  onDecision: (d: WizardDecision) => void;
  onGenerateAi?: (key: string) => void;
}> = ({ finding, decision, aiStatus, onDecision, onGenerateAi }) => {
  const classes = useStyles();
  const lane = laneOf(finding);
  const snip = snippetForRule(finding.ruleId);
  const key = findingKey(finding);
  const waitingForAi = lane === 'AI-fix' && aiStatus !== 'ready';
  const showProposed = lane === 'Auto-fix' || (lane === 'AI-fix' && aiStatus === 'ready');
  const issueLines: DiffLine[] = waitingForAi || lane === 'Manual-fix'
    ? snip.current.map(text => ({ kind: 'del' as const, text }))
    : [];
  const lines = showProposed
    ? unifiedDiff(snip.current, snip.proposed)
    : issueLines;
  const rowClass =
    decision === 'accept'
      ? `${classes.issueCard} ${classes.rowAccept}`
      : decision === 'decline'
        ? `${classes.issueCard} ${classes.rowDecline}`
        : classes.issueCard;

  const actions =
    lane === 'Auto-fix' || (lane === 'AI-fix' && aiStatus === 'ready') ? (
      <>
        <Button
          size="small"
          variant={decision === 'accept' ? 'contained' : 'outlined'}
          color="primary"
          startIcon={<CheckIcon />}
          style={PILL_COMPACT}
          onClick={() => onDecision('accept')}
        >
          Accept
        </Button>
        <Button
          size="small"
          variant={decision === 'decline' ? 'contained' : 'outlined'}
          startIcon={<CloseIcon />}
          style={PILL_COMPACT}
          onClick={() => onDecision('decline')}
        >
          Decline
        </Button>
      </>
    ) : lane === 'AI-fix' && aiStatus === 'loading' ? null : lane === 'AI-fix' ? (
      onGenerateAi ? (
        <Button
          size="small"
          variant="contained"
          color="primary"
          style={PILL_COMPACT}
          onClick={() => onGenerateAi(key)}
        >
          Generate AI suggestion
        </Button>
      ) : null
    ) : null;

  return (
    <div className={rowClass}>
      <div className={classes.cardHead}>
        <div className={classes.cardCopy}>
          <Typography className={classes.title}>{finding.message}</Typography>
          <Typography className={classes.fileMeta}>
            <span className={classes.filePath}>
              {finding.file || 'Unknown file'}:{finding.lineStart}
            </span>
            {' · '}
            {kindLabel(finding)}
            {' · '}
            {finding.ruleId}
          </Typography>
          <div className={classes.chips}>
            <Chip
              size="small"
              label={SEV_LABEL[finding.severity] ?? finding.severity}
              className={classes.chip}
              style={{
                backgroundColor: SEVERITY_COLORS[finding.severity],
                color: '#fff',
              }}
            />
            <Tooltip title={LANE_TIP[lane]} placement="top">
              <Chip size="small" variant="outlined" label={lane} className={classes.chip} />
            </Tooltip>
          </div>
        </div>
        {actions && <div className={classes.cardActions}>{actions}</div>}
      </div>
      <div className={classes.diffBlock}>
        {lines.length === 0 ? (
          <Typography className={classes.diffEmpty}>No snippet for this finding.</Typography>
        ) : (
          lines.map((line, idx) => (
            <div
              key={`${line.kind}-${idx}`}
              className={`${classes.diffLine} ${
                line.kind === 'del' ? classes.del : line.kind === 'add' ? classes.add : ''
              }`}
            >
              <span
                className={`${classes.gutter} ${
                  line.kind === 'del' ? classes.delMark : line.kind === 'add' ? classes.addMark : ''
                }`}
              >
                {line.kind === 'del' ? '−' : line.kind === 'add' ? '+' : ' '}
              </span>
              <span>{line.text || ' '}</span>
            </div>
          ))
        )}
        {lane === 'AI-fix' && aiStatus === 'loading' && (
          <div className={classes.suggestionEmpty}>
            <CircularProgress size={16} />
            Generating…
          </div>
        )}
        {lane === 'AI-fix' && aiStatus === 'idle' && (
          <Typography className={classes.suggestionEmpty}>No suggestion yet.</Typography>
        )}
        {lane === 'Manual-fix' && (
          <Typography className={classes.suggestionEmpty}>Change this in the file.</Typography>
        )}
      </div>
    </div>
  );
};
