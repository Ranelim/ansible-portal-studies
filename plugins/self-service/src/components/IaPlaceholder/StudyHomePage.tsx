import { useMemo, type ReactNode, type SyntheticEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import { Box, Tooltip, Typography, makeStyles } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { GIT_REPOSITORIES } from '../Projects/catalog/unifiedDemoData';
import {
  DEMO_COLLECTION_ENTITIES,
  DEMO_EE_ENTITIES,
} from '../common/catalogDemoData';
import { PORTAL_AUTOMATE_TEMPLATE_COUNT } from '../common/portalAutomateTemplates';
import { getProjectQuality } from '../Projects/detail/qualityDemoData';
import { QualityScoreMark } from '../Projects/catalog/HealthScorePopover';

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: theme.spacing(2),
    maxWidth: 960,
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    padding: theme.spacing(2.5, 2),
    paddingRight: theme.spacing(4.5),
    backgroundColor: theme.palette.background.paper,
    minHeight: 112,
    textDecoration: 'none',
    color: 'inherit',
    boxSizing: 'border-box',
  },
  cardLink: {
    transition: 'border-color 0.15s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  cardDisabled: {
    opacity: 0.72,
    cursor: 'default',
  },
  cardHelp: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
    color: theme.palette.text.disabled,
    cursor: 'help',
  },
  valueSlot: {
    minHeight: 40,
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: theme.spacing(0.75),
    fontVariantNumeric: 'tabular-nums',
  },
  value: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
  },
}));

type HomeKpi = {
  id: string;
  label: string;
  info: string;
  href?: string;
  renderValue: () => ReactNode;
};

function kpiInfo(id: HomeKpi['id']): string {
  switch (id) {
    case 'repos':
      return 'Git repositories connected to your Automation Portal seat.';
    case 'avg-health':
      return 'Mean of each repository’s latest scan (0–100). Rollup of findings on that scan.';
    case 'collections':
      return 'Ansible collections available from your connected content sources.';
    case 'ees':
      return 'Execution environment images you can use to run automation.';
    case 'templates':
      return 'Templates you can use to create content or run automation jobs.';
    default:
      return '';
  }
}

function computeAverageHealth(): number | null {
  let scannedWithScore = 0;
  let healthSum = 0;

  for (const repo of GIT_REPOSITORIES) {
    const quality = getProjectQuality(repo.name);
    if (!quality) continue;
    scannedWithScore += 1;
    healthSum += quality.healthScore;
  }

  return scannedWithScore > 0 ? Math.round(healthSum / scannedWithScore) : null;
}

const stopCardNavigation = (event: SyntheticEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const KpiInfoIcon = ({ label, info }: { label: string; info: string }) => {
  const classes = useStyles();

  return (
    <Tooltip title={info} arrow>
      <HelpOutlineIcon
        className={classes.cardHelp}
        tabIndex={0}
        aria-label={`About ${label}`}
        onClick={stopCardNavigation}
        onKeyDown={stopCardNavigation}
      />
    </Tooltip>
  );
};

/** APME usability study — resource counts with repo health snapshot. */
export const StudyHomePage = () => {
  const classes = useStyles();
  const avgHealth = useMemo(() => computeAverageHealth(), []);

  const kpis: HomeKpi[] = [
    {
      id: 'repos',
      label: 'Git repositories',
      info: kpiInfo('repos'),
      href: '/self-service/repositories/list',
      renderValue: () => (
        <Typography className={classes.value} component="span">
          {GIT_REPOSITORIES.length}
        </Typography>
      ),
    },
    {
      id: 'avg-health',
      label: 'Content avg. health',
      info: kpiInfo('avg-health'),
      href: '/self-service/repositories/dashboard',
      renderValue: () =>
        avgHealth !== null ? (
          <QualityScoreMark score={avgHealth} fontSize={32} denomSize={18} />
        ) : (
          <Typography className={classes.value} component="span">—</Typography>
        ),
    },
    {
      id: 'collections',
      label: 'Collections',
      info: kpiInfo('collections'),
      renderValue: () => (
        <Typography className={classes.value} component="span">
          {DEMO_COLLECTION_ENTITIES.length}
        </Typography>
      ),
    },
    {
      id: 'ees',
      label: 'Execution environments',
      info: kpiInfo('ees'),
      renderValue: () => (
        <Typography className={classes.value} component="span">
          {DEMO_EE_ENTITIES.length}
        </Typography>
      ),
    },
    {
      id: 'templates',
      label: 'Templates',
      info: kpiInfo('templates'),
      renderValue: () => (
        <Typography className={classes.value} component="span">
          {PORTAL_AUTOMATE_TEMPLATE_COUNT}
        </Typography>
      ),
    },
  ];

  return (
    <Page themeId="app">
      <Header
        title="Home"
        pageTitleOverride="Home"
        subtitle="A snapshot of automation content and platform resources in your seat."
      />
      <Content>
        <Box className={classes.grid}>
          {kpis.map(kpi => {
            const body = (
              <>
                <KpiInfoIcon label={kpi.label} info={kpi.info} />
                <Box className={classes.valueSlot}>{kpi.renderValue()}</Box>
                <Typography className={classes.label}>{kpi.label}</Typography>
              </>
            );

            if (kpi.href) {
              return (
                <RouterLink
                  key={kpi.id}
                  to={kpi.href}
                  className={`${classes.card} ${classes.cardLink}`}
                >
                  {body}
                </RouterLink>
              );
            }

            return (
              <Box
                key={kpi.id}
                className={`${classes.card} ${classes.cardDisabled}`}
                aria-disabled="true"
              >
                {body}
              </Box>
            );
          })}
        </Box>
      </Content>
    </Page>
  );
};
