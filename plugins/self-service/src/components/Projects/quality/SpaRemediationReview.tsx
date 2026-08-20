/**
 * SPA-faithful review bodies for the Quality session wizard.
 * Jobs, copy, and layout from apme/frontend FixSession; components are MUI + RHDH theme.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CloseIcon from '@material-ui/icons/Close';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { QualityViolation, SEVERITY_COLORS, SeverityClass } from '../detail/qualityDemoData';
import { snippetForRule } from './spaWizardSnippets';

export type WizardDecision = 'accept' | 'decline';
export type ReviewMode = 'assess' | 'gate';
export type ViewMode = 'grouped' | 'flat';

const KIND_LABEL: Record<string, string> = {
  task: 'Task',
  block: 'Block',
  play: 'Play',
  playbook: 'Playbook',
  role: 'Role',
  collection: 'Collection',
  inventory: 'Vars',
};

const SEV_LABEL: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const PILL = { borderRadius: 20, textTransform: 'none' as const, fontWeight: 600 };

export function nodeKey(v: QualityViolation): string {
  return (v.yamlPath || '').trim() || `${v.file}:${v.lineStart}`;
}

export function kindLabel(v: QualityViolation): string {
  return KIND_LABEL[v.scope] || 'Other';
}

export function fixTypeLabel(v: QualityViolation): 'Quick-fix' | 'AI' | 'Manual' {
  if (v.fixTier === 'deterministic') return 'Quick-fix';
  if (v.fixTier === 'ai') return 'AI';
  return 'Manual';
}

export function findingKey(v: QualityViolation): string {
  return `${v.ruleId}:${v.file}:${v.lineStart}`;
}

/** SPA ReviewFilterBar: refuse to clear the last selected value. */
export function toggleInFilterSet<T>(prev: Set<T>, value: T): Set<T> {
  const next = new Set(prev);
  if (next.has(value)) {
    if (next.size <= 1) return prev;
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

export function uniqueNodeCount(items: QualityViolation[]): number {
  const paths = new Set<string>();
  let hasSingleton = false;
  for (const f of items) {
    const path = (f.yamlPath || '').trim();
    if (!path) hasSingleton = true;
    else paths.add(path);
  }
  return paths.size + (hasSingleton ? 1 : 0);
}

export function groupByNode(findings: QualityViolation[]): {
  id: string;
  title: string;
  kind: string;
  findings: QualityViolation[];
}[] {
  const byPath = new Map<string, QualityViolation[]>();
  const singletons: QualityViolation[] = [];
  findings.forEach(v => {
    const path = (v.yamlPath || '').trim();
    if (!path) {
      singletons.push(v);
      return;
    }
    const list = byPath.get(path) ?? [];
    list.push(v);
    byPath.set(path, list);
  });
  const groups = Array.from(byPath.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, list]) => ({
      id,
      title: id,
      kind: kindLabel(list[0]),
      findings: list,
    }));
  if (singletons.length > 0) {
    groups.push({
      id: '__singleton__',
      title: 'Not tied to a location',
      kind: 'Other',
      findings: singletons,
    });
  }
  return groups;
}

const useStyles = makeStyles((theme: Theme) => ({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  },
  headerText: { flex: 1, minWidth: 240 },
  headerActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: 420,
  },
  nextSummary: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    textAlign: 'right',
  },
  inventory: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  invBox: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(1, 1.5),
  },
  invLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  },
  invNums: { display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 },
  invPrimary: { fontSize: 22, fontWeight: 700, lineHeight: 1.1 },
  invSecondary: { fontSize: 16, fontWeight: 600, color: theme.palette.text.secondary },
  invCaptions: {
    display: 'flex',
    gap: 8,
    fontSize: 11,
    color: theme.palette.text.secondary,
  },
  hint: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    maxWidth: 760,
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  filterGroup: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  filterLabel: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginRight: 2,
  },
  listToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  linkRow: { display: 'flex', alignItems: 'center', gap: 8 },
  nodeCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: theme.spacing(1.5),
  },
  nodeCardAccept: { borderLeft: `4px solid ${theme.palette.success.main}` },
  nodeCardDecline: { borderLeft: `4px solid ${theme.palette.error.main}` },
  nodeHead: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    cursor: 'pointer',
    '&:hover': { backgroundColor: theme.palette.action.hover },
  },
  nodeTitle: { fontFamily: 'monospace', fontSize: 13, fontWeight: 600, wordBreak: 'break-all' },
  nodeMeta: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  nodeActions: { display: 'flex', gap: 8, flexShrink: 0, marginLeft: 'auto' },
  detail: { padding: theme.spacing(0, 2, 2, 5) },
  findingRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(140px, 1.1fr) 88px 88px 1fr',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontSize: 13,
    alignItems: 'start',
    '&:last-of-type': { borderBottom: 'none' },
  },
  yamlBox: {
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
    fontSize: 12,
    lineHeight: 1.55,
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.type === 'dark' ? '#1b1b1b' : '#f5f5f5',
    borderRadius: 4,
    overflow: 'auto',
    whiteSpace: 'pre',
    marginTop: theme.spacing(1),
  },
  findingSplit: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-of-type': { borderBottom: 'none' },
    [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
  },
  findingSplitMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing(1),
    alignItems: 'center',
  },
  fixDisclaimer: {
    padding: theme.spacing(1.5),
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.default,
    minHeight: 72,
  },
  fixActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  diffGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1),
    [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
  },
  diffPane: {
    minWidth: 0,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  diffHead: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: theme.spacing(0.75, 1.5),
    backgroundColor: theme.palette.background.default,
  },
  progressCard: { padding: theme.spacing(3) },
  logLine: {
    display: 'flex',
    gap: theme.spacing(1.5),
    alignItems: 'flex-start',
    fontSize: 13,
    padding: theme.spacing(0.5, 0),
  },
}));

function sevColor(s: SeverityClass): string {
  return SEVERITY_COLORS[s];
}

export const ReviewInventoryRow: React.FC<{
  boxes: { key: string; label: string; primary: number; secondary: number }[];
}> = ({ boxes }) => {
  const classes = useStyles();
  return (
    <div className={classes.inventory} role="group" aria-label="Review inventory">
      {boxes.map(b => (
        <div key={b.key} className={classes.invBox}>
          <div className={classes.invLabel}>{b.label}</div>
          <div className={classes.invNums}>
            <span className={classes.invPrimary}>{b.primary}</span>
            <span className={classes.invSecondary}>{b.secondary}</span>
          </div>
          <div className={classes.invCaptions}>
            <span>findings</span>
            <span>locations</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const FilterChip: React.FC<{
  label: string;
  count?: number;
  selected: boolean;
  color?: string;
  onToggle: () => void;
}> = ({ label, count, selected, color, onToggle }) => (
  <Chip
    size="small"
    clickable
    label={count != null ? `${label} (${count})` : label}
    onClick={onToggle}
    variant={selected ? 'default' : 'outlined'}
    style={
      selected && color
        ? { backgroundColor: color, color: '#fff', fontWeight: 600 }
        : { fontWeight: 600 }
    }
  />
);

export const ReviewFilterBar: React.FC<{
  groups: {
    label: string;
    options: {
      id: string;
      label: string;
      count?: number;
      selected: boolean;
      color?: string;
      onToggle: () => void;
    }[];
  }[];
}> = ({ groups }) => {
  const classes = useStyles();
  const visible = groups.filter(g => g.options.length > 0);
  if (visible.length === 0) return null;
  return (
    <div className={classes.filterRow}>
      {visible.map(g => (
        <div key={g.label} className={classes.filterGroup}>
          <span className={classes.filterLabel}>{g.label}</span>
          {g.options.map(o => (
            <FilterChip key={o.id} {...o} />
          ))}
        </div>
      ))}
    </div>
  );
};

const YamlBlock: React.FC<{ title?: string; lines: string[] }> = ({ title, lines }) => {
  const classes = useStyles();
  if (!lines.length) return null;
  return (
    <Box>
      {title && (
        <Typography variant="caption" color="textSecondary" style={{ fontWeight: 700 }}>
          {title}
        </Typography>
      )}
      <pre className={classes.yamlBox}>{lines.join('\n')}</pre>
    </Box>
  );
};

const DiffView: React.FC<{ current: string[]; proposed: string[] }> = ({ current, proposed }) => {
  const classes = useStyles();
  return (
    <div className={classes.diffGrid}>
      <div className={classes.diffPane}>
        <div className={classes.diffHead}>Current</div>
        <pre className={classes.yamlBox} style={{ margin: 0, borderRadius: 0 }}>
          {current.join('\n') || '—'}
        </pre>
      </div>
      <div className={classes.diffPane}>
        <div className={classes.diffHead}>Proposed</div>
        <pre className={classes.yamlBox} style={{ margin: 0, borderRadius: 0 }}>
          {proposed.join('\n') || '—'}
        </pre>
      </div>
    </div>
  );
};

export type AiRowStatus = 'idle' | 'loading' | 'ready';

function t1CardDecision(
  findings: QualityViolation[],
  decisions: Record<string, WizardDecision>,
  aiStatus?: Record<string, AiRowStatus>,
): WizardDecision | undefined {
  const actionable = findings.filter(f => {
    if (f.fixTier === 'deterministic') return true;
    if (f.fixTier === 'ai' && aiStatus?.[findingKey(f)] === 'ready') return true;
    return false;
  });
  if (actionable.length === 0) return undefined;
  const ds = actionable.map(f => decisions[findingKey(f)]);
  if (ds.some(d => !d)) return undefined;
  if (ds.every(d => d === 'accept')) return 'accept';
  if (ds.every(d => d === 'decline')) return 'decline';
  return undefined;
}

const NodeCard: React.FC<{
  id: string;
  title: string;
  kind: string;
  findings: QualityViolation[];
  mode: ReviewMode;
  decision?: WizardDecision;
  expanded: boolean;
  onToggle: () => void;
  onDecision?: (id: string, d: WizardDecision) => void;
  /** Results step: Current on the left, Fix column on the right (proposed or disclaimer). */
  fixColumn?: boolean;
  /** Finding-keyed Accept/Decline for Quick-fix rows in the results step. */
  findingDecisions?: Record<string, WizardDecision>;
  /** Fourth prototype: per-finding Use AI on the results step. */
  showAiOptIn?: boolean;
  aiOptIn?: Record<string, boolean>;
  onToggleAiOptIn?: (key: string) => void;
  /** Inline AI: generate a suggestion in this row, then Accept/Decline. */
  inlineAi?: boolean;
  aiStatus?: Record<string, AiRowStatus>;
  onGenerateAi?: (key: string) => void;
  aiFixHint?: string;
}> = ({
  id,
  title,
  kind,
  findings,
  mode,
  decision,
  expanded,
  onToggle,
  onDecision,
  fixColumn,
  findingDecisions,
  showAiOptIn,
  aiOptIn,
  onToggleAiOptIn,
  inlineAi,
  aiStatus,
  onGenerateAi,
  aiFixHint,
}) => {
  const classes = useStyles();
  const lead = findings[0];
  const snip = snippetForRule(lead.ruleId);
  const rules = Array.from(new Set(findings.map(f => f.ruleId)));
  const cardDecision = fixColumn
    ? t1CardDecision(findings, findingDecisions ?? {}, aiStatus)
    : decision;
  const border =
    cardDecision === 'accept'
      ? classes.nodeCardAccept
      : cardDecision === 'decline'
        ? classes.nodeCardDecline
        : '';

  return (
    <Paper className={`${classes.nodeCard} ${border}`} variant="outlined" elevation={0}>
      <div className={classes.nodeHead} onClick={onToggle} role="button">
        <IconButton size="small" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>
        <Box flex={1} minWidth={0}>
          <Typography className={classes.nodeTitle}>{title}</Typography>
          <div className={classes.nodeMeta}>
            {rules.map(r => (
              <Chip key={r} size="small" variant="outlined" label={r} />
            ))}
            {mode === 'gate' && (
              <Chip
                size="small"
                label={lead.fixTier === 'ai' ? 'AI' : 'Quick-fix'}
                color="primary"
                variant="outlined"
              />
            )}
            <Chip size="small" label={kind} />
            {mode === 'assess' && (
              <Chip
                size="small"
                label={SEV_LABEL[lead.severity] ?? lead.severity}
                style={{ backgroundColor: sevColor(lead.severity), color: '#fff', fontWeight: 600 }}
              />
            )}
          </div>
        </Box>
        {mode === 'gate' && onDecision && !fixColumn && (
          <div className={classes.nodeActions} onClick={e => e.stopPropagation()}>
            <Button
              size="small"
              variant={decision === 'accept' ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<CheckIcon />}
              style={PILL}
              onClick={() => onDecision(id, 'accept')}
            >
              Accept
            </Button>
            <Button
              size="small"
              variant={decision === 'decline' ? 'contained' : 'outlined'}
              startIcon={<CloseIcon />}
              style={PILL}
              onClick={() => onDecision(id, 'decline')}
            >
              Decline
            </Button>
          </div>
        )}
      </div>
      <Collapse in={expanded}>
        <div className={classes.detail}>
          {mode === 'assess' &&
            findings.map(f => {
              const rowSnip = snippetForRule(f.ruleId);
              if (fixColumn) {
                const lane = fixTypeLabel(f);
                return (
                  <div key={findingKey(f)} className={classes.findingSplit}>
                    <div className={classes.diffPane}>
                      <div className={classes.diffHead}>Finding</div>
                      <Box p={1.5}>
                        <div className={classes.findingSplitMeta}>
                          <Typography variant="body2" style={{ fontWeight: 600 }}>
                            {f.ruleId}
                          </Typography>
                          <Chip
                            size="small"
                            label={SEV_LABEL[f.severity] ?? f.severity}
                            style={{
                              backgroundColor: sevColor(f.severity),
                              color: '#fff',
                              fontWeight: 600,
                              height: 22,
                            }}
                          />
                          <Chip size="small" variant="outlined" label={lane} />
                        </div>
                        <Typography variant="body2" color="textSecondary">
                          {f.message}
                          <br />
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                            {f.file}:{f.lineStart}
                          </span>
                        </Typography>
                        <YamlBlock title="Current YAML" lines={rowSnip.current} />
                      </Box>
                    </div>
                    <div className={classes.diffPane}>
                      <div className={classes.diffHead}>Fix</div>
                      {lane === 'Quick-fix' ? (
                        <>
                          <pre className={classes.yamlBox} style={{ margin: 0, borderRadius: 0 }}>
                            {rowSnip.proposed.join('\n') || '—'}
                          </pre>
                          {onDecision && (
                            <div
                              className={classes.fixActions}
                              onClick={e => e.stopPropagation()}
                            >
                              <Button
                                size="small"
                                variant={
                                  findingDecisions?.[findingKey(f)] === 'accept'
                                    ? 'contained'
                                    : 'outlined'
                                }
                                color="primary"
                                startIcon={<CheckIcon />}
                                style={PILL}
                                onClick={() => onDecision(findingKey(f), 'accept')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="small"
                                variant={
                                  findingDecisions?.[findingKey(f)] === 'decline'
                                    ? 'contained'
                                    : 'outlined'
                                }
                                startIcon={<CloseIcon />}
                                style={PILL}
                                onClick={() => onDecision(findingKey(f), 'decline')}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </>
                      ) : lane === 'AI' ? (
                        inlineAi ? (
                          (() => {
                            const key = findingKey(f);
                            const status = aiStatus?.[key] ?? 'idle';
                            if (status === 'loading') {
                              return (
                                <Box
                                  className={classes.fixDisclaimer}
                                  display="flex"
                                  alignItems="center"
                                  style={{ gap: 12 }}
                                >
                                  <CircularProgress size={18} />
                                  <span>Generating AI suggestion…</span>
                                </Box>
                              );
                            }
                            if (status === 'ready') {
                              return (
                                <>
                                  <pre className={classes.yamlBox} style={{ margin: 0, borderRadius: 0 }}>
                                    {rowSnip.proposed.join('\n') || '—'}
                                  </pre>
                                  {onDecision && (
                                    <div
                                      className={classes.fixActions}
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <Button
                                        size="small"
                                        variant={
                                          findingDecisions?.[key] === 'accept' ? 'contained' : 'outlined'
                                        }
                                        color="primary"
                                        startIcon={<CheckIcon />}
                                        style={PILL}
                                        onClick={() => onDecision(key, 'accept')}
                                      >
                                        Accept
                                      </Button>
                                      <Button
                                        size="small"
                                        variant={
                                          findingDecisions?.[key] === 'decline' ? 'contained' : 'outlined'
                                        }
                                        startIcon={<CloseIcon />}
                                        style={PILL}
                                        onClick={() => onDecision(key, 'decline')}
                                      >
                                        Decline
                                      </Button>
                                    </div>
                                  )}
                                </>
                              );
                            }
                            return (
                              <>
                                <div className={classes.fixDisclaimer}>
                                  AI can suggest a fix. Generate a suggestion here to review it.
                                </div>
                                {onGenerateAi && (
                                  <div
                                    className={classes.fixActions}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="primary"
                                      style={PILL}
                                      onClick={() => onGenerateAi(key)}
                                    >
                                      Generate AI suggestion
                                    </Button>
                                  </div>
                                )}
                              </>
                            );
                          })()
                        ) : (
                          <>
                            <div className={classes.fixDisclaimer}>
                              {showAiOptIn
                                ? aiOptIn?.[findingKey(f)]
                                  ? "Selected. You'll review a suggestion in the AI step."
                                  : 'AI can suggest a fix. Select Use AI to generate one in the next step.'
                                : aiFixHint ??
                                  "AI can suggest a fix. You'll review it in the AI step."}
                            </div>
                            {showAiOptIn && onToggleAiOptIn && (
                              <div
                                className={classes.fixActions}
                                onClick={e => e.stopPropagation()}
                              >
                                <Button
                                  size="small"
                                  variant={aiOptIn?.[findingKey(f)] ? 'contained' : 'outlined'}
                                  color="primary"
                                  style={PILL}
                                  onClick={() => onToggleAiOptIn(findingKey(f))}
                                >
                                  {aiOptIn?.[findingKey(f)] ? "Don't use AI" : 'Use AI'}
                                </Button>
                              </div>
                            )}
                          </>
                        )
                      ) : (
                        <div className={classes.fixDisclaimer}>
                          No automatic fix. Change this in the file yourself.
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <div key={findingKey(f)} className={classes.findingRow}>
                  <Typography variant="body2" style={{ fontWeight: 600 }}>
                    {f.ruleId}
                  </Typography>
                  <Chip
                    size="small"
                    label={SEV_LABEL[f.severity] ?? f.severity}
                    style={{
                      backgroundColor: sevColor(f.severity),
                      color: '#fff',
                      fontWeight: 600,
                      height: 22,
                    }}
                  />
                  <Typography variant="caption">{fixTypeLabel(f)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {f.message}
                    <br />
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {f.file}:{f.lineStart}
                    </span>
                  </Typography>
                </div>
              );
            })}
          {mode === 'gate' && snip.explanation && (
            <Typography variant="body2" paragraph>
              {snip.explanation}
            </Typography>
          )}
          {mode === 'gate' && lead.fixTier === 'ai' && (
            <Box mb={1}>
              <Typography variant="caption" color="textSecondary">
                Confidence {Math.round((snip.confidence ?? 0.9) * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(snip.confidence ?? 0.9) * 100}
                style={{ height: 6, borderRadius: 3, marginTop: 4 }}
              />
            </Box>
          )}
          {mode === 'assess' && !fixColumn ? (
            <YamlBlock title="Current YAML" lines={snip.current} />
          ) : mode === 'gate' ? (
            <DiffView current={snip.current} proposed={snip.proposed} />
          ) : null}
        </div>
      </Collapse>
    </Paper>
  );
};

type NodeItem = ReturnType<typeof groupByNode>[number];

export const NodeReviewList: React.FC<{
  nodes: NodeItem[];
  mode: ReviewMode;
  decisions: Record<string, WizardDecision>;
  onDecision?: (id: string, d: WizardDecision) => void;
  onAcceptRemaining?: () => void;
  onDeclineRemaining?: () => void;
  onClear?: () => void;
  pendingVisible: number;
  decidedCount: number;
  fixColumn?: boolean;
  showAiOptIn?: boolean;
  aiOptIn?: Record<string, boolean>;
  onToggleAiOptIn?: (key: string) => void;
  inlineAi?: boolean;
  aiStatus?: Record<string, AiRowStatus>;
  onGenerateAi?: (key: string) => void;
  aiFixHint?: string;
}> = ({
  nodes,
  mode,
  decisions,
  onDecision,
  onAcceptRemaining,
  onDeclineRemaining,
  onClear,
  pendingVisible,
  decidedCount,
  fixColumn,
  showAiOptIn,
  aiOptIn,
  onToggleAiOptIn,
  inlineAi,
  aiStatus,
  onGenerateAi,
  aiFixHint,
}) => {
  const classes = useStyles();
  const ids = useMemo(() => nodes.map(n => n.id), [nodes]);
  const idKey = ids.join('|');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(ids));
  const showBulk = mode === 'gate' || Boolean(fixColumn && onAcceptRemaining);

  const decidedCollapseKey = useMemo(() => {
    if (mode !== 'gate' && !fixColumn) return '';
    return nodes
      .map(n => {
        if (fixColumn) {
          const actionable = n.findings.filter(f => {
            if (f.fixTier === 'deterministic') return true;
            if (inlineAi && f.fixTier === 'ai' && aiStatus?.[findingKey(f)] === 'ready') {
              return true;
            }
            return false;
          });
          const done =
            actionable.length > 0 && actionable.every(f => Boolean(decisions[findingKey(f)]));
          return done ? n.id : '';
        }
        return decisions[n.id] ? n.id : '';
      })
      .filter(Boolean)
      .join('|');
  }, [nodes, decisions, fixColumn, mode, inlineAi, aiStatus]);

  useEffect(() => {
    setExpanded(new Set(idKey ? idKey.split('|') : []));
  }, [idKey]);

  useEffect(() => {
    if (!decidedCollapseKey) return;
    setExpanded(prev => {
      const next = new Set(prev);
      decidedCollapseKey.split('|').forEach(id => next.delete(id));
      return next;
    });
  }, [decidedCollapseKey]);

  const expandAll = () => setExpanded(new Set(ids));
  const collapseAll = () => setExpanded(new Set());

  return (
    <Box>
      <div className={classes.listToolbar}>
        <div className={classes.linkRow}>
          <Button size="small" color="primary" onClick={expandAll} style={{ textTransform: 'none' }}>
            Expand all
          </Button>
          <span style={{ opacity: 0.35 }}>|</span>
          <Button
            size="small"
            color="primary"
            onClick={collapseAll}
            disabled={expanded.size === 0}
            style={{ textTransform: 'none' }}
          >
            Collapse all
          </Button>
        </div>
        {showBulk && (
          <div className={classes.linkRow}>
            <Button
              size="small"
              color="primary"
              onClick={onAcceptRemaining}
              disabled={pendingVisible === 0}
              style={{ textTransform: 'none' }}
            >
              Accept remaining{pendingVisible > 0 ? ` (${pendingVisible})` : ''}
            </Button>
            <span style={{ opacity: 0.35 }}>|</span>
            <Button
              size="small"
              color="primary"
              onClick={onDeclineRemaining}
              disabled={pendingVisible === 0}
              style={{ textTransform: 'none' }}
            >
              Decline remaining
            </Button>
            <span style={{ opacity: 0.35 }}>|</span>
            <Button
              size="small"
              color="primary"
              onClick={onClear}
              disabled={decidedCount === 0}
              style={{ textTransform: 'none' }}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
      {nodes.map(n => (
        <NodeCard
          key={n.id}
          {...n}
          mode={mode}
          decision={decisions[n.id]}
          expanded={expanded.has(n.id)}
          onToggle={() =>
            setExpanded(prev => {
              const next = new Set(prev);
              if (next.has(n.id)) next.delete(n.id);
              else next.add(n.id);
              return next;
            })
          }
          onDecision={onDecision}
          fixColumn={fixColumn}
          findingDecisions={fixColumn ? decisions : undefined}
          showAiOptIn={showAiOptIn}
          aiOptIn={aiOptIn}
          onToggleAiOptIn={onToggleAiOptIn}
          inlineAi={inlineAi}
          aiStatus={aiStatus}
          onGenerateAi={onGenerateAi}
          aiFixHint={aiFixHint}
        />
      ))}
    </Box>
  );
};

export const WorkflowNextBar: React.FC<{
  disabled?: boolean;
  loading?: boolean;
  hint: string;
  nextLabel?: string;
  onNext: () => void;
  onCancel: () => void;
}> = ({ disabled, loading, hint, nextLabel = 'Next', onNext, onCancel }) => {
  const classes = useStyles();
  return (
    <div className={classes.headerActions}>
      <Box display="flex" style={{ gap: 8 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={disabled || loading}
          onClick={onNext}
          style={PILL}
          endIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {nextLabel}
        </Button>
        <Button onClick={onCancel} style={PILL}>
          Cancel
        </Button>
      </Box>
      <Typography className={classes.nextSummary}>{hint}</Typography>
    </div>
  );
};

export const ReviewStepShell: React.FC<{
  title?: string;
  description: React.ReactNode;
  nextHint: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  onNext: () => void;
  onCancel: () => void;
  filterBar: React.ReactNode;
  empty?: boolean;
  emptyMessage: string;
  children?: React.ReactNode;
}> = ({
  title,
  description,
  nextHint,
  nextLabel,
  nextDisabled,
  nextLoading,
  onNext,
  onCancel,
  filterBar,
  empty,
  emptyMessage,
  children,
}) => {
  const classes = useStyles();
  return (
    <Paper variant="outlined" style={{ padding: 20 }}>
      <div className={classes.header}>
        <div className={classes.headerText}>
          {title ? (
            <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 8 }}>
              {title}
            </Typography>
          ) : null}
          {description}
        </div>
        <WorkflowNextBar
          hint={nextHint}
          nextLabel={nextLabel}
          disabled={nextDisabled}
          loading={nextLoading}
          onNext={onNext}
          onCancel={onCancel}
        />
      </div>
      {filterBar}
      {empty ? (
        <Typography color="textSecondary">{emptyMessage}</Typography>
      ) : (
        children
      )}
    </Paper>
  );
};

export const OperationProgressPanel: React.FC<{
  heading: string;
  progress: number;
  lines: { phase: string; text: string }[];
  onCancel: () => void;
}> = ({ heading, progress, lines, onCancel }) => {
  const classes = useStyles();
  return (
    <Paper className={classes.progressCard} variant="outlined">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{heading}</Typography>
        <Button onClick={onCancel} style={PILL}>
          Cancel
        </Button>
      </Box>
      <LinearProgress variant="determinate" value={progress} style={{ height: 8, borderRadius: 4 }} />
      <Box mt={2}>
        {lines.map((l, i) => (
          <div key={`${l.phase}-${i}`} className={classes.logLine}>
            <Chip size="small" label={l.phase} />
            <Typography variant="body2">{l.text}</Typography>
          </div>
        ))}
      </Box>
    </Paper>
  );
};

export function useAssessFilters(findings: QualityViolation[]) {
  const universe = useMemo(() => {
    const sevs = Array.from(new Set(findings.map(f => f.severity)));
    const fix = Array.from(new Set(findings.map(fixTypeLabel)));
    const kinds = Array.from(new Set(findings.map(kindLabel)));
    return { sevs, fix, kinds };
  }, [findings]);

  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [sevs, setSevs] = useState<Set<string>>(() => new Set(universe.sevs));
  const [fix, setFix] = useState<Set<string>>(() => new Set(universe.fix));
  const [kinds, setKinds] = useState<Set<string>>(() => new Set(universe.kinds));

  useEffect(() => {
    setSevs(new Set(universe.sevs));
    setFix(new Set(universe.fix));
    setKinds(new Set(universe.kinds));
  }, [universe.sevs.join(','), universe.fix.join(','), universe.kinds.join(',')]);

  const filtered = useMemo(
    () =>
      findings.filter(
        f => sevs.has(f.severity) && fix.has(fixTypeLabel(f)) && kinds.has(kindLabel(f)),
      ),
    [findings, sevs, fix, kinds],
  );

  const counts = useMemo(() => {
    const sev: Record<string, number> = {};
    const ft: Record<string, number> = {};
    const kd: Record<string, number> = {};
    findings.forEach(f => {
      sev[f.severity] = (sev[f.severity] ?? 0) + 1;
      const t = fixTypeLabel(f);
      ft[t] = (ft[t] ?? 0) + 1;
      const k = kindLabel(f);
      kd[k] = (kd[k] ?? 0) + 1;
    });
    return { sev, ft, kd };
  }, [findings]);

  const narrowed =
    universe.sevs.some(s => !sevs.has(s)) ||
    universe.fix.some(t => !fix.has(t)) ||
    universe.kinds.some(k => !kinds.has(k));

  const filterGroups = [
    {
      label: 'View',
      options: [
        {
          id: 'grouped',
          label: 'Group by location',
          selected: viewMode === 'grouped',
          onToggle: () => setViewMode('grouped'),
        },
        {
          id: 'flat',
          label: 'Flat list',
          selected: viewMode === 'flat',
          onToggle: () => setViewMode('flat'),
        },
      ],
    },
    {
      label: 'Severity',
      options: universe.sevs.map(s => ({
        id: s,
        label: SEV_LABEL[s] ?? s,
        count: counts.sev[s],
        color: sevColor(s as SeverityClass),
        selected: sevs.has(s),
        onToggle: () => setSevs(prev => toggleInFilterSet(prev, s)),
      })),
    },
    {
      label: 'Fix type',
      options: universe.fix.map(t => ({
        id: t,
        label: t,
        count: counts.ft[t],
        selected: fix.has(t),
        onToggle: () => setFix(prev => toggleInFilterSet(prev, t)),
      })),
    },
    {
      label: 'Kind',
      options: universe.kinds.map(k => ({
        id: k,
        label: k,
        count: counts.kd[k],
        selected: kinds.has(k),
        onToggle: () => setKinds(prev => toggleInFilterSet(prev, k)),
      })),
    },
  ];

  const nodes =
    viewMode === 'flat'
      ? filtered.map(f => ({
          id: findingKey(f),
          title: `${f.file}:${f.lineStart}`,
          kind: kindLabel(f),
          findings: [f],
        }))
      : groupByNode(filtered);

  return { filtered, nodes, filterGroups, narrowed, viewMode };
}

export function useGateFilters(
  findings: QualityViolation[],
  decisions: Record<string, WizardDecision>,
) {
  const nodesAll = useMemo(() => groupByNode(findings), [findings]);
  const universe = useMemo(() => {
    const sevs = Array.from(new Set(findings.map(f => f.severity)));
    const kinds = Array.from(new Set(findings.map(kindLabel)));
    return { sevs, kinds };
  }, [findings]);

  const [sevs, setSevs] = useState<Set<string>>(() => new Set(universe.sevs));
  const [kinds, setKinds] = useState<Set<string>>(() => new Set(universe.kinds));
  const [decs, setDecs] = useState<Set<string>>(() => new Set(['Undecided', 'Accepted', 'Declined']));

  useEffect(() => {
    setSevs(new Set(universe.sevs));
    setKinds(new Set(universe.kinds));
  }, [universe.sevs.join(','), universe.kinds.join(',')]);

  const counts = useMemo(() => {
    const sev: Record<string, number> = {};
    const kd: Record<string, number> = {};
    const dc: Record<string, number> = { Undecided: 0, Accepted: 0, Declined: 0 };
    findings.forEach(f => {
      sev[f.severity] = (sev[f.severity] ?? 0) + 1;
      kd[kindLabel(f)] = (kd[kindLabel(f)] ?? 0) + 1;
    });
    nodesAll.forEach(n => {
      const d = decisions[n.id];
      const label = d === 'accept' ? 'Accepted' : d === 'decline' ? 'Declined' : 'Undecided';
      dc[label] += n.findings.length;
    });
    return { sev, kd, dc };
  }, [findings, nodesAll, decisions]);

  const filteredNodes = nodesAll
    .map(n => ({
      ...n,
      findings: n.findings.filter(f => sevs.has(f.severity) && kinds.has(kindLabel(f))),
    }))
    .filter(n => n.findings.length > 0)
    .filter(n => {
      const d = decisions[n.id];
      const label = d === 'accept' ? 'Accepted' : d === 'decline' ? 'Declined' : 'Undecided';
      return decs.has(label);
    });

  const narrowed =
    universe.sevs.some(s => !sevs.has(s)) ||
    universe.kinds.some(k => !kinds.has(k)) ||
    decs.size < 3;

  const filterGroups = [
    {
      label: 'Decision',
      options: (['Undecided', 'Accepted', 'Declined'] as const).map(d => ({
        id: d,
        label: d,
        count: counts.dc[d],
        selected: decs.has(d),
        onToggle: () => setDecs(prev => toggleInFilterSet(prev, d)),
      })),
    },
    {
      label: 'Severity',
      options: universe.sevs.map(s => ({
        id: s,
        label: SEV_LABEL[s] ?? s,
        count: counts.sev[s],
        color: sevColor(s as SeverityClass),
        selected: sevs.has(s),
        onToggle: () => setSevs(prev => toggleInFilterSet(prev, s)),
      })),
    },
    {
      label: 'Kind',
      options: universe.kinds.map(k => ({
        id: k,
        label: k,
        count: counts.kd[k],
        selected: kinds.has(k),
        onToggle: () => setKinds(prev => toggleInFilterSet(prev, k)),
      })),
    },
  ];

  return { nodesAll, filteredNodes, filterGroups, narrowed };
}

export const ReviewHint: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.hint}>{children}</div>;
};
