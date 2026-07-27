import { useNavigate } from 'react-router-dom';
import { Page, Header, Content, InfoCard } from '@backstage/core-components';
import {
  Typography,
  Box,
  Button,
  makeStyles,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@material-ui/core';
import {
  EXPERIENCE_LABELS,
  useNavIaModel,
  writeNavExperience,
  type NavExperience,
} from '../../hooks/useNavIaModel';
import { useUserRoleContext } from '../../hooks/useUserRole';

const useStyles = makeStyles(theme => ({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    maxWidth: 720,
  },
  muted: {
    color: theme.palette.text.secondary,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
}));

const COPY: Partial<
  Record<NavExperience, { purpose: string; examples: string[] }>
> = {
  all: {
    purpose:
      'Preferences for the Bridge home — default landing, which experiences appear, plugin visibility cues.',
    examples: [
      'Default experience after sign-in',
      'Show / hide plugin chips on Dashboard',
    ],
  },
  automate: {
    purpose:
      'Run-focused preferences for Templates and Activity in this experience.',
    examples: ['Default template filters', 'Activity list density'],
  },
  develop: {
    purpose:
      'Content-developer preferences for Git Repositories, Collections, and Execution Environments.',
    examples: [
      'Default repo list columns',
      'Quality scan notifications',
      'Preferred scaffold template',
    ],
  },
  compliance: {
    purpose:
      'Compliance operator preferences for Inventories and related scan workflows.',
    examples: [
      'Default compliance profile',
      'Finding severity thresholds',
      'Remediation template defaults',
    ],
  },
  edge: {
    purpose:
      'Edge / fleet preferences for Edge fleets and related rollouts.',
    examples: ['Default fleet health view', 'Update window notifications'],
  },
};

const ADMIN_ESCAPES: Partial<
  Record<NavExperience, { label: string; to: string }[]>
> = {
  all: [
    { label: 'Integrations', to: '/self-service/admin/integrations' },
    { label: 'Access Control', to: 'rbac' },
  ],
  automate: [
    { label: 'Integrations', to: '/self-service/admin/integrations' },
  ],
  develop: [
    { label: 'Integrations', to: '/self-service/admin/integrations' },
    { label: 'Content sources / Sync', to: '/self-service/admin/sync-activity' },
  ],
  compliance: [
    {
      label: 'Connect compliance source',
      to: '/self-service/admin/integrations',
    },
  ],
  edge: [
    {
      label: 'Connect Edge Manager',
      to: '/self-service/admin/integrations',
    },
  ],
};

/**
 * Option 3 — trailing Settings for a domain experience.
 * Prefs only. Platform Integrations / RBAC / Sync: deep-link into Administration
 * (do not embed Admin chrome here).
 */
export const ExperienceSettingsPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { experience, setExperience } = useNavIaModel();
  const { hasRole } = useUserRoleContext();
  const isAdmin = hasRole('admin');

  // Administration experience uses AdminItems, not this page
  const scoped: NavExperience =
    experience === 'admin' ? 'all' : experience;

  const label = EXPERIENCE_LABELS[scoped] ?? scoped;
  const copy = COPY[scoped] ?? {
    purpose: `Preferences scoped to the ${label} experience.`,
    examples: ['Display and notification defaults for this experience'],
  };
  const escapes = ADMIN_ESCAPES[scoped] ?? [
    { label: 'Integrations', to: '/self-service/admin/integrations' },
  ];

  const openAdministration = (to: string) => {
    writeNavExperience('admin');
    setExperience('admin');
    navigate(to);
  };

  return (
    <Page themeId="tool">
      <Header title={`${label} settings`} subtitle="Experience preferences" />
      <Content>
        <Box className={classes.body}>
          <InfoCard title="Preferences for this experience">
            <Typography paragraph>{copy.purpose}</Typography>
            <Typography className={classes.muted} paragraph>
              Trailing Settings on the experience rail — same idea as
              entity-page Settings. Prototype only; controls are not wired.
            </Typography>
            <List dense disablePadding>
              {copy.examples.map(item => (
                <ListItem key={item} disableGutters>
                  <ListItemText
                    primary={item}
                    secondary="Prototype placeholder"
                  />
                </ListItem>
              ))}
            </List>
          </InfoCard>

          <InfoCard title="Platform configuration">
            <Typography paragraph>
              Integrations, credentials, Access Control, and Sync are{' '}
              <strong>not</strong> configured here. They live in the
              Administration experience so each domain stays focused.
            </Typography>
            {isAdmin ? (
              <>
                <Typography className={classes.muted} paragraph>
                  Open Administration for platform setup related to this
                  experience:
                </Typography>
                <Box className={classes.actions}>
                  {escapes.map(item => (
                    <Button
                      key={item.to}
                      variant="outlined"
                      color="primary"
                      onClick={() => openAdministration(item.to)}
                      style={{ borderRadius: 20 }}
                    >
                      {item.label}
                    </Button>
                  ))}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() =>
                      openAdministration('/self-service/admin/general')
                    }
                    style={{ borderRadius: 20 }}
                  >
                    Open Administration
                  </Button>
                </Box>
              </>
            ) : (
              <Typography className={classes.muted}>
                Ask a platform admin to connect sources and manage access in
                Administration. You can still change your own experience
                preferences above.
              </Typography>
            )}
            <Divider style={{ marginTop: 16, marginBottom: 12 }} />
            <Typography variant="body2" className={classes.muted}>
              Rule: experience Settings = prefs. Administration = platform
              config. Navigate out — do not embed Admin inside Develop /
              Compliance / Edge.
            </Typography>
          </InfoCard>
        </Box>
      </Content>
    </Page>
  );
};
