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
| **Assistant** (`/self-service/assistant`) | Masthead only | Chat skeleton (TBD) |
| **Global account** (`/settings`, catalog `user/*`, `/notifications`) | Masthead only | No experience rail; **preserves** last experience for Back |
| **Inside experience** | Masthead + experience rail | Automate → Templates; others → Dashboard / entity home |
| **SME** | Masthead + Automate rail | `/create` (never Bridge) |

**Teasers (Aug 12):** Dashboard tab (deferred MVP), catalog search + Recent, AI Assistant experience (full page; masthead Lightspeed stays the quick drawer).

**Masthead / chrome gameplan:** RHDH = base; Portal = justified variation only. Prefer [RHDH Local](https://github.com/redhat-developer/rhdh-local) + global-header defaults for comparison — see `scratch/masthead-rhdh-baseline.md` (awaiting Shiran production header config).

## Working IA lock (Aug 13 — prototype only)

Not eng SoT until ADRs on `ansible-rhdh-plugins` `main`. Mirror: `.cursor/rules/portal-core.mdc` § Experiences shell.

### Locked

- **Rail order:** `[Dashboard?] → Templates → Activity → {Class A entities}` — quiet dividers, **no** end-user section labels (Overview / Run / Resources / Custom).
- **Templates ∥ Activity** siblings — never nest Activity under Templates.
- **Experience Settings omitted** from Automate / Develop / Compliance / Edge rails until real personal prefs exist (prototype page route may remain; not in nav). Sync schedule → Administration; Sync now → object action.
- **Develop objects:** Git Repositories · Collections · Execution Environments. APME = Quality on repos (Class B).
- **Compliance object:** Inventories only. Profiles / Scans = host tabs — not rail, not Settings.
- **One Templates catalog** — masthead + / experience Templates / object CTA = same list, different filters.
- **Object scaffolder = Create CTA → modal** (Aug 13) — Git Repositories, EEs, Inventories, Edge fleets. No trailing Scaffold / Templates / Create **tab** on the host for create. Import remains a secondary action where needed.
- **Bridge Administration** (Aug 13, Taufique) — not an experience card; top-right **Administration** button for admins. Experience cards get info ⓘ → popover + docs link.

### Open

- Automate **Catalog** (exploration)
- **Remediations** placement; Massimo **dynamic profile tabs**
- Rail-less SME Automate (page tabs Templates \| Activity)
- When experience **Settings** returns


## Git

- Push **`gitlab` only** (never public `origin` / `fork`)
- Pages (later): prefer `/portal-experiences/` so `/portal-nav-ia/` stays the museum

## Run

```bash
cd ~/portal-projects/ansible-backstage-plugins-experiences
yarn start
# → http://localhost:3012
```

For the 5-option exploration:

```bash
cd ~/portal-projects/ansible-backstage-plugins-nav-ia
yarn start
# → http://localhost:3011
```
