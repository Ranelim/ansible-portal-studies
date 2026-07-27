import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  makeStyles,
} from '@material-ui/core';
import {
  availableExperiences,
  EXPERIENCE_LABELS,
  useNavIaModel,
  writeNavExperience,
  type NavExperience,
} from '../../hooks/useNavIaModel';
import { useNavPlugins } from '../../hooks/useNavPlugins';
import { useUserRoleContext } from '../../hooks/useUserRole';

type BridgeView = 'dashboard' | 'catalog' | 'plugins';

/** User-facing experience blurbs — not IA documentation. */
const EXPERIENCE_BLURB: Record<Exclude<NavExperience, 'all'>, string> = {
  automate: 'Run job templates and track recent activity.',
  develop: 'Build and manage automation content — repos, collections, and EEs.',
  compliance: 'Scan inventories, review findings, and remediate hosts.',
  edge: 'Manage edge device fleets, updates, and desired state.',
  admin: 'Configure integrations, access, and platform sync.',
};

const EXPERIENCE_LANDING: Record<Exclude<NavExperience, 'all'>, string> = {
  automate: '/create',
  develop: '/self-service/experience-dashboard',
  compliance: '/self-service/experience-dashboard',
  edge: '/self-service/experience-dashboard',
  admin: '/self-service/admin/general',
};

/** Accent strips for Bridge tiles (theme-adjacent, not one-off product chrome). */
const EXPERIENCE_ACCENT: Record<Exclude<NavExperience, 'all'>, string> = {
  automate: '#0066CC',
  develop: '#3D1C7C',
  compliance: '#C46100',
  edge: '#147EBC',
  admin: '#6A6E73',
};

type InsightWidget = {
  id: string;
  experienceId: Exclude<NavExperience, 'all'>;
  title: string;
  value: string;
  detail: string;
  source: string;
  href: string;
};

const INSIGHT_WIDGETS: InsightWidget[] = [
  {
    id: 'automate-runs',
    experienceId: 'automate',
    title: 'Recent runs',
    value: '24',
    detail: '2 failed in the last 7 days',
    source: 'Automate',
    href: '/self-service/create/tasks',
  },
  {
    id: 'develop-quality',
    experienceId: 'develop',
    title: 'Content quality',
    value: '78',
    detail: '3 repositories need attention',
    source: 'Develop · APME',
    href: '/self-service/repositories/quality',
  },
  {
    id: 'compliance-findings',
    experienceId: 'compliance',
    title: 'Open findings',
    value: '3',
    detail: 'Critical across inventories',
    source: 'Compliance',
    href: '/self-service/inventories',
  },
  {
    id: 'edge-health',
    experienceId: 'edge',
    title: 'Fleet health',
    value: '1',
    detail: 'Degraded fleet · 4 devices offline',
    source: 'Edge',
    href: '/self-service/edge-fleets',
  },
];

type PluginRow = {
  name: string;
  feeds: string;
  experienceId: NavExperience;
  status: 'Enabled' | 'Seat-gated' | 'Always on';
  landing: string;
};

const useStyles = makeStyles(theme => ({
  intro: {
    marginBottom: theme.spacing(2.5),
    maxWidth: 720,
    lineHeight: 1.6,
    color: theme.palette.text.secondary,
  },
  widgetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  widget: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
    minHeight: 148,
    cursor: 'pointer',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
  },
  widgetValue: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.05,
  },
  tileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: theme.spacing(2.5),
  },
  tile: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 220,
    cursor: 'pointer',
    transition: 'transform 140ms ease, box-shadow 140ms ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    },
  },
  tileAccent: {
    height: 72,
    position: 'relative',
    backgroundImage:
      'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.12) 100%)',
  },
  tileBody: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    flex: 1,
  },
  tileTitle: {
    fontWeight: 700,
    fontSize: 18,
  },
}));

function viewFromLocation(pathname: string, search: string): BridgeView {
  if (pathname.endsWith('/plugins')) return 'plugins';
  if (pathname.endsWith('/catalog')) return 'catalog';
  const tab = new URLSearchParams(search).get('tab');
  if (tab === 'plugins') return 'plugins';
  if (tab === 'catalog') return 'catalog';
  return 'dashboard';
}

/**
 * Option 3 — All (Home) Bridge:
 * - Dashboard = cross-experience insight widgets (Portal layout + contributed widgets)
 * - Experiences = Bridge catalog tiles (enter a mode)
 * - Plugins = admin-only inventory (not an end-user surface)
 */
export const ExperiencesHomePage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const view = viewFromLocation(location.pathname, location.search);
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const { setExperience } = useNavIaModel();
  const isAdmin = hasRole('admin');

  const available = useMemo(
    () =>
      availableExperiences({
        role,
        isAdmin,
        compliance: plugins.compliance,
        rhem: plugins.rhem,
      }).filter(id => id !== 'all') as Exclude<NavExperience, 'all'>[],
    [role, isAdmin, plugins.compliance, plugins.rhem],
  );

  // Plugins is admin-only — bounce everyone else to Dashboard
  useEffect(() => {
    if (view === 'plugins' && !isAdmin) {
      navigate('/self-service/experiences', { replace: true });
    }
  }, [view, isAdmin, navigate]);

  const widgets = useMemo(
    () => INSIGHT_WIDGETS.filter(w => available.includes(w.experienceId)),
    [available],
  );

  const pluginRows: PluginRow[] = useMemo(() => {
    const list: PluginRow[] = [
      {
        name: 'Scaffolder / self-service',
        feeds: 'Automate',
        experienceId: 'automate',
        status: 'Always on',
        landing: '/create',
      },
      {
        name: 'Self-service content',
        feeds: 'Develop',
        experienceId: 'develop',
        status: available.includes('develop') ? 'Enabled' : 'Seat-gated',
        landing: '/self-service/repositories',
      },
      {
        name: 'APME',
        feeds: 'Develop (Quality tabs)',
        experienceId: 'develop',
        status:
          plugins.apme && available.includes('develop')
            ? 'Enabled'
            : 'Seat-gated',
        landing: '/self-service/repositories/quality',
      },
      {
        name: 'Compliance',
        feeds: 'Compliance experience',
        experienceId: 'compliance',
        status:
          plugins.compliance && available.includes('compliance')
            ? 'Enabled'
            : 'Seat-gated',
        landing: '/self-service/inventories',
      },
      {
        name: 'RHEM / Flight Control',
        feeds: 'Edge experience',
        experienceId: 'edge',
        status:
          plugins.rhem && available.includes('edge') ? 'Enabled' : 'Seat-gated',
        landing: '/self-service/edge-fleets',
      },
      {
        name: 'Portal admin',
        feeds: 'Administration',
        experienceId: 'admin',
        status: available.includes('admin') ? 'Enabled' : 'Seat-gated',
        landing: '/self-service/admin/general',
      },
    ];
    return list.filter(
      p => available.includes(p.experienceId as Exclude<NavExperience, 'all'>) || p.status === 'Always on',
    );
  }, [available, plugins.apme, plugins.compliance, plugins.rhem]);

  const openExperience = (id: Exclude<NavExperience, 'all'>) => {
    setExperience(id);
    writeNavExperience(id);
    navigate(EXPERIENCE_LANDING[id]);
  };

  const openWidget = (w: InsightWidget) => {
    setExperience(w.experienceId);
    writeNavExperience(w.experienceId);
    navigate(w.href);
  };

  const title =
    view === 'catalog'
      ? 'Experiences'
      : view === 'plugins'
        ? 'Plugins'
        : 'Dashboard';
  const subtitle =
    view === 'catalog'
      ? 'Choose an experience to work in — each mode focuses the left nav on that job.'
      : view === 'plugins'
        ? 'Installed plugins and which experience they feed. Admin inventory — not an end-user catalog.'
        : 'Insights across experiences on this seat. Portal owns the layout; teams contribute widgets.';

  return (
    <Page themeId="app">
      <Header title={title} pageTitleOverride={title} subtitle={subtitle} />
      <Content>
        {view === 'dashboard' && (
          <>
            <Typography variant="body2" className={classes.intro}>
              Cross-experience insights — not a second Experiences catalog.
              Widgets are contributed by experience teams into Portal-defined
              slots (density, empty states, and placement stay Portal-owned).
            </Typography>
            <Box className={classes.widgetGrid}>
              {widgets.map(w => (
                <Box
                  key={w.id}
                  className={classes.widget}
                  role="button"
                  tabIndex={0}
                  onClick={() => openWidget(w)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openWidget(w);
                    }
                  }}
                >
                  <Typography variant="caption" color="textSecondary">
                    {w.source}
                  </Typography>
                  <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
                    {w.title}
                  </Typography>
                  <Typography className={classes.widgetValue}>
                    {w.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {w.detail}
                  </Typography>
                </Box>
              ))}
            </Box>
            {widgets.length === 0 && (
              <Typography color="textSecondary">
                No experience insights on this seat yet.
              </Typography>
            )}
          </>
        )}

        {view === 'catalog' && (
          <>
            <Typography variant="body2" className={classes.intro}>
              Experiences are job modes (Automate, Develop, Compliance, Edge,
              Administration) — not plugins. A plugin (for example Compliance or
              RHEM) feeds an experience; this page is how you enter the mode.
            </Typography>
            <Box className={classes.tileGrid}>
              {available.map(id => (
                <Box
                  key={id}
                  className={classes.tile}
                  role="button"
                  tabIndex={0}
                  onClick={() => openExperience(id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openExperience(id);
                    }
                  }}
                >
                  <Box
                    className={classes.tileAccent}
                    style={{ backgroundColor: EXPERIENCE_ACCENT[id] }}
                  />
                  <Box className={classes.tileBody}>
                    <Typography className={classes.tileTitle}>
                      {EXPERIENCE_LABELS[id]}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {EXPERIENCE_BLURB[id]}
                    </Typography>
                    <Box mt="auto" pt={1}>
                      <Button
                        color="primary"
                        variant="contained"
                        size="small"
                        style={{ textTransform: 'none', borderRadius: 20 }}
                        onClick={e => {
                          e.stopPropagation();
                          openExperience(id);
                        }}
                      >
                        Open {EXPERIENCE_LABELS[id]}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}

        {view === 'plugins' && isAdmin && (
          <>
            <Typography variant="body2" className={classes.intro}>
              End users work in experiences and entities. This list is for
              platform admins — what is installed and which experience it feeds.
              Prefer Administration for enablement and Integrations.
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Plugin</TableCell>
                  <TableCell>Feeds experience</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {pluginRows.map(row => (
                  <TableRow key={`${row.name}-${row.experienceId}`} hover>
                    <TableCell>
                      <Typography variant="body2" style={{ fontWeight: 600 }}>
                        {row.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.feeds}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        variant="outlined"
                        style={{ borderRadius: 12, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        color="primary"
                        size="small"
                        style={{ textTransform: 'none', borderRadius: 20 }}
                        onClick={() =>
                          openExperience(
                            row.experienceId as Exclude<NavExperience, 'all'>,
                          )
                        }
                      >
                        Open experience
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Content>
    </Page>
  );
};
