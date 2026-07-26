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
| **Option 1 — Section drawers + Catalog (curated)** | Default band: **Catalog** hub + Templates + Activity; drawers for Develop / Operate / … |
| **Option 2 — Experiences (toggle)** | Rail **Experience** select incl. **All (Home)** — dashboard + catalog of experiences/plugins; other modes own their menus |
| **Option 3 — Flat list (RHDH)** | Pins + flat entities; **Administration** collapsible drawer sticky at bottom of the rail |
| **Option 4 — Curated sections** | Role-adaptive Automate / Develop / Operate with curated entity items (incl. seat + sprawl demos) |

Also: Profile → **Switch seat** (SME / Developer / ops seats / sprawl / Admin).

### Suggested walkthrough

1. Seat **Ops (both plugins)** → chip **Option 1** → open **Catalog**, filter Inventories vs Edge fleets.  
2. Same seat → chip **Option 2** → toggle **Compliance** vs **Edge** in the header; note Templates/Activity duplicated and tabs expanded.  
3. Seat **Compliance ops** alone under Option 2 → only Automate + Compliance experiences (land and stay).  
4. Seat **Admin** → chip **Option 3** → compare phonebook flat list vs Option 1 drawers.  
5. Compare with **Option 4** (curated sections).

## Key files

- `packages/app/src/components/Root/navSidebars.tsx` — three rail models
- `packages/app/src/components/GlobalHeader/GlobalHeader.tsx` — IA chip + experience select
- `plugins/self-service/src/hooks/useNavIaModel.ts` — model / experience state
- `plugins/self-service/src/components/IaPlaceholder/UnifiedCatalogPage.tsx` — Option 1 Catalog
