import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import { Link } from '@backstage/core-components';
import { HeaderDropdownComponent } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/HeaderDropdownComponent/HeaderDropdownComponent.esm.js';
import { useDropdownManager } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/hooks/useDropdownManager.esm.js';

/** Match profile menu — body text, not link-blue. */
const menuItemSx = {
  color: 'text.primary',
  textDecoration: 'none',
  '&:hover': {
    color: 'text.primary',
    textDecoration: 'none',
  },
  '& .MuiListItemText-primary': {
    color: 'text.primary',
  },
  '& .MuiListItemText-secondary': {
    color: 'text.secondary',
  },
  '& .MuiListItemIcon-root': {
    color: 'text.secondary',
    minWidth: 36,
  },
} as const;

/**
 * RHDH HelpDropdown lookalike without importing package defaultMountPoints
 * (that module circular-imports CreateDropdown and crashes this static app).
 */
export const PortalHelpMenu = () => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();

  return (
    <HeaderDropdownComponent
      isIconButton
      tooltip="Help"
      buttonContent={<HelpOutlineIcon />}
      buttonProps={{ color: 'inherit' }}
      onOpen={handleOpen}
      onClose={handleClose}
      anchorEl={anchorEl}
    >
      <MenuItem
        component={Link}
        to="/docs"
        onClick={handleClose}
        sx={menuItemSx}
      >
        <ListItemText primary="Documentation" secondary="Guides and reference" />
      </MenuItem>
      <MenuItem
        component="a"
        href="https://access.redhat.com/support"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClose}
        sx={{
          ...menuItemSx,
          justifyContent: 'space-between',
        }}
      >
        <ListItemText primary="Red Hat Support" secondary="Open a support case" />
        <OpenInNewIcon
          fontSize="small"
          aria-label="Opens in a new tab"
          sx={{ color: 'text.secondary', ml: 1, flexShrink: 0 }}
        />
      </MenuItem>
    </HeaderDropdownComponent>
  );
};
