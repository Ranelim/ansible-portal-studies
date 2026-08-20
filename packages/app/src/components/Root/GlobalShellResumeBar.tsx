import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, makeStyles } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import {
  EXPERIENCE_LABELS,
  isSmeRole,
  useNavIaModel,
  useTemplatesRunsIa,
  useUserRoleContext,
  type NavExperience,
  ASSISTANT_SIDE_NAV_TRIAL,
  isAssistantPath,
} from '@ansible/plugin-backstage-self-service';
import { RAIL_ICON_GUTTER_PX } from '../IaPrototype/chromeHeights';
import { isAutomateFullPagePath } from './AutomateFullPageChrome';

const RETURN_KEY = 'portal-global-shell-return';

type GlobalReturn =
  | { kind: 'experience'; experience: Exclude<NavExperience, 'all'> }
  | { kind: 'bridge' };

const EXPERIENCE_RESUME: Record<
  Exclude<NavExperience, 'all'>,
  string
> = {
  automate: '/create?scope=experience',
  develop: '/self-service/repositories/list',
  compliance: '/self-service/experience-dashboard',
  edge: '/self-service/experience-dashboard',
  admin: '/self-service/admin/overview',
};

export function isBridgePath(pathname: string): boolean {
  if (
    pathname === '/self-service/experiences' ||
    pathname.startsWith('/self-service/experiences/')
  ) {
    return true;
  }
  // Assistant: rail-less Bridge sibling unless side-nav trial is on.
  if (isAssistantPath(pathname)) {
    return !ASSISTANT_SIDE_NAV_TRIAL;
  }
  return false;
}

/**
 * Rail-less chrome: account, notifications, search, and masthead Create.
 * Experience-scoped Templates (`?scope=experience`) keep the experience rail.
 * Option B global Runs: `/self-service/create/tasks?scope=all`.
 */
export function isGlobalShellPath(pathname: string, search = ''): boolean {
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return true;
  }
  if (pathname === '/notifications' || pathname.startsWith('/notifications/')) {
    return true;
  }
  if (pathname === '/search' || pathname.startsWith('/search/')) {
    return true;
  }
  if (/^\/catalog\/[^/]+\/user\//i.test(pathname)) {
    return true;
  }
  if (pathname === '/create' || pathname.startsWith('/create/')) {
    const scope = new URLSearchParams(search).get('scope');
    return scope !== 'experience';
  }
  if (
    pathname === '/self-service/create/tasks' ||
    pathname.startsWith('/self-service/create/tasks/')
  ) {
    return new URLSearchParams(search).get('scope') === 'all';
  }
  return false;
}

/** Masthead Create (`+`) catalog — `/create` without experience scope. */
export function isGlobalTemplatesRunsPath(
  pathname: string,
  search = '',
): boolean {
  if (pathname === '/create' || pathname.startsWith('/create/')) {
    return new URLSearchParams(search).get('scope') !== 'experience';
  }
  if (
    pathname === '/self-service/create/tasks' ||
    pathname.startsWith('/self-service/create/tasks/')
  ) {
    return new URLSearchParams(search).get('scope') === 'all';
  }
  return false;
}

function readStoredExperience(): NavExperience {
  try {
    const raw = localStorage.getItem('portal-nav-experience');
    if (
      raw === 'automate' ||
      raw === 'develop' ||
      raw === 'compliance' ||
      raw === 'edge' ||
      raw === 'admin' ||
      raw === 'all'
    ) {
      return raw;
    }
    if (
      raw === 'develop-tabs' ||
      raw === 'develop-drawer' ||
      raw === 'develop-apme' ||
      raw === 'develop-section'
    ) {
      return 'develop';
    }
  } catch {
    /* ignore */
  }
  return 'all';
}

function readReturn(): GlobalReturn | null {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GlobalReturn;
    if (parsed?.kind === 'bridge') return parsed;
    if (parsed?.kind === 'experience' && parsed.experience && parsed.experience !== 'all') {
      const exp = parsed.experience as string;
      if (
        exp === 'develop-tabs' ||
        exp === 'develop-drawer' ||
        exp === 'develop-apme' ||
        exp === 'develop-section'
      ) {
        return { kind: 'experience', experience: 'develop' };
      }
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeReturn(next: GlobalReturn | null) {
  try {
    if (!next) {
      sessionStorage.removeItem(RETURN_KEY);
      return;
    }
    sessionStorage.setItem(RETURN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/**
 * When entering a global shell page from elsewhere, snapshot where to resume.
 * Global → global (e.g. Settings → My profile) keeps the original return.
 * Must run from Root on every route (not only while the bar is mounted).
 */
export function useCaptureGlobalShellReturn(
  pathname: string,
  search = '',
  experience: NavExperience = 'all',
) {
  const prevRef = useRef({ pathname, search });

  useEffect(() => {
    const prev = prevRef.current;
    const currPath = pathname;
    const currSearch = search;

    if (
      isGlobalShellPath(currPath, currSearch) &&
      !isGlobalShellPath(prev.pathname, prev.search)
    ) {
      if (isBridgePath(prev.pathname)) {
        writeReturn({ kind: 'bridge' });
      } else {
        // Prefer live experience (Automate full-page, Develop rail, …) over
        // localStorage — Bridge writes 'all' and can race Launch.
        const fromLive = experience !== 'all' ? experience : null;
        const fromStore = readStoredExperience();
        const exp =
          fromLive ?? (fromStore !== 'all' ? fromStore : null);
        if (exp) {
          writeReturn({ kind: 'experience', experience: exp });
        } else {
          writeReturn({ kind: 'bridge' });
        }
      }
    }

    prevRef.current = { pathname: currPath, search: currSearch };
  }, [pathname, search, experience]);
}

const useStyles = makeStyles(theme => ({
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    // Align “Back” with waffle / TEMP / page Header (page gutter).
    paddingLeft: RAIL_ICON_GUTTER_PX,
    paddingRight: RAIL_ICON_GUTTER_PX,
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  button: {
    textTransform: 'none',
    fontWeight: 500,
    color: theme.palette.text.primary,
    paddingLeft: 0,
    paddingRight: theme.spacing(1),
    marginLeft: 0,
    '& .MuiButton-startIcon': {
      marginLeft: 0,
      marginRight: 6,
    },
  },
}));

export type GlobalShellResume = { label: string; href: string };

/**
 * Destination for rail-less orphan pages. Button copy is the destination
 * (All scans), not “Back to …”.
 * SME: Search / masthead Create → Automate. Multi-seat: last experience or Bridge.
 */
export function useGlobalShellResume(): GlobalShellResume | null {
  const { pathname, search } = useLocation();
  const { role } = useUserRoleContext();
  const [ret, setRet] = useState<GlobalReturn | null>(() => readReturn());

  useEffect(() => {
    if (!isGlobalShellPath(pathname, search)) return;
    setRet(readReturn());
  }, [pathname, search]);

  const onSearch = pathname === '/search' || pathname.startsWith('/search/');
  const onGlobalCreate = isGlobalTemplatesRunsPath(pathname, search);

  if (isSmeRole(role)) {
    if (!onSearch && !onGlobalCreate) return null;
    return { label: 'Automate', href: '/create?scope=experience' };
  }

  if (!isGlobalShellPath(pathname, search)) return null;

  const dest = ret ?? { kind: 'bridge' as const };
  if (dest.kind === 'bridge') {
    return { label: 'Experiences', href: '/self-service/experiences' };
  }
  return {
    label: EXPERIENCE_LABELS[dest.experience],
    href: EXPERIENCE_RESUME[dest.experience],
  };
}

/** Automate B (rail-less host) still uses a strip — orphans use the Header back. */
export const GlobalShellResumeBar = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { role } = useUserRoleContext();
  const { experience } = useNavIaModel();
  const { variant: runPairIa } = useTemplatesRunsIa();

  const mastheadPlus = runPairIa === 'masthead-plus';
  const onAutomateHost = isAutomateFullPagePath(pathname, search);

  if (isSmeRole(role)) return null;

  if (mastheadPlus && experience === 'automate' && onAutomateHost) {
    return (
      <Box className={classes.bar} role="navigation" aria-label="Return">
        <Button
          className={classes.button}
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => navigate('/self-service/experiences')}
        >
          Experiences
        </Button>
      </Box>
    );
  }

  return null;
};
