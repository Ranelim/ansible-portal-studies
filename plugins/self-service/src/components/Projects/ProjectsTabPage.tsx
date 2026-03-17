import { useCallback, useMemo, useState } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box, Tooltip, Popover, Typography, IconButton, makeStyles } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import CategoryOutlinedIcon from '@material-ui/icons/CategoryOutlined';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CloseIcon from '@material-ui/icons/Close';
import { ProjectsCatalogContent } from './catalog/ProjectsCatalogContent';
import { ProjectsCreateContent } from './create/ProjectsCreateContent';

const useStyles = makeStyles(theme => ({
  tabWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  helpIcon: {
    color: theme.palette.common.white,
    opacity: 0.7,
    fontSize: 20,
    cursor: 'pointer',
    marginLeft: theme.spacing(1),
    '&:hover': {
      opacity: 1,
    },
  },
  helpPopover: {
    padding: theme.spacing(2.5),
    maxWidth: 380,
  },
  helpTitle: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: theme.spacing(1),
  },
  helpDescription: {
    fontSize: 13,
    lineHeight: 1.6,
    color: theme.palette.text.secondary,
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

const PageHelpIcon = () => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title="What are projects?" arrow>
        <span
          style={{ display: 'inline-flex', cursor: 'pointer' }}
          onClick={e => setAnchorEl(e.currentTarget)}
          role="button"
          tabIndex={0}
        >
          <HelpOutlineIcon className={classes.helpIcon} />
        </span>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box className={classes.helpPopover}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Typography className={classes.helpTitle}>What are Projects?</Typography>
            <IconButton size="small" onClick={() => setAnchorEl(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography className={classes.helpDescription}>
            Projects are automation codebases linked to a Git repository and
            deployed to Ansible Automation Platform (AAP). Each project goes
            through a governed CI/CD pipeline that validates content quality,
            policy compliance, and EE compatibility before it can be pushed
            to your Ansible Controller.
          </Typography>
        </Box>
      </Popover>
    </>
  );
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
        title={
          <Box display="flex" alignItems="center">
            Projects
            <PageHelpIcon />
          </Box>
        }
        pageTitleOverride="Projects"
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
