import { useState } from 'react';
import {
  Box,
  Tooltip,
  Typography,
  Popover,
  IconButton,
  makeStyles,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CloseIcon from '@material-ui/icons/Close';
import type { PipelineStage } from './projectsDemoData';

const useStyles = makeStyles(theme => ({
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  spinIcon: {
    animation: '$spin 1.5s linear infinite',
  },
  stageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
  },
  popoverContent: {
    padding: theme.spacing(2.5),
    maxWidth: 420,
    minWidth: 340,
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
  stageLabel: {
    fontSize: 13,
  },
  stageTimestamp: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    marginLeft: 'auto',
  },
}));

const StageIconSimple = ({
  status,
  size = 18,
}: {
  status: PipelineStage['status'];
  size?: number;
}) => {
  const classes = useStyles();
  const colorMap: Record<string, string> = {
    passed: '#4caf50',
    failed: '#f44336',
    running: '#2196f3',
    pending: '#bdbdbd',
  };
  const color = colorMap[status] || '#bdbdbd';

  if (status === 'pending') {
    return <RadioButtonUncheckedIcon style={{ color, fontSize: size }} />;
  }
  if (status === 'failed') {
    return <ErrorIcon style={{ color, fontSize: size }} />;
  }
  if (status === 'running') {
    return <AutorenewIcon style={{ color, fontSize: size }} className={classes.spinIcon} />;
  }
  return <CheckCircleIcon style={{ color, fontSize: size }} />;
};

const statusLabel = (status: PipelineStage['status']) => {
  switch (status) {
    case 'passed': return 'Passed';
    case 'failed': return 'Failed';
    case 'running': return 'In progress';
    case 'pending': return 'Pending';
    default: return status;
  }
};

const getPipelineOverallStatus = (stages: PipelineStage[]) => {
  if (stages.some(s => s.status === 'failed')) return 'Failed';
  if (stages.some(s => s.status === 'running')) return 'Running...';
  if (stages.every(s => s.status === 'passed')) return 'Passed';
  return 'Pending';
};

export const PipelineStatusIcons = ({
  stages,
  pipelineType,
}: {
  stages: PipelineStage[];
  pipelineType: string;
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const overallStatus = getPipelineOverallStatus(stages);
  const pipelineName =
    pipelineType === 'comprehensive'
      ? 'Comprehensive Pipeline'
      : 'Standard Pipeline';

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        style={{ gap: 2, cursor: 'pointer' }}
        onClick={handleClick}
      >
        {stages.map((stage, i) => (
          <Tooltip key={i} title={`${stage.name}: ${statusLabel(stage.status)}`}>
            <Box display="flex">
              <StageIconSimple status={stage.status} size={20} />
            </Box>
          </Tooltip>
        ))}
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
                {pipelineName}: {overallStatus}
              </Typography>
              <Typography className={classes.popoverDescription}>
                This automated pipeline validates your code against
                organizational standards before it can be promoted to AAP.
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          {stages.map((stage, i) => (
            <Box key={i} className={classes.stageRow}>
              <StageIconSimple status={stage.status} size={18} />
              <Typography className={classes.stageLabel}>
                {stage.name}: {statusLabel(stage.status)}
              </Typography>
              {stage.timestamp && (
                <Typography className={classes.stageTimestamp}>
                  {stage.timestamp}
                </Typography>
              )}
            </Box>
          ))}
          {stages[0]?.detail && (
            <Typography
              style={{ fontSize: 11, color: '#888', marginTop: 8 }}
            >
              {stages[0].detail}
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
};

export const PipelineColumnHeader = () => (
  <Box display="flex" alignItems="center" style={{ gap: 4 }}>
    Pipeline
    <Tooltip title="CI/CD pipeline status for this project. Click to see stage details.">
      <HelpOutlineIcon style={{ fontSize: 14, color: '#999' }} />
    </Tooltip>
  </Box>
);
