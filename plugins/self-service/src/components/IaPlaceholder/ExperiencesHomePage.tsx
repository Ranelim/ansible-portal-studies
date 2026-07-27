import { useMemo } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Chip,
  Link,
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

type ExperienceCatalogRow = {
  id: NavExperience;
  label: string;
  plugins: string[];
  railItems: string[];
  landing: string;
  summary: string;
  metric: string;
  metricLabel: string;
};

type PluginCatalogRow = {
  name: string;
  experienceId: NavExperience;
  experienceLabel: string;
  contributes: string;
  status: 'Enabled' | 'Seat-gated' | 'Always on';
  landing: string;
};

type BridgeView = 'dashboard' | 'catalog' | 'plugins';

const EXPERIENCE_META: Record<
  Exclude<NavExperience, 'all'>,
  Omit<ExperienceCatalogRow, 'id' | 'label'>
> = {
  automate: {
    plugins: ['Scaffolder / self-service'],
    railItems: ['Templates', 'Activity', 'Catalog'],
    landing: '/create',
    summary: 'Run job templates and track activity (SME home).',
    metric: '24',
    metricLabel: 'runs (7d)',
  },
  develop: {
    plugins: ['Self-service content', 'APME (Quality tabs)'],
    railItems: ['Git Repositories', 'Collections', 'Execution Environments'],
    landing: '/self-service/repositories',
    summary: 'Create and manage automation content.',
    metric: '12',
    metricLabel: 'repos',
  },
  compliance: {
    plugins: ['Compliance'],
    railItems: ['Inventories'],
    landing: '/self-service/inventories',
    summary: 'Scan and remediate host inventories.',
    metric: '3',
    metricLabel: 'open findings',
  },
  edge: {
    plugins: ['RHEM / Flight Control'],
    railItems: ['Edge fleets'],
    landing: '/self-service/edge-fleets',
    summary: 'Edge fleet lifecycle and device health.',
    metric: '2',
    metricLabel: 'fleets',
  },
  admin: {
    plugins: ['Portal admin', 'Integrations', 'RBAC'],
    railItems: ['Settings', 'Integrations', 'Access Control', 'Sync Status'],
    landing: '/self-service/admin/general',
    summary: 'Administration settings only — no Templates or Activity.',
    metric: '4',
    metricLabel: 'integrations',
  },
};

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  card: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minHeight: 140,
  },
  metric: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  },
}));

function viewFromLocation(pathname: string, search: string): BridgeView {
  if (pathname.endsWith('/plugins')) return 'plugins';
  if (pathname.endsWith('/catalog')) return 'catalog';
  // Legacy query tabs from earlier prototype builds
  const tab = new URLSearchParams(search).get('tab');
  if (tab === 'plugins') return 'plugins';
  if (tab === 'catalog') return 'catalog';
  return 'dashboard';
}

const VIEW_META: Record<
  BridgeView,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: 'Dashboard',
    subtitle:
      'Bridge-style home — overview of experiences on this seat. Open a mode to work; no Templates or Activity here.',
  },
  catalog: {
    title: 'Experiences',
    subtitle:
      'Experiences available on this seat — what they contain and which plugins feed them.',
  },
  plugins: {
    title: 'Plugins',
    subtitle:
      'Installed / seat-visible plugins and which experience they open into.',
  },
};

/**
 * Option 3 — All (Home): Bridge-style hub. View is chosen from the left rail
 * (Dashboard / Experiences / Plugins) — not page tabs.
 */
export const ExperiencesHomePage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const view = viewFromLocation(location.pathname, location.search);
  const meta = VIEW_META[view];
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
      }).filter(id => id !== 'all'),
    [role, isAdmin, plugins.compliance, plugins.rhem],
  );

  const rows: ExperienceCatalogRow[] = useMemo(
    () =>
      available.map(id => ({
        id,
        label: EXPERIENCE_LABELS[id],
        ...EXPERIENCE_META[id as Exclude<NavExperience, 'all'>],
      })),
    [available],
  );

  const pluginRows: PluginCatalogRow[] = useMemo(() => {
    const list: PluginCatalogRow[] = [
      {
        name: 'Scaffolder / self-service',
        experienceId: 'automate',
        experienceLabel: EXPERIENCE_LABELS.automate,
        contributes: 'Templates, Activity, Catalog',
        status: 'Always on',
        landing: '/create',
      },
      {
        name: 'Self-service content',
        experienceId: 'develop',
        experienceLabel: EXPERIENCE_LABELS.develop,
        contributes: 'Git Repositories, Collections, EEs',
        status: available.includes('develop') ? 'Enabled' : 'Seat-gated',
        landing: '/self-service/repositories',
      },
      {
        name: 'APME',
        experienceId: 'develop',
        experienceLabel: EXPERIENCE_LABELS.develop,
        contributes: 'Quality tabs on Git Repositories (0 rail items)',
        status: plugins.apme && available.includes('develop') ? 'Enabled' : 'Seat-gated',
        landing: '/self-service/repositories/quality',
      },
      {
        name: 'Compliance',
        experienceId: 'compliance',
        experienceLabel: EXPERIENCE_LABELS.compliance,
        contributes: 'Inventories and compliance surfaces',
        status: plugins.compliance && available.includes('compliance')
          ? 'Enabled'
          : 'Seat-gated',
        landing: '/self-service/inventories',
      },
      {
        name: 'RHEM / Flight Control',
        experienceId: 'edge',
        experienceLabel: EXPERIENCE_LABELS.edge,
        contributes: 'Edge fleets / devices (object labels)',
        status: plugins.rhem && available.includes('edge') ? 'Enabled' : 'Seat-gated',
        landing: '/self-service/edge-fleets',
      },
      {
        name: 'Portal admin',
        experienceId: 'admin',
        experienceLabel: EXPERIENCE_LABELS.admin,
        contributes: 'Settings, Integrations, RBAC, Sync',
        status: available.includes('admin') ? 'Enabled' : 'Seat-gated',
        landing: '/self-service/admin/general',
      },
    ];
    return list.filter(p => available.includes(p.experienceId) || p.status === 'Always on');
  }, [available, plugins.apme, plugins.compliance, plugins.rhem]);

  const openExperience = (id: NavExperience, landing: string) => {
    setExperience(id);
    writeNavExperience(id);
    navigate(landing);
  };

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <span>{meta.title}</span>
            <Chip
              label="Option 3"
              size="small"
              color="primary"
              style={{ borderRadius: 16, fontSize: 11 }}
            />
          </Box>
        }
        pageTitleOverride={meta.title}
        subtitle={meta.subtitle}
      />
      <Content>
        {view === 'dashboard' && (
          <>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ marginBottom: 16, maxWidth: 720, lineHeight: 1.6 }}
            >
              Cross-experience overview (demo metrics). Opening an experience
              switches the left rail into that mode — like launching from a hub.
            </Typography>
            <Box className={classes.grid}>
              {rows.map(row => (
                <Box key={row.id} className={classes.card}>
                  <Typography variant="subtitle2" style={{ fontWeight: 700 }}>
                    {row.label}
                  </Typography>
                  <Typography className={classes.metric}>{row.metric}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {row.metricLabel}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {row.summary}
                  </Typography>
                  <Box className={classes.chipRow}>
                    {row.plugins.map(p => (
                      <Chip
                        key={p}
                        size="small"
                        label={p}
                        variant="outlined"
                        style={{ borderRadius: 12, fontSize: 11 }}
                      />
                    ))}
                  </Box>
                  <Box mt="auto" pt={1}>
                    <Button
                      color="primary"
                      size="small"
                      style={{ textTransform: 'none', borderRadius: 20 }}
                      onClick={() => openExperience(row.id, row.landing)}
                    >
                      Open {row.label}
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}

        {view === 'catalog' && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Experience</TableCell>
                <TableCell>Plugins</TableCell>
                <TableCell>Rail items</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" style={{ fontWeight: 600 }}>
                      {row.label}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {row.summary}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box className={classes.chipRow}>
                      {row.plugins.map(p => (
                        <Chip
                          key={p}
                          size="small"
                          label={p}
                          variant="outlined"
                          style={{ borderRadius: 12, fontSize: 11 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {row.railItems.join(' · ')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Link
                      component={RouterLink}
                      to={row.landing}
                      color="primary"
                      onClick={e => {
                        e.preventDefault();
                        openExperience(row.id, row.landing);
                      }}
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {view === 'plugins' && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plugin</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Contributes</TableCell>
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
                  <TableCell>{row.experienceLabel}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {row.contributes}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.status}
                      variant="outlined"
                      style={{ borderRadius: 12, fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Link
                      component={RouterLink}
                      to={row.landing}
                      color="primary"
                      onClick={e => {
                        e.preventDefault();
                        openExperience(row.experienceId, row.landing);
                      }}
                    >
                      Open in {row.experienceLabel}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Content>
    </Page>
  );
};
