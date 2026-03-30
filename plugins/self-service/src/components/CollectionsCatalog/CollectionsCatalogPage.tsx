import { Box } from '@material-ui/core';
import { Page, Header, Content } from '@backstage/core-components';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { DismissibleBanner } from '../common/DismissibleBanner';
import { AddActionButton } from '../common/AddActionButton';
import { CollectionsContent } from './CollectionsListPage';
import {
  NotificationProvider,
  NotificationStack,
  useNotifications,
} from '../notifications';

const CollectionsCatalogPageInner = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Box display="flex" alignItems="center">
              Collections
              <PageHelpIcon
                tooltipLabel="What are collections?"
                title="What are Collections?"
                description="An Ansible collection is a package of reusable automation content, including modules, roles, plugins, and playbooks. Collections let you share and reuse automation across teams and projects."
              />
            </Box>
            <AddActionButton
              label="Add collection"
              options={[
                {
                  label: 'Import from Automation Hub',
                  description: 'Browse and import collections from Red Hat Automation Hub or Ansible Galaxy.',
                  icon: <CloudDownloadIcon fontSize="small" />,
                  onClick: () => {},
                },
              ]}
            />
          </Box>
        }
        pageTitleOverride="Collections"
        subtitle="Reusable Ansible content packages including modules, roles, and plugins"
      />
      <Content>
        <DismissibleBanner
          storageKey="collections-catalog"
          message="Collections are curated packages of Ansible automation content including modules, roles, plugins, and playbooks. They are synced from your connected content sources."
        />
        <CollectionsContent />
      </Content>
      <NotificationStack
        notifications={notifications}
        onClose={removeNotification}
      />
    </Page>
  );
};

export const CollectionsCatalogPage = () => {
  return (
    <NotificationProvider>
      <CollectionsCatalogPageInner />
    </NotificationProvider>
  );
};
