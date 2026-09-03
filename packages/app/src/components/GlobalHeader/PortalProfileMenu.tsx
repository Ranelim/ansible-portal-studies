import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { useUserProfile } from '@backstage/plugin-user-settings';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { lighten } from '@mui/material/styles';
import {
  SEAT_OPTIONS,
  applySeat,
  usePrototypeSeatSync,
} from './prototypeSeats';
import { prototypeDisplayName } from './prototypeIdentity';

/** user:default/guest → /catalog/default/user/guest */
function entityRefToCatalogPath(entityRef: string): string | null {
  const match = /^([^:/]+):([^/]+)\/(.+)$/.exec(entityRef);
  if (!match) return null;
  const [, kind, namespace, name] = match;
  return `/catalog/${namespace}/${kind}/${encodeURIComponent(name)}`;
}

/** RHDH profile rows: dark/inherit — never primary blue. */
const menuItemSx = {
  color: 'text.primary',
  textDecoration: 'none',
  '&:hover': {
    color: 'text.primary',
    textDecoration: 'none',
  },
  '& .MuiListItemIcon-root': {
    color: 'text.secondary',
    minWidth: 36,
  },
  '& .MuiListItemText-primary': {
    color: 'inherit',
  },
} as const;

/**
 * Profile menu — RHDH account items + demoted prototype seats.
 * Local Menu (not stock HeaderDropdownComponent) so we are not stuck with
 * RHDH’s maxHeight: 60vh scroll trap on a short account list.
 */
export const PortalProfileMenu = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const menuId = useId();
  const { displayName, profile, loading } = useUserProfile();
  const identityApi = useApi(identityApiRef);
  const seatId = usePrototypeSeatSync();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [chevronBg, setChevronBg] = useState('#3C3F42');
  const [profilePath, setProfilePath] = useState('/settings');
  const measured = useRef(false);
  const open = Boolean(anchorEl);
  const onAccountPage =
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    /^\/catalog\/[^/]+\/user\//i.test(pathname);

  useEffect(() => {
    if (measured.current) return;
    const container = document.getElementById('global-header');
    if (container) {
      const base = window.getComputedStyle(container).backgroundColor;
      setChevronBg(lighten(base, 0.2));
      measured.current = true;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    identityApi
      .getBackstageIdentity()
      .then(identity => {
        if (cancelled) return;
        const path = entityRefToCatalogPath(identity.userEntityRef);
        if (path) setProfilePath(path);
      })
      .catch(() => {
        /* Guest fallback → /settings */
      });
    return () => {
      cancelled = true;
    };
  }, [identityApi]);

  const name = prototypeDisplayName(displayName, seatId);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const go = (path: string) => {
    handleClose();
    navigate(path);
  };

  const handleSignOut = async () => {
    handleClose();
    try {
      await identityApi.signOut();
    } catch {
      /* ignore */
    }
    globalThis.location.href = '/';
  };

  return (
    <Box
      data-masthead-active={onAccountPage ? 'true' : undefined}
      data-masthead-menu-open={open ? 'true' : undefined}
    >
      <Tooltip title={name}>
        <Button
          color="inherit"
          disableRipple
          disableTouchRipple
          onClick={handleOpen}
          aria-haspopup="true"
          aria-controls={open ? menuId : undefined}
          aria-expanded={open ? true : undefined}
          aria-current={onAccountPage ? 'page' : undefined}
          sx={{
            display: 'flex',
            alignItems: 'center',
            textTransform: 'none',
            borderRadius: 6,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!loading &&
              (profile?.picture ? (
                <Avatar
                  src={profile.picture}
                  sx={{ mr: 1.5, height: 32, width: 32 }}
                  alt=""
                />
              ) : (
                <AccountCircleOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              ))}
            <Typography
              variant="body2"
              sx={{
                display: { xs: 'none', md: 'block' },
                fontWeight: 500,
                mr: 1,
                maxWidth: 140,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </Typography>
            <KeyboardArrowDownOutlinedIcon
              fontSize="small"
              sx={{
                bgcolor: chevronBg,
                borderRadius: '25%',
              }}
            />
          </Box>
        </Button>
      </Tooltip>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        MenuListProps={{
          'aria-labelledby': menuId,
          sx: theme => ({
            fontSize: '0.875rem',
            boxSizing: 'border-box',
            padding: 0,
            margin: 0,
            minWidth: 220,
            borderRadius: '4px',
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
            // Fit content — no artificial scroll for a short account menu
            maxHeight: 'none',
            overflow: 'visible',
          }),
        }}
      >
        <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: 'text.secondary',
            }}
          >
            Account
          </Typography>
        </Box>
        <MenuItem onClick={() => go('/settings')} sx={menuItemSx}>
          <ListItemIcon>
            <ManageAccountsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="User settings" />
        </MenuItem>
        <MenuItem onClick={() => go(profilePath)} sx={menuItemSx}>
          <ListItemIcon>
            <PersonOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="My profile" />
        </MenuItem>
        <MenuItem onClick={handleSignOut} sx={menuItemSx}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <Box
          sx={theme => ({
            mx: 1,
            mb: 1,
            borderRadius: 1,
            border: `1px dashed ${theme.palette.divider}`,
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 193, 7, 0.08)'
                : 'rgba(255, 193, 7, 0.1)',
            overflow: 'hidden',
          })}
        >
          <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                color: 'text.secondary',
                display: 'block',
              }}
            >
              Prototype only
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                lineHeight: 1.35,
              }}
            >
              Seat switcher for demos — not in production
            </Typography>
          </Box>
          {SEAT_OPTIONS.map(seat => (
            <MenuItem
              key={seat.id}
              selected={seatId === seat.id}
              onClick={() => {
                handleClose();
                applySeat(seat);
              }}
              sx={menuItemSx}
            >
              <ListItemIcon>{seat.icon}</ListItemIcon>
              <ListItemText primary={seat.label} />
            </MenuItem>
          ))}
        </Box>
      </Menu>
    </Box>
  );
};
