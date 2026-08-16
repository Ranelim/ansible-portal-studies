import { PropsWithChildren, useEffect } from 'react';
import { makeStyles, Box, Typography, Button } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import { useLocation } from 'react-router-dom';
import {
  FORCED_ADMIN_SYNC_IA,
  FORCED_TEMPLATES_RUNS_IA,
  RestartProvider,
  useRestartRequired,
  useNavIaModel,
  writeNavExperience,
  useTemplatesRunsIa,
  useUserRoleContext,
  isSmeRole,
} from '@ansible/plugin-backstage-self-service';
import { SidebarPage } from '@backstage/core-components';
import { ExperiencesSidebar } from './navSidebars';
import {
  GlobalShellResumeBar,
  isBridgePath,
  isGlobalShellPath,
  isGlobalTemplatesRunsPath,
  useCaptureGlobalShellReturn,
} from './GlobalShellResumeBar';
import { isAutomateFullPagePath } from './AutomateFullPageChrome';
import {
  CHROME_TOP_BASE,
  MASTHEAD_HEIGHT,
  RAIL_ICON_GUTTER_PX,
  chromeTopForPrototypeBars,
  NavIaRouteGuard,
} from '../IaPrototype';
import { ExperienceRunPairTabs } from '../IaPrototype/ExperienceRunPairTabs';

const useRootStyles = makeStyles(theme => {
  const rhdhGeneral = (theme.palette as any).rhdh?.general ?? {};
  // Stock RHDH light AppBar = #f2f2f2 (same as sidebar); dark = #151515.
  // Do NOT use background.paper (#fff) — that was an accidental Portal override.
  const appBarBg =
    rhdhGeneral.appBarBackgroundColor ??
    (theme.palette.type === 'dark' ? '#151515' : '#f2f2f2');
  const appBarFg =
    rhdhGeneral.appBarForegroundColor ?? theme.palette.text.primary;

  return {
  '@global': {
    // RHDH GlobalHeaderComponent ships sticky; this app shells it as a sibling
    // outside SidebarPage — pin fixed so rail/content clearances stay correct.
    '#global-header': {
      position: 'fixed !important' as any,
      top: 0,
      left: 0,
      right: 0,
      zIndex: theme.zIndex.drawer + 1,
      // Match RHDH MuiAppBar override (appBarBackgroundColor). Keep text/icon
      // overrides — Backstage <Link> still resolves to primary.blue otherwise.
      backgroundColor: `${appBarBg} !important`,
      color: `${appBarFg} !important`,
      // MUI v5 prefix = v5-MuiToolbar-root (not .MuiToolbar-root) — attribute match required
      '& [class*="MuiToolbar-root"]': {
        color: appBarFg,
        minHeight: `${MASTHEAD_HEIGHT}px !important`,
        alignItems: 'center',
        // Lock masthead left to page gutter so waffle aligns with TEMP / Back / Header.
        paddingLeft: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
        paddingRight: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
      },
      // Masthead action grid — identical 32×32 hits (Create / Starred / Help / Bell).
      '& [class*="MuiToolbar-root"] > *': {
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'center',
      },
      // Glyph grid — beat MuiSvgIcon-fontSizeMedium (24px) on toolbar actions.
      '& [class*="MuiToolbar-root"] [class*="MuiIconButton-root"] [class*="MuiSvgIcon-root"]':
        {
          fontSize: '20px !important',
          width: '20px !important',
          height: '20px !important',
        },
      '& .MuiIconButton-root, & .MuiButton-root, & [class*="MuiIconButton-root"], & [class*="MuiButton-root"]':
        {
          color: theme.palette.text.secondary,
        },
      '& .MuiIconButton-root:hover, & .MuiButton-root:hover, & [class*="MuiIconButton-root"]:hover, & [class*="MuiButton-root"]:hover':
        {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.action.hover,
        },
      // Route-active — prefer data-masthead-active (Tooltip freezes IconButton props).
      '& [data-masthead-active="true"], & [data-masthead-active="true"] [class*="MuiIconButton-root"]':
        {
          color: `${theme.palette.text.primary} !important`,
          backgroundColor: `${theme.palette.action.selected} !important`,
        },
      // Open Starred / Help — wrapper flag (Menu portals; Tooltip freezes sx).
      '& [data-masthead-menu-open="true"] [class*="MuiIconButton-root"]': {
        color: `${theme.palette.text.primary} !important`,
        backgroundColor: `${theme.palette.action.selected} !important`,
      },
      '& .MuiSvgIcon-root, & [class*="MuiSvgIcon-root"]': {
        color: 'inherit',
      },
      // Backstage Link paints primary blue — kill that inside the masthead.
      // Do not restyle IconButtons that happen to be anchors (inherit would force ink black).
      '& a:not([class*="MuiIconButton"]), & a:not([class*="MuiIconButton"]):hover, & a:not([class*="MuiIconButton"]):visited':
        {
          color: 'inherit',
          textDecoration: 'none',
        },
    },
    // JSS hashes class names (e.g. BackstageSidebar-root-83) — use substring match
    // so the rail clears the masthead (+ Admin Sync bar when --portal-chrome-top is set).
    '[class*="BackstageSidebar-root"]': {
      top: `var(--portal-chrome-top, ${CHROME_TOP_BASE}px) !important`,
      height: `calc(100% - var(--portal-chrome-top, ${CHROME_TOP_BASE}px)) !important`,
    },
    // Drawer is position:absolute inside root — keep top:0 relative to root
    '[class*="BackstageSidebar-drawer"]': {
      top: '0 !important',
      height: '100% !important',
      overflowY: 'auto !important' as any,
    },
    'body, html': {
      backgroundColor: `${theme.palette.background.default} !important`,
    },
    // Page gutter = waffle / TEMP / rail-icon column (RAIL_ICON_GUTTER_PX).
    // Overrides Backstage Header (spacing 3 = 24) + Content (spacing 2/3).
    ':root': {
      ['--portal-page-gutter' as string]: `${RAIL_ICON_GUTTER_PX}px`,
    },
    'header[class*="BackstageHeader-header"]': {
      position: 'relative',
      zIndex: 0,
      paddingLeft: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
      paddingRight: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
    },
    '[class*="BackstageHeaderTabs-tabsWrapper"]': {
      paddingLeft: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
    },
    '[class*="BackstageContent-root"]:not([class*="noPadding"])': {
      paddingLeft: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
      paddingRight: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
    },
    '.BackstagePage-root': {
      overflow: 'hidden',
    },
  },
  fixedHeaderOffset: {
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default,
  },
  /** Bridge: masthead only — full-width content, no experience rail. */
  bridgeContent: {
    minHeight: `calc(100vh - var(--portal-chrome-top, ${CHROME_TOP_BASE}px))`,
  },
  /**
   * Automate host owns Header (title Automate) + HeaderTabs.
   * Hide nested Scaffolder / TaskList Page headers so tab body is content-only
   * (same as Git Repositories list content under ProjectsTabs).
   * MUI JSS suffixes the class (`BackstageHeader-header-123`) — match by prefix.
   */
  hideNestedPageHeader: {
    '& header[class*="BackstageHeader-header"]': {
      display: 'none !important',
    },
  },
};
});

const GlobalRestartBanner = () => {
  const { restartRequired, setRestartRequired } = useRestartRequired();
  if (!restartRequired) return null;

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 24px',
        backgroundColor: 'rgba(240,173,78,0.15)',
        borderBottom: '1px solid rgba(240,173,78,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(8px)',
      }}
    >
      <WarningIcon style={{ fontSize: 20, color: '#f0ad4e', flexShrink: 0 }} />
      <Typography style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>
        Configuration changes have been saved but require a portal restart to
        take effect.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => setRestartRequired(false)}
        style={{ textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}
      >
        Restart now
      </Button>
    </Box>
  );
};

/** Experiences catalog + Assistant — rail-less; clears domain to Bridge 'all'. */
// Path helpers live in GlobalShellResumeBar (shared with resume bar).

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const rootClasses = useRootStyles();
  const location = useLocation();
  const { experience, setExperience } = useNavIaModel();
  const { role } = useUserRoleContext();
  const { variant: runPairIa } = useTemplatesRunsIa();
  const keepAutomate = runPairIa === 'automate-rail';
  const killAutomate = runPairIa === 'masthead-plus';
  const smeMastheadPlus = isSmeRole(role) && killAutomate;
  const isSetup = location.pathname.includes('/setup');
  const onBridge = isBridgePath(location.pathname);
  const onGlobalShell = isGlobalShellPath(
    location.pathname,
    location.search,
  );
  const onExperienceRunPaths = isAutomateFullPagePath(
    location.pathname,
    location.search,
  );
  const onGlobalTemplatesRuns = isGlobalTemplatesRunsPath(
    location.pathname,
    location.search,
  );

  // Option A: Automate uses the experience rail (never rail-less full-page).
  // Option B: Automate experience gone — masthead + is the global Templates|Runs shell.
  // SME + Option B: no experience rail at all (home = masthead +).
  const railLess = onBridge || onGlobalShell || smeMastheadPlus;

  const showAdminSyncBar =
    experience === 'admin' && !isSetup && FORCED_ADMIN_SYNC_IA === null;
  const showTemplatesRunsBar = !isSetup && FORCED_TEMPLATES_RUNS_IA === null;
  const showGlobalRunPairTabs = killAutomate && onGlobalTemplatesRuns;
  const showExperienceRunPairTabs =
    killAutomate &&
    !railLess &&
    onExperienceRunPaths &&
    (experience === 'develop' ||
      experience === 'compliance' ||
      experience === 'edge');
  const showAutomateHostChrome =
    showGlobalRunPairTabs || showExperienceRunPairTabs;

  const chromeTop = chromeTopForPrototypeBars({
    showAdminSyncBar,
    showTemplatesRunsBar,
  });

  useCaptureGlobalShellReturn(
    location.pathname,
    location.search,
    experience,
  );

  useEffect(() => {
    if (!onBridge) return;
    setExperience('all');
    writeNavExperience('all');
  }, [onBridge, setExperience]);

  // Option B: leave Automate experience if it was sticky from Option A.
  useEffect(() => {
    if (keepAutomate || experience !== 'automate') return;
    setExperience('all');
    writeNavExperience('all');
  }, [keepAutomate, experience, setExperience]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--portal-chrome-top',
      `${chromeTop}px`,
    );
  }, [chromeTop]);

  const chromeOffsetStyle = {
    paddingTop: chromeTop,
    ['--portal-chrome-top' as string]: `${chromeTop}px`,
  };

  if (isSetup) {
    return <>{children}</>;
  }

  if (railLess) {
    return (
      <RestartProvider>
        <div className={rootClasses.fixedHeaderOffset} style={chromeOffsetStyle}>
          <NavIaRouteGuard />
          <GlobalRestartBanner />
          {onGlobalShell && <GlobalShellResumeBar />}
          {showGlobalRunPairTabs && <ExperienceRunPairTabs mode="global" />}
          <div
            className={`${rootClasses.bridgeContent}${
              showAutomateHostChrome
                ? ` ${rootClasses.hideNestedPageHeader}`
                : ''
            }`}
          >
            {children}
          </div>
        </div>
      </RestartProvider>
    );
  }

  return (
    <RestartProvider>
      <div className={rootClasses.fixedHeaderOffset} style={chromeOffsetStyle}>
        <NavIaRouteGuard />
        <SidebarPage>
          <ExperiencesSidebar />
          <GlobalRestartBanner />
          {showExperienceRunPairTabs && (
            <ExperienceRunPairTabs mode="experience" />
          )}
          <div
            className={
              showAutomateHostChrome
                ? rootClasses.hideNestedPageHeader
                : undefined
            }
          >
            {children}
          </div>
        </SidebarPage>
      </div>
    </RestartProvider>
  );
};
