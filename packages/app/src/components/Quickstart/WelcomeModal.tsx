import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  makeStyles,
} from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import StorageIcon from '@material-ui/icons/Storage';
import CodeIcon from '@material-ui/icons/Code';
import SecurityIcon from '@material-ui/icons/Security';
import SyncIcon from '@material-ui/icons/Sync';
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck';
import { useQuickstart } from './QuickstartContext';

const DISMISSED_KEY = 'portal-welcome-modal-dismissed';

const useStyles = makeStyles(theme => ({
  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: 520,
      borderRadius: 12,
      padding: 0,
      overflow: 'hidden',
    },
  },
  hero: {
    padding: theme.spacing(4, 4, 3),
    textAlign: 'center',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  iconRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2.5),
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#63993D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  heroTitle: {
    fontWeight: 700,
    fontSize: 20,
    marginBottom: theme.spacing(1),
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.palette.text.secondary,
    maxWidth: 400,
    margin: '0 auto',
  },
  stepsSection: {
    padding: theme.spacing(3, 4),
  },
  stepsTitle: {
    fontWeight: 600,
    fontSize: 13,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: theme.spacing(2),
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1, 0),
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: 500,
    flex: 1,
  },
  stepStatus: {
    fontSize: 12,
    color: theme.palette.text.disabled,
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: theme.spacing(1.5),
    padding: theme.spacing(0, 4, 3.5),
  },
  primaryButton: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: 14,
    flex: 1,
    padding: theme.spacing(1.2, 0),
  },
  secondaryButton: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 14,
    padding: theme.spacing(1.2, 3),
  },
}));

const NEXT_STEPS = [
  { label: 'Connect content registries', icon: StorageIcon, color: '#6753AC' },
  { label: 'Connect source control', icon: CodeIcon, color: '#24292e' },
  { label: 'Review sync schedules', icon: SyncIcon, color: '#0066CC' },
  { label: 'Configure access control', icon: SecurityIcon, color: '#C9190B' },
];

export const WelcomeModal = () => {
  const classes = useStyles();
  const { open: openQuickstart } = useQuickstart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  const handleOpenQuickstart = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
    setTimeout(() => openQuickstart(), 200);
  };

  return (
    <Dialog
      open={visible}
      onClose={handleDismiss}
      className={classes.dialog}
      disableEscapeKeyDown={false}
    >
      <Box className={classes.hero}>
        <Box className={classes.iconRow}>
          <Box className={classes.heroIcon}>
            <CheckCircleOutlineIcon style={{ fontSize: 28 }} />
          </Box>
        </Box>
        <Typography className={classes.heroTitle}>
          Portal setup complete
        </Typography>
        <Typography className={classes.heroSubtitle}>
          AAP is connected and your team can sign in. To get the most out of the
          portal, complete a few more configuration steps.
        </Typography>
      </Box>

      <Box className={classes.stepsSection}>
        <Typography className={classes.stepsTitle}>
          Recommended next steps
        </Typography>
        {NEXT_STEPS.map(step => (
          <Box key={step.label} className={classes.stepRow}>
            <Box
              className={classes.stepIcon}
              style={{ backgroundColor: step.color }}
            >
              <step.icon style={{ fontSize: 16 }} />
            </Box>
            <Typography className={classes.stepLabel}>{step.label}</Typography>
            <Typography className={classes.stepStatus}>Not started</Typography>
          </Box>
        ))}
      </Box>

      <Box className={classes.actions}>
        <Button
          variant="contained"
          color="primary"
          className={classes.primaryButton}
          onClick={handleOpenQuickstart}
          startIcon={<PlaylistAddCheckIcon />}
        >
          Open Quick start guide
        </Button>
        <Button
          variant="outlined"
          className={classes.secondaryButton}
          onClick={handleDismiss}
        >
          Skip for now
        </Button>
      </Box>
    </Dialog>
  );
};
