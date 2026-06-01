import { useEffect, useRef } from 'react';
import { SignInPage } from '@backstage/core-components';
import { SignInPageProps } from '@backstage/core-plugin-api';
import { Box, Typography, Button, makeStyles, CircularProgress } from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';

type CustomSignInPageProps = SignInPageProps & {
  providers: any[];
};

const isStaticDeployment =
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

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
}));

export const CustomSignInPage = (props: CustomSignInPageProps) => {
  const classes = useStyles();
  const { providers, ...signInProps } = props;
  const signedIn = useRef(false);

  useEffect(() => {
    if (isStaticDeployment && !signedIn.current) {
      signedIn.current = true;
      props.onSignInSuccess({
        getIdToken: async () => ({ token: '' }),
        getId: async () => 'user:development/guest',
        getProfile: async () => ({
          email: 'guest@portal.local',
          displayName: 'Guest User',
        }),
        getCredentials: async () => ({ token: '' }),
        signOut: async () => {},
      } as any);
    }
  }, [props]);

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
