import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  InputBase,
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
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import AccountCircle from '@material-ui/icons/AccountCircle';
import SettingsIcon from '@material-ui/icons/Settings';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { makeStyles, alpha } from '@material-ui/core/styles';
import { Link, useNavigate } from 'react-router-dom';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { useState } from 'react';
import { useLightspeed } from '../Lightspeed';

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
  search: {
    position: 'relative',
    borderRadius: 20,
    backgroundColor: alpha(theme.palette.common.white, 0.1),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.16),
    },
    marginLeft: theme.spacing(0.5),
    width: 'auto',
    flexShrink: 1,
    transition: theme.transitions.create(['background-color']),
  },
  searchIconWrapper: {
    padding: theme.spacing(0, 1.5),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 2, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(3)}px)`,
    transition: theme.transitions.create('width'),
    width: '26ch',
    fontSize: 13,
    color: 'inherit',
    '&:focus': {
      width: '38ch',
    },
    '&::placeholder': {
      opacity: 0.5,
    },
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
  <svg width="36" height="36" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M356.3 235.8c17.5 0 31.4-2.7 42.5-7.4 11.1-4.8 19.1-11.9 23.9-20.5 3.8-7 5.6-15.3 5-24.3-1.6-20.3-12.5-35.3-31.7-45l-53.3-28.6L256 192l-40.2 21.6 53.3 28.6c19.2 9.7 40.4 13.6 62.8 6.5 5.4-1.7 10.8-3.9 16.1-6.7 2.5-1.3 4.9-2.8 7.3-4.4.4-.3.7-.5 1-.8z" fill="#EE0000"/>
    <path d="M289.6 273.9c-25.4 0-49.3-8.4-62.8-17.7l-78.7-45.6L256 128l78.7 45.6c25.5 15.3 29 36.3 10.3 53.5-11.2 10.3-29.2 17.5-50.4 19.8-1.7.1-3.3.2-5 .2v26.8z" fill="#EE0000"/>
    <path d="M256 128l-107.1 82.6L70 256l107.1 64.6c17.8 10.8 38.8 16.4 57.6 16.4 24.8 0 48.6-8.8 66.2-25.6 19.1-18.3 25.4-42 13.6-61.7-3-5-6.9-9.6-11.6-13.8 8.7.5 17.1-.2 25.2-2.2 8.5-2.1 16.5-5.5 23.7-10.1 4.8-3.1 9.3-6.7 13.4-10.3.8-.8 1.6-1.5 2.3-2.3 2.7-2.9 5.1-6 7.3-9.2 2.5-3.7 4.6-7.6 6.3-10.8 3.4-6.3 5.2-12.7 5.2-19.8 0-3.5-.5-7.1-1.4-10.8C375.5 143 355 128 327.5 128H256z" fill="#EE0000"/>
    <path d="M256 337c-24.6 0-46.1 8.4-62.8 17.7L70 296v24.5l123.2 58.2c17.8 10.7 38.8 16.3 57.6 16.3 24.8 0 48.6-8.8 66.2-25.5 12.8-12.3 19.9-27 19.6-41.4v-1.8c-11.2 13.4-30 19.5-49.1 22.4-10 1.5-20.4 1.3-31.5-1.7z" fill="#EE0000"/>
    <path d="M256 377c-24.6 0-46.1-8.4-62.8-17.7L70 417v-24.5l123.2-58.2c17.8-10.8 38.8-16.4 57.6-16.4 24.8 0 48.6 8.8 66.2 25.6 12.8 12.3 19.9 27 19.6 41.4v1.8c-4.6-5.6-10.2-10.5-16.7-14.6-18.3-11.5-41.6-16.1-64.9-5.1z" fill="#EE0000"/>
  </svg>
);

const LightspeedStarIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

export const GlobalHeader = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const identityApi = useApi(identityApiRef);
  const { isOpen: isLightspeedOpen, toggle: toggleLightspeed } = useLightspeed();
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [helpAnchor, setHelpAnchor] = useState<null | HTMLElement>(null);
  const [favAnchor, setFavAnchor] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchValue.trim())}`);
    }
  };

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
        <Box component="form" onSubmit={handleSearchSubmit} className={classes.search}>
          <div className={classes.searchIconWrapper}>
            <SearchIcon fontSize="small" />
          </div>
          <InputBase
            placeholder="Search projects, templates, docs..."
            classes={{ root: classes.inputRoot, input: classes.inputInput }}
            inputProps={{ 'aria-label': 'search' }}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
        </Box>

        <div className={classes.spacer} />

        {/* Create - goes to all software templates */}
        <Tooltip title="Create..." arrow>
          <IconButton
            className={classes.iconButton}
            onClick={() => navigate('/create')}
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
            <StarBorderIcon />
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
          <Typography className={classes.profileName}>Guest</Typography>
        </IconButton>

        {/* === Popovers & Menus === */}

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
          <Box className={classes.emptyState}>
            <StarBorderIcon className={classes.emptyIcon} />
            <Typography variant="body2">No starred items yet</Typography>
            <Typography variant="caption" color="textSecondary" style={{ marginTop: 4, display: 'block' }}>
              Star projects and templates for quick access
            </Typography>
          </Box>
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
