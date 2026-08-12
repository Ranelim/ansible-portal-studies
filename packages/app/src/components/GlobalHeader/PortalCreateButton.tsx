import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

/**
 * RHDH Create slot without Backstage <Link> (Link forces primary blue in masthead).
 */
export const PortalCreateButton = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Tooltip title="Create...">
        <IconButton
          color="inherit"
          size="small"
          onClick={() => navigate('/create')}
          aria-label="Create..."
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
