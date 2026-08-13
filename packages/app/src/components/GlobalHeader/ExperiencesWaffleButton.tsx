import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppsIcon from '@mui/icons-material/Apps';
import Box from '@mui/material/Box';
import { MASTHEAD_HEIGHT } from '../IaPrototype/chromeHeights';

const EXPERIENCES_HREF = '/self-service/experiences';
/** Flip to true + remount in GlobalHeader (priority 210) to try again. */
export const SHOW_EXPERIENCES_WAFFLE = false;
/** Lighter solid blue — sliced masthead chrome (prototype try). */
const WAFFLE_BLUE = '#2B9AF3';
const WAFFLE_BLUE_HOVER = '#1A8AD4';

/**
 * Experiences Bridge launcher — left of brand.
 * Square, sharp corners, full masthead height, solid blue — reads as a slice of the bar.
 * Justified Portal delta: App launcher slot returns with a real destination (Experiences).
 * Currently hidden (SHOW_EXPERIENCES_WAFFLE = false).
 */
export const ExperiencesWaffleButton = () => {
  const location = useLocation();
  if (!SHOW_EXPERIENCES_WAFFLE) return null;
  const active =
    location.pathname === EXPERIENCES_HREF ||
    location.pathname.startsWith(`${EXPERIENCES_HREF}/`);

  return (
    <Box
      component={RouterLink}
      to={EXPERIENCES_HREF}
      data-portal-experiences-waffle
      aria-label="Experiences"
      title="Experiences"
      aria-current={active ? 'page' : undefined}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: MASTHEAD_HEIGHT,
        minWidth: MASTHEAD_HEIGHT,
        height: MASTHEAD_HEIGHT,
        margin: 0,
        padding: 0,
        flexShrink: 0,
        borderRadius: 0,
        backgroundColor: WAFFLE_BLUE,
        color: '#fff',
        textDecoration: 'none',
        boxSizing: 'border-box',
        alignSelf: 'stretch',
        position: 'relative',
        left: 0,
        opacity: active ? 1 : 0.95,
        '&:hover': {
          backgroundColor: WAFFLE_BLUE_HOVER,
          color: '#fff',
          textDecoration: 'none',
        },
        '&:focus-visible': {
          outline: '2px solid #fff',
          outlineOffset: -4,
        },
        '& .MuiSvgIcon-root': {
          color: '#fff',
          fontSize: 24,
        },
      }}
    >
      <AppsIcon aria-hidden />
    </Box>
  );
};
