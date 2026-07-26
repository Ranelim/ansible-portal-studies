import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useUserRoleContext,
  useNavPlugins,
  useNavIaModel,
  availableExperiences,
  EXPERIENCE_LABELS,
  writeNavExperience,
  type NavExperience,
} from '@ansible/plugin-backstage-self-service';
import { SidebarSectionLabel } from '@ansible/plugin-backstage-rhaap';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarSpace,
} from '@backstage/core-components';
import {
  makeStyles,
  Box,
  Typography,
  Collapse,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import HistoryIcon from '@material-ui/icons/History';
import CodeIcon from '@material-ui/icons/Code';
import CategoryIcon from '@material-ui/icons/Category';
import MemoryIcon from '@material-ui/icons/Memory';
import StorageIcon from '@material-ui/icons/Storage';
import RouterIcon from '@material-ui/icons/Router';
import DevicesOtherIcon from '@material-ui/icons/DevicesOther';
import DashboardIcon from '@material-ui/icons/Dashboard';
import PhotoLibraryIcon from '@material-ui/icons/PhotoLibrary';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import SchoolIcon from '@material-ui/icons/School';
import SettingsIcon from '@material-ui/icons/Settings';
import LinkIcon from '@material-ui/icons/Link';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import SyncIcon from '@material-ui/icons/Sync';
import ViewListIcon from '@material-ui/icons/ViewList';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import HomeIcon from '@material-ui/icons/Home';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 16,
    flexShrink: 0,
  },
});

const SidebarSpacer = () => {
  const classes = useSidebarLogoStyles();
  return <div className={classes.root} />;
};

const ModelHint = ({ text }: { text: string }) => (
  <Box px={2} py={1}>
    <Typography
      variant="caption"
      style={{
        display: 'block',
        opacity: 0.65,
        lineHeight: 1.4,
        fontSize: 11,
      }}
    >
      {text}
    </Typography>
  </Box>
);

const DRAWER_STORAGE_KEY = 'portal-nav-section-drawers';

const useDrawerStyles = makeStyles(theme => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '4px 8px 4px 0',
    margin: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: 'inherit',
    textAlign: 'left',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  labelWrap: {
    flex: 1,
    minWidth: 0,
    // SidebarSectionLabel is blocky; keep it flush in the button
    '& > *': {
      marginBottom: '0 !important',
    },
  },
  chevron: {
    padding: 4,
    color: theme.palette.text.secondary,
  },
}));

/** Option 1 — collapsible section drawer (job/theme band). */
const SectionDrawer = ({
  id,
  label,
  defaultOpen = true,
  children,
}: {
  id: string;
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) => {
  const classes = useDrawerStyles();
  const [open, setOpen] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAWER_STORAGE_KEY);
      if (!raw) return defaultOpen;
      const map = JSON.parse(raw) as Record<string, boolean>;
      return typeof map[id] === 'boolean' ? map[id] : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const toggle = () => {
    setOpen(prev => {
      const next = !prev;
      try {
        const raw = localStorage.getItem(DRAWER_STORAGE_KEY);
        const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
        map[id] = next;
        localStorage.setItem(DRAWER_STORAGE_KEY, JSON.stringify(map));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <Box>
      <button
        type="button"
        className={classes.header}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`nav-drawer-${id}`}
      >
        <Box className={classes.labelWrap}>
          <SidebarSectionLabel text={label} />
        </Box>
        <IconButton
          className={classes.chevron}
          size="small"
          tabIndex={-1}
          aria-hidden
        >
          {open ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
      </button>
      <Collapse in={open} id={`nav-drawer-${id}`}>
        <Box>{children}</Box>
      </Collapse>
    </Box>
  );
};

const SearchAndMenu = ({
  children,
  footer,
}: {
  children: ReactNode;
  /** Pinned below a flex spacer (e.g. Administration drawer). */
  footer?: ReactNode;
}) => (
  <Sidebar>
    <SidebarSpacer />
    <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
      <SidebarSearchModal />
    </SidebarGroup>
    <SidebarGroup label="Menu" icon={<MenuIcon />}>
      {children}
      {footer ? (
        <>
          <SidebarSpace />
          {footer}
        </>
      ) : (
        <SidebarSpace />
      )}
    </SidebarGroup>
  </Sidebar>
);

const AutomateItems = () => (
  <>
    <SidebarItem icon={AddCircleOutlineIcon} to="/create" text="Templates" />
    <SidebarItem
      icon={HistoryIcon}
      to="/self-service/create/tasks"
      text="Activity"
    />
  </>
);

const LearnItems = () => (
  <>
    <SidebarItem icon={LibraryBooks} to="docs" text="Documentation" />
    <SidebarItem
      icon={SchoolIcon}
      to="/self-service/learning"
      text="Learning Paths"
    />
  </>
);

const AdminItems = () => (
  <>
    <SidebarItem
      icon={SettingsIcon}
      to="/self-service/admin/general"
      text="Settings"
    />
    <SidebarItem
      icon={LinkIcon}
      to="/self-service/admin/integrations"
      text="Integrations"
    />
    <SidebarItem icon={VpnKeyIcon} to="rbac" text="Access Control" />
    <SidebarItem
      icon={SyncIcon}
      to="/self-service/admin/sync-activity"
      text="Sync Status"
    />
  </>
);

/** Option 4 — curated role-adaptive rail (job sections + entity items). */
export const BaselineSidebar = () => {
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const isAdmin = hasRole('admin');
  const showDevelop = role === 'developer' || isAdmin;
  const canSeeOps = role === 'operator' || isAdmin;
  const showInventories = canSeeOps && plugins.compliance;
  const showEdgeFleets = canSeeOps && plugins.rhem;
  const showEdgeDevices =
    canSeeOps && plugins.rhem && (plugins.rhemDevices || plugins.navSprawl);
  const sprawl = canSeeOps && plugins.navSprawl;
  const showOperate =
    showInventories ||
    showEdgeFleets ||
    showEdgeDevices ||
    (sprawl && plugins.compliance) ||
    (sprawl && plugins.rhem);

  return (
    <SearchAndMenu>
      <ModelHint text="Option 4 — curated objects under job sections" />
      <SidebarSectionLabel text="Automate" />
      <AutomateItems />
      {showDevelop && (
        <>
          <SidebarDivider />
          <SidebarSectionLabel text="Develop" />
          <SidebarItem
            icon={CodeIcon}
            to="/self-service/repositories"
            text="Git Repositories"
          />
          <SidebarItem
            icon={CategoryIcon}
            to="/self-service/collections"
            text="Collections"
          />
          <SidebarItem
            icon={MemoryIcon}
            to="/self-service/ee"
            text="Execution Environments"
          />
        </>
      )}
      {showOperate && (
        <>
          <SidebarDivider />
          <SidebarSectionLabel text="Operate" />
          {showInventories && (
            <SidebarItem
              icon={StorageIcon}
              to="/self-service/inventories"
              text="Inventories"
            />
          )}
          {sprawl && plugins.compliance && (
            <SidebarItem
              icon={DashboardIcon}
              to="/self-service/compliance-dashboard"
              text="Compliance dashboard"
            />
          )}
          {showEdgeFleets && (
            <SidebarItem
              icon={RouterIcon}
              to="/self-service/edge-fleets"
              text="Edge fleets"
            />
          )}
          {showEdgeDevices && (
            <SidebarItem
              icon={DevicesOtherIcon}
              to="/self-service/edge-devices"
              text="Devices"
            />
          )}
          {sprawl && plugins.rhem && (
            <>
              <SidebarItem
                icon={PhotoLibraryIcon}
                to="/self-service/edge-images"
                text="Images"
              />
              <SidebarItem
                icon={FolderOpenIcon}
                to="/self-service/edge-repositories"
                text="Repositories"
              />
            </>
          )}
        </>
      )}
      <SidebarDivider />
      <SidebarSectionLabel text="Learn" />
      <LearnItems />
      {isAdmin && (
        <>
          <SidebarDivider />
          <SidebarSectionLabel text="Administration" />
          <AdminItems />
        </>
      )}
    </SearchAndMenu>
  );
};

/**
 * Option 1 — Section drawers: job/theme bands (collapsible), one rail item per
 * primary entity (+ static Catalog). Plugins extend entities; they do not own sections.
 */
export const SectionsCatalogSidebar = () => {
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const isAdmin = hasRole('admin');
  const showDevelop = role === 'developer' || isAdmin;
  const canSeeOps = role === 'operator' || isAdmin;
  const showInventories = canSeeOps && plugins.compliance;
  const showEdgeFleets = canSeeOps && plugins.rhem;
  const showOperate = showInventories || showEdgeFleets;

  return (
    <SearchAndMenu>
      <ModelHint text="Option 1 — Catalog hub · section drawers · 1 item/entity" />

      {/* Default band (no section label): Portal Catalog hub + run */}
      <SidebarItem
        icon={ViewListIcon}
        to="/self-service/resources"
        text="Catalog"
      />
      <AutomateItems />

      {showDevelop && (
        <>
          <SidebarDivider />
          <SectionDrawer id="develop" label="Develop">
            <SidebarItem
              icon={CodeIcon}
              to="/self-service/repositories"
              text="Git Repositories"
            />
            <SidebarItem
              icon={CategoryIcon}
              to="/self-service/collections"
              text="Collections"
            />
            <SidebarItem
              icon={MemoryIcon}
              to="/self-service/ee"
              text="Execution Environments"
            />
          </SectionDrawer>
        </>
      )}

      {showOperate && (
        <>
          <SidebarDivider />
          <SectionDrawer id="operate" label="Operate">
            {showInventories && (
              <SidebarItem
                icon={StorageIcon}
                to="/self-service/inventories"
                text="Inventories"
              />
            )}
            {showEdgeFleets && (
              <SidebarItem
                icon={RouterIcon}
                to="/self-service/edge-fleets"
                text="Edge fleets"
              />
            )}
          </SectionDrawer>
        </>
      )}

      <SidebarDivider />
      <SectionDrawer id="learn" label="Learn" defaultOpen={false}>
        <LearnItems />
      </SectionDrawer>

      {isAdmin && (
        <>
          <SidebarDivider />
          <SectionDrawer id="admin" label="Administration" defaultOpen={false}>
            <AdminItems />
          </SectionDrawer>
        </>
      )}
    </SearchAndMenu>
  );
};

/**
 * Option 3 — Pinned default band + flat entity list (no section labels).
 * Develop bundle order: Git Repositories → EEs → Collections; Operate follows with no divider.
 */
export const FlatNavSidebar = () => {
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const isAdmin = hasRole('admin');
  const showDevelop = role === 'developer' || isAdmin;
  const canSeeOps = role === 'operator' || isAdmin;
  const showInventories = canSeeOps && plugins.compliance;
  const showEdgeFleets = canSeeOps && plugins.rhem;
  const showOperate = showInventories || showEdgeFleets;

  return (
    <SearchAndMenu
      footer={
        isAdmin ? (
          <>
            <SidebarDivider />
            <SectionDrawer
              id="flat-admin"
              label="Administration"
              defaultOpen={false}
            >
              <AdminItems />
            </SectionDrawer>
          </>
        ) : undefined
      }
    >
      <ModelHint text="Option 3 (RHDH) — pins · flat entities · Admin drawer at bottom" />

      <SidebarItem icon={HomeIcon} to="/self-service/home" text="Home" />
      <SidebarItem
        icon={ViewListIcon}
        to="/self-service/resources"
        text="Catalog"
      />
      <SidebarItem icon={AddCircleOutlineIcon} to="/create" text="Templates" />
      <SidebarItem
        icon={HistoryIcon}
        to="/self-service/create/tasks"
        text="History"
      />
      <SidebarItem icon={LibraryBooks} to="docs" text="Documentation" />
      <SidebarItem
        icon={SchoolIcon}
        to="/self-service/learning"
        text="Learning Paths"
      />

      <SidebarDivider />

      {/* Develop + Operate entities — no divider between bundles; manual order in develop */}
      {showDevelop && (
        <>
          <SidebarItem
            icon={CodeIcon}
            to="/self-service/repositories"
            text="Git Repositories"
          />
          <SidebarItem
            icon={MemoryIcon}
            to="/self-service/ee"
            text="Execution Environments"
          />
          <SidebarItem
            icon={CategoryIcon}
            to="/self-service/collections"
            text="Collections"
          />
        </>
      )}
      {showOperate && (
        <>
          {showEdgeFleets && (
            <SidebarItem
              icon={RouterIcon}
              to="/self-service/edge-fleets"
              text="Edge fleets"
            />
          )}
          {showInventories && (
            <SidebarItem
              icon={StorageIcon}
              to="/self-service/inventories"
              text="Inventories"
            />
          )}
        </>
      )}
    </SearchAndMenu>
  );
};

const EXPERIENCE_LANDING: Record<NavExperience, string> = {
  automate: '/create',
  develop: '/self-service/repositories',
  compliance: '/self-service/inventories',
  edge: '/self-service/edge-fleets',
  admin: '/self-service/admin/general',
};

const useExperienceSwitchStyles = makeStyles(theme => ({
  wrap: {
    padding: theme.spacing(1, 1.5, 1.5),
  },
  select: {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
      fontSize: 13,
      fontWeight: 600,
    },
  },
}));

/** Option 2 — Experience toggle in the rail; experience name is the chrome, not a section label. */
export const ExperiencesSidebar = () => {
  const classes = useExperienceSwitchStyles();
  const navigate = useNavigate();
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const { experience, setExperience } = useNavIaModel();
  const isAdmin = hasRole('admin');
  const available = availableExperiences({
    role,
    isAdmin,
    compliance: plugins.compliance,
    rhem: plugins.rhem,
  });

  const active: NavExperience = available.includes(experience)
    ? experience
    : available[0] ?? 'automate';

  useEffect(() => {
    if (active !== experience) {
      setExperience(active);
    }
  }, [active, experience, setExperience]);

  const onExperienceChange = (next: NavExperience) => {
    setExperience(next);
    writeNavExperience(next);
    navigate(EXPERIENCE_LANDING[next]);
  };

  return (
    <SearchAndMenu>
      <ModelHint text="Option 2 — experience switcher in rail; no repeat of experience name" />

      <Box className={classes.wrap}>
        <FormControl variant="outlined" size="small" className={classes.select}>
          <InputLabel id="portal-experience-label">Experience</InputLabel>
          <Select
            labelId="portal-experience-label"
            label="Experience"
            value={active}
            onChange={e => onExperienceChange(e.target.value as NavExperience)}
          >
            {available.map(id => (
              <MenuItem key={id} value={id}>
                {EXPERIENCE_LABELS[id]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Shared run pair — every experience */}
      <AutomateItems />
      <SidebarDivider />

      {active === 'automate' && (
        <>
          <SidebarItem
            icon={ViewListIcon}
            to="/create"
            text="Browse templates"
          />
          <LearnItems />
        </>
      )}

      {active === 'develop' && (
        <>
          {/* Same entity rail as today — Quality / CI stay tabs on Git Repositories */}
          <SidebarItem
            icon={CodeIcon}
            to="/self-service/repositories"
            text="Git Repositories"
          />
          <SidebarItem
            icon={CategoryIcon}
            to="/self-service/collections"
            text="Collections"
          />
          <SidebarItem
            icon={MemoryIcon}
            to="/self-service/ee"
            text="Execution Environments"
          />
          {isAdmin && (
            <>
              <SidebarDivider />
              <SidebarSectionLabel text="Manage" />
              <SidebarItem
                icon={LinkIcon}
                to="/self-service/admin/integrations"
                text="Content sources"
              />
            </>
          )}
        </>
      )}

      {active === 'compliance' && (
        <>
          <SidebarItem
            icon={StorageIcon}
            to="/self-service/inventories"
            text="Inventories"
          />
          <SidebarItem
            icon={DashboardIcon}
            to="/self-service/compliance-dashboard"
            text="Dashboard"
          />
          <SidebarItem
            icon={VerifiedUserIcon}
            to="/self-service/inventories"
            text="Profiles"
          />
          <SidebarItem
            icon={HistoryIcon}
            to="/self-service/inventories"
            text="Scan history"
          />
          <SidebarDivider />
          <SidebarSectionLabel text="Manage" />
          <SidebarItem
            icon={SettingsIcon}
            to="/self-service/admin/integrations"
            text="Compliance settings"
          />
        </>
      )}

      {active === 'edge' && (
        <>
          <SidebarItem
            icon={RouterIcon}
            to="/self-service/edge-fleets"
            text="Fleets"
          />
          <SidebarItem
            icon={DevicesOtherIcon}
            to="/self-service/edge-devices"
            text="Devices"
          />
          <SidebarItem
            icon={PhotoLibraryIcon}
            to="/self-service/edge-images"
            text="Images"
          />
          <SidebarItem
            icon={FolderOpenIcon}
            to="/self-service/edge-repositories"
            text="Repositories"
          />
          <SidebarDivider />
          <SidebarSectionLabel text="Manage" />
          <SidebarItem
            icon={SettingsIcon}
            to="/self-service/admin/integrations"
            text="Edge settings"
          />
        </>
      )}

      {active === 'admin' && (
        <>
          <AdminItems />
          <SidebarDivider />
          <LearnItems />
        </>
      )}
    </SearchAndMenu>
  );
};
