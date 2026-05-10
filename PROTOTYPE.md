# Ansible Portal — UX Prototype

> **Branch:** `feat/self-service-ux-prototype`
> **Status:** Vision prototype (near-to-mid-term desired state)
> **Maintainer:** Ran Elimelech

This branch contains a clickable UX prototype of the Ansible Portal built on top of the [ansible-backstage-plugins](https://github.com/ansible/ansible-backstage-plugins) codebase. It demonstrates information architecture, interaction patterns, and design direction for the self-service developer portal experience.

**This is a design artifact, not production code.** Most interactions use hardcoded demo data to simulate the experience without requiring live backend services.

---

## Quick Start

```bash
git clone https://github.com/Ranelim/ansible-backstage-plugins.git
cd ansible-backstage-plugins
git checkout feat/self-service-ux-prototype
cp app-config.local.example.yaml app-config.local.yaml
yarn install
yarn start
```

Open [http://localhost:3000](http://localhost:3000). First compilation takes 2–3 minutes.

> **AAP credentials are optional.** The prototype runs fully without them. Template wizards and EE/Collection sync won't connect to a live controller, but all demo data (Projects, Pipelines, Repositories, etc.) is hardcoded and always available.

If you have AAP access, edit `app-config.local.yaml` and fill in the `auth.providers.rhaap` and `ansible.rhaap` sections.

---

## What This Prototype Covers

### Core Experiences

| Area | Key experiences |
|------|----------------|
| **Projects** | Catalog list with filters, project detail page (Overview, README, YAML, Pipeline, AAP Activity, Resources tabs), pipeline master-detail drilldown, maturity tracker, starred items, kebab actions |
| **Repositories** | Discovered Git repos list, "Create project" flow from a repo, repository detail page (Overview with README, YAML, Commits tabs) |
| **Software Templates** | Template cards with starring, template detail page, 4-step creation wizard (AI Jumpstart → Git → Pipeline → AAP) |
| **Execution Environments** | Catalog with sidebar filters, EE detail pages, favoriting, sync status |
| **Collections** | Collection catalog with version filtering, collection detail pages |
| **Dev Spaces** | Context-aware "Edit in Dev Spaces" actions on projects, deep links from quality violations |
| **Getting Started** | Course catalog with an interactive getting-started checklist (progress persisted to localStorage) |
| **Search** | Omnibar dropdown with instant results, dedicated search page with sidebar filters |
| **Documentation** | TechDocs with custom empty state (consistent with other empty states) |
| **Administration** | Connections page, Sync Activity (history + schedules), sync job detail pages with log viewer |
| **Lightspeed AI** | Masthead toggle with overlay side panel |
| **Onboarding** | Dismissible contextual info banners + persistent help icons on every page, illustrative empty states |
| **Masthead** | Red Hat branding, quick-action create menu, starred items dropdown, notification/help popovers |

### Detail Pages

Every list in the prototype links to a detail page following a consistent pattern:

| Entity | Detail page pattern |
|--------|-------------------|
| **Project** | 6 tabs: Overview (pipeline summary, activity, sidebar with maturity tracker + about + source + links), README, YAML, Pipeline (master-detail with run drilldown), AAP Activity, Resources |
| **Repository** | 3 tabs: Overview (README, discovered content, recent commits, sidebar with about + source + status), YAML, Commits |
| **Template** | Backstage entity detail page with launch wizard |
| **EE** | Backstage entity detail page with EE metadata |
| **Collection** | Backstage entity detail page with collection metadata |
| **Sync Job** | Detail page with stage timeline and log viewer |

---

## Prerequisites

- **Node.js** 20 or 22
- **Yarn** 4.x (the repo uses Yarn Berry — `corepack enable` if needed)
- **Git**

---

## Configuration

### With AAP (optional)

Edit `app-config.local.yaml` and fill in:

| Field | Description |
|-------|-------------|
| `auth.providers.rhaap.development.host` | Your AAP controller URL |
| `auth.providers.rhaap.development.clientId` | OAuth2 client ID from AAP |
| `auth.providers.rhaap.development.clientSecret` | OAuth2 client secret from AAP |
| `ansible.rhaap.baseUrl` | Same AAP controller URL |
| `ansible.rhaap.token` | Personal access token from AAP |

### Without AAP

Just leave the AAP fields empty. The prototype runs in full demo mode.

---

## Demo Content

### Backstage Catalog Entities

The `demo/` directory contains Backstage catalog descriptors:

```
demo/
├── catalog/
│   └── projects.yaml              # 6 sample Component entities (automation projects)
└── templates/
    ├── playbook-project.yaml              # General Ansible Playbook template
    ├── cloud-provisioning-project.yaml    # Cloud infrastructure template
    └── network-automation-project.yaml    # Network automation template
```

These are loaded via `catalog.locations` in `app-config.local.yaml`. The example config already references them.

### Hardcoded Demo Data

Most UI data is defined directly in frontend components and requires no external setup:

| Data | Location |
|------|----------|
| Projects (6 projects with full pipeline/AAP state) | `plugins/self-service/.../catalog/projectsDemoData.ts` |
| Discovered repositories (8 repos) | `plugins/self-service/.../repositories/RepositoriesContent.tsx` |
| Dev Spaces integration (launch URLs) | `plugins/self-service/.../Projects/detail/ProjectDetailsPage.tsx` |
| Sync history, connections, admin data | `plugins/self-service/.../Admin/` |
| Search results, notifications | `packages/app/src/components/` |

---

## Project Structure (Prototype-Specific)

```
packages/app/src/
├── components/
│   ├── GlobalHeader/          # Custom masthead with branding, search, actions
│   ├── Lightspeed/            # AI side panel provider + toggle
│   ├── search/                # OmniSearch dropdown + SearchPage
│   ├── scaffolder/            # CustomTemplateCard for template grid
│   ├── common/                # DismissibleBanner (app-level)
│   └── docs/                  # TechDocsWrapper (custom empty state)
└── assets/                    # Red Hat logo PNG

plugins/self-service/src/
├── components/
│   ├── Projects/
│   │   ├── catalog/           # Projects list + demo data
│   │   ├── create/            # Template wizard (4-step creation flow)
│   │   ├── detail/            # ProjectDetailsPage (6-tab detail page)
│   │   └── repositories/     # RepositoriesContent + RepositoryDetailPage
│   ├── ExecutionEnvironments/ # EE catalog + create + detail
│   ├── CollectionsCatalog/    # Collections list + detail
│   ├── Learning/              # LearningPage (course catalog + checklist)
│   ├── Workspaces/            # (disconnected) Legacy workspace management files
│   ├── Admin/                 # Connections, Sync Activity, Sync Job Detail
│   ├── CatalogItemDetails/    # Template entity detail page
│   ├── common/                # PageHelpIcon, statusColors, DismissibleBanner, EmptyStateLayout
│   └── RouteView/             # Plugin route definitions
```

---

## Design Principles

1. **No deviation from the RHDH base image** — All customization lives in plugin code. The Backstage shell, sidebar framework, and core components are untouched.
2. **PatternFly 6 alignment via RHDH** — Backstage uses Material UI, but RHDH themes it to look like PF6. We follow RHDH as the source of truth, using Material components styled to PF6 patterns.
3. **Red Hat & Ansible microcopy guidelines** — Consistent voice, sentence case, action-oriented labels.
4. **Terminology consistency** — "Project" (not "service"), "Push to AAP" (not "publish"), "Execution environment" (not "EE definition"). Every concept is named once and used consistently.
5. **UX pattern consistency** — All empty states, list pages, detail pages, help patterns, and onboarding flows follow the same structure. Deviations are intentional and documented.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Projects as default landing page | Developers spend most time managing automation codebases |
| Repositories tab (not separate page) | Git repos are discovered context for projects — close proximity helps onboarding |
| 1:1 repo-to-project relationship | Prevents confusion from multiple projects pointing to the same repo |
| Maturity tracker in sidebar | Summary status that guides next actions — belongs in sidebar, not main content |
| Pipeline master-detail drilldown | Click a run to see individual stage results with expandable logs |
| 4-step wizard (AI → Git → Pipeline → AAP) | Maps to the natural lifecycle of creating governed automation |
| Sidebar filters (not toolbar chips) | Aligns with RHDH/Backstage catalog filter pattern |
| No dedicated Home page | Projects list serves as the landing; avoids a dashboard that duplicates navigation |
| Dismissible banners + persistent help icons | Contextual onboarding that can be dismissed but still accessible via `?` icon |
| Getting Started as a course catalog | Structured learning with progress tracking; extensible to future courses |
| Dev Spaces as launcher, not control plane | Dev Spaces has its own management dashboard; Portal provides context-aware launch links that Dev Spaces can't generate on its own |
| Lightspeed AI as overlay panel | Non-blocking AI assistance without leaving the current context |

---

## Reusable Patterns

These components are used consistently across the prototype and should be reused when adding new pages:

| Pattern | Component | Usage |
|---------|-----------|-------|
| Persistent contextual help | `PageHelpIcon` | `?` icon next to page titles — always accessible |
| Dismissible onboarding banner | `DismissibleBanner` | One-time info boxes, auto-dismissed |
| Empty state with illustration | `EmptyStateLayout` | Consistent empty states across all list pages |
| Status colors | `statusColors` | Centralized color constants for success/error/running/pending |
| Detail page sidebar | `AboutCard`, `SourceCard`, `LinksCard` | Consistent sidebar layout in detail pages |

---

## Known Limitations

- **Demo data only** — Most table data, sync history, and pipeline statuses are hardcoded. They demonstrate the UI but don't reflect live state.
- **Template wizard is visual only** — The creation wizard renders all steps but does not execute scaffolder actions.
- **Lightspeed panel is a shell** — The AI panel renders but does not connect to a real LLM backend.
- **Dev Spaces links are placeholder URLs** — "Edit in Dev Spaces" actions open `devspaces.example.com` URLs. In production, the base URL comes from `ansible.devSpaces.baseUrl` config.
- **Notification drawer is static** — Shows demo notifications; no real event system.
- **No RBAC simulation** — All pages are visible to all users. In production, Administration pages would be gated by role.
- **Pipeline logs are placeholder text** — Stage logs show simulated output, not real pipeline output.

---

## For Reviewers

### If you're a PM or stakeholder

1. Follow the [Quick Start](#quick-start) above
2. Start at the Projects page — this is the main developer experience
3. Click into a project to see the detail page (Overview, Pipeline, AAP Activity)
4. Try the Repositories tab to see discovered Git repos
5. Visit Getting Started (sidebar) to see the onboarding checklist
6. Open a project and use "Edit in Dev Spaces" from the sidebar card or kebab menu
7. Try the search (masthead) and Lightspeed AI toggle

### If you're an engineer

1. Look at the [Project Structure](#project-structure-prototype-specific) to understand where code lives
2. Review the [Reusable Patterns](#reusable-patterns) section — use these when building new pages
3. Check `projectsDemoData.ts` to understand the data model
4. The `ProjectDetailsPage.tsx` is the most complex component — start there for the full pattern

---

## Related Links

- [Upstream repo](https://github.com/ansible/ansible-backstage-plugins)
- [Red Hat Developer Hub docs](https://developers.redhat.com/rhdh)
- [Backstage documentation](https://backstage.io/docs)
- [PatternFly 6](https://www.patternfly.org/)
