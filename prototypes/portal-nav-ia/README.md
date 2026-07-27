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
| **Option 1 — Flat list (RHDH)** | **Rail (side nav):** one menu item per primary entity. Pins + flat phonebook; Admin drawer. **Entity tabs:** Dashboard? → list → domain → Templates \| Settings |
| **Option 2 — Curated sections** | **Rail (side nav):** same one-item-per-entity rule; Run band then labeled Develop / Operate / Learn / Admin sections. **Entity tabs:** same as Option 1 |
| **Option 3 — Experiences (toggle)** | **Rail (side nav):** one experience at a time; still one item per entity. Domain order: Dashboard → Templates → Activity → entities → Settings. **Entity tabs (list-first):** list → domain → Templates \| Settings (no entity Dashboard tab) |


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

## Key files

- `packages/app/src/components/Root/navSidebars.tsx` — rail models
- `packages/app/src/components/GlobalHeader/GlobalHeader.tsx` — seat switcher
- `packages/app/src/components/IaPrototype/` — purple banner + chrome heights
- `plugins/self-service/src/hooks/useNavIaModel.ts` — model / experience state
- `plugins/self-service/src/components/IaPlaceholder/` — Flat Home dashboard, experiences home, catalog hub
