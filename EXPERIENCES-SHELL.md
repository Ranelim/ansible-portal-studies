# Portal Experiences shell (prototype)

**Branch:** `design/portal-experiences-shell`  
**Worktree:** `ansible-backstage-plugins-experiences/`  
**Local:** http://localhost:3012 (backend :7022)  
**Archive (options 1–5):** `design/portal-nav-ia` → `ansible-backstage-plugins-nav-ia/` → :3011 · tag `nav-ia-options-v1`

## Purpose

Build the **Experience Bridge** shell from the Aug 11 stakeholder direction:

- Card catalog landing (orientation) under global masthead — **no domain rail on Bridge**
- Enter experience → dedicated rail; return to Bridge via **Experiences** pin
- SME → Automate only (no Bridge, no switcher)
- No Opt 1–5 purple banner / model switcher on this branch
- **Demo jumper (quiet hairline, always on):** **Landing** = Day 0 wizard after CLI (`/self-service/setup`). **Setup** = first admin session on the Portal (`/self-service/experiences`) — Automate **Launch**; Develop / Compliance / Edge **Setup** until each wizard finishes. Integrations **Needs setup** = everything except AAP (Git, Hub, registries, Dev Spaces). **Post-setup** = Git / Hub / registries connected and every experience enabled (all **Launch**); Dev Spaces stays disconnected as the leftover Needs setup row. After wizard **Sign in with AAP** → demo AAP Gateway login → **Setup** beat on the Bridge. Admin Quick start is **platform** jobs (Integrations, access, Experiences discover, sync schedules) — not per-experience wizards. Discover it from Administration Dashboard **Finish Portal setup**; return from **Help → Quick start**. No Welcome modal. Shortcut: `/self-service/setup?screen=aap-login`.
- Masthead globals next: search, notifications (drawer + center), personal settings

**Not** the Opt 1–5 bakeoff (kept on `design/portal-nav-ia` / :3011).

## Shell map (current)

| Surface | Chrome | Landing |
|---|---|---|
| **Bridge** (`/self-service/experiences`) | Masthead only | Experiences cards · search · sort · **Administration** button (admins, top-right — not a card) |
| **Global account** (`/settings`, catalog `user/*`, `/notifications`) | Masthead only | No experience rail; **preserves** last experience for Back |
| **Inside experience** | Masthead + experience rail | Develop / Compliance / Edge → Dashboard / entity home |
| **Automate** | Masthead + page tabs (no rail) | Templates \| Activity — marketplace-clean |
| **Global Templates (`+`)** | Masthead + Back bar only | `/create` — all templates; does **not** enter Automate |
| **SME** | Masthead + Automate tabs (no Back) | `/create?scope=experience` (never Bridge) |

**Teasers (Aug 12):** Dashboard tab (deferred MVP), catalog search + Recent. **Assistant experience parked** (`SHOW_ASSISTANT_EXPERIENCE = false`) — masthead **Lightspeed** FAB stays. **Orchestrator parked** (`SHOW_ORCHESTRATOR_EXPERIENCE = false`) — not an experience in this prototype.

**Masthead / chrome gameplan:** RHDH = base; Portal = justified variation only. Prefer [RHDH Local](https://github.com/redhat-developer/rhdh-local) + global-header defaults for comparison — see `scratch/masthead-rhdh-baseline.md` (awaiting Shiran production header config).

## Working IA lock (Aug 13 — prototype only)

Not eng SoT until ADRs on `ansible-rhdh-plugins` `main`. Mirror: `.cursor/rules/portal-core.mdc` § Experiences shell.

### Locked

- **Rail order:** `[Dashboard?] → Templates → Runs → {Class A entities} → [Documentation · Learning Paths]` — quiet dividers, **no** end-user section labels (Overview / Run / Resources / Learn / Custom). Compare bar may swap Templates/Runs for one Templates rail item + page tabs.
- **Automate shell compare (magenta bar):**
  - **A — Automate experience + rail:** Automate stays on Bridge; side rail; all experiences use sibling **Templates · Runs** with `SidebarDivider`.
  - **B — No Automate; masthead + tabs:** Automate experience removed; masthead **+** = Templates \| Runs tabs; Develop/Compliance/Edge get one **Automate** rail item + page tabs.
- **Experience Settings omitted** from Automate / Develop / Compliance / Edge rails until real personal prefs exist (prototype page route may remain; not in nav). Sync schedule → Administration; Sync now → object action.
- **Develop objects:** One **Develop** experience. **Content** (nested: Git Repositories · Content quality) · Collections · **Execution Env.** (rail; page title stays Execution Environments). Content quality page: **Start scan** in Header; tabs Overview · Scans · Remediations. Overview = each repository’s **latest completed scan** (no 7/30 toggle; do not say current/obsolete). Findings heading: **N findings on latest scans**. History is on Scans. Active badge = current scan per repo (not “Latest”). APME = Class B on Git Repositories — not a separate experience, not a Content quality pin. **No truncated rail labels** (`portal-rail-labels.mdc`).
- **Compliance object:** Inventories only. Profiles / Scans = host tabs — not rail, not Settings.
- **Learn (Develop / Compliance / Edge):** after Class A objects — quiet divider, then **Documentation** + **Learning Paths** (no “Learn” rail label). Not on Automate or Admin.
- **Automate = rail-less marketplace** — page tabs **Templates | Activity** only (Catalog dropped). Multi-seat: **Back to Experiences**. SME: no Back on Automate; Search → **Back to Automate**.
- **Search = global shell** — not tied to the last experience rail; return bar resumes Bridge or prior experience (SME → Automate).
- **One Templates catalog** — masthead **+** = **all** templates (rail-less `/create`, no experience chrome); Automate Templates tab = `?scope=experience`; object **Create** = filtered modal. **+ does not open Automate.**
- **Object scaffolder = Create CTA → modal** (Aug 13) — Git Repositories, EEs, Inventories, Edge fleets. No trailing Scaffold / Templates / Create **tab** on the host for create. Import remains a secondary action where needed.
- **Bridge Administration** (Aug 13, Taufique) — not an experience card; top-right **Administration** button for admins. Experience cards get info ⓘ → popover + docs link.

### Open

- Massimo **dynamic profile tabs**
- When experience **Settings** returns
- **Resources** rail header for Class A only? (Taufique Aug 13 meeting OK — conflicts with “no section labels” quiet lock; decide next)
- Nested experience nav: **RHDH already has it** (IT Hub: Catalog accordion + `>` submenus). Portal question is *when* to use it (tab overflow / non-host add-on), not whether the widget exists. Do not call it a PF-only drawer.

### Change now — from Ran + Taufique meeting (Aug 13 ~16:38)

**Doc:** [Notes + transcript](https://docs.google.com/document/d/1nX49zFqZ7MnZfM5sw_NXoXg0dSTd8XQXVR42j7k_joc/edit?tab=t.58r4c16xhy1b) · detail in `scratch/experiences-decision-brief.md` § Aug 13 meeting.

| Priority | Change |
|---|---|
| Next | Stakeholder **login → intro → Experiences** flow |
| Next | Account chrome: **Back** (not “Developer”) |
| Done (park) | Admin Sync **Option 1** forced (`FORCED_ADMIN_SYNC_IA = 'opt1'`); magenta compare bar hidden; Overview **Sync health** card removed. Opt 2 code kept for revive. Still open under Opt 1: tab **Sync settings**; modal→history; drop Quality from Integrations |
| Done (park) | Quality remediation **Inline visual** forced (`FORCED_REMEDIATION_WIZARD = 'visual'`), Continue under the stepper (`FORCED_CTA_LAYOUT = 'current'`). **Scan → Results → Auto remediations → AI remediations** (skip Auto/AI if none) **→ Commit**. Scan is progress only; it auto-advances to Results. Resume / already scanned lands on Results. Results = all findings, read-only (Dev Spaces on not-fixable). **Remediate** starts Auto. No Manual step. Prototype wizard, sticky-footer, and **layout compare** parked. **Redesign 4** forced. Same-path auto-fixes still share one Accept / Decline. Current / Current redesign / Redesign 3 stay in code. UI before node grouping: `239d2106`. **Bundled one-page review** (no Results step; Generate AI on Results & Remediation): git tag `remediation-bundled-results-and-ai` (`b82fca95`). Set `SHOW_REVIEW_LAYOUT_COMPARE = true` and `FORCED_REVIEW_LAYOUT = null` to revive `?review=`. Set wizard/CTA force `null` to revive `?wizard=` / `?cta=`. |
| Done (park) | **Assistant experience** killed (`SHOW_ASSISTANT_EXPERIENCE = false`). Lightspeed FAB stays. Set `true` in `assistantIaTrial.ts` to revive the Bridge card + `/self-service/assistant`. |
| Done (park) | **Orchestrator** hidden (`SHOW_ORCHESTRATOR_EXPERIENCE = false`). Not a Portal experience in this prototype. Wizard/route kept. Set `true` in `orchestratorExperience.ts` to revive. |
| Done (park) | Admin **Plugins** killed (`SHOW_ADMIN_PLUGINS = false`). Rail item, page, and Experiences **Manage plugins** hidden. Set `true` in `adminPluginsTrial.ts` to revive. `/self-service/admin/plugins` redirects to Experiences. |
| Done | Admin **Experiences**; **Notifications** admin shell (platform defaults — personal prefs stay in profile). |
| Decide | **Resources** header on experience rails for Class A only |
| Later | Real usage metrics + uninstall; nested-nav example; Cate/Kate APME feedback |

Waffle masthead try = parked (`SHOW_EXPERIENCES_WAFFLE = false`). Multi-seat return = rail back chevron + quiet `ExperienceSwitcher` (`EXPERIENCE_CHROME_HIT = 32`, square chevron). Do **not** unify into one split box.
Admin Sync compare bar = parked (`FORCED_ADMIN_SYNC_IA = 'opt1'`; set `null` + restore `ADMIN_SYNC_IA_BAR_HEIGHT = 36` to revive).
Quality remediation session = Inline visual (`FORCED_REMEDIATION_WIZARD = 'visual'`): Scan → Findings → Auto remediations → AI remediations (skip if none) → Commit. Scan auto-advances to Findings. Findings is all findings, read-only, sorted by severity. Card title **`N findings`** (`listHeading`: 1.25rem / 600). Severity chips + category bars = full scan mix (search / content type / tabs do not change them). Search + Content type sit below the bars, above **N showing**. Tabs under showing: All · Auto remediations · Requires AI remediation · Manual remediation only (counts; slice the list). Continue under the stepper (`FORCED_CTA_LAYOUT = 'current'`). No Manual step. Prototype wizard, sticky-footer, and layout compare parked. **Redesign 4** forced (`FORCED_REVIEW_LAYOUT`). **Design options** parked (`SHOW_STEPS_COMPARE = false`, `FORCED_STEPS_MODEL = 'without-findings'`): session is **Without findings** — stepper **Scan → Findings and Auto remediations → AI remediations → Commit**. Set `SHOW_STEPS_COMPARE = true` and `FORCED_STEPS_MODEL = null` to revive With findings. Title is **org/repo**; subtitle is **Health scan: timestamp · commit SHA**; Back keeps the destination. **With findings** uses a stacked unified diff by default on Findings, Auto remediations, and AI remediations. Icon toggle (stacked / side by side) sits on the right of the **N showing** row. AI banner sits below Search / Content type, above the showing count. Findings shows the current snippet for auto remediations; AI copy says generate on the AI remediations step after Auto remediations; Manual only is not in this flow. Every finding card shows a type badge (**Auto remediation** · **AI remediation** · **Manual remediation**) — including Auto, AI, combined, and Commit (not only the All tab). **Open in Dev Spaces** sits in the card header slot (same 28px place as Accept / Decline). Auto remediations chrome matches Without findings auto chrome (title **N findings with auto remediations** + body2 what auto remediations are; Findings-style severity chips + category **bars** on With findings Findings only). **With findings** Auto and AI, and **Without findings** Auto and AI: no category bars — category chips sit next to severity. Search + Content type below; two-state rows; accepted cards green wash, declined red (both design options); Include all omitted. Sticky footer Auto / combined: left **Accept all** / **Decline all** (autos start accepted; not remaining); right **✓ N accepted** (green) **, ✕ N declined** (red) — **no remaining count**. AI step: left **Accept remaining (N)** / **Decline remaining (N)**; right includes **N remaining**. **Without findings** combined step: lane readout under the subhead (**N auto remediations** · **N need AI** · **N manual only**, each with ⓘ; not mixed into severity/category chips). **Without findings** skips Findings — stepper **Scan → Findings and Auto remediations → AI remediations → Commit**; stacked unified diff; card title **N findings, M with auto remediations**; subhead **Auto remediations are…**; severity/category chips = full scan mix; remainder cards below (Needs AI / Manual only). **Commit** (both design options, and the post-commit receipt): branch/PR card, then the review box: **Search remediations** + **Severity** + **Remediation type** + **Content type**, then **Accepted remediations (N)** / **Remaining issues (N)** tabs listing the same finding cards. Filters slice the current tab’s cards; tab badges stay unfiltered. Remaining = declined + ungenerated AI + manual. Row Accept/Decline stay as last-chance (no bulk remaining on Commit); declining/accepting **collapses the card out** (~280ms) before it leaves the tab. After push: same review box (read-only, toggles disabled, wash kept) under an outlined **Pull request opened** header — not a file-grouped receipt. Rollback bundled one-page review (Scan → Results & Remediation with Generate AI on that page → Commit): tag `remediation-bundled-results-and-ai` (`b82fca95`). Rollback loved chrome (pre-nodes): `git reset --hard 239d2106`. Set `SHOW_REVIEW_LAYOUT_COMPARE = true` and `FORCED_REVIEW_LAYOUT = null` to revive Current / Current redesign / Redesign 3 / Redesign 4.
**Scan details** (Scans tab snapshot) follows remediations finding chrome as SoT — do not restyle remediations to match scans. Finding cards: title = message; meta = `file:line · Kind · ruleId`; solid severity + outlined category + outlined **Auto / AI / Manual remediation**. Filter stack matches remediations Auto/combined: mix bar, severity + category chips, **Search findings**, Content type; **N showing** + Expand all. Outlined cards; expand still shows code context (not remediating diffs). Keep **All scans** back, Active, Remediate. Do not copy stepper, Accept/Decline, decision wash, or Commit dropdowns.
Content quality **Findings** tab = parked (`SHOW_CONTENT_QUALITY_FINDINGS_TAB = false` in `plugins/self-service/.../quality/contentQualityIa.ts`; set `true` to revive by-rule rollup). Route `/apme/findings` + `QualityDashboardTabContent` kept.  
**Page empty state (context only, Aug 27):** Backstage `EmptyState` + RHDH theme — not an RHDH custom widget. Preview on Overview: `?empty=no-repos` · `?empty=no-scans`. Note: `scratch/empty-state-plugin-factory.md`. Not a factory lock / not `main` SoT.
Remediations **progress** column = parked (`SHOW_REMEDIATION_PROGRESS_COLUMN = false` in the same file; set `true` to revive the compact stepper). `CompactSessionStepper` stays in `RemediationsContent`.
Assistant experience = parked (`SHOW_ASSISTANT_EXPERIENCE = false`). Lightspeed FAB stays.
**SETUP MODE** badge = CLI temp-password login + wizard / applying only — not the AAP Gateway login screen.
Integrations **Needs setup** unread = blue **count** on the filter (no extra pip beside the badge). Setup jumper calls `resetSetupAttentionUnread()`; Post-setup calls `markSetupAttentionSeen()`. Administration Bridge pip may pulse; rail pips stay static. Reduced-motion: no pulse.


## Git

- Push **`gitlab` only** (never public `origin` / `fork`)
- Pages: **`/portal-experiences/`** · shortcut `/experiences.html` · deploy `./deploy-pages-experiences.sh` (does not replace root APME or `/portal-nav-ia/`)

## Run

```bash
cd ~/portal-projects/ansible-backstage-plugins-experiences
yarn start
# → http://localhost:3012
```

## Share (GitLab Pages — VPN)

- https://ansible-portal-prototypes-c8c2a0.pages.redhat.com/portal-experiences/
- Shortcut: https://ansible-portal-prototypes-c8c2a0.pages.redhat.com/experiences.html

For the 5-option exploration:

```bash
cd ~/portal-projects/ansible-backstage-plugins-nav-ia
yarn start
# → http://localhost:3011
```
