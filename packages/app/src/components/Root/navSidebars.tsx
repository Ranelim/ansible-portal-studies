import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  useUserRoleContext,
  useNavPlugins,
  useNavIaModel,
  availableExperiences,
  writeNavExperience,
  EXPERIENCE_LABELS,
  NAV_IA_REVIEW_MODS,
  isSmeRole,
  useAdminSyncIa,
  useTemplatesRunsIa,
  type NavExperience,
  type ExperienceId,
  ASSISTANT_SIDE_NAV_TRIAL,
  isAssistantPath,
  useAssistantChatTrial,
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
  Typography,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import HistoryIcon from '@material-ui/icons/History';
import CodeIcon from '@material-ui/icons/Code';
import CategoryIcon from '@material-ui/icons/Category';
import MemoryIcon from '@material-ui/icons/Memory';
import StorageIcon from '@material-ui/icons/Storage';
import RouterIcon from '@material-ui/icons/Router';
import DashboardIcon from '@material-ui/icons/Dashboard';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import SchoolIcon from '@material-ui/icons/School';
import LinkIcon from '@material-ui/icons/Link';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import SyncIcon from '@material-ui/icons/Sync';
import ExtensionIcon from '@material-ui/icons/Extension';
import AppsIcon from '@material-ui/icons/Apps';
import NotificationsIcon from '@material-ui/icons/Notifications';
import ViewListIcon from '@material-ui/icons/ViewList';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import HomeIcon from '@material-ui/icons/Home';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { useExperienceReturnChrome } from '../IaPrototype/useExperienceReturnChrome';
import {
  EXPERIENCE_CHROME_HIT,
  ExperienceSwitcher,
} from './ExperienceSwitcher';

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

/**
 * Expandable rail item — match RHDH BackstageSidebarItem chrome (inset pill hover),
 * PF6-inspired chevron disclosure. Children indent under the parent.
 */
const useExpandableNavItemStyles = makeStyles(theme => {
  const nav = theme.palette.navigation ?? {};
  const rhdhGeneral = (theme.palette as any).rhdh?.general ?? {};
  const selectedBg =
    rhdhGeneral.sidebarItemSelectedBackgroundColor ??
    nav.navItem?.hoverBackground ??
    theme.palette.background.paper;

  return {
    root: {
      width: '100%',
    },
    // Mirror RHDH theme BackstageSidebarItem root (createComponents.esm.js).
    button: {
      display: 'flex',
      flexFlow: 'row nowrap',
      alignItems: 'center',
      height: 48,
      width: 'calc(100% - 0.5rem) !important',
      marginLeft: '0.5rem !important',
      marginRight: 0,
      marginTop: 0,
      marginBottom: 0,
      padding: 0,
      border: 'none',
      borderRadius: 6,
      background: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      font: 'inherit',
      textTransform: 'none',
      textDecorationLine: 'none',
      color: nav.color ?? theme.palette.text.primary,
      boxSizing: 'border-box',
      '&:hover, &:focus-visible': {
        backgroundColor: selectedBg,
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 0,
      },
    },
    buttonActive: {
      backgroundColor: selectedBg,
      color: nav.selectedColor ?? theme.palette.text.primary,
    },
    iconContainer: {
      boxSizing: 'border-box',
      height: '100%',
      width: sidebarConfig.iconContainerWidth,
      // Same as Backstage SidebarItem — keeps glyph on the shared icon column.
      marginRight: -theme.spacing(2),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
      flexShrink: 0,
      color: 'inherit',
    },
    label: {
      fontWeight: theme.typography.fontWeightRegular,
      whiteSpace: 'nowrap',
      flex: '3 1 auto',
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: theme.typography.fontSize,
      lineHeight: 1.4,
    },
    chevron: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      width: theme.spacing(4),
      marginRight: theme.spacing(0.5),
      color: 'inherit',
      opacity: 0.7,
    },
    children: {
      // Nest under parent label (PF6 expandable) — text-only children, no icons.
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      paddingTop: 2,
      paddingBottom: 2,
      boxSizing: 'border-box',
      width: '100%',
    },
    childLink: {
      display: 'flex',
      alignItems: 'center',
      height: 40,
      width: 'calc(100% - 0.5rem) !important',
      marginLeft: '0.5rem !important',
      // Sit under parent label (past the shared icon column).
      paddingLeft: sidebarConfig.iconContainerWidth - theme.spacing(2),
      paddingRight: theme.spacing(1),
      borderRadius: 6,
      boxSizing: 'border-box',
      color: nav.color ?? theme.palette.text.primary,
      textDecoration: 'none',
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeightRegular,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      '&:hover, &:focus-visible': {
        backgroundColor: selectedBg,
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 0,
      },
    },
    childLinkActive: {
      backgroundColor: selectedBg,
      color: nav.selectedColor ?? theme.palette.text.primary,
    },
  };
});

type ExpandableNavChildProps = {
  to: string;
  text: string;
  /** Extra path match (e.g. Quality stays selected on Remediations / Scans tabs). */
  extraActive?: (pathname: string) => boolean;
};

/** Text-only nested rail link — no icon (hierarchy from indent). */
const ExpandableNavChild = ({
  to,
  text,
  extraActive,
}: ExpandableNavChildProps) => {
  const classes = useExpandableNavItemStyles();
  const { pathname } = useLocation();
  const base = to.split('?')[0] ?? to;
  const selected =
    pathname === base ||
    (base.endsWith('/list') &&
      (pathname === '/self-service/repositories' ||
        pathname.endsWith('/repositories/list'))) ||
    (base.endsWith('/dashboard') &&
      pathname.includes('/repositories/dashboard')) ||
    extraActive?.(pathname);

  return (
    <Link
      to={to}
      className={`${classes.childLink}${
        selected ? ` ${classes.childLinkActive}` : ''
      }`}
      aria-current={selected ? 'page' : undefined}
    >
      {text}
    </Link>
  );
};

type ExpandableNavItemProps = {
  id: string;
  text: string;
  icon: ElementType;
  defaultOpen?: boolean;
  /** Highlight parent when location matches (child routes). */
  activePathPrefix?: string;
  children: ReactNode;
};

const ExpandableNavItem = ({
  id,
  text,
  icon: Icon,
  defaultOpen = true,
  activePathPrefix,
  children,
}: ExpandableNavItemProps) => {
  const classes = useExpandableNavItemStyles();
  const { pathname } = useLocation();
  const childActive = Boolean(
    activePathPrefix && pathname.startsWith(activePathPrefix),
  );

  const [open, setOpen] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAWER_STORAGE_KEY);
      if (!raw) return defaultOpen || childActive;
      const map = JSON.parse(raw) as Record<string, boolean>;
      if (typeof map[id] === 'boolean') return map[id];
      return defaultOpen || childActive;
    } catch {
      return defaultOpen || childActive;
    }
  });

  // Keep open when navigating into a child route.
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

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
    <Box className={classes.root}>
      <button
        type="button"
        className={`${classes.button}${
          childActive ? ` ${classes.buttonActive}` : ''
        }`}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`nav-expandable-${id}`}
      >
        <span className={classes.iconContainer} aria-hidden>
          <Icon fontSize="small" />
        </span>
        <Typography className={classes.label} component="span">
          {text}
        </Typography>
        <span className={classes.chevron} aria-hidden>
          {open ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <ChevronRightIcon fontSize="small" />
          )}
        </span>
      </button>
      <Collapse in={open} id={`nav-expandable-${id}`}>
        <Box className={classes.children}>{children}</Box>
      </Collapse>
    </Box>
  );
};

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
      {/* Long experience rails must scroll — stock
          drawer uses flexShrink:0 + hidden scrollbar and clips overflow. */}
      <Box
        data-portal-sidebar-scroll=""
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          width: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
        }}
      >
        {children}
      </Box>
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
    <SidebarItem
      icon={AddCircleOutlineIcon}
      to="/create?scope=experience"
      text="Templates"
    />
    <SidebarItem
      icon={HistoryIcon}
      to="/self-service/create/tasks"
      text="Runs"
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

const AdminItems = () => {
  const { variant } = useAdminSyncIa();
  const showSyncRail = variant === 'opt2';

  return (
    <>
      <SidebarItem
        icon={DashboardIcon}
        to="/self-service/admin/overview"
        text="Dashboard"
      />
      <SidebarItem
        icon={LinkIcon}
        to="/self-service/admin/integrations"
        text="Integrations"
      />
      {showSyncRail && (
        <SidebarItem
          icon={SyncIcon}
          to="/self-service/admin/sync-activity"
          text="Sync activity"
        />
      )}
      <SidebarItem icon={VpnKeyIcon} to="rbac" text="Access Control" />
      <SidebarItem
        icon={AppsIcon}
        to="/self-service/admin/experiences"
        text="Experiences"
      />
      <SidebarItem
        icon={ExtensionIcon}
        to="/self-service/admin/plugins"
        text="Plugins"
      />
      <SidebarItem
        icon={NotificationsIcon}
        to="/self-service/admin/notifications"
        text="Notifications"
      />
    </>
  );
};

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
      text="Execution Env."
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
 * Option 4 (hybrid) — gated Home: Dashboard + Search.
 * Same gate as Opt 3 homeband (Develop / Operate / Admin present).
 */
const GatedHomeSection = () => (
  <>
    <SidebarSectionLabel text="Home" />
    <SidebarItem
      icon={DashboardIcon}
      to="/self-service/home-dashboard"
      text="Dashboard"
    />
    <SidebarItem icon={SearchIcon} to="/search" text="Search" />
    <SidebarDivider />
  </>
);

/**
 * Option 2 — pins + job-band sections (recommended).
 * Top stack: Home + Templates + Activity (unlabeled). Then Develop / Operate /
 * Learn / Administration. Empty Operate omitted. No Catalog. Rail Search kept.
 * Option 4 (hybrid) reuses this rail without Home pin, with Run label, without
 * floating rail Search, plus a gated Home section (Dashboard + Search) when
 * Develop / Operate / Admin are present.
 */
export const BaselineSidebar = ({
  showSearch = true,
  showRunLabel = false,
  showHomePin = true,
  showGatedHomeSection = false,
}: {
  showSearch?: boolean;
  /** When true, label Templates + Activity as “Run” (Option 4). */
  showRunLabel?: boolean;
  /** Home pin → /self-service/home (Option 2). Off for Option 4. */
  showHomePin?: boolean;
  /** Gated Home section: Dashboard + Search (Option 4). */
  showGatedHomeSection?: boolean;
} = {}) => {
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const isAdmin = hasRole('admin');
  const showDevelop = role === 'developer' || isAdmin;
  const canSeeOps = role === 'operator' || isAdmin;
  const showInventories = canSeeOps && plugins.compliance;
  const showEdgeFleets = canSeeOps && plugins.rhem;
  const showOperate = showInventories || showEdgeFleets;
  const hasOtherBands = showDevelop || showOperate || isAdmin;

  return (
    <SearchAndMenu showSearch={showSearch}>
      {showGatedHomeSection && hasOtherBands && <GatedHomeSection />}
      {showRunLabel && <SidebarSectionLabel text="Run" />}
      {showHomePin && (
        <SidebarItem icon={HomeIcon} to="/self-service/home" text="Home" />
      )}
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
      <SidebarItem
        icon={AddCircleOutlineIcon}
        to="/create?scope=experience"
        text="Templates"
      />
      <SidebarItem
        icon={HistoryIcon}
        to="/self-service/create/tasks"
        text="Runs"
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
            text="Execution Env."
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
 * Option 4 — job-band rail with labeled Run; no floating rail Search.
 * When Develop / Operate / Admin are present: gated Home section (Dashboard +
 * Search) — same gate as Option 3. SME stays lean (Run + Learn).
 * Header OmniSearch remains for SME; multi-band also gets Home → Search.
 */
export const PinsBundlesSidebar = () => (
  <BaselineSidebar
    showSearch={false}
    showRunLabel
    showHomePin={false}
    showGatedHomeSection
  />
);

/**
 * Option 3 — fork of Option 2 with a labeled Home band first:
 * Dashboard (if non-default bands on) + Search + Templates + Activity + Learn.
 * Then Develop / Operate / Administration by seat. No Outcomes.
 * When Home is the only band (SME), omit section label/drawer — flat pins only.
 */
export const HomeBandSidebar = () => {
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const isAdmin = hasRole('admin');
  const showDevelop = role === 'developer' || isAdmin;
  const canSeeOps = role === 'operator' || isAdmin;
  const showInventories = canSeeOps && plugins.compliance;
  const showEdgeFleets = canSeeOps && plugins.rhem;
  const showOperate = showInventories || showEdgeFleets;
  /** Other bands present → Home is a real section (label + drawer + Dashboard). */
  const hasOtherBands = showDevelop || showOperate || isAdmin;

  const homeItems = (
    <>
      {hasOtherBands && (
        <SidebarItem
          icon={DashboardIcon}
          to="/self-service/home-dashboard"
          text="Dashboard"
        />
      )}
      <SidebarItem icon={SearchIcon} to="/search" text="Search" />
      <RunPins />
      <LearnItems />
    </>
  );

  return (
    <SearchAndMenu showSearch={false}>
      {hasOtherBands ? (
        <SectionDrawer id="homeband-home" label="Home" defaultOpen>
          {homeItems}
        </SectionDrawer>
      ) : (
        homeItems
      )}
      {showDevelop && (
        <>
          <SidebarDivider />
          <SectionDrawer id="homeband-develop" label="Develop" defaultOpen>
            <DevelopEntityItems />
          </SectionDrawer>
        </>
      )}
      {showOperate && (
        <>
          <SidebarDivider />
          <SectionDrawer id="homeband-operate" label="Operate" defaultOpen>
            <OperateEntityItems
              showInventories={showInventories}
              showEdgeFleets={showEdgeFleets}
            />
          </SectionDrawer>
        </>
      )}
      {isAdmin && (
        <>
          <SidebarDivider />
          <SectionDrawer
            id="homeband-admin"
            label="Administration"
            defaultOpen={false}
          >
            <AdminItems />
          </SectionDrawer>
        </>
      )}
    </SearchAndMenu>
  );
};

const EXPERIENCE_DASHBOARD = '/self-service/experience-dashboard';

/** Run pair — Templates + Runs (siblings). Grouped in rail via runPairCluster. */
const RunItems = () => (
  <>
    <SidebarItem
      icon={AddCircleOutlineIcon}
      to="/create?scope=experience"
      text="Templates"
    />
    <SidebarItem
      icon={HistoryIcon}
      to="/self-service/create/tasks"
      text="Runs"
    />
  </>
);

/**
 * Bundled option — one Automate rail item; page tabs Templates | Runs.
 * `to` follows the active path so the item stays highlighted on Runs.
 */
const BundledAutomateRailItem = () => {
  const { pathname } = useLocation();
  const onRuns = pathname.startsWith('/self-service/create/tasks');

  return (
    <SidebarItem
      icon={PlayArrowIcon}
      to={
        onRuns
          ? '/self-service/create/tasks'
          : '/create?scope=experience'
      }
      text="Automate"
    />
  );
};

const useQuietReturnStyles = makeStyles(theme => ({
  /** Option A — “← Experiences” aligned to the SidebarItem icon column. */
  quietReturn: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    margin: 0,
    padding: theme.spacing(0.5, 1, 0.25, 0),
    border: 'none',
    background: 'transparent',
    borderRadius: 0,
    cursor: 'pointer',
    color: theme.palette.text.secondary,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.3,
    textAlign: 'left' as const,
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.action.hover,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: -2,
    },
  },
  /** Matches SidebarItem iconContainer: 8px item inset + centered 24px hit (= icon gutter 32). */
  iconCol: {
    boxSizing: 'border-box' as const,
    width: sidebarConfig.iconContainerWidth,
    minWidth: sidebarConfig.iconContainerWidth,
    marginLeft: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quietIcon: {
    fontSize: 18,
    opacity: 0.85,
  },
  /** Option B — chevron + experience switcher on one row. */
  labelReturnRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '10px 8px 8px 0',
    gap: 4,
    minHeight: EXPERIENCE_CHROME_HIT,
  },
  /** Square chip at the 32px gutter — same left edge as fedora / SidebarItem glyph. */
  labelReturnHit: {
    boxSizing: 'border-box' as const,
    width: EXPERIENCE_CHROME_HIT,
    minWidth: EXPERIENCE_CHROME_HIT,
    marginLeft: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labelReturnBtn: {
    appearance: 'none' as const,
    width: EXPERIENCE_CHROME_HIT,
    height: EXPERIENCE_CHROME_HIT,
    minWidth: EXPERIENCE_CHROME_HIT,
    padding: 0,
    margin: 0,
    border: 'none',
    borderRadius: 4,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: theme.palette.text.secondary,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255,255,255,0.14)'
          : 'rgba(0,0,0,0.1)',
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 1,
    },
  },
  labelReturnChevron: {
    fontSize: 18,
  },
  labelReturnText: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color: theme.palette.text.secondary,
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  switchSlot: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  softDiv: {
    margin: theme.spacing(0.5, 2, 0.5),
    border: 'none',
    borderTop: `1px solid ${
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(0,0,0,0.08)'
    }`,
  },
}));

const useAssistantRailStyles = makeStyles(theme => ({
  /** Same icon column as return chevron / SidebarItem (gutter align). */
  iconCol: {
    boxSizing: 'border-box' as const,
    width: sidebarConfig.iconContainerWidth,
    minWidth: sidebarConfig.iconContainerWidth,
    marginLeft: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    margin: theme.spacing(0.25, 0),
    padding: theme.spacing(0.5, 1, 0.5, 0),
    border: 'none',
    borderRadius: 0,
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left' as const,
    color: theme.palette.text.primary,
    fontSize: 14,
    lineHeight: 1.3,
    boxSizing: 'border-box' as const,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: -2,
    },
  },
  rowActive: {
    // Gemini-like selected pill on the rail row.
    marginLeft: 8,
    marginRight: 8,
    width: 'calc(100% - 16px)',
    borderRadius: 20,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(255,255,255,0.72)',
    fontWeight: 600,
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    // Match SidebarItem label pull toward icon column.
    marginLeft: -theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  historyLabel: {
    display: 'block',
    // Align with rowLabel (after icon column), not further indented.
    padding: theme.spacing(1, 1, 0.5, 0),
    marginLeft: 8 + sidebarConfig.iconContainerWidth - theme.spacing(1),
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  },
  threadTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
}));

/**
 * Assistant side-nav trial — return chrome + New chat + history.
 * ROLLBACK: `ASSISTANT_SIDE_NAV_TRIAL = false` in assistantIaTrial.ts
 */
const AssistantSidebarRail = () => {
  const quietClasses = useQuietReturnStyles();
  const classes = useAssistantRailStyles();
  const navigate = useNavigate();
  const { role } = useUserRoleContext();
  const smeLocked = isSmeRole(role);
  const { variant: returnChrome } = useExperienceReturnChrome();
  const { activeId, isNewChat, recents, newChat, selectChat, clearHistory } =
    useAssistantChatTrial();

  const showQuietReturn = !smeLocked && returnChrome === 'quiet';
  const showLabelReturn = !smeLocked && returnChrome === 'waffle';
  const goExperiences = () => navigate('/self-service/experiences');

  return (
    <SearchAndMenu showSearch={false}>
      {showQuietReturn && (
        <button
          type="button"
          className={quietClasses.quietReturn}
          onClick={goExperiences}
          aria-label="Back to Experiences"
        >
          <span className={quietClasses.iconCol} aria-hidden>
            <ArrowBackIcon className={quietClasses.quietIcon} />
          </span>
          Experiences
        </button>
      )}

      {showLabelReturn ? (
        <Box className={quietClasses.labelReturnRow}>
          <span className={quietClasses.labelReturnHit}>
            <button
              type="button"
              className={quietClasses.labelReturnBtn}
              onClick={goExperiences}
              aria-label="Back to Experiences"
              title="Back to Experiences"
            >
              <ChevronLeftIcon className={quietClasses.labelReturnChevron} />
            </button>
          </span>
          <Typography
            className={quietClasses.labelReturnText}
            component="span"
          >
            Assistant
          </Typography>
        </Box>
      ) : (
        !showQuietReturn && <SidebarSectionLabel text="Assistant" />
      )}

      {showQuietReturn && <SidebarSectionLabel text="Assistant" />}

      {/* Soft gap — experience name vs menu (same as other experience rails). */}
      <SidebarSpacer />

      <button
        type="button"
        className={`${classes.row}${isNewChat ? ` ${classes.rowActive}` : ''}`}
        onClick={() => {
          newChat();
          navigate('/self-service/assistant');
        }}
        aria-label="New chat"
        aria-current={isNewChat ? 'page' : undefined}
      >
        <span className={classes.iconCol} aria-hidden>
          <AddCircleOutlineIcon style={{ fontSize: 18 }} />
        </span>
        <span className={classes.rowLabel}>New chat</span>
      </button>

      {recents.length > 0 && (
        <>
          <SidebarSpacer />
          <span className={classes.historyLabel}>Recents</span>
          {recents.map(thread => (
            <button
              key={thread.id}
              type="button"
              className={`${classes.row}${
                thread.id === activeId ? ` ${classes.rowActive}` : ''
              }`}
              onClick={() => {
                selectChat(thread.id);
                navigate('/self-service/assistant');
              }}
              aria-current={thread.id === activeId ? 'page' : undefined}
            >
              <span className={classes.iconCol} aria-hidden />
              <span className={`${classes.rowLabel} ${classes.threadTitle}`}>
                {thread.title}
              </span>
            </button>
          ))}
        </>
      )}

      {recents.length > 0 && (
        <>
          <SidebarSpacer />
          <button
            type="button"
            className={classes.row}
            onClick={() => clearHistory()}
            aria-label="Clear chat history"
            style={{ color: 'inherit', opacity: 0.85 }}
          >
            <span className={classes.iconCol} aria-hidden>
              <DeleteOutlineIcon style={{ fontSize: 18 }} />
            </span>
            <span className={classes.rowLabel}>Clear history</span>
          </button>
        </>
      )}
    </SearchAndMenu>
  );
};

/**
 * Experience domain rail (Bridge is rail-less — see Root).
 * Return chrome A/B via magenta compare bar (temp).
 * Section label = current experience (orientation; not a switcher).
 */
export const ExperiencesSidebar = () => {
  const { pathname } = useLocation();
  if (ASSISTANT_SIDE_NAV_TRIAL && isAssistantPath(pathname)) {
    return <AssistantSidebarRail />;
  }
  return <ExperiencesDomainSidebar />;
};

const ExperiencesDomainSidebar = () => {
  const quietClasses = useQuietReturnStyles();
  const navigate = useNavigate();
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const { experience, setExperience } = useNavIaModel();
  const { variant: returnChrome } = useExperienceReturnChrome();
  const { variant: runPairIa } = useTemplatesRunsIa();
  const automateRail = runPairIa === 'automate-rail';
  const isAdmin = hasRole('admin');
  const smeLocked = isSmeRole(role);
  const available = availableExperiences({
    role,
    isAdmin,
    compliance: plugins.compliance,
    rhem: plugins.rhem,
  });

  const active: NavExperience = available.includes(experience)
    ? experience
    : available[0] ?? 'automate';

  // SME: force Automate. Multi-seat: coerce invalid away from Bridge 'all'.
  useEffect(() => {
    let next = active;
    if (next === 'all') {
      next =
        smeLocked
          ? 'automate'
          : available.find(id => id !== 'all') ?? 'automate';
    }
    if (next !== experience) {
      setExperience(next);
      writeNavExperience(next);
    }
  }, [active, experience, setExperience, smeLocked, available]);

  /**
   * Experience Settings rail omitted until real personal prefs exist.
   * Platform sync / integrations stay in Administration; page route kept for later.
   */
  /** Experience Dashboard — overview; entity items stay list-first. */
  const ExperienceDashboardItem = (
    <SidebarItem
      icon={DashboardIcon}
      to={EXPERIENCE_DASHBOARD}
      text="Dashboard"
      end
    />
  );

  const domain =
    active === 'all'
      ? smeLocked
        ? 'automate'
        : available.find(id => id !== 'all') ?? 'automate'
      : active;

  const experienceLabel =
    EXPERIENCE_LABELS[domain] ?? EXPERIENCE_LABELS.develop;

  const jobAvailable = available.filter(
    (id): id is ExperienceId => id !== 'all' && id !== 'admin',
  );
  const currentJob: ExperienceId =
    domain === 'admin' || domain === 'all'
      ? jobAvailable[0] ?? 'develop'
      : domain;

  const showQuietReturn = !smeLocked && returnChrome === 'quiet';
  const showLabelReturn = !smeLocked && returnChrome === 'waffle';

  const goExperiences = () => navigate('/self-service/experiences');

  /** Templates · Runs (or bundled Automate) — soft gap only, no hard rules. */
  const ExperienceRunPair =
    runPairIa === 'masthead-plus' ? (
      <>
        <BundledAutomateRailItem />
        <SidebarSpacer />
      </>
    ) : (
      <>
        <RunItems />
        <SidebarSpacer />
      </>
    );

  return (
    <SearchAndMenu showSearch={false}>
      {/* A — quiet “← Experiences” above the label. */}
      {showQuietReturn && (
        <button
          type="button"
          className={quietClasses.quietReturn}
          onClick={goExperiences}
          aria-label="Back to Experiences"
        >
          <span className={quietClasses.iconCol} aria-hidden>
            <ArrowBackIcon className={quietClasses.quietIcon} />
          </span>
          Experiences
        </button>
      )}

      {/* B — left chevron beside experience name (icon-column aligned). */}
      {showLabelReturn ? (
        <Box className={quietClasses.labelReturnRow}>
          <span className={quietClasses.labelReturnHit}>
            <button
              type="button"
              className={quietClasses.labelReturnBtn}
              onClick={goExperiences}
              aria-label="Back to Experiences"
              title="Back to Experiences"
            >
              <ChevronLeftIcon className={quietClasses.labelReturnChevron} />
            </button>
          </span>
          <span className={quietClasses.switchSlot}>
            <ExperienceSwitcher
              current={currentJob}
              available={jobAvailable}
            />
          </span>
        </Box>
      ) : (
        !showQuietReturn && <SidebarSectionLabel text={experienceLabel} />
      )}

      {/* A keeps a normal section label under the quiet return. */}
      {showQuietReturn && <SidebarSectionLabel text={experienceLabel} />}

      {/* Soft gap — experience name vs menu (invisible spacer, not a rule). */}
      <SidebarSpacer />

      {/* A: Automate = Templates · Runs only (no Learn). B is rail-less — skip. */}
      {domain === 'automate' && automateRail && <RunItems />}

      {/* Develop — Git Repositories expandable; Quality is nested (tabs on the page). */}
      {domain === 'develop' && (
        <>
          {ExperienceDashboardItem}
          {ExperienceRunPair}
          <ExpandableNavItem
            id="develop-git-repos"
            icon={CodeIcon}
            text="Git Repositories"
            activePathPrefix="/self-service/repositories"
            defaultOpen
          >
            <ExpandableNavChild
              to="/self-service/repositories/list"
              text="Repositories"
            />
            <ExpandableNavChild
              to="/self-service/repositories/dashboard"
              text="Quality"
              extraActive={pathname =>
                pathname.includes('/repositories/remediations') ||
                pathname.includes('/repositories/scans')
              }
            />
          </ExpandableNavItem>
          <SidebarItem
            icon={CategoryIcon}
            to="/self-service/collections"
            text="Collections"
          />
          <SidebarItem
            icon={MemoryIcon}
            to="/self-service/ee"
            text="Execution Env."
          />
          <SidebarSpacer />
          <LearnItems />
        </>
      )}

      {domain === 'compliance' && (
        <>
          {ExperienceDashboardItem}
          {ExperienceRunPair}
          <SidebarItem
            icon={StorageIcon}
            to="/self-service/inventories"
            text="Inventories"
          />
          <SidebarSpacer />
          <LearnItems />
        </>
      )}

      {domain === 'edge' && (
        <>
          {ExperienceDashboardItem}
          {ExperienceRunPair}
          <SidebarItem
            icon={RouterIcon}
            to="/self-service/edge-fleets"
            text="Edge fleets"
          />
          <SidebarSpacer />
          <LearnItems />
        </>
      )}

      {domain === 'admin' && <AdminItems />}
    </SearchAndMenu>
  );
};
