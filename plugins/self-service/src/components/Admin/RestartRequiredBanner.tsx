import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
  CircularProgress,
  LinearProgress,
} from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';

const useStyles = makeStyles(theme => ({
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    marginBottom: theme.spacing(2),
    backgroundColor: 'rgba(240,173,78,0.08)',
    border: '1px solid rgba(240,173,78,0.3)',
    borderRadius: theme.shape.borderRadius,
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    backdropFilter: 'blur(8px)',
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 1.5,
  },
  dialogBody: {
    fontSize: 13,
    lineHeight: 1.7,
    color: theme.palette.text.secondary,
  },
  applyingOverlay: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6, 4),
    textAlign: 'center' as const,
    minWidth: 360,
  },
  progress: {
    width: '100%',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    borderRadius: 4,
  },
}));

type Phase = 'banner' | 'confirm' | 'applying' | 'done';

interface RestartRequiredBannerProps {
  onRestart: () => void;
}

export const RestartRequiredBanner = ({ onRestart }: RestartRequiredBannerProps) => {
  const classes = useStyles();
  const [phase, setPhase] = useState<Phase>('banner');

  const handleConfirm = () => {
    setPhase('applying');
    setTimeout(() => setPhase('done'), 3000);
  };

  if (phase === 'done') {
    return (
      <Box className={classes.banner} style={{ borderColor: 'rgba(99,153,61,0.3)', backgroundColor: 'rgba(99,153,61,0.08)' }}>
        <CheckCircleOutlineIcon style={{ fontSize: 20, color: '#63993D', flexShrink: 0 }} />
        <Typography className={classes.message}>
          Portal restarted successfully. All configuration changes are now active.
        </Typography>
        <Button
          size="small"
          onClick={onRestart}
          style={{ textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}
        >
          Dismiss
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box className={classes.banner}>
        <WarningIcon style={{ fontSize: 20, color: '#f0ad4e', flexShrink: 0 }} />
        <Typography className={classes.message}>
          Configuration changes have been saved but require a portal restart to take effect.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => setPhase('confirm')}
          style={{ textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}
        >
          Restart now
        </Button>
      </Box>

      {/* Confirmation dialog */}
      <Dialog
        open={phase === 'confirm'}
        onClose={() => setPhase('banner')}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Restart portal?</DialogTitle>
        <DialogContent>
          <Typography className={classes.dialogBody}>
            The portal will be briefly unavailable while configuration changes are applied.
            All active user sessions will be interrupted. This typically takes 15–30 seconds.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPhase('banner')}
            style={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            style={{ textTransform: 'none' }}
          >
            Restart
          </Button>
        </DialogActions>
      </Dialog>

      {/* Applying overlay */}
      <Dialog
        open={phase === 'applying'}
        maxWidth="xs"
        fullWidth
        disableBackdropClick
        disableEscapeKeyDown
      >
        <Box className={classes.applyingOverlay}>
          <CircularProgress size={40} style={{ marginBottom: 24 }} />
          <Typography style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Applying changes…
          </Typography>
          <Typography style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>
            The portal is restarting. This page will refresh automatically
            when the portal is back online.
          </Typography>
          <LinearProgress className={classes.progress} />
        </Box>
      </Dialog>
    </>
  );
};
