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
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';

import { rootRouteRef } from '../../routes';
import { EntityCatalogContent } from './catalog/CatalogContent';
import { CreateFromTemplateDialog } from '../common/CreateFromTemplateDialog';

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
  actionsButton: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: 20,
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
];

export const EETabs: React.FC = () => {
  const classes = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const rootLink = useRouteRef(rootRouteRef);
  const { allowed } = usePermission({
    permission: catalogEntityCreatePermission,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Legacy /ee/create deep link → catalog + open create modal
  useEffect(() => {
    if (location.pathname.includes('/ee/create')) {
      setCreateOpen(true);
      navigate(`${rootLink()}/ee/catalog`, { replace: true });
    }
  }, [location.pathname, navigate, rootLink]);

  useEffect(() => {
    const tabIndex = (location.state as { tabIndex?: number })?.tabIndex;
    if (tabIndex !== undefined) {
      // Former Create tab (1) → open modal; list tab stays on catalog
      if (tabIndex === 1) {
        setCreateOpen(true);
      }
      navigate(`${rootLink()}/ee/catalog`, {
        replace: true,
        state: {},
      });
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
      if (index === 1) {
        setCreateOpen(true);
        return;
      }
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
    setCreateOpen(true);
  }, [handleMenuClose]);

  const handleImport = useCallback(() => {
    handleMenuClose();
    navigate(`${rootLink()}/catalog-import`);
  }, [handleMenuClose, navigate, rootLink]);

  const content = useMemo(
    () => <EntityCatalogContent key="catalog" onTabSwitch={handleTabSwitch} />,
    [handleTabSwitch],
  );

  return (
    <Page themeId="app">
      <EEHeader>
        {allowed && (
          <>
            <Button
              variant="contained"
              color="primary"
              className={classes.actionsButton}
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
                    Build a new EE definition from a curated template.
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
      {/* Single list tab — no Create tab; create is header Actions → modal */}
      {tabs.length > 1 && (
        <HeaderTabs
          selectedIndex={0}
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
      )}
      <Content>{content}</Content>
      <CreateFromTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        kind="execution-environment"
      />
    </Page>
  );
};
