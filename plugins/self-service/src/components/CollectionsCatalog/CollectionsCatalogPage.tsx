import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Popover,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CloseIcon from '@material-ui/icons/Close';

import { CollectionsContent } from './CollectionsListPage';
import {
  NotificationProvider,
  NotificationStack,
  useNotifications,
} from '../notifications';

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
  const { notifications, removeNotification } = useNotifications();

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
        <CollectionsContent />
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
