import { Box, Typography, makeStyles } from '@material-ui/core';
import { useLocation } from 'react-router-dom';
import {
  FORCED_TEMPLATES_RUNS_IA,
  useTemplatesRunsIa,
  type TemplatesRunsIaVariant,
} from '@ansible/plugin-backstage-self-service';
import { TEMPLATES_RUNS_IA_BAR_HEIGHT, RAIL_ICON_GUTTER_PX } from './chromeHeights';
import { useMagentaIaBarVisible } from './useMagentaIaBarVisible';

const MAGENTA = '#BE0098';

const OPTIONS: Array<{ id: TemplatesRunsIaVariant; label: string }> = [
  { id: 'automate-rail', label: 'A — Automate + rail' },
  { id: 'masthead-plus', label: 'B — Masthead + only' },
];

const HINTS: Record<TemplatesRunsIaVariant, string> = {
  'automate-rail': 'Automate experience + rail; Templates · Runs siblings everywhere.',
  'masthead-plus':
    'No Automate experience; + = Templates | Runs; experiences get Automate item + tabs.',
};

const useStyles = makeStyles({
  bar: {
    position: 'fixed',
    // Above the masthead (masthead top = --portal-magenta-bar).
    top: 0,
    left: 0,
    right: 0,
    height: TEMPLATES_RUNS_IA_BAR_HEIGHT,
    zIndex: 1300,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 10,
    // TEMP label lines up with waffle / Back / rail icons.
    padding: `0 12px 0 ${RAIL_ICON_GUTTER_PX}px`,
    backgroundColor: MAGENTA,
    color: '#fff',
    boxSizing: 'border-box',
    overflow: 'hidden',
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tabs: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
    flexWrap: 'nowrap',
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
    whiteSpace: 'nowrap' as const,
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
 * Temp design compare — Automate as experience + rail vs masthead-only Automate.
 * Sits above the masthead; toggle via masthead eye (left of Create).
 */
export const TemplatesRunsIaCompareBar = () => {
  const classes = useStyles();
  const { variant, setVariant } = useTemplatesRunsIa();
  const { visible } = useMagentaIaBarVisible();
  const location = useLocation();

  if (FORCED_TEMPLATES_RUNS_IA) {
    return null;
  }

  if (location.pathname.includes('/setup')) {
    return null;
  }

  if (!visible) {
    return null;
  }

  return (
    <Box
      className={classes.bar}
      role="region"
      aria-label="Temporary Automate shell IA comparison"
      style={{ height: TEMPLATES_RUNS_IA_BAR_HEIGHT }}
    >
      <Typography className={classes.eyebrow} component="span">
        Temp
      </Typography>
      <Typography className={classes.hint} component="span">
        {HINTS[variant]}
      </Typography>
      <Box className={classes.tabs} role="tablist" aria-label="Automate shell IA">
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
