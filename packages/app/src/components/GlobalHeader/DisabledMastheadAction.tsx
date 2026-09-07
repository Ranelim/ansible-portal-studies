import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import {
  mastheadIconButtonSx,
  mastheadTooltipChildSx,
} from './mastheadIconSx';

/**
 * Study masthead control — tooltip on hover, not a link.
 */
export const DisabledMastheadAction = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Tooltip title={title}>
    <Box
      component="span"
      sx={{ ...mastheadTooltipChildSx, cursor: 'default' }}
    >
      <IconButton
        color="inherit"
        aria-label={title}
        onClick={event => event.preventDefault()}
        sx={{
          ...mastheadIconButtonSx(false),
          cursor: 'default',
        }}
      >
        {children}
      </IconButton>
    </Box>
  </Tooltip>
);
