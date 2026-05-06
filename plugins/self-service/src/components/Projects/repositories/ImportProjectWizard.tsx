import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  Select,
  Stepper,
  Step,
  StepLabel,
  Switch,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import GitHubIcon from '@material-ui/icons/GitHub';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import CategoryIcon from '@material-ui/icons/Category';
import MemoryIcon from '@material-ui/icons/Memory';
import type { DiscoveredRepo } from './repositoriesDemoData';
import { PIPELINE_PROFILES, type PipelineProfile } from '../catalog/unifiedDemoData';

type WizardState = {
  projectName: string;
  description: string;
  owner: string;
  pipelineProfileId: string;
  executionEnvironment: string;
  aapController: string;
  aapOrganization: string;
  autoCreateProject: boolean;
  autoCreateJobTemplate: boolean;
};

const STEPS = [
  {
    label: 'Repository details',
    description: 'Review what was discovered in this repository and configure governance settings.',
  },
  {
    label: 'Pipeline & governance',
    description: 'Choose a CI/CD pipeline to validate content quality before deployment.',
  },
  {
    label: 'Destination (AAP)',
    description: 'Connect this repository to your Ansible Automation Platform.',
  },
];

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 900,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(3),
  },
  backButton: {
    color: theme.palette.text.secondary,
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: '1.25rem',
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  stepContent: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: 15,
    marginBottom: theme.spacing(1.5),
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.6,
    marginBottom: theme.spacing(2.5),
  },
  fieldGroup: {
    marginBottom: theme.spacing(3),
  },
  fieldLabel: {
    fontWeight: 600,
    fontSize: 13,
    marginBottom: theme.spacing(0.5),
  },
  fieldHint: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  repoSummary: {
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    backgroundColor: theme.palette.background.default,
    marginBottom: theme.spacing(3),
  },
  repoName: {
    fontWeight: 600,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  repoMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  resourcesSummary: {
    display: 'flex',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1.5),
    flexWrap: 'wrap' as const,
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  resourceIcon: {
    fontSize: 14,
    color: theme.palette.primary.main,
  },
  pipelineOption: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2),
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    marginBottom: theme.spacing(1.5),
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  pipelineOptionSelected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}08`,
  },
  pipelineTitle: {
    fontWeight: 600,
    fontSize: 14,
  },
  pipelineDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    lineHeight: 1.5,
  },
  pipelineStages: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    flexWrap: 'wrap' as const,
  },
  stageChip: {
    fontSize: 11,
    height: 22,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  reviewSection: {
    marginBottom: theme.spacing(2),
  },
  reviewLabel: {
    fontWeight: 600,
    fontSize: 12,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: theme.spacing(0.5),
  },
  reviewValue: {
    fontSize: 14,
  },
  settingsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5, 0),
  },
  infoIcon: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    marginLeft: 4,
    cursor: 'help',
  },
}));

const resourceIconMap: Record<string, React.FC<{ className?: string }>> = {
  playbook: (props) => <InsertDriveFileOutlinedIcon {...props} />,
  role: (props) => <FolderOutlinedIcon {...props} />,
  'collection-dep': (props) => <CategoryIcon {...props} />,
  'execution-environment': (props) => <MemoryIcon {...props} />,
};

const resourceLabelMap: Record<string, string> = {
  playbook: 'playbook',
  role: 'role',
  'collection-dep': 'collection',
  'execution-environment': 'EE',
};

export const ImportProjectWizard = ({
  repo,
  onClose,
  onComplete,
}: {
  repo: DiscoveredRepo;
  onClose: () => void;
  onComplete: (repoName: string) => void;
}) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<WizardState>({
    projectName: repo.name,
    description: '',
    owner: 'platform-engineering',
    pipelineProfileId: 'org-default',
    executionEnvironment: 'ee-supported',
    aapController: 'prod-controller',
    aapOrganization: 'Default',
    autoCreateProject: true,
    autoCreateJobTemplate: true,
  });

  const updateField = useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      setForm(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => prev - 1);
  const handleCreate = () => onComplete(repo.name);

  const renderRepoSummary = () => (
    <Box className={classes.repoSummary}>
      <Typography className={classes.repoName}>
        <GitHubIcon style={{ fontSize: 18 }} />
        {repo.org}/{repo.name}
      </Typography>
      <Typography className={classes.repoMeta}>
        Branch: <code style={{ fontSize: 11 }}>{repo.branch}</code> — Last
        commit:{' '}
        <code style={{ fontSize: 11 }}>
          {repo.lastCommitHash.substring(0, 7)}
        </code>{' '}
        by {repo.lastCommitAuthor}
      </Typography>
      <Box className={classes.resourcesSummary}>
        {repo.resources.map(r => {
          const Icon = resourceIconMap[r.type];
          return (
            <Box key={r.type} className={classes.resourceItem}>
              {Icon && <Icon className={classes.resourceIcon} />}
              <span>
                {r.count} {resourceLabelMap[r.type]}
                {r.count > 1 ? 's' : ''}
              </span>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  const renderStep0 = () => (
    <Box className={classes.stepContent}>
      <Typography className={classes.sectionTitle}>
        Repository
      </Typography>
      {renderRepoSummary()}

      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>Display name</Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={form.projectName}
          onChange={e => updateField('projectName', e.target.value)}
        />
        <Typography className={classes.fieldHint}>
          This will be the display name for this repository in the portal.
        </Typography>
      </Box>

      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>Description</Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          multiline
          minRows={2}
          placeholder="What does this automation do?"
          value={form.description}
          onChange={e => updateField('description', e.target.value)}
        />
      </Box>

      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>Owner</Typography>
        <FormControl fullWidth variant="outlined" size="small">
          <Select
            value={form.owner}
            onChange={e =>
              updateField('owner', e.target.value as string)
            }
          >
            <MenuItem value="platform-engineering">
              platform-engineering
            </MenuItem>
            <MenuItem value="network-operations">
              network-operations
            </MenuItem>
            <MenuItem value="security-team">security-team</MenuItem>
            <MenuItem value="dba-team">dba-team</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );

  const profileOptions: (PipelineProfile & { value: string })[] = PIPELINE_PROFILES.map(p => ({
    ...p,
    value: p.id,
  }));

  const selectedProfile = PIPELINE_PROFILES.find(p => p.id === form.pipelineProfileId);

  const renderStep1 = () => (
    <Box className={classes.stepContent}>
      <Typography className={classes.sectionTitle}>
        Choose a pipeline profile
      </Typography>
      <Typography className={classes.sectionDescription}>
        Pipeline profiles define which governance stages and policy checks run on
        every commit. Choose a profile that matches the security and compliance
        requirements for this repository.
      </Typography>

      {profileOptions.map(opt => (
        <Box
          key={opt.value}
          className={`${classes.pipelineOption} ${
            form.pipelineProfileId === opt.value
              ? classes.pipelineOptionSelected
              : ''
          }`}
          onClick={() => updateField('pipelineProfileId', opt.value)}
        >
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <Radio
              checked={form.pipelineProfileId === opt.value}
              color="primary"
              size="small"
              style={{ padding: 0 }}
            />
            <Typography className={classes.pipelineTitle}>
              {opt.name}
            </Typography>
            <Chip
              label={opt.source === 'built-in' ? 'Built-in' : opt.source === 'organization' ? 'Organization' : 'Custom'}
              size="small"
              variant="outlined"
              style={{ fontSize: 10, height: 18, marginLeft: 4 }}
            />
          </Box>
          <Typography className={classes.pipelineDescription}>
            {opt.description}
          </Typography>
          {opt.stages.length > 0 && (
            <Box className={classes.pipelineStages}>
              {opt.stages.map(s => (
                <Chip
                  key={s}
                  label={s}
                  size="small"
                  variant="outlined"
                  className={classes.stageChip}
                />
              ))}
            </Box>
          )}
          {opt.policies.length > 0 && (
            <Typography className={classes.pipelineDescription} style={{ marginTop: 8 }}>
              {opt.policies.length} policy {opt.policies.length === 1 ? 'check' : 'checks'}: {opt.policies.map(p => p.name).join(', ')}
            </Typography>
          )}
        </Box>
      ))}

      <Divider style={{ margin: '16px 0' }} />

      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>
          Execution Environment
          <Tooltip
            title="The container image that provides the runtime dependencies for your automation content."
            arrow
          >
            <InfoOutlinedIcon className={classes.infoIcon} />
          </Tooltip>
        </Typography>
        <FormControl fullWidth variant="outlined" size="small">
          <Select
            value={form.executionEnvironment}
            onChange={e =>
              updateField(
                'executionEnvironment',
                e.target.value as string,
              )
            }
          >
            <MenuItem value="ee-supported">
              ee-supported (Red Hat Supported)
            </MenuItem>
            <MenuItem value="ee-minimal">
              ee-minimal (Minimal)
            </MenuItem>
            <MenuItem value="ee-custom-network">
              ee-custom-network (Network Automation)
            </MenuItem>
            <MenuItem value="ee-custom-cloud">
              ee-custom-cloud (Cloud Provisioning)
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );

  const renderStep2 = () => (
    <Box className={classes.stepContent}>
      <Typography className={classes.sectionTitle}>
        Connect to Ansible Automation Platform
      </Typography>
      <Typography className={classes.sectionDescription}>
        Configure how this repository is published to your AAP Controller. The
        portal will create the AAP project and job template automatically.
      </Typography>

      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>AAP Controller</Typography>
        <FormControl fullWidth variant="outlined" size="small">
          <Select
            value={form.aapController}
            onChange={e =>
              updateField('aapController', e.target.value as string)
            }
          >
            <MenuItem value="prod-controller">
              prod-controller (Production)
            </MenuItem>
            <MenuItem value="dev-controller">
              dev-controller (Development)
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>Organization</Typography>
        <FormControl fullWidth variant="outlined" size="small">
          <Select
            value={form.aapOrganization}
            onChange={e =>
              updateField('aapOrganization', e.target.value as string)
            }
          >
            <MenuItem value="Default">Default</MenuItem>
            <MenuItem value="Platform Engineering">
              Platform Engineering
            </MenuItem>
            <MenuItem value="Network Operations">
              Network Operations
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider style={{ margin: '16px 0' }} />

      <Box className={classes.settingsRow}>
        <Box>
          <Typography className={classes.fieldLabel}>
            Auto-create AAP project
          </Typography>
          <Typography className={classes.fieldHint} style={{ marginTop: 0 }}>
            Create an AAP project resource in your controller
          </Typography>
        </Box>
        <Switch
          checked={form.autoCreateProject}
          onChange={e =>
            updateField('autoCreateProject', e.target.checked)
          }
          color="primary"
        />
      </Box>

      <Box className={classes.settingsRow}>
        <Box>
          <Typography className={classes.fieldLabel}>
            Auto-create Job Template
          </Typography>
          <Typography className={classes.fieldHint} style={{ marginTop: 0 }}>
            Create a job template ready to execute your automation
          </Typography>
        </Box>
        <Switch
          checked={form.autoCreateJobTemplate}
          onChange={e =>
            updateField('autoCreateJobTemplate', e.target.checked)
          }
          color="primary"
        />
      </Box>
    </Box>
  );

  const renderReview = () => (
    <Box className={classes.stepContent}>
      <Typography className={classes.sectionTitle}>
        Review and create
      </Typography>
      <Typography className={classes.sectionDescription}>
        Review your governance configuration before enabling.
      </Typography>

      {renderRepoSummary()}

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewLabel}>Display name</Typography>
        <Typography className={classes.reviewValue}>
          {form.projectName}
        </Typography>
      </Box>

      {form.description && (
        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewLabel}>Description</Typography>
          <Typography className={classes.reviewValue}>
            {form.description}
          </Typography>
        </Box>
      )}

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewLabel}>Owner</Typography>
        <Typography className={classes.reviewValue}>{form.owner}</Typography>
      </Box>

      <Divider style={{ margin: '12px 0' }} />

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewLabel}>Pipeline profile</Typography>
        <Typography className={classes.reviewValue}>
          {selectedProfile?.name ?? form.pipelineProfileId}
        </Typography>
        {selectedProfile && (
          <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginTop: 2 }}>
            {selectedProfile.stages.length} stages · {selectedProfile.policies.length} policy checks
          </Typography>
        )}
      </Box>

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewLabel}>
          Execution Environment
        </Typography>
        <Typography className={classes.reviewValue}>
          {form.executionEnvironment}
        </Typography>
      </Box>

      <Divider style={{ margin: '12px 0' }} />

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewLabel}>AAP Controller</Typography>
        <Typography className={classes.reviewValue}>
          {form.aapController}
        </Typography>
      </Box>

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewLabel}>
          AAP Organization
        </Typography>
        <Typography className={classes.reviewValue}>
          {form.aapOrganization}
        </Typography>
      </Box>

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewLabel}>
          Auto-provisioning
        </Typography>
        <Typography className={classes.reviewValue}>
          {form.autoCreateProject ? 'AAP Project' : ''}
          {form.autoCreateProject && form.autoCreateJobTemplate
            ? ' + '
            : ''}
          {form.autoCreateJobTemplate ? 'Job Template' : ''}
          {!form.autoCreateProject && !form.autoCreateJobTemplate
            ? 'None (manual setup)'
            : ''}
        </Typography>
      </Box>
    </Box>
  );

  const isLastStep = activeStep === STEPS.length;
  const totalSteps = STEPS.length + 1; // 3 config steps + 1 review

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onClose}
          className={classes.backButton}
          style={{ textTransform: 'none' }}
        >
          Back to Projects
        </Button>
      </Box>

      <Typography className={classes.headerTitle}>
        Enable governance
      </Typography>
      <Typography className={classes.headerSubtitle}>
        Add CI/CD pipelines, policy checks, and AAP integration to this
        repository.
      </Typography>

      <Stepper activeStep={activeStep} style={{ padding: '24px 0' }}>
        {[...STEPS, { label: 'Review & create', description: '' }].map(
          step => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ),
        )}
      </Stepper>

      {activeStep === 0 && renderStep0()}
      {activeStep === 1 && renderStep1()}
      {activeStep === 2 && renderStep2()}
      {activeStep === 3 && renderReview()}

      <Box className={classes.actions}>
        <Button
          onClick={activeStep === 0 ? onClose : handleBack}
          style={{ textTransform: 'none' }}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        {isLastStep ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreate}
            startIcon={<CheckCircleIcon />}
            style={{ textTransform: 'none', fontWeight: 600, borderRadius: 20 }}
          >
            Enable governance
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            style={{ textTransform: 'none', fontWeight: 600, borderRadius: 20 }}
          >
            Continue
          </Button>
        )}
      </Box>
    </Box>
  );
};
