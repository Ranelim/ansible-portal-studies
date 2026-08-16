import { useNavigate } from 'react-router-dom';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import { HeaderDropdownComponent } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/HeaderDropdownComponent/HeaderDropdownComponent.esm.js';
import { useDropdownManager } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/hooks/useDropdownManager.esm.js';
import { mastheadIconButtonSx, mastheadIconSlotSx } from './mastheadIconSx';

/**
 * Dark body text like Profile menu — never Backstage Link primary blue.
 * RHDH/MUI focus the first item on open for keyboard users; keep that focus
 * ring-free for pointer opens (`:focus` transparent, `:focus-visible` = hover).
 */
const menuItemSx = {
  color: 'text.primary',
  textDecoration: 'none',
  '&:focus': {
    color: 'text.primary',
    backgroundColor: 'transparent',
  },
  '&:hover, &:focus-visible, &.Mui-focusVisible': {
    color: 'text.primary',
    textDecoration: 'none',
    backgroundColor: 'action.hover',
  },
  '&.Mui-selected, &.Mui-selected:hover': {
    color: 'text.primary',
    backgroundColor: 'action.hover',
  },
  '& .MuiListItemText-primary, & .MuiListItemText-primary span': {
    color: 'text.primary',
  },
  '& .MuiListItemText-secondary': {
    color: 'text.secondary',
  },
  '& .MuiListItemIcon-root, & .MuiSvgIcon-root': {
    color: 'text.secondary',
  },
} as const;

/**
 * RHDH HelpDropdown lookalike without importing package defaultMountPoints
 * (that module circular-imports CreateDropdown and crashes this static app).
 */
export const PortalHelpMenu = () => {
  const navigate = useNavigate();
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();
  const open = Boolean(anchorEl);

  const goDocs = () => {
    handleClose();
    navigate('/docs');
  };

  const goSupport = () => {
    handleClose();
    window.open(
      'https://access.redhat.com/support',
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <Box
      data-masthead-menu-open={open ? 'true' : undefined}
      sx={mastheadIconSlotSx}
    >
      <HeaderDropdownComponent
        isIconButton
        size="medium"
        tooltip="Help"
        buttonContent={<HelpOutlineIcon />}
        buttonProps={{
          color: 'inherit',
          'aria-label': 'Help',
          sx: mastheadIconButtonSx(open),
        }}
        onOpen={handleOpen}
        onClose={handleClose}
        anchorEl={anchorEl}
      >
        <MenuItem onClick={goDocs} sx={menuItemSx}>
          <ListItemText
            primary="Documentation"
            secondary="Guides and reference"
          />
        </MenuItem>
        <MenuItem onClick={goSupport} sx={menuItemSx}>
          <ListItemText
            primary="Red Hat Support"
            secondary="Open a support case"
          />
          <OpenInNewIcon
            fontSize="small"
            aria-label="Opens in a new tab"
            sx={{ color: 'text.secondary', ml: 1, flexShrink: 0 }}
          />
        </MenuItem>
      </HeaderDropdownComponent>
    </Box>
  );
};
