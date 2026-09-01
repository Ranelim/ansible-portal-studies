/**
 * Parked Findings (by-rule fleet rollup). Not on the Develop rail.
 *
 * Parked Aug 17: Overview + Remediations + Scans. By-rule chrome is a
 * Findings-tab job, not a peer of the work queue. Code stays for revive.
 *
 * ROLLBACK: set `SHOW_CONTENT_QUALITY_FINDINGS_TAB` to `true` and hard-refresh.
 * Route `/self-service/apme/findings` and `QualityDashboardTabContent` stay intact.
 */
export const SHOW_CONTENT_QUALITY_FINDINGS_TAB = false;

/**
 * Remediations list stepper (Scan → Results → Auto remediations → AI remediations → Commit).
 * Hidden Aug 24: almost every live row sits on step 2, so the column
 * does not discriminate. CompactSessionStepper stays in RemediationsContent.
 *
 * ROLLBACK: set `SHOW_REMEDIATION_PROGRESS_COLUMN` to `true` and hard-refresh.
 */
export const SHOW_REMEDIATION_PROGRESS_COLUMN = false;
