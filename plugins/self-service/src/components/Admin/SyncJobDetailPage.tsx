import { useState, useMemo } from 'react';
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
  makeStyles,
  Button,
  Paper,
} from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import LoopIcon from '@material-ui/icons/Loop';
import WarningIcon from '@material-ui/icons/Warning';
import ReplayIcon from '@material-ui/icons/Replay';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import BlockIcon from '@material-ui/icons/Block';
import { useParams, useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import {
  DEMO_SYNC_HISTORY,
  SyncHistoryEntry,
  SyncChangeItem,
  SyncStatus,
} from './syncDemoData';

const useStyles = makeStyles(theme => ({
  breadcrumbs: {
    marginBottom: theme.spacing(1),
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      fontSize: 14,
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& .MuiBreadcrumbs-separator': {
      fontSize: 14,
    },
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: theme.palette.text.secondary,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  summaryCard: {
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: theme.spacing(0.5),
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 500,
  },
  statusChip: {
    fontWeight: 500,
    fontSize: 12,
  },
  errorBanner: {
    padding: theme.spacing(2),
    backgroundColor: 'rgba(244,67,54,0.05)',
    border: `1px solid rgba(244,67,54,0.2)`,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
  },
  errorTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: theme.palette.error.main,
    marginBottom: theme.spacing(0.5),
  },
  errorBody: {
    fontSize: 13,
    color: theme.palette.text.primary,
  },
  changesSection: {
    marginTop: theme.spacing(2),
  },
  changesSummary: {
    display: 'flex',
    gap: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  changeStat: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: 14,
  },
  logContainer: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: '"Red Hat Mono", "JetBrains Mono", "Fira Code", monospace',
    fontSize: 13,
    lineHeight: 1.7,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    overflow: 'auto',
    maxHeight: '60vh',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  logLine: {
    padding: '1px 0',
  },
  logTimestamp: {
    color: '#6a9955',
  },
  logError: {
    color: '#f48771',
  },
  logSuccess: {
    color: '#89d185',
  },
  noChanges: {
    textAlign: 'center' as const,
    padding: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  retryButton: {
    textTransform: 'none' as const,
    fontWeight: 500,
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

const ChangeActionIcon = ({ action }: { action: SyncChangeItem['action'] }) => {
  switch (action) {
    case 'added':
      return <AddCircleOutlineIcon style={{ color: '#4caf50', fontSize: 16 }} />;
    case 'updated':
      return <EditOutlinedIcon style={{ color: '#1976d2', fontSize: 16 }} />;
    case 'removed':
      return <RemoveCircleOutlineIcon style={{ color: '#f44336', fontSize: 16 }} />;
    case 'skipped':
      return <BlockIcon style={{ color: '#ff9800', fontSize: 16 }} />;
    default:
      return null;
  }
};

const OverviewTab = ({ entry }: { entry: SyncHistoryEntry }) => {
  const classes = useStyles();

  const changeColumns: TableColumn<SyncChangeItem>[] = [
    {
      title: 'Item',
      field: 'name',
      render: (row: SyncChangeItem) => (
        <Typography variant="body2" style={{ fontWeight: 500 }}>{row.name}</Typography>
      ),
    },
    {
      title: 'Action',
      field: 'action',
      render: (row: SyncChangeItem) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          <ChangeActionIcon action={row.action} />
          <Typography variant="body2" style={{ textTransform: 'capitalize' }}>
            {row.action}
          </Typography>
        </Box>
      ),
    },
    {
      title: 'Details',
      field: 'detail',
      render: (row: SyncChangeItem) => (
        <Typography variant="body2" color="textSecondary">{row.detail ?? '—'}</Typography>
      ),
    },
  ];

  return (
    <>
      <Box className={classes.summaryGrid}>
        <Paper className={classes.summaryCard} variant="outlined">
          <Typography className={classes.summaryLabel}>Source</Typography>
          <Typography className={classes.summaryValue}>{entry.source}</Typography>
        </Paper>
        <Paper className={classes.summaryCard} variant="outlined">
          <Typography className={classes.summaryLabel}>Content Type</Typography>
          <Typography className={classes.summaryValue}>{entry.contentType}</Typography>
        </Paper>
        <Paper className={classes.summaryCard} variant="outlined">
          <Typography className={classes.summaryLabel}>Trigger</Typography>
          <Typography className={classes.summaryValue}>
            {entry.trigger}{entry.triggeredBy ? ` by ${entry.triggeredBy}` : ''}
          </Typography>
        </Paper>
        <Paper className={classes.summaryCard} variant="outlined">
          <Typography className={classes.summaryLabel}>Started</Typography>
          <Typography className={classes.summaryValue}>{entry.started}</Typography>
        </Paper>
        <Paper className={classes.summaryCard} variant="outlined">
          <Typography className={classes.summaryLabel}>Duration</Typography>
          <Typography className={classes.summaryValue}>{entry.duration}</Typography>
        </Paper>
        <Paper className={classes.summaryCard} variant="outlined">
          <Typography className={classes.summaryLabel}>Status</Typography>
          <Box display="flex" alignItems="center" style={{ gap: 6, marginTop: 2 }}>
            <Chip
              icon={<StatusIcon status={entry.status} />}
              label={entry.status}
              size="small"
              color={statusColor(entry.status)}
              variant="outlined"
              className={classes.statusChip}
            />
          </Box>
        </Paper>
      </Box>

      {entry.errorDetail && (
        <Box className={classes.errorBanner}>
          <Typography className={classes.errorTitle}>Sync failed</Typography>
          <Typography className={classes.errorBody}>{entry.errorDetail}</Typography>
          <Box mt={1.5}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<ReplayIcon />}
              className={classes.retryButton}
              onClick={() => console.log('Retry:', entry.id)} // eslint-disable-line no-console
            >
              Retry this sync
            </Button>
          </Box>
        </Box>
      )}

      <Box className={classes.changesSection}>
        <Box className={classes.changesSummary}>
          <Typography className={classes.changeStat}>
            <AddCircleOutlineIcon style={{ color: '#4caf50', fontSize: 18 }} />
            {entry.itemsAdded ?? 0} added
          </Typography>
          <Typography className={classes.changeStat}>
            <EditOutlinedIcon style={{ color: '#1976d2', fontSize: 18 }} />
            {entry.itemsUpdated ?? 0} updated
          </Typography>
          <Typography className={classes.changeStat}>
            <RemoveCircleOutlineIcon style={{ color: '#f44336', fontSize: 18 }} />
            {entry.itemsRemoved ?? 0} removed
          </Typography>
        </Box>

        {entry.changes && entry.changes.length > 0 ? (
          <Table<SyncChangeItem>
            columns={changeColumns}
            data={entry.changes}
            title={`${entry.changes.length} changes`}
            options={{
              paging: false,
              search: false,
              sorting: true,
              padding: 'dense',
            }}
            style={{ width: '100%', overflowX: 'hidden' }}
          />
        ) : (
          <Typography className={classes.noChanges}>
            {entry.status === 'Failed'
              ? 'No changes were made — sync failed before processing.'
              : 'No item-level changes recorded for this sync.'}
          </Typography>
        )}
      </Box>
    </>
  );
};

const LogTab = ({ entry }: { entry: SyncHistoryEntry }) => {
  const classes = useStyles();

  const renderLine = (line: string, idx: number) => {
    const timestampMatch = line.match(/^(\[[\d:]+\])\s*(.*)/);
    const isError = line.includes('ERROR') || line.includes('failed') || line.includes('Failed');
    const isSuccess = line.includes('completed successfully') || line.includes('Summary:');

    if (timestampMatch) {
      return (
        <div key={idx} className={classes.logLine}>
          <span className={classes.logTimestamp}>{timestampMatch[1]}</span>{' '}
          <span className={isError ? classes.logError : isSuccess ? classes.logSuccess : undefined}>
            {timestampMatch[2]}
          </span>
        </div>
      );
    }
    return (
      <div key={idx} className={`${classes.logLine} ${isError ? classes.logError : ''}`}>
        {line}
      </div>
    );
  };

  return (
    <Box>
      {entry.logLines && entry.logLines.length > 0 ? (
        <Box className={classes.logContainer}>
          {entry.logLines.map((line, idx) => renderLine(line, idx))}
        </Box>
      ) : (
        <Typography style={{ textAlign: 'center', padding: 32, color: '#9e9e9e' }}>
          No log output available for this sync event.
        </Typography>
      )}
    </Box>
  );
};

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'log', label: 'Log' },
];

export const SyncJobDetailPage = () => {
  const classes = useStyles();
  const { syncId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'log' ? 1 : 0;
  const [selectedTab, setSelectedTab] = useState(initialTab);

  const entry = useMemo(
    () => DEMO_SYNC_HISTORY.find(e => e.id === syncId),
    [syncId],
  );

  if (!entry) {
    return (
      <Page themeId="app">
        <Header title="Sync Job Not Found" />
        <Content>
          <Box textAlign="center" py={6}>
            <Typography variant="h5" gutterBottom>Sync job not found</Typography>
            <Typography color="textSecondary" gutterBottom>
              The sync job &ldquo;{syncId}&rdquo; does not exist or has been purged from history.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/self-service/admin/sync-activity')}
              style={{ marginTop: 16, textTransform: 'none' }}
            >
              Back to Sync Activity
            </Button>
          </Box>
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="app">
      <Header
        title={`${entry.source} — ${entry.contentType}`}
        subtitle={`${entry.trigger} sync · ${entry.started} · ${entry.duration}`}
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={setSelectedTab}
        tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
      />
      <Content>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          className={classes.breadcrumbs}
        >
          <RouterLink to="/self-service/admin/sync-activity">Sync Activity</RouterLink>
          <Typography className={classes.breadcrumbCurrent}>
            {entry.source} — {entry.contentType}
          </Typography>
        </Breadcrumbs>

        {selectedTab === 0 ? (
          <OverviewTab entry={entry} />
        ) : (
          <LogTab entry={entry} />
        )}
      </Content>
    </Page>
  );
};
