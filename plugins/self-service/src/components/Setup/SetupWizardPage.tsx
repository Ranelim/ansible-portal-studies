import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Link,
  makeStyles,
  useTheme,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import SettingsIcon from '@material-ui/icons/Settings';
import redHatLogo from '../../assets/redhat-logo.png';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
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
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  prerequisiteList: {
    paddingLeft: 20,
    '& li': {
      fontSize: 14,
      lineHeight: 1.8,
    },
  },
  autoDetectedField: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    backgroundColor: theme.palette.type === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    marginBottom: 8,
  },
  orgChip: {
    margin: 2,
  },
  orgList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    maxHeight: 320,
    overflowY: 'auto' as const,
    padding: 8,
  },
  orgItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.type === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    },
  },
  selectedOrgsBar: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4,
    padding: '8px 0',
    minHeight: 32,
  },
}));

const STEPS = [
  { label: 'Getting started', key: 'overview' },
  { label: 'Connect AAP', key: 'aap' },
  { label: 'Organizations', key: 'orgs' },
  { label: 'Review & apply', key: 'review' },
];

type WizardPhase = 'login' | 'wizard' | 'applying' | 'success';

type DiscoveryStep = {
  label: string;
  status: 'pending' | 'running' | 'done';
};

const DISCOVERY_STEPS: DiscoveryStep[] = [
  { label: 'Writing configuration', status: 'pending' },
  { label: 'Connecting to Ansible Automation Platform', status: 'pending' },
  { label: 'Validating OAuth credentials', status: 'pending' },
];

const ApplyingAndDiscoveryScreen = ({ onDone, isDone }: { onDone: () => void; isDone: boolean }) => {
  const classes = useStyles();
  const [steps, setSteps] = useState<DiscoveryStep[]>(
    DISCOVERY_STEPS.map(s => ({ ...s })),
  );
  const [allDone, setAllDone] = useState(isDone);

  useEffect(() => {
    if (isDone) {
      setSteps(DISCOVERY_STEPS.map(s => ({ ...s, status: 'done' })));
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
        const delay = 600 + Math.random() * 400;
        await new Promise(r => setTimeout(r, delay));
        if (cancelled) return;
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'done' } : s,
        ));
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

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.headerLogo}><img src={redHatLogo} alt="Red Hat" style={{ width: 36, height: 36, objectFit: 'contain' }} /></Box>
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
          {allDone ? 'Portal Configured & Ready' : 'Applying configuration...'}
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

        {allDone && (
          <>
            <Typography variant="body2" style={{ maxWidth: 460, lineHeight: 1.6, opacity: 0.7 }}>
              Configuration saved and portal restarted. The temporary admin session has ended.
              Sign in with your Ansible Automation Platform credentials to verify the setup.
            </Typography>
            <Box style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  sessionStorage.removeItem('portal-setup-completed');
                  window.location.href = '/';
                }}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                Go to sign-in page
              </Button>
            </Box>
            <Typography variant="caption" style={{ opacity: 0.5, marginTop: 8 }}>
              After signing in, the Administration page will guide you through connecting
              source control and other integrations.
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export const SetupWizardPage = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [phase, setPhase] = useState<WizardPhase>(() => {
    const setupCompleted = sessionStorage.getItem('portal-setup-completed');
    if (setupCompleted) return 'success';
    return 'login';
  });
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState('');
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  const [aapUrl, setAapUrl] = useState('');
  const [aapToken, setAapToken] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [checkSSL, setCheckSSL] = useState(true);

  const [oauthMode, setOauthMode] = useState<'auto' | 'manual'>('auto');
  const [oauthAutoStatus, setOauthAutoStatus] = useState<'idle' | 'creating' | 'done'>('idle');
  const [oauthAppName, setOauthAppName] = useState('ansible-portal');
  const [connTestStatus, setConnTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const connTestTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!aapUrl.trim() || !aapToken.trim()) {
      setConnTestStatus('idle');
      return;
    }
    setConnTestStatus('idle');
    clearTimeout(connTestTimer.current);
    connTestTimer.current = setTimeout(() => {
      setConnTestStatus('testing');
      setTimeout(() => setConnTestStatus('success'), 1500);
    }, 1000);
    return () => clearTimeout(connTestTimer.current);
  }, [aapUrl, aapToken]);

  const [portalBaseUrl, setPortalBaseUrl] = useState('https://portal.example.com');

  const DEMO_ORGS = [
    { id: 'default', name: 'Default', description: 'Default organization', users: 12 },
    { id: 'platform-eng', name: 'Platform Engineering', description: 'Infrastructure and platform team', users: 8 },
    { id: 'app-dev', name: 'Application Development', description: 'Application development teams', users: 24 },
    { id: 'security', name: 'Security & Compliance', description: 'Security operations team', users: 6 },
    { id: 'network-ops', name: 'Network Operations', description: 'Network automation team', users: 10 },
    { id: 'cloud-ops', name: 'Cloud Operations', description: 'Cloud infrastructure automation', users: 15 },
    { id: 'devops', name: 'DevOps', description: 'CI/CD and deployment pipelines', users: 18 },
    { id: 'database', name: 'Database Administration', description: 'Database provisioning and management', users: 4 },
    { id: 'middleware', name: 'Middleware Services', description: 'Application server management', users: 7 },
    { id: 'storage', name: 'Storage & Backup', description: 'Storage provisioning and DR', users: 5 },
    { id: 'monitoring', name: 'Monitoring & Observability', description: 'Infrastructure monitoring', users: 9 },
    { id: 'compliance', name: 'Compliance Automation', description: 'Regulatory compliance scanning', users: 3 },
  ];
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>(['default']);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgShowCount, setOrgShowCount] = useState(20);

  const handleLogin = useCallback(() => {
    if (password.trim()) {
      setPhase('wizard');
      setStep(0);
    }
  }, [password]);

  const isStepValid = useCallback(() => {
    switch (step) {
      case 1: {
        const hasUrl = aapUrl.trim() !== '';
        const hasToken = aapToken.trim() !== '';
        const hasOAuth = oauthMode === 'auto'
          ? oauthAutoStatus === 'done'
          : oauthClientId.trim() !== '' && oauthClientSecret.trim() !== '';
        const connVerified = connTestStatus === 'success';
        return hasUrl && hasToken && hasOAuth && connVerified;
      }
      case 2:
        return selectedOrgs.length > 0;
      default:
        return true;
    }
  }, [step, aapUrl, aapToken, oauthMode, oauthAutoStatus, oauthClientId, oauthClientSecret, selectedOrgs, connTestStatus]);

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
    setTimeout(() => {
      sessionStorage.setItem('portal-setup-completed', 'true');
      setPhase('success');
    }, 3000);
  }, []);

  if (phase === 'login') {
    return (
      <Box className={classes.root}>
        <Box className={classes.header}>
          <Box className={classes.headerLogo}><img src={redHatLogo} alt="Red Hat" style={{ width: 36, height: 36, objectFit: 'contain' }} /></Box>
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
                  The portal is running but requires initial configuration.
                  Enter the administrator password from your installation logs to begin.
                </Typography>
              </Box>

              <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 8 }}>
                Setup Mode Login
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: 20 }}>
                This password was generated during installation. After setup, you will sign in with your AAP credentials.
              </Typography>

              <Typography className={classes.fieldLabel}>
                Admin password
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
      case 2: return renderSelectOrgs();
      case 3: return renderReview();
      default: return null;
    }
  };

  const toggleOrg = (orgId: string) => {
    setSelectedOrgs(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId],
    );
  };

  function renderOverview() {
    return (
      <>
        <Typography className={classes.sectionTitle}>Welcome to Ansible Automation Portal</Typography>
        <Typography className={classes.sectionDescription}>
          This wizard connects your portal to Ansible Automation Platform. Once connected,
          the portal will discover and serve your automation content — job templates, collections,
          and execution environments — so your team can find and use them through a single interface.
        </Typography>

        <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 8 }}>
          Once connected, your team can:
        </Typography>
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {[
            'Job templates appear as self-service templates your team can browse, configure, and run',
            'Collections, roles, and execution environments are indexed so developers can find and reuse them',
            'Your team signs in with their existing Ansible Automation Platform credentials — no separate accounts needed',
          ].map(text => (
            <Box key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Box style={{
                width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4DA3FF',
                flexShrink: 0, marginTop: 7,
              }} />
              <Typography style={{ fontSize: 14, lineHeight: 1.5 }}>{text}</Typography>
            </Box>
          ))}
        </Box>

        <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Before you begin, have the following ready:
        </Typography>
        <ul className={classes.prerequisiteList}>
          <li>Your AAP Controller URL</li>
          <li>A personal access token with admin privileges</li>
          <li>Admin access to create an OAuth application (or an existing one's client ID and secret)</li>
        </ul>

        <Box style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 8,
          backgroundColor: 'rgba(0,102,204,0.06)',
          border: '1px solid rgba(0,102,204,0.15)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <InfoOutlinedIcon style={{ fontSize: 18, color: '#4DA3FF', flexShrink: 0, marginTop: 2 }} />
          <Typography style={{ fontSize: 13, lineHeight: 1.6 }}>
            This wizard takes about 5 minutes. After setup, the Administration pages will guide you
            through connecting source control and other integrations.
          </Typography>
        </Box>
      </>
    );
  }

  function renderConnectAAP() {
    const tokenValidated = connTestStatus === 'success';

    const handleAutoOAuth = () => {
      setOauthAutoStatus('creating');
      setTimeout(() => {
        setOauthClientId('portal-auto-generated');
        setOauthClientSecret('auto-secret');
        setOauthAutoStatus('done');
      }, 1500);
    };

    return (
      <>
        <Typography className={classes.sectionTitle}>Connect Ansible Automation Platform</Typography>
        <Typography className={classes.sectionDescription}>
          Connect to your Ansible Automation Platform instance. This enables user authentication
          via OAuth and allows the portal to sync content in the background.
        </Typography>

        {/* Portal base URL — read-only at top */}
        <Box style={{
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 24,
        }}>
          <Typography style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>
            Portal base URL
          </Typography>
          <Typography style={{ fontSize: 14, fontFamily: 'monospace' }}>
            {portalBaseUrl}
          </Typography>
          <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.5 }}>
            Read-only — configured in app-config.yaml. To change, edit the <code>app.baseUrl</code> value
            in your configuration file and restart the portal.
          </Typography>
        </Box>

        <Box className={classes.fieldGroup}>
          <Typography className={classes.fieldLabel}>AAP Controller URL *</Typography>
          <TextField
            fullWidth variant="outlined" size="small"
            placeholder="https://aap.example.com"
            value={aapUrl} onChange={e => setAapUrl(e.target.value)}
          />
          <Typography className={classes.helperText}>
            The URL of your Automation Controller instance (e.g. https://aap.example.com)
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={checkSSL}
              onChange={e => setCheckSSL(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Box>
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>Verify TLS certificate</Typography>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Uncheck only if your instance uses a self-signed or internal CA certificate.
              </Typography>
            </Box>
          }
          style={{ marginBottom: 20, alignItems: 'flex-start' }}
        />

        <Typography className={classes.subsectionTitle}>Service access</Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16, fontSize: 13 }}>
          A personal access token with admin privileges is required for API access — content sync,
          job template discovery, and organization data retrieval.
        </Typography>

        <Box className={classes.fieldGroup}>
          <Typography className={classes.fieldLabel}>Admin personal access token *</Typography>
          <TextField
            fullWidth variant="outlined" size="small"
            placeholder="Enter access token"
            value={aapToken} onChange={e => setAapToken(e.target.value)}
          />
        </Box>

        {connTestStatus === 'testing' && (
          <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 24, padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
            <CircularProgress size={14} />
            <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Testing connection to {aapUrl}…
            </Typography>
          </Box>
        )}

        {connTestStatus === 'success' && (
          <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 24, padding: '8px 12px', backgroundColor: 'rgba(99,153,61,0.1)', borderRadius: 6, border: '1px solid rgba(99,153,61,0.3)' }}>
            <Box display="flex" alignItems="center" style={{ gap: 6 }}>
              <CheckCircleOutlineIcon style={{ fontSize: 16, color: '#63993D' }} />
              <Typography style={{ fontSize: 13, color: '#63993D' }}>
                Connected to {aapUrl}
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => {
                setConnTestStatus('testing');
                setTimeout(() => setConnTestStatus('success'), 1500);
              }}
              style={{ textTransform: 'none', fontSize: 12, color: '#63993D', minWidth: 0, padding: '2px 8px' }}
            >
              Test again
            </Button>
          </Box>
        )}

        {connTestStatus === 'error' && (
          <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 24, padding: '8px 12px', backgroundColor: 'rgba(201,25,11,0.1)', borderRadius: 6, border: '1px solid rgba(201,25,11,0.3)' }}>
            <Box display="flex" alignItems="center" style={{ gap: 6 }}>
              <ErrorOutlineIcon style={{ fontSize: 16, color: '#C9190B' }} />
              <Typography style={{ fontSize: 13, color: '#C9190B' }}>
                Unable to reach {aapUrl}. Check the URL and token.
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => {
                setConnTestStatus('testing');
                setTimeout(() => setConnTestStatus('success'), 1500);
              }}
              style={{ textTransform: 'none', fontSize: 12, color: '#C9190B', minWidth: 0, padding: '2px 8px' }}
            >
              Test again
            </Button>
          </Box>
        )}

        {/* OAuth section — always visible, disabled until connection is validated */}
        <Box style={{ opacity: tokenValidated ? 1 : 0.45, transition: 'opacity 0.3s ease', pointerEvents: tokenValidated ? 'auto' : 'none' }}>
          <Typography className={classes.subsectionTitle}>User sign-in (OAuth)</Typography>
          {!tokenValidated ? (
            <Typography variant="body2" style={{ marginBottom: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Complete service access above to configure OAuth sign-in.
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Configure OAuth so users can sign in with their Ansible Automation Platform accounts.
            </Typography>
          )}

          <Box style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Box
              onClick={tokenValidated ? () => { setOauthMode('auto'); setOauthAutoStatus('idle'); } : undefined}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: `2px solid ${oauthMode === 'auto' && tokenValidated ? '#0066CC' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 8,
                cursor: tokenValidated ? 'pointer' : 'default',
                backgroundColor: oauthMode === 'auto' && tokenValidated ? 'rgba(0,102,204,0.06)' : 'transparent',
              }}
            >
              <Typography style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Automatic setup
              </Typography>
              <Typography style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                Recommended — the portal creates an OAuth application in AAP using your admin token
              </Typography>
            </Box>
            <Box
              onClick={tokenValidated ? () => setOauthMode('manual') : undefined}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: `2px solid ${oauthMode === 'manual' && tokenValidated ? '#0066CC' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 8,
                cursor: tokenValidated ? 'pointer' : 'default',
                backgroundColor: oauthMode === 'manual' && tokenValidated ? 'rgba(0,102,204,0.06)' : 'transparent',
              }}
            >
              <Typography style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Manual entry
              </Typography>
              <Typography style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                Enter credentials from a pre-existing OAuth application registered in AAP
              </Typography>
            </Box>
          </Box>

          {oauthMode === 'auto' && (
            <Box style={{
              padding: '16px 20px',
              border: '1px solid rgba(0,102,204,0.2)',
              borderRadius: 8,
              backgroundColor: 'rgba(0,102,204,0.04)',
            }}>
              <Box className={classes.fieldGroup} style={{ marginBottom: 16 }}>
                <Typography className={classes.fieldLabel}>OAuth application name *</Typography>
                <TextField
                  fullWidth variant="outlined" size="small"
                  placeholder="ansible-portal"
                  value={oauthAppName}
                  onChange={e => setOauthAppName(e.target.value)}
                  disabled={!tokenValidated || oauthAutoStatus !== 'idle'}
                />
                <Typography className={classes.helperText}>
                  A unique name for the OAuth application in AAP. Must not conflict with existing application names.
                </Typography>
              </Box>

              {oauthAutoStatus === 'idle' && (
                <Button
                  variant="contained" color="primary" size="small"
                  onClick={handleAutoOAuth}
                  disabled={!oauthAppName.trim() || !tokenValidated}
                  style={{ textTransform: 'none', fontWeight: 500 }}
                >
                  Create OAuth application in AAP
                </Button>
              )}
              {oauthAutoStatus === 'creating' && (
                <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CircularProgress size={18} />
                  <Typography style={{ fontSize: 13 }}>Creating "{oauthAppName}" in AAP...</Typography>
                </Box>
              )}
              {oauthAutoStatus === 'done' && (
                <Box display="flex" alignItems="center" style={{ gap: 6, padding: '8px 12px', backgroundColor: 'rgba(99,153,61,0.1)', borderRadius: 6, border: '1px solid rgba(99,153,61,0.3)' }}>
                  <CheckCircleOutlineIcon style={{ fontSize: 16, color: '#63993D' }} />
                  <Typography style={{ fontSize: 13, color: '#63993D' }}>
                    OAuth application created successfully. Client ID and secret have been saved.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {oauthMode === 'manual' && (
            <Box style={{
              padding: '16px 20px',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}>
              <Box style={{
                padding: '10px 14px',
                borderRadius: 6,
                backgroundColor: 'rgba(0,102,204,0.06)',
                border: '1px solid rgba(0,102,204,0.15)',
                marginBottom: 16,
              }}>
                <Typography style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
                  In AAP, create a new OAuth application. Set the redirect URI to:
                </Typography>
                <Typography style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 500, marginTop: 4 }}>
                  {portalBaseUrl}/api/auth/rhaap/handler/frame
                </Typography>
                <Typography style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  Then copy the client ID and secret back here.
                </Typography>
              </Box>
              <Box className={classes.fieldGroup}>
                <Typography className={classes.fieldLabel}>OAuth client ID *</Typography>
                <TextField
                  fullWidth variant="outlined" size="small"
                  placeholder="Enter client ID"
                  value={oauthClientId} onChange={e => setOauthClientId(e.target.value)}
                  disabled={!tokenValidated}
                />
              </Box>
              <Box className={classes.fieldGroup}>
                <Typography className={classes.fieldLabel}>OAuth client secret *</Typography>
                <TextField
                  fullWidth variant="outlined" size="small"
                  placeholder="Enter secret" type="password"
                  value={oauthClientSecret} onChange={e => setOauthClientSecret(e.target.value)}
                  disabled={!tokenValidated}
                />
              </Box>
            </Box>
          )}
        </Box>
      </>
    );
  }

  function renderSelectOrgs() {
    const filtered = orgSearch.trim()
      ? DEMO_ORGS.filter(o =>
          o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
          o.description.toLowerCase().includes(orgSearch.toLowerCase()))
      : DEMO_ORGS;
    const visible = filtered.slice(0, orgShowCount);
    const hasMore = filtered.length > orgShowCount;

    return (
      <>
        <Typography className={classes.sectionTitle}>Select AAP Organizations</Typography>
        <Typography className={classes.sectionDescription}>
          Choose which organizations to sync. The portal imports users, teams, and content from
          these organizations. At least one is required for user sign-in to work.
        </Typography>

        {selectedOrgs.length > 0 && (
          <Box className={classes.selectedOrgsBar}>
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginRight: 4, alignSelf: 'center' }}>
              {selectedOrgs.length} selected:
            </Typography>
            {selectedOrgs.map(orgId => {
              const org = DEMO_ORGS.find(o => o.id === orgId);
              return org ? (
                <Chip
                  key={orgId}
                  label={org.name}
                  size="small"
                  onDelete={() => toggleOrg(orgId)}
                  className={classes.orgChip}
                  color="primary"
                  variant="outlined"
                />
              ) : null;
            })}
          </Box>
        )}

        <TextField
          fullWidth variant="outlined" size="small"
          placeholder="Search organizations..."
          value={orgSearch}
          onChange={e => { setOrgSearch(e.target.value); setOrgShowCount(20); }}
          style={{ marginBottom: 8 }}
        />

        <Box style={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4 }}>
          <Box className={classes.orgList}>
            {visible.map(org => (
              <Box
                key={org.id}
                className={classes.orgItem}
                onClick={() => toggleOrg(org.id)}
              >
                <Checkbox
                  checked={selectedOrgs.includes(org.id)}
                  color="primary"
                  size="small"
                  style={{ padding: 4 }}
                />
                <Box style={{ flex: 1 }}>
                  <Typography style={{ fontSize: 13, fontWeight: 500 }}>{org.name}</Typography>
                  <Typography style={{ fontSize: 12, opacity: 0.6 }}>{org.description}</Typography>
                </Box>
                <Typography style={{ fontSize: 11, opacity: 0.5 }}>
                  {org.users} users
                </Typography>
              </Box>
            ))}
            {filtered.length === 0 && (
              <Typography style={{ fontSize: 13, color: '#999', padding: 16, textAlign: 'center' }}>
                No organizations match "{orgSearch}"
              </Typography>
            )}
          </Box>
          {hasMore && (
            <Box style={{
              textAlign: 'center', padding: '6px 0',
              borderTop: `1px solid ${theme.palette.divider}`,
            }}>
              <Button
                size="small" color="primary"
                onClick={() => setOrgShowCount(c => c + 20)}
                style={{ textTransform: 'none', fontSize: 12 }}
              >
                Show more ({filtered.length - orgShowCount} remaining)
              </Button>
            </Box>
          )}
        </Box>

        <Typography className={classes.helperText} style={{ marginTop: 12 }}>
          Organizations are fetched from AAP. You can add or remove organizations later
          from Administration &gt; Connections &gt; AAP &gt; Content.
        </Typography>
      </>
    );
  }

  function renderReview() {
    return (
      <>
        <Typography className={classes.sectionTitle}>Review & apply</Typography>
        <Typography className={classes.sectionDescription}>
          Review your configuration. Applying will save these settings, restart the portal, and end this
          temporary admin session. You'll be redirected to the sign-in page to verify everything works.
        </Typography>

        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewTitle}>AAP connection</Typography>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Controller URL:</Typography>
            <Typography className={classes.reviewValue}>{aapUrl || 'Not set'}</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>TLS verification:</Typography>
            <Typography className={classes.reviewValue}>{checkSSL ? 'Enabled' : 'Disabled'}</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Admin token:</Typography>
            <Typography className={classes.reviewValue} style={{ fontFamily: 'monospace' }}>{aapToken || 'Not set'}</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Portal base URL:</Typography>
            <Typography className={classes.reviewValue}>{portalBaseUrl}</Typography>
          </Box>
        </Box>

        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewTitle}>User authentication (OAuth)</Typography>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Setup method:</Typography>
            <Typography className={classes.reviewValue}>{oauthMode === 'auto' ? 'Automatic' : 'Manual'}</Typography>
          </Box>
          {oauthMode === 'auto' && (
            <Box className={classes.reviewRow}>
              <Typography className={classes.reviewLabel}>OAuth application name:</Typography>
              <Typography className={classes.reviewValue}>{oauthAppName}</Typography>
            </Box>
          )}
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>OAuth client ID:</Typography>
            <Typography className={classes.reviewValue}>{oauthClientId || 'Not set'}</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>OAuth client secret:</Typography>
            <Typography className={classes.reviewValue} style={{ fontFamily: 'monospace' }}>{oauthClientSecret || 'Not set'}</Typography>
          </Box>
        </Box>

        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewTitle}>Organizations</Typography>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Syncing:</Typography>
            <Typography className={classes.reviewValue}>
              {selectedOrgs.map(id => DEMO_ORGS.find(o => o.id === id)?.name).filter(Boolean).join(', ') || 'None selected'}
            </Typography>
          </Box>
        </Box>

      </>
    );
  }

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.headerLogo}><img src={redHatLogo} alt="Red Hat" style={{ width: 36, height: 36, objectFit: 'contain' }} /></Box>
        <Box>
          <Typography className={classes.headerTitle}>Red Hat</Typography>
          <Typography className={classes.headerSubtitle}>Ansible Automation Portal</Typography>
        </Box>
        <Box style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Box style={{
            padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
            backgroundColor: 'rgba(0,102,204,0.15)', color: '#4DA3FF',
            letterSpacing: 0.5,
          }}>
            SETUP MODE
          </Box>
        </Box>
      </Box>

      <Typography variant="h6" style={{ fontWeight: 600, margin: '24px 24px 0' }}>
        Set up Ansible Automation Portal
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
          <Box className={classes.footer} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
            {step === STEPS.length - 1 && (
              <Box style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px', borderRadius: 6, marginBottom: 12,
                backgroundColor: 'rgba(0,102,204,0.06)',
                border: '1px solid rgba(0,102,204,0.15)',
              }}>
                <InfoOutlinedIcon style={{ fontSize: 16, color: '#4DA3FF', flexShrink: 0, marginTop: 1 }} />
                <Typography style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
                  Applying will save these settings, restart the portal, and end this session.
                  You'll be redirected to the sign-in page to verify your Ansible Automation Platform
                  credentials work.
                </Typography>
              </Box>
            )}
            <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  style={{ textTransform: 'none', fontWeight: 500 }}
                >
                  {step === 0 ? 'Get Started' : 'Next'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApply}
                  style={{ textTransform: 'none', fontWeight: 500 }}
                >
                  Apply & restart portal
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
