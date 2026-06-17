import { useState, useMemo, useCallback } from 'react';
import { DEVSPACES_BASE_URL, DEMO_CONNECTIONS } from '../../Admin/syncDemoData';
import { useUserRoleContext } from '../../../hooks/useUserRole';
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
  IconButton,
  Button,
  Card,
  CardContent,
  Divider,
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
  Tooltip,
  useTheme,
} from '@material-ui/core';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CodeIcon from '@material-ui/icons/Code';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import CloseIcon from '@material-ui/icons/Close';
import WarningIcon from '@material-ui/icons/Warning';
import {
  DEMO_PROJECTS,
  DemoProject,
} from '../catalog/projectsDemoData';
import { useProjectDetailStyles } from './styles';
import { statusColors } from '../../common/statusColors';
import { getProjectQuality } from './qualityDemoData';
import { QualityTab, QualityTabUnified } from './QualityTab';
import { DependenciesTab } from './DependenciesTab';
import VerifiedUserOutlinedIcon from '@material-ui/icons/VerifiedUserOutlined';
import Chip from '@material-ui/core/Chip';


const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'quality', label: 'Quality' },
  { id: 'ci-activity', label: 'CI Activity' },
  { id: 'dependencies', label: 'Dependencies' },
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

This project was created in the Ansible Portal to manage automation content with AAP integration.

## Getting Started

Check the **Overview** tab for project status. Use the **Resources** tab to explore discovered automation content.

## License

Apache-2.0`;

// ---------------------------------------------------------------------------
// Description (truncatable)
// ---------------------------------------------------------------------------
const DESC_CHAR_LIMIT = 120;

const DescriptionLine = ({ text }: { text: string }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > DESC_CHAR_LIMIT;

  return (
    <Typography style={{ fontSize: 14, color: theme.palette.text.secondary, marginTop: 4, lineHeight: 1.5 }}>
      {needsTruncation && !expanded ? (
        <>
          {text.slice(0, DESC_CHAR_LIMIT).trimEnd()}…{' '}
          <Button
            size="small" variant="text"
            onClick={() => setExpanded(true)}
            style={{ textTransform: 'none', fontSize: 12, padding: '0 4px', minWidth: 0, color: '#4DA3FF' }}
          >
            Read more
          </Button>
        </>
      ) : (
        <>
          {text}
          {needsTruncation && (
            <>
              {' '}
              <Button
                size="small" variant="text"
                onClick={() => setExpanded(false)}
                style={{ textTransform: 'none', fontSize: 12, padding: '0 4px', minWidth: 0, color: '#4DA3FF' }}
              >
                Show less
              </Button>
            </>
          )}
        </>
      )}
    </Typography>
  );
};

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------
const OverviewTab = ({
  project,
  isPushedToAap,
}: {
  project: DemoProject;
  isPushedToAap: boolean;
}) => {
  const classes = useProjectDetailStyles();
  const readme = PROJECT_README[project.name] || DEFAULT_PROJECT_README;

  return (
    <Box className={classes.tabContent}>
      <Box className={classes.mainColumn}>
        <Card className={classes.card} variant="outlined">
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle}>README.md</Typography>
            <Box style={{ fontSize: 14, lineHeight: 1.7 }}>
              <SimpleReadmeRenderer content={readme} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Sidebar */}
      <Box className={classes.sidebarColumn}>
        <AboutCard project={project} />
        <LinksCard project={project} isPushedToAap={isPushedToAap} />
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

const AboutCard = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();
  const theme = useTheme();
  const collections = project.resources.filter(r => r.type === 'collection-dep');
  const ees = project.resources.filter(r => r.type === 'execution-environment');

  return (
    <Card className={classes.card} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle}>About</Typography>
        <Box>
          <Typography className={classes.cardLabel}>Source</Typography>
          <Typography
            className={classes.cardValue}
            style={{ fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', color: '#4DA3FF' }}
            onClick={() => window.open(project.repo.url, '_blank')}
          >
            {project.repo.url.replace(/^https?:\/\//, '')}
          </Typography>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Default branch</Typography>
          <Typography className={classes.cardValue}>
            {project.repo.branch}
          </Typography>
        </Box>
        {(collections.length > 0 || ees.length > 0) && (
          <Box className={classes.cardSection}>
            <Typography className={classes.cardLabel}>Contains</Typography>
            {collections.length > 0 && (
              <Box style={{ marginBottom: ees.length > 0 ? 6 : 0 }}>
                <Typography className={classes.cardValue} style={{ fontSize: 12, marginBottom: 2 }}>
                  {collections.length} collection{collections.length !== 1 ? 's' : ''}
                </Typography>
                {collections.map(c => (
                  <Typography key={c.name} style={{ fontSize: 12, color: theme.palette.text.disabled, paddingLeft: 8 }}>
                    {c.name}
                  </Typography>
                ))}
              </Box>
            )}
            {ees.length > 0 && (
              <Box>
                <Typography className={classes.cardValue} style={{ fontSize: 12, marginBottom: 2 }}>
                  {ees.length} EE definition{ees.length !== 1 ? 's' : ''}
                </Typography>
                {ees.map(e => (
                  <Typography key={e.name} style={{ fontSize: 12, color: theme.palette.text.disabled, paddingLeft: 8 }}>
                    {e.name}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Owner</Typography>
          <Typography className={classes.cardValue}>
            {project.owner}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const LinksCard = ({ project, isPushedToAap }: { project: DemoProject; isPushedToAap: boolean }) => {
  const classes = useProjectDetailStyles();
  return (
    <Card className={classes.linksCard} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle}>Links</Typography>
        <Box
          className={classes.linkItem}
          onClick={() => window.open(project.repo.url, '_blank')}
        >
          <OpenInNewIcon className={classes.linkIcon} />
          <Box>
            <Typography className={classes.linkText}>View source</Typography>
            <Typography className={classes.linkDescription}>
              Browse the Git repository
            </Typography>
          </Box>
        </Box>
        {isPushedToAap && (
          <Box className={classes.linkItem}>
            <OpenInNewIcon className={classes.linkIcon} />
            <Box>
              <Typography className={classes.linkText}>View in AAP</Typography>
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



const devSpacesConnection = DEMO_CONNECTIONS.find(c => c.id === 'devspaces');
const isDevSpacesConfigured = devSpacesConnection?.status === 'Active';


// ---------------------------------------------------------------------------
// CI Activity Tab
// ---------------------------------------------------------------------------
type CIRunStatus = 'success' | 'failure' | 'in_progress' | 'cancelled';

type CIRun = {
  id: string;
  status: CIRunStatus;
  event: string;
  trigger: string;
  time: string;
  duration: string;
};

const DEMO_CI_RUNS: Record<string, CIRun[]> = {
  'rhel-patching': [
    { id: 'CI #849', status: 'failure', event: 'quality-scan', trigger: 'push', time: '2 hours ago', duration: '0m 38s' },
    { id: 'CI #848', status: 'success', event: 'ansible-lint', trigger: 'push', time: '2 hours ago', duration: '3m 12s' },
    { id: 'CI #847', status: 'failure', event: 'integration-test', trigger: 'push', time: '5 hours ago', duration: '7m 44s' },
    { id: 'CI #846', status: 'success', event: 'quality-scan', trigger: 'pull request', time: '1 day ago', duration: '0m 35s' },
    { id: 'CI #845', status: 'success', event: 'ansible-lint', trigger: 'pull request', time: '1 day ago', duration: '2m 58s' },
    { id: 'CI #844', status: 'success', event: 'integration-test', trigger: 'push', time: '1 day ago', duration: '8m 02s' },
    { id: 'CI #843', status: 'failure', event: 'quality-scan', trigger: 'schedule', time: '2 days ago', duration: '0m 41s' },
    { id: 'CI #842', status: 'success', event: 'ansible-lint', trigger: 'push', time: '2 days ago', duration: '3m 05s' },
    { id: 'CI #841', status: 'cancelled', event: 'integration-test', trigger: 'push', time: '3 days ago', duration: '1m 22s' },
  ],
  'network-firewall-rules': [
    { id: 'CI #56', status: 'failure', event: 'quality-scan', trigger: 'push', time: '1 day ago', duration: '0m 42s' },
    { id: 'CI #55', status: 'success', event: 'ansible-lint', trigger: 'push', time: '1 day ago', duration: '1m 22s' },
    { id: 'CI #54', status: 'failure', event: 'quality-scan', trigger: 'schedule', time: '3 days ago', duration: '0m 39s' },
  ],
  'cloud-provisioner': [
    { id: 'CI #104', status: 'success', event: 'quality-scan', trigger: 'push', time: '4 hours ago', duration: '0m 22s' },
    { id: 'CI #103', status: 'success', event: 'ansible-lint', trigger: 'push', time: '4 hours ago', duration: '1m 48s' },
    { id: 'CI #102', status: 'success', event: 'integration-test', trigger: 'push', time: '1 day ago', duration: '6m 15s' },
  ],
  'backup-automation': [
    { id: 'CI #21', status: 'failure', event: 'quality-scan', trigger: 'schedule', time: '3 days ago', duration: '1m 15s' },
    { id: 'CI #20', status: 'failure', event: 'ansible-lint', trigger: 'push', time: '4 days ago', duration: '1m 02s' },
  ],
  'web-app-scaling-suite': [
    { id: 'CI #312', status: 'success', event: 'ansible-lint', trigger: 'push', time: '1 day ago', duration: '2m 45s' },
    { id: 'CI #311', status: 'success', event: 'molecule-test', trigger: 'push', time: '3 days ago', duration: '12m 30s' },
    { id: 'CI #310', status: 'success', event: 'ansible-lint', trigger: 'pull request', time: '4 days ago', duration: '2m 51s' },
  ],
};

const CIActivityTab = ({ project }: { project: DemoProject }) => {
  const theme = useTheme();
  const classes = useProjectDetailStyles();
  const runs = DEMO_CI_RUNS[project.name] || [];

  const statusIcon = (status: CIRunStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon style={{ fontSize: 18, color: statusColors.success }} />;
      case 'failure':
        return <ErrorIcon style={{ fontSize: 18, color: statusColors.error }} />;
      case 'in_progress':
        return <AutorenewIcon style={{ fontSize: 18, color: statusColors.info }} className={classes.spinIcon} />;
      case 'cancelled':
        return <RadioButtonUncheckedIcon style={{ fontSize: 18, color: statusColors.pending }} />;
    }
  };

  const statusText = (status: CIRunStatus) => {
    switch (status) {
      case 'success': return 'Success';
      case 'failure': return 'Failure';
      case 'in_progress': return 'In Progress';
      case 'cancelled': return 'Cancelled';
    }
  };

  if (runs.length === 0) {
    return (
      <Box style={{ marginTop: 24 }}>
        <Card className={classes.card} variant="outlined">
          <CardContent className={classes.cardContent} style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              No CI activity yet
            </Typography>
            <Typography style={{ fontSize: 13, color: theme.palette.text.secondary, maxWidth: 400, margin: '0 auto' }}>
              CI activity from GitHub Actions or GitLab pipelines will appear here after workflow runs.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const EVENT_LABELS: Record<string, string> = {
    'quality-scan': 'Quality Scan',
    'ansible-lint': 'Ansible Lint',
    'integration-test': 'Integration Tests',
    'molecule-test': 'Molecule Tests',
  };

  const ciColumns: TableColumn<CIRun>[] = [
    {
      title: 'Status',
      field: 'status',
      width: '120px',
      render: (row: CIRun) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          {statusIcon(row.status)}
          <Typography variant="body2">{statusText(row.status)}</Typography>
        </Box>
      ),
    },
    { title: 'Run', field: 'id' },
    {
      title: 'Workflow',
      field: 'event',
      render: (row: CIRun) => (
        <Box display="flex" alignItems="center" style={{ gap: 5 }}>
          {row.event === 'quality-scan' && (
            <VerifiedUserOutlinedIcon style={{ fontSize: 14, color: row.status === 'failure' ? statusColors.error : statusColors.success }} />
          )}
          <Typography variant="body2">{EVENT_LABELS[row.event] ?? row.event}</Typography>
        </Box>
      ),
    },
    {
      title: 'Trigger',
      field: 'trigger',
      render: (row: CIRun) => (
        <Chip size="small" label={row.trigger} variant="outlined" style={{ fontSize: 10, height: 18, fontWeight: 500 }} />
      ),
    },
    { title: 'Duration', field: 'duration' },
    { title: 'Time', field: 'time' },
  ];

  return (
    <Box style={{ marginTop: 24 }}>
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <Table<CIRun>
            columns={ciColumns}
            data={runs}
            title={`CI Activity (${runs.length})`}
            options={{
              paging: false,
              search: false,
              sorting: false,
              padding: 'dense',
              header: true,
            }}
            style={{ boxShadow: 'none' }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// README Renderer (used in Overview tab)
// ---------------------------------------------------------------------------
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
// Actions Menu
// ---------------------------------------------------------------------------
const ActionsMenu = ({
  project,
  isPushedToAap,
  onPushToAap,
}: {
  project: DemoProject;
  isPushedToAap: boolean;
  onPushToAap: () => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { hasRole } = useUserRoleContext();
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { hasRole: pageHasRole } = useUserRoleContext();

  const urlTab = searchParams.get('tab');
  const urlScan = searchParams.get('scan');
  const urlSeverity = searchParams.get('severity') as import('./qualityDemoData').SeverityClass | null;
  const urlRule = searchParams.get('rule');
  const urlCategory = searchParams.get('category') as import('./qualityDemoData').ViolationCategory | null;
  const [selectedTab, setSelectedTab] = useState(() => urlTab === 'quality' ? 1 : 0);
  const [qualityInitialView, setQualityInitialView] = useState<'latest-scan' | undefined>(undefined);
  const [initialScanId] = useState<string | null>(urlScan);
  const [starred, setStarred] = useState(false);
  const [isPushedToAap, setIsPushedToAap] = useState(() =>
    loadAapPushedRepos().has(projectName ?? ''),
  );
  const [pushSnackbar, setPushSnackbar] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [devSpacesSnackbar, setDevSpacesSnackbar] = useState(false);

  const openInDevSpaces = useCallback((targetUrl: string) => {
    window.open(targetUrl, '_blank');
    setDevSpacesSnackbar(true);
  }, []);

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
              onClick={() => navigate('/self-service/repositories/list')}
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
  const compatCount = quality?.violations.filter(v => v.category === 'aap-compatibility').length ?? 0;

  return (
    <Page themeId="app">
      <Content>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          className={classes.breadcrumbs}
        >
          <RouterLink to="/self-service/repositories">Git Repositories</RouterLink>
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
            <Button
              variant="outlined" size="small"
              startIcon={<OpenInNewIcon style={{ fontSize: 16 }} />}
              onClick={() => window.open(project.repo.url, '_blank')}
              style={{ textTransform: 'none', fontWeight: 500 }}
            >
              View source
            </Button>
            {isDevSpacesConfigured && pageHasRole('developer') && (
              <Button
                variant="outlined" size="small"
                startIcon={<CodeIcon style={{ fontSize: 16 }} />}
                onClick={() => openInDevSpaces(`${DEVSPACES_BASE_URL}/#${project.repo.url}/tree/${project.repo.branch}`)}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                Edit in Dev Spaces
              </Button>
            )}
            {!isDevSpacesConfigured && pageHasRole('developer') && (
              <Tooltip title="Edit in Dev Spaces is available when your administrator connects a Dev Spaces instance." arrow>
                <span>
                  <Button
                    variant="outlined" size="small" disabled
                    startIcon={<CodeIcon style={{ fontSize: 16 }} />}
                    style={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Edit in Dev Spaces
                  </Button>
                </span>
              </Tooltip>
            )}
            <ActionsMenu
              project={project}
              isPushedToAap={isPushedToAap}
              onPushToAap={openPushModal}
            />
          </Box>
        </Box>

        {/* Description */}
        {project.description && (
          <DescriptionLine text={project.description} />
        )}

        {/* Status signal — single compact line */}
        {quality && quality.totalViolations > 0 && (
          <Typography
            style={{ fontSize: 13, color: theme.palette.text.disabled, marginTop: 4, cursor: 'pointer' }}
            onClick={() => handleTabChange(1, 'latest-scan')}
          >
            <span style={{ color: statusColors.error, fontWeight: 500 }}>
              {quality.totalViolations} violation{quality.totalViolations !== 1 ? 's' : ''}
            </span>
            {' · '}
            {quality.latestScan.fixable} auto-fixable
            {' · '}
            Last checked {quality.lastScannedAt}
            {quality.remediationStatus === 'in-progress' && (
              <span style={{ marginLeft: 8, color: statusColors.info, fontWeight: 500 }}>
                ⟳ Generating fix suggestions…
              </span>
            )}
            {quality.remediationStatus === 'proposals-ready' && (
              <span style={{ marginLeft: 8, color: isDark ? '#c4b5e3' : '#6753ac', fontWeight: 500 }}>
                ✦ Suggestions ready for review
              </span>
            )}
            {quality.remediationStatus === 'pr-open' && quality.remediationSummary && (
              <span style={{ marginLeft: 8, color: isDark ? '#58a6ff' : '#0969da', fontWeight: 500 }}>
                ↗ PR open — {quality.remediationSummary.addressed} changes ready
              </span>
            )}
            {quality.remediationStatus === 'pr-merged' && quality.remediationSummary && (
              <span style={{ marginLeft: 8, color: statusColors.success, fontWeight: 500 }}>
                ✓ PR merged — {quality.remediationSummary.addressed} resolved
              </span>
            )}
          </Typography>
        )}
        {quality && quality.totalViolations === 0 && (
          <Typography style={{ fontSize: 13, color: theme.palette.text.disabled, marginTop: 4 }}>
            <span style={{ color: statusColors.success, fontWeight: 500 }}>All checks passing</span>
            {' · '}
            Last checked {quality.lastScannedAt}
          </Typography>
        )}

        {/* Version update banner */}
        {compatCount > 0 && (
          <Box
            display="flex" alignItems="center" justifyContent="space-between"
            style={{
              marginTop: 12,
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${isDark ? 'rgba(251,191,36,0.25)' : '#fde68a'}`,
              background: isDark ? 'rgba(251,191,36,0.06)' : '#fffbeb',
              cursor: 'pointer',
            }}
            onClick={() => { window.location.href = `/self-service/repositories/${project.name}?tab=quality&category=aap-compatibility`; }}
          >
            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
              <WarningIcon style={{ fontSize: 18, color: isDark ? '#fbbf24' : '#b45309' }} />
              <Typography style={{ fontSize: 13, color: isDark ? '#fde68a' : '#78350f', fontWeight: 500 }}>
                Version update pending — AAP 2.7 · {compatCount} issue{compatCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Button
              size="small" variant="text"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                window.location.href = `/self-service/repositories/${project.name}?tab=quality&category=aap-compatibility`;
              }}
              style={{
                textTransform: 'none', fontSize: 12, fontWeight: 500,
                color: isDark ? '#fbbf24' : '#92400e',
                padding: '2px 8px', minWidth: 0,
              }}
            >
              Review in Quality tab →
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
          <OverviewTab project={project} isPushedToAap={isPushedToAap} />
        )}
        {selectedTab === 1 && (
            <QualityTabUnified
              quality={quality}
              projectName={project.name}
              initialView={qualityInitialView}
              initialScanId={initialScanId}
              initialSeverity={urlSeverity}
              initialRuleFilter={urlRule}
              initialCategoryFilter={urlCategory}
              repoUrl={project.repo.url}
              branch={project.repo.branch}
            />
        )}
        {selectedTab === 2 && <CIActivityTab project={project} />}
        {selectedTab === 3 && <DependenciesTab quality={quality} />}
      </Content>
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
      <Snackbar
        open={devSpacesSnackbar}
        autoHideDuration={3000}
        onClose={() => setDevSpacesSnackbar(false)}
        message="Opening Dev Spaces workspace… This may take a moment if the workspace is starting."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Page>
  );
};
