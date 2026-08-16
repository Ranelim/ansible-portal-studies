import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Shared masthead icon chrome — muted secondary ink like RHDH Create/Starred/Help.
 * Active / pressed uses the same surface as hover so route and open menus read clearly.
 *
 * Prefer `data-masthead-active` + Root CSS for route-active — MUI Tooltip freezes
 * IconButton aria/sx when it is the Tooltip's direct child.
 */
export function mastheadIconButtonSx(active = false): SxProps<Theme> {
  return {
    color: 'text.secondary',
    // Match sidebar Back hit (24×24) so waffle/back share size + left edge.
    width: 24,
    height: 24,
    padding: 0,
    margin: 0,
    borderRadius: '4px',
    backgroundColor: active ? 'action.selected' : 'transparent',
    ...(active ? { color: 'text.primary' } : {}),
    '&:hover': {
      backgroundColor: 'action.hover',
      color: 'text.primary',
    },
    '&:active': {
      backgroundColor: 'action.selected',
      color: 'text.primary',
    },
    '& .MuiSvgIcon-root': {
      color: 'inherit',
      fontSize: 20,
    },
  };
}

/** Wrap IconButton so Tooltip does not freeze aria-current / sx on navigation. */
export const mastheadTooltipChildSx = {
  display: 'inline-flex',
  lineHeight: 0,
} as const;
