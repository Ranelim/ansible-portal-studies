/** Masthead only on Experiences shell branch (no Opt 1–5 purple banner). */
export const IA_BANNER_HEIGHT = 0;
export const MASTHEAD_HEIGHT = 64;
/**
 * Magenta return-chrome compare bar height.
 * 0 while compare UI is hidden (B forced); restore 36 when re-enabling the bar.
 */
export const RETURN_COMPARE_BAR_HEIGHT = 0;
/** Magenta Admin Sync IA compare bar (Existing / Opt1 / Opt2). */
export const ADMIN_SYNC_IA_BAR_HEIGHT = 36;
export const CHROME_TOP =
  IA_BANNER_HEIGHT +
  MASTHEAD_HEIGHT +
  RETURN_COMPARE_BAR_HEIGHT +
  ADMIN_SYNC_IA_BAR_HEIGHT;
