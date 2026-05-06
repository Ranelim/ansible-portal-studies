import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Page,
  Header,
  HeaderTabs,
  Content,
  Table,
  TableColumn,
} from '@backstage/core-components';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  Link,
  Divider,
  Collapse,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  CircularProgress,
} from '@material-ui/core';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CodeIcon from '@material-ui/icons/Code';
import VisibilityIcon from '@material-ui/icons/Visibility';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import GitHubIcon from '@material-ui/icons/GitHub';
import MemoryIcon from '@material-ui/icons/Memory';
import CategoryIcon from '@material-ui/icons/Category';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import SecurityIcon from '@material-ui/icons/Security';
import CloseIcon from '@material-ui/icons/Close';
import {
  DEMO_PROJECTS,
  DemoProject,
  PipelineStage,
  JobRunEntry,
  PipelineRun,
} from '../catalog/projectsDemoData';
import { PIPELINE_PROFILES, STAGE_DESCRIPTIONS as UNIFIED_STAGE_DESCS } from '../catalog/unifiedDemoData';
import { GovernanceStatusBadge } from '../../common/GovernanceStatusBadge';
import { useProjectDetailStyles } from './styles';
import { statusColors } from '../../common/statusColors';
import { getProjectQuality, getProjectUpgradeData } from './qualityDemoData';
import { QualityTab, type OperationStatus } from './QualityTab';
import { DependenciesTab } from './DependenciesTab';
import { AapUpgradeWizard } from './AapUpgradeWizard';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import BuildIcon from '@material-ui/icons/Build';
import SystemUpdateIcon from '@material-ui/icons/SystemUpdate';

const PROFILE_BY_REPO: Record<string, string> = {
  'rhel-patch-automation': 'stig-rhel9',
  'cis-compliance-scanner': 'stig-rhel9',
  'firewall-policy-engine': 'org-default',
  'aws-provisioner': 'minimal',
  'web-app-scaling-suite': 'org-default',
  'network-compliance-checker': 'org-default',
};

const getProfileForProject = (projectName: string) => {
  const profileId = PROFILE_BY_REPO[projectName] ?? 'org-default';
  return PIPELINE_PROFILES.find(p => p.id === profileId) ?? PIPELINE_PROFILES[1];
};

const getProfileStageNames = (projectName: string): string[] => {
  const profile = getProfileForProject(projectName);
  return profile.stages;
};

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'quality', label: 'Quality' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'readme', label: 'README' },
  { id: 'yaml', label: 'YAML' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'aap-activity', label: 'AAP Activity' },
  { id: 'resources', label: 'Resources' },
];

const PROJECT_README: Record<string, string> = {
  'web-app-scaling-suite': `# Web App Scaling Suite

Ansible automation for scaling web applications across cloud and on-premise infrastructure.

## Overview

This project provides playbooks for managing application scaling, load balancer configuration, and capacity planning automation.

## Playbooks

| Playbook | Description |
|----------|-------------|
| \`scale-up.yml\` | Scale out application instances |
| \`scale-down.yml\` | Scale in during low traffic |
| \`health-check.yml\` | Verify service health post-scaling |

## Requirements

- Ansible >= 2.15
- Target: AWS, Azure, or on-premise load balancers
- Credentials configured in vault

## License

Apache-2.0`,

  'rhel-patch-automation': `# RHEL Patch Automation

Automated patching workflow for Red Hat Enterprise Linux servers with pre/post validation.

## Overview

This project automates the complete patching lifecycle for RHEL hosts: pre-patch validation, snapshot creation, patch application, smoke testing, and rollback if needed.

## Playbooks

| Playbook | Description |
|----------|-------------|
| \`patch-all.yml\` | Full patching workflow |
| \`pre-check.yml\` | Pre-patch validation |
| \`rollback.yml\` | Revert to pre-patch snapshot |
| \`report.yml\` | Generate compliance report |

## Requirements

- Ansible >= 2.14
- Target: RHEL 8.x / RHEL 9.x
- Satellite or direct yum/dnf access

## License

Apache-2.0`,
};

const DEFAULT_PROJECT_README = `# Project

This project was created in the Ansible Portal to manage automation content with governance pipelines and AAP integration.

## Getting Started

Check the **Overview** tab for project maturity status and pipeline results. Use the **Resources** tab to explore discovered automation content.

## License

Apache-2.0`;

const getProjectYamlFiles = (project: DemoProject) => {
  const files = [
    {
      name: 'requirements.yml',
      path: 'collections/requirements.yml',
      content: `---
collections:
  - name: ansible.builtin
    version: ">=2.14"
  - name: ansible.posix
    version: "1.5.4"
  - name: community.general
    version: "7.5.0"`,
    },
  ];

  if (project.resources.some(r => r.type === 'execution-environment')) {
    files.push({
      name: 'execution-environment.yml',
      path: 'execution-environment.yml',
      content: `---
version: 3
build_arg_defaults:
  ANSIBLE_GALAXY_CLI_COLLECTION_OPTS: "--pre"
dependencies:
  galaxy: collections/requirements.yml
  python:
    - jmespath>=1.0.0
    - netaddr>=0.8.0
  system:
    - openssh-clients
images:
  base_image:
    name: registry.redhat.io/ansible-automation-platform/ee-minimal-rhel9:latest`,
    });
  }

  files.push({
    name: 'ansible.cfg',
    path: 'ansible.cfg',
    content: `[defaults]
inventory = inventory/
roles_path = roles/
collections_path = collections/
retry_files_enabled = False
stdout_callback = yaml

[privilege_escalation]
become = True
become_method = sudo`,
  });

  return files;
};

const StageIcon = ({
  status,
  size = 18,
}: {
  status: PipelineStage['status'];
  size?: number;
}) => {
  const classes = useProjectDetailStyles();
  const colorMap: Record<string, string> = {
    passed: statusColors.success,
    failed: statusColors.error,
    running: statusColors.info,
    pending: statusColors.pending,
  };
  const color = colorMap[status] || statusColors.pending;

  if (status === 'pending')
    return <RadioButtonUncheckedIcon style={{ color, fontSize: size }} />;
  if (status === 'failed')
    return <ErrorIcon style={{ color, fontSize: size }} />;
  if (status === 'running')
    return (
      <AutorenewIcon
        style={{ color, fontSize: size }}
        className={classes.spinIcon}
      />
    );
  return <CheckCircleIcon style={{ color, fontSize: size }} />;
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'passed':
    case 'success':
      return 'Passed';
    case 'failed':
      return 'Failed';
    case 'running':
      return 'Running';
    case 'pending':
      return 'Pending';
    case 'none':
      return 'N/A';
    default:
      return status;
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'passed':
    case 'success':
      return statusColors.success;
    case 'failed':
      return statusColors.error;
    case 'running':
      return statusColors.info;
    default:
      return statusColors.pending;
  }
};


// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------
const OverviewTab = ({
  project,
  isPushedToAap,
  onPushToAap,
  onGoToQuality,
}: {
  project: DemoProject;
  isPushedToAap: boolean;
  onPushToAap: () => void;
  onGoToQuality: () => void;
}) => {
  const classes = useProjectDetailStyles();
  const quality = getProjectQuality(project.name);

  const healthColor = quality
    ? quality.healthScore >= 80 ? statusColors.success : quality.healthScore >= 50 ? statusColors.warning : statusColors.error
    : undefined;

  return (
    <Box className={classes.tabContent}>
      <Box className={classes.mainColumn}>
        {/* Quality overview */}
        <Card
          className={classes.card}
          variant="outlined"
          style={{ cursor: 'pointer' }}
          onClick={onGoToQuality}
        >
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle} style={{ marginBottom: 12 }}>
              Quality overview
            </Typography>
            {quality ? (
              <>
                <Box display="flex" style={{ gap: 24, marginBottom: 12 }}>
                  <Box>
                    <Typography style={{ fontSize: 28, fontWeight: 700, color: healthColor, lineHeight: 1 }}>
                      {quality.healthScore}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Health score</Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 28, fontWeight: 700, color: quality.totalViolations > 0 ? statusColors.error : statusColors.success, lineHeight: 1 }}>
                      {quality.totalViolations}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Violations</Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                      {quality.scanCount}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Scans</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
                  Last scanned {quality.lastScannedAt} · commit <code style={{ fontSize: 11 }}>{quality.lastScannedCommit}</code>
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No quality scans have been run yet. Use the Check button to run your first scan.
              </Typography>
            )}
            <Typography
              variant="body2"
              color="primary"
              style={{ marginTop: 12, fontSize: 13, fontWeight: 500 }}
            >
              View quality details →
            </Typography>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className={classes.card} variant="outlined">
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle}>
              Recent activity
            </Typography>
            {quality && quality.scanHistory.length > 0 && (
              <Box className={classes.activityItem}>
                <SecurityIcon style={{ fontSize: 18, color: '#666', marginTop: 2 }} />
                <Box style={{ flex: 1 }}>
                  <Typography className={classes.activityText}>
                    Quality {quality.scanHistory[0].scanType} <strong>completed</strong> — {quality.scanHistory[0].totalViolations} violation{quality.scanHistory[0].totalViolations !== 1 ? 's' : ''} found
                    {quality.scanHistory[0].remediatedCount > 0 && `, ${quality.scanHistory[0].remediatedCount} fixed`}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    commit <code style={{ fontSize: 11 }}>{quality.scanHistory[0].commitHash}</code>
                  </Typography>
                </Box>
                <Typography className={classes.activityTime}>
                  {quality.scanHistory[0].createdAt}
                </Typography>
              </Box>
            )}
            {project.repo.lastCommit && (
              <Box className={classes.activityItem}>
                <GitHubIcon style={{ fontSize: 18, color: '#666', marginTop: 2 }} />
                <Typography className={classes.activityText}>
                  <strong>{project.repo.lastCommit.author}</strong> pushed commit{' '}
                  <code style={{ fontSize: 12 }}>{project.repo.lastCommit.hash.substring(0, 7)}</code>{' '}
                  — {project.repo.lastCommit.message}
                </Typography>
                <Typography className={classes.activityTime}>
                  {project.repo.lastCommit.timestamp}
                </Typography>
              </Box>
            )}
            {project.jobHistory.length > 0 && (
              <Box className={classes.activityItem}>
                <CloudUploadIcon style={{ fontSize: 18, color: '#666', marginTop: 2 }} />
                <Typography className={classes.activityText}>
                  Job #{project.jobHistory[0].id}{' '}
                  <strong>{project.jobHistory[0].status}</strong> — launched by{' '}
                  {project.jobHistory[0].launchedBy}
                </Typography>
                <Typography className={classes.activityTime}>
                  {project.jobHistory[0].startedAt}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Sidebar */}
      <Box className={classes.sidebarColumn}>
        <AapConnectionCard project={project} isPushedToAap={isPushedToAap} onPushToAap={onPushToAap} />
        <AboutCard project={project} />
        <SourceCard project={project} />
        <LinksCard project={project} />
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Sidebar Cards
// ---------------------------------------------------------------------------
const AAP_PUSH_KEY = 'portal-aap-pushed-repos';

function loadAapPushedRepos(): Set<string> {
  try {
    const raw = localStorage.getItem(AAP_PUSH_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveAapPushedRepos(repos: Set<string>) {
  localStorage.setItem(AAP_PUSH_KEY, JSON.stringify([...repos]));
}

// ---------------------------------------------------------------------------
// Push to AAP Modal
// ---------------------------------------------------------------------------
const PUSH_STEPS = ['AAP Project', 'Job Template', 'Review'];

const PushToAapModal = ({
  open,
  project,
  onClose,
  onComplete,
}: {
  open: boolean;
  project: DemoProject;
  onClose: () => void;
  onComplete: () => void;
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [pushing, setPushing] = useState(false);
  const [done, setDone] = useState(false);

  const playbooks = project.resources.filter(r => r.type === 'playbook');
  const defaultPlaybook = playbooks[0]?.name ?? 'site.yml';

  const [form, setForm] = useState({
    projectName: project.title,
    projectDescription: `Automation content from ${project.repo.url.split('/').pop()}`,
    scmBranch: project.repo.branch,
    templateName: project.title,
    playbook: defaultPlaybook,
    inventory: 'RHEL Production Hosts',
    credential: 'Machine — rhel-ssh-key',
    executionEnvironment: 'Default EE — RHEL 9',
  });

  const updateField = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handlePush = () => {
    setPushing(true);
    setTimeout(() => {
      setPushing(false);
      setDone(true);
    }, 2000);
  };

  const handleDone = () => {
    setActiveStep(0);
    setDone(false);
    onComplete();
  };

  const handleClose = () => {
    if (!pushing) {
      setActiveStep(0);
      setDone(false);
      onClose();
    }
  };

  const fieldRow = (label: string, value: string, field: string, opts?: { select?: string[]; disabled?: boolean; multiline?: boolean }) => (
    <Box style={{ marginBottom: 16 }}>
      {opts?.select ? (
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel>{label}</InputLabel>
          <Select
            native
            value={value}
            onChange={e => updateField(field, e.target.value as string)}
            label={label}
          >
            {opts.select.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </Select>
        </FormControl>
      ) : (
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          label={label}
          value={value}
          disabled={opts?.disabled}
          multiline={opts?.multiline}
          rows={opts?.multiline ? 2 : 1}
          onChange={e => updateField(field, e.target.value)}
        />
      )}
    </Box>
  );

  const reviewRow = (label: string, value: string) => (
    <Box display="flex" style={{ padding: '5px 0', gap: 8 }}>
      <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, minWidth: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" style={{ fontSize: 12, fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ paddingBottom: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <CloudUploadIcon style={{ color: statusColors.info }} />
            <Typography variant="h6" style={{ fontSize: 16, fontWeight: 600 }}>
              Push to AAP
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} disabled={pushing}>
            <CloseIcon style={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent style={{ paddingTop: 8 }}>
        {!done && (
          <Stepper activeStep={activeStep} alternativeLabel style={{ padding: '16px 0' }}>
            {PUSH_STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* Step 0: AAP Project */}
        {activeStep === 0 && !done && (
          <Box>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 16 }}>
              Configure the AAP project that will sync content from your Git repository.
            </Typography>
            {fieldRow('Project name', form.projectName, 'projectName')}
            {fieldRow('Description', form.projectDescription, 'projectDescription', { multiline: true })}
            {fieldRow('Source control URL', project.repo.url, 'scmUrl', { disabled: true })}
            {fieldRow('Source control branch', form.scmBranch, 'scmBranch')}
          </Box>
        )}

        {/* Step 1: Job Template */}
        {activeStep === 1 && !done && (
          <Box>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 16 }}>
              Configure the job template that will run automation from this repository.
            </Typography>
            {fieldRow('Template name', form.templateName, 'templateName')}
            {fieldRow('Playbook', form.playbook, 'playbook', {
              select: playbooks.length > 0 ? playbooks.map(p => p.name) : [defaultPlaybook],
            })}
            {fieldRow('Inventory', form.inventory, 'inventory', {
              select: ['RHEL Production Hosts', 'RHEL Staging Hosts', 'All Hosts'],
            })}
            {fieldRow('Credential', form.credential, 'credential', {
              select: ['Machine — rhel-ssh-key', 'Machine — root-key', 'Vault — prod-vault'],
            })}
            {fieldRow('Execution environment', form.executionEnvironment, 'executionEnvironment', {
              select: ['Default EE — RHEL 9', 'Custom EE — rhel-patching-ee', 'Minimal EE'],
            })}
          </Box>
        )}

        {/* Step 2: Review */}
        {activeStep === 2 && !done && !pushing && (
          <Box>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 12 }}>
              Review the resources that will be created in your AAP controller.
            </Typography>
            <Paper variant="outlined" style={{ padding: '12px 16px', marginBottom: 12 }}>
              <Typography variant="subtitle2" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                AAP Project
              </Typography>
              {reviewRow('Name', form.projectName)}
              {reviewRow('Source', project.repo.url)}
              {reviewRow('Branch', form.scmBranch)}
            </Paper>
            <Paper variant="outlined" style={{ padding: '12px 16px' }}>
              <Typography variant="subtitle2" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Job Template
              </Typography>
              {reviewRow('Name', form.templateName)}
              {reviewRow('Playbook', form.playbook)}
              {reviewRow('Inventory', form.inventory)}
              {reviewRow('Credential', form.credential)}
              {reviewRow('Execution environment', form.executionEnvironment)}
            </Paper>
          </Box>
        )}

        {/* Pushing state */}
        {pushing && (
          <Box style={{ textAlign: 'center', padding: '32px 0' }}>
            <CircularProgress size={40} style={{ marginBottom: 16 }} />
            <Typography variant="body1" style={{ fontWeight: 500, marginBottom: 8 }}>
              Pushing to AAP...
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
              Creating AAP project and job template
            </Typography>
            <LinearProgress style={{ marginTop: 16, borderRadius: 4 }} />
          </Box>
        )}

        {/* Success state */}
        {done && (
          <Box style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircleIcon style={{ fontSize: 48, color: statusColors.success, marginBottom: 12 }} />
            <Typography variant="h6" style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Successfully pushed to AAP
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 16 }}>
              Your AAP project and job template have been created. Content will sync automatically from your repository.
            </Typography>
            <Paper variant="outlined" style={{ padding: '10px 16px', textAlign: 'left', marginBottom: 8 }}>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                <Typography variant="body2" style={{ fontSize: 12 }}>
                  AAP Project: <strong>{form.projectName}</strong>
                </Typography>
              </Box>
            </Paper>
            <Paper variant="outlined" style={{ padding: '10px 16px', textAlign: 'left' }}>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                <Typography variant="body2" style={{ fontSize: 12 }}>
                  Job Template: <strong>{form.templateName}</strong>
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions style={{ padding: '8px 24px 16px' }}>
        {!done && !pushing && (
          <>
            <Button
              onClick={activeStep === 0 ? handleClose : () => setActiveStep(prev => prev - 1)}
              style={{ textTransform: 'none' }}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            {activeStep < 2 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setActiveStep(prev => prev + 1)}
                style={{ textTransform: 'none' }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handlePush}
                startIcon={<CloudUploadIcon />}
                style={{ textTransform: 'none' }}
              >
                Push to AAP
              </Button>
            )}
          </>
        )}
        {done && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleDone}
            style={{ textTransform: 'none' }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Sidebar AAP Card
// ---------------------------------------------------------------------------
const AapConnectionCard = ({
  project,
  isPushedToAap,
  onPushToAap,
}: {
  project: DemoProject;
  isPushedToAap: boolean;
  onPushToAap: () => void;
}) => {
  const classes = useProjectDetailStyles();
  const isConnected = isPushedToAap;

  const statusRow = (label: string, connected: boolean, detail?: string) => (
    <Box display="flex" alignItems="center" style={{ gap: 8, padding: '6px 0' }}>
      {connected ? (
        <CheckCircleIcon style={{ fontSize: 18, color: statusColors.success }} />
      ) : (
        <RadioButtonUncheckedIcon style={{ fontSize: 18, color: statusColors.pending }} />
      )}
      <Box flex={1}>
        <Typography variant="body2" style={{ fontSize: 13, fontWeight: connected ? 500 : 400, color: connected ? 'inherit' : '#888' }}>
          {label}
        </Typography>
        {detail && (
          <Typography variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
            {detail}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Card className={classes.card} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle}>AAP connection</Typography>
        {statusRow(
          'AAP project',
          isConnected,
          isConnected ? `Syncing from ${project.repo.url.split('/').pop()}` : undefined,
        )}
        {statusRow(
          'Job template',
          isConnected,
          isConnected ? `Template: ${project.title}` : undefined,
        )}
        {isConnected && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            {statusRow('Last job run', false, 'No jobs have run yet')}
          </>
        )}
        {!isConnected && (
          <Box style={{
            marginTop: 10,
            padding: '8px 10px',
            backgroundColor: 'rgba(43, 154, 243, 0.08)',
            borderRadius: 6,
            borderLeft: `3px solid ${statusColors.info}`,
          }}>
            <Typography variant="body2" style={{ fontSize: 12, lineHeight: 1.5 }}>
              Push this repository to AAP to create an AAP project and job template. Content will sync automatically on each pipeline pass.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              style={{ textTransform: 'none', marginTop: 8, fontSize: 12, borderRadius: 16 }}
              onClick={onPushToAap}
            >
              Push to AAP
            </Button>
          </Box>
        )}
        {isConnected && (
          <Box style={{ marginTop: 8 }}>
            <Link
              style={{ fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              View in AAP
              <OpenInNewIcon style={{ fontSize: 12 }} />
            </Link>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const AboutCard = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();
  return (
    <Card className={classes.card} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle}>About</Typography>
        <Box>
          <Typography className={classes.cardLabel}>Description</Typography>
          <Typography className={classes.cardValue}>
            {project.description}
          </Typography>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Owner</Typography>
          <Typography className={classes.cardValue}>
            {project.owner}
          </Typography>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Created</Typography>
          <Typography className={classes.cardValue}>
            {project.createdAt}
          </Typography>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Template</Typography>
          <Typography className={classes.cardValue}>
            {project.templateUsed}
          </Typography>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Pipeline profile</Typography>
          <Chip
            size="small"
            label={getProfileForProject(project.name).name}
            variant="outlined"
            style={{ fontSize: 12, height: 24 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const SourceCard = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();
  const navigate = useNavigate();
  return (
    <Card className={classes.card} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle}>Source repository</Typography>
        <Box>
          <Typography className={classes.cardLabel}>Repository</Typography>
          <Link
            className={classes.sourceLink}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              navigate(
                `/self-service/projects/repositories/${project.name}`,
              )
            }
          >
            {project.repo.url.replace(/^https?:\/\//, '')}
          </Link>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Branch</Typography>
          <Chip
            size="small"
            label={project.repo.branch}
            variant="outlined"
            style={{ fontSize: 12, height: 24, fontFamily: 'monospace' }}
          />
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Last commit</Typography>
          <Typography className={classes.cardValue}>
            <code style={{ fontSize: 12 }}>
              {project.repo.lastCommit.hash.substring(0, 7)}
            </code>{' '}
            by {project.repo.lastCommit.author}
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            style={{ display: 'block', marginTop: 2 }}
          >
            {project.repo.lastCommit.message}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const LinksCard = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();
  const navigate = useNavigate();
  const isPushed =
    project.aap.project === 'pushed' &&
    project.aap.jobTemplate === 'pushed';

  return (
    <Card className={classes.linksCard} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle}>Links</Typography>
        <Box
          className={classes.linkItem}
          onClick={() =>
            navigate(
              `/self-service/projects/repositories/${project.name}`,
            )
          }
        >
          <GitHubIcon className={classes.linkIcon} />
          <Box>
            <Typography className={classes.linkText}>
              View repository
            </Typography>
            <Typography className={classes.linkDescription}>
              Repository details, README, and commits
            </Typography>
          </Box>
        </Box>
        <Box
          className={classes.linkItem}
          onClick={() =>
            window.open(project.repo.url, '_blank')
          }
        >
          <VisibilityIcon className={classes.linkIcon} />
          <Box>
            <Typography className={classes.linkText}>View source</Typography>
            <Typography className={classes.linkDescription}>
              Browse the Git repository externally
            </Typography>
          </Box>
        </Box>
        <Box
          className={classes.linkItem}
          onClick={() =>
            window.open(project.repo.url, '_blank')
          }
        >
          <CodeIcon className={classes.linkIcon} />
          <Box>
            <Typography className={classes.linkText}>
              Edit in Workspace
            </Typography>
            <Typography className={classes.linkDescription}>
              Open this project in a dev workspace
            </Typography>
          </Box>
        </Box>
        {isPushed && (
          <Box className={classes.linkItem}>
            <OpenInNewIcon className={classes.linkIcon} />
            <Box>
              <Typography className={classes.linkText}>
                View in AAP
              </Typography>
              <Typography className={classes.linkDescription}>
                Open in Ansible Automation Platform
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Pipeline Tab (master-detail)
// ---------------------------------------------------------------------------

const STAGE_DESCS: Record<string, string> = UNIFIED_STAGE_DESCS;

const buildStagesForRun = (
  run: PipelineRun,
  project: DemoProject,
): PipelineStage[] => {
  const isLatest = project.pipelineHistory[0]?.id === run.id;
  if (isLatest) return project.pipeline;

  const names = getProfileStageNames(project.name);

  if (run.status === 'passed') {
    return names.map(name => ({
      name,
      status: 'passed' as const,
      duration: '—',
      description: STAGE_DESCS[name],
    }));
  }

  if (run.status === 'failed') {
    const failIndex = Math.min(2, names.length - 1);
    return names.map((name, i) => ({
      name,
      status:
        i < failIndex
          ? ('passed' as const)
          : i === failIndex
            ? ('failed' as const)
            : ('pending' as const),
      duration: i <= failIndex ? '—' : undefined,
      description: STAGE_DESCS[name],
      detail:
        i === failIndex
          ? 'Check failed — review the log for details.'
          : undefined,
    }));
  }

  return names.map((name, i) => ({
    name,
    status:
      i < 2
        ? ('passed' as const)
        : i === 2
          ? ('running' as const)
          : ('pending' as const),
    duration: i < 2 ? '—' : undefined,
    description: STAGE_DESCS[name],
  }));
};

const PipelineRunDetail = ({
  run,
  stages,
  project,
  onBack,
}: {
  run: PipelineRun;
  stages: PipelineStage[];
  project: DemoProject;
  onBack: () => void;
}) => {
  const classes = useProjectDetailStyles();
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  return (
    <Box style={{ marginTop: 24 }}>
      <Button
        startIcon={<ExpandLessIcon style={{ transform: 'rotate(-90deg)' }} />}
        onClick={onBack}
        style={{ textTransform: 'none', fontWeight: 500, marginBottom: 16 }}
      >
        All runs
      </Button>

      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Box display="flex" alignItems="center" style={{ gap: 12 }}>
              <Typography
                className={classes.cardTitle}
                style={{ marginBottom: 0 }}
              >
                Run #{run.id}
              </Typography>
              <Chip
                size="small"
                label={statusLabel(run.status)}
                style={{
                  backgroundColor: `${statusColor(run.status)}20`,
                  color: statusColor(run.status),
                  fontWeight: 500,
                  fontSize: 12,
                }}
              />
            </Box>
            <Chip
              size="small"
              label={getProfileForProject(project.name).name}
              variant="outlined"
              style={{ fontSize: 12, height: 24 }}
            />
          </Box>

          <Box style={{ marginBottom: 16 }}>
            <Box
              display="flex"
              alignItems="center"
              style={{ gap: 16 }}
            >
              <Typography variant="body2" color="textSecondary">
                Triggered by{' '}
                <code style={{ fontSize: 12 }}>
                  {run.trigger.substring(0, 7)}
                </code>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Started {run.startedAt}
              </Typography>
              {run.duration !== '—' && (
                <Typography variant="body2" color="textSecondary">
                  Duration: {run.duration}
                </Typography>
              )}
            </Box>
            {run.commitMessage && (
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 4, fontStyle: 'italic' }}>
                {run.commitMessage}
              </Typography>
            )}
          </Box>

          {stages.filter(s => s.name !== 'Pushed to AAP').map((stage, i) => (
            <Box key={stage.name}>
              <Box
                className={`${classes.pipelineStageRow} ${expandedStage === i ? classes.pipelineStageExpanded : ''}`}
                onClick={() =>
                  setExpandedStage(prev => (prev === i ? null : i))
                }
              >
                <StageIcon status={stage.status} />
                <Typography className={classes.stageName}>
                  {stage.name}: {statusLabel(stage.status)}
                </Typography>
                {stage.duration && (
                  <Typography className={classes.stageDuration}>
                    {stage.duration}
                  </Typography>
                )}
                {expandedStage === i ? (
                  <ExpandLessIcon className={classes.expandIcon} />
                ) : (
                  <ExpandMoreIcon className={classes.expandIcon} />
                )}
              </Box>
              <Collapse in={expandedStage === i}>
                <Box className={classes.pipelineExpandedContent}>
                  <Typography className={classes.stageDescription}>
                    {stage.description}
                  </Typography>
                  {stage.detail && (
                    <Typography className={classes.stageDetail}>
                      {stage.detail}
                    </Typography>
                  )}
                  <Box
                    display="flex"
                    alignItems="center"
                    style={{ gap: 16 }}
                  >
                    {stage.timestamp && (
                      <Typography variant="caption" color="textSecondary">
                        {stage.timestamp}
                      </Typography>
                    )}
                    {stage.status !== 'pending' && (
                      <Link className={classes.viewLogLink}>
                        <DescriptionOutlinedIcon style={{ fontSize: 12 }} />
                        View log
                      </Link>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

const PipelineTab = ({ project, initialRunId }: { project: DemoProject; initialRunId?: number | null }) => {
  const classes = useProjectDetailStyles();
  const [selectedRunId, setSelectedRunId] = useState<number | null>(initialRunId ?? null);

  const selectedRun = selectedRunId !== null
    ? project.pipelineHistory.find(r => r.id === selectedRunId) || null
    : null;

  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'running'>('all');

  const filteredRuns = statusFilter === 'all'
    ? project.pipelineHistory
    : project.pipelineHistory.filter(r => r.status === statusFilter);

  const columns: TableColumn<PipelineRun>[] = [
    {
      title: 'Run',
      field: 'id',
      render: (row: PipelineRun) => (
        <Box>
          <Box display="flex" alignItems="center" style={{ gap: 6 }}>
            <Typography
              variant="body2"
              style={{ fontWeight: 500, color: statusColors.info }}
            >
              #{row.id}
            </Typography>
            <code style={{ fontSize: 11, color: 'inherit', opacity: 0.7 }}>
              {row.trigger.substring(0, 7)}
            </code>
          </Box>
          {row.commitMessage && (
            <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 2, maxWidth: 260 }} noWrap>
              {row.commitMessage}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      title: 'Status',
      field: 'status',
      render: (row: PipelineRun) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          <StageIcon
            status={
              row.status === 'passed'
                ? 'passed'
                : (row.status as PipelineStage['status'])
            }
            size={16}
          />
          <Typography variant="body2">{statusLabel(row.status)}</Typography>
        </Box>
      ),
    },
    {
      title: 'Stages',
      sorting: false,
      render: (row: PipelineRun) => {
        const stages = buildStagesForRun(row, project);
        return (
          <Box display="flex" alignItems="center" style={{ gap: 3 }}>
            {stages.map(s => (
              <Tooltip key={s.name} title={`${s.name}: ${statusLabel(s.status)}`} arrow>
                <span style={{ display: 'flex' }}>
                  <StageIcon status={s.status} size={18} />
                </span>
              </Tooltip>
            ))}
          </Box>
        );
      },
    },
    { title: 'Started', field: 'startedAt' },
    { title: 'Duration', field: 'duration' },
  ];

  if (selectedRun) {
    return (
      <PipelineRunDetail
        run={selectedRun}
        stages={buildStagesForRun(selectedRun, project)}
        project={project}
        onBack={() => setSelectedRunId(null)}
      />
    );
  }

  return (
    <Box style={{ marginTop: 24 }}>
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1.5}
          >
            <Typography
              className={classes.cardTitle}
              style={{ marginBottom: 0 }}
            >
              Pipeline runs
            </Typography>
            <Chip
              size="small"
              label={getProfileForProject(project.name).name}
              variant="outlined"
              style={{ fontSize: 12, height: 24 }}
            />
          </Box>
          <Box display="flex" style={{ gap: 6, marginBottom: 12 }}>
            {(['all', 'passed', 'failed', 'running'] as const).map(f => (
              <Chip
                key={f}
                size="small"
                label={f === 'all' ? `All (${project.pipelineHistory.length})` : `${statusLabel(f)} (${project.pipelineHistory.filter(r => r.status === f).length})`}
                onClick={() => setStatusFilter(f)}
                variant={statusFilter === f ? 'default' : 'outlined'}
                style={{
                  fontSize: 12,
                  height: 24,
                  ...(statusFilter === f ? { backgroundColor: `${statusColor(f === 'all' ? 'passed' : f)}20`, color: f === 'all' ? undefined : statusColor(f) } : {}),
                }}
              />
            ))}
          </Box>
          <Table<PipelineRun>
            columns={columns}
            data={filteredRuns}
            title=""
            options={{
              paging: false,
              search: false,
              sorting: false,
              padding: 'dense',
              header: true,
              rowStyle: { cursor: 'pointer' },
            }}
            style={{ boxShadow: 'none' }}
            onRowClick={(_e, rowData) => {
              if (rowData) {
                setSelectedRunId((rowData as PipelineRun).id);
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// AAP Activity Tab
// ---------------------------------------------------------------------------
const AapActivityTab = ({
  project,
  isPushedToAap,
  onPushToAap,
}: {
  project: DemoProject;
  isPushedToAap: boolean;
  onPushToAap: () => void;
}) => {
  const classes = useProjectDetailStyles();
  const isPushed = isPushedToAap;

  const jobColumns: TableColumn<JobRunEntry>[] = [
    {
      title: 'Job ID',
      field: 'id',
      render: (row: JobRunEntry) => (
        <Typography variant="body2" style={{ fontWeight: 500 }}>
          #{row.id}
        </Typography>
      ),
    },
    {
      title: 'Status',
      field: 'status',
      render: (row: JobRunEntry) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          <StageIcon
            status={
              row.status === 'success'
                ? 'passed'
                : (row.status as PipelineStage['status'])
            }
            size={16}
          />
          <Typography variant="body2">{statusLabel(row.status)}</Typography>
        </Box>
      ),
    },
    { title: 'Started', field: 'startedAt' },
    { title: 'Duration', field: 'duration' },
    { title: 'Launched by', field: 'launchedBy' },
  ];

  const AapStatusIcon = ({
    status,
  }: {
    status: 'pushed' | 'not-pushed' | 'error';
  }) => {
    if (status === 'pushed')
      return <CheckCircleIcon style={{ color: statusColors.success, fontSize: 20 }} />;
    if (status === 'error')
      return <ErrorIcon style={{ color: statusColors.error, fontSize: 20 }} />;
    return (
      <RadioButtonUncheckedIcon style={{ color: statusColors.pending, fontSize: 20 }} />
    );
  };

  const aapStatusText = (status: 'pushed' | 'not-pushed' | 'error') => {
    if (status === 'pushed') return 'Pushed';
    if (status === 'error') return 'Error';
    return 'Not pushed';
  };

  return (
    <Box style={{ marginTop: 24 }}>
      {/* Push status */}
      <Card className={classes.card} variant="outlined" style={{ marginBottom: 24 }}>
        <CardContent className={classes.cardContent}>
          <Typography className={classes.cardTitle}>
            AAP push status
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
            Pushing to AAP creates or updates the project and job template in
            your Ansible Controller based on the manifest in your repository.
          </Typography>

          <Box className={classes.summaryGrid}>
            <Paper className={classes.summaryCard} variant="outlined">
              <Typography className={classes.summaryLabel}>
                AAP Project
              </Typography>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <AapStatusIcon status={isPushed ? 'pushed' : 'not-pushed'} />
                <Typography className={classes.summaryValue}>
                  {aapStatusText(isPushed ? 'pushed' : 'not-pushed')}
                </Typography>
              </Box>
            </Paper>
            <Paper className={classes.summaryCard} variant="outlined">
              <Typography className={classes.summaryLabel}>
                Job Template
              </Typography>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <AapStatusIcon status={isPushed ? 'pushed' : 'not-pushed'} />
                <Typography className={classes.summaryValue}>
                  {aapStatusText(isPushed ? 'pushed' : 'not-pushed')}
                </Typography>
              </Box>
            </Paper>
            <Paper className={classes.summaryCard} variant="outlined">
              <Typography className={classes.summaryLabel}>
                Last Job Run
              </Typography>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                {project.lastJobRun.status !== 'none' ? (
                  <>
                    <StageIcon
                      status={
                        project.lastJobRun.status === 'success'
                          ? 'passed'
                          : (project.lastJobRun.status as PipelineStage['status'])
                      }
                      size={20}
                    />
                    <Typography className={classes.summaryValue}>
                      {statusLabel(project.lastJobRun.status)}
                    </Typography>
                  </>
                ) : (
                  <Typography
                    className={classes.summaryValue}
                    color="textSecondary"
                  >
                    No runs yet
                  </Typography>
                )}
              </Box>
            </Paper>
          </Box>

          {!isPushed && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              style={{ textTransform: 'none', fontWeight: 600 }}
              onClick={onPushToAap}
            >
              Push to AAP
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Job run history */}
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <Typography className={classes.cardTitle}>
            Job run history
          </Typography>
          {project.jobHistory.length > 0 ? (
            <Table<JobRunEntry>
              columns={jobColumns}
              data={project.jobHistory}
              title=""
              options={{
                paging: false,
                search: false,
                sorting: false,
                padding: 'dense',
                header: true,
              }}
              style={{ boxShadow: 'none' }}
            />
          ) : (
            <Typography variant="body2" color="textSecondary">
              No job runs yet. Push this project to AAP and run a job template
              to see execution history here.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Resources Tab
// ---------------------------------------------------------------------------
const ResourcesTab = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();

  const resourceIcon = (type: string) => {
    switch (type) {
      case 'playbook':
        return (
          <InsertDriveFileOutlinedIcon className={classes.resourceIcon} />
        );
      case 'role':
        return <FolderOutlinedIcon className={classes.resourceIcon} />;
      case 'collection-dep':
        return <CategoryIcon className={classes.resourceIcon} />;
      case 'execution-environment':
        return <MemoryIcon className={classes.resourceIcon} />;
      default:
        return (
          <InsertDriveFileOutlinedIcon className={classes.resourceIcon} />
        );
    }
  };

  const resourceTypeLabel = (type: string) => {
    switch (type) {
      case 'playbook':
        return 'Playbook';
      case 'role':
        return 'Role';
      case 'collection-dep':
        return 'Collection';
      case 'execution-environment':
        return 'EE';
      default:
        return type;
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, typeof project.resources> = {};
    for (const r of project.resources) {
      const key = r.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }, [project.resources]);

  const groupOrder = [
    'playbook',
    'role',
    'execution-environment',
    'collection-dep',
  ];
  const groupLabels: Record<string, string> = {
    playbook: 'Playbooks',
    role: 'Roles',
    'execution-environment': 'Execution Environments',
    'collection-dep': 'Collection Dependencies',
  };

  return (
    <Box style={{ marginTop: 24 }}>
      {groupOrder.map(type => {
        const items = grouped[type];
        if (!items || items.length === 0) return null;
        return (
          <Card
            key={type}
            className={classes.card}
            variant="outlined"
            style={{ marginBottom: 24 }}
          >
            <CardContent className={classes.cardContent}>
              <Typography className={classes.cardTitle}>
                {groupLabels[type]} ({items.length})
              </Typography>
              {items.map(r => (
                <Box key={r.name} className={classes.resourceItem}>
                  {resourceIcon(r.type)}
                  <Box>
                    <Typography className={classes.resourceName}>
                      {r.name}
                    </Typography>
                    <Typography className={classes.resourcePath}>
                      {r.path}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={resourceTypeLabel(r.type)}
                    variant="outlined"
                    className={classes.resourceTypeChip}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// README Tab
// ---------------------------------------------------------------------------
const ReadmeTab = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();
  const readme = PROJECT_README[project.name] || DEFAULT_PROJECT_README;

  return (
    <Box style={{ marginTop: 24, maxWidth: 900 }}>
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <Typography className={classes.cardTitle}>README.md</Typography>
          <Box style={{ fontSize: 14, lineHeight: 1.7 }}>
            <SimpleReadmeRenderer content={readme} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const SimpleReadmeRenderer = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    elements.push(
      <Box
        key={`table-${elements.length}`}
        component="table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          margin: '12px 0',
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            {tableRows[0].map((cell, ci) => (
              <th
                key={ci}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: '2px solid #e0e0e0',
                  fontWeight: 600,
                }}
              >
                {cell.trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.slice(2).map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  {cell.trim().startsWith('`') && cell.trim().endsWith('`') ? (
                    <code
                      style={{
                        fontSize: 12,
                        backgroundColor: '#f5f5f5',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {cell.trim().slice(1, -1)}
                    </code>
                  ) : (
                    cell.trim()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>,
    );
    tableRows = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('|')) {
      tableRows.push(line.split('|').slice(1, -1));
      i++;
      continue;
    }
    if (tableRows.length > 0) flushTable();

    if (line.startsWith('# ')) {
      elements.push(
        <Typography key={i} variant="h5" style={{ fontWeight: 700, marginBottom: 8, marginTop: i > 0 ? 16 : 0 }}>
          {line.substring(2)}
        </Typography>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <Typography key={i} variant="h6" style={{ fontWeight: 600, marginBottom: 8, marginTop: 20 }}>
          {line.substring(3)}
        </Typography>,
      );
    } else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <Paper key={`code-${elements.length}`} variant="outlined" style={{ padding: 12, backgroundColor: '#1e1e1e', borderRadius: 8, margin: '8px 0', overflow: 'auto' }}>
          <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#d4d4d4', fontFamily: "'Consolas', monospace" }}>
            {codeLines.join('\n')}
          </pre>
        </Paper>,
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <Typography key={i} component="li" style={{ fontSize: 14, marginLeft: 16, marginBottom: 4 }}>
          {line.substring(2)}
        </Typography>,
      );
    } else if (line.trim() === '') {
      elements.push(<Box key={i} style={{ height: 8 }} />);
    } else {
      elements.push(
        <Typography key={i} style={{ fontSize: 14, lineHeight: 1.7 }}>
          {line}
        </Typography>,
      );
    }
    i++;
  }
  flushTable();
  return <>{elements}</>;
};

// ---------------------------------------------------------------------------
// YAML Tab
// ---------------------------------------------------------------------------
const ProjectYamlTab = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();
  const files = getProjectYamlFiles(project);

  return (
    <Box style={{ marginTop: 24 }}>
      {files.map(file => (
        <Card
          key={file.path}
          className={classes.card}
          variant="outlined"
          style={{ marginBottom: 24 }}
        >
          <CardContent className={classes.cardContent}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <InsertDriveFileOutlinedIcon style={{ fontSize: 18, color: '#666' }} />
                <Typography style={{ fontWeight: 600, fontSize: 14 }}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="textSecondary" style={{ fontFamily: 'monospace' }}>
                  {file.path}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                style={{ textTransform: 'none', fontSize: 12 }}
                onClick={() =>
                  window.open(
                    `${project.repo.url}/blob/${project.repo.branch}/${file.path}`,
                    '_blank',
                  )
                }
              >
                View in repo
              </Button>
            </Box>
            <Paper
              variant="outlined"
              style={{
                padding: 16,
                backgroundColor: '#1e1e1e',
                borderRadius: 8,
                overflow: 'auto',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#d4d4d4',
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  whiteSpace: 'pre-wrap',
                }}
              >
                {file.content}
              </pre>
            </Paper>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Actions Menu
// ---------------------------------------------------------------------------
const ActionsMenu = ({
  project,
  isPushedToAap,
  onPushToAap,
  onUpgrade,
  upgradeVersion,
}: {
  project: DemoProject;
  isPushedToAap: boolean;
  onPushToAap: () => void;
  onUpgrade?: () => void;
  upgradeVersion?: string;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isPushed = isPushedToAap;

  return (
    <>
      <IconButton size="small" onClick={e => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        getContentAnchorEl={null}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <CodeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit in Workspace" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            window.open(project.repo.url, '_blank');
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View source" />
        </MenuItem>
        <Divider />
        {onUpgrade && upgradeVersion && (
          <MenuItem onClick={() => { setAnchorEl(null); onUpgrade(); }}>
            <ListItemIcon>
              <SystemUpdateIcon fontSize="small" style={{ color: statusColors.info }} />
            </ListItemIcon>
            <ListItemText primary={`Upgrade to AAP ${upgradeVersion}`} />
          </MenuItem>
        )}
        {isPushed ? (
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View in AAP" />
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { setAnchorEl(null); onPushToAap(); }}>
            <ListItemIcon>
              <CloudUploadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Push to AAP" />
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <DeleteOutlineIcon
              fontSize="small"
              style={{ color: statusColors.error }}
            />
          </ListItemIcon>
          <ListItemText
            primary="Delete"
            primaryTypographyProps={{ style: { color: statusColors.error } }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const ProjectDetailsPage = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classes = useProjectDetailStyles();

  const urlTab = searchParams.get('tab');
  const urlScan = searchParams.get('scan');
  const [selectedTab, setSelectedTab] = useState(() => urlTab === 'quality' ? 1 : 0);
  const [qualityInitialView, setQualityInitialView] = useState<'latest-scan' | undefined>(undefined);
  const [initialScanId] = useState<string | null>(urlScan);
  const [pipelineRunId] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);
  const [workspaceSnackbar, setWorkspaceSnackbar] = useState(false);
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [showResult, setShowResult] = useState(false);
  const [isPushedToAap, setIsPushedToAap] = useState(() =>
    loadAapPushedRepos().has(projectName ?? ''),
  );
  const [pushSnackbar, setPushSnackbar] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [showUpgradeWizard, setShowUpgradeWizard] = useState(false);
  const [upgradeSnackbar, setUpgradeSnackbar] = useState(false);

  const handlePushToAap = useCallback(() => {
    setIsPushedToAap(true);
    const pushed = loadAapPushedRepos();
    pushed.add(projectName ?? '');
    saveAapPushedRepos(pushed);
    setPushSnackbar(true);
  }, [projectName]);

  const openPushModal = useCallback(() => {
    setShowPushModal(true);
  }, []);

  const project = useMemo(() => {
    const found = DEMO_PROJECTS.find(p => p.name === projectName);
    if (found) {
      setStarred(found.starred);
    }
    return found;
  }, [projectName]);

  const handleTabChange = useCallback((index: number, view?: 'latest-scan') => {
    setQualityInitialView(view);
    setSelectedTab(index);
  }, []);

  if (!project) {
    return (
      <Page themeId="app">
        <Header title="Project not found" />
        <Content>
          <Box style={{ padding: 24 }}>
            <Typography variant="h6" gutterBottom>
              Project &quot;{projectName}&quot; was not found.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/self-service/projects/catalog')}
              style={{ textTransform: 'none', marginTop: 16 }}
            >
              Back to Projects
            </Button>
          </Box>
        </Content>
      </Page>
    );
  }

  const quality = getProjectQuality(project.name);
  const upgradeData = getProjectUpgradeData(project.name);

  const handleCheck = (_remediate: boolean) => {
    setOpStatus('running');
    setTimeout(() => {
      if (quality?.proposals && quality.proposals.length > 0) {
        setOpStatus('awaiting_approval');
      } else {
        setShowResult(true);
        setOpStatus('complete');
      }
    }, 3000);
  };

  const handleApprove = (_ids: string[]) => {
    setOpStatus('running');
    setTimeout(() => {
      setShowResult(true);
      setOpStatus('complete');
    }, 2000);
  };

  const handleDismiss = () => {
    setOpStatus('idle');
    setShowResult(false);
  };

  return (
    <Page themeId="app">
      <Content>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          className={classes.breadcrumbs}
        >
          <RouterLink to="/self-service/projects">Projects</RouterLink>
          <Typography className={classes.breadcrumbCurrent}>
            {project.title}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box className={classes.headerRow}>
          <Box className={classes.titleRow}>
            <Typography className={classes.titleText}>
              {project.title}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setStarred(prev => !prev)}
            >
              {starred ? (
                <StarIcon style={{ color: statusColors.star }} />
              ) : (
                <StarBorderIcon />
              )}
            </IconButton>
          </Box>
          <Box className={classes.actionsRow}>
            {quality && (
              <Button
                variant="contained" color="primary" size="small"
                startIcon={opStatus === 'running' ? <AutorenewIcon style={{ animation: 'spin 1.5s linear infinite' }} /> : <PlayArrowIcon />}
                onClick={() => handleCheck(false)}
                disabled={opStatus === 'running'}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                {opStatus === 'running' ? 'Checking...' : 'Check'}
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CodeIcon />}
              size="small"
              style={{ textTransform: 'none', fontWeight: 500 }}
              onClick={() => setWorkspaceSnackbar(true)}
            >
              Edit in Workspace
            </Button>
            <ActionsMenu
              project={project}
              isPushedToAap={isPushedToAap}
              onPushToAap={openPushModal}
              onUpgrade={upgradeData ? () => setShowUpgradeWizard(true) : undefined}
              upgradeVersion={upgradeData?.latestVersion}
            />
          </Box>
        </Box>

        <Typography className={classes.subtitle}>
          Created from: {project.templateUsed}
          <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
          <GovernanceStatusBadge
            status={isPushedToAap ? 'pushed-to-aap' : 'governed'}
            variant="minimal"
            onAction={(action) => {
              if (action === 'push-to-aap') openPushModal();
            }}
          />
        </Typography>

        <Box className={classes.chipsRow}>
          {(() => {
            const q = quality;
            if (!q) return null;
            const hColor = q.healthScore >= 80 ? statusColors.success : q.healthScore >= 50 ? statusColors.warning : statusColors.error;
            return (
              <>
                <Chip
                  size="small"
                  label={`Health: ${q.healthScore}`}
                  variant="outlined"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: hColor,
                    borderColor: hColor,
                  }}
                  onClick={() => handleTabChange(1)}
                />
                {q.totalViolations > 0 ? (
                  <Chip
                    size="small"
                    label={`${q.totalViolations} violation${q.totalViolations !== 1 ? 's' : ''}`}
                    variant="outlined"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: statusColors.error,
                      borderColor: statusColors.error,
                    }}
                    onClick={() => handleTabChange(1, 'latest-scan')}
                  />
                ) : (
                  <Chip
                    size="small"
                    label="Clean"
                    variant="outlined"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: statusColors.success,
                      borderColor: statusColors.success,
                    }}
                  />
                )}
              </>
            );
          })()}
        </Box>

        {/* Inline alerts — PF6 bordered inline alert: neutral container, status-colored icon, high-contrast text */}
        {opStatus === 'running' && (
          <Box
            display="flex" alignItems="center"
            style={{
              gap: 8, padding: '10px 16px', marginTop: 8, borderRadius: 4, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)',
            }}
            onClick={() => handleTabChange(1)}
          >
            <AutorenewIcon style={{ fontSize: 18, color: statusColors.info, animation: 'spin 1.5s linear infinite' }} />
            <Typography style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
              Analyzing content...
            </Typography>
            <Button
              size="small" variant="text" color="primary"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ textTransform: 'none', fontSize: 12, fontWeight: 500, padding: '2px 8px', minWidth: 0 }}
            >
              View in Quality →
            </Button>
          </Box>
        )}
        {opStatus === 'awaiting_approval' && quality && quality.proposals.length > 0 && (
          <Box
            display="flex" alignItems="center"
            style={{
              gap: 8, padding: '10px 16px', marginTop: 8, borderRadius: 4, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)',
            }}
            onClick={() => handleTabChange(1)}
          >
            <WarningIcon style={{ fontSize: 18, color: statusColors.warning }} />
            <Typography style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
              {quality.proposals.length} remediation{quality.proposals.length !== 1 ? 's' : ''} awaiting approval
            </Typography>
            <Button
              size="small" variant="text" color="primary"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ textTransform: 'none', fontSize: 12, fontWeight: 500, padding: '2px 8px', minWidth: 0 }}
            >
              Review in Quality →
            </Button>
          </Box>
        )}
        {showResult && opStatus === 'complete' && quality && (
          <Box
            display="flex" alignItems="center"
            style={{
              gap: 8, padding: '10px 16px', marginTop: 8, borderRadius: 4, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)',
            }}
            onClick={() => { handleTabChange(1, 'latest-scan'); handleDismiss(); }}
          >
            <CheckCircleIcon style={{ fontSize: 18, color: statusColors.success }} />
            <Typography style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
              {quality.latestScan.scanType === 'remediate'
                ? `Remediation complete — ${quality.latestScan.remediatedCount} fixed`
                : `Check complete — ${quality.latestScan.totalViolations} violation${quality.latestScan.totalViolations !== 1 ? 's' : ''} found`}
            </Typography>
            {quality.latestScan.scanType === 'remediate' && quality.latestScan.remediatedCount > 0 && (
              <Button
                size="small" variant="text" color="primary"
                component="a" href="https://github.com/acme-corp/rhel-patching/pull/42" target="_blank" rel="noopener noreferrer"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                style={{ textTransform: 'none', fontSize: 12, fontWeight: 500, padding: '2px 8px', minWidth: 0 }}
              >
                View PR
              </Button>
            )}
            <Button
              size="small" variant="text" color="primary"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ textTransform: 'none', fontSize: 12, fontWeight: 500, padding: '2px 8px', minWidth: 0 }}
            >
              View details →
            </Button>
            <IconButton
              size="small"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDismiss(); }}
              style={{ padding: 2 }}
            >
              <CloseIcon style={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}

        {/* Recommended actions — PF6 bordered inline alerts, same container style, all buttons use primary */}
        {opStatus === 'idle' && quality && quality.totalViolations > 0 && quality.latestScan.fixable > 0 && (
          <Box
            display="flex" alignItems="center"
            style={{
              gap: 8, padding: '10px 16px', marginTop: 8, borderRadius: 4, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)',
            }}
            onClick={() => handleTabChange(1, 'latest-scan')}
          >
            <BuildIcon style={{ fontSize: 18, color: statusColors.warning }} />
            <Typography style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
              {quality.totalViolations} violation{quality.totalViolations !== 1 ? 's' : ''} found, {quality.latestScan.fixable} auto-fixable
            </Typography>
            <Button
              variant="outlined" color="primary" size="small"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleCheck(true); }}
              style={{ textTransform: 'none', fontWeight: 500, fontSize: 12, minWidth: 0, padding: '2px 12px' }}
            >
              Remediate
            </Button>
          </Box>
        )}
        {opStatus === 'idle' && upgradeData && (
          <Box
            display="flex" alignItems="center"
            style={{
              gap: 8, padding: '10px 16px', marginTop: 8, borderRadius: 4, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)',
            }}
            onClick={() => setShowUpgradeWizard(true)}
          >
            <SystemUpdateIcon style={{ fontSize: 18, color: statusColors.info }} />
            <Typography style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
              Content targets AAP {upgradeData.currentVersion} — AAP {upgradeData.latestVersion} is available
            </Typography>
            <Button
              variant="outlined" color="primary" size="small"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowUpgradeWizard(true); }}
              style={{ textTransform: 'none', fontWeight: 500, fontSize: 12, minWidth: 0, padding: '2px 12px' }}
            >
              Check compatibility
            </Button>
          </Box>
        )}

        {/* Tabs */}
        <HeaderTabs
          selectedIndex={selectedTab}
          onChange={handleTabChange}
          tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
        />

        {/* Tab content */}
        {selectedTab === 0 && (
          <OverviewTab
            project={project}
            isPushedToAap={isPushedToAap}
            onPushToAap={openPushModal}
            onGoToQuality={() => handleTabChange(1)}
          />
        )}
        {selectedTab === 1 && (
          <QualityTab
            quality={quality}
            projectName={project.name}
            initialView={qualityInitialView}
            initialScanId={initialScanId}
          />
        )}
        {selectedTab === 2 && <DependenciesTab quality={quality} />}
        {selectedTab === 3 && <ReadmeTab project={project} />}
        {selectedTab === 4 && <ProjectYamlTab project={project} />}
        {selectedTab === 5 && <PipelineTab project={project} initialRunId={pipelineRunId} />}
        {selectedTab === 6 && <AapActivityTab project={project} isPushedToAap={isPushedToAap} onPushToAap={openPushModal} />}
        {selectedTab === 7 && <ResourcesTab project={project} />}
      </Content>
      <Snackbar
        open={workspaceSnackbar}
        autoHideDuration={3000}
        onClose={() => setWorkspaceSnackbar(false)}
        message={`Opening workspace for ${project.title}...`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Snackbar
        open={pushSnackbar}
        autoHideDuration={4000}
        onClose={() => setPushSnackbar(false)}
        message={`Successfully connected ${project.title} to AAP. Project and job template created.`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <PushToAapModal
        open={showPushModal}
        project={project}
        onClose={() => setShowPushModal(false)}
        onComplete={() => {
          setShowPushModal(false);
          handlePushToAap();
        }}
      />
      {upgradeData && (
        <AapUpgradeWizard
          open={showUpgradeWizard}
          projectName={project.name}
          upgradeData={upgradeData}
          onClose={() => setShowUpgradeWizard(false)}
          onComplete={() => {
            setShowUpgradeWizard(false);
            setUpgradeSnackbar(true);
          }}
        />
      )}
      <Snackbar
        open={upgradeSnackbar}
        autoHideDuration={5000}
        onClose={() => setUpgradeSnackbar(false)}
        message={`AAP upgrade changes applied to ${project.title}. Pull request created.`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Page>
  );
};
