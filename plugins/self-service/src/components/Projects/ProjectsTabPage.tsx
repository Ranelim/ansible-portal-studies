import { useCallback, useMemo } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import SearchIcon from '@material-ui/icons/Search';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { AddActionButton } from '../common/AddActionButton';
import { GitRepositoriesContent } from './catalog/GitRepositoriesContent';
import { ProjectsCreateContent } from './create/ProjectsCreateContent';

const tabs = [
  { id: 'repositories', label: 'Repositories', path: 'repositories' },
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
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Box display="flex" alignItems="center">
              Projects
              <PageHelpIcon
                tooltipLabel="What are projects?"
                title="What are projects?"
                description="Projects are Git repositories containing automation content — playbooks, roles, collections, or execution environments. They are discovered from your connected sources (GitHub, GitLab) and appear here automatically. Enable governance on any project to add quality scans, CI/CD pipelines, and connect to Ansible Automation Platform."
              />
            </Box>
            <AddActionButton
              label="Add repository"
              options={[
                {
                  label: 'Create from template',
                  description: 'Scaffold a new repository from a curated template with best-practice structure.',
                  icon: <FileCopyOutlinedIcon fontSize="small" />,
                  onClick: () => navigate('/self-service/projects/create'),
                },
                {
                  label: 'Import existing repository',
                  description: 'Connect an existing Git repository to discover and govern its automation content.',
                  icon: <SearchIcon fontSize="small" />,
                  onClick: () => navigate('/self-service/catalog-import'),
                },
              ]}
            />
          </Box>
        }
        pageTitleOverride="Projects"
        subtitle="Git repositories containing your automation content"
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
