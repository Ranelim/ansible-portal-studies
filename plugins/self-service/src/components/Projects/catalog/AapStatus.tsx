import { useState } from 'react';
import {
  Box,
  Tooltip,
  Typography,
  Popover,
  IconButton,
  Button,
  makeStyles,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import ErrorIcon from '@material-ui/icons/Error';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CloseIcon from '@material-ui/icons/Close';
import type { AapStatus as AapStatusType, LastJobRun } from './projectsDemoData';

const useStyles = makeStyles(theme => ({
  popoverContent: {
    padding: theme.spacing(2.5),
    maxWidth: 380,
    minWidth: 300,
  },
  popoverHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1),
  },
  popoverTitle: {
    fontWeight: 600,
    fontSize: 14,
  },
  popoverDescription: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: theme.spacing(1.5),
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
  },
  statusLabel: {
    fontSize: 13,
    flex: 1,
  },
  actionButton: {
    textTransform: 'none',
    fontSize: 12,
    borderRadius: 16,
    padding: '4px 14px',
    marginLeft: 8,
  },
}));

const StatusIcon = ({ status }: { status: 'pushed' | 'not-pushed' | 'error' }) => {
  if (status === 'pushed') {
    return <CheckCircleIcon style={{ color: '#4caf50', fontSize: 18 }} />;
  }
  if (status === 'error') {
    return <ErrorIcon style={{ color: '#f44336', fontSize: 18 }} />;
  }
  return <RadioButtonUncheckedIcon style={{ color: '#bdbdbd', fontSize: 18 }} />;
};

const statusText = (status: 'pushed' | 'not-pushed' | 'error') => {
  if (status === 'pushed') return 'Pushed';
  if (status === 'error') return 'Error';
  return 'Not pushed';
};

const getOverallLabel = (aap: AapStatusType) => {
  if (aap.project === 'pushed' && aap.jobTemplate === 'pushed')
    return 'Pushed';
  if (aap.project === 'error' || aap.jobTemplate === 'error') return 'Error';
  return 'Not pushed';
};

export const AapStatusIcons = ({ aap }: { aap: AapStatusType }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const overallLabel = getOverallLabel(aap);

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        style={{ gap: 2, cursor: 'pointer' }}
        onClick={handleClick}
      >
        <Tooltip title={`AAP Project: ${statusText(aap.project)}`} arrow>
          <Box display="flex">
            <StatusIcon status={aap.project} />
          </Box>
        </Tooltip>
        <Tooltip title={`Job Template: ${statusText(aap.jobTemplate)}`} arrow>
          <Box display="flex">
            <StatusIcon status={aap.jobTemplate} />
          </Box>
        </Tooltip>
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box className={classes.popoverContent}>
          <Box className={classes.popoverHeader}>
            <Box>
              <Typography className={classes.popoverTitle}>
                AAP: {overallLabel}
              </Typography>
              <Typography className={classes.popoverDescription}>
                Pushing to AAP creates or updates the project and job template
                in your Ansible Controller based on the manifest in your
                repository. This is a manual action.
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box className={classes.statusRow}>
            <StatusIcon status={aap.project} />
            <Typography className={classes.statusLabel}>
              AAP Project: {statusText(aap.project)}
            </Typography>
            {aap.project === 'not-pushed' && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                className={classes.actionButton}
              >
                Push to AAP
              </Button>
            )}
          </Box>
          <Box className={classes.statusRow}>
            <StatusIcon status={aap.jobTemplate} />
            <Typography className={classes.statusLabel}>
              Job Template: {statusText(aap.jobTemplate)}
            </Typography>
            {aap.jobTemplate === 'not-pushed' && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                className={classes.actionButton}
              >
                Push Job Template
              </Button>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export const LastJobRunCell = ({ jobRun }: { jobRun: LastJobRun }) => {
  if (jobRun.status === 'none') {
    return (
      <Typography variant="body2" color="textSecondary">
        N/A
      </Typography>
    );
  }

  const colorMap: Record<string, string> = {
    success: '#4caf50',
    failed: '#f44336',
    running: '#2196f3',
  };
  const labelMap: Record<string, string> = {
    success: 'Success',
    failed: 'Failed',
    running: 'Running',
  };

  return (
    <Box display="flex" alignItems="center" style={{ gap: 6 }}>
      <CheckCircleIcon
        style={{
          color: colorMap[jobRun.status],
          fontSize: 16,
        }}
      />
      <Typography variant="body2">
        {labelMap[jobRun.status]}
        {jobRun.timestamp && (
          <span style={{ color: '#888', marginLeft: 4, fontSize: 12 }}>
            at {jobRun.timestamp}
          </span>
        )}
      </Typography>
    </Box>
  );
};

export const AapColumnHeader = () => (
  <Box display="flex" alignItems="center" style={{ gap: 4 }}>
    AAP
    <Tooltip title="Whether the AAP project and job template have been pushed to your Ansible Controller. Push to AAP is a manual action.">
      <HelpOutlineIcon style={{ fontSize: 14, color: '#999' }} />
    </Tooltip>
  </Box>
);

export const LastJobRunColumnHeader = () => (
  <Box display="flex" alignItems="center" style={{ gap: 4 }}>
    Last Job Run
    <Tooltip title="Status and time of the most recent job execution in AAP.">
      <HelpOutlineIcon style={{ fontSize: 14, color: '#999' }} />
    </Tooltip>
  </Box>
);
