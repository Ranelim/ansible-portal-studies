# AAP Integration — Design Pin

## Context

Craig's AAP integration concept (from `concept/ux-exploration-git-pipelines`) explores
surfacing AAP job execution data within the Portal. This pin captures the design
conclusions from the May 7 2026 session.

## Core Principle

The Portal's unique value is in the **pre-deployment** content lifecycle (violations,
quality, CI). AAP integration extends this to **close the loop**: did my code work
when it actually ran in production?

## Feature Capabilities (agreed)

1. **Deep link to AAP job detail** — Click a failed/succeeded run → opens in AAP Controller UI
2. **Commit correlation** — Show which Git commit the job ran against (via AAP's `scm_revision`)
3. **Trigger new run** — "Run now" button that launches the job template via AAP API
4. **Open in DevSpace/IDE** — Context-aware: opens latest commit for fixing (TBD: depends on "Edit in IDE" feature design)
5. **Inline failure reason** — One-line summary of the failed task (from AAP API)
6. **Commit-vs-run gap detection** — If latest commit > last run commit, show "Not yet tested — Run now"

## Key Insight: Context-Aware Actions

The UI must differentiate:
- **Code is stale (failed commit = latest commit):** Show "Open in DevSpace" + failure reason
- **Code is newer (latest commit > failed commit):** Show "Run now to verify fix" + dim failure as "outdated"

## IA Decision

- **Per-project tab** on the Project detail page (where the action happens)
- **Lightweight signal** on the Projects list (to surface failures without drilling in)
- The main Repositories tab stays **clean** — no AAP columns on the list
- NOT a cross-project tab on the main Projects page (duplicates AAP Controller)
- NOT a sidebar menu item (it's a relationship, not a separate domain)

## Implementation Approach

Build as a new tab ("Deployments" or "AAP") on the Project detail page containing:
- Push status summary (project + job template synced)
- Last run status with commit correlation and gap detection
- Job run history table (with deep links, failure reasons)
- "Run now" CTA (context-aware based on commit state)

## Dependencies

- AAP Controller API access (already exists in Portal backend)
- SCM API for latest commit comparison
- "Edit in IDE" feature design (affects the "Open to fix" action — pinned for later)

## Open Questions

- Launch parameters: v1 = defaults only, v2 = prompt for extra vars/inventory?
- Notifications: failure alerts in the Portal notification bell (future)
- Should "Run now" also be available from the kebab menu on the projects list?
