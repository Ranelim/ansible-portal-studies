import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Typography,
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
import ExtensionIcon from '@material-ui/icons/Extension';
import ViewListIcon from '@material-ui/icons/ViewList';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import HomeIcon from '@material-ui/icons/Home';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { useExperienceReturnChrome } from '../IaPrototype/useExperienceReturnChrome';

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

const AdminItems = () => {
  const { variant } = useAdminSyncIa();
  const showSyncRail = variant !== 'opt1';
  const syncLabel = variant === 'opt2' ? 'Sync activity' : 'Sync';

  return (
    <>
      <SidebarItem
        icon={DashboardIcon}
        to="/self-service/admin/overview"
        text="Overview"
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
          text={syncLabel}
        />
      )}
      <SidebarItem icon={VpnKeyIcon} to="rbac" text="Access Control" />
      <SidebarItem
        icon={ExtensionIcon}
        to="/self-service/admin/plugins"
        text="Plugins"
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
  /** Matches Backstage SidebarItem iconContainer (72px, centered). */
  iconCol: {
    boxSizing: 'border-box' as const,
    width: sidebarConfig.iconContainerWidth,
    minWidth: sidebarConfig.iconContainerWidth,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quietIcon: {
    fontSize: 18,
    opacity: 0.85,
  },
  /** Option B — chevron + experience label on one row. */
  labelReturnRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '10px 8px 8px 0',
    minHeight: 32,
  },
  labelReturnBtn: {
    appearance: 'none' as const,
    width: 24,
    height: 24,
    minWidth: 24,
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
    // Pull toward icon column like SidebarItem label (iconContainer has -16px marginRight).
    marginLeft: -theme.spacing(1),
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

/**
 * Experience domain rail (Bridge is rail-less — see Root).
 * Return chrome A/B via magenta compare bar (temp).
 * Section label = current experience (orientation; not a switcher).
 */
export const ExperiencesSidebar = () => {
  const quietClasses = useQuietReturnStyles();
  const navigate = useNavigate();
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const { experience, setExperience } = useNavIaModel();
  const { variant: returnChrome } = useExperienceReturnChrome();
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

  // SME: force Automate. Multi-seat: coerce invalid experience away from Bridge 'all'.
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

  const domain =
    active === 'all'
      ? smeLocked
        ? 'automate'
        : available.find(id => id !== 'all') ?? 'automate'
      : active;

  const experienceLabel =
    EXPERIENCE_LABELS[domain] ?? EXPERIENCE_LABELS.automate;

  const showQuietReturn = !smeLocked && returnChrome === 'quiet';
  const showLabelReturn = !smeLocked && returnChrome === 'waffle';

  const goExperiences = () => navigate('/self-service/experiences');

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
        <>
          <Box className={quietClasses.labelReturnRow}>
            <span className={quietClasses.iconCol}>
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
              {experienceLabel}
            </Typography>
          </Box>
          <hr className={quietClasses.softDiv} />
        </>
      ) : (
        !showQuietReturn && <SidebarSectionLabel text={experienceLabel} />
      )}

      {/* A keeps a normal section label under the quiet return. */}
      {showQuietReturn && <SidebarSectionLabel text={experienceLabel} />}

      {domain === 'automate' && (
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

      {domain === 'develop' && (
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

      {domain === 'compliance' && (
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

      {domain === 'edge' && (
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

      {domain === 'admin' && <AdminItems />}
    </SearchAndMenu>
  );
};
