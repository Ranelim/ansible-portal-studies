import { useState, useMemo, useCallback } from 'react';
import { Page, Header, HeaderTabs, Content, Table, TableColumn, Link } from '@backstage/core-components';
import {
  Box,
  Typography,
  Chip,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@material-ui/core';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import LoopIcon from '@material-ui/icons/Loop';
import WarningIcon from '@material-ui/icons/Warning';
import ScheduleIcon from '@material-ui/icons/Schedule';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useNavigate } from 'react-router-dom';
import {
  DEMO_SYNC_HISTORY,
  DEMO_SYNC_SCHEDULES,
  SyncHistoryEntry,
  SyncScheduleEntry,
  SyncStatus,
} from './syncDemoData';

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
  editDialogField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  editFieldLabel: {
    fontSize: 14,
    fontWeight: 500,
  },
  editFieldSub: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
}));

const StatusIcon = ({ status }: { status: SyncStatus }) => {
  switch (status) {
    case 'Completed':
      return <CheckCircleOutlineIcon style={{ color: '#4caf50', fontSize: 18 }} />;
    case 'Failed':
      return <ErrorOutlineIcon style={{ color: '#f44336', fontSize: 18 }} />;
    case 'In Progress':
      return <LoopIcon style={{ color: '#1976d2', fontSize: 18 }} />;
    case 'Partial':
      return <WarningIcon style={{ color: '#ff9800', fontSize: 18 }} />;
    default:
      return null;
  }
};

const statusColor = (status: SyncStatus): 'default' | 'primary' | 'secondary' => {
  if (status === 'Failed') return 'secondary';
  if (status === 'In Progress') return 'primary';
  return 'default';
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
            <ListItemText primary="Stop sync" primaryTypographyProps={{ style: { color: '#f44336' } }} />
          </MuiMenuItem>
        )}
        <Divider />
        <MuiMenuItem onClick={() => { setAnchorEl(null); navigate('/self-service/admin/connections'); }}>
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
      title: 'Source',
      field: 'source',
      render: (row: SyncHistoryEntry) => (
        <Link
          to={`/self-service/admin/sync-activity/${row.id}`}
          className={classes.sourceLink}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {row.source}
        </Link>
      ),
    },
    {
      title: 'Content Type',
      field: 'contentType',
      render: (row: SyncHistoryEntry) => (
        <Typography variant="body2">{row.contentType}</Typography>
      ),
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
              <MuiMenuItem value="Private Automation Hub">Private Automation Hub</MuiMenuItem>
              <MuiMenuItem value="GitHub">GitHub</MuiMenuItem>
              <MuiMenuItem value="Public Registries">Public Registries</MuiMenuItem>
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
              <MuiMenuItem value="Job Run Logs">Job Run Logs</MuiMenuItem>
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

const INTERVAL_OPTIONS = [
  'Every 5 minutes',
  'Every 15 minutes',
  'Every 30 minutes',
  'Every 1 hour',
  'Every 6 hours',
  'Daily',
];

const EditScheduleDialog = ({
  entry,
  open,
  onClose,
}: {
  entry: SyncScheduleEntry | null;
  open: boolean;
  onClose: () => void;
}) => {
  const classes = useStyles();
  const [interval, setInterval] = useState(entry?.interval ?? '');

  if (!entry) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit sync schedule</DialogTitle>
      <DialogContent>
        <Box className={classes.editDialogField}>
          <Box>
            <Typography className={classes.editFieldLabel}>{entry.syncJob}</Typography>
            <Typography className={classes.editFieldSub}>{entry.source}</Typography>
          </Box>
        </Box>
        <Box mt={2}>
          <Typography className={classes.editFieldLabel} style={{ marginBottom: 8 }}>
            Sync interval
          </Typography>
          <FormControl fullWidth variant="outlined" size="small">
            <Select
              value={interval || entry.interval}
              onChange={e => setInterval(e.target.value as string)}
            >
              {INTERVAL_OPTIONS.map(opt => (
                <MuiMenuItem key={opt} value={opt}>{opt}</MuiMenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={onClose} style={{ textTransform: 'none' }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ScheduleRowActions = ({ entry }: { entry: SyncScheduleEntry }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <IconButton size="small" onClick={e => setAnchorEl(e.currentTarget)}>
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
        <MuiMenuItem onClick={() => { setAnchorEl(null); console.log('Run now:', entry.syncJob); }}>{/* eslint-disable-line no-console */}
          <ListItemText primary="Run now" />
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { setAnchorEl(null); setEditOpen(true); }}>
          <ListItemText primary="Edit schedule" />
        </MuiMenuItem>
        <Divider />
        <MuiMenuItem onClick={() => { setAnchorEl(null); console.log(entry.enabled ? 'Disable' : 'Enable', entry.syncJob); }}>{/* eslint-disable-line no-console */}
          <ListItemText
            primary={entry.enabled ? 'Disable' : 'Enable'}
            primaryTypographyProps={entry.enabled ? { style: { color: '#f44336' } } : undefined}
          />
        </MuiMenuItem>
        <Divider />
        <MuiMenuItem onClick={() => { setAnchorEl(null); navigate('/self-service/admin/connections'); }}>
          <ListItemText primary="View connection" />
        </MuiMenuItem>
      </Menu>
      <EditScheduleDialog entry={entry} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
};

const SchedulesTab = () => {
  const classes = useStyles();

  const columns: TableColumn<SyncScheduleEntry>[] = [
    {
      title: 'Source',
      field: 'source',
      render: (row: SyncScheduleEntry) => (
        <Typography variant="body2" style={{ fontWeight: 500 }}>{row.source}</Typography>
      ),
    },
    {
      title: 'Sync Job',
      field: 'syncJob',
      render: (row: SyncScheduleEntry) => (
        <Typography variant="body2">{row.syncJob}</Typography>
      ),
    },
    {
      title: 'Interval',
      field: 'interval',
      render: (row: SyncScheduleEntry) => (
        <Typography variant="body2">{row.interval}</Typography>
      ),
    },
    {
      title: 'Last Run',
      field: 'lastRun',
      render: (row: SyncScheduleEntry) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          {row.lastStatus === 'Failed' ? (
            <ErrorOutlineIcon style={{ color: '#f44336', fontSize: 16 }} />
          ) : (
            <CheckCircleOutlineIcon style={{ color: '#4caf50', fontSize: 16 }} />
          )}
          <Typography variant="body2" color="textSecondary">{row.lastRun}</Typography>
        </Box>
      ),
    },
    {
      title: 'Next Run',
      field: 'nextRun',
      render: (row: SyncScheduleEntry) => (
        <Typography variant="body2" color="textSecondary">{row.nextRun}</Typography>
      ),
    },
    {
      title: 'Status',
      field: 'enabled',
      render: (row: SyncScheduleEntry) => (
        <Chip
          label={row.enabled ? 'Active' : 'Disabled'}
          size="small"
          variant="outlined"
          className={classes.enabledChip}
          style={{
            color: row.enabled ? '#4caf50' : undefined,
            borderColor: row.enabled ? '#4caf50' : undefined,
          }}
        />
      ),
    },
    {
      title: '',
      width: '48px',
      sorting: false,
      render: (row: SyncScheduleEntry) => <ScheduleRowActions entry={row} />,
    },
  ];

  return (
    <Table<SyncScheduleEntry>
      columns={columns}
      data={DEMO_SYNC_SCHEDULES}
      title={`${DEMO_SYNC_SCHEDULES.length} scheduled sync jobs`}
      options={{
        paging: false,
        search: false,
        sorting: true,
        padding: 'dense',
      }}
      style={{ width: '100%', overflowX: 'hidden' }}
    />
  );
};

const pageTabs = [
  { id: 0, label: 'History' },
  { id: 1, label: 'Schedules' },
];

export const SyncActivityPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <Page themeId="app">
      <Header
        title="Sync Activity"
        subtitle="Monitor background sync operations across all connected platforms"
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={setSelectedTab}
        tabs={pageTabs.map(t => ({ id: t.label.toLowerCase(), label: t.label }))}
      />
      <Content>
        {selectedTab === 0 ? <HistoryTab /> : <SchedulesTab />}
      </Content>
    </Page>
  );
};
