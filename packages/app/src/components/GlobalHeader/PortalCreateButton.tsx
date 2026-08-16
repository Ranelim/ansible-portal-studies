import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

/**
 * RHDH Create slot — always the global All templates list (rail-less `/create`).
 * Does not enter Automate. Experience-scoped Templates stay on the experience
 * (Automate tabs or other experience rail) via `?scope=experience`.
 */
export const PortalCreateButton = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Tooltip title="All templates">
        <IconButton
          color="inherit"
          size="small"
          onClick={() => navigate('/create')}
          aria-label="All templates"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
