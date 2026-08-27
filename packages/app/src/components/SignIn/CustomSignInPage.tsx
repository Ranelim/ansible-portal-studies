import { useEffect, useRef, useState } from 'react';
import { SignInPage } from '@backstage/core-components';
import { SignInPageProps } from '@backstage/core-plugin-api';
import { Box, Typography, Button, makeStyles, CircularProgress, TextField } from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import { writeSetupDemoMode } from '@ansible/plugin-backstage-self-service';

type CustomSignInPageProps = SignInPageProps & {
  providers: any[];
};

const STUDY_ACCESS_CODE = 'cedar-nimbus';
const SESSION_KEY = 'portal-study-access';

const LOCALHOST_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];

const isLocalhost =
  typeof window !== 'undefined' &&
  LOCALHOST_HOSTS.includes(window.location.hostname);

const isInternalPages =
  typeof window !== 'undefined' &&
  window.location.hostname.endsWith('.pages.redhat.com');

const needsAccessGate =
  typeof window !== 'undefined' && !isLocalhost && !isInternalPages;

const isStaticDeployment = typeof window !== 'undefined' && !isLocalhost;

const useStyles = makeStyles(theme => ({
  setupCard: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '14px 28px',
    borderRadius: 8,
    border: `1px dashed ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    textAlign: 'center',
    maxWidth: 520,
    width: '90%',
    zIndex: 10,
    boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  setupText: {
    flex: 1,
    textAlign: 'left',
  },
  setupTitle: {
    fontWeight: 600,
    fontSize: 13,
  },
  setupDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  setupButton: {
    textTransform: 'none',
    fontWeight: 500,
    flexShrink: 0,
  },
  gate: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(3),
  },
  card: {
    maxWidth: 380,
    width: '100%',
    textAlign: 'center',
    padding: theme.spacing(4),
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  icon: {
    fontSize: 40,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    fontSize: 14,
  },
  input: {
    marginBottom: theme.spacing(2),
  },
  error: {
    color: theme.palette.error.main,
    fontSize: 13,
    marginBottom: theme.spacing(1),
  },
}));

export const CustomSignInPage = (props: CustomSignInPageProps) => {
  const classes = useStyles();
  const { providers, ...signInProps } = props;
  const signedIn = useRef(false);
  const [accessGranted, setAccessGranted] = useState(
    () => !needsAccessGate || sessionStorage.getItem(SESSION_KEY) === 'granted',
  );
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isStaticDeployment && accessGranted && !signedIn.current) {
      signedIn.current = true;
      props.onSignInSuccess({
        getProfileInfo: async () => ({
          email: 'guest@portal.local',
          displayName: 'Guest User',
        }),
        getBackstageIdentity: async () => ({
          type: 'user' as const,
          userEntityRef: 'user:development/guest',
          ownershipEntityRefs: ['user:development/guest'],
        }),
        getCredentials: async () => ({}),
        signOut: async () => {},
      } as any);
    }
  }, [accessGranted, props]);

  if (needsAccessGate && !accessGranted) {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (code.trim().toLowerCase() === STUDY_ACCESS_CODE.toLowerCase()) {
        sessionStorage.setItem(SESSION_KEY, 'granted');
        setAccessGranted(true);
        setError(false);
      } else {
        setError(true);
      }
    };

    return (
      <Box className={classes.gate}>
        <Box className={classes.card}>
          <LockOutlinedIcon className={classes.icon} />
          <Typography variant="h6" className={classes.title}>
            Automation Portal Prototype
          </Typography>
          <Typography className={classes.subtitle}>
            Enter the access code provided by the research team.
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              className={classes.input}
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Access code"
              value={code}
              onChange={e => {
                setCode(e.target.value);
                setError(false);
              }}
              autoFocus
              error={error}
            />
            {error && (
              <Typography className={classes.error}>
                Incorrect code. Please try again.
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={!code.trim()}
            >
              Continue
            </Button>
          </form>
        </Box>
      </Box>
    );
  }

  if (isStaticDeployment) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={24} style={{ marginRight: 12 }} />
        <Typography variant="body1">Loading prototype…</Typography>
      </Box>
    );
  }

  return (
    <>
      <SignInPage
        {...signInProps}
        align="center"
        title="Select a sign-in method"
        providers={providers}
      />
      <Box className={classes.setupCard}>
        <SettingsIcon style={{ fontSize: 22, flexShrink: 0, opacity: 0.6 }} />
        <Box className={classes.setupText}>
          <Typography className={classes.setupTitle}>
            First time setup?
          </Typography>
          <Typography className={classes.setupDescription}>
            Configure portal connections to AAP, Git, and registries.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          className={classes.setupButton}
          onClick={() => {
            sessionStorage.setItem('portal-setup-redirect', 'true');
            sessionStorage.setItem('portal-welcome-modal-dismissed-session', 'true');
            writeSetupDemoMode('landing');
            props.onSignInSuccess({
              getIdToken: async () => ({ token: '' }),
              getId: async () => 'setup-admin',
              getProfile: async () => ({
                email: 'admin@portal.local',
                displayName: 'Setup Admin',
              }),
              getCredentials: async () => ({ token: '' }),
              signOut: async () => {},
            } as any);
          }}
        >
          Setup Wizard
        </Button>
      </Box>
    </>
  );
};
