import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  Page,
  Header,
  Content,
  MarkdownContent,
} from '@backstage/core-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import {
  useTaskEventStream,
  scaffolderApiRef,
} from '@backstage/plugin-scaffolder-react';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { TaskSteps } from '@backstage/plugin-scaffolder-react/alpha';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  taskCancelPermission,
  taskCreatePermission,
  taskReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import {
  Button,
  CircularProgress,
  Link,
  makeStyles,
  Typography,
  Box,
  IconButton,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  useTheme,
} from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';
import ArrowBack from '@material-ui/icons/ArrowBack';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import BlockIcon from '@material-ui/icons/Block';
import LoopIcon from '@material-ui/icons/Loop';
import { rootRouteRef, selectedTemplateRouteRef } from '../../routes';
import { useUserRole } from '../../hooks/useUserRole';
import { createTarArchive } from '../utils/tarArchiveUtils';
import {
  resolveEeFileNameFromParameters,
  resolvePublishToScmFromParameters,
} from './runTaskParameters';
import { WorkflowJobTaskSection } from './WorkflowJobTaskSection';
import { JobTaskSection } from './JobTaskSection';
import { WorkflowGraph } from './WorkflowGraph';
import type { AapLogEntry } from './buildWorkflowLayers';

const typeLabels: Record<string, string> = {
  'workflow-job-template': 'Workflow template',
  service: 'Job template',
  project: 'Project',
  'execution-environment': 'Execution environment',
};

function getTypeLabel(type?: string): string {
  if (!type) return 'Template';
  return typeLabels[type] || 'Template';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'processing':
      return 'Running';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Running';
  }
}

function StatusIcon({ status }: { status: string }) {
  const size = 18;
  switch (status) {
    case 'completed':
      return <CheckCircleOutlineIcon style={{ fontSize: size, color: '#4caf50' }} />;
    case 'failed':
      return <ErrorOutlineIcon style={{ fontSize: size, color: '#f44336' }} />;
    case 'cancelled':
      return <BlockIcon style={{ fontSize: size, color: '#ff9800' }} />;
    default:
      return <LoopIcon style={{ fontSize: size, color: '#42a5f5' }} />;
  }
}

function shortId(id: string): string {
  return id.length > 8 ? id.substring(0, 8) : id;
}

const useStyles = makeStyles(theme => {
  const textColor =
    theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff';
  return {
    headerRow: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
    },
    headerLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      minWidth: 0,
      flex: 1,
    },
    breadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      color: textColor,
      opacity: 0.7,
      fontSize: '0.875rem',
    },
    breadcrumbLink: {
      color: textColor,
      cursor: 'pointer',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    titleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      flexWrap: 'wrap',
    },
    pageTitle: {
      color: textColor,
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    metaLine: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      flexWrap: 'wrap',
      color: textColor,
      opacity: 0.7,
      fontSize: '0.875rem',
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      flexShrink: 0,
    },
  };
});

const DEMO_TASKS: Record<string, {
  templateName: string;
  templateTitle: string;
  templateType: string;
  status: string;
  steps: Array<{ id: string; name: string; status: string }>;
  stepLogs: Record<string, string[]>;
  outputText?: Array<{ title?: string; content: string }>;
  outputLinks?: Array<{ title: string; url?: string; entityRef?: string }>;
  readme?: string;
}> = {
  'demo-ee-success': {
    templateName: 'build-ee-rhel9',
    templateTitle: 'Build Execution Environment (RHEL 9)',
    templateType: 'execution-environment',
    status: 'completed',
    steps: [
      { id: 'validate-input', name: 'Validate input parameters', status: 'completed' },
      { id: 'create-ee-definition', name: 'Create EE definition', status: 'completed' },
      { id: 'register-catalog', name: 'Register in catalog', status: 'completed' },
    ],
    stepLogs: {
      'validate-input': [
        'Validating execution environment parameters...',
        'Base image: registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest',
        'Python version: 3.11',
        'All parameters valid.',
      ],
      'create-ee-definition': [
        'Generating execution-environment.yml definition...',
        'Adding collections: ansible.netcommon, ansible.utils, cisco.ios',
        'Adding Python dependencies: netaddr, paramiko',
        'EE definition created successfully.',
      ],
      'register-catalog': [
        'Registering EE component in Backstage catalog...',
        'Entity ref: Component:default/build-ee-rhel9',
        'Registration complete.',
      ],
    },
    outputText: [
      {
        title: 'Execution environment created',
        content: 'Your execution environment definition has been created and registered in the catalog. You can download the files to build locally, or push to a container registry.',
      },
    ],
    outputLinks: [
      { title: 'View in catalog', entityRef: 'Component:default/build-ee-rhel9' },
      { title: 'View on Automation Hub', url: 'https://aap.example.com/hub/ee/build-ee-rhel9' },
    ],
    readme: `# Build Execution Environment (RHEL 9)

## Overview

This execution environment is built on \`ee-minimal-rhel9:latest\` and includes collections and Python dependencies for network automation workflows.

## Included Collections

| Collection | Version |
|---|---|
| ansible.netcommon | latest |
| ansible.utils | latest |
| cisco.ios | latest |

## Python Dependencies

- \`netaddr\` — IP address manipulation
- \`paramiko\` — SSH connectivity

## Building Locally

\`\`\`bash
ansible-builder build -f execution-environment.yml -t my-ee:latest
\`\`\`

## Usage

Reference this EE in your \`ansible-navigator.yml\`:

\`\`\`yaml
ansible-navigator:
  execution-environment:
    image: my-ee:latest
    pull:
      policy: missing
\`\`\`

## Files Included

- \`execution-environment.yml\` — EE definition
- \`ansible.cfg\` — Ansible configuration
- \`requirements.yml\` — Collection requirements
- \`requirements.txt\` — Python requirements
`,
  },
  'demo-project-success': {
    templateName: 'create-ansible-project',
    templateTitle: 'Create Ansible Project',
    templateType: 'project',
    status: 'completed',
    steps: [
      { id: 'fetch-template', name: 'Fetch project template', status: 'completed' },
      { id: 'generate-files', name: 'Generate project files', status: 'completed' },
      { id: 'publish-git', name: 'Publish to Git repository', status: 'completed' },
      { id: 'register-catalog', name: 'Register in catalog', status: 'completed' },
    ],
    stepLogs: {
      'fetch-template': [
        'Fetching project skeleton from template...',
        'Template: ansible-project-starter v2.1',
        'Files fetched successfully.',
      ],
      'generate-files': [
        'Generating project structure...',
        'Created: playbooks/site.yml',
        'Created: roles/common/tasks/main.yml',
        'Created: inventory/hosts.yml',
        'Created: ansible.cfg',
        'Created: requirements.yml',
        'Created: README.md',
        'Project files generated.',
      ],
      'publish-git': [
        'Creating Git repository: ansible/network-automation-project',
        'Pushing initial commit...',
        'Repository created and published.',
      ],
      'register-catalog': [
        'Registering project component in Backstage catalog...',
        'Entity ref: Component:default/network-automation-project',
        'Registration complete.',
      ],
    },
    outputText: [
      {
        title: 'Project created successfully',
        content: 'Your Ansible project has been scaffolded and published to Git. The project includes a standard layout with playbooks, roles, and inventory ready for development.',
      },
    ],
    outputLinks: [
      { title: 'Open project', entityRef: 'Component:default/network-automation-project' },
      { title: 'View repository', url: 'https://github.com/ansible/network-automation-project' },
    ],
  },
  'demo-workflow-approval': {
    templateName: 'employee-onboarding-workflow',
    templateTitle: 'Employee Onboarding Workflow',
    templateType: 'workflow-job-template',
    status: 'processing',
    steps: [
      { id: 'launch-workflow', name: 'Launch workflow', status: 'completed' },
      { id: 'awaiting-approval', name: 'Awaiting approval', status: 'awaiting_approval' },
    ],
    stepLogs: {
      'launch-workflow': [
        'Beginning step Employee Onboarding Workflow',
        'Launching workflow job template id 2001.',
        'RHAAP_WORKFLOW_LAUNCH_DATA {"id":2050,"url":"https://aap.example.com/execution/workflows/2050/output"}',
        'Workflow job 2050 status: waiting',
        'Workflow is awaiting approval at node "Manager Approval".',
      ],
    },
  },
  'demo-project-failed': {
    templateName: 'provision-cloud-infra',
    templateTitle: 'Provision Cloud Infrastructure',
    templateType: 'project',
    status: 'failed',
    steps: [
      { id: 'fetch-template', name: 'Fetch project template', status: 'completed' },
      { id: 'create-resources', name: 'Create cloud resources', status: 'failed' },
      { id: 'register-catalog', name: 'Register in catalog', status: 'open' },
    ],
    stepLogs: {
      'fetch-template': [
        'Fetching project skeleton from template...',
        'Template: cloud-infra-starter v1.3',
        'Files fetched successfully.',
      ],
      'create-resources': [
        'Provisioning cloud resources...',
        'Creating VPC: vpc-ansible-prod',
        'Error: AWS credentials expired. Unable to authenticate with the target account.',
        'Resource creation failed.',
      ],
    },
  },
  'demo-workflow-denied': {
    templateName: 'employee-onboarding-workflow',
    templateTitle: 'Employee Onboarding Workflow',
    templateType: 'workflow-job-template',
    status: 'failed',
    steps: [
      { id: 'launch-workflow', name: 'Launch workflow', status: 'completed' },
    ],
    stepLogs: {
      'launch-workflow': [
        'Beginning step Employee Onboarding Workflow',
        'Launching workflow job template id 2001.',
        'RHAAP_WORKFLOW_LAUNCH_DATA {"id":2051,"url":"https://aap.example.com/execution/workflows/2051/output"}',
        'Workflow job 2051 status: waiting',
        'Workflow is awaiting approval at node "Manager Approval".',
        'Approval denied at node "Manager Approval" by admin@example.com.',
        'Reason: "Budget not approved for Q3. Resubmit after finance review."',
        'Workflow job 2051 status: failed',
      ],
    },
  },
  'demo-workflow-approved': {
    templateName: 'employee-onboarding-workflow',
    templateTitle: 'Employee Onboarding Workflow',
    templateType: 'workflow-job-template',
    status: 'completed',
    steps: [
      { id: 'launch-workflow', name: 'Launch workflow', status: 'completed' },
    ],
    stepLogs: {
      'launch-workflow': [
        'Beginning step Employee Onboarding Workflow',
        'Launching workflow job template id 2001.',
        'RHAAP_WORKFLOW_LAUNCH_DATA {"id":2052,"url":"https://aap.example.com/execution/workflows/2052/output"}',
        'Workflow job 2052 status: waiting',
        'Workflow is awaiting approval at node "Manager Approval".',
        'Approval granted at node "Manager Approval" by admin@example.com.',
        'Workflow job 2052 status: running',
        'Workflow job 2052 status: successful',
        'Finished step Employee Onboarding Workflow',
      ],
    },
    outputText: [
      {
        title: 'Workflow executed successfully',
        content: 'The Employee Onboarding Workflow has completed. All approval gates were passed and all nodes executed successfully.',
      },
    ],
    outputLinks: [
      { title: 'View workflow in AAP', url: 'https://aap.example.com/execution/workflows/2052/output' },
    ],
  },
  'demo-job-completing': {
    templateName: 'deploy-database-update',
    templateTitle: 'Deploy Database Update',
    templateType: 'job-template',
    status: 'completed',
    steps: [
      { id: 'launch-job', name: 'Launch job template', status: 'completed' },
    ],
    stepLogs: {
      'launch-job': [
        'Beginning step Deploy Database Update',
        'Launching job template id 1500.',
        'RHAAP_JOB_LAUNCH_DATA {"id":1500,"url":"https://aap.example.com/jobs/1500/output"}',
        'Job 1500 status: successful',
        'Finished step Deploy Database Update',
      ],
    },
    outputText: [
      {
        title: 'Automation completed',
        content: 'The database update has been deployed to the staging environment.',
      },
    ],
    outputLinks: [
      { title: 'View job in AAP', url: 'https://aap.example.com/jobs/1500/output' },
    ],
  },
  'demo-job-running': {
    templateName: 'deploy-database-update',
    templateTitle: 'Deploy Database Update',
    templateType: 'job-template',
    status: 'processing',
    steps: [
      { id: 'launch-job', name: 'Launch job template', status: 'processing' },
    ],
    stepLogs: {
      'launch-job': [
        'Beginning step Deploy Database Update',
        'Launching job template id 1501.',
        'RHAAP_JOB_LAUNCH_DATA {"id":1501,"url":"https://aap.example.com/jobs/1501/output"}',
        'Job 1501 status: running',
        'Applying migration v2.4.1 to orders-db...',
      ],
    },
  },
  'demo-job-failed': {
    templateName: 'deploy-database-update',
    templateTitle: 'Deploy Database Update',
    templateType: 'job-template',
    status: 'failed',
    steps: [
      { id: 'launch-job', name: 'Launch job template', status: 'failed' },
    ],
    stepLogs: {
      'launch-job': [
        'Beginning step Deploy Database Update',
        'Launching job template id 1502.',
        'RHAAP_JOB_LAUNCH_DATA {"id":1502,"url":"https://aap.example.com/jobs/1502/output"}',
        'Job 1502 status: running',
        'Applying migration v2.4.1 to analytics-db...',
        'Error: Migration script failed — column "user_email" already exists in target schema.',
        'Job 1502 status: failed',
      ],
    },
  },
  'demo-patching-completed': {
    templateName: 'rhel-server-patching',
    templateTitle: 'RHEL Server Patching',
    templateType: 'job-template',
    status: 'completed',
    steps: [
      { id: 'launch-job', name: 'Launch job template', status: 'completed' },
    ],
    stepLogs: {
      'launch-job': [
        'Beginning step RHEL Server Patching',
        'Launching job template id 1600.',
        'RHAAP_JOB_LAUNCH_DATA {"id":1600,"url":"https://aap.example.com/jobs/1600/output"}',
        'Job 1600 status: running',
        'Applying security patches to 12 servers in staging...',
        'Rebooting 4 servers (reboot policy: if-required)...',
        'Job 1600 status: successful',
        'Finished step RHEL Server Patching',
      ],
    },
    outputText: [
      {
        title: 'Automation completed',
        content: 'Security patches have been applied to all 12 servers in the staging environment. 4 servers were rebooted.',
      },
    ],
    outputLinks: [
      { title: 'View job in AAP', url: 'https://aap.example.com/jobs/1600/output' },
    ],
  },
  'demo-aws-workflow-approval': {
    templateName: 'aws-provisioning-workflow',
    templateTitle: 'AWS Provisioning Workflow',
    templateType: 'workflow-job-template',
    status: 'processing',
    steps: [
      { id: 'launch-workflow', name: 'Launch workflow', status: 'completed' },
      { id: 'awaiting-approval', name: 'Awaiting approval', status: 'awaiting_approval' },
    ],
    stepLogs: {
      'launch-workflow': [
        'Beginning step AWS Provisioning Workflow',
        'Launching workflow job template id 3001.',
        'RHAAP_WORKFLOW_LAUNCH_DATA {"id":3050,"url":"https://aap.example.com/execution/workflows/3050/output"}',
        'Workflow job 3050 status: waiting',
        'Workflow is awaiting approval at node "Production Gate".',
      ],
    },
  },
  'demo-aws-workflow-approved': {
    templateName: 'aws-provisioning-workflow',
    templateTitle: 'AWS Provisioning Workflow',
    templateType: 'workflow-job-template',
    status: 'completed',
    steps: [
      { id: 'launch-workflow', name: 'Launch workflow', status: 'completed' },
    ],
    stepLogs: {
      'launch-workflow': [
        'Beginning step AWS Provisioning Workflow',
        'Launching workflow job template id 3001.',
        'RHAAP_WORKFLOW_LAUNCH_DATA {"id":3051,"url":"https://aap.example.com/execution/workflows/3051/output"}',
        'Workflow job 3051 status: waiting',
        'Workflow is awaiting approval at node "Production Gate".',
        'Approval granted at node "Production Gate".',
        'Workflow job 3051 status: running',
        'Workflow job 3051 status: successful',
        'Finished step AWS Provisioning Workflow',
      ],
    },
    outputText: [
      {
        title: 'Automation completed',
        content: 'The AWS Provisioning Workflow has completed. All approval gates were passed and all steps executed successfully.',
      },
    ],
    outputLinks: [
      { title: 'View workflow in AAP', url: 'https://aap.example.com/execution/workflows/3051/output' },
    ],
  },
  'demo-aws-workflow-denied': {
    templateName: 'aws-provisioning-workflow',
    templateTitle: 'AWS Provisioning Workflow',
    templateType: 'workflow-job-template',
    status: 'failed',
    steps: [
      { id: 'launch-workflow', name: 'Launch workflow', status: 'completed' },
    ],
    stepLogs: {
      'launch-workflow': [
        'Beginning step AWS Provisioning Workflow',
        'Launching workflow job template id 3001.',
        'RHAAP_WORKFLOW_LAUNCH_DATA {"id":3052,"url":"https://aap.example.com/execution/workflows/3052/output"}',
        'Workflow job 3052 status: waiting',
        'Workflow is awaiting approval at node "Production Gate".',
        'Approval denied at node "Production Gate".',
        'Reason: "Staging validation incomplete. Complete staging tests before production."',
        'Workflow job 3052 status: failed',
      ],
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _removedDemoAapTab({ specType, aapLogs, isDark, workflowUrl, workflowStatus }: { specType?: string; aapLogs: AapLogEntry[]; isDark: boolean; workflowUrl?: string; workflowStatus?: string }) {
  const [viewMode, setViewMode] = useState<'strip' | 'logs' | 'graph'>('strip');
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  const toggleNode = (id: number) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const statusColor = (s?: string) => {
    if (!s) return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    const sl = s.toLowerCase();
    if (sl === 'successful') return '#4caf50';
    if (sl === 'failed') return '#f44336';
    if (sl === 'running') return '#42a5f5';
    if (sl === 'pending' || sl === 'waiting') return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  };

  const wfStatusColor = workflowStatus === 'successful' ? '#4caf50' : workflowStatus === 'failed' ? '#f44336' : workflowStatus === 'running' ? '#42a5f5' : '#ff9800';
  const jobIdMatch = workflowUrl?.match(/\/(\d+)\//);
  const jobId = jobIdMatch?.[1] || '—';

  const viewLabels: Record<string, string> = { strip: 'Pipeline', logs: 'Logs', graph: 'Graph' };

  return (
    <Box>
      <Box display="flex" alignItems="center" style={{ gap: 6 }}>
        <Typography variant="h6" color="textPrimary">
          {specType === 'workflow-job-template' ? 'AAP Automation workflow' : 'AAP Automation job'}
        </Typography>
        <Tooltip title={specType === 'workflow-job-template'
          ? 'This section shows the execution details of the AAP Workflow Job Template, including node status, approval gates, and per-node logs from Ansible Automation Platform.'
          : 'This section shows the execution details of the AAP Job Template, including playbook output and status from Ansible Automation Platform.'
        }>
          <HelpOutlineIcon style={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)', cursor: 'help' }} />
        </Tooltip>
      </Box>
      <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 12, marginTop: 4 }}>
        {workflowUrl ? (
          <Link
            href={workflowUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            {specType === 'workflow-job-template' ? `Workflow job ${jobId}` : `Job ${jobId}`}
            <OpenInNewIcon style={{ fontSize: 14 }} />
          </Link>
        ) : (
          <Typography variant="body2" color="textSecondary">
            {specType === 'workflow-job-template' ? 'Workflow job' : 'Job'}
          </Typography>
        )}
        <Typography variant="body2" color="textSecondary">—</Typography>
        <Typography variant="body2" style={{ color: wfStatusColor, fontWeight: 500 }}>
          {workflowStatus || '—'}
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="flex-end" marginBottom={1}>

        <Box display="flex" style={{ gap: 0, border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)'}`, borderRadius: 4, overflow: 'hidden' }}>
          {(['strip', 'logs', 'graph'] as const).map(mode => (
            <Button
              key={mode}
              size="small"
              onClick={() => setViewMode(mode)}
              style={{
                textTransform: 'none',
                fontSize: 12,
                padding: '3px 12px',
                minWidth: 0,
                borderRadius: 0,
                background: viewMode === mode ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)') : 'transparent',
                color: viewMode === mode ? (isDark ? '#fff' : '#000') : (isDark ? '#b0b0b0' : 'rgba(0,0,0,0.5)'),
                fontWeight: viewMode === mode ? 600 : 400,
              }}
            >
              {viewLabels[mode]}
            </Button>
          ))}
        </Box>
      </Box>

      {/* === STRIP VIEW (default) === */}
      {viewMode === 'strip' && (
        <Box>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              overflowX: 'auto',
              padding: '12px 8px',
              marginBottom: 16,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 4,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            }}
          >
            {aapLogs.map((log, idx) => (
              <Box key={log.id} display="flex" alignItems="center">
                {idx > 0 && (
                  <Box style={{ width: 32, height: 2, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
                )}
                <Box
                  display="flex"
                  alignItems="center"
                  style={{
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 16,
                    border: `1px solid ${statusColor(log.status)}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <DemoAapNodeIcon status={log.status} isDark={isDark} />
                  <Typography variant="caption" color="textPrimary" style={{ fontWeight: 500 }}>
                    {log.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Node cards with expandable logs */}
          {aapLogs.map(log => (
            <Box
              key={log.id}
              style={{
                borderRadius: 4,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                marginBottom: 8,
                overflow: 'hidden',
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                style={{
                  gap: 8,
                  padding: '10px 12px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderLeft: `3px solid ${statusColor(log.status)}`,
                }}
              >
                <DemoAapNodeIcon status={log.status} isDark={isDark} />
                <Typography variant="subtitle2" color="textPrimary">{log.label}</Typography>
                <Typography variant="caption" style={{ color: isDark ? '#b0b0b0' : 'rgba(0,0,0,0.5)' }}>{log.status}</Typography>
                <Box style={{ flex: 1 }} />
                {log.content ? (
                  <Button
                    size="small"
                    onClick={() => toggleNode(log.id)}
                    style={{ textTransform: 'none', fontSize: 12, padding: '2px 8px', minWidth: 0, color: isDark ? '#90caf9' : undefined }}
                  >
                    {expandedNodes[log.id] ? 'Hide log' : 'View log'}
                  </Button>
                ) : log.hasPlaybookOutput === false ? (
                  <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontStyle: 'italic' }}>
                    No playbook output
                  </Typography>
                ) : null}
              </Box>
              {expandedNodes[log.id] && log.content && (
                <Box
                  component="pre"
                  style={{
                    margin: 0,
                    padding: '10px 12px 10px 15px',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                    color: isDark ? '#e0e0e0' : '#1e1e1e',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                  }}
                >
                  {log.content}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* === LOGS VIEW (flat, all logs visible) === */}
      {viewMode === 'logs' && (
        <Box>
          {aapLogs.map(log => (
            <Box key={log.id} marginBottom={2}>
              <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 6 }}>
                <DemoAapNodeIcon status={log.status} isDark={isDark} />
                <Typography variant="subtitle2" color="textPrimary">{log.label}</Typography>
                <Typography variant="caption" style={{ color: isDark ? '#b0b0b0' : 'rgba(0,0,0,0.5)' }}>{log.status}</Typography>
              </Box>
              {log.content ? (
                <Box
                  component="pre"
                  style={{
                    margin: 0,
                    padding: '10px 12px',
                    borderRadius: 4,
                    background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                    color: isDark ? '#e0e0e0' : '#1e1e1e',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  {log.content}
                </Box>
              ) : (
                <Typography variant="body2" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontStyle: 'italic', paddingLeft: 26 }}>
                  {log.hasPlaybookOutput === false ? 'No playbook output (approval or inventory update node).' : 'No output available.'}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* === GRAPH VIEW (React Flow DAG from seeded logs) === */}
      {viewMode === 'graph' && (
        <Box style={{ minHeight: 350 }}>
          <WorkflowGraph
            layeredNodes={aapLogs.map(log => [{
              id: log.id,
              level: 0,
              label: log.label,
              statusLabel: log.status,
            }])}
            edges={aapLogs.slice(1).map((log, idx) => ({
              from: aapLogs[idx].id,
              to: log.id,
              type: 'success' as const,
            }))}
            selectedNodeId={null}
            hasRuntime
            onNodeClick={() => {}}
          />
        </Box>
      )}
    </Box>
  );
}

export const RunTask = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  const logBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const logColor = isDark ? '#e0e0e0' : undefined;
  const { taskId } = useParams<{ taskId: string }>();
  if (!taskId) throw new Error('Task ID is required');

  const demoTask = DEMO_TASKS[taskId];

  const realStream = useTaskEventStream(taskId);
  const task = demoTask ? ({
    spec: {
      steps: demoTask.steps.map(s => ({ id: s.id, name: s.name, action: '' })),
      templateInfo: {
        entityRef: `template:default/${demoTask.templateName}`,
        entity: {
          metadata: { name: demoTask.templateName, title: demoTask.templateTitle },
          spec: { type: demoTask.templateType },
        },
      },
      parameters: {},
    },
    status: demoTask.status === 'failed' ? 'failed' : demoTask.status === 'processing' ? 'processing' : 'completed',
    id: taskId,
    createdAt: new Date().toISOString(),
  } as any) : realStream.task;
  const completed = demoTask ? demoTask.status !== 'processing' : realStream.completed;
  const loading = demoTask ? false : realStream.loading;
  const error = demoTask ? (demoTask.status === 'failed' ? 'An error occurred during execution.' : undefined) : realStream.error;
  const output = demoTask ? { text: demoTask.outputText, links: demoTask.outputLinks } as any : realStream.output;
  const steps = demoTask
    ? Object.fromEntries(demoTask.steps.map(s => [s.id, { status: s.status }]))
    : realStream.steps;
  const stepLogs = demoTask ? demoTask.stepLogs : realStream.stepLogs;
  const taskMetadata = task?.spec?.templateInfo?.entity?.metadata;
  const [activeTab, setActiveTab] = useState(0);
  const [aapLogs, setAapLogs] = useState<AapLogEntry[]>([]);
  const [isCanceling, setIsCanceling] = useState(false);
  const [toast, setToast] = useState<{ title: string; description?: string; severity: 'success' | 'error' | 'warning' | 'info'; open: boolean; linkUrl?: string; linkLabel?: string }>({ title: '', severity: 'info', open: false });
  const [matchingEntity, setMatchingEntity] = useState<any | null>(null);
  const [templateEntity, setTemplateEntity] = useState<{
    spec?: { type?: string };
  } | null>(demoTask ? { spec: { type: demoTask.templateType } } : null);
  const scaffolderApi = useApi(scaffolderApiRef);
  const catalogApi = useApi(catalogApiRef);
  const navigate = useNavigate();
  const rootLink = useRouteRef(rootRouteRef);
  const templateRouteRef = useRouteRef(selectedTemplateRouteRef);
  const { hasRole } = useUserRole();
  const isDeveloperOrAbove = hasRole('developer');

  const { allowed: canCancel } = usePermission({
    permission: taskCancelPermission,
    resourceRef: taskId,
  });
  const { allowed: canRead } = usePermission({
    permission: taskReadPermission,
    resourceRef: taskId,
  });
  const { allowed: canCreateTask } = usePermission({
    permission: taskCreatePermission,
  });

  const taskStatus = useMemo(() => {
    if (!task) return 'unknown';
    if (completed) {
      if (error) return 'failed';
      return 'completed';
    }
    if (task.status === 'cancelled') return 'cancelled';
    return 'processing';
  }, [task, completed, error]);

  useEffect(() => {
    if (taskStatus !== 'processing' && isCanceling) {
      setIsCanceling(false);
    }
  }, [taskStatus, isCanceling]);

  const prevTaskStatusRef = useRef(taskStatus);
  useEffect(() => {
    const prev = prevTaskStatusRef.current;
    prevTaskStatusRef.current = taskStatus;
    if (prev === 'processing' && taskStatus !== 'processing' && taskStatus !== 'unknown') {
      const name = taskMetadata?.title || taskMetadata?.name || 'Task';
      if (taskStatus === 'completed') {
        setToast({ title: `${name} completed`, description: 'The task has finished successfully.', severity: 'success', open: true });
      } else if (taskStatus === 'failed') {
        setToast({ title: `${name} failed`, description: 'An error occurred during execution. View the logs for details.', severity: 'error', open: true });
      } else if (taskStatus === 'cancelled') {
        setToast({ title: `${name} cancelled`, description: 'The task was cancelled before completion.', severity: 'warning', open: true });
      }
    }
  }, [taskStatus, taskMetadata]);

  useEffect(() => {
    if (!demoTask) return;
    const type = demoTask.templateType;
    if (type === 'service' || type === 'job-template') {
      setAapLogs([{
        id: 1,
        label: demoTask.templateTitle,
        status: demoTask.status === 'completed' ? 'successful' : demoTask.status === 'failed' ? 'failed' : 'running',
        hasPlaybookOutput: true,
        content: (demoTask.stepLogs?.['launch-job'] || []).join('\n'),
      }]);
    } else if (type === 'workflow-job-template') {
      const isDenied = taskId === 'demo-workflow-denied' || taskId === 'demo-aws-workflow-denied';
      const isPending = demoTask.status === 'processing';
      const approvalStatus = isPending ? 'pending' : isDenied ? 'failed' : 'successful';
      const postApprovalStatus = isPending ? 'waiting' : isDenied ? 'canceled' : 'successful';
      const isAws = taskId.startsWith('demo-aws-');
      setAapLogs(isAws ? [
        { id: 1, label: 'Validate Network', status: 'successful', hasPlaybookOutput: true, content: 'Validating VPC and subnet configuration...\nNetwork validation passed.' },
        { id: 2, label: 'Provision Instances', status: isPending ? 'waiting' : 'successful', hasPlaybookOutput: true, content: isPending ? undefined : 'Launching 2 × t3.small in us-east-1...\nInstances provisioned successfully.' },
        { id: 3, label: 'Production Gate', status: approvalStatus, hasPlaybookOutput: false, content: isDenied ? 'Approval denied.\nReason: "Staging validation incomplete. Complete staging tests before production."' : undefined },
        { id: 4, label: 'Configure Servers', status: postApprovalStatus, hasPlaybookOutput: true, content: postApprovalStatus === 'successful' ? 'Applying Ansible roles to new instances...\nServer configuration complete.' : undefined },
        { id: 5, label: 'Validate Deployment', status: postApprovalStatus, hasPlaybookOutput: true, content: postApprovalStatus === 'successful' ? 'Running smoke tests...\nAll health checks passed.' : undefined },
      ] : [
        { id: 1, label: 'Inventory Sync', status: 'successful', hasPlaybookOutput: true, content: 'Syncing inventory from source...\nInventory sync completed successfully.' },
        { id: 2, label: 'Manager Approval', status: approvalStatus, hasPlaybookOutput: false, content: isDenied ? 'Approval denied.\nReason: "Budget not approved for Q3. Resubmit after finance review."' : undefined },
        { id: 3, label: 'Deploy Configuration', status: postApprovalStatus, hasPlaybookOutput: true, content: postApprovalStatus === 'successful' ? 'Deploying configuration to targets...\nConfiguration applied successfully.' : undefined },
      ]);
    }
  }, [demoTask]);

  const demoToastFired = useRef(false);
  useEffect(() => {
    if (demoTask && !demoToastFired.current) {
      demoToastFired.current = true;
      const name = demoTask.templateTitle;
      if (demoTask.status === 'completed') {
        setTimeout(() => {
          setToast({ title: `${name} completed`, description: 'The task has finished successfully.', severity: 'success', open: true });
        }, 1500);
      } else if (demoTask.status === 'failed') {
        const isDenied = taskId === 'demo-workflow-denied' || taskId === 'demo-aws-workflow-denied';
        setTimeout(() => {
          setToast({
            title: isDenied ? 'Approval denied' : `${name} failed`,
            description: isDenied
              ? `${name} was denied at an approval step.`
              : 'An error occurred during execution. View the logs for details.',
            severity: 'error',
            open: true,
            linkUrl: isDenied ? (aapWorkflowUrl || undefined) : undefined,
            linkLabel: isDenied ? 'View details' : undefined,
          });
        }, 1500);
      } else if (demoTask.status === 'processing') {
        setTimeout(() => {
          setToast({ title: 'Awaiting approval', description: `${name} is paused at an approval step. An administrator needs to approve or deny the request.`, severity: 'warning', open: true, linkUrl: aapWorkflowUrl || undefined, linkLabel: 'View details' });
        }, 1500);
      }
    }
  }, [demoTask]);

  useEffect(() => {
    const fetchTemplateEntity = async () => {
      const templateEntityRef = task?.spec?.templateInfo?.entityRef;
      if (templateEntityRef) {
        try {
          const entity = await catalogApi.getEntityByRef(templateEntityRef);
          if (entity) {
            setTemplateEntity(entity);
          }
        } catch (err) {
          console.error('Failed to fetch template entity', err); // eslint-disable-line no-console
        }
      }
    };

    if (task && !templateEntity) {
      fetchTemplateEntity();
    }
  }, [task, catalogApi, templateEntity]);

  const canStartOver = canRead && canCreateTask;
  const showStartOver = canStartOver;
  const isStartOverDisabled =
    taskStatus === 'processing' || taskStatus === 'unknown';

  const showCancel = canCancel;
  const isCancelDisabled = taskStatus !== 'processing';

  // Function to clean up log content by removing timestamps, logging levels, and AAP URL lines
  const cleanLogContent = (logContent: string): string => {
    return (
      logContent
        .split('\n')
        .filter(line => {
          const urlRegex = /https?:\/\/[^/\s]+\/api\//;
          return (
            !line.includes('[backstage-rhaap-common]: Executing') &&
            urlRegex.exec(line) === null
          );
        })
        .join('\n')
        .replaceAll(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*/gm, '')
        // eslint-disable-next-line no-control-regex
        .replaceAll(/\u001b\[[0-9;]*m/g, '')
        .split('\n')
        .map(line => {
          return line.replace(/^\s*(info|warn|error|debug):\s*/i, '').trim();
        })
        .join('\n')
        .replaceAll(/^\s+/gm, '')
        .trim()
    );
  };

  const specType = (task?.spec?.templateInfo?.entity as any)?.spec?.type;
  const allSteps = useMemo(
    () =>
      task?.spec.steps.map((step, idx, arr) => {
        const merged = { ...step, ...steps?.[step.id] };
        if (specType === 'workflow-job-template') {
          if (/launch[-_]?workflow/i.test(step.id) || (arr.length === 1)) {
            return { ...merged, name: 'Execute workflow' };
          }
        }
        if (specType === 'service' || specType === 'job-template') {
          if (/launch[-_]?(job|template)/i.test(step.id) || (arr.length === 1)) {
            return { ...merged, name: 'Execute job' };
          }
        }
        return merged;
      }) ?? [],
    [task, steps, specType],
  );

  const activeStep = useMemo(() => {
    for (let i = allSteps.length - 1; i >= 0; i--) {
      if (allSteps[i].status !== 'open') {
        return i;
      }
    }
    return 0;
  }, [allSteps]);

  const handleCancel = useCallback(async () => {
    if (!taskId || !canCancel || isCancelDisabled) return;

    setIsCanceling(true);
    try {
      await scaffolderApi.cancelTask(taskId);
    } catch (err) {
      console.error('Failed to cancel task:', err); // eslint-disable-line no-console
      setIsCanceling(false);
    }
  }, [taskId, canCancel, isCancelDisabled, scaffolderApi]);

  const handleStartOver = useCallback(() => {
    if (
      !task?.spec?.templateInfo?.entity?.metadata ||
      !canStartOver ||
      isStartOverDisabled
    )
      return;

    const namespace =
      task.spec.templateInfo.entity.metadata.namespace || 'default';
    const templateName = task.spec.templateInfo.entity.metadata.name;

    if (namespace && templateName) {
      const taskParameters = task.spec.parameters || {};
      const filteredParameters = Object.fromEntries(
        Object.entries(taskParameters).filter(([key]) => key !== 'token'),
      );

      navigate(templateRouteRef({ namespace, templateName }), {
        state: { initialFormData: filteredParameters },
      });
    }
  }, [task, canStartOver, isStartOverDisabled, navigate, templateRouteRef]);

  const handleBack = useCallback(() => {
    navigate(`${rootLink()}/create/tasks`);
  }, [navigate, rootLink]);

  const handleEntityLinkClick = useCallback(
    (entityRef: string) => {
      const parts = entityRef.split(':');
      if (parts.length === 2) {
        const kind = parts[0];
        const rest = parts[1];
        const pathParts = rest.split('/');

        let namespace: string;
        let name: string;

        if (pathParts.length === 2) {
          namespace = pathParts[0];
          name = pathParts[1];
        } else {
          namespace = 'default';
          name = pathParts[0];
        }

        navigate(`/catalog/${namespace}/${kind}/${name}`);
      } else {
        console.warn(`Unexpected entityRef format: ${entityRef}`); // eslint-disable-line no-console
      }
    },
    [navigate],
  );

  const showDownloadButton = useMemo(() => {
    if (!task) {
      return false;
    }

    if (
      resolvePublishToScmFromParameters(
        task?.spec?.parameters as Record<string, unknown> | undefined,
      )
    ) {
      return false;
    }

    if (!completed || error || taskStatus !== 'completed') {
      return false;
    }

    const hasEEDefinitionStep = allSteps.some(
      step => step.id === 'create-ee-definition',
    );

    if (!hasEEDefinitionStep) {
      return false;
    }

    return !!matchingEntity;
  }, [task, completed, error, taskStatus, allSteps, matchingEntity]);

  useEffect(() => {
    if (matchingEntity || !completed || !task) {
      return undefined;
    }

    if (
      resolvePublishToScmFromParameters(
        task?.spec?.parameters as Record<string, unknown> | undefined,
      )
    ) {
      return undefined;
    }

    const hasEEDefinitionStep = allSteps.some(
      step => step.id === 'create-ee-definition',
    );

    if (!hasEEDefinitionStep) {
      return undefined;
    }

    const fetchEntity = async () => {
      try {
        const eeFileName = resolveEeFileNameFromParameters(
          task?.spec?.parameters as Record<string, unknown> | undefined,
        );
        if (!eeFileName) {
          console.warn('EE file name not found in task parameters'); // eslint-disable-line no-console
          return;
        }

        const entityRef = `Component:default/${eeFileName.trim()}`;
        const foundEntity = await catalogApi.getEntityByRef(entityRef);

        if (
          foundEntity?.kind === 'Component' &&
          foundEntity?.spec?.type === 'execution-environment'
        ) {
          setMatchingEntity(foundEntity);
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            `Could not find registered EE component for ${eeFileName}`,
          );
        }
      } catch (err) {
        console.error('Failed to fetch entity from catalog:', err); // eslint-disable-line no-console
      }
    };
    const timeoutId = setTimeout(() => {
      fetchEntity();
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [matchingEntity, completed, task, allSteps, catalogApi]);

  const getMatchingEntity = useCallback(async (): Promise<any | null> => {
    let entity = matchingEntity;

    if (!entity) {
      const eeFileName = resolveEeFileNameFromParameters(
        task?.spec?.parameters as Record<string, unknown> | undefined,
      );
      if (!eeFileName) {
        console.error('EE file name not found in task parameters'); // eslint-disable-line no-console
        return null;
      }

      try {
        const entityRef = `Component:default/${eeFileName.trim()}`;
        const foundEntity = await catalogApi.getEntityByRef(entityRef);

        if (
          foundEntity?.kind === 'Component' &&
          foundEntity?.spec?.type === 'execution-environment'
        ) {
          entity = foundEntity;
          setMatchingEntity(entity);
          return entity;
        }
        console.error('Entity not found in catalog or wrong type'); // eslint-disable-line no-console
        return null;
      } catch (err) {
        console.error('Entity not found in catalog', err); // eslint-disable-line no-console
        return null;
      }
    }

    return entity;
  }, [matchingEntity, catalogApi, task]);

  const handleDownloadArchive = useCallback(async () => {
    const entity = await getMatchingEntity();
    if (
      !entity?.spec?.definition ||
      !entity?.spec?.readme ||
      !entity?.spec?.template
    ) {
      // eslint-disable-next-line no-console
      console.error('Entity, definition, readme, or template not available');
      return;
    }

    try {
      const entityName = entity.metadata?.name || 'execution-environment';
      const eeFileName = `${entityName}.yaml`;
      const readmeFileName = `README-${entityName}.md`;
      const ansibleCfgFileName = `ansible.cfg`;
      const templateFileName = `${entityName}-template.yaml`;
      const archiveName = `${entityName}.tar`;

      const archiveFiles: Array<{ name: string; content: string }> = [
        { name: eeFileName, content: entity.spec.definition },
        { name: readmeFileName, content: entity.spec.readme },
        { name: ansibleCfgFileName, content: entity.spec.ansible_cfg },
        { name: templateFileName, content: entity.spec.template },
      ];

      // only include mcp_vars if it exists
      if (entity.spec.mcp_vars) {
        const mcpVarsFileName = `mcp-vars.yaml`;
        archiveFiles.push({
          name: mcpVarsFileName,
          content: entity.spec.mcp_vars,
        });
      }

      const tarData = createTarArchive(archiveFiles);

      const blob = new Blob([tarData as BlobPart], {
        type: 'application/x-tar',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = archiveName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download archive:', err); // eslint-disable-line no-console
    }
  }, [getMatchingEntity]);

  const templateDisplayName = taskMetadata?.title || taskMetadata?.name || 'Untitled template';
  const templateType = templateEntity?.spec?.type;
  const readmeContent = demoTask?.readme || (matchingEntity?.spec?.readme as string | undefined);

  const aapWorkflowUrl = useMemo(() => {
    const allLogText = Object.values(stepLogs).flat().join(' ');
    const urlMatch = /RHAAP_WORKFLOW_LAUNCH_DATA\s*\{[^}]*"url"\s*:\s*"([^"]+)"/.exec(allLogText);
    return urlMatch?.[1] || null;
  }, [stepLogs]);

  const aapJobId = useMemo(() => {
    const allLogText = Object.values(stepLogs).flat().join(' ');
    const idMatch = /RHAAP_WORKFLOW_LAUNCH_DATA\s*\{[^}]*"id"\s*:\s*(\d+)/.exec(allLogText);
    return idMatch?.[1] || null;
  }, [stepLogs]);

  if (loading) {
    return (
      <Page themeId="tool">
        <Header
          pageTitleOverride="Activity"
          title=""
          style={{ background: 'inherit', paddingTop: 0, display: 'none' }}
        />
        <Content>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '20px',
            }}
          >
            <Typography variant="h6" color="textPrimary">
              Loading task...
            </Typography>
            <CircularProgress style={{ marginTop: '10px' }} />
          </div>
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header
        pageTitleOverride="Activity"
        title=""
        style={{ background: 'inherit', paddingTop: 0, display: 'none' }}
      />
      <Content>
        {/* Page header area */}
        <Box className={classes.headerRow} marginBottom={3}>
          <Box className={classes.headerLeft}>
            {/* Breadcrumb: always Activity */}
            <Box className={classes.breadcrumb}>
              <IconButton
                onClick={handleBack}
                size="small"
                aria-label="go back"
                data-testid="back-button"
                style={{ marginLeft: -4, marginRight: 4 }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Link
                component="button"
                onClick={handleBack}
                className={classes.breadcrumbLink}
                underline="none"
              >
                Activity
              </Link>
            </Box>

            {/* Title row: "Run of [name]" + status */}
            <Box className={classes.titleRow}>
              <Typography className={classes.pageTitle}>
                Run of {templateDisplayName}
              </Typography>
              <Box
                display="inline-flex"
                alignItems="center"
                style={{ gap: 4 }}
              >
                <StatusIcon status={taskStatus} />
                <Typography
                  variant="body2"
                  style={{
                    fontWeight: 600,
                    color:
                      taskStatus === 'failed'
                        ? '#f44336'
                        : taskStatus === 'completed'
                          ? '#4caf50'
                          : taskStatus === 'cancelled'
                            ? '#ff9800'
                            : '#42a5f5',
                  }}
                >
                  {getStatusLabel(taskStatus)}
                </Typography>
              </Box>
            </Box>

            {/* Meta line: Task ID + AAP context for dev/admin */}
            <Box className={classes.metaLine}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', opacity: 0.5 }}>
                ID: {shortId(taskId)}
              </span>
              {isDeveloperOrAbove && aapJobId && (
                <>
                  <span style={{ opacity: 0.3 }}>&middot;</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', opacity: 0.5 }}>
                    AAP {templateType === 'workflow-job-template' ? 'Workflow' : 'Job'} {aapJobId}
                  </span>
                  {(() => {
                    const completedCount = aapLogs.filter(n => n.status?.toLowerCase() === 'successful').length;
                    const totalCount = aapLogs.length;
                    const hasRunning = aapLogs.some(n => n.status?.toLowerCase() === 'running');
                    const hasFailed = aapLogs.some(n => n.status?.toLowerCase() === 'failed' || n.status?.toLowerCase() === 'error');
                    let statusText: string;
                    let statusColor: string;
                    if (completed && !error && completedCount === totalCount && totalCount > 0) {
                      statusText = 'Completed';
                      statusColor = '#4caf50';
                    } else if (hasFailed) {
                      statusText = 'Failed';
                      statusColor = '#f44336';
                    } else if (hasRunning) {
                      statusText = totalCount > 1 ? `Running · ${completedCount} of ${totalCount} nodes` : 'Running';
                      statusColor = '#42a5f5';
                    } else if (completed && error) {
                      statusText = 'Failed';
                      statusColor = '#f44336';
                    } else {
                      statusText = 'In progress';
                      statusColor = '#42a5f5';
                    }
                    return (
                      <>
                        <span style={{ fontSize: '0.8125rem', opacity: 0.4 }}>—</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: statusColor }}>
                          {statusText}
                        </span>
                      </>
                    );
                  })()}
                  {aapWorkflowUrl && (
                    <Link
                      href={aapWorkflowUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.8125rem', marginLeft: 4 }}
                    >
                      View in AAP
                      <OpenInNewIcon style={{ fontSize: 12 }} />
                    </Link>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Header actions — utility only */}
          <Box className={classes.headerActions}>
            {showCancel && taskStatus === 'processing' && (
              <Button
                onClick={handleCancel}
                disabled={isCancelDisabled || isCanceling}
                variant="outlined"
                size="small"
              >
                {isCanceling ? 'Canceling...' : 'Cancel'}
              </Button>
            )}
            {showStartOver && (
              <Button
                onClick={handleStartOver}
                disabled={isStartOverDisabled}
                variant="outlined"
                size="small"
              >
                Start Over
              </Button>
            )}
          </Box>
        </Box>

        {/* Awaiting approval zone — visible when workflow is waiting for approval */}
        {taskStatus === 'processing' && (() => {
          const allLogs = Object.values(stepLogs).flat().join(' ').toLowerCase();
          return allLogs.includes('awaiting approval') || allLogs.includes('waiting');
        })() && (
          <Box
            marginBottom={2}
            style={{
              borderRadius: 4,
              padding: 20,
              border: `1px solid ${isDark ? 'rgba(255,152,0,0.3)' : 'rgba(255,152,0,0.2)'}`,
              background: isDark ? 'rgba(255,152,0,0.08)' : 'rgba(255,152,0,0.04)',
            }}
          >
            <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 4 }}>
              <Typography variant="subtitle2" color="textPrimary">
                Awaiting approval
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: (isDeveloperOrAbove && aapWorkflowUrl) ? 12 : 0 }}>
              This automation is paused at an approval step. An administrator needs to approve or deny the request before execution can continue.
            </Typography>
            {isDeveloperOrAbove && aapWorkflowUrl && (
              <Button
                href={aapWorkflowUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                color="primary"
                size="small"
                endIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
              >
                View in Ansible Automation Platform
              </Button>
            )}
          </Box>
        )}

        {/* Results zone — visible on completion, only for templates that produce artifacts */}
        {completed && !error && templateType !== 'service' && templateType !== 'job-template' && templateType !== 'workflow-job-template' && (
          <Box
            marginBottom={2}
            style={{
              borderRadius: 4,
              padding: 20,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            }}
          >
            {output?.text?.map((textItem: { title?: string; content?: string }, index: number) => (
              <Box key={textItem.title || `text-${index}`} marginBottom={1}>
                <Typography component="div" variant="body2" color="textSecondary">
                  <MarkdownContent content={textItem.content || ''} />
                </Typography>
              </Box>
            ))}

            <Box
              display="flex"
              flexWrap="wrap"
              alignItems="center"
              style={{ gap: 8, marginTop: 12 }}
            >
              {output?.links
                ?.filter((link: any) => {
                  if ('if' in link && link.if === false) return false;
                  if ('entityRef' in link)
                    return !!link.entityRef && link.entityRef.trim() !== '';
                  if ('url' in link) {
                    const url = link.url;
                    if (!url || url === '#' || url.trim() === '') return false;
                    if (aapWorkflowUrl && url === aapWorkflowUrl) return false;
                    return true;
                  }
                  return false;
                })
                ?.map((link: any, index: number) => {
                  const isFirstLink = index === 0;
                  if ('entityRef' in link && link.entityRef) {
                    const entityRef = link.entityRef;
                    return (
                      <Button
                        key={entityRef || link.title || `link-${index}`}
                        onClick={() => handleEntityLinkClick(entityRef)}
                        variant={isFirstLink ? 'contained' : 'outlined'}
                        color="primary"
                        size="small"
                      >
                        {link.title}
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={link.url || link.title || `link-${index}`}
                      href={link.url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant={isFirstLink ? 'contained' : 'outlined'}
                      color="primary"
                      size="small"
                    >
                      {link.title}
                    </Button>
                  );
                })}
              {showDownloadButton && (
                <Button
                  onClick={handleDownloadArchive}
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<GetAppIcon />}
                  disabled={!matchingEntity}
                  title={
                    matchingEntity
                      ? 'Download EE files as tar archive'
                      : 'Waiting for entity...'
                  }
                >
                  Download EE Files
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Failure zone — visible on error */}
        {completed && error && (
          <Box
            marginBottom={2}
            style={{
              borderRadius: 4,
              padding: 20,
              border: `1px solid ${isDark ? 'rgba(244,67,54,0.3)' : 'rgba(244,67,54,0.2)'}`,
              background: isDark ? 'rgba(244,67,54,0.08)' : 'rgba(244,67,54,0.04)',
            }}
          >
            <Typography variant="subtitle2" style={{ color: '#f44336', marginBottom: 4 }}>
              {(taskId === 'demo-workflow-denied' || taskId === 'demo-aws-workflow-denied')
                ? 'Approval denied'
                : `${templateDisplayName} failed`}
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 12 }}>
              {(taskId === 'demo-workflow-denied' || taskId === 'demo-aws-workflow-denied')
                ? 'The request was denied at an approval step. Contact your administrator for details or start over to resubmit.'
                : typeof error === 'string' ? error : 'An error occurred during execution. Check the logs for details.'}
            </Typography>
            <Box display="flex" style={{ gap: 8 }}>
              <Button
                onClick={() => {
                  setActiveTab(0);
                  setTimeout(() => {
                    const logSection = document.getElementById('scaffolder-logs');
                    logSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                variant="outlined"
                color="primary"
                size="small"
              >
                View logs
              </Button>
              {showStartOver && (
                <Button
                  onClick={handleStartOver}
                  disabled={isStartOverDisabled}
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  Start Over
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Hidden AAP sections — always mounted to collect logs for the activity summary */}
        <Box display="none">
          {demoTask ? null : (
            <>
              <WorkflowJobTaskSection onLogsChange={setAapLogs} />
              <JobTaskSection onLogsChange={setAapLogs} />
            </>
          )}
        </Box>

        {/* Scaffolder progress steps — always visible, not inside a tab */}
        {allSteps.some(s => s.status === 'awaiting_approval') ? (
          <Box
            style={{
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <Box style={{ height: 4, background: '#ff9800' }} />
            <Box
              style={{
                padding: '24px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {allSteps.map((step, idx) => {
                let icon: React.ReactNode;
                if (step.status === 'completed') {
                  icon = <CheckCircleOutlineIcon style={{ color: '#4caf50', fontSize: 28 }} />;
                } else if (step.status === 'awaiting_approval') {
                  icon = <PauseCircleOutlineIcon style={{ color: '#ff9800', fontSize: 28 }} />;
                } else if (step.status === 'failed') {
                  icon = <ErrorOutlineIcon style={{ color: '#f44336', fontSize: 28 }} />;
                } else if (step.status === 'processing') {
                  icon = <CircularProgress size={24} />;
                } else {
                  icon = (
                    <Box
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: `2px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
                      }}
                    />
                  );
                }
                return (
                  <Box key={step.id} display="flex" alignItems="center">
                    {idx > 0 && (
                      <Box
                        style={{
                          width: 48,
                          height: 2,
                          background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                        }}
                      />
                    )}
                    <Box display="flex" flexDirection="column" alignItems="center" style={{ minWidth: 100 }}>
                      {icon}
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        style={{
                          marginTop: 6,
                          textAlign: 'center',
                        }}
                      >
                        {step.name}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : (
          <TaskSteps
            steps={allSteps}
            activeStep={activeStep}
            isComplete={completed}
            isError={Boolean(error)}
          />
        )}

        {/* Tab bar — Logs always present; README conditional */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          style={{ minHeight: 40, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, marginBottom: 16, marginTop: 24 }}
        >
          <Tab label="Logs" value={0} style={{ minHeight: 40, textTransform: 'none', fontSize: 13 }} />
          {readmeContent && (
            <Tab label="README" value={2} style={{ minHeight: 40, textTransform: 'none', fontSize: 13 }} />
          )}
        </Tabs>

        {/* Logs tab */}
        {activeTab === 0 && (
          <Box id="scaffolder-logs">
            <Box
              style={{
                borderRadius: 4,
                padding: 16,
                background: logBg,
                color: logColor,
              }}
            >
              {Object.entries(stepLogs).length === 0 ||
              Object.values(stepLogs).every(logs => logs.length === 0) ? (
                <Typography variant="body2" color="textSecondary">
                  No logs available yet.
                </Typography>
              ) : (
                Object.entries(stepLogs).map(
                  ([step, logs]) =>
                    logs.length > 0 && (
                      <div key={step}>
                        <Typography
                          variant="body2"
                          style={{ fontWeight: 'bold', marginTop: 10 }}
                          color="textPrimary"
                        >
                          {step}:
                        </Typography>
                        {logs.map((log, index) => (
                          <Typography
                            key={`${step}-log-${index}`}
                            variant="body2"
                            color="textSecondary"
                            style={{ whiteSpace: 'break-spaces' }}
                          >
                            <MarkdownContent content={cleanLogContent(log)} />
                          </Typography>
                        ))}
                      </div>
                    ),
                )
              )}
            </Box>
          </Box>
        )}

        {/* README tab */}
        {activeTab === 2 && readmeContent && (
          <Box
            style={{
              borderRadius: 4,
              padding: 24,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              color: isDark ? '#e0e0e0' : undefined,
            }}
          >
            <MarkdownContent content={readmeContent} />
          </Box>
        )}
      </Content>
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.severity === 'success' ? 8000 : null}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        style={{ top: 80 }}
      >
        <Box
          style={{
            minWidth: 320,
            maxWidth: 420,
            borderRadius: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            background: isDark ? '#1e1e1e' : '#ffffff',
            borderLeft: `4px solid ${
              toast.severity === 'success' ? '#4caf50'
              : toast.severity === 'error' ? '#f44336'
              : toast.severity === 'warning' ? '#ff9800'
              : '#2196f3'
            }`,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <Box style={{ marginTop: 2, flexShrink: 0 }}>
            {toast.severity === 'success' && <CheckCircleOutlineIcon style={{ fontSize: 20, color: '#4caf50' }} />}
            {toast.severity === 'error' && <ErrorOutlineIcon style={{ fontSize: 20, color: '#f44336' }} />}
            {toast.severity === 'warning' && <ErrorOutlineIcon style={{ fontSize: 20, color: '#ff9800' }} />}
            {toast.severity === 'info' && <ErrorOutlineIcon style={{ fontSize: 20, color: '#2196f3' }} />}
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              style={{
                fontWeight: 600,
                color: isDark ? '#ffffff' : '#151515',
                lineHeight: 1.4,
              }}
            >
              {toast.title}
            </Typography>
            {toast.description && (
              <Typography
                variant="body2"
                style={{
                  color: isDark ? '#b0b0b0' : '#6a6e73',
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                {toast.description}
              </Typography>
            )}
            {toast.linkUrl && (
              <Link
                href={toast.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                style={{ marginTop: 6, display: 'inline-block' }}
              >
                {toast.linkLabel || 'View details'}
              </Link>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={() => setToast(prev => ({ ...prev, open: false }))}
            style={{
              marginTop: -4,
              marginRight: -8,
              color: isDark ? '#b0b0b0' : '#6a6e73',
            }}
            aria-label="Close notification"
          >
            <Typography style={{ fontSize: 18, lineHeight: 1 }}>✕</Typography>
          </IconButton>
        </Box>
      </Snackbar>
    </Page>
  );
};
