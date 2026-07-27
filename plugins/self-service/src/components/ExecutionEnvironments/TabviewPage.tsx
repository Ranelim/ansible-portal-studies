import { useEffect, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  ListItemIcon,
  makeStyles,
  Menu,
  MenuItem,
} from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import PublishIcon from '@material-ui/icons/Publish';
import CategoryOutlinedIcon from '@material-ui/icons/CategoryOutlined';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';

import { rootRouteRef } from '../../routes';
import { CreateContent } from './create/CreateContent';
import { EntityCatalogContent } from './catalog/CatalogContent';

const useStyles = makeStyles(theme => ({
  tabLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: theme.palette.text.secondary,
    '.Mui-selected &': {
      color: theme.palette.text.primary,
    },
  },
  menuItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '8px 16px',
    gap: 8,
  },
  menuItemText: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
}));

export const EEHeader = ({ children }: { children?: React.ReactNode }) => {
  const headerTitle = (
    <Typography
      variant="h4"
      component="h1"
      style={{ fontWeight: 'bold', fontSize: '2rem' }}
    >
      Execution Environments definition files
    </Typography>
  );

  return (
    <Header
      title={headerTitle}
      pageTitleOverride="Execution Environments Definition Files"
      style={{
        fontFamily: 'Red Hat Text',
        color: 'white',
        paddingBottom: '16px',
      }}
    >
      {children}
    </Header>
  );
};

const tabs = [
  // Entity list — never "Catalog" (Catalog = Portal-wide discovery only)
  {
    id: 0,
    label: 'Execution environments',
    icon: <CategoryOutlinedIcon />,
    path: 'catalog',
  },
  { id: 1, label: 'Create', icon: <CreateComponentIcon />, path: 'create' },
];

const getTabIndexFromPath = (pathname: string): number => {
  if (pathname.includes('/ee/create')) return 1;
  return 0;
};

export const EETabs: React.FC = () => {
  const classes = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const rootLink = useRouteRef(rootRouteRef);
  const { allowed } = usePermission({
    permission: catalogEntityCreatePermission,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const selectedTab = useMemo(
    () => getTabIndexFromPath(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    const tabIndex = (location.state as { tabIndex?: number })?.tabIndex;
    if (tabIndex !== undefined) {
      const tab = tabs[tabIndex];
      if (tab) {
        navigate(`${rootLink()}/ee/${tab.path}`, {
          replace: true,
          state: {},
        });
      }
    }
  }, [location.state, navigate, rootLink]);

  const onTabSelect = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (tab) {
        navigate(`${rootLink()}/ee/${tab.path}`);
      }
    },
    [navigate, rootLink],
  );

  const handleTabSwitch = useCallback(
    (index: number) => {
      onTabSelect(index);
    },
    [onTabSelect],
  );

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    },
    [],
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleCreate = useCallback(() => {
    handleMenuClose();
    navigate(`${rootLink()}/ee/create`);
  }, [handleMenuClose, navigate, rootLink]);

  const handleImport = useCallback(() => {
    handleMenuClose();
    navigate(`${rootLink()}/catalog-import`);
  }, [handleMenuClose, navigate, rootLink]);

  const content = useMemo(() => {
    if (selectedTab === 1) {
      return <CreateContent key="create" />;
    }
    return <EntityCatalogContent key="catalog" onTabSwitch={handleTabSwitch} />;
  }, [selectedTab, handleTabSwitch]);

  return (
    <Page themeId="app">
      <EEHeader>
        {allowed && (
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={handleMenuOpen}
              endIcon={<ArrowDropDownIcon />}
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              getContentAnchorEl={null}
              PaperProps={{ style: { minWidth: 280 } }}
            >
              <MenuItem onClick={handleCreate} className={classes.menuItem}>
                <ListItemIcon style={{ minWidth: 36, marginTop: 2 }}>
                  <AddCircleOutlineIcon fontSize="small" />
                </ListItemIcon>
                <Box className={classes.menuItemText}>
                  <Typography variant="body2" style={{ fontWeight: 500 }}>
                    Create definition
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Build a new EE definition from a preset or from scratch.
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleImport} className={classes.menuItem}>
                <ListItemIcon style={{ minWidth: 36, marginTop: 2 }}>
                  <PublishIcon fontSize="small" />
                </ListItemIcon>
                <Box className={classes.menuItemText}>
                  <Typography variant="body2" style={{ fontWeight: 500 }}>
                    Import template
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Register an existing template from a URL or repository.
                  </Typography>
                </Box>
              </MenuItem>
            </Menu>
          </>
        )}
      </EEHeader>
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={
          tabs.map(({ label, icon }) => ({
            id: label.toLowerCase(),
            label: (
              <Box className={classes.tabLabel}>
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
