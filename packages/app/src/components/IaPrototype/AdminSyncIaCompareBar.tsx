import { Box, Typography, makeStyles } from '@material-ui/core';
import { useLocation } from 'react-router-dom';
import {
  useAdminSyncIa,
  type AdminSyncIaVariant,
} from '@ansible/plugin-backstage-self-service';
import { ADMIN_SYNC_IA_BAR_HEIGHT } from './chromeHeights';

const MAGENTA = '#BE0098';

const OPTIONS: Array<{ id: AdminSyncIaVariant; label: string }> = [
  { id: 'existing', label: 'Existing' },
  { id: 'opt1', label: '1 — Merge under Integrations' },
  { id: 'opt2', label: '2 — Sync activity + Run sync…' },
];

const HINTS: Record<AdminSyncIaVariant, string> = {
  existing:
    'Sibling Sync rail + Sync all now on history (current prototype).',
  opt1:
    'No Sync rail. Integrations tabs: Connections | Activity. Sync starts on Connections.',
  opt2:
    'Rail = Sync activity. Run sync… opens a scope dialog — history stays a log.',
};

const useStyles = makeStyles({
  bar: {
    position: 'fixed',
    top: 64,
    left: 0,
    right: 0,
    height: ADMIN_SYNC_IA_BAR_HEIGHT,
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

/**
 * Temp design compare — Admin Sync / Integrations IA.
 * Existing · Opt 1 merge · Opt 2 Sync activity + scoped Run sync.
 */
export const AdminSyncIaCompareBar = () => {
  const classes = useStyles();
  const { variant, setVariant } = useAdminSyncIa();
  const location = useLocation();

  if (location.pathname.includes('/setup')) {
    return null;
  }

  return (
    <Box
      className={classes.bar}
      role="region"
      aria-label="Temporary Admin Sync IA comparison"
      style={{ height: ADMIN_SYNC_IA_BAR_HEIGHT }}
    >
      <Typography className={classes.eyebrow} component="span">
        Temp
      </Typography>
      <Typography className={classes.hint} component="span">
        Admin Sync IA — {HINTS[variant]}
      </Typography>
      <Box className={classes.tabs} role="tablist" aria-label="Admin Sync IA">
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
