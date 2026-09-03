import { useEffect, useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  makeStyles,
} from '@material-ui/core';
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck';
import { PageHelpIcon } from '../common/PageHelpIcon';
import {
  openQuickstartPanel,
  quickstartProgressPercent,
  quickstartRemainingCount,
  subscribeQuickstartProgress,
} from '../../hooks/adminQuickstart';

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: 560,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2.5),
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
  body: {
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  progress: {
    marginBottom: theme.spacing(2),
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(0.5),
  },
  progressText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  progressBar: {
    borderRadius: 4,
    height: 6,
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
  },
  progressBarFill: {
    borderRadius: 4,
    backgroundColor: '#63993D',
  },
  pill: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
}));

/**
 * Administration landing — Usage / Metrics Dashboard (first Admin rail item).
 * Setup beat: Finish Portal setup card mirrors Quick start progress; CTA opens
 * the same side panel as Help. Charts TBD (Taufique Aug 13).
 */
export const GeneralPage = () => {
  const classes = useStyles();
  const [remaining, setRemaining] = useState(quickstartRemainingCount);
  const [progress, setProgress] = useState(quickstartProgressPercent);

  useEffect(
    () =>
      subscribeQuickstartProgress(() => {
        setRemaining(quickstartRemainingCount());
        setProgress(quickstartProgressPercent());
      }),
    [],
  );

  const setupComplete = remaining === 0;

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Dashboard
            <PageHelpIcon
              tooltipLabel="What is Dashboard?"
              title="Administration Dashboard"
              description="Admin-only usage and metrics for this Portal instance — experience activity, seats, and capability health. During setup, use Finish Portal setup to open the same Quick start list as Help. Platform configuration (Integrations, Access, Experiences) lives on the other Administration rail items."
            />
          </Box>
        }
        pageTitleOverride="Dashboard"
        subtitle="Usage and metrics for this Portal instance. Charts and actions TBD."
      />
      <Content>
        <Box className={classes.card}>
          <Typography className={classes.title}>
            {setupComplete ? 'Portal setup is complete' : 'Finish Portal setup'}
          </Typography>
          <Typography className={classes.body}>
            {setupComplete
              ? 'Integrations, access, and experiences are ready. Reopen the list anytime from Help.'
              : 'Connect integrations, set who has access, and enable experiences. This is platform work — not a per-experience wizard. Reopen the list anytime from Help.'}
          </Typography>
          <Box className={classes.progress}>
            <Box className={classes.progressRow}>
              <Typography className={classes.progressText}>
                {progress}% complete
              </Typography>
              <Typography className={classes.progressText}>
                {remaining} remaining
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              classes={{
                root: classes.progressBar,
                bar: classes.progressBarFill,
              }}
            />
          </Box>
          <Button
            className={classes.pill}
            variant={setupComplete ? 'outlined' : 'contained'}
            color="primary"
            startIcon={<PlaylistAddCheckIcon />}
            onClick={() => openQuickstartPanel()}
          >
            Open Quick start
          </Button>
        </Box>
      </Content>
    </Page>
  );
};
