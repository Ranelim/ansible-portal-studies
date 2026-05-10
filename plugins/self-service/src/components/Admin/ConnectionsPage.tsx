import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  makeStyles,
  Chip,
  Tooltip,
  IconButton,
} from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import WarningAmberIcon from '@material-ui/icons/ReportProblemOutlined';
import PublicIcon from '@material-ui/icons/Public';
import ComputerIcon from '@material-ui/icons/Computer';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { SvgIcon } from '@material-ui/core';

const AnsibleIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm4.54 17.85L12 7.97l-1.78 4.26 3.63 2.89H9.6l-1.06-.83L12 5.31l6.09 13.27a.28.28 0 01-.26.38h-1.29z" />
  </SvgIcon>
);

const GitHubIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </SvgIcon>
);

const GitLabIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.387 9.452.045 13.587a.924.924 0 00.331 1.023L12 23.054l11.624-8.443a.92.92 0 00.331-1.024" />
  </SvgIcon>
);

const PAHIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm-9 15H5v-2h7v2zm4-4H5v-2h11v2zm3-4H5V8h14v2z" />
  </SvgIcon>
);
import { useNavigate } from 'react-router-dom';
import { DEMO_CONNECTIONS, ConnectionProvider } from './syncDemoData';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  sectionTitle: {
    fontWeight: 600,
    fontSize: '1.125rem',
    marginTop: theme.spacing(3),
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: theme.spacing(2),
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  card: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    '&:hover': {
      borderColor: theme.palette.primary.light,
      boxShadow: `0 0 0 1px ${theme.palette.primary.light}`,
    },
  },
  cardContent: {
    padding: theme.spacing(2.5),
    '&:last-child': { paddingBottom: theme.spacing(2.5) },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1.5),
  },
  providerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: theme.spacing(1.5),
  },
  providerName: {
    fontWeight: 600,
    fontSize: 15,
    lineHeight: 1.3,
  },
  providerType: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  cardMeta: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.6,
    marginTop: theme.spacing(0.5),
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  notConfiguredCard: {
    opacity: 0.7,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: 5,
  },
  failureBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    borderRadius: 6,
    border: `1px solid rgba(201,25,11,0.3)`,
    backgroundColor: 'rgba(201,25,11,0.06)',
    marginBottom: theme.spacing(2),
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
}));

const providerIcon = (id: string): { icon: React.ReactNode; bg: string } => {
  switch (id) {
    case 'aap':
      return { icon: <AnsibleIcon style={{ fontSize: 20, color: '#fff' }} />, bg: '#ee0000' };
    case 'pah':
      return { icon: <PAHIcon style={{ fontSize: 20, color: '#fff' }} />, bg: '#ee0000' };
    case 'github':
      return { icon: <GitHubIcon style={{ fontSize: 20, color: '#fff' }} />, bg: '#24292e' };
    case 'gitlab':
      return { icon: <GitLabIcon style={{ fontSize: 20, color: '#fff' }} />, bg: '#FC6D26' };
    case 'registries':
      return { icon: <PublicIcon style={{ fontSize: 20, color: '#fff' }} />, bg: '#4A4A4A' };
    case 'devspaces':
      return { icon: <ComputerIcon style={{ fontSize: 20, color: '#fff' }} />, bg: '#0066CC' };
    default:
      return { icon: <AnsibleIcon style={{ fontSize: 20, color: '#fff' }} />, bg: '#757575' };
  }
};

const providerTypeLabel = (type: ConnectionProvider['type']): string => {
  switch (type) {
    case 'aap': return 'Automation Platform';
    case 'pah': return 'Content Registry';
    case 'git': return 'Source Control';
    case 'registry': return 'Public Content';
    case 'devtools': return 'Development Environment';
    default: return '';
  }
};

const getCardDescription = (id: string, isConfigured: boolean): string => {
  if (isConfigured) {
    switch (id) {
      case 'aap': return '3 organizations · 42 job templates · 60 users';
      case 'devspaces': return 'Browser-based VS Code environments with the Ansible extension and Lightspeed AI. When connected, "Edit in Dev Spaces" actions appear on all projects.';
      default: return '';
    }
  }
  switch (id) {
    case 'pah': return 'Sync collections, execution environments, and roles from your private hub.';
    case 'github': return 'Import repositories containing playbooks, roles, and automation projects.';
    case 'gitlab': return 'Import repositories containing playbooks, roles, and automation projects.';
    case 'registries': return 'Index certified and validated content from Ansible Galaxy and Red Hat.';
    case 'devspaces': return 'Provide your OpenShift Dev Spaces URL to enable browser-based editing directly from projects in the portal.';
    default: return '';
  }
};

const getCardWarning = (provider: ConnectionProvider): string | null => {
  if (provider.id === 'aap' && provider.status === 'Active' && provider.orgCount === 0) {
    return 'No organizations selected — job templates and users will not be synced.';
  }
  return null;
};

const ProviderCard = ({ provider }: { provider: ConnectionProvider }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  const isConfigured = provider.status !== 'Not configured';
  const isActive = provider.status === 'Active';
  const { icon, bg } = providerIcon(provider.id);
  const description = getCardDescription(provider.id, isConfigured);
  const warning = getCardWarning(provider);

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <Card
      className={`${classes.card} ${!isConfigured ? classes.notConfiguredCard : ''}`}
      variant="outlined"
    >
      <CardActionArea
        onClick={() => navigate(`/self-service/admin/integrations/${provider.id}`)}
      >
        <CardContent className={classes.cardContent}>
          <Box className={classes.cardHeader}>
            <Box display="flex" alignItems="center">
              <Box className={classes.providerIcon} style={{ backgroundColor: bg }}>
                {icon}
              </Box>
              <Box>
                <Typography className={classes.providerName}>
                  {provider.name}
                </Typography>
                <Typography className={classes.providerType}>
                  {providerTypeLabel(provider.type)}
                </Typography>
              </Box>
            </Box>
            <Tooltip title={isConfigured ? (isActive ? 'This source is connected and syncing content to the portal.' : 'This source has a connection error.') : 'This source has not been configured yet.'} arrow>
              <Chip
                label={isConfigured ? (isActive ? 'Connected' : 'Error') : 'Not connected'}
                size="small"
                style={{
                  fontSize: 11,
                  height: 22,
                  backgroundColor: isConfigured
                    ? (isActive ? 'rgba(99,153,61,0.15)' : 'rgba(201,25,11,0.15)')
                    : 'rgba(255,255,255,0.08)',
                  color: isConfigured
                    ? (isActive ? statusColors.success : statusColors.error)
                    : '#999',
                }}
              />
            </Tooltip>
          </Box>

          {isConfigured ? (
            <>
              <Typography className={classes.cardMeta}>
                {provider.host}
                {provider.lastSync && (
                  <>
                    {' · '}
                    <span
                      className={classes.syncDot}
                      style={{ backgroundColor: isActive ? statusColors.success : statusColors.error }}
                    />
                    Last sync {provider.lastSync}
                  </>
                )}
              </Typography>
              {description && (
                <Typography className={classes.cardMeta} style={{ fontWeight: 500, color: 'inherit' }}>
                  {description}
                </Typography>
              )}
              {warning && (
                <Box display="flex" alignItems="flex-start" style={{ gap: 6, marginTop: 8 }}>
                  <WarningAmberIcon style={{ fontSize: 16, color: statusColors.warning, flexShrink: 0, marginTop: 1 }} />
                  <Typography style={{ fontSize: 12, color: statusColors.warning, lineHeight: 1.4 }}>
                    {warning}
                  </Typography>
                </Box>
              )}
              <Box className={classes.cardFooter}>
                <Button
                  size="small"
                  color="primary"
                  startIcon={<SyncIcon style={{ fontSize: 16 }} />}
                  onClick={handleSync}
                  disabled={syncing}
                  style={{ textTransform: 'none', fontSize: 12 }}
                >
                  {syncing ? 'Syncing…' : 'Sync now'}
                </Button>
                <Box display="flex" alignItems="center" style={{ gap: 4, color: '#0066CC', fontSize: 12 }}>
                  Configure <ArrowForwardIcon style={{ fontSize: 14 }} />
                </Box>
              </Box>
            </>
          ) : (
            <>
              {description && (
                <Typography className={classes.cardMeta}>
                  {description}
                </Typography>
              )}
              <Box className={classes.cardFooter}>
                <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                  <LinkOffIcon style={{ fontSize: 14, color: '#999' }} />
                  <Typography style={{ fontSize: 12, color: '#999' }}>
                    Not configured
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" style={{ gap: 4, color: '#0066CC', fontSize: 12 }}>
                  Connect <ArrowForwardIcon style={{ fontSize: 14 }} />
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const DevToolsCard = ({ provider }: { provider: ConnectionProvider }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const isConfigured = provider.status !== 'Not configured';
  const isActive = provider.status === 'Active';
  const { icon, bg } = providerIcon(provider.id);
  const description = getCardDescription(provider.id, isConfigured);

  return (
    <Card
      className={`${classes.card} ${!isConfigured ? classes.notConfiguredCard : ''}`}
      variant="outlined"
    >
      <CardActionArea onClick={() => navigate(`/self-service/admin/integrations/${provider.id}`)}>
        <CardContent className={classes.cardContent}>
          <Box className={classes.cardHeader}>
            <Box display="flex" alignItems="center">
              <Box className={classes.providerIcon} style={{ backgroundColor: bg }}>
                {icon}
              </Box>
              <Box>
                <Typography className={classes.providerName}>
                  {provider.name}
                </Typography>
                <Typography className={classes.providerType}>
                  {providerTypeLabel(provider.type)}
                </Typography>
              </Box>
            </Box>
            <Tooltip title={isConfigured ? 'Dev Spaces is connected and available to developers.' : 'Dev Spaces has not been configured yet.'} arrow>
              <Chip
                label={isConfigured ? 'Connected' : 'Not connected'}
                size="small"
                style={{
                  fontSize: 11,
                  height: 22,
                  backgroundColor: isConfigured
                    ? 'rgba(99,153,61,0.15)'
                    : 'rgba(255,255,255,0.08)',
                  color: isConfigured
                    ? statusColors.success
                    : '#999',
                }}
              />
            </Tooltip>
          </Box>

          {isConfigured ? (
            <>
              <Typography className={classes.cardMeta}>
                {provider.host}
              </Typography>
              {description && (
                <Typography className={classes.cardMeta} style={{ lineHeight: 1.5 }}>
                  {description}
                </Typography>
              )}
              <Box className={classes.cardFooter}>
                <Button
                  size="small"
                  color="primary"
                  startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    window.open(`https://${provider.host}/dashboard/#/workspaces`, '_blank');
                  }}
                  style={{ textTransform: 'none', fontSize: 12 }}
                >
                  Open dashboard
                </Button>
                <Box display="flex" alignItems="center" style={{ gap: 4, color: '#0066CC', fontSize: 12 }}>
                  Configure <ArrowForwardIcon style={{ fontSize: 14 }} />
                </Box>
              </Box>
            </>
          ) : (
            <>
              {description && (
                <Typography className={classes.cardMeta}>
                  {description}
                </Typography>
              )}
              <Box className={classes.cardFooter}>
                <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                  <LinkOffIcon style={{ fontSize: 14, color: '#999' }} />
                  <Typography style={{ fontSize: 12, color: '#999' }}>
                    Not configured
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" style={{ gap: 4, color: '#0066CC', fontSize: 12 }}>
                  Connect <ArrowForwardIcon style={{ fontSize: 14 }} />
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const SyncFailureBanner = ({ classes }: { classes: ReturnType<typeof useStyles> }) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const aapProvider = DEMO_CONNECTIONS.find(c => c.id === 'aap');
  if (!aapProvider || aapProvider.status !== 'Active') return null;

  return (
    <Box className={classes.failureBanner}>
      <ErrorOutlineIcon style={{ fontSize: 18, color: statusColors.error, marginTop: 1 }} />
      <Box flex={1}>
        <Typography style={{ fontSize: 13, fontWeight: 500, color: statusColors.error }}>
          Sync failure detected
        </Typography>
        <Typography style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          GitHub — ansible-network: Repository scan failed (rate limit exceeded).{' '}
          <span style={{ color: '#4DA3FF', cursor: 'pointer' }}>View details</span>
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => setDismissed(true)} style={{ marginTop: -4 }}>
        <CloseIcon style={{ fontSize: 16, color: '#999' }} />
      </IconButton>
    </Box>
  );
};

export const ConnectionsPage = () => {
  const classes = useStyles();
  const [syncing, setSyncing] = useState(false);

  const connections = DEMO_CONNECTIONS.filter(c => c.type === 'aap' || c.type === 'pah');
  const sourceControl = DEMO_CONNECTIONS.filter(c => c.type === 'git');
  const containerRegistries = DEMO_CONNECTIONS.filter(c => c.type === 'registry');
  const devTools = DEMO_CONNECTIONS.filter(c => c.type === 'devtools');

  const handleSyncAll = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2500);
  };

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Integrations
            <PageHelpIcon
              tooltipLabel="What are integrations?"
              title="What are Integrations?"
              description="Integrations connect the portal to the automation platforms, content registries, and developer tools that power your workflows. Configure credentials, choose what content to sync, and enable optional tools for your team."
            />
          </Box>
        }
        pageTitleOverride="Integrations"
        subtitle="Manage connections to automation platforms, content registries, and developer tools"
      >
        <Box className={classes.headerActions}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SyncIcon style={{ fontSize: 16 }} />}
            onClick={handleSyncAll}
            disabled={syncing}
            style={{ textTransform: 'none', fontSize: 13 }}
          >
            {syncing ? 'Syncing…' : 'Sync all'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon style={{ fontSize: 16 }} />}
            style={{ textTransform: 'none', fontSize: 13 }}
          >
            Add integration
          </Button>
        </Box>
      </Header>
      <Content>
        <SyncFailureBanner classes={classes} />

        <Typography className={classes.sectionTitle}>
          Automation platforms
        </Typography>
        <Box className={classes.cardGrid}>
          {connections.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </Box>

        <Typography className={classes.sectionTitle}>
          Source control
        </Typography>
        <Box className={classes.cardGrid}>
          {sourceControl.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </Box>

        <Typography className={classes.sectionTitle}>
          Container registries
        </Typography>
        <Box className={classes.cardGrid}>
          {containerRegistries.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </Box>

        {devTools.length > 0 && (
          <>
            <Typography className={classes.sectionTitle}>
              Developer tools
            </Typography>
            <Box className={classes.cardGrid}>
              {devTools.map(provider => (
                <DevToolsCard key={provider.id} provider={provider} />
              ))}
            </Box>
          </>
        )}
      </Content>
    </Page>
  );
};

export const SCMIntegrationPage = () => {
  const classes = useStyles();

  const sourceControlProviders = DEMO_CONNECTIONS.filter(c => c.type === 'git');

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            SCM Integration
            <PageHelpIcon
              tooltipLabel="What is SCM Integration?"
              title="What is SCM Integration?"
              description="SCM integrations connect the portal to the Git providers where your teams store automation projects. The portal scans configured organizations and repositories to index playbooks, roles, and collections — making them discoverable without manual registration."
            />
          </Box>
        }
        pageTitleOverride="SCM Integration"
        subtitle="Connect to Git providers to scan and index playbooks, roles, and collections from your repositories"
      />
      <Content>
        <Box className={classes.cardGrid}>
          {sourceControlProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </Box>
      </Content>
    </Page>
  );
};
