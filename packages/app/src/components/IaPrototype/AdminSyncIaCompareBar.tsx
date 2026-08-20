import { Box, Typography, makeStyles } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FORCED_ADMIN_SYNC_IA,
  useAdminSyncIa,
  useNavIaModel,
  type AdminSyncIaVariant,
} from '@ansible/plugin-backstage-self-service';
import { ADMIN_SYNC_IA_BAR_HEIGHT } from './chromeHeights';

const MAGENTA = '#BE0098';

const OPTIONS: Array<{ id: AdminSyncIaVariant; label: string }> = [
  { id: 'opt1', label: '1 — Merged Integrations' },
  { id: 'opt2', label: '2 — Integrations / Sync split' },
];

const HINTS: Record<AdminSyncIaVariant, string> = {
  opt1:
    'Connect, Sync now, and history stay on Integrations. No Sync rail.',
  opt2:
    'Integrations = connect only. Sync rail = schedules, Sync all, history.',
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

function isAdminArea(pathname: string, experience: string): boolean {
  return (
    experience === 'admin' ||
    pathname.startsWith('/self-service/admin') ||
    pathname === '/rbac' ||
    pathname.startsWith('/rbac/')
  );
}

/**
 * Temp design compare — Admin Sync / Integrations IA.
 * Visible only in Administration.
 */
export const AdminSyncIaCompareBar = () => {
  const classes = useStyles();
  const { variant, setVariant } = useAdminSyncIa();
  const { experience } = useNavIaModel();
  const location = useLocation();
  const navigate = useNavigate();

  if (FORCED_ADMIN_SYNC_IA) {
    return null;
  }

  if (
    !isAdminArea(location.pathname, experience) ||
    location.pathname.includes('/setup')
  ) {
    return null;
  }

  const select = (id: AdminSyncIaVariant) => {
    setVariant(id);
    if (id === 'opt2' && location.search.includes('tab=history')) {
      navigate('/self-service/admin/sync-activity?tab=history', {
        replace: true,
      });
    }
    if (
      id === 'opt1' &&
      location.pathname.startsWith('/self-service/admin/sync-activity')
    ) {
      navigate('/self-service/admin/integrations?tab=history', {
        replace: true,
      });
    }
  };

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
            onClick={() => select(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </Box>
    </Box>
  );
};
