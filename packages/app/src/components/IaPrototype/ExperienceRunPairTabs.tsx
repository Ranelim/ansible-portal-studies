import { useLocation, useNavigate } from 'react-router-dom';
import { Header, HeaderTabs } from '@backstage/core-components';
import { Box, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  /**
   * Host chrome matches Git Repositories (`ProjectsTabs`):
   * page Header → HeaderTabs → tab body (nested Page headers hidden by Root).
   */
  root: {
    // HeaderTabs sits flush under Header like entity hosts
  },
});

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
 */
export const ExperienceRunPairTabs = ({
  mode = 'experience',
}: ExperienceRunPairTabsProps) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const tab = tabFromLocation(pathname, search, mode);
  const selectedIndex = tab === 'runs' ? 1 : 0;

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

  return (
    <Box className={classes.root}>
      <Header
        title="Automate"
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
