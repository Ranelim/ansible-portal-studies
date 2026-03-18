import { useEffect, useCallback, useMemo, useState } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import {
  Typography,
  Box,
  makeStyles,
  Popover,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CloseIcon from '@material-ui/icons/Close';
import { CreateContent } from './create/CreateContent';
import { EntityCatalogContent } from './catalog/CatalogContent';

const useStyles = makeStyles(theme => ({
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

const PageHelpIcon = () => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title="What are Execution Environments?" arrow>
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
            <Typography className={classes.helpTitle}>
              What are Execution Environments?
            </Typography>
            <IconButton size="small" onClick={() => setAnchorEl(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography className={classes.helpDescription}>
            Execution Environment (EE) definition files describe the container
            images used to run your Ansible automation. They ensure your
            playbooks run consistently by packaging all dependencies, collections,
            and Python libraries into a reproducible container image.
          </Typography>
        </Box>
      </Popover>
    </>
  );
};

export const EEHeader = () => {
  const headerTitle = (
    <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      Execution Environments
      <PageHelpIcon />
    </Box>
  );

  return (
    <Header
      title={headerTitle}
      pageTitleOverride="Execution Environments"
      subtitle="Container images that package dependencies for running Ansible automation"
    />
  );
};

const tabs = [
  { id: 0, label: 'Catalog', path: 'catalog' },
  { id: 1, label: 'Templates', path: 'create' },
];

const getTabIndexFromPath = (pathname: string): number => {
  if (pathname.includes('/ee/create')) return 1;
  return 0;
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
      <Content>{content}</Content>
    </Page>
  );
};
