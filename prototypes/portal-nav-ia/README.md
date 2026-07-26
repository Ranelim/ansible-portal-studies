# Portal navigation IA — in-app prototype

Branch: `design/portal-nav-ia`  
Epic: [AAP-84130](https://redhat.atlassian.net/browse/AAP-84130) · Story: [AAP-84131](https://redhat.atlassian.net/browse/AAP-84131)

Uses the **same Portal shell** as APME integration: RHDH `getThemes()`, Backstage `Sidebar` / `Page` / `HeaderTabs`, role-adaptive rail in `packages/app`.

## Run

From this worktree (`ansible-backstage-plugins-nav-ia`):

```bash
yarn start
```

(Local ports via `app-config.local.yaml` if 3000 is busy.)

## Compare IA models (side by side)

Purple **Nav IA prototype** banner (above the dark masthead) — short explanation + dropdown to switch models:

| Model | What it demonstrates |
|---|---|
| **Option 1 — Curated sections** | Role-adaptive Automate / Develop / Operate with curated entity items (incl. seat + sprawl demos) |
| **Option 2 — Flat list (RHDH)** | Pins + flat entities; **Administration** collapsible drawer sticky at bottom of the rail |
| **Option 3 — Experiences (toggle)** | Rail **Experience** select incl. **All (Home)** — Bridge-style dashboard + experiences + plugins; other modes own their menus |

Also: Profile → **Switch seat** (SME / Developer / ops seats / sprawl / Admin).

### Suggested walkthrough

1. Seat **Ops (both)** → **Option 1** → Inventories + Edge fleets under Operate.  
2. Same seat → **Option 2** → flat list vs curated.  
3. Seat **Admin** → **Option 3** → All (Home) dashboard / Experiences / Plugins, then open Develop or Administration.

## Key files

- `packages/app/src/components/Root/navSidebars.tsx` — rail models
- `packages/app/src/components/GlobalHeader/GlobalHeader.tsx` — seat switcher
- `packages/app/src/components/IaPrototype/` — purple banner + chrome heights
- `plugins/self-service/src/hooks/useNavIaModel.ts` — model / experience state
- `plugins/self-service/src/components/IaPlaceholder/` — placeholder + experiences home + catalog hub
