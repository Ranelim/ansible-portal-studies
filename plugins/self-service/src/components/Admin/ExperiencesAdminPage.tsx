import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Chip,
  Switch,
  Tab,
  Tabs,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { AttentionDot } from '../common/AttentionDot';
import { statusColors } from '../common/statusColors';
import {
  useBridgeExperienceVisibility,
  type BridgeExperienceId,
} from '../../hooks/bridgeExperienceVisibility';
import { useExperienceReadiness, isExperienceReady } from '../../hooks/experienceSetup';
import { useAttentionClearOnActive } from '../../hooks/attentionSeen';
import { SHOW_ADMIN_PLUGINS } from './adminPluginsTrial';
import { ExperienceThumbnail } from '../IaPlaceholder/experienceVisuals';
import type { JobExperienceId } from '../../hooks/experienceRecent';
import { SHOW_ORCHESTRATOR_EXPERIENCE } from '../IaPlaceholder/orchestratorExperience';

const useStyles = makeStyles(theme => ({
  pageTabs: {
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  tabLabel: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    lineHeight: 1,
  },
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
  empty: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    padding: theme.spacing(3, 1),
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

type ExperienceFilterTab = 'all' | 'ready' | 'discover';

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
    needsSetup: true,
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Scan inventories, review findings, and remediate hosts.',
    pluginsFilter: 'Compliance',
    seatsSummary: 'Operator, Admin',
    pluginsSummary: 'Compliance',
    needsSetup: true,
  },
  {
    id: 'edge',
    label: 'Edge',
    description: 'Manage edge device fleets, updates, and desired state.',
    pluginsFilter: 'Edge',
    seatsSummary: 'Operator, Admin',
    pluginsSummary: 'RHEM (when installed)',
    needsSetup: true,
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

const VISIBLE_ADMIN_EXPERIENCES = ADMIN_EXPERIENCES.filter(
  exp => SHOW_ORCHESTRATOR_EXPERIENCE || exp.id !== 'orchestrator',
);

const tabFromSearch = (search: string): ExperienceFilterTab => {
  const raw = new URLSearchParams(search).get('tab');
  if (raw === 'ready' || raw === 'discover') return raw;
  return 'all';
};

const isAwaitingSetup = (exp: AdminExperience) =>
  Boolean(exp.needsSetup) && !isExperienceReady(exp.id);

/**
 * Administration → Experiences
 * Govern Bridge job worlds. Plugins = capability install; Access Control = RBAC SoT.
 */
export const ExperiencesAdminPage = () => {
  const classes = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { visibility, setVisible } = useBridgeExperienceVisibility();
  const { version } = useExperienceReadiness();
  const tabFromUrl = tabFromSearch(location.search);
  const [tab, setTab] = useState<ExperienceFilterTab>(tabFromUrl);
  const discoverCount = VISIBLE_ADMIN_EXPERIENCES.filter(exp => isAwaitingSetup(exp))
    .length;
  const { seen: discoverSeen, exiting: discoverExiting } =
    useAttentionClearOnActive(
      'experiences-discover',
      tab === 'discover' && discoverCount > 0,
    );

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const visible = useMemo(
    () =>
      VISIBLE_ADMIN_EXPERIENCES.filter(exp => {
        const awaiting = isAwaitingSetup(exp);
        if (tab === 'discover') return awaiting;
        if (tab === 'ready') return !awaiting;
        return true;
      }),
    [tab, version],
  );

  const setFilterTab = (next: ExperienceFilterTab) => {
    setTab(next);
    navigate(
      next === 'all'
        ? '/self-service/admin/experiences'
        : `/self-service/admin/experiences?tab=${next}`,
      { replace: true },
    );
  };

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Experiences
            <PageHelpIcon
              tooltipLabel="What is Experiences admin?"
              title="Manage Experiences"
              description="Control which job-mode experiences appear on the Bridge for this Portal instance. Ready experiences can be shown or hidden. Discover lists installed experiences that still need setup before they appear for users. Who can enter each experience is defined in Access Control."
            />
          </Box>
        }
        pageTitleOverride="Experiences"
        subtitle="Show or hide ready experiences on the Bridge. Set up anything under Discover before it appears for users."
      />
      <Content>
        <Tabs
          className={classes.pageTabs}
          value={tab}
          onChange={(_e, v) => setFilterTab(v)}
          indicatorColor="primary"
          textColor="primary"
          aria-label="Experience filters"
        >
          <Tab label="All" value="all" />
          <Tab label="Ready" value="ready" />
          <Tab
            label={
              discoverCount > 0 && !discoverSeen ? (
                <span className={classes.tabLabel}>
                  <span>Discover</span>
                  <AttentionDot
                    label="Experiences need setup"
                    exiting={discoverExiting}
                  />
                </span>
              ) : (
                'Discover'
              )
            }
            value="discover"
          />
        </Tabs>

        {visible.length === 0 ? (
          <Typography className={classes.empty}>
            {tab === 'discover'
              ? 'No experiences to set up. Installed experiences that still need setup appear here.'
              : 'No experiences in this view.'}
          </Typography>
        ) : (
          <Box className={classes.list}>
            {visible.map(exp => {
              const awaitingSetup = isAwaitingSetup(exp);
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
                          <Chip
                            size="small"
                            label="Needs setup"
                            style={{
                              height: 22,
                              fontSize: 11,
                              backgroundColor: 'rgba(0,102,204,0.15)',
                              color: statusColors.info,
                            }}
                          />
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
                            { state: { from: 'admin' } },
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
                        {SHOW_ADMIN_PLUGINS && (
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
                        )}
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
        )}
      </Content>
    </Page>
  );
};
