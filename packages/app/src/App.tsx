import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { useUserRole, useUserRoleContext, UserRoleContext, writeNavExperience } from '@ansible/plugin-backstage-self-service';
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
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { apis } from './apis';
import { SearchPage as BackstageSearchPage } from '@backstage/plugin-search';
import { entityPage } from './components/catalog/EntityPage';
import { SearchPage } from './components/search/SearchPage';
import { Root } from './components/Root';
import { GlobalHeader } from './components/GlobalHeader';
import { PortalNotificationsPage } from './components/Notifications/PortalNotificationsPage';
import { PortalNotificationSettingsPage } from './components/Notifications/PortalNotificationSettingsPage';
import { PortalUserSettingsPage } from './components/Settings/PortalUserSettingsPage';
import { PortalMyProfilePage } from './components/catalog/PortalMyProfilePage';
import { LightspeedProvider, LightspeedPanel } from './components/Lightspeed';
import { QuickstartProvider, QuickstartPanel } from './components/Quickstart';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { lockStudyWorld, STUDY_LANDING } from './studyLock';
import { createApp } from '@backstage/app-defaults';
import { CustomSignInPage } from './components/SignIn/CustomSignInPage';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { providers } from './identityProviders';
import { PortalCreatePage } from './components/scaffolder/PortalCreatePage';
import { SelfServicePage } from '@ansible/plugin-backstage-self-service';
import { RbacPage } from '@backstage-community/plugin-rbac';
import { TechDocsWrapper } from './components/docs/TechDocsWrapper';

lockStudyWorld();

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
  const { loading } = useUserRoleContext();
  if (loading) return null;
  writeNavExperience('develop');
  return <Navigate to={STUDY_LANDING} replace />;
};

const routes = (
  <FlatRoutes>
    <Route path="/" element={<RoleLandingRedirect />} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/user/:name"
      element={<PortalMyProfilePage />}
    />
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
    <Route path="/create" element={<PortalCreatePage />} />
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
    <Route path="/settings/*" element={<PortalUserSettingsPage />} />
    <Route
      path="/notifications/settings"
      element={<PortalNotificationSettingsPage />}
    />
    <Route path="/notifications" element={<PortalNotificationsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/self-service" element={<SelfServicePage />} />
  </FlatRoutes>
);

const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  useUserRole();
  const value = React.useMemo(
    () => ({
      role: 'developer' as const,
      loading: false,
      hasRole: (minRole: 'sme' | 'developer' | 'operator' | 'admin') => {
        const hierarchy = { sme: 0, developer: 1, operator: 1, admin: 2 };
        return hierarchy.developer >= hierarchy[minRole];
      },
    }),
    [],
  );
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
            <Root>{routes}</Root>
            <LightspeedPanel />
            <QuickstartPanel />
          </QuickstartProvider>
        </LightspeedProvider>
      </RoleProvider>
    </AppRouter>
  </>,
);
