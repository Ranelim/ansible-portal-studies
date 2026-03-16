import { PropsWithChildren } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CategoryIcon from '@material-ui/icons/Category';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
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
  useSidebarOpenState,
  Link,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import DashboardIcon from '@material-ui/icons/Dashboard';
import WebAssetIcon from '@material-ui/icons/WebAsset';
import MemoryIcon from '@material-ui/icons/Memory';
import SchoolIcon from '@material-ui/icons/School';
import SettingsIcon from '@material-ui/icons/Settings';
import VpnKeyIcon from '@material-ui/icons/VpnKey';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const useSectionLabelStyles = makeStyles(theme => ({
  label: {
    padding: '16px 24px 4px 24px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: theme.palette.text.secondary,
  },
}));

const SidebarSectionLabel = ({ text }: { text: string }) => {
  const classes = useSectionLabelStyles();
  const { isOpen } = useSidebarOpenState();
  if (!isOpen) return null;
  return <Typography className={classes.label}>{text}</Typography>;
};

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      <SidebarLogo />
      <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
        <SidebarSearchModal />
      </SidebarGroup>
      <SidebarDivider />
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        <SidebarItem icon={HomeIcon} to="catalog" text="Projects" />
        <SidebarItem
          icon={DashboardIcon}
          to="self-service"
          text="Software Templates"
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
          <SidebarItem icon={SettingsIcon} to="settings" text="General" />
          <SidebarItem
            icon={ExtensionIcon}
            to="settings"
            text="Integrations"
          />
          <SidebarItem icon={VpnKeyIcon} to="rbac" text="Access Control" />
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
);
