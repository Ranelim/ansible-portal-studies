import { useState, useCallback, useEffect } from 'react';
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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import SettingsIcon from '@material-ui/icons/Settings';
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
}));

const STEPS = [
  { label: 'Overview', key: 'overview' },
  { label: 'Connect AAP', key: 'aap' },
  { label: 'Review', key: 'review' },
];

type WizardPhase = 'login' | 'wizard' | 'applying' | 'success';

type DiscoveryStep = {
  label: string;
  status: 'pending' | 'running' | 'done';
};

const DISCOVERY_STEPS: DiscoveryStep[] = [
  { label: 'Writing configuration to app-config.yaml', status: 'pending' },
  { label: 'Connecting to AAP Controller', status: 'pending' },
  { label: 'Validating OAuth credentials', status: 'pending' },
  { label: 'Syncing initial data from AAP', status: 'pending' },
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
              AAP is connected and authentication is configured. Your team can now sign in.
              To get the most out of the portal, connect registries and source control from the Administration area.
            </Typography>
            <Box style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => { window.location.href = '/self-service/admin/connections'; }}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                Go to Administration
              </Button>
              <Button
                variant="outlined"
                onClick={() => { window.location.href = '/self-service/projects'; }}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                Skip for now
              </Button>
            </Box>
          </>
        )}
      </Box>
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
      case 2: return renderReview();
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
          <li>AAP Controller URL (e.g. https://aap.example.com)</li>
          <li>AAP Personal Access Token (requires System Administrator privileges)</li>
          <li>OAuth Client ID & Secret from your AAP application settings</li>
        </ul>
        <Box
          style={{
            marginTop: 24,
            padding: '12px 16px',
            backgroundColor: 'rgba(0,102,204,0.08)',
            border: '1px solid rgba(0,102,204,0.2)',
            borderRadius: 8,
          }}
        >
          <Typography style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            What about registries and source control?
          </Typography>
          <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
            This wizard configures only the essentials needed to get the portal running.
            You can connect content registries (PAH, Galaxy) and source control providers
            (GitHub, GitLab) from the Administration area after setup is complete.
          </Typography>
        </Box>
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

  function renderReview() {
    return (
      <>
        <Typography className={classes.sectionTitle}>Review</Typography>
        <Typography className={classes.sectionDescription}>
          Review your configuration settings below. Once confirmed, click "Apply & Restart Portal" to save
          the configuration and restart the service. This will end your temporary setup session.
        </Typography>

        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewTitle}>AAP Connection</Typography>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Controller URL:</Typography>
            <Typography className={classes.reviewValue}>{aapUrl || 'Not set'}</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>Admin Personal Access Token:</Typography>
            <Typography className={classes.reviewValue}>{aapToken ? '••••••••' : 'Not set'}</Typography>
          </Box>
        </Box>

        <Box className={classes.reviewSection}>
          <Typography className={classes.reviewTitle}>User Authentication (OAuth)</Typography>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>OAuth Client ID:</Typography>
            <Typography className={classes.reviewValue}>{oauthClientId || 'Not set'}</Typography>
          </Box>
          <Box className={classes.reviewRow}>
            <Typography className={classes.reviewLabel}>OAuth Client Secret:</Typography>
            <Typography className={classes.reviewValue}>{oauthClientSecret ? '••••••••' : 'Not set'}</Typography>
          </Box>
        </Box>

        {showAdvancedSync && (
          <Box className={classes.reviewSection}>
            <Typography className={classes.reviewTitle}>Sync Schedule</Typography>
            <Box className={classes.reviewRow}>
              <Typography className={classes.reviewLabel}>Job Template Sync:</Typography>
              <Typography className={classes.reviewValue}>Every {jobSyncInterval} minutes</Typography>
            </Box>
            <Box className={classes.reviewRow}>
              <Typography className={classes.reviewLabel}>User & Team Sync:</Typography>
              <Typography className={classes.reviewValue}>
                {userSyncInterval === '60' ? 'Every 1 hour' : `Every ${userSyncInterval} minutes`}
              </Typography>
            </Box>
          </Box>
        )}

        <Box
          style={{
            marginTop: 16,
            padding: '12px 16px',
            backgroundColor: 'rgba(0,102,204,0.08)',
            border: '1px solid rgba(0,102,204,0.2)',
            borderRadius: 8,
          }}
        >
          <Typography style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            What happens next?
          </Typography>
          <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
            After applying, you'll be guided through optional Day 2 setup — connecting content registries,
            source control providers, and other integrations from the Administration area.
          </Typography>
        </Box>

        <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 12 }}>
          Sensitive values like secrets, keys, and tokens are masked for security.
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
