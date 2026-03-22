import { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CategoryIcon from '@material-ui/icons/Category';
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
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import WebAssetIcon from '@material-ui/icons/WebAsset';
import MemoryIcon from '@material-ui/icons/Memory';
import SchoolIcon from '@material-ui/icons/School';
import SyncIcon from '@material-ui/icons/Sync';
import LinkIcon from '@material-ui/icons/Link';
import VpnKeyIcon from '@material-ui/icons/VpnKey';

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
    'a[href*="catalog-import"]': {
      display: 'none !important',
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

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const rootClasses = useRootStyles();
  return (
    <div className={rootClasses.fixedHeaderOffset}>
      <SidebarPage>
        <Sidebar>
          <SidebarSpacer />
          <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
            <SidebarSearchModal />
          </SidebarGroup>
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            <SidebarItem
              icon={HomeIcon}
              to="/self-service/projects"
              text="Projects"
            />
            <SidebarItem
              icon={DescriptionOutlinedIcon}
              to="/create"
              text="Templates"
            />
            <SidebarItem
              icon={WebAssetIcon}
              to="/self-service/workspaces"
              text="Workspaces"
            />
            <SidebarDivider />
            <SidebarSectionLabel text="Shared Assets" />
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
            <SidebarSectionLabel text="Learn" />
            <SidebarItem icon={LibraryBooks} to="docs" text="Documentation" />
            <SidebarItem icon={SchoolIcon} to="/self-service/learning" text="Getting started" />
            <SidebarDivider />
            <SidebarScrollWrapper>
              <SidebarSectionLabel text="Administration" />
              <SidebarItem
                icon={LinkIcon}
                to="/self-service/admin/connections"
                text="Connections"
              />
              <SidebarItem
                icon={SyncIcon}
                to="/self-service/admin/sync-activity"
                text="Sync Activity"
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
        {children}
      </SidebarPage>
    </div>
  );
};
