/** Masthead only on Experiences shell branch (no Opt 1–5 purple banner). */
export const IA_BANNER_HEIGHT = 0;
export const MASTHEAD_HEIGHT = 64;
/**
 * Left inset for waffle / Back / magenta TEMP / page Header+Content.
 * Matches Backstage SidebarItem icon glyphs (item inset 8 + iconPadding 24).
 * One vertical frame on rail-less pages; same inset inside the content column
 * when a side rail is present.
 */
export const RAIL_ICON_GUTTER_PX = 32;
/** @deprecated alias — use RAIL_ICON_GUTTER_PX */
export const PAGE_GUTTER_PX = RAIL_ICON_GUTTER_PX;
/** MUI AppBar Toolbar default horizontal gutter. */
export const MASTHEAD_TOOLBAR_GUTTER_PX = 24;
/**
 * Magenta return-chrome compare bar height.
 * 0 while compare UI is hidden (B forced); restore 36 when re-enabling the bar.
 */
export const RETURN_COMPARE_BAR_HEIGHT = 0;
/**
 * Magenta Admin Sync IA compare bar height (Administration only).
 * 0 while compare UI is parked (Opt 1 forced); restore 36 when re-enabling the bar.
 */
export const ADMIN_SYNC_IA_BAR_HEIGHT = 0;

/**
 * Magenta Automate-shell IA compare bar height.
 * Tall enough for one row of controls; keep labels short so it does not wrap.
 */
export const TEMPLATES_RUNS_IA_BAR_HEIGHT = 48;

/** Masthead (+ parked return bar). Admin Sync bar is added only in Administration. */
export const CHROME_TOP_BASE =
  IA_BANNER_HEIGHT + MASTHEAD_HEIGHT + RETURN_COMPARE_BAR_HEIGHT;

/** Default chrome top without Admin Sync bar (Bridge / non-Admin experiences). */
export const CHROME_TOP = CHROME_TOP_BASE;

export function chromeTopForAdminSync(showAdminSyncBar: boolean): number {
  return CHROME_TOP_BASE + (showAdminSyncBar ? ADMIN_SYNC_IA_BAR_HEIGHT : 0);
}

export function chromeTopForPrototypeBars(opts: {
  showAdminSyncBar?: boolean;
  showTemplatesRunsBar?: boolean;
}): number {
  return (
    CHROME_TOP_BASE +
    (opts.showAdminSyncBar ? ADMIN_SYNC_IA_BAR_HEIGHT : 0) +
    (opts.showTemplatesRunsBar ? TEMPLATES_RUNS_IA_BAR_HEIGHT : 0)
  );
}
