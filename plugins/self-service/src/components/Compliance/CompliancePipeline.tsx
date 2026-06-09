import { Box, Typography, makeStyles, ButtonBase } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import LoopIcon from '@material-ui/icons/Loop';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { statusColors } from '../common/statusColors';
import type { ProfileStatus } from './complianceDemoData';

type StepStatus = 'completed' | 'active' | 'active-running' | 'upcoming';

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  number: number;
}

export const STEP_DEFINITIONS = [
  {
    id: 'review',
    label: 'Select rules',
    description: 'Review the scan findings and select which failing rules to remediate.',
  },
  {
    id: 'plan',
    label: 'Review remediations',
    description: 'Review the generated Ansible playbook that will fix the selected rules.',
  },
  {
    id: 'remediate',
    label: 'Run & verify',
    description: 'The remediation playbook runs across all targeted hosts, followed by an automatic verification scan.',
  },
];

function profileStatusToSteps(status: ProfileStatus): PipelineStep[] {
  const statusIndex: Record<ProfileStatus, number> = {
    'not-scanned': -1,
    'assessed': 0,
    'plan-ready': 1,
    'remediating': 2,
    'verified': 3,
  };

  const activeIndex = statusIndex[status];
  const isRunning = status === 'remediating';

  return STEP_DEFINITIONS.map((step, i) => {
    let stepStatus: StepStatus;
    if (i < activeIndex) {
      stepStatus = 'completed';
    } else if (i === activeIndex) {
      stepStatus = isRunning ? 'active-running' : 'active';
    } else {
      stepStatus = 'upcoming';
    }
    return { ...step, status: stepStatus, number: i + 1 };
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
    gap: theme.spacing(0.75),
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
  arrow: {
    fontSize: 14,
    margin: theme.spacing(0, 0.5),
  },
  numberBadge: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
  },
  iconCompleted: {
    fontSize: 20,
    color: statusColors.success,
  },
  iconRunning: {
    fontSize: 18,
    animation: '$spin 1.2s linear infinite',
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
}));

function StepIcon({ step }: { step: PipelineStep }) {
  const classes = useStyles();

  switch (step.status) {
    case 'completed':
      return <CheckCircleIcon className={classes.iconCompleted} />;
    case 'active':
      return (
        <Box
          className={classes.numberBadge}
          style={{ backgroundColor: statusColors.info, color: '#fff' }}
        >
          {step.number}
        </Box>
      );
    case 'active-running':
      return <LoopIcon className={classes.iconRunning} style={{ color: statusColors.warning }} />;
    case 'upcoming':
      return (
        <Box
          className={classes.numberBadge}
          style={{ border: '1.5px solid #c0c0c0', color: '#a0a0a0' }}
        >
          {step.number}
        </Box>
      );
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

function getArrowColor(currentStatus: StepStatus, nextStatus: StepStatus): string {
  if (currentStatus === 'completed' && nextStatus !== 'upcoming') {
    return `${statusColors.success}80`;
  }
  return '#d0d0d0';
}

interface CompliancePipelineProps {
  profileStatus: ProfileStatus;
  activeStepId?: string | null;
  onStepClick?: (stepId: string) => void;
}

export const CompliancePipeline = ({ profileStatus, activeStepId, onStepClick }: CompliancePipelineProps) => {
  const classes = useStyles();
  const steps = profileStatusToSteps(profileStatus);

  if (profileStatus === 'not-scanned') return null;

  const allCompleted = profileStatus === 'verified';
  const selectedStep = activeStepId
    ? steps.find(s => s.id === activeStepId)
    : steps.find(s => s.status === 'active' || s.status === 'active-running');

  return (
    <Box>
      <Box className={classes.pipeline}>
        {steps.map((step, i) => (
          <Box key={step.id} display="flex" alignItems="center">
            {i > 0 && (
              <ArrowForwardIcon
                className={classes.arrow}
                style={{ color: getArrowColor(steps[i - 1].status, step.status) }}
              />
            )}
            <ButtonBase
              className={classes.stepButton}
              onClick={() => onStepClick?.(step.id)}
              style={{
                opacity: step.status === 'upcoming' ? 0.55 : 1,
                backgroundColor: selectedStep?.id === step.id && step.status !== 'upcoming'
                  ? `${getStepColor(step.status)}08`
                  : undefined,
              }}
            >
              <StepIcon step={step} />
              <Typography
                className={classes.stepLabel}
                style={{
                  color: getStepColor(step.status),
                  fontWeight: step.status === 'active' || step.status === 'active-running'
                    ? 700
                    : selectedStep?.id === step.id ? 600 : 500,
                }}
              >
                {step.label}
              </Typography>
            </ButtonBase>
          </Box>
        ))}
        {allCompleted && (
          <>
            <ArrowForwardIcon
              className={classes.arrow}
              style={{ color: `${statusColors.success}80` }}
            />
            <Box
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 12,
                backgroundColor: `${statusColors.success}12`,
              }}
            >
              <CheckCircleIcon style={{ fontSize: 14, color: statusColors.success }} />
              <Typography style={{ fontSize: 12, fontWeight: 700, color: statusColors.success }}>
                Verified
              </Typography>
            </Box>
          </>
        )}
      </Box>

    </Box>
  );
};
