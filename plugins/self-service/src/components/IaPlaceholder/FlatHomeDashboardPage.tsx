import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Chip,
  Link,
  Typography,
  makeStyles,
} from '@material-ui/core';
import {
  availableExperiences,
  EXPERIENCE_LABELS,
  type NavExperience,
} from '../../hooks/useNavIaModel';
import { useNavPlugins } from '../../hooks/useNavPlugins';
import { useUserRoleContext } from '../../hooks/useUserRole';
import { NAV_IA_REVIEW_MODS } from './navIaReviewMods';

type Kpi = {
  id: string;
  value: string;
  label: string;
  hint: string;
  href?: string;
};

type ExperienceSnippet = {
  id: NavExperience;
  label: string;
  summary: string;
  metric: string;
  metricLabel: string;
  href: string;
  highlights: string[];
};

const SNIPPETS: Record<
  Exclude<NavExperience, 'all'>,
  Omit<ExperienceSnippet, 'id' | 'label'>
> = {
  automate: {
    summary: 'Run templates and track recent job activity.',
    metric: '24',
    metricLabel: 'runs (7d)',
    href: '/create?scope=experience',
    highlights: ['12 succeeded', '2 failed', '1 running'],
  },
  develop: {
    summary: 'Git repositories, collections, execution environments, and content quality.',
    metric: '12',
    metricLabel: 'repos',
    href: '/self-service/repositories/list',
    highlights: ['3 need attention', 'Quality avg 78'],
  },
  compliance: {
    summary: 'Inventory compliance posture and open findings.',
    metric: '86%',
    metricLabel: 'compliant',
    href: '/self-service/inventories',
    highlights: ['3 critical', '11 medium'],
  },
  edge: {
    summary: 'Fleet health and devices awaiting update.',
    metric: '2',
    metricLabel: 'fleets',
    href: '/self-service/edge-fleets',
    highlights: ['148 devices', '4 degraded'],
  },
  admin: {
    summary: 'Integrations, sync health, and access control.',
    metric: '4',
    metricLabel: 'integrations',
    href: '/self-service/admin/overview',
    highlights: ['Sync OK', '1 warning'],
  },
  assistant: {
    summary: 'Ask questions and take actions across experiences.',
    metric: '—',
    metricLabel: 'chat',
    href: '/self-service/assistant',
    highlights: ['Cross-experience help'],
  },
};

const useStyles = makeStyles(theme => ({
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  sectionHint: {
    marginBottom: theme.spacing(2),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(4),
  },
  kpi: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    minHeight: 96,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    textDecoration: 'none',
    color: 'inherit',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  experienceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(4),
  },
  snippet: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minHeight: 168,
  },
  metric: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: 'auto',
  },
  metricsList: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
  },
  metricsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
}));

/**
 * Option 1 / 4 — Home as a portal dashboard: KPIs, experience snippets,
 * and generic platform metrics (not a blank placeholder).
 */
export const FlatHomeDashboardPage = () => {
  const classes = useStyles();
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const isAdmin = hasRole('admin');

  const available = useMemo(
    () =>
      availableExperiences({
        role,
        isAdmin,
        compliance: plugins.compliance,
        rhem: plugins.rhem,
      }).filter(id => id !== 'all'),
    [role, isAdmin, plugins.compliance, plugins.rhem],
  );

  const snippets: ExperienceSnippet[] = useMemo(
    () =>
      available.map(id => ({
        id,
        label: EXPERIENCE_LABELS[id],
        ...SNIPPETS[id as Exclude<NavExperience, 'all'>],
      })),
    [available],
  );

  const kpis: Kpi[] = useMemo(() => {
    const items: Kpi[] = [
      {
        id: 'success',
        value: '92%',
        label: 'Job success (7d)',
        hint: 'Across templates you can run',
        href: '/self-service/create/tasks',
      },
      {
        id: 'runs',
        value: '24',
        label: 'Runs (7d)',
        hint: 'Completed and failed jobs',
        href: '/self-service/create/tasks',
      },
      {
        id: 'templates',
        value: '18',
        label: 'Templates',
        hint: 'Available to this seat',
        href: '/create?scope=experience',
      },
    ];
    if (
      available.includes('develop')
    ) {
      items.push({
        id: 'quality',
        value: '78',
        label: 'Avg quality score',
        hint: 'Across scanned repositories',
        href: '/self-service/repositories',
      });
    }
    if (available.includes('compliance')) {
      items.push({
        id: 'findings',
        value: '14',
        label: 'Open findings',
        hint: 'Across inventories',
        href: '/self-service/inventories',
      });
    }
    if (available.includes('edge')) {
      items.push({
        id: 'devices',
        value: '148',
        label: 'Managed devices',
        hint: 'Across edge fleets',
        href: '/self-service/edge-fleets',
      });
    }
    return items;
  }, [available]);

  const platformMetrics = useMemo(() => {
    const rows = [
      { label: 'Active users (30d)', value: '42' },
      { label: 'Avg job duration', value: '4m 12s' },
      { label: 'Catalog resources', value: '86' },
      { label: 'Failed syncs (24h)', value: available.includes('admin') ? '1' : '0' },
    ];
    if (
      available.includes('develop')
    ) {
      rows.push({ label: 'EEs in use', value: '6' });
    }
    if (available.includes('compliance')) {
      rows.push({ label: 'Last compliance scan', value: '2h ago' });
    }
    if (available.includes('edge')) {
      rows.push({ label: 'Devices pending update', value: '9' });
    }
    return rows;
  }, [available]);

  return (
    <Page themeId="app">
      <Header
        title="Home"
        pageTitleOverride="Home"
        subtitle="Dashboard — KPIs, experience snapshots, and platform metrics for this seat"
      />
      <Content>
        <Typography variant="subtitle1" className={classes.sectionTitle}>
          Key metrics
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          className={classes.sectionHint}
        >
          Generic portal KPIs for the current seat. Values are prototype sample data.
        </Typography>
        <Box className={classes.kpiGrid}>
          {kpis.map(kpi => {
            const body = (
              <>
                <Typography className={classes.kpiValue}>{kpi.value}</Typography>
                <Typography variant="body2" style={{ fontWeight: 600 }}>
                  {kpi.label}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {kpi.hint}
                </Typography>
              </>
            );
            return kpi.href ? (
              <Link
                key={kpi.id}
                component={RouterLink}
                to={kpi.href}
                className={classes.kpi}
                underline="none"
              >
                {body}
              </Link>
            ) : (
              <Box key={kpi.id} className={classes.kpi}>
                {body}
              </Box>
            );
          })}
        </Box>

        <Typography variant="subtitle1" className={classes.sectionTitle}>
          {NAV_IA_REVIEW_MODS ? 'Shortcuts' : 'Experiences'}
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          className={classes.sectionHint}
        >
          {NAV_IA_REVIEW_MODS
            ? 'Snippets into areas this seat can reach. These are phonebook shortcuts — not Option 3’s Experience toggle.'
            : 'Snippets into areas this seat can reach. In the flat model these are shortcuts into the phonebook — not a separate experience toggle.'}
        </Typography>
        <Box className={classes.experienceGrid}>
          {snippets.map(snippet => (
            <Box key={snippet.id} className={classes.snippet}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                style={{ gap: 8 }}
              >
                <Typography variant="subtitle2" style={{ fontWeight: 700 }}>
                  {snippet.label}
                </Typography>
                <Box textAlign="right">
                  <Typography className={classes.metric}>{snippet.metric}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {snippet.metricLabel}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {snippet.summary}
              </Typography>
              <Box className={classes.chipRow}>
                {snippet.highlights.map(h => (
                  <Chip
                    key={h}
                    size="small"
                    label={h}
                    variant="outlined"
                    style={{ borderRadius: 12, fontSize: 11 }}
                  />
                ))}
              </Box>
              <Link
                component={RouterLink}
                to={snippet.href}
                color="primary"
                style={{ fontWeight: 600, marginTop: 4 }}
              >
                Open {snippet.label}
              </Link>
            </Box>
          ))}
        </Box>

        <Typography variant="subtitle1" className={classes.sectionTitle}>
          Platform metrics
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          className={classes.sectionHint}
        >
          Broader Automation Portal health — not tied to a single entity page.
        </Typography>
        <Box className={classes.metricsList}>
          {platformMetrics.map(row => (
            <Box key={row.label} className={classes.metricsRow}>
              <Typography variant="body2">{row.label}</Typography>
              <Typography variant="body2" style={{ fontWeight: 700 }}>
                {row.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Content>
    </Page>
  );
};
