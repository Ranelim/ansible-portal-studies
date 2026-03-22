import { useEffect, useCallback, useMemo, useState } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { DismissibleBanner } from '../common/DismissibleBanner';
import { CreateContent } from './create/CreateContent';
import { EntityCatalogContent } from './catalog/CatalogContent';

const tabs = [
  { id: 0, label: 'Catalog', path: 'catalog' },
  { id: 1, label: 'Templates', path: 'create' },
];

const getTabIndexFromPath = (pathname: string): number => {
  if (pathname.includes('/ee/create')) return 1;
  return 0;
};

export const EEHeader = () => {
  return (
    <Header
      title={
        <Box display="flex" alignItems="center">
          Execution Environments
          <PageHelpIcon
            tooltipLabel="What are execution environments?"
            title="What are Execution Environments?"
            description="Execution environment (EE) definition files describe the container images used to run your Ansible automation. They ensure your playbooks run consistently by packaging all dependencies, collections, and Python libraries into a reproducible container image."
          />
        </Box>
      }
      pageTitleOverride="Execution Environments"
      subtitle="Container images that package dependencies for running Ansible automation"
    />
  );
};

export const EETabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedTab = useMemo(
    () => getTabIndexFromPath(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    const tabIndex = (location.state as { tabIndex?: number })?.tabIndex;
    if (tabIndex !== undefined) {
      const tab = tabs[tabIndex];
      if (tab) {
        navigate(`/self-service/ee/${tab.path}`, {
          replace: true,
          state: {},
        });
      }
    }
  }, [location.state, navigate]);

  const onTabSelect = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (tab) {
        navigate(`/self-service/ee/${tab.path}`);
      }
    },
    [navigate],
  );

  const handleTabSwitch = useCallback(
    (index: number) => {
      onTabSelect(index);
    },
    [onTabSelect],
  );

  const content = useMemo(() => {
    if (selectedTab === 1) {
      return <CreateContent key="create" />;
    }
    return <EntityCatalogContent key="catalog" onTabSwitch={handleTabSwitch} />;
  }, [selectedTab, handleTabSwitch]);

  return (
    <Page themeId="app">
      <EEHeader />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={tabs.map(({ label }) => ({
          id: label.toLowerCase(),
          label,
        }))}
      />
      <Content>
        <DismissibleBanner
          storageKey="ee-catalog"
          message="Execution environments are container images that package all dependencies needed to run your Ansible automation. Browse the catalog to find available EE definitions or create new ones from templates."
        />
        {content}
      </Content>
    </Page>
  );
};
