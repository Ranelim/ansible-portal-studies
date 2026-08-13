import { Box, Typography, makeStyles } from '@material-ui/core';
import { useLocation } from 'react-router-dom';
import { useExperienceReturnChrome } from './useExperienceReturnChrome';
import type { ExperienceReturnChrome } from './experienceReturnChrome';
import { RETURN_COMPARE_BAR_HEIGHT } from './chromeHeights';

const MAGENTA = '#BE0098';

const OPTIONS: Array<{ id: ExperienceReturnChrome; label: string }> = [
  { id: 'quiet', label: 'A — Quiet rail back' },
  { id: 'waffle', label: 'B — Chevron by label' },
];

const useStyles = makeStyles({
  bar: {
    position: 'fixed',
    top: 64,
    left: 0,
    right: 0,
    height: RETURN_COMPARE_BAR_HEIGHT,
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
 * Temp design compare — Experiences return chrome.
 * A quiet “← Experiences” · B chevron beside experience label.
 */
export const ExperienceReturnCompareBar = () => {
  const classes = useStyles();
  const { variant, setChrome } = useExperienceReturnChrome();
  const location = useLocation();

  if (location.pathname.includes('/setup')) {
    return null;
  }

  return (
    <Box
      className={classes.bar}
      role="region"
      aria-label="Temporary Experiences return chrome comparison"
      style={{ height: RETURN_COMPARE_BAR_HEIGHT }}
    >
      <Typography className={classes.eyebrow} component="span">
        Temp
      </Typography>
      <Typography className={classes.hint} component="span">
        Return chrome — A above label; B chevron beside experience name
      </Typography>
      <Box className={classes.tabs} role="tablist" aria-label="Return chrome">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={variant === opt.id}
            className={`${classes.tab} ${
              variant === opt.id ? classes.tabActive : ''
            }`}
            onClick={() => setChrome(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </Box>
    </Box>
  );
};
