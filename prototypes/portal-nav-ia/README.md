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
| **Option 1 — Baseline (RHDH-like)** | Baseline for comparison (not shipped Portal SoT). Unlabeled rail: Home, Catalog, Templates, Activity, Learn, then flat entity phonebook; Admin drawer; rail Search. **Entity tabs:** Dashboard? → list → domain → Templates \| Settings |
| **Option 2 — Pins + job-band sections** | Strong baseline proposal: unlabeled Home + Templates + Activity, then labeled Develop / Operate / Learn / Administration (by seat). No Catalog; rail Search kept. Seat landings. **Entity tabs:** list → domain → Scaffold \| Settings |
| **Option 3 — Home band + job sections** | **Home** bundles Dashboard (if Develop/Operate/Admin on), Search, Templates, Activity, Learn. Then Develop / Operate / Administration. No Outcomes. No masthead search. |
| **Option 4 — Run + gated Home** | Labeled **Run**; no floating rail Search (header OmniSearch). Multi-band: gated **Home** (Dashboard, Search) above Run; SME stays Run + Learn. Then Develop / Operate / Learn / Administration |
| **Option 5 — Concept: Experiences** | Concept only. One experience at a time. Domain order: Dashboard → Templates → Activity → entities → Settings. **Entity tabs (list-first):** list → domain → Templates \| Settings. Not a default-shell finalist — listed last |


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
2. Same seat → **Option 2** → Home + Templates/Activity, then Operate entities.  
3. Seat **SME** → **Option 3** → flat Home pins (Search, Templates, Activity, Learn); lands on Templates.  
4. Seat **SME** → **Option 4** → Run + Learn only (no rail Search); lands on Templates.  
5. Seat **Developer** → **Option 4** → Run + Develop + Learn; lands on Git Repositories.  
6. Seat **Ops (both)** → **Option 4** → Run + Operate + Learn; lands on Inventories / Edge fleets.  
7. Seat **Ops (both)** → **Option 5** → Edge → **Dashboard** (overview) → **Edge fleets** (list-first).  
8. Seat **Developer** → **Option 5** → Develop Dashboard → repos/collections/EEs as lists.  
9. Seat **Admin** → **Option 5** → Develop → **Settings** → deep-link to Integrations (Administration).

## Key files

- `packages/app/src/components/Root/navSidebars.tsx` — rail models
- `packages/app/src/components/GlobalHeader/GlobalHeader.tsx` — seat switcher
- `packages/app/src/components/IaPrototype/` — purple banner + chrome heights
- `plugins/self-service/src/hooks/useNavIaModel.ts` — model / experience state
- `plugins/self-service/src/components/IaPlaceholder/` — Flat Home dashboard, experiences home, catalog hub
