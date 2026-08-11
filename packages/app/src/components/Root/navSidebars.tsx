import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useUserRoleContext,
  useNavPlugins,
  useNavIaModel,
  availableExperiences,
  EXPERIENCE_LABELS,
  writeNavExperience,
  NAV_IA_REVIEW_MODS,
  isSmeRole,
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
import DashboardIcon from '@material-ui/icons/Dashboard';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import SchoolIcon from '@material-ui/icons/School';
import SettingsIcon from '@material-ui/icons/Settings';
import LinkIcon from '@material-ui/icons/Link';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import SyncIcon from '@material-ui/icons/Sync';
import ViewListIcon from '@material-ui/icons/ViewList';
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

/** Collapsible section drawer (job/theme band) — used by flat Admin + experiences Admin. */
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

/** Same shell as team app Root — Backstage sidebar search + menu (parity with main). */
const SearchAndMenu = ({
  children,
  footer,
  showSearch = true,
}: {
  children: ReactNode;
  /** Pinned below a flex spacer (e.g. Administration drawer). */
  footer?: ReactNode;
  /** When false, omit floating Search rail item (header OmniSearch remains). */
  showSearch?: boolean;
}) => (
  <Sidebar>
    <SidebarSpacer />
    {showSearch && (
      <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
        <SidebarSearchModal />
      </SidebarGroup>
    )}
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

/** Global run pins — portal-wide Templates + Activity (not a peer domain section). */
const RunPins = () => <AutomateItems />;

const DevelopEntityItems = () => (
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
);

const OperateEntityItems = ({
  showInventories,
  showEdgeFleets,
}: {
  showInventories: boolean;
  showEdgeFleets: boolean;
}) => (
  <>
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
  </>
);

/**
 * Option 2 — pins + job-band sections (recommended).
 * Top stack (like Option 1): Templates + Activity with no section label.
 * Then labeled bands: Develop / Operate / Learn / Administration (by seat + plugins).
 * Empty Operate omitted. No Home/Catalog pins. Rail Search kept.
 * Option 4 reuses this rail with rail Search omitted (header search only).
 */
export const BaselineSidebar = ({
  showSearch = true,
}: {
  showSearch?: boolean;
} = {}) => {
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const isAdmin = hasRole('admin');
  const showDevelop = role === 'developer' || isAdmin;
  const canSeeOps = role === 'operator' || isAdmin;
  const showInventories = canSeeOps && plugins.compliance;
  const showEdgeFleets = canSeeOps && plugins.rhem;
  const showOperate = showInventories || showEdgeFleets;

  return (
    <SearchAndMenu showSearch={showSearch}>
      {/* Default pins — unlabeled (portal-wide Templates + Activity) */}
      <RunPins />
      {showDevelop && (
        <>
          <SidebarDivider />
          <SidebarSectionLabel text="Develop" />
          <DevelopEntityItems />
        </>
      )}
      {showOperate && (
        <>
          <SidebarDivider />
          <SidebarSectionLabel text="Operate" />
          <OperateEntityItems
            showInventories={showInventories}
            showEdgeFleets={showEdgeFleets}
          />
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
 * Option 1 — Pinned default band + flat entity list (no section labels).
 * One rail item per primary entity; ecosystem lives on the entity surface.
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
  const hideCatalogForSme = NAV_IA_REVIEW_MODS && isSmeRole(role);

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
      <SidebarItem icon={HomeIcon} to="/self-service/home" text="Home" />
      {!hideCatalogForSme && (
        <SidebarItem
          icon={ViewListIcon}
          to="/self-service/resources"
          text="Catalog"
        />
      )}
      <SidebarItem icon={AddCircleOutlineIcon} to="/create" text="Templates" />
      <SidebarItem
        icon={HistoryIcon}
        to="/self-service/create/tasks"
        text="Activity"
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

/**
 * Option 4 — same job-band rail as Option 2 (seat-adaptive), without rail Search.
 * Header OmniSearch remains the entry; /search stays the full results page.
 */
export const PinsBundlesSidebar = () => (
  <BaselineSidebar showSearch={false} />
);

const EXPERIENCE_LANDING: Record<NavExperience, string> = {
  all: '/self-service/experiences',
  automate: '/create',
  develop: '/self-service/experience-dashboard',
  compliance: '/self-service/experience-dashboard',
  edge: '/self-service/experience-dashboard',
  admin: '/self-service/admin/general',
};

const EXPERIENCE_DASHBOARD = '/self-service/experience-dashboard';

const useExperienceSwitchStyles = makeStyles(theme => ({
  wrap: {
    display: 'block',
    boxSizing: 'border-box',
    // Full width between side margins (do not touch panel borders)
    width: `calc(100% - ${theme.spacing(3)}px)`,
    marginLeft: theme.spacing(1.5),
    marginRight: theme.spacing(1.5),
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(1.5),
    padding: 0,
  },
  select: {
    width: '100%',
    display: 'block',
    '& .MuiInputBase-root, & .MuiOutlinedInput-root': {
      width: '100%',
      borderRadius: 4,
      fontSize: 13,
      fontWeight: 600,
      backgroundColor: theme.palette.background.paper,
    },
  },
}));

/** Run pair — Templates + Activity (same labels as curated Run band). */
const RunItems = () => (
  <>
    <SidebarItem icon={AddCircleOutlineIcon} to="/create" text="Templates" />
    <SidebarItem
      icon={HistoryIcon}
      to="/self-service/create/tasks"
      text="Activity"
    />
  </>
);

/** Option 3 — Experience toggle in the rail; experience name is the chrome, not a section label. */
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
    : available[0] ?? 'all';

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

  /** Trailing Settings — experience prefs; platform Admin stays in Administration. */
  const ExperienceSettingsItem = (
    <SidebarItem
      icon={SettingsIcon}
      to="/self-service/experience-settings"
      text="Settings"
    />
  );

  /** Experience Dashboard — overview; entity items stay list-first. */
  const ExperienceDashboardItem = (
    <SidebarItem
      icon={DashboardIcon}
      to={EXPERIENCE_DASHBOARD}
      text="Dashboard"
      end
    />
  );

  return (
    <SearchAndMenu>
      <Box className={classes.wrap}>
        <FormControl
          variant="outlined"
          size="small"
          fullWidth
          className={classes.select}
        >
          <InputLabel id="portal-experience-label">Experience</InputLabel>
          <Select
            labelId="portal-experience-label"
            label="Experience"
            value={active}
            fullWidth
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

      {/* All (Home) — Bridge: Dashboard + Experiences; Plugins = admin only */}
      {active === 'all' && (
        <>
          <SidebarItem
            icon={DashboardIcon}
            to="/self-service/experiences"
            text="Dashboard"
            end
          />
          <SidebarItem
            icon={ViewListIcon}
            to="/self-service/experiences/catalog"
            text="Experiences"
          />
          {NAV_IA_REVIEW_MODS && isSmeRole(role) && <RunItems />}
          {isAdmin && (
            <SidebarItem
              icon={CategoryIcon}
              to="/self-service/experiences/plugins"
              text="Plugins"
            />
          )}
          {ExperienceSettingsItem}
        </>
      )}

      {/* Continuous list: Dashboard + Templates + Activity + entities + Settings */}
      {active === 'automate' && (
        <>
          <RunItems />
          <SidebarItem
            icon={ViewListIcon}
            to="/self-service/resources"
            text="Catalog"
          />
          {ExperienceSettingsItem}
        </>
      )}

      {active === 'develop' && (
        <>
          {ExperienceDashboardItem}
          <RunItems />
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
          {ExperienceSettingsItem}
        </>
      )}

      {active === 'compliance' && (
        <>
          {ExperienceDashboardItem}
          <RunItems />
          <SidebarItem
            icon={StorageIcon}
            to="/self-service/inventories"
            text="Inventories"
          />
          {ExperienceSettingsItem}
        </>
      )}

      {active === 'edge' && (
        <>
          {ExperienceDashboardItem}
          <RunItems />
          <SidebarItem
            icon={RouterIcon}
            to="/self-service/edge-fleets"
            text="Edge fleets"
          />
          {ExperienceSettingsItem}
        </>
      )}

      {/* Administration experience — platform config only */}
      {active === 'admin' && <AdminItems />}
    </SearchAndMenu>
  );
};
