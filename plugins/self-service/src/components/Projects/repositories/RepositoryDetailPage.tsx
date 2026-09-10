import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Page,
  Header,
  HeaderTabs,
  Content,
} from '@backstage/core-components';
import {
  Box,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  Link,
  IconButton,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@material-ui/core';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import GitHubIcon from '@material-ui/icons/GitHub';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import PublicIcon from '@material-ui/icons/Public';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import CategoryIcon from '@material-ui/icons/Category';
import MemoryIcon from '@material-ui/icons/Memory';
import CodeIcon from '@material-ui/icons/Code';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import SvgIcon from '@material-ui/core/SvgIcon';
import { useProjectDetailStyles } from '../detail/styles';
import { statusColors } from '../../common/statusColors';
import { useUserRoleContext } from '../../../hooks/useUserRole';
import { devSpacesMockupPath } from '../../Admin/syncDemoData';
import { isDevSpacesConnected } from '../../../hooks/devSpacesSetup';
import {
  DISCOVERED_REPOS,
  DiscoveredRepo,
  DiscoveredResource,
} from './repositoriesDemoData';

const GitLabIcon = (props: React.ComponentProps<typeof SvgIcon>) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
  </SvgIcon>
);

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'yaml', label: 'YAML' },
  { id: 'commits', label: 'Commits' },
];

const DEMO_README: Record<string, string> = {
  'linux-baseline-hardening': `# Linux Baseline Hardening

Ansible automation for applying CIS benchmarks and security baselines to Linux hosts.

## Overview

This project provides a comprehensive set of playbooks and roles for hardening Linux systems according to CIS Level 1 and Level 2 benchmarks, specifically targeting RHEL 8 and RHEL 9.

## Playbooks

| Playbook | Description |
|----------|-------------|
| \`site.yml\` | Full hardening run (all benchmarks) |
| \`cis-level1.yml\` | CIS Level 1 benchmarks only |
| \`cis-level2.yml\` | CIS Level 2 benchmarks only |
| \`audit.yml\` | Audit mode — report without changes |
| \`rollback.yml\` | Revert hardening changes |

## Requirements

- Ansible >= 2.14
- Target hosts: RHEL 8.x / RHEL 9.x
- Elevated privileges (become: true)

## Quick Start

\`\`\`bash
ansible-playbook -i inventory/production site.yml --check
\`\`\`

## License

Apache-2.0`,

  'vmware-lifecycle-ops': `# VMware Lifecycle Operations

Ansible automation for managing VMware virtual machine lifecycles — provisioning, snapshots, patching, and decommissioning.

## Overview

This project provides end-to-end automation for VMware vSphere environments, covering the full VM lifecycle from provisioning to retirement.

## Playbooks

| Playbook | Description |
|----------|-------------|
| \`provision.yml\` | Provision new VMs from templates |
| \`snapshot-create.yml\` | Create VM snapshots |
| \`snapshot-cleanup.yml\` | Clean up old snapshots |
| \`patch-vms.yml\` | Apply OS patches to VMs |
| \`decommission.yml\` | Safely decommission VMs |

## Requirements

- Ansible >= 2.14
- \`community.vmware\` collection
- vSphere 7.0+ or 8.0+

## License

Apache-2.0`,
};

const DEFAULT_README = `# Repository

This repository contains Ansible automation content that was discovered by the Ansible Portal.

## Getting Started

Review the discovered playbooks, roles, and other content in the **Overview** tab.

## License

Apache-2.0`;

type DemoCommit = {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
};

type DemoYamlFile = {
  name: string;
  path: string;
  content: string;
};

const getDemoCommits = (repo: DiscoveredRepo): DemoCommit[] => [
  {
    hash: repo.lastCommitHash,
    message: repo.lastCommitMessage,
    author: repo.lastCommitAuthor,
    timestamp: repo.lastCommitTimestamp,
  },
  {
    hash: 'e3b0c44',
    message: 'refactor: extract common variables to group_vars',
    author: repo.lastCommitAuthor,
    timestamp: '2026-03-18 10:30',
  },
  {
    hash: '7f1a2b3',
    message: 'docs: update README with new playbook descriptions',
    author: 'priya.patel',
    timestamp: '2026-03-17 15:12',
  },
  {
    hash: 'c4d5e6f',
    message: 'feat: add pre-check validation tasks',
    author: 'alex.kim',
    timestamp: '2026-03-16 09:45',
  },
  {
    hash: '8a9b0c1',
    message: 'fix: correct handler notification for service restart',
    author: 'sarah.chen',
    timestamp: '2026-03-15 14:22',
  },
  {
    hash: 'd2e3f4a',
    message: 'chore: pin collection versions in requirements.yml',
    author: 'david.lee',
    timestamp: '2026-03-14 11:08',
  },
];

const getDemoYamlFiles = (repo: DiscoveredRepo): DemoYamlFile[] => {
  const files: DemoYamlFile[] = [
    {
      name: 'requirements.yml',
      path: 'collections/requirements.yml',
      content: `---
collections:
  - name: ansible.builtin
    version: ">=2.14"
  - name: ansible.posix
    version: "1.5.4"${repo.resources.some(r => r.type === 'collection-dep' && r.count > 1) ? `
  - name: community.general
    version: "7.5.0"` : ''}`,
    },
  ];

  if (repo.resources.some(r => r.type === 'execution-environment')) {
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

const resourceIcon = (type: string) => {
  switch (type) {
    case 'playbook':
      return (
        <InsertDriveFileOutlinedIcon
          style={{ fontSize: 18, color: '#1976d2' }}
        />
      );
    case 'role':
      return <FolderOutlinedIcon style={{ fontSize: 18, color: '#1976d2' }} />;
    case 'collection-dep':
      return <CategoryIcon style={{ fontSize: 18, color: '#1976d2' }} />;
    case 'execution-environment':
      return <MemoryIcon style={{ fontSize: 18, color: '#1976d2' }} />;
    default:
      return (
        <InsertDriveFileOutlinedIcon
          style={{ fontSize: 18, color: '#1976d2' }}
        />
      );
  }
};

const resourceLabel = (type: string) => {
  switch (type) {
    case 'playbook':
      return 'Playbooks';
    case 'role':
      return 'Roles';
    case 'collection-dep':
      return 'Collection dependencies';
    case 'execution-environment':
      return 'Execution environments';
    default:
      return type;
  }
};

const visibilityIcon = (v: string) => {
  switch (v) {
    case 'private':
      return <LockIcon style={{ fontSize: 14 }} />;
    case 'internal':
      return <LockOpenIcon style={{ fontSize: 14 }} />;
    default:
      return <PublicIcon style={{ fontSize: 14 }} />;
  }
};

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------
const OverviewTab = ({ repo }: { repo: DiscoveredRepo }) => {
  const classes = useProjectDetailStyles();
  const readme =
    DEMO_README[repo.name] || DEFAULT_README;

  return (
    <Box className={classes.tabContent}>
      <Box className={classes.mainColumn}>
        {/* README */}
        <Card className={classes.card} variant="outlined">
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle}>README.md</Typography>
            <Box
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
              }}
            >
              <ReadmeRenderer content={readme} />
            </Box>
          </CardContent>
        </Card>

        {/* Discovered content */}
        <Card className={classes.card} variant="outlined">
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle}>
              Discovered content
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ marginBottom: 16 }}
            >
              Ansible content automatically detected in this repository.
            </Typography>
            {repo.resources.map((r: DiscoveredResource) => (
              <Box key={r.type} className={classes.resourceItem}>
                {resourceIcon(r.type)}
                <Box style={{ flex: 1 }}>
                  <Typography className={classes.resourceName}>
                    {resourceLabel(r.type)}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${r.count} found`}
                  variant="outlined"
                  style={{ fontSize: 11, height: 22 }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Recent commits */}
        <Card className={classes.card} variant="outlined">
          <CardContent className={classes.cardContent}>
            <Typography className={classes.cardTitle}>
              Recent commits
            </Typography>
            {getDemoCommits(repo)
              .slice(0, 5)
              .map(commit => (
                <Box key={commit.hash} className={classes.activityItem}>
                  <GitHubIcon
                    style={{ fontSize: 18, color: '#666', marginTop: 2 }}
                  />
                  <Box style={{ flex: 1 }}>
                    <Typography style={{ fontSize: 13 }}>
                      <code style={{ fontSize: 11, marginRight: 6 }}>
                        {commit.hash.substring(0, 7)}
                      </code>
                      {commit.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                    >
                      {commit.author}
                    </Typography>
                  </Box>
                  <Typography className={classes.activityTime}>
                    {commit.timestamp}
                  </Typography>
                </Box>
              ))}
          </CardContent>
        </Card>
      </Box>

      {/* Sidebar */}
      <Box className={classes.sidebarColumn}>
        <AboutCard repo={repo} />
        <SourceCard repo={repo} />
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Sidebar cards
// ---------------------------------------------------------------------------
const AboutCard = ({ repo }: { repo: DiscoveredRepo }) => {
  const classes = useProjectDetailStyles();
  return (
    <Card className={classes.card} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle}>About</Typography>
        <Box>
          <Typography className={classes.cardLabel}>Organization</Typography>
          <Typography className={classes.cardValue}>{repo.org}</Typography>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Branch</Typography>
          <Chip
            size="small"
            label={repo.branch}
            variant="outlined"
            style={{ fontSize: 12, height: 24, fontFamily: 'monospace' }}
          />
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Visibility</Typography>
          <Box display="flex" alignItems="center" style={{ gap: 4 }}>
            {visibilityIcon(repo.visibility)}
            <Typography className={classes.cardValue} style={{ textTransform: 'capitalize' }}>
              {repo.visibility}
            </Typography>
          </Box>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Discovered</Typography>
          <Typography className={classes.cardValue}>
            {repo.discoveredAt}
          </Typography>
        </Box>
        <Box className={classes.cardSection}>
          <Typography className={classes.cardLabel}>Last commit</Typography>
          <Typography className={classes.cardValue}>
            <code style={{ fontSize: 12 }}>
              {repo.lastCommitHash.substring(0, 7)}
            </code>{' '}
            by {repo.lastCommitAuthor}
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            style={{ display: 'block', marginTop: 2 }}
          >
            {repo.lastCommitMessage}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const SourceCard = ({ repo }: { repo: DiscoveredRepo }) => {
  const classes = useProjectDetailStyles();
  return (
    <Card className={classes.linksCard} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle}>Links</Typography>
        <Box
          className={classes.linkItem}
          onClick={() => window.open(repo.url, '_blank')}
        >
          {repo.provider === 'github' ? (
            <GitHubIcon className={classes.linkIcon} />
          ) : (
            <GitLabIcon className={classes.linkIcon} />
          )}
          <Box>
            <Typography className={classes.linkText}>View source</Typography>
            <Typography className={classes.linkDescription}>
              Open repository in {repo.provider === 'github' ? 'GitHub' : 'GitLab'}
            </Typography>
          </Box>
        </Box>
        <Box className={classes.linkItem}>
          <CodeIcon className={classes.linkIcon} />
          <Box>
            <Typography className={classes.linkText}>
              Edit in Workspace
            </Typography>
            <Typography className={classes.linkDescription}>
              Open in a dev workspace
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// YAML Tab
// ---------------------------------------------------------------------------
const YamlTab = ({ repo }: { repo: DiscoveredRepo }) => {
  const classes = useProjectDetailStyles();
  const files = getDemoYamlFiles(repo);

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
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <InsertDriveFileOutlinedIcon
                  style={{ fontSize: 18, color: '#666' }}
                />
                <Typography style={{ fontWeight: 600, fontSize: 14 }}>
                  {file.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ fontFamily: 'monospace' }}
                >
                  {file.path}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                style={{ textTransform: 'none', fontSize: 12 }}
                onClick={() =>
                  window.open(`${repo.url}/blob/${repo.branch}/${file.path}`, '_blank')
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
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
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
// Commits Tab
// ---------------------------------------------------------------------------
const CommitsTab = ({ repo }: { repo: DiscoveredRepo }) => {
  const classes = useProjectDetailStyles();
  const commits = getDemoCommits(repo);

  return (
    <Box style={{ marginTop: 24 }}>
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <Typography className={classes.cardTitle}>
            Commit history
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginBottom: 16 }}
          >
            Recent commits on the <code style={{ fontSize: 12 }}>{repo.branch}</code> branch.
          </Typography>
          {commits.map((commit, i) => (
            <Box
              key={commit.hash}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 0',
                borderBottom:
                  i < commits.length - 1 ? '1px solid #e0e0e0' : 'none',
              }}
            >
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <GitHubIcon style={{ fontSize: 16, color: '#1976d2' }} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Typography style={{ fontSize: 14, fontWeight: 500 }}>
                  {commit.message}
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  style={{ gap: 8, marginTop: 4 }}
                >
                  <Typography variant="caption" color="textSecondary">
                    {commit.author}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    ·
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {commit.timestamp}
                  </Typography>
                </Box>
              </Box>
              <Chip
                size="small"
                label={commit.hash.substring(0, 7)}
                variant="outlined"
                style={{
                  fontSize: 11,
                  height: 22,
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Simple README renderer (handles basic markdown)
// ---------------------------------------------------------------------------
const ReadmeRenderer = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;
  let tableMode = false;
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
    tableMode = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('|')) {
      tableMode = true;
      tableRows.push(
        line
          .split('|')
          .slice(1, -1),
      );
      i++;
      continue;
    }

    if (tableMode) {
      flushTable();
    }

    if (line.startsWith('# ')) {
      elements.push(
        <Typography
          key={i}
          variant="h5"
          style={{ fontWeight: 700, marginBottom: 8, marginTop: i > 0 ? 16 : 0 }}
        >
          {line.substring(2)}
        </Typography>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <Typography
          key={i}
          variant="h6"
          style={{ fontWeight: 600, marginBottom: 8, marginTop: 20 }}
        >
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
        <Paper
          key={`code-${elements.length}`}
          variant="outlined"
          style={{
            padding: 12,
            backgroundColor: '#1e1e1e',
            borderRadius: 8,
            margin: '8px 0',
            overflow: 'auto',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.5,
              color: '#d4d4d4',
              fontFamily: "'Consolas', monospace",
            }}
          >
            {codeLines.join('\n')}
          </pre>
        </Paper>,
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <Typography
          key={i}
          component="li"
          style={{ fontSize: 14, marginLeft: 16, marginBottom: 4 }}
        >
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
// Main Page
// ---------------------------------------------------------------------------
export const RepositoryDetailPage = () => {
  const { repoName } = useParams<{ repoName: string }>();
  const navigate = useNavigate();
  const classes = useProjectDetailStyles();
  const { hasRole } = useUserRoleContext();
  const [selectedTab, setSelectedTab] = useState(0);
  const [kebabAnchor, setKebabAnchor] = useState<null | HTMLElement>(null);

  const repo = useMemo(
    () => DISCOVERED_REPOS.find(r => r.name === repoName) || null,
    [repoName],
  );

  const handleTabChange = useCallback((index: number) => {
    setSelectedTab(index);
  }, []);

  if (!repo) {
    return (
      <Page themeId="app">
        <Header title="Repository not found" />
        <Content>
          <Box style={{ padding: 24 }}>
            <Typography variant="h6" gutterBottom>
              Repository &quot;{repoName}&quot; was not found.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() =>
                navigate('/self-service/repositories/list')
              }
              style={{ textTransform: 'none', marginTop: 16 }}
            >
              Back to Projects
            </Button>
          </Box>
        </Content>
      </Page>
    );
  }

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
            {repo.org}/{repo.name}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box className={classes.headerRow}>
          <Box className={classes.titleRow}>
            {repo.provider === 'github' ? (
              <GitHubIcon style={{ fontSize: 28, color: '#666' }} />
            ) : (
              <GitLabIcon style={{ fontSize: 28, color: '#e24329' }} />
            )}
            <Typography className={classes.titleText}>
              {repo.org}/{repo.name}
            </Typography>
          </Box>
          <Box className={classes.actionsRow}>
            {isDevSpacesConnected() && hasRole('developer') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<CodeIcon style={{ fontSize: 16 }} />}
                onClick={() => window.open(`${devSpacesMockupPath()}/#${repo.url}/tree/${repo.branch}`, '_blank')}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                Edit in Dev Spaces
              </Button>
            )}
            <IconButton size="small" onClick={e => setKebabAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={kebabAnchor}
              open={Boolean(kebabAnchor)}
              onClose={() => setKebabAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              getContentAnchorEl={null}
            >
              <MenuItem onClick={() => { window.open(repo.url, '_blank'); setKebabAnchor(null); }}>
                <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="View source" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => setKebabAnchor(null)}>
                <ListItemIcon>
                  <DeleteOutlineIcon fontSize="small" style={{ color: statusColors.error }} />
                </ListItemIcon>
                <ListItemText
                  primary="Remove"
                  primaryTypographyProps={{ style: { color: statusColors.error } }}
                />
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box className={classes.chipsRow}>
          <Chip
            size="small"
            icon={visibilityIcon(repo.visibility)}
            label={repo.visibility}
            variant="outlined"
            style={{ fontSize: 12, textTransform: 'capitalize' }}
          />
          <Chip
            size="small"
            label={repo.branch}
            variant="outlined"
            style={{ fontSize: 12, fontFamily: 'monospace' }}
          />
          {repo.resources.map(r => (
            <Chip
              key={r.type}
              size="small"
              label={`${r.count} ${resourceLabel(r.type).toLowerCase()}`}
              variant="outlined"
              style={{ fontSize: 12 }}
            />
          ))}
        </Box>

        {/* Tabs */}
        <HeaderTabs
          selectedIndex={selectedTab}
          onChange={handleTabChange}
          tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
        />

        {/* Tab content */}
        {selectedTab === 0 && <OverviewTab repo={repo} />}
        {selectedTab === 1 && <YamlTab repo={repo} />}
        {selectedTab === 2 && <CommitsTab repo={repo} />}
      </Content>
    </Page>
  );
};
