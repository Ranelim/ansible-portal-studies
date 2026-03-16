import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stepper,
  Step,
  StepLabel,
  Switch,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import type { DemoTemplate } from './templatesDemoData';

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 900,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  backButton: {
    textTransform: 'none',
    fontWeight: 500,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(0.5),
  },
  templateBadge: {
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
  },
  subtitle: {
    color: theme.palette.text.secondary,
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: theme.spacing(3),
  },
  stepper: {
    padding: theme.spacing(0, 0, 3, 0),
    backgroundColor: 'transparent',
  },
  stepContent: {
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(3),
  },
  stepTitle: {
    fontWeight: 600,
    fontSize: 18,
    marginBottom: theme.spacing(0.5),
  },
  stepDescription: {
    color: theme.palette.text.secondary,
    fontSize: 14,
    marginBottom: theme.spacing(3),
  },
  fieldGroup: {
    marginBottom: theme.spacing(3),
  },
  aiBox: {
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
  aiButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 16,
    marginTop: theme.spacing(1),
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(2),
  },
  nextButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    padding: '8px 28px',
  },
  prevButton: {
    textTransform: 'none',
  },
  pipelineOption: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  pipelineOptionSelected: {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    backgroundColor: theme.palette.type === 'dark'
      ? 'rgba(25, 118, 210, 0.08)'
      : 'rgba(25, 118, 210, 0.04)',
  },
  pipelineTitle: {
    fontWeight: 600,
    fontSize: 14,
  },
  pipelineDescription: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    lineHeight: 1.5,
    margin: theme.spacing(0.5, 0, 1, 0),
  },
  pipelineStages: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing(0.5),
  },
  stageLabels: {
    color: theme.palette.text.secondary,
    fontSize: 11,
  },
  successContainer: {
    textAlign: 'center',
    padding: theme.spacing(6, 2),
  },
  successIcon: {
    fontSize: 64,
    color: '#4caf50',
    marginBottom: theme.spacing(2),
  },
}));

const COMPREHENSIVE_STAGES = [
  'Commit', 'Lint', 'Policy Check', 'EE Compatibility', 'Integration Test', 'Pushed to AAP',
];
const STANDARD_STAGES = [
  'Commit', 'Lint', 'Policy Check', 'EE Compatibility', 'Pushed to AAP',
];

const PipelineStageIcons = ({ count }: { count: number }) => (
  <Box display="flex" alignItems="center" style={{ gap: 3 }}>
    {Array.from({ length: count }).map((_, i) => (
      <CheckCircleIcon key={i} style={{ color: '#4caf50', fontSize: 20 }} />
    ))}
  </Box>
);

const CustomStageIcons = ({ count }: { count: number }) => (
  <Box display="flex" alignItems="center" style={{ gap: 3 }}>
    {Array.from({ length: count }).map((_, i) => (
      <RadioButtonUncheckedIcon key={i} style={{ color: '#bdbdbd', fontSize: 20 }} />
    ))}
  </Box>
);

// Step 1: Details & AI Jumpstart
const DetailsStep = ({ template }: { template: DemoTemplate }) => {
  const classes = useStyles();
  return (
    <Box>
      <Box className={classes.aiBox}>
        <Typography className={classes.aiHeader}>
          Lightspeed AI Jumpstart
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          placeholder={`Describe the service you want to build (e.g., "Create a new ${template.title} in GitHub").`}
        />
        <Button
          variant="contained"
          color="primary"
          size="small"
          className={classes.aiButton}
        >
          Generate settings with AI
        </Button>
      </Box>
      <Divider />
      <Typography variant="subtitle2" style={{ margin: '16px 0 12px' }}>
        Manual configuration
      </Typography>
      <Box className={classes.fieldGroup}>
        <TextField
          label="Service name"
          variant="outlined"
          fullWidth
          required
          helperText="Lowercase letters, numbers, and hyphens only"
          style={{ marginBottom: 16 }}
        />
        <TextField
          label="Service description"
          variant="outlined"
          fullWidth
          required
          style={{ marginBottom: 16 }}
        />
        <TextField
          label="Owner"
          variant="outlined"
          fullWidth
          defaultValue={template.owner.replace('group:default/', '')}
        />
      </Box>
    </Box>
  );
};

// Step 2: Source Code (Git)
const SourceCodeStep = () => {
  const classes = useStyles();
  return (
    <Box>
      <Box className={classes.fieldGroup}>
        <TextField
          label="Repository Location"
          variant="outlined"
          fullWidth
          required
          placeholder="github.com / my-org / project-name"
          style={{ marginBottom: 16 }}
        />
        <FormControl variant="outlined" fullWidth style={{ marginBottom: 16 }}>
          <InputLabel>Repository Visibility</InputLabel>
          <Select defaultValue="private" label="Repository Visibility">
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
            <MenuItem value="internal">Internal</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Default Branch"
          variant="outlined"
          fullWidth
          defaultValue="main"
          style={{ marginBottom: 16 }}
        />
      </Box>
      <Divider />
      <Typography variant="subtitle2" style={{ margin: '16px 0 12px' }}>
        Optional scaffolding
      </Typography>
      <Box display="flex" flexDirection="column" style={{ gap: 4 }}>
        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="Include Ansible Lint config"
        />
        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="Include Molecule testing"
        />
      </Box>
    </Box>
  );
};

// Step 3: Pipeline & Governance
const PipelineStep = ({ template }: { template: DemoTemplate }) => {
  const classes = useStyles();
  const [selected, setSelected] = useState<string>(template.defaultPipeline);

  return (
    <Box>
      <Box
        className={`${classes.pipelineOption} ${selected === 'comprehensive' ? classes.pipelineOptionSelected : ''}`}
        onClick={() => setSelected('comprehensive')}
      >
        <FormControlLabel
          value="comprehensive"
          control={<Radio checked={selected === 'comprehensive'} color="primary" />}
          label=""
          style={{ marginRight: 0 }}
        />
        <Typography className={classes.pipelineTitle} component="span">
          Comprehensive pipeline (recommended)
        </Typography>
        <Typography className={classes.pipelineDescription}>
          The safest path to production. Enforces all code quality and security
          policies, plus live integration testing on temporary infrastructure
          before final deployment.
        </Typography>
        <PipelineStageIcons count={COMPREHENSIVE_STAGES.length} />
        <Typography className={classes.stageLabels}>
          {COMPREHENSIVE_STAGES.join(' > ')}
        </Typography>
      </Box>

      <Box
        className={`${classes.pipelineOption} ${selected === 'standard' ? classes.pipelineOptionSelected : ''}`}
        onClick={() => setSelected('standard')}
      >
        <FormControlLabel
          value="standard"
          control={<Radio checked={selected === 'standard'} color="primary" />}
          label=""
          style={{ marginRight: 0 }}
        />
        <Typography className={classes.pipelineTitle} component="span">
          Standard pipeline
        </Typography>
        <Typography className={classes.pipelineDescription}>
          A faster, streamlined pipeline. Enforces mandatory syntax, policy,
          and Execution Environment checks, but bypasses live integration
          testing.
        </Typography>
        <PipelineStageIcons count={STANDARD_STAGES.length} />
        <Typography className={classes.stageLabels}>
          {STANDARD_STAGES.join(' > ')}
        </Typography>
      </Box>

      <Box
        className={`${classes.pipelineOption} ${selected === 'custom' ? classes.pipelineOptionSelected : ''}`}
        onClick={() => setSelected('custom')}
      >
        <FormControlLabel
          value="custom"
          control={<Radio checked={selected === 'custom'} color="primary" />}
          label=""
          style={{ marginRight: 0 }}
        />
        <Typography className={classes.pipelineTitle} component="span">
          Custom pipeline
        </Typography>
        <Typography className={classes.pipelineDescription}>
          Build a tailored pipeline. Manually configure the specific linting,
          governance, and testing gates that apply to this service.
        </Typography>
        <CustomStageIcons count={3} />
        <Typography className={classes.stageLabels}>
          Customize steps
        </Typography>
      </Box>
    </Box>
  );
};

// Step 4: Destination (AAP)
const DestinationStep = () => {
  const classes = useStyles();
  return (
    <Box>
      <Box className={classes.fieldGroup}>
        <FormControl variant="outlined" fullWidth style={{ marginBottom: 16 }}>
          <InputLabel>AAP Controller</InputLabel>
          <Select defaultValue="" label="AAP Controller">
            <MenuItem value="prod-controller">Production Controller (aap.example.com)</MenuItem>
            <MenuItem value="dev-controller">Development Controller (aap-dev.example.com)</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="AAP Organization"
          variant="outlined"
          fullWidth
          defaultValue="Default"
          style={{ marginBottom: 16 }}
        />
        <FormControl variant="outlined" fullWidth style={{ marginBottom: 16 }}>
          <InputLabel>Execution Environment</InputLabel>
          <Select defaultValue="" label="Execution Environment">
            <MenuItem value="ee-minimal">Minimal Execution Environment</MenuItem>
            <MenuItem value="ee-supported">Red Hat Supported EE</MenuItem>
            <MenuItem value="ee-custom">Custom EE (cloud-tools)</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Divider />
      <Typography variant="subtitle2" style={{ margin: '16px 0 12px' }}>
        Auto-provisioning
      </Typography>
      <Box display="flex" flexDirection="column" style={{ gap: 4 }}>
        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="Auto-create AAP Project from Git repository"
        />
        <FormControlLabel
          control={<Switch defaultChecked color="primary" />}
          label="Auto-create Job Template"
        />
      </Box>
    </Box>
  );
};

// Success screen
const SuccessScreen = ({
  template,
  onClose,
}: {
  template: DemoTemplate;
  onClose: () => void;
}) => {
  const classes = useStyles();
  return (
    <Box className={classes.successContainer}>
      <CheckCircleIcon className={classes.successIcon} />
      <Typography variant="h5" style={{ fontWeight: 600, marginBottom: 8 }}>
        Project created successfully!
      </Typography>
      <Typography color="textSecondary" style={{ marginBottom: 24 }}>
        Your <strong>{template.title}</strong> has been scaffolded. The Git
        repository has been created, the CI/CD pipeline configured, and the
        project registered in AAP.
      </Typography>
      <Typography
        variant="body2"
        color="textSecondary"
        style={{ marginBottom: 24, fontStyle: 'italic' }}
      >
        (This is a prototype demo -- no actual resources were created.)
      </Typography>
      <Box display="flex" justifyContent="center" style={{ gap: 12 }}>
        <Button variant="outlined" onClick={onClose}>
          Back to Templates
        </Button>
        <Button variant="contained" color="primary" onClick={onClose}>
          View Project
        </Button>
      </Box>
    </Box>
  );
};

export const ProjectCreateWizard = ({
  template,
  onClose,
}: {
  template: DemoTemplate;
  onClose: () => void;
}) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleNext = useCallback(() => {
    if (activeStep === template.steps.length - 1) {
      setCompleted(true);
    } else {
      setActiveStep(prev => prev + 1);
    }
  }, [activeStep, template.steps.length]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  if (completed) {
    return <SuccessScreen template={template} onClose={onClose} />;
  }

  const currentStep = template.steps[activeStep];

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onClose}
          className={classes.backButton}
        >
          Templates
        </Button>
      </Box>
      <Box className={classes.titleRow}>
        <Typography variant="h5" style={{ fontWeight: 600 }}>
          Create Service
        </Typography>
        <Chip label="Template" size="small" className={classes.templateBadge} />
      </Box>
      <Typography className={classes.subtitle}>
        Create a governed automation repository and pipeline from this template.
        This setup automatically generates your project structure and connects
        it to the Ansible Automation Platform, enforcing quality, security, and
        compatibility checks before any code is promoted to an active Job
        Template.
      </Typography>

      <Stepper activeStep={activeStep} className={classes.stepper} alternativeLabel={false}>
        {template.steps.map((step, index) => (
          <Step key={step.title} completed={index < activeStep}>
            <StepLabel>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box className={classes.stepContent}>
        <Typography className={classes.stepTitle}>
          {currentStep.title}
        </Typography>
        <Typography className={classes.stepDescription}>
          {currentStep.description}
        </Typography>

        {activeStep === 0 && <DetailsStep template={template} />}
        {activeStep === 1 && <SourceCodeStep />}
        {activeStep === 2 && <PipelineStep template={template} />}
        {activeStep === 3 && <DestinationStep />}
      </Box>

      <Box className={classes.actions}>
        {activeStep > 0 && (
          <Button onClick={handleBack} className={classes.prevButton}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          className={classes.nextButton}
        >
          {activeStep === template.steps.length - 1 ? 'Create' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};
