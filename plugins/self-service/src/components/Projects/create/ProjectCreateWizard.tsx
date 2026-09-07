import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
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
import EditIcon from '@material-ui/icons/Edit';
import { useNavigate } from 'react-router-dom';
import type { DemoTemplate } from './templatesDemoData';
import { DEMO_TEMPLATES, SYNCED_REPOS } from './templatesDemoData';
import { useRouteRef } from '@backstage/core-plugin-api';
import { rootRouteRef } from '../../../routes';

type WizardFormState = {
  serviceName: string;
  serviceDescription: string;
  owner: string;
  aiPrompt: string;
  aiGenerated: boolean;
  createNewRepository: boolean;
  sourceControlProvider: string;
  repositoryOwner: string;
  repositoryName: string;
  selectedExistingRepo: string;
  branch: string;
  createNewBranch: boolean;
  newBranchName: string;
  aapController: string;
  aapOrganization: string;
  executionEnvironment: string;
  autoCreateProject: boolean;
  autoCreateJobTemplate: boolean;
  apmeScanSchedule: 'commits-only' | 'weekly' | 'custom';
  apmeCustomFrequency: string;
  apmeCustomDay: string;
  apmeCustomTime: string;
};

const BRANCH_CREATE_NEW = '__create_new__';

const createInitialState = (): WizardFormState => ({
  serviceName: '',
  serviceDescription: '',
  owner: 'platform-engineering',
  aiPrompt: '',
  aiGenerated: false,
  createNewRepository: false,
  sourceControlProvider: 'Github',
  repositoryOwner: 'acme-corp',
  repositoryName: '',
  selectedExistingRepo: '',
  branch: 'main',
  createNewBranch: false,
  newBranchName: '',
  aapController: 'prod-controller',
  aapOrganization: 'Default',
  executionEnvironment: 'ee-supported',
  autoCreateProject: true,
  autoCreateJobTemplate: true,
  apmeScanSchedule: 'weekly',
  apmeCustomFrequency: 'daily',
  apmeCustomDay: 'monday',
  apmeCustomTime: '09:00',
});

const WIZARD_STEPS = [
  {
    title: 'Details',
    description: 'Name and describe your automation repository.',
    why: 'Naming and describing your repository up front helps your team discover and understand it. AI Jumpstart can save time by pre-filling the remaining steps based on your intent.',
  },
  {
    title: 'Source code',
    description: 'Create a new repository or select an existing synced repo.',
    why: 'Every automation repository is backed by Git. This is where your playbooks, roles, and inventory live — and it enables version control, collaboration, and auditability.',
  },
  {
    title: 'Destination',
    description: 'Configure how this repository connects to your Ansible Automation Platform.',
    why: 'Connecting to AAP lets your automation be executed, scheduled, and monitored centrally. This step ensures your AAP project and job templates are registered and ready to run.',
  },
  {
    title: 'Quality scanning',
    description: 'Review the automated quality checks included with this repository.',
    why: 'Quality scanning catches compatibility issues, security risks, and anti-patterns early. Scans run as a GitHub Action on every commit — results appear in the Portal and your IDE automatically.',
  },
  {
    title: 'Review',
    description: 'Review your selections before creating the repository.',
    why: 'A final review prevents misconfiguration. Once created, the repository and AAP resources are provisioned automatically.',
  },
];

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
    marginBottom: theme.spacing(1),
  },
  stepWhy: {
    color: theme.palette.text.hint,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: theme.spacing(3),
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
  nextButtonDisabled: {
    opacity: 0.5,
  },
  prevButton: {
    textTransform: 'none',
  },

  aiBox: {
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(3),
    position: 'relative' as const,
  },
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    fontWeight: 600,
    fontSize: 15,
    color: theme.palette.primary.main,
  },
  aiHint: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    marginBottom: theme.spacing(1.5),
  },
  aiButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 16,
    marginTop: theme.spacing(1),
  },
  aiFilledField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(25, 118, 210, 0.08)'
          : 'rgba(25, 118, 210, 0.04)',
    },
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    margin: theme.spacing(2, 0),
    '& hr': {
      flex: 1,
    },
  },

  createNewCheckbox: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  repoFields: {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  branchSection: {
    marginTop: theme.spacing(2),
  },

  prefilledHint: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: theme.spacing(2),
  },

  reviewSection: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  reviewSectionTitle: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apmeSection: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2),
  },
  apmeSectionHeader: {
    fontWeight: 600,
    fontSize: 15,
    marginBottom: theme.spacing(1),
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(0.5, 0),
  },
  reviewLabel: {
    color: theme.palette.text.secondary,
    fontSize: 13,
  },
  reviewValue: {
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'right' as const,
  },
}));

// ─── Step 1: Details & AI Jumpstart ───────────────────────────────────────────

const DetailsStep = ({
  form,
  setForm,
  template,
}: {
  form: WizardFormState;
  setForm: React.Dispatch<React.SetStateAction<WizardFormState>>;
  template: DemoTemplate;
}) => {
  const classes = useStyles();

  const handleAiGenerate = () => {
    if (!form.aiPrompt.trim()) return;
    setForm(prev => ({
      ...prev,
      aiGenerated: true,
      serviceName: 'ai-generated-repo',
      serviceDescription: `Auto-generated: ${prev.aiPrompt.slice(0, 80)}`,
    }));
  };

  return (
    <Box>
      <Box className={classes.aiBox}>
        <Typography className={classes.aiHeader}>
          Lightspeed AI Jumpstart
        </Typography>
        <Typography className={classes.aiHint}>
          Describe what you want to build and we'll pre-fill all wizard steps
          for your review. You can adjust any generated value before creating.
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          placeholder={`e.g., "Create a new ${template.title} to automate RHEL patching across 3 data centers"`}
          value={form.aiPrompt}
          onChange={e => setForm(prev => ({ ...prev, aiPrompt: e.target.value }))}
        />
        <Button
          variant="contained"
          color="primary"
          size="small"
          className={classes.aiButton}
          onClick={handleAiGenerate}
          disabled={!form.aiPrompt.trim()}
        >
          Generate settings with AI
        </Button>
      </Box>

      <Box className={classes.orDivider}>
        <Divider />
        <Typography variant="body2" color="textSecondary">
          or fill in manually
        </Typography>
        <Divider />
      </Box>

      <TextField
        label="Repository name"
        variant="outlined"
        fullWidth
        required
        value={form.serviceName}
        onChange={e => setForm(prev => ({ ...prev, serviceName: e.target.value }))}
        helperText="Lowercase letters, numbers, and hyphens only"
        className={form.aiGenerated ? classes.aiFilledField : undefined}
        style={{ marginBottom: 16 }}
      />
      <TextField
        label="Description"
        variant="outlined"
        fullWidth
        required
        value={form.serviceDescription}
        onChange={e =>
          setForm(prev => ({ ...prev, serviceDescription: e.target.value }))
        }
        className={form.aiGenerated ? classes.aiFilledField : undefined}
        style={{ marginBottom: 16 }}
      />
      <TextField
        label="Owner (auto-detected from your team)"
        variant="outlined"
        fullWidth
        value={form.owner}
        onChange={e => setForm(prev => ({ ...prev, owner: e.target.value }))}
        helperText="Pre-filled from your team membership. Change only if you belong to multiple teams."
        InputProps={{ style: { color: '#888' } }}
      />
    </Box>
  );
};

// ─── Step 2: Source Code (Git) ────────────────────────────────────────────────

const DEMO_BRANCHES = ['main', 'develop', 'staging'];

const SourceCodeStep = ({
  form,
  setForm,
}: {
  form: WizardFormState;
  setForm: React.Dispatch<React.SetStateAction<WizardFormState>>;
}) => {
  const classes = useStyles();
  const selectedSyncedRepo = SYNCED_REPOS.find(
    r => r.url === form.selectedExistingRepo,
  );

  return (
    <Box>
      <FormControl variant="outlined" fullWidth style={{ marginBottom: 16 }}>
        <InputLabel>Source control provider</InputLabel>
        <Select
          value={form.sourceControlProvider}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              sourceControlProvider: e.target.value as string,
              selectedExistingRepo: '',
            }))
          }
          label="Source control provider"
        >
          <MenuItem value="Github">GitHub</MenuItem>
          <MenuItem value="Gitlab">GitLab</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        className={classes.createNewCheckbox}
        control={
          <Checkbox
            checked={form.createNewRepository}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                createNewRepository: e.target.checked,
                selectedExistingRepo: '',
              }))
            }
            color="primary"
            size="small"
          />
        }
        label={
          <Typography variant="body2">
            Create new repository
          </Typography>
        }
      />

      {!form.createNewRepository && (
        <FormControl variant="outlined" fullWidth style={{ marginTop: 8 }}>
          <InputLabel shrink={Boolean(form.selectedExistingRepo)}>
            Repository
          </InputLabel>
          <Select
            value={form.selectedExistingRepo}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                selectedExistingRepo: e.target.value as string,
              }))
            }
            label="Repository"
          >
            {SYNCED_REPOS.filter(
              r =>
                (form.sourceControlProvider === 'Github' &&
                  r.host === 'github.com') ||
                (form.sourceControlProvider === 'Gitlab' &&
                  r.host === 'gitlab.com'),
            ).map(repo => (
              <MenuItem key={repo.url} value={repo.url}>
                <Box
                  display="flex"
                  alignItems="center"
                  style={{ gap: 8, width: '100%' }}
                >
                  <Typography variant="body2">
                    {repo.org}/{repo.name}
                  </Typography>
                  <Chip
                    label={repo.visibility}
                    size="small"
                    variant="outlined"
                    style={{ height: 18, fontSize: 10, marginLeft: 'auto' }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {form.createNewRepository && (
        <Box className={classes.repoFields}>
          <Box display="flex" style={{ gap: 12, marginBottom: 16 }}>
            <TextField
              label="Organization / Owner"
              variant="outlined"
              value={form.repositoryOwner}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  repositoryOwner: e.target.value,
                }))
              }
              helperText="The organization or username that owns the repository"
              style={{ minWidth: 220 }}
            />
            <Typography
              variant="h6"
              style={{ alignSelf: 'center', color: '#999', paddingBottom: 20 }}
            >
              /
            </Typography>
            <TextField
              label="Repository name"
              variant="outlined"
              fullWidth
              required
              value={form.repositoryName}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  repositoryName: e.target.value,
                }))
              }
              placeholder="my-automation-repo"
              helperText="The name of the new repository to create"
            />
          </Box>
        </Box>
      )}

      {!form.createNewRepository && form.selectedExistingRepo && (
        <Box className={classes.branchSection}>
          <Divider style={{ marginBottom: 16 }} />
          {!form.createNewBranch ? (
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                value={form.branch}
                onChange={e => {
                  const val = e.target.value as string;
                  if (val === BRANCH_CREATE_NEW) {
                    setForm(prev => ({
                      ...prev,
                      createNewBranch: true,
                      newBranchName: '',
                    }));
                  } else {
                    setForm(prev => ({ ...prev, branch: val }));
                  }
                }}
                label="Branch"
              >
                {DEMO_BRANCHES.map(b => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem value={BRANCH_CREATE_NEW}>
                  <Typography variant="body2" style={{ fontWeight: 600 }}>
                    + Create new branch
                  </Typography>
                </MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Box>
              <TextField
                label="New branch name"
                variant="outlined"
                fullWidth
                required
                value={form.newBranchName}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    newBranchName: e.target.value,
                  }))
                }
                placeholder="feat/my-automation"
                helperText="A new branch will be created from main"
              />
              <Button
                size="small"
                onClick={() =>
                  setForm(prev => ({
                    ...prev,
                    createNewBranch: false,
                    newBranchName: '',
                  }))
                }
                style={{ textTransform: 'none', marginTop: 4 }}
              >
                Use existing branch instead
              </Button>
            </Box>
          )}
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ fontSize: 12, marginTop: 8 }}
          >
            The generated files will be pushed to this branch as a{' '}
            {form.sourceControlProvider === 'Gitlab'
              ? 'merge request'
              : 'pull request'}
            .
          </Typography>
          {selectedSyncedRepo && (
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ fontSize: 12, marginTop: 4 }}
            >
              Visibility:{' '}
              <strong>{selectedSyncedRepo.visibility}</strong>{' '}
              (inherited from repository)
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

// ─── Step 3: Destination (AAP) ────────────────────────────────────────────────

const DestinationStep = ({
  form,
  setForm,
}: {
  form: WizardFormState;
  setForm: React.Dispatch<React.SetStateAction<WizardFormState>>;
}) => {
  const classes = useStyles();

  return (
    <Box>
      <Typography className={classes.prefilledHint}>
        Pre-filled with your organization's defaults. Adjust as needed.
      </Typography>
      <FormControl variant="outlined" fullWidth style={{ marginBottom: 16 }}>
        <InputLabel>AAP Controller</InputLabel>
        <Select
          value={form.aapController}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              aapController: e.target.value as string,
            }))
          }
          label="AAP Controller"
        >
          <MenuItem value="prod-controller">
            Production Controller (aap.example.com)
          </MenuItem>
          <MenuItem value="dev-controller">
            Development Controller (aap-dev.example.com)
          </MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="AAP Organization"
        variant="outlined"
        fullWidth
        value={form.aapOrganization}
        onChange={e =>
          setForm(prev => ({ ...prev, aapOrganization: e.target.value }))
        }
        style={{ marginBottom: 16 }}
      />
      <FormControl variant="outlined" fullWidth style={{ marginBottom: 16 }}>
        <InputLabel>Execution Environment</InputLabel>
        <Select
          value={form.executionEnvironment}
          onChange={e =>
            setForm(prev => ({
              ...prev,
              executionEnvironment: e.target.value as string,
            }))
          }
          label="Execution Environment"
        >
          <MenuItem value="ee-minimal">Minimal Execution Environment</MenuItem>
          <MenuItem value="ee-supported">Red Hat Supported EE</MenuItem>
          <MenuItem value="ee-custom">Custom EE (cloud-tools)</MenuItem>
        </Select>
      </FormControl>
      <Divider />
      <Typography variant="subtitle2" style={{ margin: '16px 0 8px' }}>
        Auto-provisioning
      </Typography>
      <Box display="flex" flexDirection="column" style={{ gap: 4 }}>
        <FormControlLabel
          control={
            <Switch
              checked={form.autoCreateProject}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  autoCreateProject: e.target.checked,
                }))
              }
              color="primary"
            />
          }
          label="Auto-create AAP project from this repository"
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.autoCreateJobTemplate}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  autoCreateJobTemplate: e.target.checked,
                }))
              }
              color="primary"
            />
          }
          label="Auto-create Job Template"
        />
      </Box>
    </Box>
  );
};

// ─── Step 4: Quality Scanning ─────────────────────────────────────────────────

const PipelineQualityStep = ({
  form,
  setForm,
}: {
  form: WizardFormState;
  setForm: React.Dispatch<React.SetStateAction<WizardFormState>>;
}) => {
  const classes = useStyles();

  return (
    <Box>
      <Typography variant="body2" color="textSecondary" style={{ marginBottom: 20 }}>
        Quality scanning runs as a GitHub Action and checks your content for
        compatibility issues, security risks, and best-practice violations. Choose
        how often scans run.
      </Typography>

      <RadioGroup
        value={form.apmeScanSchedule}
        onChange={e =>
          setForm(prev => ({
            ...prev,
            apmeScanSchedule: e.target.value as 'commits-only' | 'weekly' | 'custom',
          }))
        }
      >
        <Box className={classes.apmeSection} style={form.apmeScanSchedule === 'commits-only' ? { borderColor: '#1976d2' } : undefined}>
          <FormControlLabel
            value="commits-only"
            control={<Radio color="primary" />}
            label={
              <Box>
                <Typography variant="body2" style={{ fontWeight: 500 }}>
                  On every commit
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Scans run on push and pull request. Best for actively developed repositories.
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box className={classes.apmeSection} style={form.apmeScanSchedule === 'weekly' ? { borderColor: '#1976d2' } : undefined}>
          <FormControlLabel
            value="weekly"
            control={<Radio color="primary" />}
            label={
              <Box>
                <Typography variant="body2" style={{ fontWeight: 500 }}>
                  On every commit + weekly
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Also runs a weekly scan to catch issues from new rules or deprecations, even when the repo is inactive.
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box className={classes.apmeSection} style={form.apmeScanSchedule === 'custom' ? { borderColor: '#1976d2' } : undefined}>
          <FormControlLabel
            value="custom"
            control={<Radio color="primary" />}
            label={
              <Box>
                <Typography variant="body2" style={{ fontWeight: 500 }}>
                  Custom schedule
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Choose how often and when scheduled scans run.
                </Typography>
              </Box>
            }
          />
          {form.apmeScanSchedule === 'custom' && (
            <Box display="flex" alignItems="center" style={{ marginTop: 12, marginLeft: 32, gap: 12, flexWrap: 'wrap' }}>
              <FormControl variant="outlined" size="small" style={{ minWidth: 130 }}>
                <InputLabel>Every</InputLabel>
                <Select
                  value={form.apmeCustomFrequency}
                  onChange={e =>
                    setForm(prev => ({ ...prev, apmeCustomFrequency: e.target.value as string }))
                  }
                  label="Every"
                >
                  <MenuItem value="daily">Day</MenuItem>
                  <MenuItem value="every-3-days">3 days</MenuItem>
                  <MenuItem value="weekly">Week</MenuItem>
                  <MenuItem value="monthly">Month</MenuItem>
                </Select>
              </FormControl>
              {(form.apmeCustomFrequency === 'weekly' || form.apmeCustomFrequency === 'monthly') && (
                <FormControl variant="outlined" size="small" style={{ minWidth: 130 }}>
                  <InputLabel>On</InputLabel>
                  <Select
                    value={form.apmeCustomDay}
                    onChange={e =>
                      setForm(prev => ({ ...prev, apmeCustomDay: e.target.value as string }))
                    }
                    label="On"
                  >
                    <MenuItem value="monday">Monday</MenuItem>
                    <MenuItem value="tuesday">Tuesday</MenuItem>
                    <MenuItem value="wednesday">Wednesday</MenuItem>
                    <MenuItem value="thursday">Thursday</MenuItem>
                    <MenuItem value="friday">Friday</MenuItem>
                    <MenuItem value="saturday">Saturday</MenuItem>
                    <MenuItem value="sunday">Sunday</MenuItem>
                  </Select>
                </FormControl>
              )}
              <TextField
                label="At"
                type="time"
                variant="outlined"
                size="small"
                value={form.apmeCustomTime}
                onChange={e =>
                  setForm(prev => ({ ...prev, apmeCustomTime: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                style={{ width: 120 }}
              />
              <Typography variant="caption" color="textSecondary">
                UTC
              </Typography>
            </Box>
          )}
        </Box>
      </RadioGroup>

      <Typography variant="caption" color="textSecondary" style={{ marginTop: 8, display: 'block' }}>
        You can change the scan schedule later by editing the workflow file in your repository.
      </Typography>
    </Box>
  );
};

// ─── Step 5: Review & Create ──────────────────────────────────────────────────

const ReviewStep = ({
  form,
  template,
  onJumpToStep,
}: {
  form: WizardFormState;
  template: DemoTemplate;
  onJumpToStep: (step: number) => void;
}) => {
  const classes = useStyles();

  const repoLabel = form.createNewRepository
    ? `${form.repositoryOwner}/${form.repositoryName || '(not set)'} (new)`
    : SYNCED_REPOS.find(r => r.url === form.selectedExistingRepo)
      ? `${SYNCED_REPOS.find(r => r.url === form.selectedExistingRepo)!.org}/${SYNCED_REPOS.find(r => r.url === form.selectedExistingRepo)!.name}`
      : '(not selected)';

  const branchLabel = form.createNewRepository
    ? 'main (default)'
    : form.createNewBranch
      ? `${form.newBranchName} (new)`
      : form.branch;

  const controllerLabel =
    form.aapController === 'prod-controller'
      ? 'Production Controller'
      : 'Development Controller';

  const eeLabel =
    form.executionEnvironment === 'ee-minimal'
      ? 'Minimal EE'
      : form.executionEnvironment === 'ee-supported'
        ? 'Red Hat Supported EE'
        : 'Custom EE (cloud-tools)';

  const EditButton = ({ step }: { step: number }) => (
    <IconButton size="small" onClick={() => onJumpToStep(step)}>
      <EditIcon fontSize="small" />
    </IconButton>
  );

  return (
    <Box>
      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewSectionTitle}>
          Repository details
          <EditButton step={0} />
        </Typography>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Template</Typography>
          <Typography className={classes.reviewValue}>
            {template.title}
          </Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Repository name</Typography>
          <Typography className={classes.reviewValue}>
            {form.serviceName || '(not set)'}
          </Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Description</Typography>
          <Typography className={classes.reviewValue}>
            {form.serviceDescription || '(not set)'}
          </Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Owner</Typography>
          <Typography className={classes.reviewValue}>{form.owner}</Typography>
        </Box>
      </Box>

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewSectionTitle}>
          Source code
          <EditButton step={1} />
        </Typography>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Provider</Typography>
          <Typography className={classes.reviewValue}>
            {form.sourceControlProvider}
          </Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>
            {form.createNewRepository ? 'New repository' : 'Repository'}
          </Typography>
          <Typography className={classes.reviewValue}>{repoLabel}</Typography>
        </Box>
        {!form.createNewRepository && (
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Branch</Typography>
            <Typography className={classes.reviewValue}>
              {branchLabel}
            </Typography>
          </Box>
        )}
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Delivery</Typography>
          <Typography className={classes.reviewValue}>
            {form.createNewRepository
              ? 'Push directly to new repo'
              : form.sourceControlProvider === 'Gitlab'
                ? 'Merge request'
                : 'Pull request'}
          </Typography>
        </Box>
      </Box>

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewSectionTitle}>
          Destination
          <EditButton step={2} />
        </Typography>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Controller</Typography>
          <Typography className={classes.reviewValue}>
            {controllerLabel}
          </Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Organization</Typography>
          <Typography className={classes.reviewValue}>
            {form.aapOrganization}
          </Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>
            Execution Environment
          </Typography>
          <Typography className={classes.reviewValue}>{eeLabel}</Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>
            Auto-create AAP project
          </Typography>
          <Typography className={classes.reviewValue}>
            {form.autoCreateProject ? 'Yes' : 'No'}
          </Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>
            Auto-create Job Template
          </Typography>
          <Typography className={classes.reviewValue}>
            {form.autoCreateJobTemplate ? 'Yes' : 'No'}
          </Typography>
        </Box>
      </Box>

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewSectionTitle}>
          Quality scanning
          <EditButton step={3} />
        </Typography>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Scan schedule</Typography>
          <Typography className={classes.reviewValue}>
            {form.apmeScanSchedule === 'commits-only' && 'On every commit'}
            {form.apmeScanSchedule === 'weekly' && 'On every commit + weekly'}
            {form.apmeScanSchedule === 'custom' && `On every commit + every ${form.apmeCustomFrequency === 'daily' ? 'day' : form.apmeCustomFrequency === 'every-3-days' ? '3 days' : form.apmeCustomFrequency} at ${form.apmeCustomTime} UTC`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Validation ───────────────────────────────────────────────────────────────

const isStepValid = (step: number, form: WizardFormState): boolean => {
  switch (step) {
    case 0:
      return Boolean(form.serviceName.trim() && form.serviceDescription.trim());
    case 1:
      if (form.createNewRepository)
        return Boolean(
          form.repositoryOwner.trim() && form.repositoryName.trim(),
        );
      if (!form.selectedExistingRepo) return false;
      if (form.createNewBranch) return Boolean(form.newBranchName.trim());
      return true;
    case 2:
      return true;
    case 3:
      return true;
    case 4:
      return true;
    default:
      return true;
  }
};

// ─── Wizard Content (reusable for both standalone and embedded) ───────────────

export const ProjectCreateWizardContent = ({
  template,
  onClose,
}: {
  template: DemoTemplate;
  onClose: () => void;
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const rootLink = useRouteRef(rootRouteRef);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<WizardFormState>(createInitialState);

  const steps = WIZARD_STEPS;
  const stepValid = isStepValid(activeStep, form);

  const handleNext = useCallback(() => {
    if (activeStep === steps.length - 1) {
      navigate(`${rootLink()}/create/tasks/demo-project-success`);
    } else {
      setActiveStep(prev => prev + 1);
    }
  }, [activeStep, steps.length, navigate, rootLink]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const handleJumpToStep = useCallback((step: number) => {
    setActiveStep(step);
  }, []);

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Box className={classes.root}>
      <Box className={classes.titleRow}>
        <Typography variant="h5" style={{ fontWeight: 600 }}>
          Create repository
        </Typography>
        <Chip
          label={template.title}
          size="small"
          className={classes.templateBadge}
        />
      </Box>
      <Typography className={classes.subtitle}>
        {template.description}
      </Typography>

      <Stepper activeStep={activeStep} className={classes.stepper}>
        {steps.map((step, index) => (
          <Step
            key={step.title}
            completed={index < activeStep}
            style={{ cursor: index < activeStep ? 'pointer' : 'default' }}
            onClick={() => {
              if (index < activeStep) handleJumpToStep(index);
            }}
          >
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
        {currentStep.why && (
          <Typography className={classes.stepWhy}>
            {currentStep.why}
          </Typography>
        )}

        {activeStep === 0 && (
          <DetailsStep form={form} setForm={setForm} template={template} />
        )}
        {activeStep === 1 && (
          <SourceCodeStep form={form} setForm={setForm} />
        )}
        {activeStep === 2 && (
          <DestinationStep form={form} setForm={setForm} />
        )}
        {activeStep === 3 && (
          <PipelineQualityStep form={form} setForm={setForm} />
        )}
        {activeStep === 4 && (
          <ReviewStep
            form={form}
            template={template}
            onJumpToStep={handleJumpToStep}
          />
        )}
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
          disabled={!stepValid}
          className={`${classes.nextButton} ${!stepValid ? classes.nextButtonDisabled : ''}`}
        >
          {isLastStep ? 'Create' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

// ─── Legacy inline wrapper (for backward compat during transition) ────────────

export const ProjectCreateWizard = ({
  template,
  onClose,
}: {
  template: DemoTemplate;
  onClose: () => void;
}) => {
  return (
    <ProjectCreateWizardContent template={template} onClose={onClose} />
  );
};
