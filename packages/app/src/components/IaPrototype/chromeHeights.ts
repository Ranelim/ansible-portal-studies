/** Masthead only on Experiences shell branch (no Opt 1–5 purple banner). */
export const IA_BANNER_HEIGHT = 0;
export const MASTHEAD_HEIGHT = 64;
/**
 * Magenta return-chrome compare bar height.
 * 0 while compare UI is hidden (B forced); restore 36 when re-enabling the bar.
 */
export const RETURN_COMPARE_BAR_HEIGHT = 0;
/** Magenta Admin Sync IA compare bar — only while Administration experience is active. */
export const ADMIN_SYNC_IA_BAR_HEIGHT = 36;

/** Masthead (+ parked return bar). Admin Sync bar is added only in Administration. */
export const CHROME_TOP_BASE =
  IA_BANNER_HEIGHT + MASTHEAD_HEIGHT + RETURN_COMPARE_BAR_HEIGHT;

/** Default chrome top without Admin Sync bar (Bridge / non-Admin experiences). */
export const CHROME_TOP = CHROME_TOP_BASE;

export function chromeTopForAdminSync(showAdminSyncBar: boolean): number {
  return CHROME_TOP_BASE + (showAdminSyncBar ? ADMIN_SYNC_IA_BAR_HEIGHT : 0);
}
