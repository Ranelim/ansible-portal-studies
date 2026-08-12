import { useNavigate } from 'react-router-dom';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import NotificationIcon from '@mui/icons-material/NotificationsOutlined';
import type { CSSProperties } from 'react';

/**
 * Same visual as RHDH NotificationButton, always visible.
 * Uses navigate (not Backstage Link) so icons stay header-grey, not primary blue.
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

  return (
    <Box sx={layout}>
      <Tooltip title={tooltip ?? title}>
        <IconButton
          color="inherit"
          size="small"
          onClick={() => navigate(to)}
          aria-label={title}
        >
          {unreadCount > 0 ? (
            <Badge badgeContent={unreadCount} color="error" max={999}>
              <NotificationIcon fontSize="small" />
            </Badge>
          ) : (
            <NotificationIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
};
