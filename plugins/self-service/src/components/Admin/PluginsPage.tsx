import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Header, Content, Link } from '@backstage/core-components';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import {
  Box,
  Button,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  MenuItem as MuiMenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import CloseIcon from '@material-ui/icons/Close';
import SearchIcon from '@material-ui/icons/Search';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { PluginCard, PluginCardGrid } from './rhdhExtensions/PluginCard';
import { BadgeChip } from './rhdhExtensions/Badges';
import { PluginIcon } from './rhdhExtensions/PluginIcon';
import {
  ExtensionsPlugin,
  ExtensionsPluginInstallStatus,
} from './rhdhExtensions/types';
import {
  PORTAL_CATALOG,
  PortalCatalogEntry,
} from './rhdhExtensions/portalCatalog';

const EXPERIENCES = [
  'all',
  'Develop',
  'Compliance',
  'Edge',
  'Administration',
  'Cross-cutting',
] as const;

const HOSTS = [
  'all',
  'Git Repositories',
  'Inventories',
  'Edge fleets',
  'Templates',
  'Masthead',
  'Administration',
] as const;

const useStyles = makeStyles(theme => ({
  pageTabs: {
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  banner: { marginBottom: theme.spacing(2) },
  filterLabel: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    '&:first-of-type': { marginTop: 0 },
  },
  filterPaper: {
    padding: theme.spacing(0, 1),
    marginBottom: theme.spacing(0.5),
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
  },
  search: { minWidth: 220, maxWidth: 320, flex: '1 1 220px' },
  // RHDH ExtensionsPluginDrawer: PaperProps sx minWidth 300, width 55vw
  drawerPaper: {
    minWidth: 300,
    width: '55vw',
    maxWidth: '100%',
  },
  drawerInner: {
    padding: theme.spacing(3),
  },
  drawerClose: {
    position: 'absolute',
    right: 16,
    top: 16,
    color: theme.palette.grey[500],
  },
}));

/**
 * Administration → Plugins
 * Catalog chrome = vendored RHDH Extensions PluginCard / BadgeTriange / PluginIcon.
 * Portal-only: Experience + Host filters + Surfaces in the drawer.
 */
export const PluginsPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'catalog' | 'installed'>('catalog');
  const [experience, setExperience] = useState<string>('all');
  const [host, setHost] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<
    Record<string, ExtensionsPluginInstallStatus>
  >({});

  const catalog = useMemo(() => {
    return PORTAL_CATALOG.map(entry => {
      const status =
        overrides[entry.plugin.metadata.name] ??
        entry.plugin.spec?.installStatus;
      return {
        ...entry,
        plugin: {
          ...entry.plugin,
          spec: { ...entry.plugin.spec, installStatus: status },
        },
      };
    });
  }, [overrides]);

  const installedCount = catalog.filter(
    e =>
      e.plugin.spec?.installStatus ===
        ExtensionsPluginInstallStatus.Installed ||
      e.plugin.spec?.installStatus ===
        ExtensionsPluginInstallStatus.UpdateAvailable,
  ).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter(entry => {
      const installed =
        entry.plugin.spec?.installStatus ===
          ExtensionsPluginInstallStatus.Installed ||
        entry.plugin.spec?.installStatus ===
          ExtensionsPluginInstallStatus.UpdateAvailable;
      if (tab === 'installed' && !installed) return false;
      if (
        experience !== 'all' &&
        !entry.extras.experiences.includes(experience)
      ) {
        return false;
      }
      if (host !== 'all' && !entry.extras.hosts.includes(host)) return false;
      if (!q) return true;
      const title = entry.plugin.metadata.title ?? entry.plugin.metadata.name;
      return (
        title.toLowerCase().includes(q) ||
        (entry.plugin.metadata.description ?? '').toLowerCase().includes(q) ||
        entry.extras.surfacePath.toLowerCase().includes(q)
      );
    });
  }, [catalog, tab, experience, host, query]);

  const selected: PortalCatalogEntry | undefined = catalog.find(
    e => e.plugin.metadata.name === selectedName,
  );

  const openPlugin = (plugin: ExtensionsPlugin) => {
    setSelectedName(plugin.metadata.name);
  };

  const toggleInstall = (entry: PortalCatalogEntry) => {
    const name = entry.plugin.metadata.name;
    const current =
      overrides[name] ?? entry.plugin.spec?.installStatus;
    const next =
      current === ExtensionsPluginInstallStatus.Installed
        ? ExtensionsPluginInstallStatus.Disabled
        : ExtensionsPluginInstallStatus.Installed;
    setOverrides(prev => ({ ...prev, [name]: next }));
  };

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Plugins
            <PageHelpIcon
              tooltipLabel="What are Plugins?"
              title="Plugins"
              description="Catalog cards use the RHDH Extensions PluginCard components (BadgeTriange, PluginIcon, CategoryLinkButton). Experience and Host are Portal filters; Surfaces in the drawer explain where UI lands."
            />
          </Box>
        }
        pageTitleOverride="Plugins"
        subtitle="Browse and enable Portal capabilities. Connections stay under Integrations."
      />
      <Content>
        <Tabs
          className={classes.pageTabs}
          value={tab}
          onChange={(_e, v) => setTab(v)}
          indicatorColor="primary"
          textColor="primary"
          aria-label="Plugins catalog"
        >
          <Tab label="Catalog" value="catalog" />
          <Tab label={`Installed (${installedCount})`} value="installed" />
        </Tabs>

        <Alert severity="info" className={classes.banner}>
          Cards are the RHDH Extensions PluginCard (vendored). Prototype
          enablement is simulated.{' '}
          <Link to="/docs">View documentation</Link>
        </Alert>

        <CatalogFilterLayout>
          <CatalogFilterLayout.Filters>
            <Typography className={classes.filterLabel}>Experience</Typography>
            <Paper className={classes.filterPaper}>
              <FormControl fullWidth>
                <Select
                  value={experience}
                  onChange={e => setExperience(e.target.value as string)}
                  input={<Input disableUnderline />}
                  inputProps={{ 'aria-label': 'Filter by experience' }}
                >
                  {EXPERIENCES.map(opt => (
                    <MuiMenuItem key={opt} value={opt}>
                      {opt === 'all' ? 'All' : opt}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>

            <Typography className={classes.filterLabel}>Host</Typography>
            <Paper className={classes.filterPaper}>
              <FormControl fullWidth>
                <Select
                  value={host}
                  onChange={e => setHost(e.target.value as string)}
                  input={<Input disableUnderline />}
                  inputProps={{ 'aria-label': 'Filter by host' }}
                >
                  {HOSTS.map(opt => (
                    <MuiMenuItem key={opt} value={opt}>
                      {opt === 'all' ? 'All' : opt}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </CatalogFilterLayout.Filters>

          <CatalogFilterLayout.Content>
            <Box className={classes.toolbar}>
              <Typography variant="h6" style={{ fontWeight: 500 }}>
                Plugins ({filtered.length})
              </Typography>
              <TextField
                className={classes.search}
                size="small"
                variant="outlined"
                placeholder="Search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ 'aria-label': 'Search plugins' }}
              />
            </Box>

            <PluginCardGrid>
              {filtered.map(entry => (
                <PluginCard
                  key={entry.plugin.metadata.name}
                  plugin={entry.plugin}
                  onOpen={openPlugin}
                  onCategoryClick={cat => setExperience(cat)}
                />
              ))}
            </PluginCardGrid>

            {filtered.length === 0 && (
              <Box py={6} textAlign="center">
                <Typography color="textSecondary">
                  No plugins match these filters.
                </Typography>
              </Box>
            )}
          </CatalogFilterLayout.Content>
        </CatalogFilterLayout>

        <Drawer
          anchor="right"
          open={Boolean(selected)}
          onClose={() => setSelectedName(null)}
          PaperProps={{ className: classes.drawerPaper }}
        >
          {selected && (
            <Box className={classes.drawerInner}>
              <IconButton
                aria-label="close"
                className={classes.drawerClose}
                onClick={() => setSelectedName(null)}
              >
                <CloseIcon />
              </IconButton>

              {/* Header row matches ExtensionsPluginContent */}
              <Box display="flex" alignItems="center" style={{ gap: 16 }} mb={4}>
                <PluginIcon plugin={selected.plugin} size={80} />
                <Box>
                  <Typography variant="h5" style={{ fontWeight: 500 }}>
                    {selected.plugin.metadata.title ??
                      selected.plugin.metadata.name}
                  </Typography>
                  <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                    <Typography variant="subtitle2" style={{ fontWeight: 400 }}>
                      by{' '}
                      <Link to="/self-service/admin/plugins">Red Hat</Link>
                    </Typography>
                    <BadgeChip plugin={selected.plugin} />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography
                    variant="subtitle1"
                    style={{ fontWeight: 500, marginBottom: 8 }}
                  >
                    Highlights
                  </Typography>
                  <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
                    {(selected.plugin.spec?.highlights ?? []).map(h => (
                      <li key={h} style={{ marginBottom: 8 }}>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <Typography
                    variant="subtitle1"
                    style={{ fontWeight: 500, marginBottom: 4 }}
                  >
                    Experience
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selected.extras.experiences.join(', ')}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    style={{ fontWeight: 500, marginBottom: 4 }}
                  >
                    Host
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selected.extras.hosts.join(', ')}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    disableElevation
                    style={{ textTransform: 'none', marginTop: 8 }}
                    onClick={() => toggleInstall(selected)}
                  >
                    {selected.plugin.spec?.installStatus ===
                    ExtensionsPluginInstallStatus.Installed
                      ? 'Disable'
                      : 'Enable'}
                  </Button>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Typography
                    variant="subtitle1"
                    style={{ fontWeight: 'bold', marginBottom: 8 }}
                  >
                    About
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {selected.extras.about}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    style={{ fontWeight: 'bold', marginBottom: 8 }}
                  >
                    Where it appears
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selected.extras.surfacePath}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Does not:
                  </Typography>
                  <ul style={{ paddingLeft: 20 }}>
                    {selected.extras.doesNot.map(d => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  <Box mt={2} display="flex" flexDirection="column" style={{ gap: 8 }}>
                    {selected.extras.openSurfaceHref && (
                      <Link
                        to={selected.extras.openSurfaceHref}
                        onClick={() => setSelectedName(null)}
                      >
                        {selected.extras.openSurfaceLabel ?? 'Open surface'}
                      </Link>
                    )}
                    {selected.extras.configHref && (
                      <Button
                        color="primary"
                        style={{ textTransform: 'none', alignSelf: 'flex-start' }}
                        onClick={() => {
                          navigate(selected.extras.configHref!);
                          setSelectedName(null);
                        }}
                      >
                        {selected.extras.configLabel ?? 'Configure'}
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Drawer>
      </Content>
    </Page>
  );
};
