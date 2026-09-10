import { useEffect, useState } from 'react';
import { Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { taskReadPermission } from '@backstage/plugin-scaffolder-common/alpha';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import {
  executionEnvironmentsViewPermission,
  collectionsViewPermission,
} from '@ansible/backstage-rhaap-common/permissions';

import { HomeComponent } from '../Home';
import { CatalogImport } from '../CatalogImport';
import { CreateTask } from '../CreateTask';
import { RunTask } from '../RunTask';
import { FeedbackFooter } from '../feedback/FeedbackFooter';
import { TaskList } from '../TaskList';
import { CatalogItemsDetails } from '../CatalogItemDetails';
import { EETabs } from '../ExecutionEnvironments';
import { EEDetailsPage } from '../ExecutionEnvironments/catalog/EEDetailsPage';
import { ProjectsTabs } from '../Projects';
import { ApmeRemediationPage } from '../Projects/quality/ApmeRemediationPage';
import { ProjectDetailsPage } from '../Projects/detail/ProjectDetailsPage';
import { RepositoryDetailPage } from '../Projects/repositories/RepositoryDetailPage';
import { CollectionsCatalogPage } from '../CollectionsCatalog';
import { CollectionDetailsPage } from '../CollectionsCatalog/CollectionDetailsPage';
import { ConnectionsPage } from '../Admin/ConnectionsPage';
import { EEBuilderPlaceholderPage } from '../Admin/EEBuilderPlaceholderPage';
import { ConnectionDetailPage } from '../Admin/ConnectionDetailPage';
import { SyncActivityPage } from '../Admin/SyncActivityPage';
import { SyncJobDetailPage } from '../Admin/SyncJobDetailPage';
// Pipeline Policies removed — prototype-only concept
import { ContentSourcesPage } from '../Admin/ContentSourcesPage';
import { LearningPage } from '../Learning/LearningPage';
import { CompliancePage } from '../Compliance/CompliancePage';
import {
  IaPlaceholderPage,
  UnifiedCatalogPage,
  OutcomesPage,
  HomeBandDashboardPage,
  ExperiencesHomePage,
  PortalAssistantPage,
  SHOW_ASSISTANT_EXPERIENCE,
  ExperienceSettingsPage,
  ExperienceDashboardPage,
  OrchestratorPage,
  inventoriesIaPage,
  edgeFleetsIaPage,
} from '../IaPlaceholder';
import { SetupWizardPage } from '../Setup/SetupWizardPage';
import { useSetupDemoMode } from '../../hooks/useSetupDemoMode';
import { GeneralPage } from '../Admin/GeneralPage';
import { DevSpacesDetailPage } from '../Admin/DevSpacesDetailPage';
import { PluginsPage } from '../Admin/PluginsPage';
import { SHOW_ADMIN_PLUGINS } from '../Admin/adminPluginsTrial';
import { ExperiencesAdminPage } from '../Admin/ExperiencesAdminPage';
import { CreateExperienceWizardPage } from '../Admin/CreateExperienceWizardPage';
import { NotificationsAdminPage } from '../Admin/NotificationsAdminPage';
import {
  DevelopAdminLayout,
  DevelopAccessPage,
  DevelopQualityPage,
} from '../DevelopAdmin';
import {
  NotificationProvider,
  NotificationStack,
  useNotifications,
  syncPollingService,
} from '../notifications';

const RouteViewContent = () => {
  const { epoch: setupDemoEpoch } = useSetupDemoMode();
  const { notifications, removeNotification } = useNotifications();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const navigate = useNavigate();
  const [redirectChecked, setRedirectChecked] = useState(false);

  useEffect(() => {
    syncPollingService.initialize(discoveryApi, fetchApi);
  }, [discoveryApi, fetchApi]);

  useEffect(() => {
    if (!redirectChecked) {
      setRedirectChecked(true);
      const shouldRedirect = sessionStorage.getItem('portal-setup-redirect');
      if (shouldRedirect) {
        sessionStorage.removeItem('portal-setup-redirect');
        navigate('setup', { replace: true });
      }
    }
  }, [redirectChecked, navigate]);

  return (
    <>
      <Routes>
        <Route path="catalog" element={<HomeComponent />} />
        <Route
          path="catalog/:namespace/:templateName"
          element={<CatalogItemsDetails />}
        />
        <Route
          path="catalog-import"
          element={
            <RequirePermission permission={catalogEntityCreatePermission}>
              <CatalogImport />
            </RequirePermission>
          }
        />
        <Route path="create">
          <Route
            path="templates/:namespace/:templateName"
            element={<CreateTask />}
          />
          <Route
            path="tasks"
            element={
              <RequirePermission
                permission={taskReadPermission}
                resourceRef="scaffolder-task"
              >
                <TaskList />
              </RequirePermission>
            }
          />
          <Route
            path="tasks/:taskId"
            element={
              <RequirePermission
                permission={taskReadPermission}
                resourceRef="scaffolder-task"
              >
                <RunTask />
              </RequirePermission>
            }
          />
        </Route>
        <Route
          path="ee"
          element={
            <RequirePermission permission={executionEnvironmentsViewPermission}>
              <Outlet />
            </RequirePermission>
          }
        >
          <Route index element={<Navigate to="catalog" replace />} />
          <Route path="catalog" element={<EETabs />} />
          <Route path="create" element={<EETabs />} />
          <Route path="*" element={<Navigate to="catalog" replace />} />
        </Route>
        <Route path="catalog/:templateName" element={<EEDetailsPage />} />
        {/* Git Repositories — canonical path */}
        <Route path="repositories">
          <Route index element={<ProjectsTabs />} />
          <Route path="list" element={<ProjectsTabs />} />
          <Route path="dashboard" element={<ProjectsTabs />} />
          <Route path="remediations" element={<ProjectsTabs />} />
          <Route path="scans" element={<ProjectsTabs />} />
          <Route path="quality" element={<ProjectsTabs />} />
          <Route path="ci-activity" element={<ProjectsTabs />} />
          <Route path="create" element={<ProjectsTabs />} />
          <Route path=":projectName" element={<ProjectDetailsPage />} />
        </Route>
        {/* Legacy /projects path — redirect to /repositories */}
        <Route path="projects/*" element={<Navigate to="/self-service/repositories" replace />} />
        {/* Legacy Quality → Dashboard on Git Repositories host */}
        <Route
          path="quality"
          element={<Navigate to="/self-service/repositories/dashboard" replace />}
        />
        <Route
          path="apme"
          element={<Navigate to="/self-service/repositories/dashboard" replace />}
        />
        <Route
          path="apme/findings"
          element={<Navigate to="/self-service/repositories/dashboard" replace />}
        />
        <Route
          path="apme/scans"
          element={<Navigate to="/self-service/repositories/scans" replace />}
        />
        <Route
          path="apme/remediations"
          element={<Navigate to="/self-service/repositories/remediations" replace />}
        />
        <Route path="apme/remediate/:repoName" element={<ApmeRemediationPage />} />
        <Route path="collections" element={<CollectionsCatalogPage />} />
        <Route
          path="collections/:collectionName"
          element={
            <RequirePermission permission={collectionsViewPermission}>
              <CollectionDetailsPage />
            </RequirePermission>
          }
        />
        {/* Study — Home hidden; land on Automate Templates */}
        <Route
          path="home"
          element={<Navigate to="/create?scope=experience" replace />}
        />
        <Route
          path="home/*"
          element={<Navigate to="/create?scope=experience" replace />}
        />
        <Route path="experiences" element={<ExperiencesHomePage />} />
        <Route path="experiences/*" element={<ExperiencesHomePage />} />
        <Route
          path="assistant"
          element={
            SHOW_ASSISTANT_EXPERIENCE ? (
              <PortalAssistantPage />
            ) : (
              <Navigate to="/self-service/experiences" replace />
            )
          }
        />
        <Route
          path="assistant/*"
          element={
            SHOW_ASSISTANT_EXPERIENCE ? (
              <PortalAssistantPage />
            ) : (
              <Navigate to="/self-service/experiences" replace />
            )
          }
        />
        <Route
          path="experience-settings"
          element={<ExperienceSettingsPage />}
        />
        <Route
          path="experience-dashboard"
          element={<ExperienceDashboardPage />}
        />
        <Route path="resources" element={<UnifiedCatalogPage />} />
        <Route path="resources/*" element={<UnifiedCatalogPage />} />
        {/* IA Option 3 — Home Dashboard (+ Outcomes route retained, not in rail) */}
        <Route path="home-dashboard" element={<HomeBandDashboardPage />} />
        <Route path="home-dashboard/*" element={<HomeBandDashboardPage />} />
        <Route path="outcomes" element={<OutcomesPage />} />
        <Route path="outcomes/*" element={<OutcomesPage />} />
        {/* IA placeholders — Inventories / Edge fleets (AAP-84131) */}
        <Route
          path="inventories"
          element={<IaPlaceholderPage config={inventoriesIaPage} />}
        />
        <Route
          path="inventories/*"
          element={<IaPlaceholderPage config={inventoriesIaPage} />}
        />
        <Route
          path="edge-fleets"
          element={<IaPlaceholderPage config={edgeFleetsIaPage} />}
        />
        <Route
          path="edge-fleets/*"
          element={<IaPlaceholderPage config={edgeFleetsIaPage} />}
        />
        {/* Legacy anti-pattern paths → correct entity surfaces */}
        <Route
          path="edge-devices"
          element={<Navigate to="/self-service/edge-fleets" replace />}
        />
        <Route
          path="edge-devices/*"
          element={<Navigate to="/self-service/edge-fleets" replace />}
        />
        <Route
          path="compliance-dashboard"
          element={<Navigate to="/self-service/inventories" replace />}
        />
        <Route
          path="compliance-dashboard/*"
          element={<Navigate to="/self-service/inventories" replace />}
        />
        <Route
          path="edge-images"
          element={<Navigate to="/self-service/edge-fleets" replace />}
        />
        <Route
          path="edge-images/*"
          element={<Navigate to="/self-service/edge-fleets" replace />}
        />
        <Route
          path="edge-repositories"
          element={<Navigate to="/self-service/edge-fleets" replace />}
        />
        <Route
          path="edge-repositories/*"
          element={<Navigate to="/self-service/edge-fleets" replace />}
        />
        {/* Legacy compliance routes kept for deep links */}
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="compliance/scans" element={<CompliancePage />} />
        <Route path="compliance/scan/:scanId" element={<CompliancePage />} />
        <Route path="compliance/profiles" element={<CompliancePage />} />
        <Route path="compliance/profiles/:profileDefId" element={<CompliancePage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="develop/admin" element={<DevelopAdminLayout />}>
          <Route index element={<Navigate to="access" replace />} />
          <Route path="access" element={<DevelopAccessPage />} />
          <Route
            path="content"
            element={<Navigate to="/self-service/admin/integrations" replace />}
          />
          <Route
            path="content/:providerId"
            element={<Navigate to="/self-service/admin/integrations" replace />}
          />
          <Route path="quality" element={<DevelopQualityPage />} />
        </Route>
        <Route path="admin/overview" element={<GeneralPage />} />
        <Route
          path="admin/general"
          element={<Navigate to="/self-service/admin/overview" replace />}
        />
        <Route
          path="admin/experiences/create"
          element={<Navigate to="/self-service/admin/experiences" replace />}
        />
        <Route
          path="admin/experiences/:experienceId/setup"
          element={<CreateExperienceWizardPage />}
        />
        <Route path="admin/experiences" element={<ExperiencesAdminPage />} />
        <Route path="orchestrator" element={<OrchestratorPage />} />
        <Route path="orchestrator/*" element={<OrchestratorPage />} />
        <Route
          path="admin/plugins"
          element={
            SHOW_ADMIN_PLUGINS ? (
              <PluginsPage />
            ) : (
              <Navigate to="/self-service/admin/experiences" replace />
            )
          }
        />
        <Route
          path="admin/notifications"
          element={<NotificationsAdminPage />}
        />
        <Route path="admin/integrations" element={<ConnectionsPage />} />
        <Route path="admin/integrations/devspaces" element={<DevSpacesDetailPage />} />
        <Route path="admin/integrations/:providerId" element={<ConnectionDetailPage />} />
        <Route path="admin/connections" element={<Navigate to="/self-service/admin/integrations" replace />} />
        <Route path="admin/ee-builder" element={<EEBuilderPlaceholderPage />} />
        <Route path="admin/content-sources" element={<ContentSourcesPage />} />
        <Route path="admin/sync-activity" element={<SyncActivityPage />} />
        <Route path="admin/sync-activity/:syncId" element={<SyncJobDetailPage />} />
        {/* Pipeline Policies route removed */}
        <Route
          path="setup"
          element={<SetupWizardPage key={setupDemoEpoch} />}
        />
        {/* Default redirects */}
        <Route
          path="/catalog/*"
          element={<Navigate to="/self-service/catalog" />}
        />
        <Route path="*" element={<Navigate to="/self-service/repositories" />} />
      </Routes>
      <FeedbackFooter />
      <NotificationStack
        notifications={notifications}
        onClose={removeNotification}
      />
    </>
  );
};

export const RouteView = () => {
  return (
    <NotificationProvider>
      <RouteViewContent />
    </NotificationProvider>
  );
};
