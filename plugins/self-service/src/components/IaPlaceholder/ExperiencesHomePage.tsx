import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Page, Header, HeaderTabs, Content } from '@backstage/core-components';
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

const EXPERIENCE_META: Record<
  Exclude<NavExperience, 'all'>,
  Omit<ExperienceCatalogRow, 'id' | 'label'>
> = {
  automate: {
    plugins: ['Scaffolder / self-service'],
    railItems: ['Templates', 'History', 'Catalog'],
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
    railItems: ['Inventories', 'Dashboard', 'Profiles', 'Scan history'],
    landing: '/self-service/inventories',
    summary: 'Scan and remediate host inventories.',
    metric: '3',
    metricLabel: 'open findings',
  },
  edge: {
    plugins: ['RHEM / Flight Control'],
    railItems: ['Fleets', 'Devices', 'Images', 'Repositories'],
    landing: '/self-service/edge-fleets',
    summary: 'Edge fleet lifecycle and device health.',
    metric: '2',
    metricLabel: 'fleets',
  },
  admin: {
    plugins: ['Portal admin', 'Integrations', 'RBAC'],
    railItems: ['Settings', 'Integrations', 'Access Control', 'Sync Status'],
    landing: '/self-service/admin/general',
    summary: 'Administration settings only — no Templates or History.',
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

/**
 * Option 2 — All / Home experience: cross-experience dashboard + catalog of
 * experiences and the plugins that contribute to each.
 */
export const ExperiencesHomePage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(0);
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const { setExperience } = useNavIaModel();
  const isAdmin = hasRole('admin');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setTab(params.get('tab') === 'catalog' ? 1 : 0);
  }, [location.search]);

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

  const openExperience = (id: NavExperience, landing: string) => {
    setExperience(id);
    writeNavExperience(id);
    navigate(landing);
  };

  const headerTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'catalog', label: 'Experiences catalog' },
  ];

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <span>All experiences</span>
            <Chip
              label="Option 2"
              size="small"
              color="primary"
              style={{ borderRadius: 16, fontSize: 11 }}
            />
          </Box>
        }
        pageTitleOverride="All experiences"
        subtitle="Home for the experience toggle — dashboard across modes and a catalog of experiences plus their plugins"
      />
      <HeaderTabs
        selectedIndex={tab}
        onChange={index => {
          setTab(index);
          navigate(
            index === 1
              ? '/self-service/experiences?tab=catalog'
              : '/self-service/experiences',
            { replace: true },
          );
        }}
        tabs={headerTabs}
      />
      <Content>
        {tab === 0 && (
          <>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ marginBottom: 16, maxWidth: 720, lineHeight: 1.6 }}
            >
              Cross-experience dashboard (demo metrics). Open an experience to
              switch the left rail into that mode.
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

        {tab === 1 && (
          <>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ marginBottom: 16, maxWidth: 720, lineHeight: 1.6 }}
            >
              Catalog of experiences available on this seat, the plugins that
              contribute to each, and their primary rail items.
            </Typography>
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
          </>
        )}
      </Content>
    </Page>
  );
};
