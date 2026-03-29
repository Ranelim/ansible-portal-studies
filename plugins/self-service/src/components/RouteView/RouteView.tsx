import { Route, Routes, Navigate } from 'react-router-dom';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { taskReadPermission } from '@backstage/plugin-scaffolder-common/alpha';

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
import { SyncActivityPage } from '../Admin/SyncActivityPage';
import { SyncJobDetailPage } from '../Admin/SyncJobDetailPage';
import { PipelinePoliciesPage } from '../Admin/PipelinePoliciesPage';
import { LearningPage } from '../Learning/LearningPage';
import { WorkspacesPage } from '../Workspaces/WorkspacesPage';
import { WorkspaceIDEPage } from '../Workspaces/WorkspaceIDEPage';

export const RouteView = () => {
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
        <Route path="ee">
          <Route index element={<Navigate to="catalog" replace />} />
          <Route path="catalog" element={<EETabs />} />
          <Route path="create" element={<EETabs />} />
          <Route path="docs" element={<EETabs />} />
        </Route>
        <Route path="catalog/:templateName" element={<EEDetailsPage />} />
        <Route path="projects">
          <Route index element={<ProjectsTabs />} />
          <Route path="catalog" element={<ProjectsTabs />} />
          <Route path="repositories" element={<ProjectsTabs />} />
          <Route path="create" element={<ProjectsTabs />} />
          <Route path="repositories/:repoName" element={<RepositoryDetailPage />} />
          <Route path=":projectName" element={<ProjectDetailsPage />} />
        </Route>
        <Route path="collections" element={<CollectionsCatalogPage />} />
        <Route
          path="collections/:collectionName"
          element={<CollectionDetailsPage />}
        />
        <Route path="learning" element={<LearningPage />} />
        <Route path="workspaces" element={<WorkspacesPage />} />
        <Route path="workspaces/:workspaceId/ide" element={<WorkspaceIDEPage />} />
        <Route path="admin/connections" element={<ConnectionsPage />} />
        <Route path="admin/sync-activity" element={<SyncActivityPage />} />
        <Route path="admin/sync-activity/:syncId" element={<SyncJobDetailPage />} />
        <Route path="admin/pipeline-policies" element={<PipelinePoliciesPage />} />
        {/* Default redirects */}
        <Route
          path="/catalog/*"
          element={<Navigate to="/self-service/catalog" />}
        />
        <Route path="*" element={<Navigate to="/self-service/projects" />} />
      </Routes>
      <FeedbackFooter />
    </>
  );
};
