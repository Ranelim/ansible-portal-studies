import { useState } from 'react';
import {
  Box,
  Tooltip,
  Typography,
  Popover,
  IconButton,
  Button,
  Collapse,
  Divider,
  Link,
  makeStyles,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CloseIcon from '@material-ui/icons/Close';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
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
    padding: '6px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  stageRowExpanded: {
    backgroundColor: theme.palette.action.selected,
  },
  expandedContent: {
    padding: '4px 8px 8px 34px',
  },
  stageDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  stageMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    fontSize: 11,
    color: theme.palette.text.secondary,
  },
  viewLogLink: {
    fontSize: 11,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  },
  popoverContent: {
    padding: theme.spacing(2.5),
    maxWidth: 440,
    minWidth: 360,
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
    flex: 1,
  },
  stageTimestamp: {
    color: theme.palette.text.secondary,
    fontSize: 11,
    flexShrink: 0,
  },
  expandIcon: {
    fontSize: 16,
    color: theme.palette.text.secondary,
  },
  iconWrapper: {
    display: 'inline-flex',
    cursor: 'pointer',
    borderRadius: 2,
    padding: 1,
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  popoverFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  footerLink: {
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  aiButton: {
    textTransform: 'none',
    fontSize: 12,
    borderRadius: 16,
    padding: '4px 12px',
    fontWeight: 500,
  },
  aiIcon: {
    fontSize: 14,
    marginRight: 4,
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

const LightspeedIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

export const PipelineStatusIcons = ({
  stages,
  pipelineType,
}: {
  stages: PipelineStage[];
  pipelineType: string;
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const handleStageClick = (event: React.MouseEvent<HTMLElement>, stageIndex: number) => {
    event.stopPropagation();
    setExpandedStage(stageIndex);
    setAnchorEl(event.currentTarget.closest('[data-pipeline-row]') as HTMLElement || event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setExpandedStage(null);
  };

  const toggleExpand = (index: number) => {
    setExpandedStage(prev => (prev === index ? null : index));
  };

  const handleViewLog = (stageName: string) => {
    // eslint-disable-next-line no-console
    console.log(`View log: ${stageName}`);
  };

  const handleAiSummarize = () => {
    const failedStages = stages.filter(s => s.status === 'failed');
    const context = failedStages.length > 0
      ? `Summarize this pipeline failure for ${pipelineName}. Failed stages: ${failedStages.map(s => `${s.name}${s.detail ? ` (${s.detail})` : ''}`).join(', ')}`
      : `Summarize the ${pipelineName} status: ${overallStatus}. Stages: ${stages.map(s => `${s.name}: ${s.status}`).join(', ')}`;
    window.dispatchEvent(new CustomEvent('lightspeed:open', { detail: { context } }));
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
        style={{ gap: 2 }}
        data-pipeline-row
      >
        {stages.map((stage, i) => (
          <Tooltip key={i} title={`${stage.name}: ${statusLabel(stage.status)}`} arrow>
            <span
              className={classes.iconWrapper}
              onClick={e => handleStageClick(e, i)}
              role="button"
              tabIndex={0}
            >
              <StageIconSimple status={stage.status} size={20} />
            </span>
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
                organizational standards before it can be pushed to AAP.
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {stages.map((stage, i) => (
            <Box key={i}>
              <Box
                className={`${classes.stageRow} ${expandedStage === i ? classes.stageRowExpanded : ''}`}
                onClick={() => toggleExpand(i)}
              >
                <StageIconSimple status={stage.status} size={18} />
                <Typography className={classes.stageLabel}>
                  {stage.name}: {statusLabel(stage.status)}
                </Typography>
                {stage.duration && (
                  <Typography className={classes.stageTimestamp}>
                    {stage.duration}
                  </Typography>
                )}
                {expandedStage === i
                  ? <ExpandLessIcon className={classes.expandIcon} />
                  : <ExpandMoreIcon className={classes.expandIcon} />}
              </Box>
              <Collapse in={expandedStage === i}>
                <Box className={classes.expandedContent}>
                  <Typography className={classes.stageDescription}>
                    {stage.description}
                  </Typography>
                  {stage.detail && (
                    <Typography className={classes.stageDescription} style={{ fontStyle: 'italic' }}>
                      {stage.detail}
                    </Typography>
                  )}
                  <Box className={classes.stageMeta}>
                    {stage.timestamp && (
                      <Typography variant="caption" color="textSecondary">
                        {stage.timestamp}
                      </Typography>
                    )}
                    {stage.status !== 'pending' && (
                      <Link
                        className={classes.viewLogLink}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleViewLog(stage.name);
                        }}
                      >
                        <DescriptionOutlinedIcon style={{ fontSize: 12 }} />
                        View log
                      </Link>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          ))}

          <Divider style={{ margin: '8px 0 0' }} />
          <Box className={classes.popoverFooter}>
            <Link className={classes.footerLink} onClick={() => { /* eslint-disable-next-line no-console */ console.log('View full pipeline'); }}>
              View full pipeline
              <OpenInNewIcon style={{ fontSize: 12 }} />
            </Link>
            <Button
              variant="outlined"
              size="small"
              className={classes.aiButton}
              onClick={handleAiSummarize}
            >
              <LightspeedIcon size={13} />
              Summarize with Lightspeed
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export const PipelineColumnHeader = () => (
  <Box display="flex" alignItems="center" style={{ gap: 4 }}>
    Pipeline
    <Tooltip title="CI/CD pipeline status for this project. Click any stage icon to see details." arrow>
      <span style={{ display: 'inline-flex', cursor: 'help' }}>
        <HelpOutlineIcon style={{ fontSize: 14, color: '#999' }} />
      </span>
    </Tooltip>
  </Box>
);
