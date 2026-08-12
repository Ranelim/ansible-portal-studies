import { useNavigate } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography,
  makeStyles,
} from '@material-ui/core';
import AppsIcon from '@material-ui/icons/Apps';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';

const DEMO_ITEMS = [
  {
    id: '1',
    title: 'Template run failed',
    detail: 'network-harden · Automate · 12 minutes ago',
    severity: 'Critical',
    experience: 'Automate',
  },
  {
    id: '2',
    title: 'Quality score dropped',
    detail: 'edge-firewall · Develop · 1 hour ago',
    severity: 'Important',
    experience: 'Develop',
  },
  {
    id: '3',
    title: 'Compliance scan completed',
    detail: 'prod-rhel · Compliance · Yesterday',
    severity: 'Normal',
    experience: 'Compliance',
  },
];

const useStyles = makeStyles(theme => ({
  intro: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    maxWidth: 720,
    lineHeight: 1.6,
  },
  list: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
  },
  teaser: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    borderRadius: 4,
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.secondary,
    fontSize: 13,
    maxWidth: 720,
  },
}));

/**
 * Cross-experience notification center teaser (ideal-first).
 * Not Backstage plugin chrome — prototype only.
 */
export const PortalNotificationsPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  return (
    <Page themeId="app">
      <Header
        title="Notifications"
        pageTitleOverride="Notifications"
        subtitle="Across every experience — triage here, act in context"
      >
        <Button
          color="primary"
          variant="outlined"
          size="small"
          startIcon={<AppsIcon />}
          style={{ textTransform: 'none', borderRadius: 20 }}
          onClick={() => navigate('/self-service/experiences')}
        >
          Experiences
        </Button>
      </Header>
      <Content>
        <Typography variant="body2" className={classes.intro}>
          Prototype center. Entry is the masthead bell only (RHDH-aligned).
          Subscriptions and admin routing come later — not yaml-only as the
          end-user story.
        </Typography>
        <List className={classes.list} disablePadding>
          {DEMO_ITEMS.map(item => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                    <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={item.severity}
                      variant="outlined"
                      style={{ borderRadius: 12, height: 22, fontSize: 11 }}
                    />
                  </Box>
                }
                secondary={item.detail}
              />
            </ListItem>
          ))}
          {DEMO_ITEMS.length === 0 && (
            <ListItem>
              <Box textAlign="center" width="100%" py={4}>
                <NotificationsNoneIcon style={{ opacity: 0.3, fontSize: 36 }} />
                <Typography color="textSecondary">You're all caught up</Typography>
              </Box>
            </ListItem>
          )}
        </List>
        <Typography className={classes.teaser}>
          Ideal-first teaser — gap-map to @backstage/plugin-notifications /
          RHDH after Shiran’s production config. See portal-notifications.mdc.
        </Typography>
      </Content>
    </Page>
  );
};
