import { Box, Typography, makeStyles } from '@material-ui/core';
import { useLocation } from 'react-router-dom';
import {
  FORCED_INTEGRATIONS_ORIENT,
  useIntegrationsOrientIa,
  useNavIaModel,
  type IntegrationsOrientVariant,
} from '@ansible/plugin-backstage-self-service';
import { INTEGRATIONS_ORIENT_BAR_HEIGHT } from './chromeHeights';
import { isDay0SetupPath } from '../GlobalHeader/isDay0SetupPath';

const MAGENTA = '#BE0098';

const OPTIONS: Array<{ id: IntegrationsOrientVariant; label: string }> = [
  { id: 'current', label: '1 — Current' },
  { id: 'orient', label: '2 — First-time admin' },
];

const HINTS: Record<IntegrationsOrientVariant, string> = {
  current:
    'Cards as they are. Sync now + last sync; schedule lives on the source Sync tab.',
  orient:
    'Job line on every card, cadence on sources, connect-first, no Add integration.',
};

const useStyles = makeStyles({
  bar: {
    position: 'fixed',
    top: 64,
    left: 0,
    right: 0,
    height: INTEGRATIONS_ORIENT_BAR_HEIGHT,
    zIndex: 1200,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    padding: '0 16px',
    backgroundColor: MAGENTA,
    color: '#fff',
    boxSizing: 'border-box',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    opacity: 0.9,
    flexShrink: 0,
  },
  hint: {
    fontSize: 12,
    opacity: 0.9,
    flex: '1 1 auto',
    minWidth: 0,
  },
  tabs: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  tab: {
    appearance: 'none' as const,
    border: '1px solid rgba(255,255,255,0.55)',
    background: 'transparent',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
    padding: '5px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
  },
  tabActive: {
    backgroundColor: '#fff',
    color: MAGENTA,
    borderColor: '#fff',
    '&:hover': {
      backgroundColor: '#fff',
    },
  },
});

function isAdminArea(pathname: string, experience: string): boolean {
  return (
    experience === 'admin' ||
    pathname.startsWith('/self-service/admin') ||
    pathname === '/rbac' ||
    pathname.startsWith('/rbac/')
  );
}

/**
 * Temp design compare — Integrations first-time admin orientation.
 * Visible only in Administration.
 */
export const IntegrationsOrientCompareBar = () => {
  const classes = useStyles();
  const { variant, setVariant } = useIntegrationsOrientIa();
  const { experience } = useNavIaModel();
  const location = useLocation();

  if (FORCED_INTEGRATIONS_ORIENT) {
    return null;
  }

  if (
    !isAdminArea(location.pathname, experience) ||
    isDay0SetupPath(location.pathname)
  ) {
    return null;
  }

  return (
    <Box
      className={classes.bar}
      role="region"
      aria-label="Temporary Integrations orientation comparison"
      style={{ height: INTEGRATIONS_ORIENT_BAR_HEIGHT }}
    >
      <Typography className={classes.eyebrow} component="span">
        Temp
      </Typography>
      <Typography className={classes.hint} component="span">
        Integrations — {HINTS[variant]}
      </Typography>
      <Box className={classes.tabs} role="tablist" aria-label="Integrations orientation">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={variant === opt.id}
            className={`${classes.tab} ${
              variant === opt.id ? classes.tabActive : ''
            }`}
            onClick={() => setVariant(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </Box>
    </Box>
  );
};
