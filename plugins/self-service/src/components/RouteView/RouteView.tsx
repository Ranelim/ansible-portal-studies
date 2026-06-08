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
import { SetupWizardPage } from '../Setup/SetupWizardPage';
import { GeneralPage } from '../Admin/GeneralPage';
import { DevSpacesDetailPage } from '../Admin/DevSpacesDetailPage';
import {
  NotificationProvider,
  NotificationStack,
  useNotifications,
  syncPollingService,
} from '../notifications';

const RouteViewContent = () => {
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
          <Route path="quality" element={<ProjectsTabs />} />
          <Route path="ci-activity" element={<ProjectsTabs />} />
          <Route path="create" element={<ProjectsTabs />} />
          <Route path=":projectName" element={<ProjectDetailsPage />} />
        </Route>
        {/* Legacy /projects path — redirect to /repositories */}
        <Route path="projects/*" element={<Navigate to="/self-service/repositories" replace />} />
        {/* Quality now lives under Git Repositories > Quality tab */}
        <Route path="quality" element={<Navigate to="/self-service/repositories/quality" replace />} />
        <Route path="collections" element={<CollectionsCatalogPage />} />
        <Route
          path="collections/:collectionName"
          element={
            <RequirePermission permission={collectionsViewPermission}>
              <CollectionDetailsPage />
            </RequirePermission>
          }
        />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="admin/general" element={<GeneralPage />} />
        <Route path="admin/integrations" element={<ConnectionsPage />} />
        <Route path="admin/integrations/devspaces" element={<DevSpacesDetailPage />} />
        <Route path="admin/integrations/:providerId" element={<ConnectionDetailPage />} />
        <Route path="admin/connections" element={<Navigate to="/self-service/admin/integrations" replace />} />
        <Route path="admin/ee-builder" element={<EEBuilderPlaceholderPage />} />
        <Route path="admin/content-sources" element={<ContentSourcesPage />} />
        <Route path="admin/sync-activity" element={<SyncActivityPage />} />
        <Route path="admin/sync-activity/:syncId" element={<SyncJobDetailPage />} />
        {/* Pipeline Policies route removed */}
        <Route path="setup" element={<SetupWizardPage />} />
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
