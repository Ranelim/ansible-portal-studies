import { Page, Header, Content } from '@backstage/core-components';
import { Box, Typography, makeStyles } from '@material-ui/core';
import { PageHelpIcon } from '../common/PageHelpIcon';

const useStyles = makeStyles(theme => ({
  note: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    maxWidth: 560,
  },
}));

/**
 * Administration → Notifications
 * Platform defaults / channels (Class D). Personal mute prefs stay under profile Settings.
 * Prototype shell only — ideal UX TBD (see portal-notifications doctrine).
 */
export const NotificationsAdminPage = () => {
  const classes = useStyles();

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Notifications
            <PageHelpIcon
              tooltipLabel="What is Notifications admin?"
              title="Platform notifications"
              description="Configure organization defaults, channels, and approval-related notification policy for this Portal instance. Personal preferences (mute types, delivery) live under the profile menu — not here."
            />
          </Box>
        }
        pageTitleOverride="Notifications"
        subtitle="Platform notification defaults and channels. Personal prefs stay in account Settings."
      />
      <Content>
        <Typography className={classes.note}>
          Admin controls TBD — channels, org defaults, and who can trigger
          approvals. End users manage their own notification prefs from the
          profile menu.
        </Typography>
      </Content>
    </Page>
  );
};
