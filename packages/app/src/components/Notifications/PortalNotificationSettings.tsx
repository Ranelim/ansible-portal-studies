import { useCallback, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import {
  NOTIFICATION_EVENT_OPTIONS,
  readNotificationPrefs,
  writeNotificationPrefs,
  type NotificationEventType,
  type NotificationPrefs,
} from './notificationPrefs';

const useStyles = makeStyles(theme => ({
  intro: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
    maxWidth: 640,
  },
  list: {
    padding: 0,
  },
  item: {
    paddingRight: theme.spacing(10),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
}));

/**
 * End-user notification prefs — global event types (not per experience).
 * Used by User settings → Notifications and the inbox Notification settings page.
 */
export const PortalNotificationSettings = () => {
  const classes = useStyles();
  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    readNotificationPrefs(),
  );

  const setEnabled = useCallback((id: NotificationEventType, enabled: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, [id]: enabled };
      writeNotificationPrefs(next);
      return next;
    });
  }, []);

  return (
    <Box>
      <Typography className={classes.intro} variant="body1">
        Choose which notification types appear in your inbox. These apply across
        all experiences.
      </Typography>
      <InfoCard title="Notify me about" variant="gridItem">
        <List className={classes.list} disablePadding>
          {NOTIFICATION_EVENT_OPTIONS.map(option => (
            <ListItem key={option.id} className={classes.item}>
              <ListItemText
                primary={option.title}
                secondary={option.description}
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color="primary"
                  checked={prefs[option.id]}
                  onChange={(_, checked) => setEnabled(option.id, checked)}
                  inputProps={{
                    'aria-label': `Notify me about ${option.title}`,
                  }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </InfoCard>
    </Box>
  );
};
