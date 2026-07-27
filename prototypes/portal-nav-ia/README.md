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
| **Option 1 — Flat list (RHDH)** | **One menu item per primary entity**; each entity holds its ecosystem (plugins/tabs/actions). Pins + flat phonebook; Home = seat dashboard; Admin drawer at bottom |
| **Option 2 — Curated sections** | **Run** (Templates + Activity) on top as global run band, then **Develop / Operate** entity sections by seat |
| **Option 3 — Experiences (toggle)** | One experience at a time; All (Home) = Bridge hub for experiences/plugins (no run items until a mode) |

Also: Profile → **Switch seat** (SME / Developer / Compliance ops / Edge ops / Ops both / Admin).

### Suggested walkthrough

1. Seat **Ops (both)** → **Option 1** → flat Inventories + Edge fleets; open Home dashboard.  
2. Same seat → **Option 2** → Templates/Activity on top, then Operate entities.  
3. Seat **Developer** → **Option 2** → same run pins on top, then Develop; repo tabs use Scaffold / Pipeline activity.  
4. Seat **Admin** → **Option 3** → All (Home) / Experiences / Plugins, then open Develop or Administration.

## Key files

- `packages/app/src/components/Root/navSidebars.tsx` — rail models
- `packages/app/src/components/GlobalHeader/GlobalHeader.tsx` — seat switcher
- `packages/app/src/components/IaPrototype/` — purple banner + chrome heights
- `plugins/self-service/src/hooks/useNavIaModel.ts` — model / experience state
- `plugins/self-service/src/components/IaPlaceholder/` — Flat Home dashboard, experiences home, catalog hub
