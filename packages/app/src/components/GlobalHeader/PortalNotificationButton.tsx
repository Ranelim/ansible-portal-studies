import { useLocation, useNavigate } from 'react-router-dom';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import NotificationIcon from '@mui/icons-material/NotificationsOutlined';
import type { CSSProperties } from 'react';
import {
  mastheadIconButtonSx,
  mastheadTooltipChildSx,
} from './mastheadIconSx';

/**
 * Notifications — same masthead icon grid as Create / Starred / Help.
 */
export const PortalNotificationButton = ({
  title = 'Notifications',
  tooltip,
  to = '/notifications',
  layout,
  unreadCount = 3,
}: {
  title?: string;
  tooltip?: string;
  to?: string;
  layout?: CSSProperties;
  unreadCount?: number;
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active =
    pathname === to || pathname.startsWith(`${to.replace(/\/$/, '')}/`);

  return (
    <Box sx={{ ...layout, display: 'inline-flex', lineHeight: 0 }}>
      <Tooltip title={tooltip ?? title}>
        <Box
          component="span"
          sx={mastheadTooltipChildSx}
          data-masthead-active={active ? 'true' : undefined}
        >
          <IconButton
            color="inherit"
            onClick={() => navigate(to)}
            aria-label={title}
            aria-current={active ? 'page' : undefined}
            sx={mastheadIconButtonSx(active)}
          >
            {unreadCount > 0 ? (
              <Badge
                badgeContent={unreadCount}
                color="error"
                max={999}
                overlap="circular"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: 10,
                    height: 16,
                    minWidth: 16,
                    padding: '0 4px',
                  },
                }}
              >
                <NotificationIcon />
              </Badge>
            ) : (
              <NotificationIcon />
            )}
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
};
