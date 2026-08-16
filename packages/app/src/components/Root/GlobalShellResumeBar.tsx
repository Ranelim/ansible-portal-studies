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
  'develop-tabs': '/self-service/repositories/list',
  'develop-drawer': '/self-service/repositories/list',
  compliance: '/self-service/experience-dashboard',
  edge: '/self-service/experience-dashboard',
  admin: '/self-service/admin/overview',
};

export function isBridgePath(pathname: string): boolean {
  return (
    pathname === '/self-service/experiences' ||
    pathname.startsWith('/self-service/experiences/') ||
    pathname === '/self-service/assistant' ||
    pathname.startsWith('/self-service/assistant/')
  );
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

/** Masthead + Templates | Runs surface (Option B), excluding account/search. */
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
      raw === 'develop-tabs' ||
      raw === 'develop-drawer' ||
      raw === 'compliance' ||
      raw === 'edge' ||
      raw === 'admin' ||
      raw === 'all'
    ) {
      return raw;
    }
    if (raw === 'develop' || raw === 'develop-section') return 'develop-tabs';
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
    if (
      parsed?.kind === 'experience' &&
      parsed.experience &&
      parsed.experience !== 'all'
    ) {
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

/**
 * Conditional resume control on global shell pages only.
 * Hidden for SME (single Automate world — nowhere useful to “go back”).
 * Specific label when we know the origin; hidden when there is nothing useful to say.
 */
export const GlobalShellResumeBar = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { role } = useUserRoleContext();
  const { experience } = useNavIaModel();
  const { variant: runPairIa } = useTemplatesRunsIa();
  const [ret, setRet] = useState<GlobalReturn | null>(() => readReturn());

  useEffect(() => {
    if (!isGlobalShellPath(pathname, search)) return;
    setRet(readReturn());
  }, [pathname, search]);

  const onGlobalTemplatesRuns = isGlobalTemplatesRunsPath(pathname, search);
  const mastheadPlus = runPairIa === 'masthead-plus';
  const onAutomateHost =
    isAutomateFullPagePath(pathname, search) || onGlobalTemplatesRuns;

  // Option B Automate experience (rail-less) — return to Bridge.
  if (
    mastheadPlus &&
    experience === 'automate' &&
    !isSmeRole(role) &&
    onAutomateHost
  ) {
    return (
      <Box className={classes.bar} role="navigation" aria-label="Return">
        <Button
          className={classes.button}
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => navigate('/self-service/experiences')}
        >
          Back to Experiences
        </Button>
      </Box>
    );
  }

  // Option B masthead + global surface — always return to Experiences catalog.
  if (mastheadPlus && onGlobalTemplatesRuns) {
    return (
      <Box className={classes.bar} role="navigation" aria-label="Return">
        <Button
          className={classes.button}
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => navigate('/self-service/experiences')}
        >
          Back to Experiences
        </Button>
      </Box>
    );
  }

  // SME: no Bridge on other global pages. Search → back to Automate.
  if (isSmeRole(role)) {
    const onSearch =
      pathname === '/search' || pathname.startsWith('/search/');
    if (!onSearch) {
      return null;
    }
    return (
      <Box className={classes.bar} role="navigation" aria-label="Return">
        <Button
          className={classes.button}
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => navigate('/create?scope=experience')}
        >
          Back to Automate
        </Button>
      </Box>
    );
  }

  if (!isGlobalShellPath(pathname, search) || !ret) {
    return null;
  }

  const label =
    ret.kind === 'bridge'
      ? 'Back to Experiences'
      : `Back to ${EXPERIENCE_LABELS[ret.experience]}`;

  const href =
    ret.kind === 'bridge'
      ? '/self-service/experiences'
      : EXPERIENCE_RESUME[ret.experience];

  return (
    <Box className={classes.bar} role="navigation" aria-label="Return">
      <Button
        className={classes.button}
        size="small"
        startIcon={<ArrowBackIcon fontSize="small" />}
        onClick={() => navigate(href)}
      >
        {label}
      </Button>
    </Box>
  );
};
