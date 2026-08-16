import { useLocation, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTemplatesRunsIa } from '@ansible/plugin-backstage-self-service';
import {
  mastheadIconButtonSx,
  mastheadTooltipChildSx,
} from './mastheadIconSx';

function isGlobalCreatePath(pathname: string, search: string): boolean {
  const scope = new URLSearchParams(search).get('scope');
  if (pathname === '/create' || pathname.startsWith('/create/')) {
    return scope !== 'experience';
  }
  if (
    pathname === '/self-service/create/tasks' ||
    pathname.startsWith('/self-service/create/tasks/')
  ) {
    return scope === 'all';
  }
  return false;
}

/**
 * RHDH Create slot.
 * Option A: all templates (rail-less `/create`).
 * Option B: Templates | Runs tabs (Automate experience removed).
 */
export const PortalCreateButton = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { variant } = useTemplatesRunsIa();
  const mastheadPlus = variant === 'masthead-plus';

  const active = mastheadPlus
    ? isGlobalCreatePath(pathname, search)
    : (pathname === '/create' || pathname.startsWith('/create/')) &&
      new URLSearchParams(search).get('scope') !== 'experience';

  const label = mastheadPlus ? 'Templates and runs' : 'All templates';

  return (
    <Box>
      <Tooltip title={label}>
        <Box
          component="span"
          sx={mastheadTooltipChildSx}
          data-masthead-active={active ? 'true' : undefined}
        >
          <IconButton
            color="inherit"
            size="small"
            onClick={() => navigate('/create')}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            sx={mastheadIconButtonSx(active)}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
};
