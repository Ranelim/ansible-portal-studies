import { useCallback, useMemo } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { ProjectsCatalogContent } from './catalog/ProjectsCatalogContent';
import { RepositoriesContent } from './repositories/RepositoriesContent';
import { ProjectsCreateContent } from './create/ProjectsCreateContent';

const tabs = [
  { id: 0, label: 'Catalog', path: 'catalog' },
  { id: 1, label: 'Repositories', path: 'repositories' },
  { id: 2, label: 'Templates', path: 'create' },
];

const getTabIndexFromPath = (pathname: string): number => {
  if (pathname.includes('/projects/repositories')) return 1;
  if (pathname.includes('/projects/create')) return 2;
  return 0;
};

export const ProjectsTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedTab = useMemo(
    () => getTabIndexFromPath(location.pathname),
    [location.pathname],
  );

  const onTabSelect = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (tab) {
        navigate(`/self-service/projects/${tab.path}`);
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
    if (selectedTab === 2) {
      return <ProjectsCreateContent key="create" />;
    }
    if (selectedTab === 1) {
      return <RepositoriesContent key="repositories" />;
    }
    return (
      <ProjectsCatalogContent key="catalog" onTabSwitch={handleTabSwitch} />
    );
  }, [selectedTab, handleTabSwitch]);

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Projects
            <PageHelpIcon
              tooltipLabel="What are projects?"
              title="What are Projects?"
              description="Projects are automation codebases linked to a Git repository and deployed to Ansible Automation Platform (AAP). Each project goes through a governed CI/CD pipeline that validates content quality, policy compliance, and EE compatibility before it can be pushed to your Ansible Controller."
            />
          </Box>
        }
        pageTitleOverride="Projects"
        subtitle="Manage automation projects connected to Git and deployed to AAP"
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={tabs.map(({ label }) => ({
          id: label.toLowerCase(),
          label,
        }))}
      />
      <Content>{content}</Content>
    </Page>
  );
};
