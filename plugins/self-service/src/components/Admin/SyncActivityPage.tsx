import { useState, useMemo, useCallback } from 'react';
import { Page, Header, Content, Table, TableColumn, Link } from '@backstage/core-components';
import {
  Box,
  Typography,
  Chip,
  Button,
  makeStyles,
  FormControl,
  Select,
  MenuItem as MuiMenuItem,
  Input,
  Paper,
  IconButton,
  Menu,
  ListItemText,
  Divider,
  ListSubheader,
} from '@material-ui/core';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import LoopIcon from '@material-ui/icons/Loop';
import WarningIcon from '@material-ui/icons/Warning';
import ScheduleIcon from '@material-ui/icons/Schedule';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import SettingsIcon from '@material-ui/icons/Settings';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { useNavigate } from 'react-router-dom';
import {
  DEMO_CONNECTIONS,
  DEMO_SYNC_HISTORY,
  SyncHistoryEntry,
  SyncStatus,
} from './syncDemoData';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  filterLabel: {
    marginTop: theme.spacing(2),
    fontWeight: 600,
    fontSize: '0.875rem',
    '&:first-child': {
      marginTop: 0,
    },
  },
  filterPaper: {
    padding: theme.spacing(1.5),
    borderRadius: 3,
  },
  summaryStrip: {
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2),
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  summaryChip: {
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.15s ease',
    '&:hover': {
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
    },
  },
  summaryChipActive: {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: 'none',
    },
  },
  summaryDot: {
    color: theme.palette.text.disabled,
    margin: theme.spacing(0, 0.5),
  },
  summaryNextSync: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginLeft: 'auto',
  },
  summaryNextSyncValue: {
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  statusChip: {
    fontWeight: 500,
    fontSize: 12,
  },
  enabledChip: {
    fontSize: 12,
    fontWeight: 500,
  },
  sourceLink: {
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  triggerCell: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  triggeredBy: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.3,
  },
}));

const StatusIcon = ({ status }: { status: SyncStatus }) => {
  switch (status) {
    case 'Completed':
      return <CheckCircleOutlineIcon style={{ color: statusColors.success, fontSize: 18 }} />;
    case 'Failed':
      return <ErrorOutlineIcon style={{ color: statusColors.error, fontSize: 18 }} />;
    case 'In Progress':
      return <LoopIcon style={{ color: statusColors.info, fontSize: 18 }} />;
    case 'Partial':
      return <WarningIcon style={{ color: statusColors.warning, fontSize: 18 }} />;
    default:
      return null;
  }
};

const statusColor = (status: SyncStatus): 'default' | 'primary' | 'secondary' => {
  if (status === 'Failed') return 'secondary';
  if (status === 'In Progress') return 'primary';
  return 'default';
};

const sourceToProviderId = (source: string): string | null => {
  switch (source) {
    case 'AAP': return 'aap';
    case 'GitHub': return 'github';
    case 'GitLab': return 'gitlab';
    default: return null;
  }
};

const sourceToProviderLink = (source: string): string | null => {
  const id = sourceToProviderId(source);
  if (!id) return null;
  const provider = DEMO_CONNECTIONS.find(c => c.id === id);
  if (!provider) return null;
  const base = '/self-service/admin/integrations';
  return `${base}/${id}`;
};

type HistoryFilter = {
  source: string;
  contentType: string;
  trigger: string;
  status: string;
};

const HistoryRowActions = ({ entry }: { entry: SyncHistoryEntry }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  return (
    <>
      <IconButton size="small" onClick={e => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        getContentAnchorEl={null}
      >
        <MuiMenuItem onClick={() => { setAnchorEl(null); navigate(`/self-service/admin/sync-activity/${entry.id}?tab=log`); }}>
          <ListItemText primary="View log" />
        </MuiMenuItem>
        {entry.status === 'Failed' && (
          <MuiMenuItem onClick={() => { setAnchorEl(null); console.log('Retry:', entry.id); }}>{/* eslint-disable-line no-console */}
            <ListItemText primary="Retry" />
          </MuiMenuItem>
        )}
        {entry.status === 'In Progress' && (
          <MuiMenuItem onClick={() => { setAnchorEl(null); console.log('Stop:', entry.id); }}>{/* eslint-disable-line no-console */}
            <ListItemText primary="Stop sync" primaryTypographyProps={{ style: { color: statusColors.error } }} />
          </MuiMenuItem>
        )}
        <Divider />
        <MuiMenuItem onClick={() => { setAnchorEl(null); const link = sourceToProviderLink(entry.source); if (link) navigate(link); }}>
          <ListItemText primary="View connection" />
        </MuiMenuItem>
      </Menu>
    </>
  );
};

const HistoryTab = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<HistoryFilter>({
    source: 'all',
    contentType: 'all',
    trigger: 'all',
    status: 'all',
  });

  const filtered = useMemo(() => {
    return DEMO_SYNC_HISTORY.filter(entry => {
      if (filters.source !== 'all' && entry.source !== filters.source) return false;
      if (filters.contentType !== 'all' && entry.contentType !== filters.contentType) return false;
      if (filters.trigger !== 'all' && entry.trigger !== filters.trigger) return false;
      if (filters.status !== 'all' && entry.status !== filters.status) return false;
      return true;
    });
  }, [filters]);

  const activeSyncs = DEMO_SYNC_HISTORY.filter(e => e.status === 'In Progress').length;
  const last24h = DEMO_SYNC_HISTORY.length;
  const failedCount = DEMO_SYNC_HISTORY.filter(e => e.status === 'Failed').length;
  const completedCount = DEMO_SYNC_HISTORY.filter(e => e.status === 'Completed').length;

  const toggleStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? 'all' : status,
    }));
  }, []);

  const columns: TableColumn<SyncHistoryEntry>[] = [
    {
      title: 'Sync Job',
      field: 'contentType',
      render: (row: SyncHistoryEntry) => (
        <Link
          to={`/self-service/admin/sync-activity/${row.id}`}
          className={classes.sourceLink}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {row.contentType}
        </Link>
      ),
    },
    {
      title: 'Source',
      field: 'source',
      render: (row: SyncHistoryEntry) => {
        const providerLink = sourceToProviderLink(row.source);
        return providerLink ? (
          <Link
            to={`${providerLink}?tab=sync`}
            className={classes.sourceLink}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {row.source}
          </Link>
        ) : (
          <Typography variant="body2">{row.source}</Typography>
        );
      },
    },
    {
      title: 'Trigger',
      field: 'trigger',
      render: (row: SyncHistoryEntry) => (
        <Box className={classes.triggerCell}>
          <Typography variant="body2">{row.trigger}</Typography>
          {row.triggeredBy && (
            <Typography className={classes.triggeredBy}>
              by {row.triggeredBy}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      title: 'Started',
      field: 'started',
      render: (row: SyncHistoryEntry) => (
        <Typography variant="body2" color="textSecondary">{row.started}</Typography>
      ),
    },
    {
      title: 'Duration',
      field: 'duration',
      render: (row: SyncHistoryEntry) => (
        <Typography variant="body2" color="textSecondary">{row.duration}</Typography>
      ),
    },
    {
      title: 'Status',
      field: 'status',
      render: (row: SyncHistoryEntry) => (
        <Chip
          icon={<StatusIcon status={row.status} />}
          label={row.status}
          size="small"
          color={statusColor(row.status)}
          variant="outlined"
          className={classes.statusChip}
        />
      ),
    },
    {
      title: 'Result',
      field: 'result',
      render: (row: SyncHistoryEntry) => (
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 13 }}>
          {row.result}
        </Typography>
      ),
    },
    {
      title: '',
      width: '48px',
      sorting: false,
      render: (row: SyncHistoryEntry) => <HistoryRowActions entry={row} />,
    },
  ];

  return (
    <CatalogFilterLayout>
      <CatalogFilterLayout.Filters>
        <Typography className={classes.filterLabel}>Source</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={filters.source}
              onChange={e => setFilters(prev => ({ ...prev, source: e.target.value as string }))}
              input={<Input disableUnderline />}
            >
              <MuiMenuItem value="all">All</MuiMenuItem>
              <MuiMenuItem value="AAP">AAP</MuiMenuItem>
              <MuiMenuItem value="GitHub">GitHub</MuiMenuItem>
              <MuiMenuItem value="GitLab">GitLab</MuiMenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Typography className={classes.filterLabel}>Content Type</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={filters.contentType}
              onChange={e => setFilters(prev => ({ ...prev, contentType: e.target.value as string }))}
              input={<Input disableUnderline />}
            >
              <MuiMenuItem value="all">All</MuiMenuItem>
              <MuiMenuItem value="Job Templates">Job Templates</MuiMenuItem>
              <MuiMenuItem value="Collections">Collections</MuiMenuItem>
              <MuiMenuItem value="Teams & Users">Teams & Users</MuiMenuItem>
              <MuiMenuItem value="EE Definitions">EE Definitions</MuiMenuItem>
              <MuiMenuItem value="Projects">Projects</MuiMenuItem>
              <MuiMenuItem value="Certified Content">Certified Content</MuiMenuItem>
              <MuiMenuItem value="Validated Content">Validated Content</MuiMenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Typography className={classes.filterLabel}>Trigger</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={filters.trigger}
              onChange={e => setFilters(prev => ({ ...prev, trigger: e.target.value as string }))}
              input={<Input disableUnderline />}
            >
              <MuiMenuItem value="all">All</MuiMenuItem>
              <MuiMenuItem value="Scheduled">Scheduled</MuiMenuItem>
              <MuiMenuItem value="Manual">Manual</MuiMenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Typography className={classes.filterLabel}>Status</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as string }))}
              input={<Input disableUnderline />}
            >
              <MuiMenuItem value="all">All</MuiMenuItem>
              <MuiMenuItem value="Completed">Completed</MuiMenuItem>
              <MuiMenuItem value="Failed">Failed</MuiMenuItem>
              <MuiMenuItem value="In Progress">In Progress</MuiMenuItem>
              <MuiMenuItem value="Partial">Partial</MuiMenuItem>
            </Select>
          </FormControl>
        </Paper>
      </CatalogFilterLayout.Filters>

      <CatalogFilterLayout.Content>
        <Box className={classes.summaryStrip}>
          <Chip
            icon={<LoopIcon style={{ fontSize: 16 }} />}
            label={`${activeSyncs} active now`}
            size="small"
            variant={filters.status === 'In Progress' ? 'default' : 'outlined'}
            className={`${classes.summaryChip} ${filters.status === 'In Progress' ? classes.summaryChipActive : ''}`}
            onClick={() => toggleStatusFilter('In Progress')}
          />
          <Chip
            icon={<CheckCircleOutlineIcon style={{ fontSize: 16 }} />}
            label={`${completedCount} completed`}
            size="small"
            variant={filters.status === 'Completed' ? 'default' : 'outlined'}
            className={`${classes.summaryChip} ${filters.status === 'Completed' ? classes.summaryChipActive : ''}`}
            onClick={() => toggleStatusFilter('Completed')}
          />
          <Chip
            icon={<ErrorOutlineIcon style={{ fontSize: 16 }} />}
            label={`${failedCount} failed`}
            size="small"
            variant={filters.status === 'Failed' ? 'default' : 'outlined'}
            className={`${classes.summaryChip} ${filters.status === 'Failed' ? classes.summaryChipActive : ''}`}
            onClick={() => toggleStatusFilter('Failed')}
          />
          <span className={classes.summaryDot}>·</span>
          <Typography variant="body2" style={{ fontSize: 13, color: 'inherit' }}>
            {last24h} syncs in last 24h
          </Typography>
          <Box className={classes.summaryNextSync}>
            <ScheduleIcon style={{ fontSize: 16 }} />
            Next sync: <span className={classes.summaryNextSyncValue}>AAP Job Templates in 4 min</span>
          </Box>
        </Box>

        <Table<SyncHistoryEntry>
          columns={columns}
          data={filtered}
          title={`${filtered.length} sync ${filtered.length === 1 ? 'event' : 'events'}`}
          options={{
            paging: true,
            pageSize: 10,
            pageSizeOptions: [5, 10, 20],
            emptyRowsWhenPaging: false,
            search: false,
            sorting: true,
            padding: 'dense',
            rowStyle: { cursor: 'pointer' },
          }}
          style={{ width: '100%', overflowX: 'hidden' }}
          onRowClick={(_event, rowData) => {
            if (rowData) {
              navigate(`/self-service/admin/sync-activity/${(rowData as SyncHistoryEntry).id}`);
            }
          }}
        />
      </CatalogFilterLayout.Content>
    </CatalogFilterLayout>
  );
};

// ---------------------------------------------------------------------------
// Sync settings dropdown — links to each provider's Sync tab
// ---------------------------------------------------------------------------

const SyncSettingsDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const connectionProviders = DEMO_CONNECTIONS.filter(c => c.type === 'aap');
  const integrationProviders = DEMO_CONNECTIONS.filter(c => c.type === 'git' || c.type === 'registry');

  const handleClick = (provider: typeof DEMO_CONNECTIONS[0]) => {
    setAnchorEl(null);
    const base = '/self-service/admin/integrations';
    navigate(`${base}/${provider.id}`);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<SettingsIcon style={{ fontSize: 16 }} />}
        endIcon={<ArrowDropDownIcon />}
        onClick={e => setAnchorEl(e.currentTarget)}
        style={{
          textTransform: 'none',
          fontSize: 13,
          fontWeight: 500,
          borderColor: 'rgba(255,255,255,0.3)',
          color: '#fff',
        }}
      >
        Sync settings
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        getContentAnchorEl={null}
        PaperProps={{ style: { minWidth: 240 } }}
      >
        <ListSubheader style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: '32px' }}>
          Automation platform
        </ListSubheader>
        {connectionProviders.map(p => {
          const isConfigured = p.status !== 'Not configured';
          return (
            <MuiMenuItem key={p.id} onClick={() => handleClick(p)}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <ListItemText
                  primary={p.name}
                  primaryTypographyProps={{ style: { fontSize: 13 } }}
                />
                {isConfigured ? (
                  <FiberManualRecordIcon style={{ fontSize: 8, color: statusColors.success, marginLeft: 8 }} />
                ) : (
                  <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8, whiteSpace: 'nowrap' }}>
                    Not configured
                  </Typography>
                )}
              </Box>
            </MuiMenuItem>
          );
        })}
        <Divider style={{ margin: '4px 0' }} />
        <ListSubheader style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: '32px' }}>
          Source control
        </ListSubheader>
        {integrationProviders.map(p => {
          const isConfigured = p.status !== 'Not configured';
          return (
            <MuiMenuItem key={p.id} onClick={() => handleClick(p)}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <ListItemText
                  primary={p.name}
                  primaryTypographyProps={{ style: { fontSize: 13 } }}
                />
                {isConfigured ? (
                  <FiberManualRecordIcon style={{ fontSize: 8, color: statusColors.success, marginLeft: 8 }} />
                ) : (
                  <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8, whiteSpace: 'nowrap' }}>
                    Not configured
                  </Typography>
                )}
              </Box>
            </MuiMenuItem>
          );
        })}
      </Menu>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main page — Activity only (schedules moved to per-connection detail pages)
// ---------------------------------------------------------------------------

export const SyncActivityPage = () => {
  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Sync
            <PageHelpIcon
              tooltipLabel="What is sync?"
              title="Sync"
              description="Monitor sync operations across all connected platforms. Use the Sync settings dropdown to jump to any provider's sync configuration."
            />
          </Box>
        }
        pageTitleOverride="Sync"
        subtitle="Monitor and manage sync operations across all connected platforms"
      >
        <SyncSettingsDropdown />
      </Header>
      <Content>
        <HistoryTab />
      </Content>
    </Page>
  );
};
