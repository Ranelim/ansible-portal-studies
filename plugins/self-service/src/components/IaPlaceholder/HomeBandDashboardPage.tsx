import { Link as RouterLink } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Link,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { useNavPlugins } from '../../hooks/useNavPlugins';
import { useUserRoleContext } from '../../hooks/useUserRole';

type Kpi = { value: string; label: string };
type JumpLink = { label: string; href: string };
type PluginCard = { id: string; title: string; subtitle: string };

const useStyles = makeStyles(theme => ({
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(3),
  },
  sectionHint: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: theme.spacing(2),
  },
  kpi: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    minHeight: 88,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  jumpRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  pluginCard: {
    width: '100%',
    minHeight: 120,
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: 4,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    boxSizing: 'border-box' as const,
  },
  pluginTitle: {
    fontWeight: 600,
  },
  pluginSubtitle: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  emptySlot: {
    marginTop: theme.spacing(2),
    minHeight: 64,
    borderRadius: 4,
    backgroundColor: theme.palette.action.hover,
  },
}));

/**
 * Option 3 — Home Dashboard (shown when Develop / Operate / Administration is on).
 * KPIs + jump links + full-width plugin contribution slots (empty placeholders).
 */
export const HomeBandDashboardPage = () => {
  const classes = useStyles();
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const isAdmin = hasRole('admin');
  const showDevelop = role === 'developer' || isAdmin;
  const canSeeOps = role === 'operator' || isAdmin;
  const showInventories = canSeeOps && plugins.compliance;
  const showEdgeFleets = canSeeOps && plugins.rhem;

  const kpis: Kpi[] = [
    { value: '24', label: 'Runs (7d)' },
    { value: '3', label: 'Failed runs' },
    ...(showDevelop
      ? [
          { value: '12', label: 'Git repositories' },
          { value: '78', label: 'Avg quality' },
        ]
      : []),
    ...(showInventories
      ? [
          { value: '86%', label: 'Compliant' },
          { value: '3', label: 'Critical findings' },
        ]
      : []),
    ...(showEdgeFleets
      ? [
          { value: '2', label: 'Edge fleets' },
          { value: '4', label: 'Degraded devices' },
        ]
      : []),
  ];

  const jumps: JumpLink[] = [
    { label: 'Templates', href: '/create' },
    { label: 'Activity', href: '/self-service/create/tasks' },
    ...(showDevelop
      ? [{ label: 'Git Repositories', href: '/self-service/repositories' }]
      : []),
    ...(showInventories
      ? [{ label: 'Inventories', href: '/self-service/inventories' }]
      : []),
    ...(showEdgeFleets
      ? [{ label: 'Edge fleets', href: '/self-service/edge-fleets' }]
      : []),
    ...(isAdmin
      ? [{ label: 'Integrations', href: '/self-service/admin/integrations' }]
      : []),
  ];

  const pluginCards: PluginCard[] = [
    ...(showDevelop
      ? [
          {
            id: 'apme',
            title: 'Quality (APME)',
            subtitle: 'Plugin contribution slot — full width',
          },
        ]
      : []),
    ...(showInventories
      ? [
          {
            id: 'compliance',
            title: 'Compliance',
            subtitle: 'Plugin contribution slot — full width',
          },
        ]
      : []),
    ...(showEdgeFleets
      ? [
          {
            id: 'rhem',
            title: 'Edge (RHEM)',
            subtitle: 'Plugin contribution slot — full width',
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: 'admin',
            title: 'Administration',
            subtitle: 'Plugin contribution slot — full width',
          },
        ]
      : []),
  ];

  return (
    <Page themeId="app">
      <Header
        title="Dashboard"
        pageTitleOverride="Dashboard"
        subtitle="Cross-section KPIs, jump links, and plugin insight cards"
      />
      <Content>
        <Typography variant="subtitle1" className={classes.sectionTitle}>
          KPIs
        </Typography>
        <Typography variant="body2" className={classes.sectionHint}>
          Prototype metrics for the sections this seat can reach.
        </Typography>
        <Box className={classes.kpiGrid}>
          {kpis.map(kpi => (
            <Box key={kpi.label} className={classes.kpi}>
              <Typography className={classes.kpiValue}>{kpi.value}</Typography>
              <Typography variant="body2" color="textSecondary">
                {kpi.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="subtitle1" className={classes.sectionTitle}>
          Jump links
        </Typography>
        <Typography variant="body2" className={classes.sectionHint}>
          Quick paths into primary surfaces for this seat.
        </Typography>
        <Box className={classes.jumpRow}>
          {jumps.map(jump => (
            <Link
              key={jump.href + jump.label}
              component={RouterLink}
              to={jump.href}
            >
              {jump.label}
            </Link>
          ))}
        </Box>

        <Typography variant="subtitle1" className={classes.sectionTitle}>
          Plugin cards
        </Typography>
        <Typography variant="body2" className={classes.sectionHint}>
          Full-width contribution slots — empty placeholders for now.
        </Typography>
        {pluginCards.map(card => (
          <Box key={card.id} className={classes.pluginCard}>
            <Typography className={classes.pluginTitle}>{card.title}</Typography>
            <Typography variant="body2" className={classes.pluginSubtitle}>
              {card.subtitle}
            </Typography>
            <Box className={classes.emptySlot} />
          </Box>
        ))}
        {pluginCards.length === 0 && (
          <Typography variant="body2" color="textSecondary">
            No non-default sections enabled for this seat.
          </Typography>
        )}
      </Content>
    </Page>
  );
};
