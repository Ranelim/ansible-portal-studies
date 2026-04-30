import { useState, useMemo } from 'react';
import { Page, Header, Content, Link } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  makeStyles,
  Chip,
  FormControl,
  Select,
  MenuItem as MuiMenuItem,
  Input,
  Paper,
  Switch,
  Tooltip,
} from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import LoopIcon from '@material-ui/icons/Loop';
import ScheduleIcon from '@material-ui/icons/Schedule';
import SyncIcon from '@material-ui/icons/Sync';
import SyncDisabledIcon from '@material-ui/icons/SyncDisabled';
import {
  DEMO_CONNECTIONS,
  DEMO_SYNC_STATUS,
  SyncEntityStatus,
  SyncStatus,
} from './syncDemoData';
import { SyncErrorModal } from './SyncErrorModal';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
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
  entityRow: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  entityTable: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerCell: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: theme.palette.text.secondary,
  },
  entityName: {
    fontWeight: 500,
    fontSize: 14,
  },
  sourceLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  metaText: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  errorRow: {
    backgroundColor: 'rgba(244,67,54,0.05)',
    '&:hover': {
      backgroundColor: 'rgba(244,67,54,0.08)',
    },
  },
  errorExpandToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    fontSize: 12,
    color: statusColors.error,
    fontWeight: 500,
    marginTop: 4,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
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
  syncAllButton: {
    textTransform: 'none' as const,
    fontSize: 13,
    fontWeight: 500,
  },
  disabledRow: {
    opacity: 0.5,
  },
}));

const StatusChip = ({ status }: { status: SyncStatus }) => {
  switch (status) {
    case 'Healthy':
      return (
        <Chip
          icon={<CheckCircleOutlineIcon style={{ fontSize: 16, color: statusColors.success }} />}
          label="Healthy"
          size="small"
          variant="outlined"
          style={{ fontSize: 12, fontWeight: 500, borderColor: statusColors.success, color: statusColors.success }}
        />
      );
    case 'Failed':
      return (
        <Chip
          icon={<ErrorOutlineIcon style={{ fontSize: 16, color: statusColors.error }} />}
          label="Failed"
          size="small"
          variant="outlined"
          style={{ fontSize: 12, fontWeight: 500, borderColor: statusColors.error, color: statusColors.error }}
        />
      );
    case 'In Progress':
      return (
        <Chip
          icon={<LoopIcon style={{ fontSize: 16, color: statusColors.info }} />}
          label="Syncing"
          size="small"
          variant="outlined"
          style={{ fontSize: 12, fontWeight: 500, borderColor: statusColors.info, color: statusColors.info }}
        />
      );
    case 'Never synced':
      return (
        <Chip
          icon={<SyncDisabledIcon style={{ fontSize: 16 }} />}
          label="Never synced"
          size="small"
          variant="outlined"
          style={{ fontSize: 12, fontWeight: 500 }}
        />
      );
    default:
      return null;
  }
};

const COL_WIDTHS = {
  entity: '22%',
  source: '15%',
  lastSync: '18%',
  status: '14%',
  nextSync: '15%',
  schedule: '10%',
  actions: '6%',
};

const EntityRow = ({ entry, onViewDetails }: { entry: SyncEntityStatus; onViewDetails: (e: SyncEntityStatus) => void }) => {
  const classes = useStyles();
  const isFailed = entry.status === 'Failed';

  return (
    <Box className={`${classes.entityRow} ${isFailed ? classes.errorRow : ''} ${!entry.enabled ? classes.disabledRow : ''}`}>
      <Box style={{ width: COL_WIDTHS.entity }}>
        <Link
          to={`/self-service/admin/integrations/${entry.providerId}?tab=sync`}
          className={classes.entityName}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {entry.entity}
        </Link>
      </Box>
      <Box style={{ width: COL_WIDTHS.source }}>
        <Link
          to={`/self-service/admin/integrations/${entry.providerId}`}
          className={classes.sourceLabel}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{ textDecoration: 'none' }}
        >
          {entry.source}
        </Link>
      </Box>
      <Box style={{ width: COL_WIDTHS.lastSync }}>
        {entry.lastSync ? (
          <Box>
            <Typography className={classes.metaText}>{entry.lastSync}</Typography>
            {entry.lastSyncDuration && (
              <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                Duration: {entry.lastSyncDuration}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography className={classes.metaText} style={{ fontStyle: 'italic' }}>—</Typography>
        )}
      </Box>
      <Box style={{ width: COL_WIDTHS.status }}>
        <StatusChip status={entry.status} />
        {isFailed && entry.errorDetail && (
          <Box
            className={classes.errorExpandToggle}
            onClick={() => onViewDetails(entry)}
          >
            View details
          </Box>
        )}
      </Box>
      <Box style={{ width: COL_WIDTHS.nextSync }}>
        {entry.nextSync ? (
          <Box display="flex" alignItems="center" style={{ gap: 4 }}>
            <ScheduleIcon style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
            <Typography className={classes.metaText}>{entry.nextSync}</Typography>
          </Box>
        ) : (
          <Typography className={classes.metaText} style={{ fontStyle: 'italic', color: isFailed ? statusColors.error : undefined }}>
            {isFailed ? 'Paused' : '—'}
          </Typography>
        )}
      </Box>
      <Box style={{ width: COL_WIDTHS.schedule }}>
        <Typography className={classes.metaText}>{entry.interval}</Typography>
      </Box>
      <Box style={{ width: COL_WIDTHS.actions, textAlign: 'right' }}>
        <Tooltip title="Sync now">
          <Button
            size="small"
            style={{ minWidth: 32, padding: 4 }}
            disabled={!entry.enabled}
          >
            <SyncIcon style={{ fontSize: 16 }} />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export const SyncActivityPage = () => {
  const classes = useStyles();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [syncingAll, setSyncingAll] = useState(false);
  const [modalEntity, setModalEntity] = useState<SyncEntityStatus | null>(null);

  const connectedProviderIds = useMemo(
    () => DEMO_CONNECTIONS.filter(c => c.status === 'Active').map(c => c.id),
    [],
  );
  const activeEntities = useMemo(
    () => DEMO_SYNC_STATUS.filter(e => connectedProviderIds.includes(e.providerId)),
    [connectedProviderIds],
  );

  const filtered = useMemo(() => {
    return activeEntities.filter(entry => {
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && entry.source !== sourceFilter) return false;
      return true;
    });
  }, [activeEntities, statusFilter, sourceFilter]);

  const healthyCount = activeEntities.filter(e => e.status === 'Healthy').length;
  const failedCount = activeEntities.filter(e => e.status === 'Failed').length;
  const inProgressCount = activeEntities.filter(e => e.status === 'In Progress').length;

  const handleSyncAll = () => {
    setSyncingAll(true);
    setTimeout(() => setSyncingAll(false), 2000);
  };

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Sync status
            <PageHelpIcon
              tooltipLabel="What is sync status?"
              title="Sync status"
              description="View the latest sync status for all configured content sources. Each row shows the last sync result and any errors that need attention."
            />
          </Box>
        }
        pageTitleOverride="Sync status"
        subtitle="Latest sync status across all configured integrations"
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<SyncIcon style={{ fontSize: 16 }} />}
          className={classes.syncAllButton}
          onClick={handleSyncAll}
          disabled={syncingAll}
          style={{
            borderColor: 'rgba(255,255,255,0.3)',
            color: '#fff',
          }}
        >
          {syncingAll ? 'Syncing...' : 'Sync all now'}
        </Button>
      </Header>
      <Content>
        {/* Summary strip */}
        <Box className={classes.summaryStrip}>
          <Chip
            icon={<CheckCircleOutlineIcon style={{ fontSize: 16 }} />}
            label={`${healthyCount} healthy`}
            size="small"
            variant={statusFilter === 'Healthy' ? 'default' : 'outlined'}
            className={`${classes.summaryChip} ${statusFilter === 'Healthy' ? classes.summaryChipActive : ''}`}
            onClick={() => setStatusFilter(f => f === 'Healthy' ? 'all' : 'Healthy')}
          />
          <Chip
            icon={<ErrorOutlineIcon style={{ fontSize: 16 }} />}
            label={`${failedCount} failed`}
            size="small"
            variant={statusFilter === 'Failed' ? 'default' : 'outlined'}
            className={`${classes.summaryChip} ${statusFilter === 'Failed' ? classes.summaryChipActive : ''}`}
            onClick={() => setStatusFilter(f => f === 'Failed' ? 'all' : 'Failed')}
          />
          {inProgressCount > 0 && (
            <Chip
              icon={<LoopIcon style={{ fontSize: 16 }} />}
              label={`${inProgressCount} syncing`}
              size="small"
              variant={statusFilter === 'In Progress' ? 'default' : 'outlined'}
              className={`${classes.summaryChip} ${statusFilter === 'In Progress' ? classes.summaryChipActive : ''}`}
              onClick={() => setStatusFilter(f => f === 'In Progress' ? 'all' : 'In Progress')}
            />
          )}
          <Box style={{ marginLeft: 'auto' }}>
            <FormControl size="small">
              <Select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value as string)}
                input={<Input disableUnderline />}
                style={{ fontSize: 13 }}
              >
                <MuiMenuItem value="all">All sources</MuiMenuItem>
                <MuiMenuItem value="AAP">AAP</MuiMenuItem>
                <MuiMenuItem value="PAH">PAH</MuiMenuItem>
                <MuiMenuItem value="GitHub">GitHub</MuiMenuItem>
                <MuiMenuItem value="GitLab">GitLab</MuiMenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Status table */}
        <Box className={classes.entityTable}>
          <Box className={classes.tableHeader}>
            <Box style={{ width: COL_WIDTHS.entity }}>
              <Typography className={classes.headerCell}>Name</Typography>
            </Box>
            <Box style={{ width: COL_WIDTHS.source }}>
              <Typography className={classes.headerCell}>Source</Typography>
            </Box>
            <Box style={{ width: COL_WIDTHS.lastSync }}>
              <Typography className={classes.headerCell}>Last sync</Typography>
            </Box>
            <Box style={{ width: COL_WIDTHS.status }}>
              <Typography className={classes.headerCell}>Status</Typography>
            </Box>
            <Box style={{ width: COL_WIDTHS.nextSync }}>
              <Typography className={classes.headerCell}>Next sync</Typography>
            </Box>
            <Box style={{ width: COL_WIDTHS.schedule }}>
              <Typography className={classes.headerCell}>Schedule</Typography>
            </Box>
            <Box style={{ width: COL_WIDTHS.actions }} />
          </Box>

          {filtered.length > 0 ? (
            filtered.map(entry => (
              <EntityRow key={entry.id} entry={entry} onViewDetails={setModalEntity} />
            ))
          ) : (
            <Box style={{ padding: '48px 24px', textAlign: 'center' }}>
              <SyncDisabledIcon style={{ fontSize: 40, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }} />
              <Typography style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                {statusFilter !== 'all' || sourceFilter !== 'all'
                  ? 'No sync entities match the current filters.'
                  : 'No sync entities configured. Add an integration to start syncing content.'}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12, textAlign: 'right' }}>
          {activeEntities.length} sync {activeEntities.length === 1 ? 'entity' : 'entities'} configured
        </Typography>

        <SyncErrorModal
          entity={modalEntity}
          open={modalEntity !== null}
          onClose={() => setModalEntity(null)}
        />
      </Content>
    </Page>
  );
};
