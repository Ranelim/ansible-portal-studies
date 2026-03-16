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

const StatusIcon = ({ status }: { status: 'synced' | 'pending' | 'error' }) => {
  if (status === 'synced') {
    return <CheckCircleIcon style={{ color: '#4caf50', fontSize: 18 }} />;
  }
  if (status === 'error') {
    return <ErrorIcon style={{ color: '#f44336', fontSize: 18 }} />;
  }
  return <RadioButtonUncheckedIcon style={{ color: '#bdbdbd', fontSize: 18 }} />;
};

const statusText = (status: 'synced' | 'pending' | 'error') => {
  if (status === 'synced') return 'Synced';
  if (status === 'error') return 'Error';
  return 'Pending';
};

const getOverallLabel = (aap: AapStatusType) => {
  if (aap.project === 'synced' && aap.jobTemplate === 'synced')
    return 'Published';
  if (aap.project === 'error' || aap.jobTemplate === 'error') return 'Error';
  return 'Pending';
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
        <Tooltip title={`AAP Project: ${statusText(aap.project)}`}>
          <Box display="flex">
            <StatusIcon status={aap.project} />
          </Box>
        </Tooltip>
        <Tooltip title={`Job Template: ${statusText(aap.jobTemplate)}`}>
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
                AAP Promotion: {overallLabel}
              </Typography>
              <Typography className={classes.popoverDescription}>
                This action uses the service manifest in your repository to
                synchronize project and job template definitions with your
                Ansible Controller.
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
            {aap.project === 'pending' && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                className={classes.actionButton}
              >
                Create AAP Project...
              </Button>
            )}
          </Box>
          <Box className={classes.statusRow}>
            <StatusIcon status={aap.jobTemplate} />
            <Typography className={classes.statusLabel}>
              AAP Job Template: {statusText(aap.jobTemplate)}
            </Typography>
            {aap.jobTemplate === 'pending' && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                className={classes.actionButton}
              >
                Create AAP Job Template
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
    <Tooltip title="AAP promotion status. Shows whether the project and job template are synced to your Ansible Controller.">
      <HelpOutlineIcon style={{ fontSize: 14, color: '#999' }} />
    </Tooltip>
  </Box>
);

export const LastJobRunColumnHeader = () => (
  <Box display="flex" alignItems="center" style={{ gap: 4 }}>
    Last AAP Job Run
    <Tooltip title="Status of the most recent job run in AAP for this project.">
      <HelpOutlineIcon style={{ fontSize: 14, color: '#999' }} />
    </Tooltip>
  </Box>
);
