import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  identityApiRef,
  useApi,
  useRouteRef,
} from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  ScaffolderTask,
} from '@backstage/plugin-scaffolder-react';
import { TablePaginationActionsProps } from '@material-ui/core/TablePagination/TablePaginationActions';
import { useNavigate } from 'react-router-dom';
import { Content, Header, Page } from '@backstage/core-components';
import {
  Box,
  Chip,
  Grid,
  IconButton,
  InputBase,
  Link,
  makeStyles,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Button,
  useTheme,
} from '@material-ui/core';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import BlockIcon from '@material-ui/icons/Block';
import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { rootRouteRef } from '../../routes';
import { useAsync } from 'react-use';

const headerStyles = makeStyles(theme => ({
  header_title_color: {
    color: theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
  },
  header_subtitle: {
    display: 'inline-block',
    color: theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
    opacity: 0.8,
    maxWidth: '75ch',
    marginTop: '8px',
    fontWeight: 500,
    lineHeight: 1.57,
  },
}));

export interface MyTaskPageProps {
  initiallySelectedFilter?: 'owned' | 'all';
  contextMenu?: {
    editor?: boolean;
    actions?: boolean;
    create?: boolean;
  };
}

type Filters = {
  owner: 'all' | 'owned' | undefined;
};

function TablePaginationActions(props: TablePaginationActionsProps) {
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton>
    </Box>
  );
}

export const TaskList = () => {
  const classes = headerStyles();
  const scaffolderApi = useApi(scaffolderApiRef);
  const identityApi = useApi(identityApiRef);

  const { value: isAdmin, loading: adminLoading } = useAsync(async () => {
    const identity = await identityApi.getBackstageIdentity();

    // Check if user is member of admin groups
    const adminGroups = [
      'group:default/admins',
      'group:default/rbac_admin',
      'group:default/portal-admins',
      'group:default/portal_admins',
    ];
    return identity.ownershipEntityRefs.some(ref =>
      adminGroups.includes(ref.toLowerCase()),
    );
  }, []);
  const [tasks, setTasks] = useState<ScaffolderTask[]>([]);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [filters, setFilters] = useState<Filters>({
    owner: 'owned',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rootLink = useRouteRef(rootRouteRef);

  const demoTasks: ScaffolderTask[] = useMemo(() => [
    {
      id: 'demo-ee-success',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/build-ee-rhel9',
          entity: {
            metadata: { name: 'build-ee-rhel9', title: 'Build Execution Environment (RHEL 9)' },
            spec: { type: 'execution-environment' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'completed',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-project-success',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/create-ansible-project',
          entity: {
            metadata: { name: 'create-ansible-project', title: 'Create Ansible Project' },
            spec: { type: 'project' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'completed',
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-workflow-approval',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/employee-onboarding-workflow',
          entity: {
            metadata: { name: 'employee-onboarding-workflow', title: 'Employee Onboarding Workflow' },
            spec: { type: 'workflow-job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'processing',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
      stepLogs: {
        'launch-workflow': ['Workflow is awaiting approval at node "Manager Approval".'],
      },
    } as unknown as ScaffolderTask,
    {
      id: 'demo-workflow-denied',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/employee-onboarding-workflow',
          entity: {
            metadata: { name: 'employee-onboarding-workflow', title: 'Employee Onboarding Workflow' },
            spec: { type: 'workflow-job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'failed',
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-workflow-approved',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/employee-onboarding-workflow',
          entity: {
            metadata: { name: 'employee-onboarding-workflow', title: 'Employee Onboarding Workflow' },
            spec: { type: 'workflow-job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'completed',
      createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-project-failed',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/provision-cloud-infra',
          entity: {
            metadata: { name: 'provision-cloud-infra', title: 'Provision Cloud Infrastructure' },
            spec: { type: 'project' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'failed',
      createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-job-completing',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/deploy-database-update',
          entity: {
            metadata: { name: 'deploy-database-update', title: 'Deploy Database Update' },
            spec: { type: 'job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'completed',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-job-running',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/deploy-database-update',
          entity: {
            metadata: { name: 'deploy-database-update', title: 'Deploy Database Update' },
            spec: { type: 'job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'processing',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-job-failed',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/deploy-database-update',
          entity: {
            metadata: { name: 'deploy-database-update', title: 'Deploy Database Update' },
            spec: { type: 'job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'failed',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-patching-completed',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/rhel-server-patching',
          entity: {
            metadata: { name: 'rhel-server-patching', title: 'RHEL Server Patching' },
            spec: { type: 'job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'completed',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-aws-workflow-approval',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/aws-provisioning-workflow',
          entity: {
            metadata: { name: 'aws-provisioning-workflow', title: 'AWS Provisioning Workflow' },
            spec: { type: 'workflow-job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'processing',
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-aws-workflow-approved',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/aws-provisioning-workflow',
          entity: {
            metadata: { name: 'aws-provisioning-workflow', title: 'AWS Provisioning Workflow' },
            spec: { type: 'workflow-job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'completed',
      createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-aws-workflow-denied',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/aws-provisioning-workflow',
          entity: {
            metadata: { name: 'aws-provisioning-workflow', title: 'AWS Provisioning Workflow' },
            spec: { type: 'workflow-job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'failed',
      createdAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-workflow-partial-failure',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/aws-provisioning-workflow',
          entity: {
            metadata: { name: 'aws-provisioning-workflow', title: 'AWS Provisioning Workflow' },
            spec: { type: 'workflow-job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'failed',
      createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
    {
      id: 'demo-workflow-running',
      spec: {
        apiVersion: 'scaffolder.backstage.io/v1beta3',
        steps: [],
        parameters: {},
        templateInfo: {
          entityRef: 'template:default/aws-provisioning-workflow',
          entity: {
            metadata: { name: 'aws-provisioning-workflow', title: 'AWS Provisioning Workflow' },
            spec: { type: 'workflow-job-template' },
          } as any,
        },
        user: { entity: { metadata: { title: 'Guest User' } } as any },
      },
      status: 'processing',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      createdBy: 'user:default/guest',
    } as unknown as ScaffolderTask,
  ], []);

  const fetchTasks = useCallback(async () => {
    if (!scaffolderApi?.listTasks) {
      setError(new Error('listTasks method is not available on scaffolderApi'));
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const response = await scaffolderApi.listTasks({
        filterByOwnership: filters.owner ?? 'all',
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });
      const combined = [...demoTasks, ...response.tasks];
      setTasks(combined);
      setTotalTasks((response.totalTasks ? Number(response.totalTasks) : 0) + demoTasks.length);
    } catch (e) {
      setTasks(demoTasks);
      setTotalTasks(demoTasks.length);
    } finally {
      setLoading(false);
    }
  }, [filters, page, rowsPerPage, scaffolderApi, demoTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!adminLoading) {
      setFilters(prevFilters => ({
        ...prevFilters,
        owner: isAdmin ? 'all' : 'owned',
      }));
      setPage(0);
    }
  }, [adminLoading, isAdmin]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCustomDate = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    }).format(date);
  };

  const typeLabels: Record<string, string> = {
    'workflow-job-template': 'Workflow template',
    'job-template': 'Job template',
    service: 'Job template',
    project: 'Project',
    'execution-environment': 'Execution environment',
  };

  const getTemplateType = (task: ScaffolderTask): string => {
    const specType = (
      task.spec?.templateInfo?.entity as
        | { spec?: { type?: string } }
        | undefined
    )?.spec?.type;
    if (specType && typeLabels[specType]) return typeLabels[specType];
    if (specType) return specType;
    return 'Template';
  };

  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';

  const navigate = useNavigate();
  const navigateToTaskDetails = (id: string) => {
    navigate(`${rootLink()}/create/tasks/${id}`, {
      state: { from: 'activity' },
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [typeAnchor, setTypeAnchor] = useState<null | HTMLElement>(null);
  const [statusAnchor, setStatusAnchor] = useState<null | HTMLElement>(null);

  const typeOptions = [
    { value: 'Execution environment', label: 'Execution environment' },
    { value: 'Project', label: 'Project' },
    { value: 'Job template', label: 'Job template' },
    { value: 'Workflow template', label: 'Workflow template' },
  ];
  const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'processing', label: 'Running' },
    { value: 'awaiting_approval', label: 'Awaiting approval' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type],
    );
    setPage(0);
  };
  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status],
    );
    setPage(0);
  };

  const hasActiveFilters = searchQuery.length > 0 || selectedTypes.length > 0 || selectedStatuses.length > 0;

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const name = (
        task.spec?.templateInfo?.entity?.metadata?.title ||
        task.spec?.templateInfo?.entity?.metadata?.name ||
        ''
      ).toLowerCase();
      const taskId = task.id.toLowerCase();
      if (searchQuery && !name.includes(searchQuery.toLowerCase()) && !taskId.includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedTypes.length > 0) {
        const taskType = getTemplateType(task);
        if (!selectedTypes.includes(taskType)) return false;
      }
      if (selectedStatuses.length > 0) {
        const effectiveStatus = getEffectiveStatus(task);
        if (!selectedStatuses.includes(effectiveStatus)) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, selectedTypes, selectedStatuses]);

  const getEffectiveStatus = (task: ScaffolderTask): string => {
    if (task.status === 'processing') {
      const logs = Object.values((task as any).stepLogs ?? {}).flat() as string[];
      const outputStr = logs.join(' ').toLowerCase();
      if (
        outputStr.includes('awaiting approval') ||
        outputStr.includes('waiting') ||
        outputStr.includes('approval')
      ) {
        return 'awaiting_approval';
      }
    }
    return task.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'failed':
        return <ErrorOutlineIcon style={{ color: '#f44336' }} />;
      case 'completed':
        return <CheckCircleOutlineIcon style={{ color: '#4caf50' }} />;
      case 'processing':
        return <PlayCircleOutlineIcon style={{ color: '#42a5f5' }} />;
      case 'awaiting_approval':
        return <PauseCircleOutlineIcon style={{ color: '#ff9800' }} />;
      case 'open':
        return <AddCircleOutlineIcon style={{ color: '#42a5f5' }} />;
      case 'cancelled':
        return <BlockIcon style={{ color: '#ff9800' }} />;
      default:
        return <></>;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'processing':
        return 'Running';
      case 'awaiting_approval':
        return 'Awaiting approval';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'open':
        return 'Open';
      default:
        return status;
    }
  };

  return (
    <Page themeId="tool">
      <Header
        pageTitleOverride="Activity"
        title={
          <span data-testid="taskHeader" className={classes.header_title_color}>
            Activity
          </span>
        }
        subtitle={
          <span className={classes.header_subtitle}>
            Track your active and completed automation tasks.
          </span>
        }
        style={{ background: 'inherit' }}
      />
      <Content>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12}>
            {loading && <Typography variant="body1">Loading...</Typography>}
            {!loading && error && (
              <Typography color="error" variant="body1">
                Error: {error.message}
              </Typography>
            )}
            {!loading && !error && (
              <Box>
                {/* Toolbar — search + filters */}
                <Box
                  display="flex"
                  alignItems="center"
                  style={{
                    gap: 8,
                    padding: '8px 0',
                    flexWrap: 'wrap',
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    style={{
                      flex: '1 1 240px',
                      maxWidth: 360,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)'}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'transparent',
                    }}
                  >
                    <SearchIcon style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontSize: 20, marginRight: 6 }} />
                    <InputBase
                      placeholder="Search by name or task ID"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                      style={{ flex: 1, fontSize: 14, color: 'inherit' }}
                      inputProps={{ 'aria-label': 'Search tasks' }}
                    />
                    {searchQuery && (
                      <IconButton size="small" onClick={() => { setSearchQuery(''); setPage(0); }} aria-label="Clear search">
                        <CloseIcon style={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={e => setTypeAnchor(e.currentTarget)}
                    endIcon={<ArrowDropDownIcon />}
                    style={{
                      textTransform: 'none',
                      fontSize: 13,
                      borderColor: selectedTypes.length > 0 ? theme.palette.primary.main : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)'),
                      color: isDark ? '#ffffff' : 'inherit',
                    }}
                  >
                    Type{selectedTypes.length > 0 ? ` (${selectedTypes.length})` : ''}
                  </Button>
                  <Menu
                    anchorEl={typeAnchor}
                    open={Boolean(typeAnchor)}
                    onClose={() => setTypeAnchor(null)}
                    PaperProps={{ style: { minWidth: 200 } }}
                  >
                    {typeOptions.map(opt => (
                      <MenuItem key={opt.value} dense onClick={() => toggleType(opt.value)}>
                        <Checkbox
                          checked={selectedTypes.includes(opt.value)}
                          size="small"
                          color="primary"
                          style={{ padding: '2px 8px 2px 0' }}
                        />
                        <ListItemText primary={opt.label} />
                      </MenuItem>
                    ))}
                  </Menu>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={e => setStatusAnchor(e.currentTarget)}
                    endIcon={<ArrowDropDownIcon />}
                    style={{
                      textTransform: 'none',
                      fontSize: 13,
                      borderColor: selectedStatuses.length > 0 ? theme.palette.primary.main : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)'),
                      color: isDark ? '#ffffff' : 'inherit',
                    }}
                  >
                    Status{selectedStatuses.length > 0 ? ` (${selectedStatuses.length})` : ''}
                  </Button>
                  <Menu
                    anchorEl={statusAnchor}
                    open={Boolean(statusAnchor)}
                    onClose={() => setStatusAnchor(null)}
                    PaperProps={{ style: { minWidth: 200 } }}
                  >
                    {statusOptions.map(opt => (
                      <MenuItem key={opt.value} dense onClick={() => toggleStatus(opt.value)}>
                        <Checkbox
                          checked={selectedStatuses.includes(opt.value)}
                          size="small"
                          color="primary"
                          style={{ padding: '2px 8px 2px 0' }}
                        />
                        <ListItemText primary={opt.label} />
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>

                {/* Active filter chips */}
                {hasActiveFilters && (
                  <Box display="flex" alignItems="center" style={{ gap: 6, padding: '4px 0 8px', flexWrap: 'wrap' }}>
                    {selectedTypes.map(t => (
                      <Chip
                        key={`type-${t}`}
                        label={t}
                        size="small"
                        onDelete={() => toggleType(t)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {selectedStatuses.map(s => (
                      <Chip
                        key={`status-${s}`}
                        label={statusOptions.find(o => o.value === s)?.label || s}
                        size="small"
                        onDelete={() => toggleStatus(s)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {searchQuery && (
                      <Chip
                        label={`"${searchQuery}"`}
                        size="small"
                        onDelete={() => { setSearchQuery(''); setPage(0); }}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    <Button
                      size="small"
                      onClick={() => { setSearchQuery(''); setSelectedTypes([]); setSelectedStatuses([]); setPage(0); }}
                      style={{ textTransform: 'none', fontSize: 12, minWidth: 'auto', padding: '2px 8px' }}
                    >
                      Clear all filters
                    </Button>
                  </Box>
                )}

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Run</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Created at</TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTasks
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(task => {
                        const displayName =
                          task.spec?.templateInfo?.entity?.metadata?.title ||
                          task.spec?.templateInfo?.entity?.metadata?.name ||
                          'Untitled';
                        const shortTaskId = task.id.length > 8 ? task.id.substring(0, 8) : task.id;
                        const templateTypeLabel = getTemplateType(task);
                        return (
                        <TableRow
                          key={task.id}
                          hover
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigateToTaskDetails(task.id)}
                        >
                          <TableCell>
                            <Link
                              component="button"
                              variant="body2"
                              onClick={e => {
                                e.stopPropagation();
                                navigateToTaskDetails(task.id);
                              }}
                              style={{ textDecoration: 'none', textAlign: 'left' }}
                            >
                              {displayName}
                            </Link>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              display="block"
                            >
                              Task {shortTaskId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {templateTypeLabel}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatCustomDate(task.createdAt)}
                          </TableCell>
                          <TableCell>
                            {task.spec?.user?.entity?.metadata?.title}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const effectiveStatus = getEffectiveStatus(task);
                              return (
                                <Box
                                  display="flex"
                                  alignItems="center"
                                >
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    marginRight={1}
                                  >
                                    {getStatusIcon(effectiveStatus)}
                                  </Box>
                                  {getStatusLabel(effectiveStatus)}
                                </Box>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                        );
                      })}
                      {filteredTasks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Box paddingY={4}>
                              <Typography variant="body1" color="textSecondary">
                                {hasActiveFilters ? 'No tasks match the current filters.' : 'No tasks found.'}
                              </Typography>
                              {hasActiveFilters && (
                                <Button
                                  size="small"
                                  color="primary"
                                  onClick={() => { setSearchQuery(''); setSelectedTypes([]); setSelectedStatuses([]); setPage(0); }}
                                  style={{ textTransform: 'none', marginTop: 8 }}
                                >
                                  Clear all filters
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={filteredTasks.length}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    ActionsComponent={TablePaginationActions}
                    data-testid="tableToolBar"
                  />
                </TableContainer>
              </Box>
            )}
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
