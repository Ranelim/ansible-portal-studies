import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import NotificationIcon from '@mui/icons-material/NotificationsOutlined';
import type { CSSProperties } from 'react';
import { DisabledMastheadAction } from './DisabledMastheadAction';

const DEMO_UNREAD_COUNT = 3;

/**
 * Notifications — visible in the study, not navigable.
 */
export const PortalNotificationButton = ({
  title = 'Notifications',
  tooltip,
  layout,
  unreadCount,
}: {
  title?: string;
  tooltip?: string;
  to?: string;
  layout?: CSSProperties;
  unreadCount?: number;
}) => {
  const badgeCount = unreadCount ?? DEMO_UNREAD_COUNT;

  return (
    <Box sx={{ ...layout, display: 'inline-flex', lineHeight: 0 }}>
      <DisabledMastheadAction title={tooltip ?? title}>
        {badgeCount > 0 ? (
          <Badge
            badgeContent={badgeCount}
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
      </DisabledMastheadAction>
    </Box>
  );
};
