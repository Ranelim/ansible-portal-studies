import { useEffect } from 'react';
import { Box, Typography, makeStyles } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  applySetupDemoWorld,
  useSetupDemoMode,
  writeNavExperience,
  type SetupDemoMode,
} from '@ansible/plugin-backstage-self-service';
import { RAIL_ICON_GUTTER_PX, SETUP_DEMO_BAR_HEIGHT } from './chromeHeights';
import { isDay0SetupPath } from '../GlobalHeader/isDay0SetupPath';

const OPTIONS: Array<{ id: SetupDemoMode; label: string }> = [
  { id: 'landing', label: 'Landing' },
  { id: 'setup', label: 'Setup' },
  { id: 'post-setup', label: 'Post-setup' },
];

const useStyles = makeStyles(theme => ({
  bar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: SETUP_DEMO_BAR_HEIGHT,
    // Above the Day 0 wizard overlay (z-index 10000).
    zIndex: 10050,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 12,
    padding: `0 12px 0 ${RAIL_ICON_GUTTER_PX}px`,
    backgroundColor: theme.palette.type === 'dark' ? '#1b1b1b' : '#ededed',
    color: theme.palette.text.secondary,
    borderBottom: `1px solid ${theme.palette.divider}`,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.65,
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  tab: {
    appearance: 'none' as const,
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1,
    padding: '3px 8px',
    borderRadius: 3,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    opacity: 0.7,
    '&:hover': {
      opacity: 1,
      backgroundColor: theme.palette.action.hover,
    },
  },
  tabActive: {
    opacity: 1,
    fontWeight: 700,
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
}));

/**
 * Quiet prototype jumper above the masthead (and the Day 0 wizard).
 * Landing = Day 0 wizard. Setup = first Portal session. Post-setup = fully configured.
 */
export const SetupDemoBar = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, setMode } = useSetupDemoMode();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--portal-setup-demo-bar',
      `${SETUP_DEMO_BAR_HEIGHT}px`,
    );
  }, []);

  const selected: SetupDemoMode = isDay0SetupPath(location.pathname)
    ? 'landing'
    : mode === 'landing'
      ? 'setup'
      : mode;

  const onSelect = (next: SetupDemoMode) => {
    setMode(next);
    applySetupDemoWorld(next);
    try {
      sessionStorage.setItem('portal-welcome-modal-dismissed-session', 'true');
      localStorage.setItem('portal-user-role', 'admin');
    } catch {
      /* ignore */
    }
    if (next === 'landing') {
      navigate('/self-service/setup');
      return;
    }
    if (next === 'setup') {
      writeNavExperience('admin');
      navigate('/self-service/admin/overview');
      return;
    }
    writeNavExperience('all');
    navigate('/self-service/experiences');
  };

  return (
    <Box
      className={classes.bar}
      role="region"
      aria-label="Prototype setup demo"
      style={{ height: SETUP_DEMO_BAR_HEIGHT }}
    >
      <Typography className={classes.eyebrow} component="span">
        Demo
      </Typography>
      <Box className={classes.tabs} role="tablist" aria-label="Setup demo state">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={selected === opt.id}
            className={`${classes.tab} ${
              selected === opt.id ? classes.tabActive : ''
            }`}
            onClick={() => onSelect(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </Box>
    </Box>
  );
};
