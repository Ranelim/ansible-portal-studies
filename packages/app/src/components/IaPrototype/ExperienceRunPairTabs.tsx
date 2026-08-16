import { useLocation, useNavigate } from 'react-router-dom';
import { Header, HeaderTabs } from '@backstage/core-components';
import { Box, IconButton, makeStyles } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import {
  isSmeRole,
  useUserRoleContext,
  writeNavExperience,
} from '@ansible/plugin-backstage-self-service';

const useStyles = makeStyles(theme => ({
  /**
   * Host chrome matches Git Repositories (`ProjectsTabs`):
   * page Header → HeaderTabs → tab body (nested Page headers hidden by Root).
   */
  root: {},
  titleRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  back: {
    marginLeft: theme.spacing(-0.5),
    marginRight: theme.spacing(0.25),
    color: 'inherit',
  },
}));

const TABS = [
  { id: 'templates', label: 'Templates' },
  { id: 'runs', label: 'Runs' },
];

const SUBTITLE: Record<'global' | 'experience', string> = {
  global:
    'Create and run automation from templates, and track runs across Automation Portal.',
  experience:
    'Create and run automation from templates, and track runs for this experience.',
};

type RunPairTab = 'templates' | 'runs';

export type ExperienceRunPairTabsProps = {
  /** Global masthead + surface (Option B) vs experience-scoped Automate item. */
  mode?: 'global' | 'experience';
};

function tabFromLocation(
  pathname: string,
  search: string,
  mode: 'global' | 'experience',
): RunPairTab {
  if (pathname.startsWith('/self-service/create/tasks')) return 'runs';
  if (pathname === '/create' || pathname.startsWith('/create/')) {
    if (mode === 'global') {
      return new URLSearchParams(search).get('scope') === 'experience'
        ? 'templates'
        : 'templates';
    }
    return 'templates';
  }
  return 'templates';
}

/**
 * Option B — Automate host page chrome (same pattern as Git Repositories).
 * Header title = Automate; tabs = Templates | Runs; tab body is the route child.
 * Multi-seat experience mode: Back → Experiences (same pattern as Assistant).
 */
export const ExperienceRunPairTabs = ({
  mode = 'experience',
}: ExperienceRunPairTabsProps) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { role } = useUserRoleContext();
  const sme = isSmeRole(role);
  const showBack = mode === 'experience' && !sme;
  const tab = tabFromLocation(pathname, search, mode);
  const selectedIndex = tab === 'runs' ? 1 : 0;

  const goExperiences = () => {
    writeNavExperience('all');
    navigate('/self-service/experiences');
  };

  const onTabSelect = (index: number) => {
    const next = TABS[index]?.id as RunPairTab | undefined;
    if (!next) return;
    if (mode === 'global') {
      if (next === 'templates') navigate('/create');
      else navigate('/self-service/create/tasks?scope=all');
      return;
    }
    if (next === 'templates') navigate('/create?scope=experience');
    else navigate('/self-service/create/tasks');
  };

  const title = showBack ? (
    <Box className={classes.titleRow}>
      <IconButton
        className={classes.back}
        size="small"
        color="inherit"
        aria-label="Back to Experiences"
        onClick={goExperiences}
      >
        <ArrowBackIcon fontSize="small" />
      </IconButton>
      Automate
    </Box>
  ) : (
    'Automate'
  );

  return (
    <Box className={classes.root}>
      <Header
        title={title}
        pageTitleOverride="Automate"
        subtitle={SUBTITLE[mode]}
      />
      <HeaderTabs
        selectedIndex={selectedIndex}
        onChange={onTabSelect}
        tabs={TABS}
      />
    </Box>
  );
};
