# Portal Experiences shell (prototype)

**Branch:** `design/portal-experiences-shell`  
**Worktree:** `ansible-backstage-plugins-experiences/`  
**Local:** http://localhost:3012 (backend :7022)  
**Archive (options 1–5):** `design/portal-nav-ia` → `ansible-backstage-plugins-nav-ia/` → :3011 · tag `nav-ia-options-v1`

## Purpose

Build the **Experience Bridge** shell from the Aug 11 stakeholder direction:

- Card catalog landing (orientation) under global masthead — no domain rail on Bridge
- Enter experience → dedicated rail; return to Bridge
- One experience → no switcher chrome
- Masthead globals: search, notifications (drawer + center), personal settings
- Admin / plugins / settings levels / notifications — stub then deepen

**Not** the Opt 1–5 bakeoff (kept on `design/portal-nav-ia`).

## Git

- Push **`gitlab` only** (never public `origin` / `fork`)
- Pages (later): prefer `/portal-experiences/` so `/portal-nav-ia/` stays the museum

## Run

```bash
cd ~/portal-projects/ansible-backstage-plugins-experiences
yarn start
# → http://localhost:3012
```
