/**
 * Commit success: keep the Commit review (tabs + finding cards).
 * Header is a receipt; the list is the same preview as the step before push.
 */

import { Button, Paper, Typography, makeStyles } from '@material-ui/core';
import CodeIcon from '@material-ui/icons/Code';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import type { Dispatch, SetStateAction } from 'react';
import type { QualityViolation } from '../detail/qualityDemoData';
import { CommitFindingReview } from './InlineVisualReview';
import {
  findingKey,
  type AiRowStatus,
  type WizardDecision,
} from './SpaRemediationReview';

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
}));

function prNumber(url?: string): string | undefined {
  const match = url?.match(/\/pull\/(\d+)/);
  return match?.[1];
}

export const RemediationReceipt: React.FC<{
  repoLabel: string;
  branchName: string;
  prUrl?: string;
  hasPullRequest: boolean;
  findings: QualityViolation[];
  t1Decisions: Record<string, WizardDecision>;
  setT1Decisions: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  aiDecisions: Record<string, WizardDecision>;
  setAiDecisions: Dispatch<SetStateAction<Record<string, WizardDecision>>>;
  aiStatus: Record<string, AiRowStatus>;
  sideBySide?: boolean;
  onDone: () => void;
  doneLabel: string;
}> = ({
  repoLabel,
  branchName,
  prUrl,
  hasPullRequest,
  findings,
  t1Decisions,
  setT1Decisions,
  aiDecisions,
  setAiDecisions,
  aiStatus,
  sideBySide = false,
  onDone,
  doneLabel,
}) => {
  const classes = useStyles();
  const accepted = findings.filter(v => {
    const key = findingKey(v);
    if (v.fixTier === 'ai') return aiDecisions[key] === 'accept';
    if (v.fixTier === 'deterministic') return t1Decisions[key] === 'accept';
    return false;
  }).length;
  const acceptedWord = accepted === 1 ? 'change' : 'changes';
  const prId = prNumber(prUrl);
  const title = hasPullRequest
    ? 'Pull request opened'
    : accepted > 0
      ? 'Changes accepted'
      : 'Session complete';

  return (
    <div className={classes.stack}>
      <Paper variant="outlined" className={classes.box} elevation={0}>
        <div className={classes.boxHead}>
          <div>
            <Typography className={classes.boxTitle}>{title}</Typography>
            <Typography className={classes.subtitle}>
              {accepted} accepted {acceptedWord} on {repoLabel}
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
      </Paper>

      <CommitFindingReview
        findings={findings}
        t1Decisions={t1Decisions}
        setT1Decisions={setT1Decisions}
        aiDecisions={aiDecisions}
        setAiDecisions={setAiDecisions}
        aiStatus={aiStatus}
        sideBySide={sideBySide}
        readOnly
      />
    </div>
  );
};
