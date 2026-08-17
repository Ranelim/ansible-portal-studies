/**
 * Content quality (develop-apme) Findings tab — by-rule fleet rollup.
 *
 * Parked Aug 17: Overview + Remediations + Scans. By-rule chrome is a
 * Findings-tab job, not a peer of the work queue. Code stays for revive.
 *
 * ROLLBACK: set `SHOW_CONTENT_QUALITY_FINDINGS_TAB` to `true` and hard-refresh.
 * Route `/self-service/apme/findings` and `QualityDashboardTabContent` stay intact.
 */
export const SHOW_CONTENT_QUALITY_FINDINGS_TAB = false;
