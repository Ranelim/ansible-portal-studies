import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Switch,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { PageHelpIcon } from '../common/PageHelpIcon';

const useStyles = makeStyles(theme => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
  },
  description: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginTop: 4,
    maxWidth: 480,
  },
  meta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  visibility: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  visibilityLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  btn: {
    textTransform: 'none',
    borderRadius: 20,
    fontWeight: 500,
  },
}));

type AdminExperience = {
  id: string;
  label: string;
  description: string;
  /** Plugins catalog filter value */
  pluginsFilter: string;
  seatsSummary: string;
  pluginsSummary: string;
  defaultVisible: boolean;
};

/** Job-mode experiences only — Administration is platform chrome, not a Bridge card. */
const ADMIN_EXPERIENCES: AdminExperience[] = [
  {
    id: 'automate',
    label: 'Automate',
    description: 'Run job templates and track activity. Always an experience — A/B only changes Templates/Runs chrome.',
    pluginsFilter: 'Cross-cutting',
    seatsSummary: 'All seats',
    pluginsSummary: 'Self-service (run surfaces)',
    defaultVisible: true,
  },
  {
    id: 'develop-tabs',
    label: 'Develop (tabs)',
    description:
      'APME review A — Git Repositories pin; Quality + Remediations host tabs.',
    pluginsFilter: 'Develop',
    seatsSummary: 'Developer, Admin',
    pluginsSummary: 'Self-service, APME Quality Scanning',
    defaultVisible: true,
  },
  {
    id: 'develop-drawer',
    label: 'Develop (drawer)',
    description:
      'APME review B — Git Repositories expandable item; Repositories · Quality · Remediations indented.',
    pluginsFilter: 'Develop',
    seatsSummary: 'Developer, Admin',
    pluginsSummary: 'Self-service, APME Quality Scanning',
    defaultVisible: true,
  },
  {
    id: 'develop-apme',
    label: 'Develop (quality)',
    description:
      'APME review C — Git Repositories pin + Content quality as its own rail item. Overview · Scans. Exploration only.',
    pluginsFilter: 'Develop',
    seatsSummary: 'Developer, Admin',
    pluginsSummary: 'Self-service, APME Quality Scanning',
    defaultVisible: true,
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Scan inventories, review findings, and remediate hosts.',
    pluginsFilter: 'Compliance',
    seatsSummary: 'Operator, Admin',
    pluginsSummary: 'Compliance',
    defaultVisible: true,
  },
  {
    id: 'edge',
    label: 'Edge',
    description: 'Manage edge device fleets, updates, and desired state.',
    pluginsFilter: 'Edge',
    seatsSummary: 'Operator, Admin',
    pluginsSummary: 'RHEM (when installed)',
    defaultVisible: true,
  },
];

/**
 * Administration → Experiences
 * Govern Bridge job worlds. Plugins = capability install; Access Control = RBAC SoT.
 */
export const ExperiencesAdminPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ADMIN_EXPERIENCES.map(e => [e.id, e.defaultVisible])),
  );

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Experiences
            <PageHelpIcon
              tooltipLabel="What is Experiences admin?"
              title="Manage Experiences"
              description="Control which job-mode experiences appear on the Bridge for this Portal instance. Install or remove capabilities under Plugins. Who can enter each experience is defined in Access Control — use Manage access to jump there. This page is not a second plugin catalog."
            />
          </Box>
        }
        pageTitleOverride="Experiences"
        subtitle="Show or hide Bridge experiences. Plugins and Access Control stay the systems of record for install and RBAC."
      />
      <Content>
        <Box className={classes.list}>
          {ADMIN_EXPERIENCES.map(exp => (
            <Box key={exp.id} className={classes.row}>
              <Box style={{ flex: '1 1 240px', minWidth: 0 }}>
                <Typography className={classes.title}>{exp.label}</Typography>
                <Typography className={classes.description}>
                  {exp.description}
                </Typography>
                <Typography className={classes.meta}>
                  Seats (summary): {exp.seatsSummary}
                  {' · '}
                  Plugins: {exp.pluginsSummary}
                </Typography>
              </Box>
              <Box className={classes.actions}>
                <Box className={classes.visibility}>
                  <Typography className={classes.visibilityLabel} component="span">
                    On Bridge
                  </Typography>
                  <Switch
                    color="primary"
                    checked={visible[exp.id] ?? false}
                    onChange={(_, checked) =>
                      setVisible(prev => ({ ...prev, [exp.id]: checked }))
                    }
                    inputProps={{
                      'aria-label': `Show ${exp.label} on Experiences Bridge`,
                    }}
                  />
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  className={classes.btn}
                  onClick={() =>
                    navigate(
                      `/self-service/admin/plugins?experience=${encodeURIComponent(
                        exp.pluginsFilter,
                      )}`,
                    )
                  }
                >
                  Manage plugins
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  className={classes.btn}
                  onClick={() => navigate('/rbac')}
                >
                  Manage access
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Content>
    </Page>
  );
};
