import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  makeStyles,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';
import EditIcon from '@material-ui/icons/Edit';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import SettingsIcon from '@material-ui/icons/Settings';
import { DEMO_CONNECTIONS, ConnectionProvider } from './syncDemoData';
import { DismissibleBanner } from '../common/DismissibleBanner';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  sectionTitle: {
    fontWeight: 600,
    fontSize: '1.125rem',
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3),
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  card: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    '&:hover': {
      borderColor: theme.palette.primary.light,
    },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1.5),
  },
  providerName: {
    fontWeight: 600,
    fontSize: 15,
  },
  statusLine: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    marginBottom: theme.spacing(0.5),
    fontSize: 13,
  },
  statusActive: {
    color: statusColors.success,
  },
  statusInactive: {
    color: theme.palette.text.disabled,
  },
  hostLine: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
  authLine: {
    fontSize: 12,
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(1.5),
  },
  cardActions: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  actionButton: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 13,
  },
  syncJobRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  syncJobName: {
    fontSize: 14,
    fontWeight: 500,
  },
  syncJobInterval: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  dialogSection: {
    marginBottom: theme.spacing(3),
  },
  dialogSectionTitle: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  providerIcon: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
    marginRight: theme.spacing(1.5),
  },
  notConfiguredCard: {
    opacity: 0.7,
  },
  pageSubtitle: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
}));

const providerColor = (type: ConnectionProvider['type']): string => {
  switch (type) {
    case 'aap': return '#ee0000';
    case 'pah': return '#ee0000';
    case 'git': return '#24292e';
    case 'registry': return '#ee0000';
    default: return '#757575';
  }
};

const providerLetter = (type: ConnectionProvider['type']): string => {
  switch (type) {
    case 'aap': return 'A';
    case 'pah': return 'A';
    case 'git': return 'G';
    case 'registry': return 'R';
    default: return '?';
  }
};

const ProviderCard = ({ provider }: { provider: ConnectionProvider }) => {
  const classes = useStyles();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isActive = provider.status === 'Active';
  const isConfigured = provider.status !== 'Not configured';

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <>
      <Card
        className={`${classes.card} ${!isConfigured ? classes.notConfiguredCard : ''}`}
        variant="outlined"
      >
        <CardContent>
          <Box className={classes.cardHeader}>
            <Box display="flex" alignItems="center">
              <Box
                className={classes.providerIcon}
                style={{ backgroundColor: providerColor(provider.type) }}
              >
                {providerLetter(provider.type)}
              </Box>
              <Typography className={classes.providerName}>
                {provider.name}
              </Typography>
            </Box>
            {isConfigured && (
              <IconButton size="small" onClick={e => setMenuAnchor(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {isConfigured ? (
            <>
              <Box className={classes.statusLine}>
                {isActive ? (
                  <CheckCircleOutlineIcon className={classes.statusActive} style={{ fontSize: 16 }} />
                ) : (
                  <ErrorOutlineIcon style={{ fontSize: 16, color: statusColors.error }} />
                )}
                <Typography variant="body2" style={{ fontSize: 13 }}>
                  Content discovery: {provider.status}
                </Typography>
              </Box>
              {provider.lastSync && (
                <Box className={classes.statusLine}>
                  <SyncIcon style={{ fontSize: 14, color: '#9e9e9e' }} />
                  <Typography variant="body2" style={{ fontSize: 12, color: '#9e9e9e' }}>
                    Last sync {provider.lastSync}
                  </Typography>
                </Box>
              )}
              {provider.host && (
                <Typography className={classes.hostLine}>
                  Host: {provider.host}
                </Typography>
              )}
              {provider.auth && (
                <Typography className={classes.authLine}>
                  Auth: {provider.auth}
                </Typography>
              )}
              <Box className={classes.cardActions}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<EditIcon />}
                  className={classes.actionButton}
                  onClick={() => setEditOpen(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<SyncIcon />}
                  className={classes.actionButton}
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? 'Syncing...' : 'Sync now'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box className={classes.statusLine}>
                <LinkOffIcon className={classes.statusInactive} style={{ fontSize: 16 }} />
                <Typography variant="body2" style={{ fontSize: 13, color: '#9e9e9e' }}>
                  Not configured
                </Typography>
              </Box>
              <Box className={classes.cardActions} style={{ marginTop: 16 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  className={classes.actionButton}
                >
                  Connect
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        getContentAnchorEl={null}
      >
        <MenuItem onClick={() => { setEditOpen(true); setMenuAnchor(null); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit connection" />
        </MenuItem>
        <MenuItem onClick={() => { handleSync(); setMenuAnchor(null); }}>
          <ListItemIcon><SyncIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Sync now" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <ListItemIcon><DeleteOutlineIcon fontSize="small" style={{ color: statusColors.error }} /></ListItemIcon>
          <ListItemText primary="Disconnect" primaryTypographyProps={{ style: { color: statusColors.error } }} />
        </MenuItem>
      </Menu>

      <EditConnectionDialog
        provider={provider}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
};

const EditConnectionDialog = ({
  provider,
  open,
  onClose,
}: {
  provider: ConnectionProvider;
  open: boolean;
  onClose: () => void;
}) => {
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit {provider.name} connection
      </DialogTitle>
      <DialogContent>
        <Box className={classes.dialogSection}>
          <Typography className={classes.dialogSectionTitle}>
            Connection Settings
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ fontSize: 13 }}>
            {provider.host ? `Host: ${provider.host}` : 'No host configured'}
          </Typography>
          {provider.auth && (
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 13, marginTop: 4 }}>
              Auth: {provider.auth}
            </Typography>
          )}
        </Box>

        {provider.syncJobs.length > 0 && (
          <Box className={classes.dialogSection}>
            <Typography className={classes.dialogSectionTitle}>
              Sync Schedule
            </Typography>
            {provider.syncJobs.map(job => (
              <Box key={job.name} className={classes.syncJobRow}>
                <Box>
                  <Typography className={classes.syncJobName}>{job.name}</Typography>
                  <Typography className={classes.syncJobInterval}>{job.interval}</Typography>
                </Box>
                <FormControlLabel
                  control={<Switch checked={job.enabled} color="primary" size="small" />}
                  label=""
                />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} style={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          style={{ textTransform: 'none' }}
        >
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ConnectionsPage = () => {
  const classes = useStyles();

  const automationPlatforms = DEMO_CONNECTIONS.filter(
    c => c.type === 'aap' || c.type === 'pah' || c.type === 'registry',
  );
  const sourceControlProviders = DEMO_CONNECTIONS.filter(c => c.type === 'git');

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Connections
            <PageHelpIcon
              tooltipLabel="What are connections?"
              title="What are Connections?"
              description="Connections are integrations with external platforms like Ansible Automation Platform, Git providers, and content registries. They enable content discovery, sync, and project deployment."
            />
          </Box>
        }
        pageTitleOverride="Connections"
        subtitle="Manage integrations with external platforms for content discovery and user authentication (SSO)"
      />
      <Content>
        <DismissibleBanner
          storageKey="admin-connections"
          message="Connect the portal to your automation infrastructure. Add Ansible Automation Platform controllers, Git providers, and content registries to enable content discovery, sync, and project deployment."
        />
        <Typography className={classes.sectionTitle}>
          Automation & Content Platforms
        </Typography>
        <Box className={classes.cardGrid}>
          {automationPlatforms.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </Box>

        <Typography className={classes.sectionTitle}>
          Source Control Providers
        </Typography>
        <Box className={classes.cardGrid}>
          {sourceControlProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </Box>
      </Content>
    </Page>
  );
};
