import { PropsWithChildren, useEffect } from 'react';
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
  GlobalShellResumeBar,
  isBridgePath,
  isGlobalShellPath,
  useCaptureGlobalShellReturn,
} from './GlobalShellResumeBar';
import { CHROME_TOP, NavIaRouteGuard } from '../IaPrototype';

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
      '& .MuiToolbar-root': {
        color: appBarFg,
      },
      '& .MuiIconButton-root, & .MuiButton-root': {
        color: theme.palette.text.secondary,
      },
      '& .MuiIconButton-root:hover, & .MuiButton-root:hover': {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.action.hover,
      },
      '& .MuiSvgIcon-root': {
        color: 'inherit',
      },
      // Backstage Link paints primary blue — kill that inside the masthead
      '& a, & a:hover, & a:visited': {
        color: 'inherit',
        textDecoration: 'none',
      },
    },
    // JSS hashes class names (e.g. BackstageSidebar-root-83) — use substring match
    // so the rail clears the masthead.
    '[class*="BackstageSidebar-root"]': {
      top: `${CHROME_TOP}px !important`,
      height: `calc(100% - ${CHROME_TOP}px) !important`,
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
    '.BackstageHeader-header': {
      position: 'relative',
      zIndex: 0,
    },
    '.BackstagePage-root': {
      overflow: 'hidden',
    },
  },
  fixedHeaderOffset: {
    paddingTop: CHROME_TOP,
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default,
  },
  /** Bridge: masthead only — full-width content, no experience rail. */
  bridgeContent: {
    minHeight: `calc(100vh - ${CHROME_TOP}px)`,
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
  const { setExperience } = useNavIaModel();
  const isSetup = location.pathname.includes('/setup');
  const onBridge = isBridgePath(location.pathname);
  const onGlobalShell = isGlobalShellPath(location.pathname);
  const railLess = onBridge || onGlobalShell;

  useCaptureGlobalShellReturn(location.pathname);

  // Only the Experiences catalog / Assistant reset domain to Bridge 'all'.
  // Settings / My profile / notifications keep the last experience for Back.
  useEffect(() => {
    if (!onBridge) return;
    setExperience('all');
    writeNavExperience('all');
  }, [onBridge, setExperience]);

  if (isSetup) {
    return <>{children}</>;
  }

  // Rail-less: Bridge catalog, Assistant, account pages, notifications
  if (railLess) {
    return (
      <RestartProvider>
        <div className={rootClasses.fixedHeaderOffset}>
          <NavIaRouteGuard />
          <GlobalRestartBanner />
          {onGlobalShell && <GlobalShellResumeBar />}
          <div className={rootClasses.bridgeContent}>{children}</div>
        </div>
      </RestartProvider>
    );
  }

  return (
    <RestartProvider>
      <div className={rootClasses.fixedHeaderOffset}>
        <NavIaRouteGuard />
        <SidebarPage>
          <ExperiencesSidebar />
          <GlobalRestartBanner />
          {children}
        </SidebarPage>
      </div>
    </RestartProvider>
  );
};
