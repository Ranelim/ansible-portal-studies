/**
 * Commit success: a PR receipt, not an operation-complete trophy.
 * Same Paper + unified diff language as Inline visual Findings.
 */

import { useMemo } from 'react';
import { Button, Paper, Typography, makeStyles } from '@material-ui/core';
import { fade } from '@material-ui/core/styles';
import CodeIcon from '@material-ui/icons/Code';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import type { QualityViolation } from '../detail/qualityDemoData';
import { snippetForRule } from './spaWizardSnippets';
import { findingKey, nodeKey, type WizardDecision } from './SpaRemediationReview';
import { unifiedDiff } from './qualityDiff';

const PILL = { borderRadius: 20, textTransform: 'none' as const, fontWeight: 600 };

const useStyles = makeStyles(theme => ({
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
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    flexShrink: 0,
  },
  body: {
    padding: theme.spacing(2),
  },
  facts: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    rowGap: theme.spacing(1),
    columnGap: theme.spacing(2),
    maxWidth: 560,
  },
  factLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  factValue: {
    fontSize: 13,
    color: theme.palette.text.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
    padding: theme.spacing(2, 2, 0),
  },
  fileBlock: {
    padding: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
  },
  fileName: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: '"Red Hat Mono", ui-monospace, monospace',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  row: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    marginBottom: theme.spacing(1.5),
    overflow: 'hidden',
    '&:last-child': { marginBottom: 0 },
  },
  rowHead: {
    padding: theme.spacing(1.5, 2, 1.25),
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  diffBlock: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5, 2, 2),
  },
  diffEmpty: {
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
  empty: {
    padding: theme.spacing(2),
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  subhead: {
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    padding: theme.spacing(1.5, 2, 0),
  },
  note: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
}));

function decisionOf(
  v: QualityViolation,
  t1: Record<string, WizardDecision>,
  ai: Record<string, WizardDecision>,
): WizardDecision | undefined {
  const map = v.fixTier === 'ai' ? ai : t1;
  return map[findingKey(v)] ?? map[nodeKey(v)];
}

function prNumber(url?: string): string | undefined {
  const match = url?.match(/\/pull\/(\d+)/);
  return match?.[1];
}

function groupByFile(findings: QualityViolation[]) {
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

type HunkMode = 'accepted' | 'manual' | 'declined';

const FindingHunk: React.FC<{ finding: QualityViolation; mode: HunkMode }> = ({
  finding,
  mode,
}) => {
  const classes = useStyles();
  const snip = snippetForRule(finding.ruleId);
  const lines =
    mode === 'manual'
      ? snip.current.map(text => ({ kind: 'context' as const, text }))
      : unifiedDiff(snip.current, snip.proposed);
  const why =
    mode === 'manual' ? 'Still in the file' : mode === 'declined' ? 'Declined' : undefined;

  return (
    <div className={classes.row}>
      <div className={classes.rowHead}>
        <Typography className={classes.rowTitle}>{finding.message}</Typography>
        <Typography className={classes.rowMeta}>
          Line {finding.lineStart}
          {why ? ` · ${why}` : ''}
        </Typography>
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
                  line.kind === 'del'
                    ? classes.delMark
                    : line.kind === 'add'
                      ? classes.addMark
                      : ''
                }`}
              >
                {line.kind === 'del' ? '−' : line.kind === 'add' ? '+' : ' '}
              </span>
              <span>{line.text || ' '}</span>
            </div>
          ))
        )}
        {mode === 'manual' && (
          <Typography className={classes.note}>Change this in the file.</Typography>
        )}
      </div>
    </div>
  );
};

const FileFindingList: React.FC<{ findings: QualityViolation[]; mode: HunkMode }> = ({
  findings,
  mode,
}) => {
  const classes = useStyles();
  const files = groupByFile(findings);
  return (
    <>
      {files.map(group => (
        <div key={group.file} className={classes.fileBlock}>
          <Typography className={classes.fileName}>{group.file}</Typography>
          {group.findings.map(f => (
            <FindingHunk key={findingKey(f)} finding={f} mode={mode} />
          ))}
        </div>
      ))}
    </>
  );
};

export const RemediationReceipt: React.FC<{
  repoLabel: string;
  branchName: string;
  prUrl?: string;
  hasPullRequest: boolean;
  findings: QualityViolation[];
  t1Decisions: Record<string, WizardDecision>;
  aiDecisions: Record<string, WizardDecision>;
  onDone: () => void;
  doneLabel: string;
}> = ({
  repoLabel,
  branchName,
  prUrl,
  hasPullRequest,
  findings,
  t1Decisions,
  aiDecisions,
  onDone,
  doneLabel,
}) => {
  const classes = useStyles();

  const accepted = useMemo(
    () => findings.filter(v => decisionOf(v, t1Decisions, aiDecisions) === 'accept'),
    [findings, t1Decisions, aiDecisions],
  );
  const declined = useMemo(
    () => findings.filter(v => decisionOf(v, t1Decisions, aiDecisions) === 'decline'),
    [findings, t1Decisions, aiDecisions],
  );
  const manual = useMemo(
    () => findings.filter(v => v.fixTier === 'manual'),
    [findings],
  );
  const acceptedAi = accepted.filter(v => v.fixTier === 'ai').length;
  const prId = prNumber(prUrl);
  const acceptedWord = accepted.length === 1 ? 'change' : 'changes';

  const title = hasPullRequest
    ? 'Pull request opened'
    : accepted.length > 0
      ? 'Changes accepted'
      : 'Session complete';
  const listTitle = hasPullRequest ? 'In this pull request' : 'Accepted this session';

  return (
    <div className={classes.stack}>
      <Paper className={classes.box} elevation={2}>
        <div className={classes.boxHead}>
          <div>
            <Typography className={classes.boxTitle}>{title}</Typography>
            <Typography className={classes.subtitle}>
              {accepted.length} accepted {acceptedWord} on {repoLabel}
            </Typography>
            <Typography className={classes.meta}>
              {branchName}
              {prId ? ` · PR #${prId}` : ''}
            </Typography>
          </div>
          <div className={classes.actions}>
            {hasPullRequest && (
              <Button
                variant="contained"
                color="primary"
                style={PILL}
                startIcon={<CodeIcon fontSize="small" />}
                onClick={() =>
                  window.open(
                    `/devspaces-mockup.html?state=pr-review&branch=${encodeURIComponent(branchName)}`,
                    '_blank',
                  )
                }
              >
                Review in Dev Spaces (IDE)
              </Button>
            )}
            {hasPullRequest && prUrl && (
              <Button
                variant="outlined"
                color="primary"
                style={PILL}
                endIcon={<OpenInNewIcon fontSize="small" />}
                onClick={() => window.open(prUrl, '_blank', 'noopener,noreferrer')}
              >
                View pull request
              </Button>
            )}
            <Button variant="outlined" color="primary" style={PILL} onClick={onDone}>
              {doneLabel}
            </Button>
          </div>
        </div>
        <div className={classes.body}>
          <div className={classes.facts}>
            <Typography className={classes.factLabel}>Changes committed</Typography>
            <Typography className={classes.factValue}>{accepted.length}</Typography>
            <Typography className={classes.factLabel}>Left in the file</Typography>
            <Typography className={classes.factValue}>
              {manual.length} manual
            </Typography>
            {declined.length > 0 && (
              <>
                <Typography className={classes.factLabel}>Declined</Typography>
                <Typography className={classes.factValue}>{declined.length}</Typography>
              </>
            )}
            {acceptedAi > 0 && (
              <>
                <Typography className={classes.factLabel}>AI-generated</Typography>
                <Typography className={classes.factValue}>
                  {acceptedAi} of {accepted.length}
                </Typography>
              </>
            )}
          </div>
        </div>
      </Paper>

      <Paper className={classes.box} elevation={2}>
        <Typography className={classes.sectionTitle}>{listTitle}</Typography>
        {accepted.length === 0 ? (
          <Typography className={classes.empty}>
            No accepted changes. Manual findings stay in the file.
          </Typography>
        ) : (
          <FileFindingList findings={accepted} mode="accepted" />
        )}
      </Paper>

      {(manual.length > 0 || declined.length > 0) && (
        <Paper className={classes.box} elevation={2}>
          <Typography className={classes.sectionTitle}>Not in the pull request</Typography>
          {manual.length > 0 && (
            <>
              {declined.length > 0 && (
                <Typography className={classes.subhead}>Left in the file</Typography>
              )}
              <FileFindingList findings={manual} mode="manual" />
            </>
          )}
          {declined.length > 0 && (
            <>
              {manual.length > 0 && (
                <Typography className={classes.subhead}>Declined</Typography>
              )}
              <FileFindingList findings={declined} mode="declined" />
            </>
          )}
        </Paper>
      )}
    </div>
  );
};
