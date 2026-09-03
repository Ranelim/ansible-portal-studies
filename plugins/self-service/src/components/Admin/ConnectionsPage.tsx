import { useState, useEffect } from 'react';
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
  Tab,
  Tabs,
  SvgIcon,
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import SyncIcon from '@material-ui/icons/Sync';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import WarningAmberIcon from '@material-ui/icons/ReportProblemOutlined';
import PublicIcon from '@material-ui/icons/Public';
import ComputerIcon from '@material-ui/icons/Computer';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import AddIcon from '@material-ui/icons/Add';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConnectionSyncDialog } from './ConnectionSyncDialog';
import { useAdminSyncIa } from './useAdminSyncIa';
import { useIntegrationsOrientIa } from './useIntegrationsOrientIa';
import { SyncHistoryEmbedded } from './SyncActivityPage';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { DismissibleBanner } from '../common/DismissibleBanner';
import { ReadCountBadge } from '../common/ReadCountBadge';
import { DEMO_CONNECTIONS, ConnectionProvider } from './syncDemoData';
import { statusColors } from '../common/statusColors';
import { useDevSpacesSetup } from '../../hooks/devSpacesSetup';
import {
  useConnectionSetup,
  withLiveConnectionStatus,
} from '../../hooks/connectionSetup';
import { useAttentionClearOnActive } from '../../hooks/attentionSeen';

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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  pageTabs: {
    marginBottom: 0,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  filterGroup: {
    '& .MuiToggleButton-root': {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: 13,
      padding: '4px 12px',
      lineHeight: 1.4,
    },
  },
  filterLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    lineHeight: 1,
  },
  empty: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    padding: theme.spacing(3, 0),
  },
}));

const providerIcon = (id: string): { icon: React.ReactNode; bg: string } => {
  switch (id) {
    case 'aap':
      return { icon: <AnsibleIcon style={{ fontSize: 20, color: '#fff' }} />, bg: '#ee0000' };
    case 'orchestrator':
      return {
        icon: <AccountTreeIcon style={{ fontSize: 20, color: '#fff' }} />,
        bg: '#8476D1',
      };
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
    case 'orchestrator': return 'Automation Platform';
    case 'pah': return 'Automation Hub';
    case 'git': return 'Source control';
    case 'registry': return 'Container registry';
    case 'devtools': return 'Developer tools';
    default: return '';
  }
};

const JOB_LINE: Record<string, string> = {
  aap: 'Job templates, users, and teams from Controller.',
  orchestrator: 'Software templates and workflows from Orchestrator.',
  pah: 'Collections, execution environments, and roles from your private Hub.',
  github: 'Organizations the Portal crawls for automation content.',
  gitlab: 'Groups the Portal crawls for automation content.',
  registries: 'Certified and validated EE images — not Git repositories.',
  devspaces:
    'Optional. Paste a URL so Edit in Dev Spaces appears on Git Repositories.',
};

const getCardDescription = (id: string, isConfigured: boolean): string => {
  if (isConfigured) {
    switch (id) {
      case 'aap': return '3 organizations · 42 job templates · 60 users';
      case 'orchestrator': return '4 software templates';
      case 'devspaces': return JOB_LINE.devspaces;
      default: return '';
    }
  }
  switch (id) {
    case 'pah': return JOB_LINE.pah;
    case 'orchestrator':
      return 'Connect Orchestrator so software templates appear in the Portal catalog.';
    case 'github': return 'Import repositories containing playbooks, roles, and automation projects.';
    case 'gitlab': return 'Import repositories containing playbooks, roles, and automation projects.';
    case 'registries': return 'Index certified and validated content from Ansible Galaxy and Red Hat.';
    case 'devspaces': return JOB_LINE.devspaces;
    default: return '';
  }
};

const cadenceLabel = (provider: ConnectionProvider): string | null => {
  if (provider.type === 'devtools') return null;
  const job =
    provider.syncJobs.find(j => j.enabled) ?? provider.syncJobs[0];
  return job?.interval ?? null;
};

const getCardWarning = (provider: ConnectionProvider): string | null => {
  if (provider.id === 'aap' && provider.status === 'Active' && provider.orgCount === 0) {
    return 'No organizations selected — job templates and users will not be synced.';
  }
  return null;
};

const ProviderCard = ({
  provider,
  onRequestSync,
}: {
  provider: ConnectionProvider;
  onRequestSync: (provider: ConnectionProvider) => void;
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { variant } = useAdminSyncIa();
  const { variant: orientVariant } = useIntegrationsOrientIa();
  const connectOnly = variant === 'opt2';
  const orient = orientVariant === 'orient';

  const isConfigured = provider.status !== 'Not configured';
  const isActive = provider.status === 'Active';
  const { icon, bg } = providerIcon(provider.id);
  const description = getCardDescription(provider.id, isConfigured);
  const jobLine = JOB_LINE[provider.id];
  const cadence = cadenceLabel(provider);
  const warning = getCardWarning(provider);

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestSync(provider);
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
              {orient && jobLine && (
                <Typography className={classes.cardMeta} style={{ color: 'inherit' }}>
                  {jobLine}
                </Typography>
              )}
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
                    {orient && cadence && <> · {cadence}</>}
                  </>
                )}
              </Typography>
              {!orient && description && (
                <Typography className={classes.cardMeta} style={{ fontWeight: 500, color: 'inherit' }}>
                  {description}
                </Typography>
              )}
              {orient && provider.id === 'aap' && (
                <Typography className={classes.cardMeta} style={{ fontWeight: 500, color: 'inherit' }}>
                  3 organizations · 42 job templates · 60 users
                </Typography>
              )}
              {orient && provider.id === 'orchestrator' && (
                <Typography className={classes.cardMeta} style={{ fontWeight: 500, color: 'inherit' }}>
                  4 software templates
                </Typography>
              )}
              {orient && cadence && (
                <Typography className={classes.cardMeta}>
                  Updates on a schedule — change under Sync.
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
                {connectOnly ? (
                  <span />
                ) : (
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<SyncIcon style={{ fontSize: 16 }} />}
                    onClick={handleSync}
                    style={{ textTransform: 'none', fontSize: 12 }}
                  >
                    Sync now
                  </Button>
                )}
                <Box display="flex" alignItems="center" style={{ gap: 4, color: '#0066CC', fontSize: 12 }}>
                  Configure <ArrowForwardIcon style={{ fontSize: 14 }} />
                </Box>
              </Box>
            </>
          ) : (
            <>
              <Typography className={classes.cardMeta}>
                {orient ? jobLine || description : description}
              </Typography>
              <Box className={classes.cardFooter}>
                {orient ? (
                  <span />
                ) : (
                  <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                    <LinkOffIcon style={{ fontSize: 14, color: '#999' }} />
                    <Typography style={{ fontSize: 12, color: '#999' }}>
                      Not configured
                    </Typography>
                  </Box>
                )}
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
  const { variant: orientVariant } = useIntegrationsOrientIa();
  const orient = orientVariant === 'orient';
  const isConfigured = provider.status !== 'Not configured';
  const { icon, bg } = providerIcon(provider.id);
  const description = getCardDescription(provider.id, isConfigured);
  const jobLine = JOB_LINE[provider.id];

  return (
    <Card className={classes.card} variant="outlined">
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
            <Tooltip
              title={
                isConfigured
                  ? 'Dev Spaces is connected and available to developers.'
                  : 'Paste a Dev Spaces URL so Edit in Dev Spaces appears on Git Repositories.'
              }
              arrow
            >
              <Chip
                label={isConfigured ? 'Connected' : 'Needs setup'}
                size="small"
                style={{
                  fontSize: 11,
                  height: 22,
                  backgroundColor: isConfigured
                    ? 'rgba(99,153,61,0.15)'
                    : 'rgba(0,102,204,0.15)',
                  color: isConfigured ? statusColors.success : statusColors.info,
                }}
              />
            </Tooltip>
          </Box>

          {isConfigured ? (
            <>
              <Typography className={classes.cardMeta}>
                {provider.host}
              </Typography>
              <Typography className={classes.cardMeta} style={{ lineHeight: 1.5 }}>
                {orient ? jobLine : description}
              </Typography>
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
              <Typography className={classes.cardMeta}>
                {orient ? jobLine : description}
              </Typography>
              <Box className={classes.cardFooter}>
                <span />
                <Box display="flex" alignItems="center" style={{ gap: 4, color: '#0066CC', fontSize: 12 }}>
                  Set up <ArrowForwardIcon style={{ fontSize: 14 }} />
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const needsSetup = (provider: ConnectionProvider) =>
  provider.status !== 'Active';

type ConnectionFilter = 'all' | 'connected' | 'needs-setup';

const filterFromSearch = (search: string): ConnectionFilter => {
  const raw = new URLSearchParams(search).get('filter');
  if (raw === 'connected' || raw === 'needs-setup') return raw;
  return 'all';
};

export const ConnectionsPage = () => {
  const classes = useStyles();
  const { variant } = useAdminSyncIa();
  const { variant: orientVariant } = useIntegrationsOrientIa();
  const { connected: devSpacesConnected } = useDevSpacesSetup();
  const connectionMap = useConnectionSetup();
  const location = useLocation();
  const navigate = useNavigate();
  const [syncProvider, setSyncProvider] = useState<ConnectionProvider | null>(
    null,
  );
  const merged = variant === 'opt1';
  const orient = orientVariant === 'orient';
  const search = new URLSearchParams(location.search);
  const rawTab = search.get('tab');
  const tabFromUrl: 'connections' | 'history' =
    rawTab === 'history' || rawTab === 'activity' ? 'history' : 'connections';
  const filterFromUrl = filterFromSearch(location.search);
  const [tab, setTab] = useState<'connections' | 'history'>(tabFromUrl);
  const [filter, setFilter] = useState<ConnectionFilter>(filterFromUrl);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    setFilter(filterFromUrl);
  }, [filterFromUrl]);

  const providers = DEMO_CONNECTIONS.map(c =>
    withLiveConnectionStatus(c, { connectionMap, devSpacesConnected }),
  );
  const visibleProviders = providers.filter(p => {
    if (filter === 'connected') return !needsSetup(p);
    if (filter === 'needs-setup') return needsSetup(p);
    return true;
  });
  const connections = visibleProviders.filter(
    c => c.type === 'aap' || c.type === 'orchestrator' || c.type === 'pah',
  );
  const sourceControl = visibleProviders.filter(c => c.type === 'git');
  const containerRegistries = visibleProviders.filter(c => c.type === 'registry');
  const devTools = visibleProviders.filter(c => c.type === 'devtools');
  const needsSetupCount = providers.filter(needsSetup).length;
  const { seen: needsSetupSeen, exiting: needsSetupExiting } =
    useAttentionClearOnActive(
      'integrations-needs-setup',
      filter === 'needs-setup' && needsSetupCount > 0,
    );

  const setMergedTab = (next: 'connections' | 'history') => {
    setTab(next);
    navigate(
      next === 'history'
        ? '/self-service/admin/integrations?tab=history'
        : '/self-service/admin/integrations',
      { replace: true },
    );
  };

  const setConnectionFilter = (next: ConnectionFilter) => {
    setFilter(next);
    navigate(
      next === 'all'
        ? '/self-service/admin/integrations'
        : `/self-service/admin/integrations?filter=${next}`,
      { replace: true },
    );
  };

  const showConnections = !merged || tab === 'connections';
  const showHistory = merged && tab === 'history';

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Integrations
            <PageHelpIcon
              tooltipLabel="What are integrations?"
              title="What are Integrations?"
              description={
                orient
                  ? 'Each card is an external system. Connect it, then set how often it syncs. Developer tools (Dev Spaces) are a URL only — they do not sync content.'
                  : merged
                  ? 'Opt 1: Connections (wire systems + Sync now) and Sync history live as tabs here — no separate Sync rail.'
                  : 'Connect systems here. Schedules and history live under Sync.'
              }
            />
          </Box>
        }
        pageTitleOverride="Integrations"
        subtitle={
          orient
            ? 'Connect systems here. Content then updates on a schedule you set per source.'
            : merged
            ? 'Connect systems and review sync history in one place'
            : 'Connect AAP, Hub, source control, container registries, and developer tools'
        }
      >
        <Box className={classes.headerActions}>
          {!orient && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon style={{ fontSize: 16 }} />}
              style={{ textTransform: 'none', fontSize: 13, borderRadius: 20 }}
            >
              Add integration
            </Button>
          )}
        </Box>
      </Header>
      <Content>
        {merged && (
          <Tabs
            className={classes.pageTabs}
            value={tab}
            onChange={(_e, v) => setMergedTab(v)}
            indicatorColor="primary"
            textColor="primary"
            aria-label="Integrations sections"
          >
            <Tab label="Connections" value="connections" />
            <Tab label="Sync history" value="history" />
          </Tabs>
        )}

        {showHistory && <SyncHistoryEmbedded />}

        {showConnections && (
          <>
            <Box className={classes.filterBar}>
              <ToggleButtonGroup
                className={classes.filterGroup}
                exclusive
                size="small"
                value={filter}
                onChange={(_event, next) => {
                  if (next == null) return;
                  setConnectionFilter(next);
                }}
                aria-label="Filter connections"
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="connected">Connected</ToggleButton>
                <ToggleButton value="needs-setup">
                  {needsSetupCount > 0 ? (
                    <span className={classes.filterLabel}>
                      <span>Needs setup</span>
                      <ReadCountBadge
                        count={needsSetupCount}
                        label={`${needsSetupCount} ${needsSetupCount === 1 ? 'connection needs' : 'connections need'} setup`}
                        tone={
                          needsSetupSeen || needsSetupExiting
                            ? 'read'
                            : 'unread'
                        }
                      />
                    </span>
                  ) : (
                    'Needs setup'
                  )}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {orient && filter === 'all' && (
              <DismissibleBanner
                storageKey="integrations-orient-getting-started"
                message="Connect Ansible Automation Platform first so job templates and users appear in the Portal. Other systems are optional. After you connect a source, content updates on a schedule you set under Sync."
                ctaText="Connect AAP"
                ctaHref="/self-service/admin/integrations/aap"
              />
            )}

            {visibleProviders.length === 0 ? (
              <Typography className={classes.empty}>
                {filter === 'needs-setup'
                  ? 'No connections need setup.'
                  : filter === 'connected'
                    ? 'No connected systems yet.'
                    : 'No connections in this view.'}
              </Typography>
            ) : (
              <>
            {connections.length > 0 && (
              <>
            <Typography className={classes.sectionTitle}>
              Automation platforms
            </Typography>
            <Box className={classes.cardGrid}>
              {connections.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onRequestSync={setSyncProvider}
                />
              ))}
            </Box>
              </>
            )}

            {sourceControl.length > 0 && (
              <>
            <Typography className={classes.sectionTitle}>
              Source control
            </Typography>
            <Box className={classes.cardGrid}>
              {sourceControl.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onRequestSync={setSyncProvider}
                />
              ))}
            </Box>
              </>
            )}

            {containerRegistries.length > 0 && (
              <>
            <Typography className={classes.sectionTitle}>
              Container registries
            </Typography>
            <Typography className={classes.sectionDescription}>
              Image registries for execution environments — not GitHub/GitLab repositories.
            </Typography>
            <Box className={classes.cardGrid}>
              {containerRegistries.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onRequestSync={setSyncProvider}
                />
              ))}
            </Box>
              </>
            )}

            {devTools.length > 0 && (
              <>
                <Typography className={classes.sectionTitle}>
                  Developer tools
                </Typography>
                <Typography className={classes.sectionDescription}>
                  {orient
                    ? 'Optional. Paste a Dev Spaces URL so Edit in Dev Spaces appears on Git Repositories.'
                    : 'Optional tools such as OpenShift Dev Spaces. Connection lives here; the capability also appears under Plugins.'}
                </Typography>
                <Box className={classes.cardGrid}>
                  {devTools.map(provider => (
                    <DevToolsCard key={provider.id} provider={provider} />
                  ))}
                </Box>
              </>
            )}
              </>
            )}
          </>
        )}
      </Content>
      <ConnectionSyncDialog
        open={Boolean(syncProvider)}
        provider={syncProvider}
        onClose={() => setSyncProvider(null)}
      />
    </Page>
  );
};

export const SCMIntegrationPage = () => {
  const classes = useStyles();
  const { connected: scmDevSpacesConnected } = useDevSpacesSetup();
  const scmConnectionMap = useConnectionSetup();
  const [syncProvider, setSyncProvider] = useState<ConnectionProvider | null>(
    null,
  );
  const sourceControlProviders = DEMO_CONNECTIONS.filter(c => c.type === 'git').map(
    c =>
      withLiveConnectionStatus(c, {
        connectionMap: scmConnectionMap,
        devSpacesConnected: scmDevSpacesConnected,
      }),
  );

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
            <ProviderCard
              key={provider.id}
              provider={provider}
              onRequestSync={setSyncProvider}
            />
          ))}
        </Box>
      </Content>
      <ConnectionSyncDialog
        open={Boolean(syncProvider)}
        provider={syncProvider}
        onClose={() => setSyncProvider(null)}
      />
    </Page>
  );
};
