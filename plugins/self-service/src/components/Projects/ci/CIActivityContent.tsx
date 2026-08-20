import { useState, useMemo } from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import {
  Box,
  Typography,
  makeStyles,
  Chip,
  Link,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  Input,
  Paper,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import CancelIcon from '@material-ui/icons/Cancel';
import ScheduleIcon from '@material-ui/icons/Schedule';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import VerifiedUserOutlinedIcon from '@material-ui/icons/VerifiedUserOutlined';
import CodeIcon from '@material-ui/icons/Code';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import { statusColors } from '../../common/statusColors';
import { DEVSPACES_BASE_URL } from '../../Admin/syncDemoData';
import { isDevSpacesConnected } from '../../../hooks/devSpacesSetup';

type CIRunStatus = 'success' | 'failure' | 'running' | 'cancelled' | 'queued';

type CIRun = {
  id: string;
  status: CIRunStatus;
  project: string;
  provider: 'github' | 'gitlab';
  workflow: string;
  runNumber: number;
  trigger: string;
  branch: string;
  time: string;
  duration: string;
  url: string;
};

const DEMO_RUNS: CIRun[] = [
  {
    id: '1',
    status: 'failure',
    project: 'acme-corp/rhel-patching',
    provider: 'github',
    workflow: 'Quality Scan',
    runNumber: 287,
    trigger: 'push',
    branch: 'main',
    time: '12 minutes ago',
    duration: '0m 38s',
    url: '#',
  },
  {
    id: '2',
    status: 'failure',
    project: 'acme-corp/rhel-patching',
    provider: 'github',
    workflow: 'Ansible Lint',
    runNumber: 286,
    trigger: 'push',
    branch: 'main',
    time: '12 minutes ago',
    duration: '2m 14s',
    url: '#',
  },
  {
    id: '3',
    status: 'success',
    project: 'acme-corp/rhel-patching',
    provider: 'github',
    workflow: 'Integration Tests',
    runNumber: 285,
    trigger: 'push',
    branch: 'main',
    time: '25 minutes ago',
    duration: '8m 42s',
    url: '#',
  },
  {
    id: '4',
    status: 'failure',
    project: 'acme-corp/network-firewall-rules',
    provider: 'gitlab',
    workflow: 'Quality Scan',
    runNumber: 54,
    trigger: 'push',
    branch: 'feature/add-zones',
    time: '1 day ago',
    duration: '0m 42s',
    url: '#',
  },
  {
    id: '5',
    status: 'running',
    project: 'acme-corp/network-firewall-rules',
    provider: 'gitlab',
    workflow: 'Policy Check',
    runNumber: 55,
    trigger: 'push',
    branch: 'feature/add-zones',
    time: '3 minutes ago',
    duration: '1m 30s',
    url: '#',
  },
  {
    id: '6',
    status: 'success',
    project: 'acme-corp/cloud-provisioner',
    provider: 'github',
    workflow: 'Quality Scan',
    runNumber: 103,
    trigger: 'push',
    branch: 'main',
    time: '4 hours ago',
    duration: '0m 22s',
    url: '#',
  },
  {
    id: '7',
    status: 'success',
    project: 'acme-corp/cloud-provisioner',
    provider: 'github',
    workflow: 'Ansible Lint',
    runNumber: 102,
    trigger: 'schedule',
    branch: 'main',
    time: '1 hour ago',
    duration: '1m 48s',
    url: '#',
  },
  {
    id: '8',
    status: 'success',
    project: 'acme-corp/cloud-provisioner',
    provider: 'github',
    workflow: 'EE Build',
    runNumber: 41,
    trigger: 'push',
    branch: 'main',
    time: '1 hour ago',
    duration: '4m 12s',
    url: '#',
  },
  {
    id: '9',
    status: 'failure',
    project: 'acme-corp/backup-automation',
    provider: 'gitlab',
    workflow: 'Quality Scan',
    runNumber: 20,
    trigger: 'schedule',
    branch: 'main',
    time: '3 days ago',
    duration: '1m 15s',
    url: '#',
  },
  {
    id: '10',
    status: 'cancelled',
    project: 'acme-corp/backup-automation',
    provider: 'gitlab',
    workflow: 'Integration Tests',
    runNumber: 19,
    trigger: 'manual',
    branch: 'dev',
    time: '2 hours ago',
    duration: '0m 45s',
    url: '#',
  },
  {
    id: '11',
    status: 'failure',
    project: 'acme-corp/backup-automation',
    provider: 'gitlab',
    workflow: 'Ansible Lint',
    runNumber: 88,
    trigger: 'push',
    branch: 'main',
    time: '3 hours ago',
    duration: '1m 02s',
    url: '#',
  },
  {
    id: '12',
    status: 'success',
    project: 'acme-corp/network-firewall-rules',
    provider: 'gitlab',
    workflow: 'Ansible Lint',
    runNumber: 53,
    trigger: 'push',
    branch: 'main',
    time: '4 hours ago',
    duration: '1m 22s',
    url: '#',
  },
  {
    id: '13',
    status: 'success',
    project: 'acme-corp/rhel-patching',
    provider: 'github',
    workflow: 'EE Build',
    runNumber: 67,
    trigger: 'push',
    branch: 'main',
    time: '5 hours ago',
    duration: '6m 01s',
    url: '#',
  },
  {
    id: '14',
    status: 'queued',
    project: 'acme-corp/cloud-provisioner',
    provider: 'github',
    workflow: 'Integration Tests',
    runNumber: 22,
    trigger: 'push',
    branch: 'feature/aws-regions',
    time: '1 minute ago',
    duration: '—',
    url: '#',
  },
  {
    id: '15',
    status: 'success',
    project: 'acme-corp/rhel-patching',
    provider: 'github',
    workflow: 'Quality Scan',
    runNumber: 280,
    trigger: 'schedule',
    branch: 'main',
    time: '1 day ago',
    duration: '0m 35s',
    url: '#',
  },
];

const useStyles = makeStyles(theme => ({
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  spinIcon: {
    animation: '$spin 1.5s linear infinite',
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  projectCell: {
    fontWeight: 500,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': { textDecoration: 'underline' },
  },
  triggerChip: {
    fontSize: 10,
    height: 18,
    fontWeight: 500,
  },
  externalLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: theme.palette.primary.main,
    fontSize: 13,
    '&:hover': { textDecoration: 'underline' },
  },
  filterLabel: {
    marginTop: theme.spacing(2),
    fontWeight: 600,
    fontSize: '0.875rem',
    '&:first-child': { marginTop: 0 },
  },
  filterPaper: {
    padding: theme.spacing(1.5),
    borderRadius: 3,
  },
}));

const StatusIcon = ({ status }: { status: CIRunStatus }) => {
  const classes = useStyles();
  switch (status) {
    case 'success':
      return <CheckCircleIcon style={{ fontSize: 18, color: statusColors.success }} />;
    case 'failure':
      return <ErrorIcon style={{ fontSize: 18, color: statusColors.error }} />;
    case 'running':
      return <AutorenewIcon style={{ fontSize: 18, color: statusColors.info }} className={classes.spinIcon} />;
    case 'cancelled':
      return <CancelIcon style={{ fontSize: 18, color: '#999' }} />;
    case 'queued':
      return <ScheduleIcon style={{ fontSize: 18, color: statusColors.warning }} />;
  }
};

const STATUS_LABELS: Record<CIRunStatus, string> = {
  success: 'Success',
  failure: 'Failure',
  running: 'Running',
  cancelled: 'Cancelled',
  queued: 'Queued',
};

const WORKFLOW_OPTIONS = Array.from(new Set(DEMO_RUNS.map(r => r.workflow))).sort();

export const CIActivityContent = () => {
  const classes = useStyles();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CIRunStatus>('all');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  const filteredRuns = useMemo(() => {
    let result = DEMO_RUNS;
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        r => r.project.toLowerCase().includes(lower) || r.workflow.toLowerCase().includes(lower),
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (triggerFilter !== 'all') {
      result = result.filter(r => r.trigger === triggerFilter);
    }
    if (workflowFilter !== 'all') {
      result = result.filter(r => r.workflow === workflowFilter);
    }
    return result;
  }, [searchText, statusFilter, triggerFilter, workflowFilter]);

  const columns: TableColumn<CIRun>[] = [
    {
      title: 'Status',
      field: 'status',
      width: '120px',
      render: (row: CIRun) => (
        <Box className={classes.statusCell}>
          <StatusIcon status={row.status} />
          <Typography variant="body2">{STATUS_LABELS[row.status]}</Typography>
        </Box>
      ),
    },
    {
      title: 'Workflow',
      render: (row: CIRun) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          {row.workflow === 'Quality Scan' && (
            <VerifiedUserOutlinedIcon style={{ fontSize: 15, color: row.status === 'failure' ? statusColors.error : statusColors.success }} />
          )}
          <Link className={classes.externalLink} href={row.url} target="_blank" rel="noopener">
            {row.workflow} #{row.runNumber}
            <OpenInNewIcon style={{ fontSize: 12 }} />
          </Link>
        </Box>
      ),
    },
    {
      title: 'Repository',
      field: 'project',
      render: (row: CIRun) => (
        <Typography variant="body2" className={classes.projectCell}>
          {row.project}
        </Typography>
      ),
    },
    {
      title: 'Branch',
      field: 'branch',
      render: (row: CIRun) => (
        <Typography variant="body2" style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {row.branch}
        </Typography>
      ),
    },
    {
      title: 'Trigger',
      field: 'trigger',
      width: '100px',
      render: (row: CIRun) => (
        <Chip size="small" label={row.trigger} className={classes.triggerChip} variant="outlined" />
      ),
    },
    {
      title: 'Duration',
      field: 'duration',
      width: '90px',
    },
    {
      title: 'Time',
      field: 'time',
      width: '120px',
    },
    ...(isDevSpacesConnected() ? [{
      title: '',
      field: 'actions' as keyof CIRun,
      width: '48px',
      sorting: false,
      render: (row: CIRun) => row.status === 'failure' ? (
        <Tooltip title="Edit in Dev Spaces" arrow>
          <IconButton size="small"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.open(`${DEVSPACES_BASE_URL}/#https://github.com/${row.project}/tree/${row.branch}`, '_blank'); }}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #d2d2d2', background: '#fafafa' }}>
            <CodeIcon style={{ fontSize: 16, color: '#6a6e73' }} />
          </IconButton>
        </Tooltip>
      ) : null,
    }] as TableColumn<CIRun>[] : []),
  ];

  return (
    <CatalogFilterLayout>
      <CatalogFilterLayout.Filters>
        <TextField
          placeholder="Search runs..."
          variant="standard"
          fullWidth
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" />
              </InputAdornment>
            ),
            endAdornment: searchText ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchText('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Typography className={classes.filterLabel}>Status</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              input={<Input disableUnderline />}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failure">Failure</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Typography className={classes.filterLabel}>Workflow</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={workflowFilter}
              onChange={e => setWorkflowFilter(e.target.value as string)}
              input={<Input disableUnderline />}
            >
              <MenuItem value="all">All</MenuItem>
              {WORKFLOW_OPTIONS.map(w => (
                <MenuItem key={w} value={w}>{w}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        <Typography className={classes.filterLabel}>Trigger</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={triggerFilter}
              onChange={e => setTriggerFilter(e.target.value as string)}
              input={<Input disableUnderline />}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="push">Push</MenuItem>
              <MenuItem value="schedule">Schedule</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </CatalogFilterLayout.Filters>

      <CatalogFilterLayout.Content>
        <Box>
          <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 4 }}>
            {filteredRuns.length} {filteredRuns.length === 1 ? 'run' : 'runs'}
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16, fontSize: 12 }}>
            CI/CD pipeline runs across all repositories
          </Typography>
        </Box>
        <Table<CIRun>
          columns={columns}
          data={filteredRuns}
          title=""
          options={{
            paging: true,
            pageSize: 10,
            pageSizeOptions: [10, 20, 50],
            emptyRowsWhenPaging: false,
            search: false,
            sorting: true,
            padding: 'dense',
          }}
          style={{ width: '100%' }}
        />
      </CatalogFilterLayout.Content>
    </CatalogFilterLayout>
  );
};
