# Portal navigation IA — in-app prototype

Branch: `design/portal-nav-ia`  
Epic: [AAP-84130](https://redhat.atlassian.net/browse/AAP-84130) · Story: [AAP-84131](https://redhat.atlassian.net/browse/AAP-84131)

Uses the **same Portal shell** as APME integration: RHDH `getThemes()`, Backstage `Sidebar` / `Page` / `HeaderTabs`, role-adaptive rail in `packages/app`.

## Share (GitLab Pages)

- Prototype: https://ansible-portal-prototypes-c8c2a0.pages.redhat.com/portal-nav-ia/
- Shortcut: https://ansible-portal-prototypes-c8c2a0.pages.redhat.com/nav-ia.html
- Source branch: `design/portal-nav-ia` (does **not** replace the root APME Pages deploy)

VPN required. Prefer landing on the URLs above, then switch models in the purple banner (GitLab Pages deep-link refresh can fall through to the root 404).

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
| **Option 1 — Flat list (RHDH)** | Unlabeled rail: Home, Catalog, Templates, Activity, Learn, then flat entity phonebook; Admin drawer; rail Search. **Entity tabs:** Dashboard? → list → domain → Templates \| Settings |
| **Option 2 — Pins + job-band sections** | **Recommended:** unlabeled Templates + Activity, then labeled Develop / Operate / Learn / Administration (by seat). No Home/Catalog; rail Search kept. Seat landings. **Entity tabs:** list → domain → Scaffold \| Settings |
| **Option 3 — Experiences (toggle)** | One experience at a time. Domain order: Dashboard → Templates → Activity → entities → Settings. **Entity tabs (list-first):** list → domain → Templates \| Settings (no entity Dashboard tab). Exploration only |
| **Option 4 — Pins + job bands (header search)** | **Same rail as Option 2**, but no rail Search — header OmniSearch only. Use to walk seats on the recommended IA |


Switching models always lands on that model’s home. A route guard also redirects if you bookmark a model-specific URL (e.g. Bridge Dashboard under curated).

### Entity page tab pattern (locked for this prototype)

```
[Dashboard?] → [{Entity} list] → [domain tabs…] → [Templates | Settings]
```

- **Landing:** Dashboard if present, else entity-named list — never “Catalog”.
- **Trailing:** one of Templates (entity-filtered) or user Settings — not Admin config.
- Applied on Inventories + Edge fleets placeholders; Git Repositories already matches (list → domain → Scaffold).

Also: Profile → **Switch seat** (SME / Developer / Compliance ops / Edge ops / Ops both / Admin).

### Suggested walkthrough

1. Seat **Ops (both)** → **Option 1** → flat Inventories + Edge fleets; open Home dashboard.  
2. Same seat → **Option 2** → Templates/Activity on top, then Operate entities.  
3. Seat **Ops (both)** → **Option 3** → Edge → **Dashboard** (overview) → **Edge fleets** (list-first, no Dashboard tab).  
4. Seat **Developer** → **Option 3** → Develop Dashboard → repos/collections/EEs as lists.  
5. Seat **Admin** → **Option 3** → Develop → **Settings** → deep-link to Integrations (Administration).  
6. Seat **SME** → **Option 4** → Templates + Activity + Learn only (no rail Search); lands on Templates.  
7. Seat **Developer** → **Option 4** → Templates/Activity + Develop + Learn; lands on Git Repositories.  
8. Seat **Ops (both)** → **Option 4** → Templates/Activity + Operate + Learn; lands on Inventories / Edge fleets.

## Key files

- `packages/app/src/components/Root/navSidebars.tsx` — rail models
- `packages/app/src/components/GlobalHeader/GlobalHeader.tsx` — seat switcher
- `packages/app/src/components/IaPrototype/` — purple banner + chrome heights
- `plugins/self-service/src/hooks/useNavIaModel.ts` — model / experience state
- `plugins/self-service/src/components/IaPlaceholder/` — Flat Home dashboard, experiences home, catalog hub
