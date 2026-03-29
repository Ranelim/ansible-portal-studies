import { useCallback, useMemo } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { GitRepositoriesContent } from './catalog/GitRepositoriesContent';
import { ProjectsCreateContent } from './create/ProjectsCreateContent';

const tabs = [
  { id: 'repositories', label: 'Repositories', path: 'catalog' },
  { id: 'templates', label: 'Templates', path: 'create' },
];

const getTabIndexFromPath = (pathname: string): number => {
  if (pathname.includes('/projects/create')) return 1;
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

  const content = useMemo(() => {
    if (selectedTab === 1) {
      return <ProjectsCreateContent key="create" />;
    }
    return <GitRepositoriesContent key="repositories" />;
  }, [selectedTab]);

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Git repositories
            <PageHelpIcon
              tooltipLabel="What are Git repositories?"
              title="What are Git repositories?"
              description="Git repositories are automation codebases discovered from your connected sources (GitHub, GitLab). Repositories containing Ansible content — playbooks, roles, collections, or execution environments — appear here automatically. Enable governance on any repository to add CI/CD pipelines with policy checks and connect to Ansible Automation Platform."
            />
          </Box>
        }
        pageTitleOverride="Git repositories"
        subtitle="Discover, govern, and deploy automation content from your Git repositories"
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={tabs.map(({ id, label }) => ({ id, label }))}
      />
      <Content>{content}</Content>
    </Page>
  );
};
