import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useLocation } from 'react-router-dom';
import { FORCED_TEMPLATES_RUNS_IA } from '@ansible/plugin-backstage-self-service';
import {
  mastheadIconButtonSx,
  mastheadTooltipChildSx,
} from './mastheadIconSx';
import { useMagentaIaBarVisible } from '../IaPrototype/useMagentaIaBarVisible';

/**
 * Masthead eye — show/hide the TEMP magenta Automate-shell compare bar.
 * Mounted left of Create (+).
 */
export const PortalMagentaIaBarToggle = () => {
  const location = useLocation();
  const { visible, toggle } = useMagentaIaBarVisible();

  if (FORCED_TEMPLATES_RUNS_IA) return null;
  if (location.pathname.includes('/setup')) return null;

  const label = visible
    ? 'Hide prototype compare bar'
    : 'Show prototype compare bar';

  return (
    <Tooltip title={label}>
      <Box
        component="span"
        sx={mastheadTooltipChildSx}
        data-masthead-active={!visible ? 'true' : undefined}
      >
        <IconButton
          color="inherit"
          onClick={toggle}
          aria-label={label}
          aria-pressed={visible}
          sx={mastheadIconButtonSx(!visible)}
        >
          {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </IconButton>
      </Box>
    </Tooltip>
  );
};
