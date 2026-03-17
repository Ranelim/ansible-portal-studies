import { useCallback, useMemo } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box, makeStyles } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import CategoryOutlinedIcon from '@material-ui/icons/CategoryOutlined';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import { ProjectsCatalogContent } from './catalog/ProjectsCatalogContent';
import { ProjectsCreateContent } from './create/ProjectsCreateContent';

const useStyles = makeStyles(() => ({
  tabWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
}));

const tabs = [
  {
    id: 0,
    label: 'Catalog',
    icon: <CategoryOutlinedIcon />,
    path: 'catalog',
  },
  {
    id: 1,
    label: 'Templates',
    icon: <DescriptionOutlinedIcon />,
    path: 'create',
  },
];

const getTabIndexFromPath = (pathname: string): number => {
  if (pathname.includes('/projects/create')) return 1;
  return 0;
};

export const ProjectsTabs: React.FC = () => {
  const classes = useStyles();
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
    if (selectedTab === 1) {
      return <ProjectsCreateContent key="create" />;
    }
    return (
      <ProjectsCatalogContent key="catalog" onTabSwitch={handleTabSwitch} />
    );
  }, [selectedTab, handleTabSwitch]);

  return (
    <Page themeId="app">
      <Header
        title="Projects"
        pageTitleOverride="Projects"
        subtitle="Automation projects linked to Git repositories and deployed to AAP"
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={
          tabs.map(({ label, icon }) => ({
            id: label.toLowerCase(),
            label: (
              <Box className={classes.tabWithIcon}>
                {icon}
                {label}
              </Box>
            ),
          })) as any
        }
      />
      <Content>{content}</Content>
    </Page>
  );
};
