import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
import ErrorIcon from '@material-ui/icons/Error';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import GitHubIcon from '@material-ui/icons/GitHub';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import MemoryIcon from '@material-ui/icons/Memory';
import CategoryIcon from '@material-ui/icons/Category';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import {
  DEMO_PROJECTS,
  DemoProject,
  PipelineStage,
  JobRunEntry,
  PipelineRun,
} from '../catalog/projectsDemoData';
import { useProjectDetailStyles } from './styles';
import { statusColors } from '../../common/statusColors';

const tabs = [
  { id: 'overview', label: 'Overview' },
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
  const color = colorMap[status] || '#bdbdbd';

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

type MaturityStep = {
  label: string;
  done: boolean;
  na?: boolean;
  hint: string;
};

const getMaturitySteps = (project: DemoProject): MaturityStep[] => {
  const allPassed = project.pipeline.every(s => s.status === 'passed');
  const lintPassed =
    project.pipeline.find(s => s.name === 'Lint')?.status === 'passed';
  const policyPassed =
    project.pipeline.find(s => s.name === 'Policy Check')?.status === 'passed';
  const eePassed =
    project.pipeline.find(s => s.name === 'EE Compatibility')?.status ===
    'passed';
  const integrationPassed =
    project.pipeline.find(s => s.name === 'Integration Test')?.status ===
    'passed';
  const pushedToAap =
    project.aap.project === 'pushed' &&
    project.aap.jobTemplate === 'pushed';
  const hasJobRuns =
    project.lastJobRun.status === 'success' ||
    project.lastJobRun.status === 'running';

  return [
    { label: 'Created', done: true, hint: 'Project was created successfully.' },
    { label: 'Linted', done: !!lintPassed, hint: lintPassed ? 'Lint check passed.' : 'Push a commit to trigger the lint pipeline stage.' },
    { label: 'Policy compliant', done: !!policyPassed, hint: policyPassed ? 'Policy check passed.' : 'Fix any policy violations flagged in the Pipeline tab.' },
    { label: 'EE verified', done: !!eePassed, hint: eePassed ? 'EE compatibility verified.' : 'Ensure your content runs in the target Execution Environment.' },
    {
      label: 'Integration tested',
      done: !!(integrationPassed || project.pipelineType === 'standard'),
      na: project.pipelineType === 'standard',
      hint: project.pipelineType === 'standard' ? 'Not applicable for standard pipeline.' : integrationPassed ? 'Integration tests passed.' : 'Add integration tests to complete this step.',
    },
    { label: 'Pushed to AAP', done: !!(pushedToAap && allPassed), hint: pushedToAap ? 'Project and job template pushed to AAP.' : 'Pass all pipeline stages, then push to AAP from the AAP Activity tab.' },
    { label: 'In production', done: !!(hasJobRuns && pushedToAap), hint: hasJobRuns && pushedToAap ? 'Running in production.' : 'Launch a job from AAP to complete this step.' },
  ];
};

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------
const OverviewTab = ({
  project,
  onViewLatestRun,
}: {
  project: DemoProject;
  onViewLatestRun: () => void;
}) => {
  const classes = useProjectDetailStyles();

  const overallStatus = project.pipeline.some(s => s.status === 'failed')
    ? 'failed'
    : project.pipeline.some(s => s.status === 'running')
      ? 'running'
      : project.pipeline.every(s => s.status === 'passed')
        ? 'passed'
        : 'pending';

  const latestRun = project.pipelineHistory[0];

  return (
    <Box className={classes.tabContent}>
      <Box className={classes.mainColumn}>
        {/* Latest pipeline run — summary */}
        <Card
          className={classes.card}
          variant="outlined"
          style={{ cursor: 'pointer' }}
          onClick={onViewLatestRun}
        >
          <CardContent className={classes.cardContent}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Typography className={classes.cardTitle} style={{ marginBottom: 0 }}>
                Latest pipeline run
              </Typography>
              <Chip
                size="small"
                label={statusLabel(overallStatus)}
                style={{
                  backgroundColor: `${statusColor(overallStatus)}20`,
                  color: statusColor(overallStatus),
                  fontWeight: 500,
                }}
              />
            </Box>
            {latestRun && (
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: 12 }}>
                Run #{latestRun.id} · triggered by{' '}
                <code style={{ fontSize: 12 }}>
                  {latestRun.trigger.substring(0, 7)}
                </code>
                {' · '}{latestRun.startedAt}
                {latestRun.duration !== '—' && ` · ${latestRun.duration}`}
              </Typography>
            )}
            <Box display="flex" alignItems="center" style={{ gap: 2 }}>
              {project.pipeline.map(stage => (
                <Tooltip key={stage.name} title={`${stage.name}: ${statusLabel(stage.status)}`} arrow>
                  <Box
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: statusColor(stage.status),
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
            <Box display="flex" alignItems="center" style={{ gap: 12, marginTop: 12 }}>
              {project.pipeline.map(stage => (
                <Box key={stage.name} display="flex" alignItems="center" style={{ gap: 4 }}>
                  <StageIcon status={stage.status} size={14} />
                  <Typography variant="caption" color="textSecondary">
                    {stage.name}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography
              variant="body2"
              color="primary"
              style={{ marginTop: 12, fontSize: 13, fontWeight: 500 }}
            >
              View run details →
            </Typography>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className={classes.card} variant="outlined">
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle}>
              Recent activity
            </Typography>
            {project.repo.lastCommit && (
              <Box className={classes.activityItem}>
                <GitHubIcon
                  style={{ fontSize: 18, color: '#666', marginTop: 2 }}
                />
                <Typography className={classes.activityText}>
                  <strong>{project.repo.lastCommit.author}</strong> pushed
                  commit{' '}
                  <code style={{ fontSize: 12 }}>
                    {project.repo.lastCommit.hash.substring(0, 7)}
                  </code>{' '}
                  — {project.repo.lastCommit.message}
                </Typography>
                <Typography className={classes.activityTime}>
                  {project.repo.lastCommit.timestamp}
                </Typography>
              </Box>
            )}
            {project.pipelineHistory.length > 0 && (
              <Box className={classes.activityItem}>
                <PlayArrowIcon
                  style={{ fontSize: 18, color: '#666', marginTop: 2 }}
                />
                <Typography className={classes.activityText}>
                  Pipeline run #{project.pipelineHistory[0].id}{' '}
                  <strong>
                    {project.pipelineHistory[0].status === 'running'
                      ? 'is running'
                      : project.pipelineHistory[0].status}
                  </strong>{' '}
                  — triggered by{' '}
                  <code style={{ fontSize: 12 }}>
                    {project.pipelineHistory[0].trigger.substring(0, 7)}
                  </code>
                </Typography>
                <Typography className={classes.activityTime}>
                  {project.pipelineHistory[0].startedAt}
                </Typography>
              </Box>
            )}
            {project.jobHistory.length > 0 && (
              <Box className={classes.activityItem}>
                <CloudUploadIcon
                  style={{ fontSize: 18, color: '#666', marginTop: 2 }}
                />
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
        <MaturityCard project={project} />
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
const MaturityCard = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();
  const steps = getMaturitySteps(project);
  const completed = steps.filter(s => s.done).length;
  const total = steps.filter(s => !s.na).length;
  const pct = Math.round((completed / total) * 100);
  const nextStep = steps.find(s => !s.done && !s.na);

  return (
    <Card className={classes.card} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Typography className={classes.cardTitle} style={{ marginBottom: 0 }}>
            Project maturity
          </Typography>
          <Typography variant="caption" style={{ color: statusColors.success, fontWeight: 600 }}>
            {pct}%
          </Typography>
        </Box>
        <Box
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: '#e0e0e0',
            marginBottom: 12,
          }}
        >
          <Box
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 2,
              backgroundColor: statusColors.success,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
        {steps.map(step => (
          <Tooltip key={step.label} title={step.hint} arrow placement="left">
            <Box
              display="flex"
              alignItems="center"
              style={{
                gap: 8,
                padding: '5px 0',
                cursor: 'default',
              }}
            >
              {step.na ? (
                <RemoveCircleOutlineIcon style={{ fontSize: 18, color: statusColors.pending }} />
              ) : step.done ? (
                <CheckCircleIcon style={{ fontSize: 18, color: statusColors.success }} />
              ) : (
                <RadioButtonUncheckedIcon style={{ fontSize: 18, color: statusColors.pending }} />
              )}
              <Typography
                variant="body2"
                style={{
                  color: step.done ? 'inherit' : '#888',
                  textDecoration: step.na ? 'line-through' : 'none',
                  fontSize: 13,
                }}
              >
                {step.label}
              </Typography>
            </Box>
          </Tooltip>
        ))}
        {nextStep && pct < 100 && (
          <Box
            style={{
              marginTop: 10,
              padding: '8px 10px',
              backgroundColor: 'rgba(43, 154, 243, 0.08)',
              borderRadius: 6,
              borderLeft: `3px solid ${statusColors.info}`,
            }}
          >
            <Typography variant="caption" style={{ fontWeight: 600, fontSize: 11, color: statusColors.info, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Next step
            </Typography>
            <Typography variant="body2" style={{ fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>
              {nextStep.hint}
            </Typography>
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
          <Typography className={classes.cardLabel}>Pipeline type</Typography>
          <Chip
            size="small"
            label={
              project.pipelineType === 'comprehensive'
                ? 'Comprehensive'
                : 'Standard'
            }
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

const STAGE_NAMES_COMPREHENSIVE = [
  'Commit',
  'Lint',
  'Policy Check',
  'EE Compatibility',
  'Integration Test',
  'Pushed to AAP',
];
const STAGE_NAMES_STANDARD = [
  'Commit',
  'Lint',
  'Policy Check',
  'EE Compatibility',
  'Pushed to AAP',
];

const STAGE_DESCS: Record<string, string> = {
  Commit: 'Detects and validates the latest code change pushed to the repository.',
  Lint: 'Checks playbook structure, YAML syntax, and best practices using ansible-lint.',
  'Policy Check': 'Validates content against organizational governance policies and security standards.',
  'EE Compatibility': 'Verifies that the automation content runs correctly inside the target Execution Environment.',
  'Integration Test': 'Runs end-to-end tests against a sandboxed environment to catch regressions.',
  'Pushed to AAP': 'Syncs the validated content to Ansible Automation Platform for deployment.',
};

const buildStagesForRun = (
  run: PipelineRun,
  project: DemoProject,
): PipelineStage[] => {
  const isLatest = project.pipelineHistory[0]?.id === run.id;
  if (isLatest) return project.pipeline;

  const names =
    project.pipelineType === 'comprehensive'
      ? STAGE_NAMES_COMPREHENSIVE
      : STAGE_NAMES_STANDARD;

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
              label={
                project.pipelineType === 'comprehensive'
                  ? 'Comprehensive'
                  : 'Standard'
              }
              variant="outlined"
              style={{ fontSize: 12, height: 24 }}
            />
          </Box>

          <Box
            display="flex"
            alignItems="center"
            style={{ gap: 16, marginBottom: 16 }}
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

          {stages.map((stage, i) => (
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

  const columns: TableColumn<PipelineRun>[] = [
    {
      title: 'Run',
      field: 'id',
      render: (row: PipelineRun) => (
        <Typography
          variant="body2"
          style={{ fontWeight: 500, color: '#1976d2' }}
        >
          #{row.id}
        </Typography>
      ),
    },
    {
      title: 'Trigger',
      field: 'trigger',
      render: (row: PipelineRun) => (
        <code style={{ fontSize: 12 }}>{row.trigger.substring(0, 7)}</code>
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
          <Box display="flex" alignItems="center" style={{ gap: 2 }}>
            {stages.map(s => (
              <Tooltip key={s.name} title={`${s.name}: ${statusLabel(s.status)}`} arrow>
                <Box
                  style={{
                    width: 16,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: statusColor(s.status),
                  }}
                />
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
              label={
                project.pipelineType === 'comprehensive'
                  ? 'Comprehensive Pipeline'
                  : 'Standard Pipeline'
              }
              variant="outlined"
              style={{ fontSize: 12, height: 24 }}
            />
          </Box>
          <Table<PipelineRun>
            columns={columns}
            data={project.pipelineHistory}
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
const AapActivityTab = ({ project }: { project: DemoProject }) => {
  const classes = useProjectDetailStyles();
  const isPushed =
    project.aap.project === 'pushed' &&
    project.aap.jobTemplate === 'pushed';

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
                <AapStatusIcon status={project.aap.project} />
                <Typography className={classes.summaryValue}>
                  {aapStatusText(project.aap.project)}
                </Typography>
              </Box>
            </Paper>
            <Paper className={classes.summaryCard} variant="outlined">
              <Typography className={classes.summaryLabel}>
                Job Template
              </Typography>
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <AapStatusIcon status={project.aap.jobTemplate} />
                <Typography className={classes.summaryValue}>
                  {aapStatusText(project.aap.jobTemplate)}
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
const ActionsMenu = ({ project }: { project: DemoProject }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isPushed =
    project.aap.project === 'pushed' &&
    project.aap.jobTemplate === 'pushed';

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
        {isPushed ? (
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View in AAP" />
          </MenuItem>
        ) : (
          <MenuItem onClick={() => setAnchorEl(null)}>
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
  const classes = useProjectDetailStyles();
  const [selectedTab, setSelectedTab] = useState(0);
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);
  const [workspaceSnackbar, setWorkspaceSnackbar] = useState(false);

  const project = useMemo(() => {
    const found = DEMO_PROJECTS.find(p => p.name === projectName);
    if (found) {
      setStarred(found.starred);
    }
    return found;
  }, [projectName]);

  const handleTabChange = useCallback((index: number) => {
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

  const overallPipelineStatus = project.pipeline.some(
    s => s.status === 'failed',
  )
    ? 'failed'
    : project.pipeline.some(s => s.status === 'running')
      ? 'running'
      : project.pipeline.every(s => s.status === 'passed')
        ? 'passed'
        : 'pending';

  const isPushed =
    project.aap.project === 'pushed' &&
    project.aap.jobTemplate === 'pushed';

  return (
    <Page themeId="app">
      <Content>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          className={classes.breadcrumbs}
        >
          <RouterLink to="/self-service/projects/catalog">Projects</RouterLink>
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
              variant="outlined"
              color="primary"
              startIcon={<CodeIcon />}
              size="small"
              style={{ textTransform: 'none', fontWeight: 500 }}
              onClick={() => setWorkspaceSnackbar(true)}
            >
              Edit in Workspace
            </Button>
            <ActionsMenu project={project} />
          </Box>
        </Box>

        <Typography className={classes.subtitle}>
          Created from: {project.templateUsed}
        </Typography>

        <Box className={classes.chipsRow}>
          <Chip
            size="small"
            label={
              project.pipelineType === 'comprehensive'
                ? 'Comprehensive Pipeline'
                : 'Standard Pipeline'
            }
            variant="outlined"
            style={{ fontSize: 12 }}
          />
          <Chip
            size="small"
            label={`Pipeline: ${statusLabel(overallPipelineStatus)}`}
            style={{
              backgroundColor: `${statusColor(overallPipelineStatus)}20`,
              color: statusColor(overallPipelineStatus),
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          {isPushed && (
            <Chip
              size="small"
              label="Pushed to AAP"
              style={{
                backgroundColor: `${statusColors.success}20`,
                color: statusColors.success,
                fontSize: 12,
                fontWeight: 500,
              }}
            />
          )}
        </Box>

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
            onViewLatestRun={() => {
              const latestId = project.pipelineHistory[0]?.id ?? null;
              setPipelineRunId(latestId);
              setSelectedTab(3);
            }}
          />
        )}
        {selectedTab === 1 && <ReadmeTab project={project} />}
        {selectedTab === 2 && <ProjectYamlTab project={project} />}
        {selectedTab === 3 && <PipelineTab project={project} initialRunId={pipelineRunId} />}
        {selectedTab === 4 && <AapActivityTab project={project} />}
        {selectedTab === 5 && <ResourcesTab project={project} />}
      </Content>
      <Snackbar
        open={workspaceSnackbar}
        autoHideDuration={3000}
        onClose={() => setWorkspaceSnackbar(false)}
        message={`Opening workspace for ${project.title}...`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Page>
  );
};
