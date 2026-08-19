import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';
import { useUserProfile } from '@backstage/plugin-user-settings';
import {
  Avatar,
  Box,
  Button,
  Grid,
  Typography,
  makeStyles,
} from '@material-ui/core';
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined';

const useStyles = makeStyles(theme => ({
  intro: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    maxWidth: 640,
  },
  identity: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  avatar: {
    height: 48,
    width: 48,
  },
  avatarFallback: {
    fontSize: 48,
    color: theme.palette.text.secondary,
  },
  field: {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  fieldLabel: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  muted: {
    color: theme.palette.text.secondary,
  },
  settingsCta: {
    marginTop: theme.spacing(2),
    textTransform: 'none',
    borderRadius: 20,
    fontWeight: 500,
  },
}));

function Field({ label, value }: { label: string; value: string }) {
  const classes = useStyles();
  return (
    <Box className={classes.field}>
      <Typography className={classes.fieldLabel} component="dt">
        {label}
      </Typography>
      <Typography variant="body1" component="dd">
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Account → My profile. Identity page — not catalog kind chrome (USER + id)
 * and not User settings (prefs). Prototype does not fetch the catalog User
 * entity, which is missing locally and on Pages.
 */
export const PortalMyProfilePage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const identityApi = useApi(identityApiRef);
  const { displayName, profile, loading } = useUserProfile();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    identityApi
      .getBackstageIdentity()
      .then(identity => {
        if (cancelled) return;
        const ref = identity.userEntityRef || '';
        const name = ref.split('/').pop();
        setUserId(name || null);
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [identityApi]);

  const name = displayName || 'Guest';

  return (
    <Page themeId="tool">
      <Header title="My profile" pageTitleOverride="My profile" />
      <Content>
        <Typography className={classes.intro} variant="body1">
          Your identity in Automation Portal. Theme, notifications, and other
          preferences are in User settings.
        </Typography>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <InfoCard title="Details" variant="gridItem">
              <Box className={classes.identity}>
                {!loading &&
                  (profile?.picture ? (
                    <Avatar
                      src={profile.picture}
                      alt=""
                      className={classes.avatar}
                    />
                  ) : (
                    <AccountCircleOutlinedIcon className={classes.avatarFallback} />
                  ))}
                <Box>
                  <Typography variant="h6">{name}</Typography>
                  {profile?.email ? (
                    <Typography variant="body2" className={classes.muted}>
                      {profile.email}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
              {userId ? (
                <Box component="dl" m={0}>
                  <Field label="Username" value={userId} />
                </Box>
              ) : null}
              <Button
                className={classes.settingsCta}
                variant="outlined"
                color="primary"
                onClick={() => navigate('/settings')}
              >
                User settings
              </Button>
            </InfoCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoCard title="Teams" variant="gridItem">
              <Typography variant="body1">Guests</Typography>
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
