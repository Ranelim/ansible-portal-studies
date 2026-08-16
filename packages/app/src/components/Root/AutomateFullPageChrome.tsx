import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Tab, Tabs, Typography, makeStyles } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import {
  isSmeRole,
  useUserRoleContext,
  writeNavExperience,
} from '@ansible/plugin-backstage-self-service';

const useStyles = makeStyles(theme => ({
  root: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 3, 0),
    flexWrap: 'wrap',
  },
  back: {
    textTransform: 'none',
    fontWeight: 500,
    color: theme.palette.text.primary,
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(1),
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    marginLeft: theme.spacing(0.5),
  },
  tabs: {
    minHeight: 40,
    paddingLeft: theme.spacing(2),
  },
  tab: {
    textTransform: 'none',
    minHeight: 40,
    fontWeight: 500,
  },
}));

/**
 * Automate full-page paths (Templates + Activity only).
 * Shared URLs with other experiences — Root gates on `experience === 'automate'`.
 * Catalog (`/self-service/resources`) is not part of Automate.
 */
export function isAutomateFullPagePath(pathname: string, search = ''): boolean {
  if (pathname === '/self-service/create/tasks') return true;
  if (pathname.startsWith('/self-service/create/tasks/')) return true;
  if (pathname === '/create' || pathname.startsWith('/create/')) {
    return new URLSearchParams(search).get('scope') === 'experience';
  }
  return false;
}

type AutomateTab = 'templates' | 'activity';

function tabFromLocation(pathname: string, search: string): AutomateTab {
  if (pathname.startsWith('/self-service/create/tasks')) return 'activity';
  if (
    (pathname === '/create' || pathname.startsWith('/create/')) &&
    new URLSearchParams(search).get('scope') === 'experience'
  ) {
    return 'templates';
  }
  return 'templates';
}

/**
 * Automate = rail-less marketplace experience.
 * Multi-seat: Back to Experiences. SME: no Back (Automate is their only world).
 * Primary nav = page tabs Templates | Runs (no Catalog).
 * Masthead + stays global All templates — not this experience.
 */
export const AutomateFullPageChrome = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { role } = useUserRoleContext();
  const sme = isSmeRole(role);
  const tab = tabFromLocation(pathname, search);

  const goExperiences = () => {
    writeNavExperience('all');
    navigate('/self-service/experiences');
  };

  const onTab = (_: unknown, value: AutomateTab) => {
    if (value === 'templates') navigate('/create?scope=experience');
    else navigate('/self-service/create/tasks');
  };

  return (
    <Box className={classes.root} component="header">
      <Box className={classes.top}>
        {!sme && (
          <Button
            className={classes.back}
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={goExperiences}
          >
            Back to Experiences
          </Button>
        )}
        <Typography className={classes.title} component="span">
          Automate
        </Typography>
      </Box>
      <Tabs
        className={classes.tabs}
        value={tab}
        onChange={onTab}
        indicatorColor="primary"
        textColor="primary"
        aria-label="Automate"
      >
        <Tab className={classes.tab} value="templates" label="Templates" />
        <Tab className={classes.tab} value="activity" label="Runs" />
      </Tabs>
    </Box>
  );
};
