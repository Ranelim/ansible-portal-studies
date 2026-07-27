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
import { CIActivityContent } from './ci/CIActivityContent';
import { QualityOverviewContent } from './quality/QualityOverviewContent';

const tabs = [
  { id: 'repositories', label: 'Repositories', path: 'list' },
  { id: 'quality', label: 'Quality', path: 'quality' },
  // Distinct from rail "Activity" (portal-wide job runs)
  { id: 'ci-activity', label: 'Pipeline activity', path: 'ci-activity' },
  // Distinct from rail "Templates" (portal-wide run catalog)
  { id: 'templates', label: 'Scaffold', path: 'create' },
];

const getTabIndexFromPath = (pathname: string): number => {
  if (pathname.includes('/repositories/quality')) return 1;
  if (pathname.includes('/repositories/ci-activity')) return 2;
  if (pathname.includes('/repositories/create')) return 3;
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
        navigate(`/self-service/repositories/${tab.path}`);
      }
    },
    [navigate],
  );

  const content = useMemo(() => {
    if (selectedTab === 1) {
      return <QualityOverviewContent key="quality" />;
    }
    if (selectedTab === 2) {
      return <CIActivityContent key="ci-activity" />;
    }
    if (selectedTab === 3) {
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
              Git Repositories
              <PageHelpIcon
                tooltipLabel="What are git repositories?"
                title="What are git repositories?"
                description="Git repositories contain your automation content — playbooks, roles, collections, or execution environments. They are discovered from your connected sources (GitHub, GitLab) and appear here automatically. Quality scans run against your repositories to check for best practices and compliance."
              />
            </Box>
            <AddActionButton
              label="Add repository"
              options={[
                {
                  label: 'Create from template',
                  description: 'Scaffold a new repository from a curated template with best-practice structure.',
                  icon: <FileCopyOutlinedIcon fontSize="small" />,
                  onClick: () => navigate('/self-service/repositories/create'),
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
        pageTitleOverride="Git Repositories"
        subtitle="Automation content repositories discovered from your connected sources"
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
