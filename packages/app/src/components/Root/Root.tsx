import { PropsWithChildren, useEffect, useLayoutEffect } from 'react';
import { makeStyles, Box, Typography, Button } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import { useLocation } from 'react-router-dom';
import {
  RestartProvider,
  useRestartRequired,
  useNavIaModel,
  writeNavExperience,
} from '@ansible/plugin-backstage-self-service';
import { SidebarPage } from '@backstage/core-components';
import { ExperiencesSidebar } from './navSidebars';
import {
  isGlobalShellPath,
  useCaptureGlobalShellReturn,
} from './GlobalShellResumeBar';
import {
  CHROME_TOP_BASE,
  MASTHEAD_HEIGHT,
  RAIL_ICON_GUTTER_PX,
  chromeTopForPrototypeBars,
  NavIaRouteGuard,
} from '../IaPrototype';
import { isDay0SetupPath } from '../GlobalHeader/isDay0SetupPath';
import { ExperiencesHeaderBackPortal } from './ExperiencesHeaderBackPortal';

const useRootStyles = makeStyles(theme => {
  const rhdhGeneral = (theme.palette as any).rhdh?.general ?? {};
  // Stock RHDH light AppBar = #f2f2f2 (same as sidebar); dark = #151515.
  // Do NOT use background.paper (#fff) — that was an accidental Portal override.
  const appBarBg =
    rhdhGeneral.appBarBackgroundColor ??
    (theme.palette.type === 'dark' ? '#151515' : '#f2f2f2');
  const appBarFg =
    rhdhGeneral.appBarForegroundColor ?? theme.palette.text.primary;
  const sidebarBg =
    rhdhGeneral.sidebarBackgroundColor ??
    (theme.palette.type === 'dark' ? '#1b1d21' : '#f2f2f2');
  const pageInset = rhdhGeneral.pageInset ?? '1.5rem';

  return {
  '@global': {
    // RHDH GlobalHeaderComponent ships sticky; this app shells it as a sibling
    // outside SidebarPage — pin fixed so rail/content clearances stay correct.
    '#global-header': {
      position: 'fixed !important' as any,
      // Magenta TEMP bar sits above masthead when visible.
      top: 'var(--portal-magenta-bar, 0px) !important',
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
      // Route-active — paint the IconButton only. The Tooltip wrapper holds
      // data-masthead-active (Tooltip freezes IconButton props); painting both
      // layers = stacked sharp squares.
      '& [data-masthead-active="true"]': {
        backgroundColor: 'transparent !important',
      },
      '& [data-masthead-active="true"] [class*="MuiIconButton-root"]': {
        color: `${theme.palette.text.primary} !important`,
        backgroundColor: `${theme.palette.action.selected} !important`,
      },
      '& [data-masthead-active="true"] [class*="MuiButton-root"]': {
        color: `${theme.palette.text.primary} !important`,
        backgroundColor: `${theme.palette.action.selected} !important`,
      },
      // Open Starred / Help — wrapper flag (Menu portals; Tooltip freezes sx).
      '& [data-masthead-menu-open="true"]': {
        backgroundColor: 'transparent !important',
      },
      '& [data-masthead-menu-open="true"] [class*="MuiIconButton-root"]': {
        color: `${theme.palette.text.primary} !important`,
        backgroundColor: `${theme.palette.action.selected} !important`,
      },
      '& [data-masthead-menu-open="true"] [class*="MuiButton-root"]': {
        color: `${theme.palette.text.primary} !important`,
        backgroundColor: `${theme.palette.action.selected} !important`,
      },
      // One rounded hit surface for every masthead icon action.
      '& [class*="MuiToolbar-root"] [class*="MuiIconButton-root"]': {
        borderRadius: 6,
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
    '[class*="BackstageSidebar-root"], nav[aria-label="sidebar nav"] > div': {
      top: `var(--portal-chrome-top, ${CHROME_TOP_BASE}px) !important`,
      bottom: '0 !important',
      height: 'auto !important',
    },
    // Drawer is position:absolute inside root — pin to root edges and scroll.
    // Stock Backstage: flexShrink:0 children + scrollbarWidth:none → long rails clip.
    '[class*="BackstageSidebar-drawer"]': {
      top: '0 !important',
      bottom: '0 !important',
      height: 'auto !important',
      maxHeight: '100% !important',
      overflowX: 'hidden !important' as any,
      overflowY: 'auto !important' as any,
      scrollbarWidth: 'thin' as any,
      '&::-webkit-scrollbar': {
        display: 'block !important',
        width: 6,
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.action.disabled,
        borderRadius: 3,
      },
    },
    // Always-on scroll region for long experience menus.
    '[class*="BackstageSidebar-drawer"] [data-portal-sidebar-scroll], [data-portal-sidebar-scroll]':
      {
      flex: '1 1 auto !important',
      flexShrink: '1 !important' as any,
      minHeight: '0 !important',
      maxHeight: '100%',
      overflowY: 'auto !important' as any,
      overflowX: 'hidden !important' as any,
      scrollbarWidth: 'thin' as any,
      '&::-webkit-scrollbar': {
        display: 'block !important',
        width: 6,
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.action.disabled,
        borderRadius: 3,
      },
    },
    '[class*="BackstageSidebar-drawer"] [class*="BackstageSidebarSpace"]': {
      flexShrink: '1 !important' as any,
      minHeight: '0 !important',
    },
    /**
     * RHDH PF6 page inset lives on SidebarPage `> main`. Current Backstage
     * SidebarPage children are Sidebar + our wrapper (Page `main` is nested),
     * so the theme selector never matches. Rounding is on `pageInsetWell`.
     *
     * Stock SidebarPage is `width: 100%` + `paddingLeft: 224`. Without
     * border-box + a flex column, the well can size to the viewport and
     * paint under the window edge (scan Cancel clips to a stray “c”).
     */
    '[class*="BackstageSidebarPage-root"]': {
      backgroundColor: `${sidebarBg} !important`,
      boxSizing: 'border-box !important',
      width: '100% !important',
      maxWidth: '100% !important',
      minWidth: '0 !important',
      minHeight: '0 !important',
      flex: '1 1 0% !important',
      display: 'flex !important',
      flexDirection: 'column !important',
      overflow: 'hidden !important',
    },
    /**
     * Assistant chat trial — fill the content card and pin composer to its
     * bottom (no gray page-inset strip under the input).
     */
    'html[data-portal-assistant-rail] [data-portal-page-inset]': {
      '@media (min-width: 600px)': {
        display: 'flex !important',
        flexDirection: 'column !important',
        height: `calc(100vh - var(--portal-chrome-top, ${CHROME_TOP_BASE}px) - ${pageInset}) !important`,
        maxHeight: `calc(100vh - var(--portal-chrome-top, ${CHROME_TOP_BASE}px) - ${pageInset}) !important`,
        marginBottom: '0 !important',
        clipPath: 'rect(0 100% 100% 0 round 1rem 1rem 0 0) !important',
        overflow: 'hidden !important',
      },
    },
    'html[data-portal-assistant-rail] [class*="BackstageSidebarPage-root"] main [class*="BackstageContent-root"]':
      {
        flex: '1 1 auto !important',
        minHeight: '0 !important',
        display: 'flex !important',
        flexDirection: 'column !important',
        padding: '0 !important',
        overflow: 'hidden !important',
      },
    /**
     * Redesign remediations — fill the inset well and pin Cancel/Continue
     * to its bottom. Do not use a nested `100vh` calc: the well is already
     * the scrollport (`pageInsetWell`), and a second height clip collapses
     * findings and hides the footer.
     */
    'html[data-portal-remediate-fill] [data-portal-page-inset]': {
      '@media (min-width: 600px)': {
        display: 'flex !important',
        flexDirection: 'column !important',
        flex: '1 1 0% !important',
        minWidth: '0 !important',
        minHeight: '0 !important',
        height: `calc(100vh - var(--portal-chrome-top, ${CHROME_TOP_BASE}px) - ${pageInset}) !important`,
        maxHeight: `calc(100vh - var(--portal-chrome-top, ${CHROME_TOP_BASE}px) - ${pageInset}) !important`,
        marginBottom: '0 !important',
        overflow: 'hidden !important',
        overflowX: 'hidden !important',
      },
    },
    'html[data-portal-remediate-fill] [data-portal-page-inset] [class*="BackstagePage-root"]':
      {
        '@media (min-width: 600px)': {
          flex: '1 1 auto !important',
          minHeight: '0 !important',
          minWidth: '0 !important',
          width: 'auto !important',
          maxWidth: '100% !important',
          height: '100% !important',
          maxHeight: 'none !important',
          overflow: 'hidden !important',
          display: 'flex !important',
          flexDirection: 'column !important',
        },
      },
    'html[data-portal-remediate-fill] [data-portal-page-inset] [class*="BackstageContent-root"]':
      {
        flex: '1 1 auto !important',
        minHeight: '0 !important',
        minWidth: '0 !important',
        width: 'auto !important',
        maxWidth: '100% !important',
        height: '100% !important',
        display: 'flex !important',
        flexDirection: 'column !important',
        overflow: 'hidden !important',
        overflowX: 'hidden !important',
        paddingBottom: '0 !important',
        boxSizing: 'border-box !important',
      },
    'body, html': {
      backgroundColor: `${sidebarBg} !important`,
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
      // Stock Header is padding 24 all sides — stacks with HeaderTabs (also 24)
      // into a hole under the subtitle. Keep top/side; tighten bottom.
      paddingBottom: `${theme.spacing(1)}px !important`,
    },
    '[class*="BackstageHeaderTabs-tabsWrapper"]': {
      paddingLeft: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
    },
    // Stock HeaderTabs tab padding is spacing(3)=24. Sit tabs under the subtitle.
    '[class*="BackstageHeaderTabs-tabsWrapper"] .MuiTabs-root': {
      minHeight: 0,
    },
    '[class*="BackstageHeaderTabs-tabsWrapper"] .MuiTab-root': {
      minHeight: 0,
      paddingTop: `${theme.spacing(1.5)}px !important`,
      paddingBottom: `${theme.spacing(1.5)}px !important`,
    },
    // Experiences toolbar rhythm: ~20px above and below the filter row.
    'header[class*="BackstageHeader-header"] + [class*="BackstageContent-root"]:not([class*="noPadding"]), [class*="BackstageHeaderTabs-tabsWrapper"] + [class*="BackstageContent-root"]:not([class*="noPadding"])':
      {
        paddingTop: `${theme.spacing(2.5)}px !important`,
      },
    '[class*="BackstageContent-root"]:not([class*="noPadding"])': {
      paddingLeft: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
      paddingRight: `var(--portal-page-gutter, ${RAIL_ICON_GUTTER_PX}px) !important`,
    },
    /**
     * Inset well is the scrollport (rounded card). Stock Page is `100vh` +
     * `overflow: hidden` here used to fill that card — the page then clipped
     * its own Content and the well had nothing to scroll.
     */
    '[data-portal-page-inset] [class*="BackstagePage-root"]': {
      '@media (min-width: 600px)': {
        height: 'auto !important',
        minHeight: '100%',
        maxHeight: 'none !important',
        minWidth: '0 !important',
        maxWidth: '100% !important',
        overflow: 'visible !important',
        overflowX: 'hidden !important',
        boxSizing: 'border-box !important',
      },
    },
  },
  fixedHeaderOffset: {
    minHeight: '100vh',
    height: '100vh',
    maxHeight: '100vh',
    '@supports (height: 100dvh)': {
      minHeight: '100dvh',
      height: '100dvh',
      maxHeight: '100dvh',
    },
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
    // Same gray as RHDH SidebarPage so the rounded main inset reads against chrome.
    backgroundColor: sidebarBg,
  },
  /**
   * Stock RHDH `BackstageSidebarPage` (`createComponents`): desktop
   * `clipPath: rect(0 100% 100% 0 round 1rem)` + `margin: pageInset` on
   * `& > main`. Left margin cancelled when a `nav` sibling exists.
   * Applied here because Page `main` is not a direct SidebarPage child.
   * maxHeight subtracts the fixed masthead (Portal chrome; RHDH header is in-page).
   */
  pageInsetWell: {
    '@media (min-width: 600px)': {
      clipPath: 'rect(0 100% 100% 0 round 1rem)',
      marginTop: pageInset,
      marginRight: pageInset,
      marginBottom: pageInset,
      marginLeft: 0,
      flex: '1 1 0%',
      alignSelf: 'stretch',
      minWidth: 0,
      minHeight: 0,
      width: 'auto',
      height: 'auto',
      maxHeight: 'none',
      boxSizing: 'border-box',
      contain: 'inline-size',
      backgroundColor: theme.palette.background.default,
      overflow: 'auto',
      overflowX: 'hidden',
    },
  },
  /** Bridge: masthead only — full-width content, no experience rail. */
  bridgeContent: {
    minHeight: `calc(100vh - var(--portal-chrome-top, ${CHROME_TOP_BASE}px))`,
    // Bridge has no SidebarPage inset — keep page white under masthead.
    backgroundColor: theme.palette.background.default,
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
    // Automate host: HeaderTabs lives outside the Page, so the sibling
    // Content selector above does not fire. Same 20px as Experiences.
    '& [class*="BackstageContent-root"]:not([class*="noPadding"])': {
      paddingTop: `${theme.spacing(2.5)}px !important`,
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

/** Experiences catalog — rail-less; clears domain to Bridge 'all'.
 *  Assistant experience is parked (`SHOW_ASSISTANT_EXPERIENCE`). Lightspeed FAB stays. */
// Path helpers live in GlobalShellResumeBar.

/**
 * Production / Rspack builds drop BackstageSidebar-* class names, so @global
 * rail clearance never matches. Pin the fixed drawer below the masthead inline.
 */
function useExperienceRailBelowMasthead(chromeTop: number, enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return undefined;

    const topPx = `${chromeTop}px`;
    const sync = (): boolean => {
      const el = document.querySelector(
        'nav[aria-label="sidebar nav"] > div',
      ) as HTMLElement | null;
      if (!el) return false;
      el.style.setProperty('top', topPx, 'important');
      el.style.setProperty('bottom', '0', 'important');
      el.style.setProperty('height', 'auto', 'important');
      return true;
    };

    if (sync()) return undefined;

    const observer = new MutationObserver(() => {
      if (sync()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [chromeTop, enabled]);
}

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const rootClasses = useRootStyles();
  const location = useLocation();
  const { experience, setExperience } = useNavIaModel();
  const isSetup = isDay0SetupPath(location.pathname);
  const onGlobalShell = isGlobalShellPath(
    location.pathname,
    location.search,
  );

  const chromeTop = chromeTopForPrototypeBars({});
  const magentaBarPx = 0;

  useCaptureGlobalShellReturn(
    location.pathname,
    location.search,
    experience,
  );

  useEffect(() => {
    if (experience === 'develop') return;
    setExperience('develop');
    writeNavExperience('develop');
  }, [experience, setExperience]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--portal-magenta-bar',
      `${magentaBarPx}px`,
    );
    document.documentElement.style.setProperty(
      '--portal-chrome-top',
      `${chromeTop}px`,
    );
  }, [chromeTop, magentaBarPx]);

  useExperienceRailBelowMasthead(chromeTop, !isSetup && !onGlobalShell);

  const chromeOffsetStyle = {
    paddingTop: chromeTop,
    ['--portal-chrome-top' as string]: `${chromeTop}px`,
  };

  if (isSetup) {
    return <>{children}</>;
  }

  if (onGlobalShell) {
    return (
      <RestartProvider>
        <div className={rootClasses.fixedHeaderOffset} style={chromeOffsetStyle}>
          <NavIaRouteGuard />
          <GlobalRestartBanner />
          <ExperiencesHeaderBackPortal />
          <div className={rootClasses.bridgeContent}>{children}</div>
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
          <div
            data-portal-page-inset
            className={rootClasses.pageInsetWell}
          >
            {children}
          </div>
        </SidebarPage>
      </div>
    </RestartProvider>
  );
};
