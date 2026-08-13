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
  CircularProgress,
} from '@material-ui/core';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import LoopIcon from '@material-ui/icons/Loop';
import WarningIcon from '@material-ui/icons/Warning';
import ScheduleIcon from '@material-ui/icons/Schedule';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import SettingsIcon from '@material-ui/icons/Settings';
import SyncIcon from '@material-ui/icons/Sync';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  DEMO_CONNECTIONS,
  DEMO_SYNC_HISTORY,
  SyncHistoryEntry,
  SyncStatus,
} from './syncDemoData';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { statusColors } from '../common/statusColors';
import {
  SyncErrorModal,
  type SyncEntityStatus,
} from './SyncErrorModal';
import { useAdminSyncIa } from './useAdminSyncIa';
import { RunSyncScopeDialog } from './RunSyncScopeDialog';

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
    case 'Private Automation Hub': return 'pah';
    case 'GitHub': return 'github';
    case 'GitLab': return 'gitlab';
    case 'Public Registries': return 'registries';
    default: return null;
  }
};

const sourceToProviderLink = (source: string): string | null => {
  const id = sourceToProviderId(source);
  if (!id) return null;
  return `/self-service/admin/integrations/${id}?tab=sync`;
};

type HistoryFilter = {
  source: string;
  contentType: string;
  trigger: string;
  status: string;
};

function syncNowLabel(source: string): string {
  if (source === 'all') return 'Sync all now';
  if (source === 'Private Automation Hub') return 'Sync Hub now';
  if (source === 'Public Registries') return 'Sync registries now';
  return `Sync ${source} now`;
}

function entryToErrorEntity(entry: SyncHistoryEntry): SyncEntityStatus {
  return {
    source: entry.source,
    entity: entry.contentType,
    lastSync: entry.started,
    lastSyncDuration: entry.duration,
    interval: 'See provider Sync settings',
    errorDetail: entry.errorDetail ?? entry.result,
    errorTrace: entry.logLines?.join('\n'),
    providerId: sourceToProviderId(entry.source) ?? undefined,
  };
}

const HistoryRowActions = ({
  entry,
  onViewFailure,
}: {
  entry: SyncHistoryEntry;
  onViewFailure: (entry: SyncHistoryEntry) => void;
}) => {
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
          <MuiMenuItem
            onClick={() => {
              setAnchorEl(null);
              onViewFailure(entry);
            }}
          >
            <ListItemText primary="View details" />
          </MuiMenuItem>
        )}
        {entry.status === 'Failed' && (
          <MuiMenuItem onClick={() => { setAnchorEl(null); onViewFailure(entry); }}>
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

const HistoryTab = ({
  sourceFilter,
  onSourceFilterChange,
  onViewFailure,
}: {
  sourceFilter: string;
  onSourceFilterChange: (source: string) => void;
  onViewFailure: (entry: SyncHistoryEntry) => void;
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<HistoryFilter>({
    source: sourceFilter,
    contentType: 'all',
    trigger: 'all',
    status: 'all',
  });

  // Keep sidebar Source filter in sync with header Sync button scope.
  const effectiveFilters = { ...filters, source: sourceFilter };

  const filtered = useMemo(() => {
    return DEMO_SYNC_HISTORY.filter(entry => {
      if (effectiveFilters.source !== 'all' && entry.source !== effectiveFilters.source) return false;
      if (effectiveFilters.contentType !== 'all' && entry.contentType !== effectiveFilters.contentType) return false;
      if (effectiveFilters.trigger !== 'all' && entry.trigger !== effectiveFilters.trigger) return false;
      if (effectiveFilters.status !== 'all' && entry.status !== effectiveFilters.status) return false;
      return true;
    });
  }, [effectiveFilters.source, effectiveFilters.contentType, effectiveFilters.trigger, effectiveFilters.status]);

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
            to={providerLink}
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
        <Box>
          <Chip
            icon={<StatusIcon status={row.status} />}
            label={row.status}
            size="small"
            color={statusColor(row.status)}
            variant="outlined"
            className={classes.statusChip}
          />
          {row.status === 'Failed' && (
            <Typography
              component="button"
              type="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onViewFailure(row);
              }}
              style={{
                display: 'block',
                marginTop: 4,
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: '#0066CC',
                textAlign: 'left',
              }}
            >
              View details
            </Typography>
          )}
        </Box>
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
      render: (row: SyncHistoryEntry) => (
        <HistoryRowActions entry={row} onViewFailure={onViewFailure} />
      ),
    },
  ];

  return (
    <CatalogFilterLayout>
      <CatalogFilterLayout.Filters>
        <Typography className={classes.filterLabel}>Source</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={sourceFilter}
              onChange={e => onSourceFilterChange(e.target.value as string)}
              input={<Input disableUnderline />}
              inputProps={{ 'aria-label': 'Filter sync by source' }}
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

// ---------------------------------------------------------------------------
// Sync settings dropdown — links to each provider's Sync tab
// ---------------------------------------------------------------------------

const SyncSettingsDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const connectionProviders = DEMO_CONNECTIONS.filter(c => c.type !== 'git');
  const scmProviders = DEMO_CONNECTIONS.filter(c => c.type === 'git');

  const handleClick = (provider: typeof DEMO_CONNECTIONS[0]) => {
    setAnchorEl(null);
    navigate(`/self-service/admin/integrations/${provider.id}?tab=sync`);
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
          Connections
        </ListSubheader>
        {connectionProviders.map(p => {
          const isConfigured = p.status !== 'Not configured';
          return (
            <MuiMenuItem key={p.id} onClick={() => handleClick(p)}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <ListItemText
                  primary={p.name.replace(/ \(.*\)/, '')}
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
          SCM Integration
        </ListSubheader>
        {scmProviders.map(p => {
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
// History panel — reusable for Opt 1 Integrations → Activity tab
// ---------------------------------------------------------------------------

export const SyncHistoryPanel = ({
  sourceFilter,
  onSourceFilterChange,
  onViewFailure,
}: {
  sourceFilter: string;
  onSourceFilterChange: (source: string) => void;
  onViewFailure: (entry: SyncHistoryEntry) => void;
}) => (
  <HistoryTab
    sourceFilter={sourceFilter}
    onSourceFilterChange={onSourceFilterChange}
    onViewFailure={onViewFailure}
  />
);

/** Standalone history + error modal for embedding (Opt 1 Activity tab). */
export const SyncHistoryEmbedded = () => {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [errorEntity, setErrorEntity] = useState<SyncEntityStatus | null>(null);

  return (
    <>
      <HistoryTab
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        onViewFailure={entry => setErrorEntity(entryToErrorEntity(entry))}
      />
      <SyncErrorModal
        entity={errorEntity}
        open={Boolean(errorEntity)}
        onClose={() => setErrorEntity(null)}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Main page — variant-aware (Existing / Opt 1 redirect / Opt 2 scoped Run sync)
// ---------------------------------------------------------------------------

export const SyncActivityPage = () => {
  const { variant } = useAdminSyncIa();
  const [sourceFilter, setSourceFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [errorEntity, setErrorEntity] = useState<SyncEntityStatus | null>(null);

  if (variant === 'opt1') {
    return (
      <Navigate
        to="/self-service/admin/integrations?tab=activity"
        replace
      />
    );
  }

  const isOpt2 = variant === 'opt2';

  const handleSyncNow = () => {
    if (syncing) return;
    setSyncing(true);
    window.setTimeout(() => setSyncing(false), 2500);
  };

  const handleViewFailure = (entry: SyncHistoryEntry) => {
    setErrorEntity(entryToErrorEntity(entry));
  };

  const title = isOpt2 ? 'Sync activity' : 'Sync';
  const subtitle = isOpt2
    ? 'History of sync operations. Use Run sync… to choose connections — or sync from Integrations.'
    : 'Monitor and manage sync operations across all connected platforms';

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            {title}
            <PageHelpIcon
              tooltipLabel={`What is ${title}?`}
              title={title}
              description={
                isOpt2
                  ? 'This page is a log. Run sync… opens a scope dialog so you pick which connections to sync. Per-connection Sync now still lives on Integrations.'
                  : 'Monitor sync operations across all connected platforms. Use Sync all now (or Sync {source} now when filtered) to trigger a manual sync. Sync settings jumps to each provider’s schedule.'
              }
            />
          </Box>
        }
        pageTitleOverride={title}
        subtitle={subtitle}
      >
        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
          <SyncSettingsDropdown />
          {isOpt2 ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => setRunOpen(true)}
              startIcon={<SyncIcon style={{ fontSize: 16 }} />}
              style={{ textTransform: 'none', fontSize: 13, borderRadius: 20 }}
            >
              Run sync…
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={syncing}
              onClick={handleSyncNow}
              startIcon={
                syncing ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <SyncIcon style={{ fontSize: 16 }} />
                )
              }
              style={{ textTransform: 'none', fontSize: 13, borderRadius: 20 }}
            >
              {syncing ? 'Syncing…' : syncNowLabel(sourceFilter)}
            </Button>
          )}
        </Box>
      </Header>
      <Content>
        <HistoryTab
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          onViewFailure={handleViewFailure}
        />
        <SyncErrorModal
          entity={errorEntity}
          open={Boolean(errorEntity)}
          onClose={() => setErrorEntity(null)}
        />
        {isOpt2 && (
          <RunSyncScopeDialog
            open={runOpen}
            onClose={() => setRunOpen(false)}
          />
        )}
      </Content>
    </Page>
  );
};
