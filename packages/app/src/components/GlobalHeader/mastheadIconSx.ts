import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Masthead action icon grid (Create / Starred / Help / Notifications).
 * One hit, one glyph size, one ink — pressed = same surface for route + open menus.
 *
 * Spacing: RHDH Toolbar already uses `gap: 1` (8px). Do **not** add sx margin
 * numbers here — in MUI sx, `marginRight: 4` means spacing(4) = 32px.
 *
 * Prefer `data-masthead-active` / `data-masthead-menu-open` + Root CSS for chrome;
 * MUI Tooltip freezes IconButton aria/sx when it is the Tooltip's direct child.
 */
export const MASTHEAD_ICON_HIT_PX = 32;
export const MASTHEAD_ICON_GLYPH_PX = 20;

export const mastheadIconSlotSx = {
  width: MASTHEAD_ICON_HIT_PX,
  height: MASTHEAD_ICON_HIT_PX,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  lineHeight: 0,
  verticalAlign: 'middle' as const,
  margin: 0,
  padding: 0,
  boxSizing: 'border-box' as const,
  // Slot only — never a second pressed surface (Root paints IconButton).
  backgroundColor: 'transparent',
  borderRadius: 6,
};

export function mastheadIconButtonSx(active = false): SxProps<Theme> {
  return {
    color: active ? 'text.primary' : 'text.secondary',
    width: MASTHEAD_ICON_HIT_PX,
    height: MASTHEAD_ICON_HIT_PX,
    minWidth: MASTHEAD_ICON_HIT_PX,
    padding: 0,
    margin: 0,
    borderRadius: 6,
    backgroundColor: active ? 'action.selected' : 'transparent',
    boxSizing: 'border-box',
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
      // Beat MUI IconButton size="small|medium" glyph defaults.
      fontSize: `${MASTHEAD_ICON_GLYPH_PX}px !important`,
      width: `${MASTHEAD_ICON_GLYPH_PX}px !important`,
      height: `${MASTHEAD_ICON_GLYPH_PX}px !important`,
    },
    // Badge must not shift the 32×32 slot.
    '& .MuiBadge-root': {
      display: 'inline-flex',
      lineHeight: 0,
    },
  };
}

/** Wrap IconButton so Tooltip does not freeze aria-current / sx on navigation. */
export const mastheadTooltipChildSx = {
  ...mastheadIconSlotSx,
} as const;
