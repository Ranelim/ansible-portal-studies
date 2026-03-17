import { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CategoryIcon from '@material-ui/icons/Category';
import { SidebarSectionLabel } from '@ansible/plugin-backstage-rhaap';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
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
import SettingsIcon from '@material-ui/icons/Settings';
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
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            <SidebarItem
              icon={HomeIcon}
              to="/self-service/projects"
              text="Projects"
            />
            <SidebarItem
              icon={DescriptionOutlinedIcon}
              to="/self-service/catalog"
              text="Templates"
            />
            <SidebarItem
              icon={WebAssetIcon}
              to="ansible/overview"
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
            <SidebarItem icon={SchoolIcon} to="docs" text="Training" />
            <SidebarDivider />
            <SidebarScrollWrapper>
              <SidebarSectionLabel text="Administration" />
              <SidebarItem
                icon={SettingsIcon}
                to="settings"
                text="General"
              />
              <SidebarItem
                icon={ExtensionIcon}
                to="settings"
                text="Integrations"
              />
              <SidebarItem
                icon={VpnKeyIcon}
                to="rbac"
                text="Access Control"
              />
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <SidebarGroup
            label="Settings"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          >
            <SidebarSettings />
          </SidebarGroup>
        </Sidebar>
        {children}
      </SidebarPage>
    </div>
  );
};
