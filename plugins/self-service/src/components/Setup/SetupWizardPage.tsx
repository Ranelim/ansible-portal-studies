import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Link,
  makeStyles,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import SettingsIcon from '@material-ui/icons/Settings';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import GitHubIcon from '@material-ui/icons/GitHub';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 1300,
    backgroundColor: theme.palette.background.default,
    overflow: 'auto',
  },
  header: {
    height: 64,
    backgroundColor: theme.palette.type === 'dark' ? '#1a1a1a' : '#151515',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: 12,
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#ee0000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  headerSubtitle: {
    color: '#ccc',
    fontSize: 11,
    lineHeight: 1.2,
  },
  headerUser: {
    marginLeft: 'auto',
    color: '#ccc',
    fontSize: 13,
  },
  wizardContainer: {
    display: 'flex',
    margin: '24px',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    height: 'calc(100vh - 160px)',
  },
  sidebar: {
    width: 250,
    borderRight: `1px solid ${theme.palette.divider}`,
    padding: '24px',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    cursor: 'default',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  stepActive: {
    backgroundColor: '#0066CC',
    color: '#fff',
  },
  stepCompleted: {
    backgroundColor: '#63993D',
    color: '#fff',
  },
  stepPending: {
    backgroundColor: 'transparent',
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 500,
  },
  stepLabelActive: {
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  stepLabelPending: {
    color: theme.palette.text.secondary,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  contentBody: {
    flex: 1,
    padding: '24px 32px',
    overflowY: 'auto',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 32px',
    borderTop: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    marginBottom: 24,
    lineHeight: 1.5,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginTop: 24,
    marginBottom: 12,
  },
  providerCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    marginBottom: 12,
  },
  providerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  providerName: {
    fontSize: 14,
    fontWeight: 600,
  },
  providerDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  connectedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#63993D',
    fontWeight: 500,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 500,
  },
  toggleDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  reviewSection: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: '20px 24px',
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: 13,
  },
  reviewLabel: {
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  reviewValue: {
    fontWeight: 500,
  },
  centeredPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 'calc(100vh - 64px)',
    textAlign: 'center',
    gap: 16,
  },
  successIcon: {
    fontSize: 64,
    color: '#63993D',
  },
  loginCard: {
    maxWidth: 480,
    padding: '40px',
    textAlign: 'center',
    borderRadius: 12,
  },
  advancedToggle: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: 4,
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.text.secondary,
    marginTop: 16,
    marginBottom: 8,
    '&:hover': { color: theme.palette.text.primary },
  },
  prerequisiteList: {
    paddingLeft: 20,
    '& li': {
      fontSize: 14,
      lineHeight: 1.8,
    },
  },
  gitlabIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FC6D26',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
  },
}));

const STEPS = [
  { label: 'Overview', key: 'overview' },
  { label: 'Connect AAP', key: 'aap' },
  { label: 'Connect Registries', key: 'registries' },
  { label: 'Connect Source Control', key: 'source-control' },
  { label: 'Review', key: 'review' },
];

type WizardPhase = 'login' | 'wizard' | 'applying' | 'success';

type DiscoveryStep = {
  label: string;
  status: 'pending' | 'running' | 'done';
  detail?: string;
};

type DiscoveredRepo = {
  name: string;
  org: string;
  playbooks: number;
  roles: number;
  collections: number;
  ees: number;
};

const DISCOVERY_STEPS: DiscoveryStep[] = [
  { label: 'Writing configuration to app-config.yaml', status: 'pending' },
  { label: 'Connecting to AAP Controller', status: 'pending' },
  { label: 'Syncing content registries', status: 'pending' },
  { label: 'Connecting to GitHub', status: 'pending' },
  { label: 'Scanning repositories for automation content', status: 'pending' },
];

const DISCOVERED_REPOS_FEED: DiscoveredRepo[] = [
  { name: 'rhel-patching', org: 'acme-corp', playbooks: 2, roles: 1, collections: 1, ees: 0 },
  { name: 'network-firewall-rules', org: 'acme-corp', playbooks: 3, roles: 1, collections: 2, ees: 0 },
  { name: 'cloud-provisioner', org: 'acme-corp', playbooks: 2, roles: 0, collections: 1, ees: 1 },
  { name: 'backup-automation', org: 'acme-corp', playbooks: 3, roles: 1, collections: 2, ees: 0 },
];

const ApplyingAndDiscoveryScreen = ({ onDone, isDone }: { onDone: () => void; isDone: boolean }) => {
  const classes = useStyles();
  const [steps, setSteps] = useState<DiscoveryStep[]>(
    DISCOVERY_STEPS.map(s => ({ ...s })),
  );
  const [visibleRepos, setVisibleRepos] = useState<DiscoveredRepo[]>([]);
  const [allDone, setAllDone] = useState(isDone);

  useEffect(() => {
    if (isDone) {
      setSteps(DISCOVERY_STEPS.map(s => ({ ...s, status: 'done' })));
      setVisibleRepos([...DISCOVERED_REPOS_FEED]);
      setAllDone(true);
      return;
    }

    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < DISCOVERY_STEPS.length; i++) {
        if (cancelled) return;
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'running' } : idx < i ? { ...s, status: 'done' } : s,
        ));
        const delay = i === 4 ? 800 : 600 + Math.random() * 400;
        await new Promise(r => setTimeout(r, delay));
        if (cancelled) return;
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'done' } : s,
        ));

        if (i === 4) {
          for (let j = 0; j < DISCOVERED_REPOS_FEED.length; j++) {
            if (cancelled) return;
            await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
            setVisibleRepos(prev => [...prev, DISCOVERED_REPOS_FEED[j]]);
          }
        }
      }
      if (!cancelled) {
        await new Promise(r => setTimeout(r, 600));
        setAllDone(true);
        onDone();
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isDone, onDone]);

  const totalPlaybooks = visibleRepos.reduce((s, r) => s + r.playbooks, 0);
  const totalRoles = visibleRepos.reduce((s, r) => s + r.roles, 0);
  const totalCollections = visibleRepos.reduce((s, r) => s + r.collections, 0);
  const totalEes = visibleRepos.reduce((s, r) => s + r.ees, 0);

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.headerLogo}>A</Box>
        <Box>
          <Typography className={classes.headerTitle}>Red Hat</Typography>
          <Typography className={classes.headerSubtitle}>Ansible Automation Portal</Typography>
        </Box>
      </Box>
      <Box style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px',
        gap: 24,
      }}>
        {allDone ? (
          <CheckCircleIcon className={classes.successIcon} />
        ) : (
          <CircularProgress size={40} />
        )}
        <Typography variant="h5" style={{ fontWeight: 600 }}>
          {allDone ? 'System Configured & Ready' : 'Applying configuration...'}
        </Typography>

        <Box style={{
          width: '100%',
          maxWidth: 560,
          border: `1px solid rgba(255,255,255,0.12)`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {steps.map((s, i) => (
            <Box key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              opacity: s.status === 'pending' ? 0.4 : 1,
              transition: 'opacity 0.3s',
            }}>
              {s.status === 'done' ? (
                <CheckCircleIcon style={{ fontSize: 18, color: '#63993D' }} />
              ) : s.status === 'running' ? (
                <CircularProgress size={16} style={{ flexShrink: 0 }} />
              ) : (
                <Box style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
              )}
              <Typography style={{ fontSize: 13, fontWeight: s.status === 'running' ? 600 : 400 }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {visibleRepos.length > 0 && (
          <Box style={{ width: '100%', maxWidth: 560 }}>
            <Typography style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Discovered repositories ({visibleRepos.length})
            </Typography>
            <Box style={{
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              {visibleRepos.map((repo, i) => (
                <Box key={repo.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: i < visibleRepos.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  animation: 'fadeIn 0.3s ease-in',
                }}>
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircleIcon style={{ fontSize: 16, color: '#63993D' }} />
                    <Box>
                      <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                        {repo.org}/{repo.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    {repo.playbooks} playbooks · {repo.roles} roles · {repo.collections} collections
                    {repo.ees > 0 ? ` · ${repo.ees} EE` : ''}
                  </Typography>
                </Box>
              ))}
            </Box>

            {allDone && (
              <Box style={{
                display: 'flex',
                gap: 12,
                marginTop: 12,
                flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Repositories', count: visibleRepos.length },
                  { label: 'Playbooks', count: totalPlaybooks },
                  { label: 'Roles', count: totalRoles },
                  { label: 'Collections', count: totalCollections },
                  ...(totalEes > 0 ? [{ label: 'EEs', count: totalEes }] : []),
                ].map(item => (
                  <Box key={item.label} style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    textAlign: 'center',
                    flex: 1,
                    minWidth: 80,
                  }}>
                    <Typography style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                      {item.count}
                    </Typography>
                    <Typography style={{ fontSize: 10, opacity: 0.6 }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {allDone && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => { window.location.href = '/self-service/projects'; }}
            style={{ textTransform: 'none', fontWeight: 500, marginTop: 8 }}
          >
            View discovered repositories
          </Button>
        )}
      </Box>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
};

export const SetupWizardPage = () => {
  const classes = useStyles();
  const [phase, setPhase] = useState<WizardPhase>('login');
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState('');
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  const [aapUrl, setAapUrl] = useState('');
  const [aapToken, setAapToken] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [jobSyncInterval, setJobSyncInterval] = useState('30');
  const [userSyncInterval, setUserSyncInterval] = useState('60');
  const [showAdvancedSync, setShowAdvancedSync] = useState(false);

  const [pahEnabled, setPahEnabled] = useState(true);
  const [pahFromAap, setPahFromAap] = useState(true);
  const [certifiedContent, setCertifiedContent] = useState(true);
  const [validatedContent, setValidatedContent] = useState(true);
  const [galaxyEnabled, setGalaxyEnabled] = useState(true);

  const [githubConnected, setGithubConnected] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [ghProviderUrl, setGhProviderUrl] = useState('https://github.com');
  const [ghPat, setGhPat] = useState('');
  const [ghOrgs, setGhOrgs] = useState('');
  const [ghEeFilename, setGhEeFilename] = useState('execution-environment.yml');
  const [ghBranches, setGhBranches] = useState('main');
  const [ghMaxDepth, setGhMaxDepth] = useState('3');
  const [ghSsoEnabled, setGhSsoEnabled] = useState(true);
  const [ghSsoClientId, setGhSsoClientId] = useState('');
  const [ghSsoClientSecret, setGhSsoClientSecret] = useState('');

  const handleLogin = useCallback(() => {
    if (password.trim()) {
      setPhase('wizard');
      setStep(0);
    }
  }, [password]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const handleApply = useCallback(() => {
    setPhase('applying');
    setTimeout(() => setPhase('success'), 3000);
  }, []);

  const handleGithubSave = useCallback(() => {
    setGithubConnected(true);
    setGithubModalOpen(false);
  }, []);

  if (phase === 'login') {
    return (
      <Box className={classes.root}>
        <Box className={classes.header}>
          <Box className={classes.headerLogo}>A</Box>
          <Box>
            <Typography className={classes.headerTitle}>Red Hat</Typography>
            <Typography className={classes.headerSubtitle}>Ansible Automation Portal</Typography>
          </Box>
        </Box>
        <Box className={classes.centeredPage}>
          <Card className={classes.loginCard} variant="outlined">
            <CardContent>
              <Box
                style={{
                  backgroundColor: '#E7F1FA',
                  border: '1px solid #BEE1F4',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 24,
                  textAlign: 'left',
                }}
              >
                <Typography style={{ fontWeight: 600, fontSize: 13, color: '#004080' }}>
                  <SettingsIcon style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }} />
                  Setup Mode
                </Typography>
                <Typography style={{ fontSize: 12, color: '#004080', marginTop: 4 }}>
                  Welcome! The portal is up and running but requires initial configuration.
                  Use the temporary administrator password to launch the setup wizard.
                </Typography>
              </Box>

              <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 8 }}>
                Setup Mode Login
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: 20 }}>
                The Ansible Automation Portal is currently not configured. Please enter the
                temporary administrator password generated in your server installation logs to begin setup.
              </Typography>

              <Typography className={classes.fieldLabel}>
                Initial Admin Password *
              </Typography>
              <TextField
                fullWidth
                type="password"
                variant="outlined"
                size="small"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ marginBottom: 16 }}
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleLogin}
                disabled={!password.trim()}
                style={{ textTransform: 'none', fontWeight: 500, marginBottom: 12 }}
              >
                Enter Setup Wizard
              </Button>

              <Link
                component="button"
                variant="body2"
                onClick={() => setShowPasswordHint(!showPasswordHint)}
                style={{ fontSize: 12 }}
              >
                Where do I find this password?
              </Link>
              {showPasswordHint && (
                <Box
                  style={{
                    marginTop: 8,
                    padding: '12px 16px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 8,
                    textAlign: 'left',
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  The temporary password was generated in your server installation logs during the
                  initial startup.<br /><br />
                  <strong>Kubernetes/OpenShift:</strong> Check the pod logs or the{' '}
                  <code>aap-bootstrap-secret</code> Secret.<br />
                  <strong>Linux/Docker:</strong> Check the container standard output (stdout).
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  if (phase === 'applying' || phase === 'success') {
    return <ApplyingAndDiscoveryScreen onDone={() => setPhase('success')} isDone={phase === 'success'} />;
  }

  const renderStepContent = () => {
    switch (step) {
      case 0: return renderOverview();
      case 1: return renderConnectAAP();
      case 2: return renderConnectRegistries();
      case 3: return renderSourceControl();
      case 4: return renderReview();
      default: return null;
    }
  };

  function renderOverview() {
    return (
      <>
        <Typography className={classes.sectionTitle}>Overview & Prerequisites</Typography>
        <Typography className={classes.sectionDescription}>
          Welcome to Red Hat Ansible Automation Portal setup wizard. This process will generate
          the configuration required to connect your portal to your infrastructure.
        </Typography>
        <Typography variant="body2" style={{ fontWeight: 600, marginBottom: 8 }}>
          Before you begin, ensure you have the following information ready:
        </Typography>
        <Typography variant="body2" style={{ fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
          What you'll need:
        </Typography>
        <ul className={classes.prerequisiteList}>
          <li>AAP Controller URL and OAuth credentials (Client ID & Secret).</li>
          <li>AAP Personal Access Token (requires System Administrator privileges)</li>
          <li>Git Provider App ID, Private Key and Client ID/Secret for content discovery and SSO</li>
        </ul>
      </>
    );
  }

  function renderConnectAAP() {
    return (
      <>
        <Typography className={classes.sectionTitle}>Connect AAP</Typography>
        <Typography className={classes.sectionDescription}>
          Connect to your Ansible Automation Platform (AAP) instance. This integration allows the portal to use
          AAP as an Identity Provider (SSO) and enables the portal to sync data in the background.
        </Typography>

        <Box className={classes.fieldGroup}>
          <Typography className={classes.fieldLabel}>AAP controller URL</Typography>
          <TextField
            fullWidth variant="outlined" size="small"
            placeholder="https://aap.example.com"
            value={aapUrl} onChange={e => setAapUrl(e.target.value)}
          />
          <Typography className={classes.helperText}>
            Enter the URL of your Automation Controller (e.g. https://aap.example.com)
          </Typography>
        </Box>

        <Typography className={classes.subsectionTitle}>Service Access (Discovery & Execution)</Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16, fontSize: 13 }}>
          The portal requires a service token to discover Job Templates and Private Automation Hub
          content, trigger job runs from software templates, and sync execution logs automatically —
          even when no users are logged in.
        </Typography>

        <Box className={classes.fieldGroup}>
          <Typography className={classes.fieldLabel}>Admin Personal Access Token *</Typography>
          <TextField
            fullWidth variant="outlined" size="small"
            placeholder="Enter access token"
            value={aapToken} onChange={e => setAapToken(e.target.value)}
          />
          <Typography className={classes.helperText}>
            Paste an Admin Token from AAP here.
          </Typography>
        </Box>

        <Typography className={classes.subsectionTitle}>User Sign-in (OAuth)</Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16, fontSize: 13 }}>
          Configure OAuth credentials to allow your team to log in to the portal using their existing
          AAP accounts.
        </Typography>

        <Box className={classes.fieldGroup}>
          <Typography className={classes.fieldLabel}>Client ID</Typography>
          <TextField
            fullWidth variant="outlined" size="small"
            placeholder="Enter Client ID"
            value={oauthClientId} onChange={e => setOauthClientId(e.target.value)}
          />
        </Box>
        <Box className={classes.fieldGroup}>
          <Typography className={classes.fieldLabel}>Client secret</Typography>
          <TextField
            fullWidth variant="outlined" size="small"
            placeholder="Enter secret" type="password"
            value={oauthClientSecret} onChange={e => setOauthClientSecret(e.target.value)}
          />
        </Box>

        <Link
          component="button" variant="body2"
          style={{ fontSize: 12, marginBottom: 8 }}
          onClick={() => window.open('https://docs.redhat.com', '_blank')}
        >
          Find these under AAP application settings ↗
        </Link>

        <Box
          className={classes.advancedToggle}
          onClick={() => setShowAdvancedSync(!showAdvancedSync)}
        >
          {showAdvancedSync ? <ExpandLessIcon style={{ fontSize: 18 }} /> : <ExpandMoreIcon style={{ fontSize: 18 }} />}
          Advanced Sync Settings (Optional)
        </Box>
        {showAdvancedSync && (
          <Box style={{ paddingLeft: 8 }}>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 12 }}>
              Define how often the portal checks AAP for new templates and user changes.
            </Typography>
            <Box display="flex" style={{ gap: 16 }}>
              <FormControl variant="outlined" size="small" style={{ flex: 1 }}>
                <InputLabel>Job Template Sync Interval</InputLabel>
                <Select value={jobSyncInterval} onChange={e => setJobSyncInterval(e.target.value as string)} label="Job Template Sync Interval">
                  <MenuItem value="15">Every 15 minutes</MenuItem>
                  <MenuItem value="30">Every 30 minutes</MenuItem>
                  <MenuItem value="60">Every 1 hour</MenuItem>
                </Select>
              </FormControl>
              <FormControl variant="outlined" size="small" style={{ flex: 1 }}>
                <InputLabel>User & Team Sync Interval</InputLabel>
                <Select value={userSyncInterval} onChange={e => setUserSyncInterval(e.target.value as string)} label="User & Team Sync Interval">
                  <MenuItem value="30">Every 30 minutes</MenuItem>
                  <MenuItem value="60">Every 1 hour</MenuItem>
                  <MenuItem value="360">Every 6 hours</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}
      </>
    );
  }

  function renderConnectRegistries() {
    return (
      <>
        <Typography className={classes.sectionTitle}>Connect Registries</Typography>
        <Typography className={classes.sectionDescription}>
          Enable the sources where your team discovers automation content (Execution Environments,
          Collections etc.)
        </Typography>

        <Typography className={classes.subsectionTitle}>Private Registries (Private Automation Hub)</Typography>

        <Box className={classes.toggleRow}>
          <Box>
            <Typography className={classes.toggleLabel}>Private Automation Hub (PAH): {pahEnabled ? 'On' : 'Off'}</Typography>
            <Typography className={classes.toggleDescription}>
              Connect your organization's private hub to discover secure execution environments and custom collections.
            </Typography>
          </Box>
          <Switch checked={pahEnabled} onChange={e => setPahEnabled(e.target.checked)} color="primary" />
        </Box>
        {pahEnabled && (
          <FormControlLabel
            control={<Checkbox checked={pahFromAap} onChange={e => setPahFromAap(e.target.checked)} color="primary" size="small" />}
            label={
              <Box>
                <Typography style={{ fontSize: 13, fontWeight: 500 }}>Use connection details from AAP (Step 2)</Typography>
                <Typography style={{ fontSize: 11, color: '#888' }}>
                  When checked, the Private Automation Hub URL and Token will be inherited from the AAP
                  Controller. Uncheck this box to manually enter credentials for a standalone Private Hub.
                </Typography>
              </Box>
            }
            style={{ marginTop: 8, alignItems: 'flex-start' }}
          />
        )}

        <Divider style={{ margin: '24px 0' }} />

        <Typography className={classes.subsectionTitle}>Red Hat Ansible Automation Hub (Public)</Typography>
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 16 }}>
          Access official, internet hosted content directly from Red Hat.
        </Typography>

        <Box className={classes.toggleRow}>
          <Box>
            <Typography className={classes.toggleLabel}>Certified Content: {certifiedContent ? 'On' : 'Off'}</Typography>
            <Typography className={classes.toggleDescription}>
              Supported collections from certified partners (e.g. AWS, Microsoft, Cisco).
            </Typography>
          </Box>
          <Switch checked={certifiedContent} onChange={e => setCertifiedContent(e.target.checked)} color="primary" />
        </Box>

        <Box className={classes.toggleRow}>
          <Box>
            <Typography className={classes.toggleLabel}>Validated Content: {validatedContent ? 'On' : 'Off'}</Typography>
            <Typography className={classes.toggleDescription}>
              Trusted solutions and patterns developed by Red Hat.
            </Typography>
          </Box>
          <Switch checked={validatedContent} onChange={e => setValidatedContent(e.target.checked)} color="primary" />
        </Box>

        <Divider style={{ margin: '24px 0' }} />

        <Typography className={classes.subsectionTitle}>Ansible Galaxy (community)</Typography>

        <Box className={classes.toggleRow} style={{ borderBottom: 'none' }}>
          <Box>
            <Typography className={classes.toggleLabel}>Ansible Galaxy: {galaxyEnabled ? 'On' : 'Off'}</Typography>
            <Typography className={classes.toggleDescription}>
              Access unsupported community-contributed content over the internet.
            </Typography>
          </Box>
          <Switch checked={galaxyEnabled} onChange={e => setGalaxyEnabled(e.target.checked)} color="primary" />
        </Box>
      </>
    );
  }

  function renderSourceControl() {
    return (
      <>
        <Typography className={classes.sectionTitle}>Connect Source Control (Recommended)</Typography>
        <Typography className={classes.sectionDescription}>
          Connect to your source control provider to enable Single Sign-On (SSO), sync team memberships,
          discover existing automation, and create new projects or contribute to existing ones.
        </Typography>

        <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Configure providers</Typography>

        <Box className={classes.providerCard}>
          <Box className={classes.providerInfo}>
            <GitHubIcon style={{ fontSize: 28 }} />
            <Box>
              <Typography className={classes.providerName}>GitHub</Typography>
              {githubConnected ? (
                <Typography className={classes.connectedBadge}>
                  <CheckCircleIcon style={{ fontSize: 14 }} /> Connected
                </Typography>
              ) : (
                <Typography className={classes.providerDescription}>
                  Enable SSO, Team Sync, Discovery, and Write Access.
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            variant="outlined" size="small"
            style={{ textTransform: 'none', fontWeight: 500 }}
            startIcon={githubConnected ? <EditIcon style={{ fontSize: 14 }} /> : undefined}
            onClick={() => setGithubModalOpen(true)}
          >
            {githubConnected ? 'Edit' : 'Connect'}
          </Button>
        </Box>

        <Box className={classes.providerCard}>
          <Box className={classes.providerInfo}>
            <Box className={classes.gitlabIcon}>GL</Box>
            <Box>
              <Typography className={classes.providerName}>GitLab</Typography>
              <Typography className={classes.providerDescription}>
                Enable SSO, Team Sync, Discovery, and Write Access.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined" size="small"
            style={{ textTransform: 'none', fontWeight: 500 }}
          >
            Connect
          </Button>
        </Box>

        <Dialog open={githubModalOpen} onClose={() => setGithubModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              Connect GitHub
              <IconButton size="small" onClick={() => setGithubModalOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Typography className={classes.subsectionTitle} style={{ marginTop: 0 }}>
              Service Access (Discovery & Creation)
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 16 }}>
              Provide a Personal Access Token (PAT) to allow the portal to discover automation content,
              sync team data, and create or push changes to projects on behalf of the system.
            </Typography>

            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Provider URL</Typography>
              <TextField fullWidth variant="outlined" size="small" placeholder="e.g. https://github.com"
                value={ghProviderUrl} onChange={e => setGhProviderUrl(e.target.value)} />
            </Box>
            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Personal Access Token (PAT) *</Typography>
              <TextField fullWidth variant="outlined" size="small" placeholder="Enter PAT"
                value={ghPat} onChange={e => setGhPat(e.target.value)} />
            </Box>

            <Typography className={classes.subsectionTitle}>Discovery Scope</Typography>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 16 }}>
              Define which organizations the portal should scan. This portal will only import repositories
              containing galaxy.yml (collections) or Execution Environment definitions.
            </Typography>

            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Target Organization</Typography>
              <TextField fullWidth variant="outlined" size="small" placeholder="e.g., my-company, ansible-team-a"
                value={ghOrgs} onChange={e => setGhOrgs(e.target.value)} />
              <Typography className={classes.helperText}>
                Comma-separated list of organizations to scan (e.g., my-company, ansible-team-a).
              </Typography>
            </Box>
            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>EE Definition Filename</Typography>
              <TextField fullWidth variant="outlined" size="small"
                value={ghEeFilename} onChange={e => setGhEeFilename(e.target.value)} />
              <Typography className={classes.helperText}>
                This filename used to identify Execution Environment projects within your repositories.
              </Typography>
            </Box>

            <Box display="flex" style={{ gap: 16 }}>
              <Box className={classes.fieldGroup} style={{ flex: 1 }}>
                <Typography className={classes.fieldLabel}>Source Branches *</Typography>
                <TextField fullWidth variant="outlined" size="small"
                  value={ghBranches} onChange={e => setGhBranches(e.target.value)} />
                <Typography className={classes.helperText}>
                  Comma-separated list of branches or tags to scan. Defaults to main.
                </Typography>
              </Box>
              <Box className={classes.fieldGroup} style={{ flex: 1 }}>
                <Typography className={classes.fieldLabel}>Max Folder Depth</Typography>
                <TextField fullWidth variant="outlined" size="small"
                  value={ghMaxDepth} onChange={e => setGhMaxDepth(e.target.value)} />
                <Typography className={classes.helperText}>
                  Limit how deep the system crawls nested directories to find content.
                </Typography>
              </Box>
            </Box>

            <Divider style={{ margin: '16px 0' }} />

            <Typography className={classes.subsectionTitle}>User Sign-in (SSO)</Typography>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 16 }}>
              Configure OAuth credentials to allow your team to log in to the portal using their existing
              GitHub accounts.
            </Typography>

            <FormControlLabel
              control={<Checkbox checked={ghSsoEnabled} onChange={e => setGhSsoEnabled(e.target.checked)} color="primary" size="small" />}
              label={<Typography style={{ fontSize: 13, fontWeight: 500 }}>Enable User Login (SSO)</Typography>}
            />

            {ghSsoEnabled && (
              <Box display="flex" style={{ gap: 16, marginTop: 12 }}>
                <Box className={classes.fieldGroup} style={{ flex: 1 }}>
                  <Typography className={classes.fieldLabel}>OAuth Client ID</Typography>
                  <TextField fullWidth variant="outlined" size="small" placeholder="Enter Client ID"
                    value={ghSsoClientId} onChange={e => setGhSsoClientId(e.target.value)} />
                </Box>
                <Box className={classes.fieldGroup} style={{ flex: 1 }}>
                  <Typography className={classes.fieldLabel}>OAuth Client Secret</Typography>
                  <TextField fullWidth variant="outlined" size="small" placeholder="Enter Client Secret" type="password"
                    value={ghSsoClientSecret} onChange={e => setGhSsoClientSecret(e.target.value)} />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGithubModalOpen(false)} style={{ textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleGithubSave} style={{ textTransform: 'none' }}>
              Save changes
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  function renderReview() {
    return (
      <>
        <Typography className={classes.sectionTitle}>Review</Typography>
        <Typography className={classes.sectionDescription}>
          Review your configuration settings below. Once confirmed, click "Apply & Restart Portal" to save
          the configuration to app-config.yaml and restart the service. This will end your temporary setup session.
        </Typography>

        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewTitle}>Connect AAP</Typography>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Controller URL:</Typography>
            <Typography className={classes.reviewValue}>{aapUrl || 'Not set'}</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>OAuth Client ID:</Typography>
            <Typography className={classes.reviewValue}>{oauthClientId || 'Not set'}</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>OAuth Client Secret:</Typography>
            <Typography className={classes.reviewValue}>••••••••</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Admin Personal Access Token:</Typography>
            <Typography className={classes.reviewValue}>••••••••</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Sync Schedule:</Typography>
            <Typography className={classes.reviewValue}>
              Templates ({jobSyncInterval}m), Users ({userSyncInterval === '60' ? '1h' : `${userSyncInterval}m`})
            </Typography>
          </Box>
        </Box>

        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewTitle}>Connect Registries</Typography>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Public Registries:</Typography>
            <Typography className={classes.reviewValue}>
              Galaxy ({galaxyEnabled ? 'On' : 'Off'}), Cloud Hub ({certifiedContent || validatedContent ? 'On' : 'Off'})
            </Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Private Automation Hub:</Typography>
            <Typography className={classes.reviewValue}>
              {pahEnabled ? (pahFromAap ? 'Inherited from AAP connection details.' : 'Custom configuration') : 'Disabled'}
            </Typography>
          </Box>
        </Box>

        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewTitle}>Connect Source Control</Typography>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>GitHub:</Typography>
            <Typography className={classes.reviewValue}>
              {githubConnected ? 'Configured.' : 'Not configured.'}
            </Typography>
          </Box>
          {githubConnected && (
            <>
              <Box style={{ paddingLeft: 8, fontSize: 12, color: '#888' }}>
                <Box className={classes.reviewRow}>
                  <Typography className={classes.reviewLabel} style={{ fontSize: 12 }}>Discovery:</Typography>
                  <Typography className={classes.reviewValue} style={{ fontSize: 12 }}>Orgs: {ghOrgs || 'All'}</Typography>
                </Box>
                <Box className={classes.reviewRow}>
                  <Typography className={classes.reviewLabel} style={{ fontSize: 12 }}>Authentication (SSO):</Typography>
                  <Typography className={classes.reviewValue} style={{ fontSize: 12 }}>
                    {ghSsoEnabled ? `Enabled. Client ID: ${ghSsoClientId || 'Not set'}` : 'Disabled'}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>GitLab:</Typography>
            <Typography className={classes.reviewValue}>Not configured.</Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="textSecondary">
          Note: Sensitive values like secrets, keys, and tokens are masked for security.
        </Typography>
      </>
    );
  }

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.headerLogo}>A</Box>
        <Box>
          <Typography className={classes.headerTitle}>Red Hat</Typography>
          <Typography className={classes.headerSubtitle}>Ansible Automation Portal</Typography>
        </Box>
        <Typography className={classes.headerUser}>John Smith ▾</Typography>
      </Box>

      <Typography variant="h6" style={{ fontWeight: 600, margin: '24px 24px 0' }}>
        Setup Ansible Automation Portal
      </Typography>

      <Box className={classes.wizardContainer}>
        <Box className={classes.sidebar}>
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <Box key={s.key} className={classes.stepItem}>
                <Box
                  className={`${classes.stepNumber} ${
                    isActive ? classes.stepActive :
                    isCompleted ? classes.stepCompleted :
                    classes.stepPending
                  }`}
                >
                  {isCompleted ? '✓' : i + 1}
                </Box>
                <Typography
                  className={`${classes.stepLabel} ${
                    isActive ? classes.stepLabelActive : classes.stepLabelPending
                  }`}
                >
                  {s.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box className={classes.mainContent}>
          <Box className={classes.contentBody}>
            {renderStepContent()}
          </Box>
          <Box className={classes.footer}>
            {step > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={step === 0 ? handleNext : handleNext}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                {step === 0 ? 'Start Configuration' : 'Next'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleApply}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                Apply & Restart Portal
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
