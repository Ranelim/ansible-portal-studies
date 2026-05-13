import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  Popover,
  List,
  ListItem,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import MemoryIcon from '@material-ui/icons/Memory';
import ViewListIcon from '@material-ui/icons/ViewList';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import StarIcon from '@material-ui/icons/Star';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import AccountCircle from '@material-ui/icons/AccountCircle';
import SettingsIcon from '@material-ui/icons/Settings';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import BuildIcon from '@material-ui/icons/Build';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck';
import TransformIcon from '@material-ui/icons/Transform';
import { makeStyles, alpha } from '@material-ui/core/styles';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { useStarredEntities } from '@backstage/plugin-catalog-react';
import { useState, useMemo } from 'react';
import { useUserRoleContext, type UserRole } from '@ansible/plugin-backstage-self-service';
import { useLightspeed } from '../Lightspeed';
import { useQuickstart } from '../Quickstart';
import { OmniSearch } from '../search/OmniSearch';
import redHatLogo from '../../assets/redhat-logo.png';

const useStyles = makeStyles(theme => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: '#151515',
    color: theme.palette.common.white,
    borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
  },
  toolbar: {
    minHeight: 64,
    gap: theme.spacing(0.5),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1.5),
  },
  sidebarToggle: {
    color: 'inherit',
    marginRight: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.08),
    },
  },
  brandArea: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    textDecoration: 'none',
    color: 'inherit',
    marginRight: theme.spacing(1),
    flexShrink: 0,
    '&:hover': {
      textDecoration: 'none',
    },
  },
  brandTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1,
  },
  brandTop: {
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: 0.3,
    opacity: 0.9,
    lineHeight: 1.2,
  },
  brandBottom: {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  },
  brandDivider: {
    height: 32,
    borderColor: alpha(theme.palette.common.white, 0.2),
    margin: theme.spacing(0, 1),
    alignSelf: 'center',
  },
  omniSearchWrapper: {
    marginLeft: theme.spacing(0.5),
    flexShrink: 1,
  },
  spacer: {
    flexGrow: 1,
  },
  iconButton: {
    color: 'inherit',
    opacity: 0.8,
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.08),
      opacity: 1,
    },
  },
  aiButton: {
    color: 'inherit',
    opacity: 0.8,
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.08),
      opacity: 1,
    },
  },
  aiButtonActive: {
    opacity: 1,
    backgroundColor: alpha(theme.palette.common.white, 0.14),
  },
  headerDivider: {
    height: 28,
    borderColor: alpha(theme.palette.common.white, 0.2),
    margin: theme.spacing(0, 0.5),
    alignSelf: 'center',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: 'inherit',
    borderRadius: 20,
    padding: theme.spacing(0.5, 1.5, 0.5, 0.5),
    textTransform: 'none',
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.08),
    },
  },
  profileName: {
    fontSize: 13,
    fontWeight: 500,
    color: 'inherit',
    whiteSpace: 'nowrap',
  },
  menu: {
    '& .MuiPaper-root': {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
      minWidth: 180,
      marginTop: theme.spacing(0.5),
    },
  },
  menuItem: {
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#ee0000',
    border: '2px solid #151515',
  },
  popover: {
    '& .MuiPaper-root': {
      minWidth: 280,
      maxWidth: 360,
      marginTop: theme.spacing(1),
      border: `1px solid ${theme.palette.divider}`,
    },
  },
  popoverHeader: {
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popoverTitle: {
    fontWeight: 600,
    fontSize: 14,
  },
  emptyState: {
    padding: theme.spacing(4, 2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  emptyIcon: {
    fontSize: 36,
    opacity: 0.3,
    marginBottom: theme.spacing(1),
  },
  helpList: {
    padding: theme.spacing(0.5, 0),
  },
  helpItem: {
    gap: theme.spacing(1.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  helpItemIcon: {
    minWidth: 'unset',
    color: theme.palette.text.secondary,
  },
}));

const RedHatLogo = () => (
  <img src={redHatLogo} alt="Red Hat" style={{ width: 36, height: 36, objectFit: 'contain' }} />
);

const LightspeedStarIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

const STARRED_PROJECTS_KEY = 'portal-starred-projects';

const getStarredProjectNames = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STARRED_PROJECTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const entityKindRoute: Record<string, string> = {
  component: '/self-service/catalog',
  template: '/self-service/catalog',
};

const StarredItemsList = ({ onClose }: { onClose: () => void }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { starredEntities } = useStarredEntities();

  const starredProjects = useMemo(() => getStarredProjectNames(), []);

  const backstageItems = useMemo(() => {
    const items: { name: string; kind: string; ref: string }[] = [];
    starredEntities.forEach(ref => {
      const parts = ref.split('/');
      const kind = parts[0]?.replace(':', '') || 'component';
      const name = parts[parts.length - 1] || ref;
      items.push({ name, kind: kind.toLowerCase(), ref });
    });
    return items;
  }, [starredEntities]);

  const allItems = [
    ...starredProjects.map(name => ({ name, kind: 'project', ref: name })),
    ...backstageItems,
  ];

  if (allItems.length === 0) {
    return (
      <Box className={classes.emptyState}>
        <StarBorderIcon className={classes.emptyIcon} />
        <Typography variant="body2">No starred items yet</Typography>
        <Typography variant="caption" color="textSecondary" style={{ marginTop: 4, display: 'block' }}>
          Star projects, collections, or execution environments for quick access
        </Typography>
      </Box>
    );
  }

  return (
    <List dense style={{ minWidth: 260, maxHeight: 320, overflow: 'auto', padding: 0 }}>
      {allItems.map(item => {
        const kindLabel = item.kind === 'project' ? 'Project'
          : item.kind === 'template' ? 'Template'
          : item.kind === 'component' ? 'Component'
          : item.kind;

        return (
          <ListItem
            key={item.ref}
            button
            onClick={() => {
              onClose();
              if (item.kind === 'project') {
                navigate(`/self-service/repositories/${item.name}`);
              } else {
                const base = entityKindRoute[item.kind] || '/self-service/catalog';
                navigate(`${base}/${item.name}`);
              }
            }}
            style={{ padding: '8px 16px' }}
          >
            <ListItemIcon style={{ minWidth: 32 }}>
              <StarIcon style={{ color: '#faaf00', fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary={item.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              secondary={kindLabel}
              primaryTypographyProps={{ style: { fontSize: 13, fontWeight: 500 } }}
              secondaryTypographyProps={{ style: { fontSize: 11 } }}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export const GlobalHeader = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const identityApi = useApi(identityApiRef);

  const { role: currentRole, hasRole } = useUserRoleContext();
  const isDeveloper = hasRole('developer');

  if (location.pathname.includes('/setup')) {
    return null;
  }
  const { isOpen: isLightspeedOpen, toggle: toggleLightspeed } = useLightspeed();
  const { toggle: toggleQuickstart } = useQuickstart();
  const { starredEntities } = useStarredEntities();
  const starredProjectNames = useMemo(() => getStarredProjectNames(), []);
  const hasStarred = starredEntities.size > 0 || starredProjectNames.length > 0;
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [helpAnchor, setHelpAnchor] = useState<null | HTMLElement>(null);
  const [createAnchor, setCreateAnchor] = useState<null | HTMLElement>(null);
  const [favAnchor, setFavAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    await identityApi.signOut();
    setProfileAnchor(null);
  };

  return (
    <AppBar position="fixed" className={classes.appBar} elevation={0}>
      <Toolbar className={classes.toolbar}>
        {/* Sidebar toggle (visual only - sidebar managed by Backstage) */}
        <Tooltip title="Navigation" arrow>
          <IconButton
            className={classes.sidebarToggle}
            aria-label="Navigation"
            size="medium"
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>

        {/* Brand */}
        <Link to="/" className={classes.brandArea}>
          <RedHatLogo />
          <Box className={classes.brandTextGroup}>
            <Typography className={classes.brandTop}>Red Hat</Typography>
            <Typography className={classes.brandBottom}>Ansible Portal</Typography>
          </Box>
        </Link>

        <Divider orientation="vertical" flexItem className={classes.brandDivider} />

        {/* Search */}
        <Box className={classes.omniSearchWrapper}>
          <OmniSearch />
        </Box>

        <div className={classes.spacer} />

        {/* Create quick actions */}
        <Tooltip title="Create..." arrow>
          <IconButton
            className={classes.iconButton}
            onClick={e => setCreateAnchor(e.currentTarget)}
            aria-label="Create"
          >
            <AddIcon />
          </IconButton>
        </Tooltip>

        {/* Lightspeed AI */}
        <Tooltip title={isLightspeedOpen ? 'Close Lightspeed' : 'Lightspeed AI'} arrow>
          <IconButton
            className={`${classes.aiButton} ${isLightspeedOpen ? classes.aiButtonActive : ''}`}
            onClick={toggleLightspeed}
            aria-label="Toggle Lightspeed AI"
          >
            <LightspeedStarIcon size={18} />
          </IconButton>
        </Tooltip>

        {/* Favorites */}
        <Tooltip title="Starred items" arrow>
          <IconButton
            className={classes.iconButton}
            onClick={e => setFavAnchor(e.currentTarget)}
            aria-label="Starred items"
          >
            {hasStarred ? <StarIcon style={{ color: '#faaf00' }} /> : <StarBorderIcon />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications" arrow>
          <IconButton
            className={classes.iconButton}
            onClick={e => setNotifAnchor(e.currentTarget)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <NotificationsNoneIcon />
            <span className={classes.notificationBadge} />
          </IconButton>
        </Tooltip>

        {/* Support */}
        <Tooltip title="Help" arrow>
          <IconButton
            className={classes.iconButton}
            onClick={e => setHelpAnchor(e.currentTarget)}
            aria-label="Help"
          >
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem className={classes.headerDivider} />

        {/* Profile */}
        <IconButton
          className={classes.profileButton}
          onClick={e => setProfileAnchor(e.currentTarget)}
          aria-label="User profile"
        >
          <AccountCircle />
          <Typography className={classes.profileName}>
            Guest
            <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4, textTransform: 'uppercase' }}>
              ({currentRole})
            </span>
          </Typography>
        </IconButton>

        {/* === Popovers & Menus === */}

        {/* Create quick actions menu — adapts to user role */}
        <Menu
          anchorEl={createAnchor}
          open={Boolean(createAnchor)}
          onClose={() => setCreateAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          getContentAnchorEl={null}
          className={classes.menu}
        >
          {isDeveloper && (
            <MenuItem
              onClick={() => { setCreateAnchor(null); navigate('/self-service/repositories/create'); }}
              className={classes.menuItem}
            >
              <ListItemIcon><FolderOpenIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Create repository" secondary="From a repository template" />
            </MenuItem>
          )}
          {isDeveloper && (
            <MenuItem
              onClick={() => { setCreateAnchor(null); navigate('/self-service/ee/create'); }}
              className={classes.menuItem}
            >
              <ListItemIcon><MemoryIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Create execution environment" secondary="Build a custom EE" />
            </MenuItem>
          )}
          {isDeveloper && (
            <MenuItem
              onClick={() => { setCreateAnchor(null); navigate('/self-service/repositories/migrate'); }}
              className={classes.menuItem}
            >
              <ListItemIcon><TransformIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Migrate to Ansible" secondary="Convert a Chef or Puppet repository" />
            </MenuItem>
          )}
          {isDeveloper && <Divider />}
          <MenuItem
            onClick={() => { setCreateAnchor(null); navigate('/create'); }}
            className={classes.menuItem}
          >
            <ListItemIcon><ViewListIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Browse all templates" secondary="View all available templates" />
          </MenuItem>
        </Menu>

        {/* Favorites popover */}
        <Popover
          open={Boolean(favAnchor)}
          anchorEl={favAnchor}
          onClose={() => setFavAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          className={classes.popover}
        >
          <Box className={classes.popoverHeader}>
            <Typography className={classes.popoverTitle}>Starred Items</Typography>
          </Box>
          <StarredItemsList onClose={() => setFavAnchor(null)} />
        </Popover>

        {/* Notifications popover */}
        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          className={classes.popover}
        >
          <Box className={classes.popoverHeader}>
            <Typography className={classes.popoverTitle}>Notifications</Typography>
          </Box>
          <Box className={classes.emptyState}>
            <NotificationsNoneIcon className={classes.emptyIcon} />
            <Typography variant="body2">You're all caught up</Typography>
            <Typography variant="caption" color="textSecondary" style={{ marginTop: 4, display: 'block' }}>
              Pipeline alerts and updates will appear here
            </Typography>
          </Box>
        </Popover>

        {/* Help popover */}
        <Popover
          open={Boolean(helpAnchor)}
          anchorEl={helpAnchor}
          onClose={() => setHelpAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          className={classes.popover}
        >
          <Box className={classes.popoverHeader}>
            <Typography className={classes.popoverTitle}>Help & Support</Typography>
          </Box>
          <List className={classes.helpList} dense>
            <ListItem
              button
              className={classes.helpItem}
              onClick={() => { setHelpAnchor(null); toggleQuickstart(); }}
            >
              <ListItemIcon className={classes.helpItemIcon}>
                <PlaylistAddCheckIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Quick start" secondary="Set up your portal step by step" />
            </ListItem>
            <Divider style={{ margin: '4px 0' }} />
            <ListItem
              button
              className={classes.helpItem}
              onClick={() => { setHelpAnchor(null); navigate('/docs'); }}
            >
              <ListItemIcon className={classes.helpItemIcon}>
                <HelpOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Documentation" secondary="Guides and reference" />
            </ListItem>
            <ListItem
              button
              className={classes.helpItem}
              component="a"
              href="https://access.redhat.com/support"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setHelpAnchor(null)}
            >
              <ListItemIcon className={classes.helpItemIcon}>
                <OpenInNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Red Hat Support" secondary="Open a support case" />
            </ListItem>
            <ListItem
              button
              className={classes.helpItem}
              component="a"
              href="https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setHelpAnchor(null)}
            >
              <ListItemIcon className={classes.helpItemIcon}>
                <OpenInNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="AAP Documentation" secondary="Ansible Automation Platform docs" />
            </ListItem>
          </List>
        </Popover>

        {/* Profile menu */}
        <Menu
          anchorEl={profileAnchor}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          getContentAnchorEl={null}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          className={classes.menu}
        >
          {/* Role switcher — prototype only */}
          <MenuItem disabled style={{ opacity: 0.6 }}>
            <ListItemText
              primary="Switch role"
              primaryTypographyProps={{ variant: 'caption', style: { fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 } }}
            />
          </MenuItem>
          {([
            { role: 'sme' as UserRole, label: 'SME', icon: <PersonOutlineIcon fontSize="small" /> },
            { role: 'developer' as UserRole, label: 'Developer', icon: <BuildIcon fontSize="small" /> },
            { role: 'admin' as UserRole, label: 'Admin', icon: <SupervisorAccountIcon fontSize="small" /> },
          ]).map(({ role: r, label, icon }) => (
            <MenuItem
              key={r}
              className={classes.menuItem}
              selected={currentRole === r}
              onClick={() => {
                localStorage.setItem('portal-user-role', r);
                setProfileAnchor(null);
                window.location.href = '/';
              }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </MenuItem>
          ))}
          <Divider />
          <MenuItem
            component={Link}
            to="/settings"
            onClick={() => setProfileAnchor(null)}
            className={classes.menuItem}
          >
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} className={classes.menuItem}>
            <ListItemIcon><ExitToAppIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
