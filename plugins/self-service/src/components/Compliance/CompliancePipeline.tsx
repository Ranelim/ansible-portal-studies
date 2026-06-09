import { Box, Typography, makeStyles, ButtonBase } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import LoopIcon from '@material-ui/icons/Loop';
import { statusColors } from '../common/statusColors';
import type { ProfileStatus } from './complianceDemoData';

type StepStatus = 'completed' | 'active' | 'active-running' | 'upcoming';

interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  description?: string;
}

const STEP_DEFINITIONS = [
  { id: 'assess', label: 'Scanned' },
  { id: 'review', label: 'Review findings' },
  { id: 'build', label: 'Build remediation' },
  { id: 'remediate', label: 'Remediate' },
  { id: 'verify', label: 'Verify' },
];

function profileStatusToSteps(status: ProfileStatus): PipelineStep[] {
  const statusIndex: Record<ProfileStatus, number> = {
    'not-scanned': -1,
    'assessed': 1,
    'remediation-in-progress': 3,
    'verification-pending': 4,
    'verified': 5,
  };

  const activeIndex = statusIndex[status];
  const isRunning = status === 'remediation-in-progress';

  return STEP_DEFINITIONS.map((step, i) => {
    let stepStatus: StepStatus;
    if (i < activeIndex) {
      stepStatus = 'completed';
    } else if (i === activeIndex) {
      stepStatus = isRunning ? 'active-running' : 'active';
    } else {
      stepStatus = 'upcoming';
    }
    return { ...step, status: stepStatus };
  });
}

const useStyles = makeStyles(theme => ({
  pipeline: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2, 0),
    marginBottom: theme.spacing(1),
    overflowX: 'auto',
  },
  stepButton: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 1.5),
    borderRadius: 20,
    transition: 'background-color 0.15s ease',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1,
  },
  connector: {
    flex: '0 0 auto',
    width: 24,
    height: 2,
    margin: theme.spacing(0, 0.25),
    borderRadius: 1,
  },
  iconCompleted: {
    fontSize: 18,
    color: statusColors.success,
  },
  iconActive: {
    fontSize: 18,
  },
  iconRunning: {
    fontSize: 16,
    animation: '$spin 1.2s linear infinite',
  },
  iconUpcoming: {
    fontSize: 18,
    color: theme.palette.text.disabled,
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
}));

function StepIcon({ status }: { status: StepStatus }) {
  const classes = useStyles();

  switch (status) {
    case 'completed':
      return <CheckCircleIcon className={classes.iconCompleted} />;
    case 'active':
      return <FiberManualRecordIcon className={classes.iconActive} style={{ color: statusColors.info }} />;
    case 'active-running':
      return <LoopIcon className={classes.iconRunning} style={{ color: statusColors.warning }} />;
    case 'upcoming':
      return <RadioButtonUncheckedIcon className={classes.iconUpcoming} />;
  }
}

function getStepColor(status: StepStatus): string {
  switch (status) {
    case 'completed': return statusColors.success;
    case 'active': return statusColors.info;
    case 'active-running': return statusColors.warning;
    case 'upcoming': return statusColors.pending;
  }
}

interface CompliancePipelineProps {
  profileStatus: ProfileStatus;
  onStepClick?: (stepId: string) => void;
}

export const CompliancePipeline = ({ profileStatus, onStepClick }: CompliancePipelineProps) => {
  const classes = useStyles();
  const steps = profileStatusToSteps(profileStatus);

  if (profileStatus === 'not-scanned') return null;

  return (
    <Box className={classes.pipeline}>
      {steps.map((step, i) => (
        <Box key={step.id} display="flex" alignItems="center">
          {i > 0 && (
            <Box
              className={classes.connector}
              style={{
                backgroundColor:
                  step.status === 'upcoming'
                    ? `${statusColors.pending}40`
                    : `${statusColors.success}60`,
              }}
            />
          )}
          <ButtonBase
            className={classes.stepButton}
            onClick={() => onStepClick?.(step.id)}
            style={{
              opacity: step.status === 'upcoming' ? 0.55 : 1,
            }}
          >
            <StepIcon status={step.status} />
            <Typography
              className={classes.stepLabel}
              style={{
                color: getStepColor(step.status),
                fontWeight: step.status === 'active' || step.status === 'active-running' ? 700 : 500,
              }}
            >
              {step.label}
            </Typography>
          </ButtonBase>
        </Box>
      ))}
    </Box>
  );
};
