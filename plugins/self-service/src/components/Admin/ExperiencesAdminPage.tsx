import { useNavigate } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Chip,
  Switch,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { PageHelpIcon } from '../common/PageHelpIcon';
import {
  useBridgeExperienceVisibility,
  type BridgeExperienceId,
} from '../../hooks/bridgeExperienceVisibility';
import { useExperienceSetup } from '../../hooks/experienceSetup';
import { ExperienceThumbnail } from '../IaPlaceholder/experienceVisuals';
import type { JobExperienceId } from '../../hooks/experienceRecent';

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
  identity: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    flex: '1 1 240px',
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
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
  id: JobExperienceId;
  label: string;
  description: string;
  pluginsFilter: string;
  seatsSummary: string;
  pluginsSummary: string;
  needsSetup?: boolean;
};

const ADMIN_EXPERIENCES: AdminExperience[] = [
  {
    id: 'automate',
    label: 'Automate',
    description:
      'Run job templates and track activity. Always an experience — A/B only changes Templates/Runs chrome.',
    pluginsFilter: 'Cross-cutting',
    seatsSummary: 'All seats',
    pluginsSummary: 'Self-service (run surfaces)',
  },
  {
    id: 'develop',
    label: 'Develop',
    description:
      'Git repositories, collections, and execution environments. Quality (overview, remediations, scans) lives on Git Repositories.',
    pluginsFilter: 'Develop',
    seatsSummary: 'Developer, Admin',
    pluginsSummary: 'Self-service, APME Quality Scanning',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Scan inventories, review findings, and remediate hosts.',
    pluginsFilter: 'Compliance',
    seatsSummary: 'Operator, Admin',
    pluginsSummary: 'Compliance',
  },
  {
    id: 'edge',
    label: 'Edge',
    description: 'Manage edge device fleets, updates, and desired state.',
    pluginsFilter: 'Edge',
    seatsSummary: 'Operator, Admin',
    pluginsSummary: 'RHEM (when installed)',
  },
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    description:
      'Certified Automation Orchestrator workflows and extra node types. Complete setup before this experience appears for users.',
    pluginsFilter: 'Orchestrator',
    seatsSummary: 'Developer, Admin',
    pluginsSummary: 'Automation Orchestrator',
    needsSetup: true,
  },
];

/**
 * Administration → Experiences
 * Govern Bridge job worlds. Plugins = capability install; Access Control = RBAC SoT.
 */
export const ExperiencesAdminPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { visibility, setVisible } = useBridgeExperienceVisibility();
  const { setup: orchestratorSetup } = useExperienceSetup('orchestrator');

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Experiences
            <PageHelpIcon
              tooltipLabel="What is Experiences admin?"
              title="Manage Experiences"
              description="Control which job-mode experiences appear on the Bridge for this Portal instance. Experiences that still need setup stay off the switcher until you enable them. Who can enter each experience is defined in Access Control."
            />
          </Box>
        }
        pageTitleOverride="Experiences"
        subtitle="Show or hide experiences on the Bridge and in the experience switcher. Set up installed experiences before they appear for users."
      />
      <Content>
        <Box className={classes.list}>
          {ADMIN_EXPERIENCES.map(exp => {
            const awaitingSetup = Boolean(exp.needsSetup) && !orchestratorSetup;
            return (
              <Box key={exp.id} className={classes.row}>
                <Box className={classes.identity}>
                  <ExperienceThumbnail id={exp.id} />
                  <Box style={{ minWidth: 0 }}>
                    <Box className={classes.titleRow}>
                      <Typography className={classes.title}>
                        {exp.label}
                      </Typography>
                      {awaitingSetup && (
                        <Chip size="small" label="Needs setup" />
                      )}
                    </Box>
                    <Typography className={classes.description}>
                      {exp.description}
                    </Typography>
                    <Typography className={classes.meta}>
                      Seats (summary): {exp.seatsSummary}
                      {' · '}
                      Plugins: {exp.pluginsSummary}
                    </Typography>
                  </Box>
                </Box>
                <Box className={classes.actions}>
                  {awaitingSetup ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      className={classes.btn}
                      onClick={() =>
                        navigate(
                          `/self-service/admin/experiences/${exp.id}/setup`,
                        )
                      }
                    >
                      Set up
                    </Button>
                  ) : (
                    <>
                      <Box className={classes.visibility}>
                        <Typography
                          className={classes.visibilityLabel}
                          component="span"
                        >
                          On Bridge
                        </Typography>
                        <Switch
                          color="primary"
                          checked={visibility[exp.id as BridgeExperienceId]}
                          onChange={(_, checked) =>
                            setVisible(exp.id as BridgeExperienceId, checked)
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
                    </>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Content>
    </Page>
  );
};
