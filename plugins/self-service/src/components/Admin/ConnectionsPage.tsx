import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  makeStyles,
  Chip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
} from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import WarningAmberIcon from '@material-ui/icons/ReportProblemOutlined';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { SvgIcon } from '@material-ui/core';
import { SyncErrorModal } from './SyncErrorModal';

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

import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import { useNavigate } from 'react-router-dom';
import { DEMO_CONNECTIONS, DEMO_SYNC_STATUS, ConnectionProvider, SyncEntityStatus } from './syncDemoData';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  card: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardContent: {
    padding: theme.spacing(2),
    '&:last-child': { paddingBottom: theme.spacing(2) },
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1.5),
  },
  providerIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: theme.spacing(1.5),
  },
  providerName: {
    fontWeight: 500,
    fontSize: 14,
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
  tabBar: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2),
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    textAlign: 'center' as const,
  },
  emptyStateIcon: {
    fontSize: 48,
    color: 'rgba(255,255,255,0.15)',
    marginBottom: theme.spacing(2),
  },
}));

const providerIcon = (id: string): { icon: React.ReactNode; bg: string } => {
  switch (id) {
    case 'aap':
      return { icon: <AnsibleIcon style={{ fontSize: 16, color: '#fff' }} />, bg: '#ee0000' };
    case 'pah':
      return { icon: <AnsibleIcon style={{ fontSize: 16, color: '#fff' }} />, bg: '#a30000' };
    case 'github':
      return { icon: <GitHubIcon style={{ fontSize: 16, color: '#fff' }} />, bg: '#24292e' };
    case 'gitlab':
      return { icon: <GitLabIcon style={{ fontSize: 16, color: '#fff' }} />, bg: '#FC6D26' };
    default:
      return { icon: <AnsibleIcon style={{ fontSize: 16, color: '#fff' }} />, bg: '#757575' };
  }
};

const providerTypeLabel = (provider: ConnectionProvider): string => {
  if (provider.id === 'pah') return 'Content hub · Part of AAP';
  switch (provider.type) {
    case 'aap': return 'Automation platform';
    case 'git': return 'Source control';
    case 'registry': return 'Container registry';
    default: return '';
  }
};

const getCardDescription = (id: string, isConfigured: boolean): string => {
  if (isConfigured) {
    switch (id) {
      case 'aap': return '3 organizations · 42 job templates · 60 users';
      case 'pah': return 'Certified and validated content syncing from private automation hub';
      default: return '';
    }
  }
  switch (id) {
    case 'aap': return 'Connect to Ansible Automation Platform for user authentication, job templates, collections, and execution environments.';
    case 'pah': return 'Sync certified, validated, and curated content from the private automation hub bundled with AAP.';
    case 'github': return 'Import repositories containing playbooks, roles, and automation projects.';
    case 'gitlab': return 'Import repositories containing playbooks, roles, and automation projects.';
    default: return '';
  }
};

const getCardWarning = (provider: ConnectionProvider): string | null => {
  if (provider.id === 'aap' && provider.status === 'Active' && provider.orgCount === 0) {
    return 'No organizations selected — job templates and users will not be synced.';
  }
  return null;
};

const getProviderSyncStatus = (providerId: string): 'healthy' | 'failed' | 'none' => {
  const entities = DEMO_SYNC_STATUS.filter(e => e.providerId === providerId);
  if (entities.length === 0) return 'none';
  if (entities.some(e => e.status === 'Failed')) return 'failed';
  return 'healthy';
};

const ProviderCard = ({ provider, basePath }: { provider: ConnectionProvider; basePath: string }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  const isConfigured = provider.status !== 'Not configured';
  const isActive = provider.status === 'Active';
  const { icon, bg } = providerIcon(provider.id);
  const description = getCardDescription(provider.id, isConfigured);
  const warning = getCardWarning(provider);
  const syncStatus = isActive ? getProviderSyncStatus(provider.id) : 'none';

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
      <CardContent className={classes.cardContent}>
        <Box className={classes.cardBody}>
          <Box className={classes.cardHeader}>
            <Box display="flex" alignItems="center">
              <Box className={classes.providerIcon} style={{ backgroundColor: bg }}>
                {icon}
              </Box>
              <Box>
                <Typography
                  className={classes.providerName}
                  style={{ cursor: 'pointer', color: '#0066CC' }}
                  onClick={() => navigate(`${basePath}/${provider.id}`)}
                >
                  {provider.name}
                </Typography>
                <Typography className={classes.providerType}>
                  {providerTypeLabel(provider)}
                </Typography>
              </Box>
            </Box>
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
          </Box>

          {isConfigured ? (
            <>
              <Typography className={classes.cardMeta}>
                {provider.host}
                {provider.lastSync && (
                  <>
                    {' · Last sync '}
                    {provider.lastSync}
                    {syncStatus !== 'none' && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: syncStatus === 'failed' ? statusColors.error : statusColors.success,
                          marginLeft: 6,
                          verticalAlign: 'middle',
                        }}
                      />
                    )}
                  </>
                )}
              </Typography>
              {description && (
                <Typography className={classes.cardMeta}>
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
            </>
          ) : (
            <Typography className={classes.cardMeta}>
              {description}
            </Typography>
          )}
        </Box>

        <Box className={classes.cardFooter}>
          {isConfigured ? (
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
          ) : (
            <Box display="flex" alignItems="center" style={{ gap: 6 }}>
              <LinkOffIcon style={{ fontSize: 14, color: '#999' }} />
              <Typography style={{ fontSize: 12, color: '#999' }}>
                Not configured
              </Typography>
            </Box>
          )}
          <Button
            size="small"
            color="primary"
            endIcon={<ArrowForwardIcon style={{ fontSize: 14 }} />}
            onClick={() => navigate(`${basePath}/${provider.id}`)}
            style={{ textTransform: 'none', fontSize: 12 }}
          >
            {isConfigured ? 'Configure' : 'Connect'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ConnectionsPage = () => {
  const classes = useStyles();

  const aapProviders = DEMO_CONNECTIONS.filter(c => c.type === 'aap');

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Connections
            <PageHelpIcon
              tooltipLabel="What are connections?"
              title="What are connections?"
              description="Connections link the portal to Ansible Automation Platform for user authentication, content sync, and API access. This includes the private automation hub bundled with AAP."
            />
          </Box>
        }
        pageTitleOverride="Connections"
        subtitle="Manage your Ansible Automation Platform connection, including authentication, content sync, and private automation hub"
      />
      <Content>
        <Box className={classes.cardGrid}>
          {aapProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} basePath="/self-service/admin/integrations" />
          ))}
        </Box>
      </Content>
    </Page>
  );
};

// ---------------------------------------------------------------------------
// Add Integration dialog
// ---------------------------------------------------------------------------

type IntegrationType = 'scm' | 'registry' | '';
type ScmProvider = 'github' | 'gitlab' | 'bitbucket' | '';
type RegistryProvider = 'quay' | 'artifactory' | 'dockerhub' | 'ecr' | '';

const SCM_PROVIDERS = [
  { id: 'github' as ScmProvider, label: 'GitHub', description: 'GitHub Cloud or GitHub Enterprise' },
  { id: 'gitlab' as ScmProvider, label: 'GitLab', description: 'GitLab SaaS or self-managed' },
  { id: 'bitbucket' as ScmProvider, label: 'Bitbucket', description: 'Bitbucket Cloud or Data Center' },
];

const REGISTRY_PROVIDERS = [
  { id: 'quay' as RegistryProvider, label: 'Quay', description: 'Red Hat Quay or Quay.io' },
  { id: 'artifactory' as RegistryProvider, label: 'JFrog Artifactory', description: 'Artifactory container registry' },
  { id: 'dockerhub' as RegistryProvider, label: 'Docker Hub', description: 'Docker Hub public or private' },
  { id: 'ecr' as RegistryProvider, label: 'Amazon ECR', description: 'AWS Elastic Container Registry' },
];

const useDialogStyles = makeStyles(theme => ({
  dialog: {
    '& .MuiDialog-paper': {
      width: 560,
      minWidth: 560,
      maxWidth: 560,
    },
  },
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  typeCard: {
    padding: '16px 20px',
    border: `2px solid ${theme.palette.divider}`,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background-color 0.15s',
    '&:hover': {
      borderColor: theme.palette.primary.light,
    },
  },
  typeCardSelected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(0,102,204,0.06)',
  },
  providerOption: {
    padding: '12px 16px',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 6,
    marginBottom: 8,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background-color 0.15s',
    '&:hover': {
      borderColor: theme.palette.primary.light,
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
  },
  providerOptionSelected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(0,102,204,0.06)',
  },
  stepIndicator: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginBottom: 16,
  },
}));

const AddIntegrationDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const dialogClasses = useDialogStyles();
  const [step, setStep] = useState(0);
  const [integrationType, setIntegrationType] = useState<IntegrationType>('');
  const [scmProvider, setScmProvider] = useState<ScmProvider>('');
  const [registryProvider, setRegistryProvider] = useState<RegistryProvider>('');
  const [url, setUrl] = useState('');
  const [authMethod, setAuthMethod] = useState<'token' | 'oauth'>('token');
  const [token, setToken] = useState('');

  const handleClose = () => {
    setStep(0);
    setIntegrationType('');
    setScmProvider('');
    setRegistryProvider('');
    setUrl('');
    setToken('');
    setAuthMethod('token');
    onClose();
  };

  const selectedProvider = integrationType === 'scm'
    ? SCM_PROVIDERS.find(p => p.id === scmProvider)
    : REGISTRY_PROVIDERS.find(p => p.id === registryProvider);

  const canSave = url.trim() !== '' && token.trim() !== '';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className={dialogClasses.dialog}
      maxWidth={false}
      PaperProps={{ style: { width: 560, minWidth: 560, maxWidth: 560 } }}
    >
      <Box className={dialogClasses.dialogTitle}>
        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
          {step > 0 && (
            <IconButton size="small" onClick={() => setStep(s => s - 1)} style={{ marginRight: 4 }}>
              <ArrowBackIcon style={{ fontSize: 18 }} />
            </IconButton>
          )}
          <Typography style={{ fontSize: 16, fontWeight: 600 }}>
            {step === 0 ? 'Add integration' : step === 1 ? 'Select provider' : `Connect ${selectedProvider?.label || ''}`}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon style={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent style={{ padding: '24px' }}>
        <Typography className={dialogClasses.stepIndicator}>
          Step {step + 1} of 3
        </Typography>

        {step === 0 && (
          <>
            <Typography style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              What type of integration do you want to add?
            </Typography>
            <Box display="flex" flexDirection="column" style={{ gap: 12 }}>
              <Box
                className={`${dialogClasses.typeCard} ${integrationType === 'scm' ? dialogClasses.typeCardSelected : ''}`}
                onClick={() => { setIntegrationType('scm'); setStep(1); }}
              >
                <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                  <Box style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#24292e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GitHubIcon style={{ fontSize: 18, color: '#fff' }} />
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 14, fontWeight: 600 }}>Source control</Typography>
                    <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      GitHub, GitLab, or Bitbucket for automation projects and repositories
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box
                className={`${dialogClasses.typeCard} ${integrationType === 'registry' ? dialogClasses.typeCardSelected : ''}`}
                onClick={() => { setIntegrationType('registry'); setStep(1); }}
              >
                <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                  <Box style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#0066CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>R</Typography>
                  </Box>
                  <Box>
                    <Typography style={{ fontSize: 14, fontWeight: 600 }}>Container registry</Typography>
                    <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      Quay, Artifactory, Docker Hub, or ECR for execution environments and images
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </>
        )}

        {step === 1 && integrationType === 'scm' && (
          <>
            <Typography style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Select a source control provider.
            </Typography>
            {SCM_PROVIDERS.map(p => (
              <Box
                key={p.id}
                className={`${dialogClasses.providerOption} ${scmProvider === p.id ? dialogClasses.providerOptionSelected : ''}`}
                onClick={() => { setScmProvider(p.id); setStep(2); }}
              >
                <Typography style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</Typography>
                <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{p.description}</Typography>
              </Box>
            ))}
          </>
        )}

        {step === 1 && integrationType === 'registry' && (
          <>
            <Typography style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Select a container registry provider.
            </Typography>
            {REGISTRY_PROVIDERS.map(p => (
              <Box
                key={p.id}
                className={`${dialogClasses.providerOption} ${registryProvider === p.id ? dialogClasses.providerOptionSelected : ''}`}
                onClick={() => { setRegistryProvider(p.id); setStep(2); }}
              >
                <Typography style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</Typography>
                <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{p.description}</Typography>
              </Box>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Typography style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              {`Enter the connection details for ${selectedProvider?.label}.`}
            </Typography>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Box>
                <Typography style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  {integrationType === 'scm' ? 'Instance URL' : 'Registry URL'} *
                </Typography>
                <TextField
                  fullWidth variant="outlined" size="small"
                  placeholder={integrationType === 'scm' ? 'https://github.com' : 'https://quay.io'}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
                <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {integrationType === 'scm'
                    ? 'For self-managed instances, enter the full base URL.'
                    : 'The base URL of your container registry.'}
                </Typography>
              </Box>

              {integrationType === 'scm' && (
                <Box>
                  <Typography style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Authentication method
                  </Typography>
                  <RadioGroup
                    value={authMethod}
                    onChange={e => setAuthMethod(e.target.value as 'token' | 'oauth')}
                  >
                    <FormControlLabel
                      value="token" control={<Radio color="primary" size="small" />}
                      label={<Typography style={{ fontSize: 13 }}>Personal access token</Typography>}
                    />
                    <FormControlLabel
                      value="oauth" control={<Radio color="primary" size="small" />}
                      label={<Typography style={{ fontSize: 13 }}>OAuth application</Typography>}
                    />
                  </RadioGroup>
                </Box>
              )}

              <Box>
                <Typography style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  {integrationType === 'scm' && authMethod === 'token' ? 'Personal access token' : integrationType === 'scm' ? 'OAuth client ID' : 'Access token'} *
                </Typography>
                <TextField
                  fullWidth variant="outlined" size="small"
                  type="password"
                  placeholder="Enter token or credential"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                />
                {integrationType === 'scm' && (
                  <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                    {authMethod === 'token'
                      ? `Generate a token in ${selectedProvider?.label} with repo read access.`
                      : `Create an OAuth app in ${selectedProvider?.label} and enter the client ID.`}
                  </Typography>
                )}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Button onClick={handleClose} style={{ textTransform: 'none', fontSize: 13 }}>
          Cancel
        </Button>
        {step === 2 && (
          <Button
            variant="contained" color="primary"
            disabled={!canSave}
            onClick={handleClose}
            style={{ textTransform: 'none', fontSize: 13 }}
          >
            Add integration
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const SyncFailureBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [modalEntity, setModalEntity] = useState<SyncEntityStatus | null>(null);
  const connectedProviderIds = DEMO_CONNECTIONS.filter(c => c.status === 'Active').map(c => c.id);
  const failedEntities = DEMO_SYNC_STATUS.filter(
    e => e.status === 'Failed' && connectedProviderIds.includes(e.providerId),
  );

  if (dismissed || failedEntities.length === 0) return null;

  return (
    <>
      <Box
        style={{
          position: 'relative',
          marginBottom: 16,
          borderLeft: `3px solid ${statusColors.error}`,
          borderRadius: 2,
          backgroundColor: 'rgba(244,67,54,0.06)',
          padding: '4px 32px 4px 0',
        }}
      >
        {failedEntities.map(entity => (
          <Box
            key={entity.id}
            display="flex"
            alignItems="center"
            style={{ padding: '4px 12px', gap: 8 }}
          >
            <ErrorOutlineIcon style={{ fontSize: 14, color: statusColors.error, flexShrink: 0 }} />
            <Typography style={{ fontSize: 13 }}>
              <strong>{entity.source}</strong> — {entity.entity}: sync failed.{' '}
              <Typography
                component="span"
                onClick={() => setModalEntity(entity)}
                style={{ fontSize: 13, color: '#4DA3FF', cursor: 'pointer' }}
              >
                View details
              </Typography>
            </Typography>
          </Box>
        ))}
        <IconButton
          size="small"
          onClick={() => setDismissed(true)}
          style={{ position: 'absolute', right: 4, top: 4, padding: 4 }}
        >
          <CloseIcon style={{ fontSize: 14 }} />
        </IconButton>
      </Box>
      <SyncErrorModal
        entity={modalEntity}
        open={modalEntity !== null}
        onClose={() => setModalEntity(null)}
      />
    </>
  );
};

export const IntegrationsPage = () => {
  const classes = useStyles();
  const [activeTab, setActiveTab] = useState(0);
  const [syncingAll, setSyncingAll] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const aapProviders = DEMO_CONNECTIONS.filter(c => c.type === 'aap');
  const scmProviders = DEMO_CONNECTIONS.filter(c => c.type === 'git');
  const registryProviders = DEMO_CONNECTIONS.filter(c => c.type === 'registry');

  const allProviders = [...aapProviders, ...scmProviders, ...registryProviders];
  const configuredCount = allProviders.filter(p => p.status !== 'Not configured').length;
  const visibleProviders = activeTab === 0 ? allProviders
    : activeTab === 1 ? aapProviders
    : activeTab === 2 ? scmProviders
    : registryProviders;

  const handleSyncAll = () => {
    setSyncingAll(true);
    setTimeout(() => setSyncingAll(false), 3000);
  };

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Integrations
            <PageHelpIcon
              tooltipLabel="What are integrations?"
              title="What are integrations?"
              description="Integrations connect the portal to external systems — Ansible Automation Platform for user authentication and content sync, Git providers for automation projects, and container registries for execution environments."
            />
          </Box>
        }
        pageTitleOverride="Integrations"
        subtitle="Manage connections to Ansible Automation Platform, source control, and container registries"
      >
        <Box display="flex" style={{ gap: 8 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SyncIcon style={{ fontSize: 16 }} />}
            onClick={handleSyncAll}
            disabled={syncingAll || configuredCount === 0}
            style={{
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 500,
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
            }}
          >
            {syncingAll ? 'Syncing all…' : 'Sync all'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon style={{ fontSize: 16 }} />}
            onClick={() => setAddDialogOpen(true)}
            style={{
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Add integration
          </Button>
        </Box>
      </Header>
      <Content>
        <SyncFailureBanner />
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          className={classes.tabBar}
        >
          <Tab label={`All (${allProviders.length})`} style={{ textTransform: 'none', minWidth: 80 }} />
          <Tab label={`Connections (${aapProviders.length})`} style={{ textTransform: 'none', minWidth: 80 }} />
          <Tab label={`Source control (${scmProviders.length})`} style={{ textTransform: 'none', minWidth: 80 }} />
          <Tab label={`Container registries (${registryProviders.length})`} style={{ textTransform: 'none', minWidth: 80 }} />
        </Tabs>
        {visibleProviders.length > 0 ? (
          <Box className={classes.cardGrid}>
            {visibleProviders.map(provider => (
              <ProviderCard key={provider.id} provider={provider} basePath="/self-service/admin/integrations" />
            ))}
          </Box>
        ) : (
          <Box className={classes.emptyState}>
            <LinkOffIcon className={classes.emptyStateIcon} />
            <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              {activeTab === 1 ? 'No connections configured' :
               activeTab === 2 ? 'No source control providers connected' :
               activeTab === 3 ? 'No container registries connected' :
               'No integrations configured'}
            </Typography>
            <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 400, lineHeight: 1.6, marginBottom: 20 }}>
              {activeTab === 1 ? 'Add a connection to Ansible Automation Platform to enable user authentication, content sync, and API access.' :
               activeTab === 2 ? 'Connect a source control provider like GitHub or GitLab to discover repositories and sync automation projects.' :
               activeTab === 3 ? 'Connect a container registry like Quay or Artifactory to discover execution environments and container images.' :
               'Add integrations to connect the portal to external systems for content discovery and sync.'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon style={{ fontSize: 16 }} />}
              onClick={() => setAddDialogOpen(true)}
              style={{ textTransform: 'none', fontSize: 13 }}
            >
              Add integration
            </Button>
          </Box>
        )}
      </Content>
      <AddIntegrationDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
    </Page>
  );
};
