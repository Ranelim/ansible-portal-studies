import { SignInPage } from '@backstage/core-components';
import { SignInPageProps } from '@backstage/core-plugin-api';
import { Box, Typography, Button, makeStyles } from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';

type CustomSignInPageProps = SignInPageProps & {
  providers: any[];
};

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
