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
- Masthead globals next: search, notifications (drawer + center), personal settings

**Not** the Opt 1–5 bakeoff (kept on `design/portal-nav-ia` / :3011).

## Shell map (current)

| Surface | Chrome | Landing |
|---|---|---|
| **Bridge** (`/self-service/experiences`) | Masthead only | Experiences cards · search · sort · **Administration** button (admins, top-right — not a card) |
| **Assistant** (`/self-service/assistant`) | **Trial:** experience rail (return · New chat · history · Clear). **Rollback:** set `ASSISTANT_SIDE_NAV_TRIAL = false` in `plugins/self-service/.../assistantIaTrial.ts` → rail-less + page-header Back | Chat empty state + sticky composer |

| **Global account** (`/settings`, catalog `user/*`, `/notifications`) | Masthead only | No experience rail; **preserves** last experience for Back |
| **Inside experience** | Masthead + experience rail | Develop / Compliance / Edge → Dashboard / entity home |
| **Automate** | Masthead + page tabs (no rail) | Templates \| Activity — marketplace-clean |
| **Global Templates (`+`)** | Masthead + Back bar only | `/create` — all templates; does **not** enter Automate |
| **SME** | Masthead + Automate tabs (no Back) | `/create?scope=experience` (never Bridge) |

**Teasers (Aug 12):** Dashboard tab (deferred MVP), catalog search + Recent, AI Assistant experience (full page; masthead Lightspeed stays the quick drawer).

**Masthead / chrome gameplan:** RHDH = base; Portal = justified variation only. Prefer [RHDH Local](https://github.com/redhat-developer/rhdh-local) + global-header defaults for comparison — see `scratch/masthead-rhdh-baseline.md` (awaiting Shiran production header config).

## Working IA lock (Aug 13 — prototype only)

Not eng SoT until ADRs on `ansible-rhdh-plugins` `main`. Mirror: `.cursor/rules/portal-core.mdc` § Experiences shell.

### Locked

- **Rail order:** `[Dashboard?] → Templates → Runs → {Class A entities} → [Documentation · Learning Paths]` — quiet dividers, **no** end-user section labels (Overview / Run / Resources / Learn / Custom). Compare bar may swap Templates/Runs for one Templates rail item + page tabs.
- **Automate shell compare (magenta bar):**
  - **A — Automate experience + rail:** Automate stays on Bridge; side rail; all experiences use sibling **Templates · Runs** with `SidebarDivider`.
  - **B — No Automate; masthead + tabs:** Automate experience removed; masthead **+** = Templates \| Runs tabs; Develop/Compliance/Edge get one **Automate** rail item + page tabs.
- **Experience Settings omitted** from Automate / Develop / Compliance / Edge rails until real personal prefs exist (prototype page route may remain; not in nav). Sync schedule → Administration; Sync now → object action.
- **Develop objects:** One **Develop** experience. Git Repositories (nested: Repositories · Quality) · Collections · **Execution Env.** (rail; page title stays Execution Environments). Quality page: **Start scan** in Header; tabs Overview · Remediations · Scans. APME = Class B on Git Repositories — not a separate experience, not a Content quality pin. **No truncated rail labels** (`portal-rail-labels.mdc`).
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
| Done | Admin **Experiences** beside **Plugins**; **Notifications** admin shell (platform defaults — personal prefs stay in profile). |
| Decide | **Resources** header on experience rails for Class A only |
| Later | Real usage metrics + uninstall; nested-nav example; Cate/Kate APME feedback |

Waffle masthead try = parked (`SHOW_EXPERIENCES_WAFFLE = false`).
Admin Sync compare bar = parked (`FORCED_ADMIN_SYNC_IA = 'opt1'`; set `null` + restore `ADMIN_SYNC_IA_BAR_HEIGHT = 36` to revive).
Content quality **Findings** tab = parked (`SHOW_CONTENT_QUALITY_FINDINGS_TAB = false` in `plugins/self-service/.../quality/contentQualityIa.ts`; set `true` to revive by-rule rollup). Route `/apme/findings` + `QualityDashboardTabContent` kept.


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
