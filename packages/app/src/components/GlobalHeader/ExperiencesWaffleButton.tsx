import { useNavigate, useLocation } from 'react-router-dom';
import AppsIcon from '@mui/icons-material/Apps';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {
  mastheadIconButtonSx,
  mastheadTooltipChildSx,
} from './mastheadIconSx';

const EXPERIENCES_HREF = '/self-service/experiences';

/** Masthead Apps launcher → Experiences Bridge (left of brand). */
export const SHOW_EXPERIENCES_WAFFLE = true;

function isExperiencesPath(pathname: string): boolean {
  return (
    pathname === EXPERIENCES_HREF ||
    pathname.startsWith(`${EXPERIENCES_HREF}/`)
  );
}

/**
 * Experiences launcher — sits immediately left of the fedora.
 * Same muted icon ink + hit area as Create / Starred / Help (not a blue slice).
 */
export const ExperiencesWaffleButton = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!SHOW_EXPERIENCES_WAFFLE) return null;

  const active = isExperiencesPath(pathname);

  return (
    <Tooltip title="Experiences">
      <Box
        component="span"
        sx={mastheadTooltipChildSx}
        data-masthead-active={active ? 'true' : undefined}
      >
        <IconButton
          color="inherit"
          size="small"
          onClick={() => navigate(EXPERIENCES_HREF)}
          data-portal-experiences-waffle
          aria-label="Experiences"
          aria-current={active ? 'page' : undefined}
          sx={mastheadIconButtonSx(active)}
        >
          <AppsIcon fontSize="small" />
        </IconButton>
      </Box>
    </Tooltip>
  );
};
