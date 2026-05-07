import { PropsWithChildren } from 'react';
import { makeStyles, Box, Typography, Button } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import { useLocation } from 'react-router-dom';
import { RestartProvider, useRestartRequired } from '@ansible/plugin-backstage-self-service';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CategoryIcon from '@material-ui/icons/Category';
import CodeIcon from '@material-ui/icons/Code';
import BuildIcon from '@material-ui/icons/Build';
import { SidebarSectionLabel } from '@ansible/plugin-backstage-rhaap';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import MemoryIcon from '@material-ui/icons/Memory';
import SchoolIcon from '@material-ui/icons/School';
import SyncIcon from '@material-ui/icons/Sync';
import LinkIcon from '@material-ui/icons/Link';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import SettingsIcon from '@material-ui/icons/Settings';
import HistoryIcon from '@material-ui/icons/History';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 16,
    flexShrink: 0,
  },
});

const SidebarSpacer = () => {
  const classes = useSidebarLogoStyles();
  return <div className={classes.root} />;
};

const HEADER_HEIGHT = 64;

const useRootStyles = makeStyles(theme => ({
  '@global': {
    '.BackstageSidebar-root': {
      top: `${HEADER_HEIGHT}px !important`,
    },
    '.BackstageSidebar-drawer': {
      top: `${HEADER_HEIGHT}px !important`,
    },
    'body, html': {
      backgroundColor: `${theme.palette.background.default} !important`,
    },
    '.BackstageHeader-header': {
      position: 'relative',
      zIndex: 0,
    },
    '.BackstagePage-root': {
      overflow: 'hidden',
    },
  },
  fixedHeaderOffset: {
    paddingTop: HEADER_HEIGHT,
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default,
  },
}));

const GlobalRestartBanner = () => {
  const { restartRequired, setRestartRequired } = useRestartRequired();
  if (!restartRequired) return null;

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 24px',
        backgroundColor: 'rgba(240,173,78,0.15)',
        borderBottom: '1px solid rgba(240,173,78,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(8px)',
      }}
    >
      <WarningIcon style={{ fontSize: 20, color: '#f0ad4e', flexShrink: 0 }} />
      <Typography style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>
        Configuration changes have been saved but require a portal restart to take effect.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => setRestartRequired(false)}
        style={{ textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}
      >
        Restart now
      </Button>
    </Box>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const rootClasses = useRootStyles();
  const location = useLocation();
  const isSetup = location.pathname.includes('/setup');

  if (isSetup) {
    return <>{children}</>;
  }

  return (
    <RestartProvider>
      <div className={rootClasses.fixedHeaderOffset}>
        <SidebarPage>
          <Sidebar>
          <SidebarSpacer />
          <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
            <SidebarSearchModal />
          </SidebarGroup>
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            <SidebarSectionLabel text="Catalog" />
            <SidebarItem
              icon={CodeIcon}
              to="/self-service/projects"
              text="Projects"
            />
            <SidebarItem
              icon={VerifiedUserIcon}
              to="/self-service/quality"
              text="Quality"
            />
            <SidebarItem
              icon={MemoryIcon}
              to="/self-service/ee"
              text="Execution Environments"
            />
            <SidebarItem
              icon={CategoryIcon}
              to="/self-service/collections"
              text="Collections"
            />
            <SidebarDivider />
            <SidebarSectionLabel text="Tools" />
            <SidebarItem
              icon={AddCircleOutlineIcon}
              to="/create"
              text="Templates"
            />
            <SidebarItem
              icon={HistoryIcon}
              to="/self-service/create/tasks"
              text="Activity"
            />
            <SidebarItem
              icon={BuildIcon}
              to="/self-service/workspaces"
              text="Workspaces"
            />
            <SidebarDivider />
            <SidebarSectionLabel text="Learn" />
            <SidebarItem icon={LibraryBooks} to="docs" text="Documentation" />
            <SidebarItem icon={SchoolIcon} to="/self-service/learning" text="Learning" />
            <SidebarDivider />
            <SidebarScrollWrapper>
              <SidebarSectionLabel text="Administration" />
              <SidebarItem
                icon={SettingsIcon}
                to="/self-service/admin/general"
                text="General"
              />
              <SidebarItem
                icon={LinkIcon}
                to="/self-service/admin/integrations"
                text="Integrations"
              />
              <SidebarItem
                icon={SyncIcon}
                to="/self-service/admin/sync-activity"
                text="Sync status"
              />
              <SidebarItem
                icon={MemoryIcon}
                to="/self-service/admin/ee-builder"
                text="EE Builder"
              />
              <SidebarItem
                icon={VpnKeyIcon}
                to="rbac"
                text="Access Control"
              />
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
        </Sidebar>
        <GlobalRestartBanner />
        {children}
      </SidebarPage>
      </div>
    </RestartProvider>
  );
};
