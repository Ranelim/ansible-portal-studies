import { Link as RouterLink } from 'react-router-dom';
import { Header, Page, Content } from '@backstage/core-components';
import { Typography, makeStyles } from '@material-ui/core';
import { PortalNotificationSettings } from './PortalNotificationSettings';

const useStyles = makeStyles(theme => ({
  hubLink: {
    display: 'block',
    marginTop: theme.spacing(3),
    fontSize: 13,
    color: theme.palette.text.secondary,
    '& a': {
      color: theme.palette.primary.main,
      fontWeight: 500,
    },
  },
}));

/**
 * Inbox → notification prefs. Back to Notifications (not the User settings hub).
 * Same toggles as User settings → Notifications.
 */
export const PortalNotificationSettingsPage = () => {
  const classes = useStyles();

  return (
    <Page themeId="tool">
      <Header
        title="Notification settings"
        type="Notifications"
        typeLink="/notifications"
        pageTitleOverride="Notification settings"
      />
      <Content>
        <PortalNotificationSettings />
        <Typography className={classes.hubLink} component="p">
          Theme, profile, and other account preferences are in{' '}
          <RouterLink to="/settings">User settings</RouterLink>.
        </Typography>
      </Content>
    </Page>
  );
};
