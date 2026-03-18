import { useState, useCallback } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Popover,
  IconButton,
  Tooltip,
  Button,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CloseIcon from '@material-ui/icons/Close';
import SyncIcon from '@material-ui/icons/Sync';
import { usePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';

import { SyncDialog } from './SyncDialog';
import { CollectionsContent } from './CollectionsListPage';
import {
  NotificationProvider,
  NotificationStack,
  useNotifications,
} from '../notifications';
import { useSyncStatusPolling } from './useSyncStatusPolling';
import { StartedSyncInfo } from './types';

const useStyles = makeStyles(theme => ({
  helpIcon: {
    color: theme.palette.common.white,
    opacity: 0.7,
    fontSize: 20,
    cursor: 'pointer',
    marginLeft: theme.spacing(1),
    '&:hover': {
      opacity: 1,
    },
  },
  helpPopover: {
    padding: theme.spacing(2.5),
    maxWidth: 380,
  },
  helpTitle: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: theme.spacing(1),
  },
  helpDescription: {
    fontSize: 13,
    lineHeight: 1.6,
    color: theme.palette.text.secondary,
  },
  syncButton: {
    textTransform: 'none',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
}));

const PageHelpIcon = () => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title="What are Collections?" arrow>
        <span
          style={{ display: 'inline-flex', cursor: 'pointer' }}
          onClick={e => setAnchorEl(e.currentTarget)}
          role="button"
          tabIndex={0}
        >
          <HelpOutlineIcon className={classes.helpIcon} />
        </span>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box className={classes.helpPopover}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Typography className={classes.helpTitle}>
              What are Collections?
            </Typography>
            <IconButton size="small" onClick={() => setAnchorEl(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography className={classes.helpDescription}>
            An Ansible Collection is a package of reusable automation content,
            including modules, roles, plugins and playbooks. Collections let you
            share and reuse automation across teams and projects.
          </Typography>
        </Box>
      </Popover>
    </>
  );
};

const CollectionsCatalogPageInner = () => {
  const classes = useStyles();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [hasConfiguredSources, setHasConfiguredSources] = useState<
    boolean | null
  >(null);
  const { notifications, removeNotification } = useNotifications();
  const { isSyncInProgress, startTracking } = useSyncStatusPolling();
  const { allowed } = usePermission({
    permission: catalogEntityCreatePermission,
  });

  const handleSyncClick = () => setSyncDialogOpen(true);

  const handleSourcesStatusChange = useCallback((status: boolean | null) => {
    setHasConfiguredSources(status);
  }, []);

  const handleSyncsStarted = useCallback(
    (syncs: StartedSyncInfo[]) => {
      startTracking(syncs);
    },
    [startTracking],
  );

  const syncDisabled = hasConfiguredSources === false || isSyncInProgress;

  let syncDisabledReason: string | undefined;
  if (hasConfiguredSources === false) {
    syncDisabledReason = 'No content sources configured';
  } else if (isSyncInProgress) {
    syncDisabledReason = 'Sync in progress';
  }

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Collections
            <PageHelpIcon />
          </Box>
        }
        pageTitleOverride="Collections"
      />
      <Content>
        {allowed && (
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Tooltip
              title={syncDisabled && syncDisabledReason ? syncDisabledReason : ''}
              arrow
            >
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SyncIcon />}
                  onClick={handleSyncClick}
                  className={classes.syncButton}
                  disabled={syncDisabled}
                >
                  Sync Now
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}
        <CollectionsContent
          onSyncClick={handleSyncClick}
          onSourcesStatusChange={handleSourcesStatusChange}
        />
        <SyncDialog
          open={syncDialogOpen}
          onClose={() => setSyncDialogOpen(false)}
          onSyncsStarted={handleSyncsStarted}
        />
      </Content>
      <NotificationStack
        notifications={notifications}
        onClose={removeNotification}
      />
    </Page>
  );
};

export const CollectionsCatalogPage = () => {
  return (
    <NotificationProvider>
      <CollectionsCatalogPageInner />
    </NotificationProvider>
  );
};
