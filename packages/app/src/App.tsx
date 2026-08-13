import React from 'react';
import { Navigate, Route, useNavigate } from 'react-router-dom';
import { useUserRole, useUserRoleContext, UserRoleContext } from '@ansible/plugin-backstage-self-service';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { WorkflowApprovalBanner } from './components/scaffolder/CustomTemplateWizardPage';
import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { orgPlugin } from '@backstage/plugin-org';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import {
  SettingsLayout,
  UserSettingsPage,
} from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { SearchPage as BackstageSearchPage } from '@backstage/plugin-search';
import { SearchPage } from './components/search/SearchPage';
import { Root } from './components/Root';
import { GlobalHeader } from './components/GlobalHeader';
// import { ExperienceReturnCompareBar } from './components/IaPrototype'; // kept — remount when comparing A again
import { PortalNotificationsPage } from './components/Notifications/PortalNotificationsPage';
import { PortalNotificationSettings } from './components/Notifications/PortalNotificationSettings';
import { LightspeedProvider, LightspeedPanel } from './components/Lightspeed';
import { QuickstartProvider, QuickstartPanel, WelcomeModal } from './components/Quickstart';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

import { CustomSignInPage } from './components/SignIn/CustomSignInPage';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { providers } from './identityProviders';
import { DelayingComponentFieldExtension } from './components/scaffolder/customScaffolderExtensions';
import { CustomTemplateCard } from './components/scaffolder/CustomTemplateCard';
import {
  AAPTokenFieldExtension,
  AAPResourcePickerExtension,
  BaseImagePickerFieldExtension,
  CollectionsPickerFieldExtension,
  EEFileNamePickerFieldExtension,
  FileUploadPickerFieldExtension,
  PackagesPickerFieldExtension,
  MCPServersPickerFieldExtension,
  AdditionalBuildStepsPickerFieldExtension,
  SelfServicePage,
  ScmSelectorFieldExtension,
} from '@ansible/plugin-backstage-self-service';
import { RbacPage } from '@backstage-community/plugin-rbac';
import { TechDocsWrapper } from './components/docs/TechDocsWrapper';
// @backstage/core-components used elsewhere
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
  Tooltip,
  Button,
  makeStyles,
} from '@material-ui/core';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import MoreVertIcon from '@material-ui/icons/MoreVert';

const isStaticDeployment =
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

const DEMO_TEMPLATES = [
  { name: 'create-playbook-project', title: 'Ansible Playbook Project', type: 'project', owner: 'platform-engineering', description: 'Scaffold a general-purpose Ansible playbook project with a standard directory structure, role scaffolding, inventory layout, and CI linting pipeline.', tags: ['ansible', 'playbook', 'project', 'starter'] },
  { name: 'create-cloud-provisioning-project', title: 'Cloud Provisioning Project', type: 'project', owner: 'platform-engineering', description: 'Scaffold an automation project pre-configured for cloud infrastructure provisioning. Includes the relevant cloud collections, credential structure, and dynamic inventory plugins.', tags: ['ansible', 'cloud', 'aws', 'azure', 'gcp'] },
  { name: 'create-network-automation-project', title: 'Network Automation Project', type: 'project', owner: 'network-operations', description: 'Scaffold an automation project for network device configuration and compliance management. Pre-configured with collections for Cisco, Juniper, or Arista platforms.', tags: ['ansible', 'network', 'cisco', 'juniper'] },
  { name: 'aws-provisioning-workflow', title: 'AWS Provisioning Workflow', type: 'service', owner: 'cloud-operations', description: 'Run a multi-step workflow that provisions AWS infrastructure, configures servers, and validates the deployment. Includes an approval step before production changes.', tags: ['aws', 'provisioning', 'cloud-ops'], requiresApproval: true },
  { name: 'deploy-database-update', title: 'Deploy Database Update', type: 'service', owner: 'platform-engineering', description: 'Run a single automation job to apply database schema updates and data migrations to the target environment. Validates the migration plan before executing changes.', tags: ['database', 'deployment', 'migration'] },
  { name: 'rhel-server-patching', title: 'RHEL Server Patching', type: 'service', owner: 'platform-engineering', description: 'Run a job to apply the latest security and OS patches to target RHEL servers. Select the environment, patch window, and reboot policy.', tags: ['rhel', 'patching', 'security', 'operations'] },
  { name: 'workflow-trigger-demo', title: 'Workflow Trigger Demo', type: 'service', owner: 'platform-engineering', description: 'Demo workflow that provisions infrastructure across multiple steps with an approval gate before production changes are applied.', tags: ['demo', 'aws', 'provisioning'], requiresApproval: true },
];

const useStaticTemplateStyles = makeStyles(theme => ({
  root: { padding: theme.spacing(3, 3, 3, 3), backgroundColor: theme.palette.background.paper, minHeight: '100%' },
  pageTitle: { fontSize: 28, fontWeight: 700, marginBottom: theme.spacing(0.5) },
  pageSubtitle: { fontSize: 14, color: theme.palette.text.secondary, marginBottom: theme.spacing(3) },
  topRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: theme.spacing(2) },
  registerBtn: { textTransform: 'none' as const, borderRadius: 20, fontWeight: 500 },
  layout: { display: 'flex', gap: theme.spacing(3) },
  sidebar: { minWidth: 200, flexShrink: 0 },
  searchInput: { width: '100%', padding: theme.spacing(1, 1.5), fontSize: 13, border: `1px solid ${theme.palette.divider}`, borderRadius: 4, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, marginBottom: theme.spacing(2), outline: 'none', '&::placeholder': { color: theme.palette.text.hint } },
  sidebarSection: { marginBottom: theme.spacing(2.5) },
  sidebarLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, color: theme.palette.text.secondary, marginBottom: theme.spacing(0.75) },
  sidebarItem: { padding: theme.spacing(0.75, 1.5), borderRadius: 4, fontSize: 13, cursor: 'default', display: 'flex', justifyContent: 'space-between' },
  sidebarItemActive: { backgroundColor: theme.palette.action.selected, fontWeight: 600 },
  filterLabel: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, color: theme.palette.text.secondary, marginBottom: theme.spacing(0.5) },
  filterSelect: { width: '100%', padding: theme.spacing(0.75, 1.5), fontSize: 13, border: `1px solid ${theme.palette.divider}`, borderRadius: 4, backgroundColor: theme.palette.background.paper, color: theme.palette.text.secondary, marginBottom: theme.spacing(2), appearance: 'none' as const, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23999\' d=\'M3 5l3 3 3-3z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' },
  card: { display: 'flex', flexDirection: 'column' as const, height: '100%', transition: 'box-shadow 0.2s ease', '&:hover': { boxShadow: theme.shadows[4] } },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: theme.spacing(2, 2, 0) },
  typeBadge: { fontSize: 11, fontWeight: 600, height: 22, textTransform: 'capitalize' as const },
  headerActions: { display: 'flex', alignItems: 'center', gap: 2, marginLeft: theme.spacing(1), flexShrink: 0 },
  smallIconBtn: { padding: 4 },
  content: { flex: 1, padding: theme.spacing(1.5, 2, 1) },
  title: { fontSize: 16, fontWeight: 600, lineHeight: 1.3, marginBottom: theme.spacing(0.5), cursor: 'pointer', '&:hover': { color: theme.palette.primary.main, textDecoration: 'underline' } },
  description: { fontSize: 13, color: theme.palette.text.secondary, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
  tags: { display: 'flex', flexWrap: 'wrap' as const, gap: theme.spacing(0.5), padding: theme.spacing(0, 2, 1) },
  tag: { fontSize: 11, height: 20 },
  ownerRow: { display: 'flex', alignItems: 'center', gap: theme.spacing(0.75), padding: theme.spacing(0, 2, 1), fontSize: 12, color: theme.palette.text.secondary },
  actions: { padding: theme.spacing(0, 2, 2), justifyContent: 'flex-start' },
  useButton: { textTransform: 'none' as const, fontWeight: 600, borderRadius: 20, paddingLeft: theme.spacing(2.5), paddingRight: theme.spacing(2.5) },
}));

const StaticScaffolderFallback = () => {
  const classes = useStaticTemplateStyles();
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = React.useState('');

  const categories = React.useMemo(() => {
    const types = new Set(DEMO_TEMPLATES.map(t => t.type));
    return Array.from(types).sort();
  }, []);

  const filteredTemplates = categoryFilter
    ? DEMO_TEMPLATES.filter(t => t.type === categoryFilter)
    : DEMO_TEMPLATES;

  return (
    <Box className={classes.root}>
      <Typography className={classes.pageTitle}>Templates</Typography>
      <Typography className={classes.pageSubtitle}>Create new projects and automation content from curated templates</Typography>
      <Box className={classes.topRow}>
        <Button variant="outlined" className={classes.registerBtn}>Register Existing Component</Button>
      </Box>
      <Box className={classes.layout}>
        <Box className={classes.sidebar}>
          <input className={classes.searchInput} placeholder="🔍 Search" readOnly />
          <Box className={classes.sidebarSection}>
            <Typography className={classes.sidebarLabel}>Personal</Typography>
            <Box className={classes.sidebarItem}>
              <span>☆ Starred</span><span>0</span>
            </Box>
          </Box>
          <Box className={classes.sidebarSection}>
            <Typography className={classes.sidebarLabel}>Automation Portal</Typography>
            <Box className={`${classes.sidebarItem} ${classes.sidebarItemActive}`}>
              <span>All</span><span>{filteredTemplates.length}</span>
            </Box>
          </Box>
          <Typography className={classes.filterLabel}>Categories</Typography>
          <select className={classes.filterSelect} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          <Typography className={classes.filterLabel}>Tags</Typography>
          <select className={classes.filterSelect}><option value="">All</option></select>
          <Typography className={classes.filterLabel}>Owner</Typography>
          <select className={classes.filterSelect}><option value="">All</option></select>
        </Box>
        <Box flex={1}>
          <Grid container spacing={2}>
            {filteredTemplates.map(t => (
              <Grid item xs={12} sm={6} key={t.name}>
                <Card className={classes.card} variant="outlined">
                  <Box className={classes.cardHeader}>
                    <Chip label={t.type.charAt(0).toUpperCase() + t.type.slice(1)} size="small" variant="outlined" className={classes.typeBadge} />
                    <Box className={classes.headerActions}>
                      <IconButton className={classes.smallIconBtn} size="small"><StarBorderIcon fontSize="small" /></IconButton>
                      <IconButton className={classes.smallIconBtn} size="small"><MoreVertIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <CardContent className={classes.content}>
                    <Typography className={classes.title} onClick={() => navigate(`/self-service/catalog/default/${t.name}`)}>{t.title}</Typography>
                    <Typography className={classes.description}>{t.description}</Typography>
                  </CardContent>
                  <Box className={classes.tags}>
                    {t.requiresApproval && (
                      <Tooltip title="This template includes a step that waits for someone to review and approve before it continues.">
                        <Chip label="requires-approval" size="small" variant="outlined" className={classes.tag} style={{ borderColor: '#f9a825', color: '#f9a825' }} />
                      </Tooltip>
                    )}
                    {t.tags.slice(0, t.requiresApproval ? 4 : 5).map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" className={classes.tag} />
                    ))}
                  </Box>
                  <Box className={classes.ownerRow}>
                    <span>by</span>
                    <Typography variant="body2" style={{ fontSize: 12, fontWeight: 500 }}>{t.owner}</Typography>
                  </Box>
                  <CardActions className={classes.actions}>
                    <Button variant="outlined" color="primary" size="small" className={classes.useButton} onClick={() => navigate(`/self-service/create/templates/default/${t.name}`)}>Use template</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

const app = createApp({
  apis,
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
  components: {
    SignInPage: props => (
      <CustomSignInPage
        {...props}
        providers={['guest', ...providers]}
      />
    ),
  },
  themes: getThemes(),
});

const RoleLandingRedirect = () => {
  const { role, loading } = useUserRoleContext();
  if (loading) return null;
  // Experiences shell: SME → Automate; multi-experience → Bridge catalog
  const target = role === 'sme' ? '/create' : '/self-service/experiences';
  return <Navigate to={target} replace />;
};

const routes = (
  <FlatRoutes>
    <Route path="/" element={<RoleLandingRedirect />} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsWrapper />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route
      path="/create"
      element={
        isStaticDeployment ? (
          <StaticScaffolderFallback />
        ) : (
          <>
            <WorkflowApprovalBanner />
            <ScaffolderPage
              headerOptions={{
                title: 'Templates',
                subtitle:
                  'Create new projects and automation content from curated templates',
              }}
              components={{
                TemplateCardComponent: CustomTemplateCard,
              }}
              contextMenu={{
                editor: false,
                actions: false,
              }}
            />
          </>
        )
      }
    >
      {!isStaticDeployment && (
        <ScaffolderFieldExtensions>
          <DelayingComponentFieldExtension />
          <AAPTokenFieldExtension />
          <AAPResourcePickerExtension />
          <BaseImagePickerFieldExtension />
          <CollectionsPickerFieldExtension />
          <EEFileNamePickerFieldExtension />
          <FileUploadPickerFieldExtension />
          <PackagesPickerFieldExtension />
          <MCPServersPickerFieldExtension />
          <AdditionalBuildStepsPickerFieldExtension />
          <ScmSelectorFieldExtension />
        </ScaffolderFieldExtensions>
      )}
    </Route>
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    {/* Backstage SearchPage binds routeRef{id=search} required by SidebarSearchModal */}
    <Route path="/search" element={<BackstageSearchPage />}>
      <SearchPage />
    </Route>
    <Route path="/rbac" element={<RbacPage />} />
    <Route path="/settings" element={<UserSettingsPage />}>
      <SettingsLayout.Route path="/notifications" title="Notifications">
        <PortalNotificationSettings />
      </SettingsLayout.Route>
    </Route>
    <Route path="/notifications" element={<PortalNotificationsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/self-service" element={<SelfServicePage />} />
  </FlatRoutes>
);

const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useUserRole();
  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export default app.createRoot(
  <>
    {/* Nav IA prototype: hide Backstage alert toasts (catalog/backend noise without AAP). */}
    {/* <AlertDisplay /> */}
    <AppRouter>
      <RoleProvider>
        <LightspeedProvider>
          <QuickstartProvider>
            <GlobalHeader />
            {/* <ExperienceReturnCompareBar /> — B forced; remount to compare A */}
            <Root>{routes}</Root>
            <LightspeedPanel />
            <QuickstartPanel />
            <WelcomeModal />
          </QuickstartProvider>
        </LightspeedProvider>
      </RoleProvider>
    </AppRouter>
  </>,
);
