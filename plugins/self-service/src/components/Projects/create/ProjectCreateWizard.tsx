import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import EditIcon from '@material-ui/icons/Edit';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import type { DemoTemplate } from './templatesDemoData';
import {
  SYNCED_REPOS,
  CUSTOM_PIPELINE_STAGES,
  COMPREHENSIVE_STAGES,
  STANDARD_STAGES,
} from './templatesDemoData';

// ─── Shared wizard form state ─────────────────────────────────────────────────

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
  pipelineType: string;
  customStages: string[];
  aapController: string;
  aapOrganization: string;
  executionEnvironment: string;
  autoCreateProject: boolean;
  autoCreateJobTemplate: boolean;
};

const BRANCH_CREATE_NEW = '__create_new__';

const createInitialState = (template: DemoTemplate): WizardFormState => ({
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
  pipelineType: template.defaultPipeline,
  customStages: ['syntax', 'lint', 'policy'],
  aapController: 'prod-controller',
  aapOrganization: 'Default',
  executionEnvironment: 'ee-supported',
  autoCreateProject: true,
  autoCreateJobTemplate: true,
});

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // AI Jumpstart
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

  // Source Code
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

  // Pipeline
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
    backgroundColor:
      theme.palette.type === 'dark'
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
  stageLabels: {
    color: theme.palette.text.secondary,
    fontSize: 11,
  },
  pipelineInfoBar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.02)',
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  customStageItem: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 2),
    '&:last-child': {
      borderBottom: 'none',
    },
  },

  // AAP Destination
  prefilledHint: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: theme.spacing(2),
  },

  // Review
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

  // Success
  successContainer: {
    textAlign: 'center' as const,
    padding: theme.spacing(6, 2),
  },
  successIcon: {
    fontSize: 64,
    color: '#4caf50',
    marginBottom: theme.spacing(2),
  },
}));

// ─── Stage Icons ──────────────────────────────────────────────────────────────

const StageIconRow = ({
  stages,
  tooltips,
}: {
  stages: string[];
  tooltips?: boolean;
}) => (
  <Box display="flex" alignItems="center" style={{ gap: 3 }}>
    {stages.map((stage, i) => (
      <Tooltip key={i} title={tooltips ? stage : ''}>
        <CheckCircleIcon style={{ color: '#4caf50', fontSize: 20 }} />
      </Tooltip>
    ))}
  </Box>
);

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
      serviceName: 'ai-generated-project',
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
        label="Service name"
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
        label="Service description"
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
      {/* Source control provider */}
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

      {/* Repository selection (existing repos) -- hidden when "create new" is checked */}
      {!form.createNewRepository && (
        <FormControl variant="outlined" fullWidth style={{ marginBottom: 8 }}>
          <InputLabel>Repository</InputLabel>
          <Select
            value={form.selectedExistingRepo}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                selectedExistingRepo: e.target.value as string,
              }))
            }
            label="Repository"
            displayEmpty
          >
            <MenuItem value="" disabled>
              <Typography variant="body2" color="textSecondary">
                Select a synced repository...
              </Typography>
            </MenuItem>
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

      {/* Create new repository checkbox */}
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

      {/* New repo fields */}
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
              placeholder="my-automation-project"
              helperText="The name of the new repository to create"
            />
          </Box>
        </Box>
      )}

      {/* Branch selection -- shown for existing repos */}
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

// ─── Step 3: Pipeline & Governance ────────────────────────────────────────────

const PipelineStep = ({
  form,
  setForm,
}: {
  form: WizardFormState;
  setForm: React.Dispatch<React.SetStateAction<WizardFormState>>;
}) => {
  const classes = useStyles();

  const toggleCustomStage = (id: string) => {
    setForm(prev => ({
      ...prev,
      customStages: prev.customStages.includes(id)
        ? prev.customStages.filter(s => s !== id)
        : [...prev.customStages, id],
    }));
  };

  return (
    <Box>
      <Box className={classes.pipelineInfoBar}>
        <InfoOutlinedIcon style={{ fontSize: 16 }} />
        <Typography variant="body2" style={{ fontSize: 12 }}>
          The selected pipeline will be added as a CI/CD workflow file in your
          repository (e.g., <code>.github/workflows/ansible-governance.yml</code>{' '}
          or <code>.gitlab-ci.yml</code>).
        </Typography>
      </Box>

      {/* Comprehensive */}
      <Box
        className={`${classes.pipelineOption} ${form.pipelineType === 'comprehensive' ? classes.pipelineOptionSelected : ''}`}
        onClick={() => setForm(prev => ({ ...prev, pipelineType: 'comprehensive' }))}
      >
        <Box display="flex" alignItems="center">
          <Radio
            checked={form.pipelineType === 'comprehensive'}
            color="primary"
            style={{ padding: '4px 8px 4px 0' }}
          />
          <Typography className={classes.pipelineTitle}>
            Comprehensive pipeline (recommended)
          </Typography>
        </Box>
        <Typography className={classes.pipelineDescription}>
          The safest path to production. Enforces all code quality and security
          policies, plus live integration testing on temporary infrastructure
          before final deployment.
        </Typography>
        <StageIconRow stages={COMPREHENSIVE_STAGES} tooltips />
        <Typography className={classes.stageLabels}>
          {COMPREHENSIVE_STAGES.join(' > ')}
        </Typography>
      </Box>

      {/* Standard */}
      <Box
        className={`${classes.pipelineOption} ${form.pipelineType === 'standard' ? classes.pipelineOptionSelected : ''}`}
        onClick={() => setForm(prev => ({ ...prev, pipelineType: 'standard' }))}
      >
        <Box display="flex" alignItems="center">
          <Radio
            checked={form.pipelineType === 'standard'}
            color="primary"
            style={{ padding: '4px 8px 4px 0' }}
          />
          <Typography className={classes.pipelineTitle}>
            Standard pipeline
          </Typography>
        </Box>
        <Typography className={classes.pipelineDescription}>
          A faster, streamlined pipeline. Enforces mandatory syntax, policy, and
          Execution Environment checks, but bypasses live integration testing.
        </Typography>
        <StageIconRow stages={STANDARD_STAGES} tooltips />
        <Typography className={classes.stageLabels}>
          {STANDARD_STAGES.join(' > ')}
        </Typography>
      </Box>

      {/* Custom */}
      <Box
        className={`${classes.pipelineOption} ${form.pipelineType === 'custom' ? classes.pipelineOptionSelected : ''}`}
        onClick={() => setForm(prev => ({ ...prev, pipelineType: 'custom' }))}
      >
        <Box display="flex" alignItems="center">
          <Radio
            checked={form.pipelineType === 'custom'}
            color="primary"
            style={{ padding: '4px 8px 4px 0' }}
          />
          <Typography className={classes.pipelineTitle}>
            Custom pipeline
          </Typography>
        </Box>
        <Typography className={classes.pipelineDescription}>
          Build a tailored pipeline. Manually configure the specific linting,
          governance, and testing gates that apply to this service.
        </Typography>

        <Collapse in={form.pipelineType === 'custom'}>
          <Divider style={{ margin: '12px 0' }} />
          <Typography
            variant="subtitle2"
            style={{ marginBottom: 8, fontSize: 13 }}
          >
            Select pipeline stages:
          </Typography>
          <List
            disablePadding
            style={{
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 4,
            }}
          >
            {CUSTOM_PIPELINE_STAGES.map(stage => (
              <ListItem
                key={stage.id}
                dense
                button
                className={classes.customStageItem}
                onClick={e => {
                  e.stopPropagation();
                  toggleCustomStage(stage.id);
                }}
              >
                <ListItemIcon style={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    checked={form.customStages.includes(stage.id)}
                    color="primary"
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" style={{ fontWeight: 500 }}>
                      {stage.label}
                    </Typography>
                  }
                  secondary={stage.description}
                />
              </ListItem>
            ))}
          </List>
          {form.customStages.length > 0 && (
            <Box mt={1.5}>
              <Typography variant="caption" color="textSecondary">
                Pipeline: Commit {'>'}{' '}
                {form.customStages
                  .map(
                    id =>
                      CUSTOM_PIPELINE_STAGES.find(s => s.id === id)?.label,
                  )
                  .filter(Boolean)
                  .join(' > ')}{' '}
                {'>'} Pushed to AAP
              </Typography>
            </Box>
          )}
        </Collapse>

        {form.pipelineType !== 'custom' && (
          <>
            <Box display="flex" alignItems="center" style={{ gap: 3 }}>
              {[1, 2, 3].map(i => (
                <RadioButtonUncheckedIcon
                  key={i}
                  style={{ color: '#bdbdbd', fontSize: 20 }}
                />
              ))}
            </Box>
            <Typography className={classes.stageLabels}>
              Customize steps
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

// ─── Step 4: Destination (AAP) ────────────────────────────────────────────────

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
          label="Auto-create AAP Project from Git repository"
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

  const pipelineLabel =
    form.pipelineType === 'comprehensive'
      ? 'Comprehensive pipeline'
      : form.pipelineType === 'standard'
        ? 'Standard pipeline'
        : `Custom (${form.customStages.length} stages)`;

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
          Project Details
          <EditButton step={0} />
        </Typography>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Template</Typography>
          <Typography className={classes.reviewValue}>
            {template.title}
          </Typography>
        </Box>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Service name</Typography>
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
          Source Code
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
          Pipeline & Governance
          <EditButton step={2} />
        </Typography>
        <Box className={classes.reviewRow}>
          <Typography className={classes.reviewLabel}>Pipeline</Typography>
          <Typography className={classes.reviewValue}>
            {pipelineLabel}
          </Typography>
        </Box>
        {form.pipelineType === 'custom' && (
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Stages</Typography>
            <Typography className={classes.reviewValue}>
              Commit {'>'}{' '}
              {form.customStages
                .map(
                  id => CUSTOM_PIPELINE_STAGES.find(s => s.id === id)?.label,
                )
                .filter(Boolean)
                .join(' > ')}{' '}
              {'>'} Pushed to AAP
            </Typography>
          </Box>
        )}
      </Box>

      <Box className={classes.reviewSection}>
        <Typography className={classes.reviewSectionTitle}>
          Destination (AAP)
          <EditButton step={3} />
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
            Auto-create Project
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
    </Box>
  );
};

// ─── Success Screen ───────────────────────────────────────────────────────────

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
        (This is a prototype demo — no actual resources were created.)
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
      if (form.pipelineType === 'custom') return form.customStages.length > 0;
      return true;
    case 3:
      return true;
    case 4:
      return true;
    default:
      return true;
  }
};

// ─── Main Wizard ──────────────────────────────────────────────────────────────

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
  const [form, setForm] = useState<WizardFormState>(() =>
    createInitialState(template),
  );

  const stepValid = isStepValid(activeStep, form);

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

  const handleJumpToStep = useCallback((step: number) => {
    setActiveStep(step);
  }, []);

  if (completed) {
    return <SuccessScreen template={template} onClose={onClose} />;
  }

  const currentStep = template.steps[activeStep];
  const isLastStep = activeStep === template.steps.length - 1;

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
        <Chip
          label="Template"
          size="small"
          className={classes.templateBadge}
        />
      </Box>
      <Typography className={classes.subtitle}>
        Create a governed automation repository and pipeline from this template.
        This setup automatically generates your project structure and connects it
        to the Ansible Automation Platform, enforcing quality, security, and
        compatibility checks before any code is promoted to an active Job
        Template.
      </Typography>

      <Stepper activeStep={activeStep} className={classes.stepper}>
        {template.steps.map((step, index) => (
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

        {activeStep === 0 && (
          <DetailsStep form={form} setForm={setForm} template={template} />
        )}
        {activeStep === 1 && (
          <SourceCodeStep form={form} setForm={setForm} />
        )}
        {activeStep === 2 && (
          <PipelineStep form={form} setForm={setForm} />
        )}
        {activeStep === 3 && (
          <DestinationStep form={form} setForm={setForm} />
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
