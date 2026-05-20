# Ansible Portal — UX Prototype

> **Branch:** `design/trunk`
> **GitLab:** https://gitlab.cee.redhat.com/relimele/ansible-portal-prototypes/-/tree/design/trunk
> **Status:** Vision prototype (near-to-mid-term desired state)
> **Maintainer:** Ran Elimelech

This branch contains a clickable UX prototype of the Ansible Portal built on top of the [ansible-backstage-plugins](https://github.com/ansible/ansible-backstage-plugins) codebase. It demonstrates information architecture, interaction patterns, and design direction for the self-service developer portal experience.

**This is a design artifact, not production code.** Most interactions use hardcoded demo data to simulate the experience without requiring live backend services.

---

## Quick Start

```bash
git clone https://gitlab.cee.redhat.com/relimele/ansible-portal-prototypes.git
cd ansible-portal-prototypes
git checkout design/trunk
cp app-config.local.example.yaml app-config.local.yaml
yarn install
yarn start
```

Open [http://localhost:3000](http://localhost:3000). First compilation takes 2–3 minutes. Log in as guest.

> **AAP credentials are optional.** The prototype runs fully without them. Template wizards and EE/Collection sync won't connect to a live controller, but all demo data (Projects, Repositories, Quality, etc.) is hardcoded and always available.

If you have AAP access, edit `app-config.local.yaml` and fill in the `auth.providers.rhaap` and `ansible.rhaap` sections.

---

## For AI Agents

If you're an AI coding agent helping a developer run or modify this prototype:

### Deploy and run

1. Ensure Node.js 20+ and Yarn 4.x are available (`corepack enable` if needed)
2. Clone from GitLab (above) or from the GitHub fork: `https://github.com/Ranelim/ansible-backstage-plugins.git`
3. Check out `design/trunk`
4. Copy `app-config.local.example.yaml` to `app-config.local.yaml` (no edits needed for demo mode)
5. Run `yarn install` then `yarn start`
6. The app compiles and serves on `localhost:3000` (frontend) and `localhost:7007` (backend)
7. Log in as **guest** — no credentials needed

### Key constraints

- All UI customizations live in `plugins/self-service/` — never modify the RHDH/Backstage core
- Use Material-UI components themed to PatternFly 6 (RHDH adaptation) — never import PF React directly
- Demo data files (`*DemoData.ts`, `syncDemoData.ts`, `unifiedDemoData.ts`) provide all mock state
- The navigation is role-adaptive: use `useUserRole` hook and `hasRole('developer')` / `hasRole('admin')` for gating
- Dev Spaces actions only render when `DEMO_CONNECTIONS` has Dev Spaces set to `'Active'`

### If the dev server fails to start

- Kill stale processes: `lsof -ti :3000 | xargs kill; lsof -ti :7007 | xargs kill`
- Retry `yarn start`

---

## What This Prototype Covers

### Core Experiences

| Area | Key experiences |
|------|----------------|
| **Git Repositories** | Discovered repos list with provider filter, violations column, content discovery badges, kebab actions, starring |
| **Projects** | Project detail page (Overview, Quality, Dependencies, README, YAML, Deployments, Resources tabs), starred items |
| **Software Templates** | Template cards with starring, template detail page, multi-step creation wizard |
| **Execution Environments** | Catalog with sidebar filters, EE detail pages, favoriting, sync status |
| **Collections** | Collection catalog with version filtering, collection detail pages |
| **Quality** | Quality tab with scan history, violation details, AI-suggested fixes, fleet-wide quality dashboard |
| **Dev Spaces** | Context-aware "Edit in Dev Spaces" actions on projects and repos, deep links from quality violations |
| **Getting Started** | Course catalog with an interactive getting-started checklist (progress persisted to localStorage) |
| **Search** | Omnibar dropdown with instant results, dedicated search page with sidebar filters |
| **Documentation** | TechDocs with custom empty state (consistent with other empty states) |
| **Administration** | Connections/Integrations page, Dev Spaces config, Sync Activity, EE Builder, sync job detail pages |
| **Lightspeed AI** | Masthead toggle with overlay side panel |
| **Onboarding** | Dismissible contextual info banners + persistent help icons on every page, illustrative empty states |
| **Masthead** | Red Hat branding, quick-action create menu, starred items dropdown, notification/help popovers |

### Detail Pages

Every list in the prototype links to a detail page following a consistent pattern:

| Entity | Detail page pattern |
|--------|-------------------|
| **Project** | 7 tabs: Overview (quality summary, activity, sidebar with about + source + links), Quality, Dependencies, README, YAML, Deployments, Resources |
| **Repository** | Overview with discovered content, README, recent commits, sidebar with about + source |
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
| Projects (6 projects with full AAP state) | `plugins/self-service/.../catalog/projectsDemoData.ts` |
| Git repositories (unified list) | `plugins/self-service/.../catalog/unifiedDemoData.ts` |
| Quality scans and violations | `plugins/self-service/.../detail/qualityDemoData.ts` |
| Dev Spaces integration (launch URLs) | `plugins/self-service/.../Admin/syncDemoData.ts` |
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
│   │   ├── catalog/           # Git repositories list + unified demo data
│   │   ├── create/            # Template wizard (multi-step creation flow)
│   │   ├── detail/            # ProjectDetailsPage (7-tab detail page)
│   │   ├── repositories/      # RepositoryDetailPage (discovered repo detail)
│   │   ├── quality/           # Quality dashboard (fleet-wide)
│   │   └── ci/                # CI Activity content
│   ├── ExecutionEnvironments/ # EE catalog + create + detail
│   ├── CollectionsCatalog/    # Collections list + detail
│   ├── Learning/              # LearningPage (course catalog + checklist)
│   ├── RunTask/               # Scaffolder task execution + results
│   ├── Admin/                 # Connections, Dev Spaces, Sync Activity, EE Builder
│   ├── CatalogItemDetails/    # Template entity detail page
│   ├── common/                # PageHelpIcon, statusColors, DismissibleBanner, EmptyStateLayout
│   └── RouteView/             # Plugin route definitions
├── hooks/
│   └── useUserRole.ts         # Role-adaptive navigation hook (SME/Developer/Admin)
```

---

## Role-Adaptive Navigation

The prototype uses three roles with progressive disclosure:

| Role | Sees | Landing route |
|------|------|---------------|
| **SME** | Automate (Templates, Activity) + Learn | `/create` (Templates) |
| **Developer** | + Develop (Git Repositories, EEs, Collections, Quality) | `/self-service/repositories` |
| **Admin** | + Administration (Settings, Integrations, Sync, EE Builder) | `/self-service/repositories` |

Switch roles via localStorage: set `portal-user-role` to `sme`, `developer`, or `admin`.

---

## Design Principles

1. **No deviation from the RHDH base image** — All customization lives in plugin code. The Backstage shell, sidebar framework, and core components are untouched.
2. **PatternFly 6 alignment via RHDH** — Backstage uses Material UI, but RHDH themes it to look like PF6. We follow RHDH as the source of truth, using Material components styled to PF6 patterns.
3. **Red Hat & Ansible microcopy guidelines** — Consistent voice, sentence case, action-oriented labels.
4. **Terminology consistency** — "Git Repositories" (not "Projects" for repos), "Push to AAP" (not "publish"), "Execution environment" (not "EE definition"). Every concept is named once and used consistently.
5. **UX pattern consistency** — All empty states, list pages, detail pages, help patterns, and onboarding flows follow the same structure.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Git Repositories as default developer landing page | Developers spend most time managing automation codebases |
| Role-adaptive progressive disclosure | SMEs see less complexity; developers and admins see progressively more |
| Quality scans as primary feedback mechanism | Automated checks validate content without manual governance setup |
| Dev Spaces as intelligent launcher | Portal knows the context (project, branch, file, line); Dev Spaces handles workspace lifecycle |
| 1:1 repo-to-project relationship | Prevents confusion from multiple projects pointing to the same repo |
| Sidebar filters (not toolbar chips) | Aligns with RHDH/Backstage catalog filter pattern |
| No dedicated Home page | Git Repositories list serves as the landing; avoids a dashboard that duplicates navigation |
| Dismissible banners + persistent help icons | Contextual onboarding that can be dismissed but still accessible via `?` icon |
| Getting Started as a course catalog | Structured learning with progress tracking; extensible to future courses |
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
| Role gating | `useUserRole` / `useUserRoleContext` | Gate actions/sections by `hasRole('developer')` |

---

## Known Limitations

- **Demo data only** — Most table data, sync history, and quality results are hardcoded. They demonstrate the UI but don't reflect live state.
- **Template wizard is visual only** — The creation wizard renders all steps but does not execute scaffolder actions.
- **Lightspeed panel is a shell** — The AI panel renders but does not connect to a real LLM backend.
- **Dev Spaces links are placeholder URLs** — "Edit in Dev Spaces" actions open `devspaces.example.com` URLs. In production, the base URL comes from `ansible.devSpaces.baseUrl` config.
- **Notification drawer is static** — Shows demo notifications; no real event system.
- **Quality scans are simulated** — Scan results show demo violations; no real APME integration.

---

## For Reviewers

### If you're a PM or stakeholder

1. Follow the [Quick Start](#quick-start) above
2. Start at the Git Repositories page — this is the main developer experience
3. Click into a repository to see violations and discovered content
4. Try the Templates tab to see template cards and the creation wizard
5. Visit Getting Started (sidebar) to see the onboarding checklist
6. Open a project and use "Edit in Dev Spaces" from the header
7. Try the search (masthead) and Lightspeed AI toggle
8. Switch roles: open browser console and run `localStorage.setItem('portal-user-role', 'sme')` then reload

### If you're an engineer

1. Look at the [Project Structure](#project-structure-prototype-specific) to understand where code lives
2. Review the [Reusable Patterns](#reusable-patterns) section — use these when building new pages
3. Check `unifiedDemoData.ts` and `projectsDemoData.ts` to understand the data model
4. The `ProjectDetailsPage.tsx` is the most complex component — start there for the full pattern
5. Use `useUserRole` hook for any role-gated UI

---

## Related Links

- [GitLab (internal)](https://gitlab.cee.redhat.com/relimele/ansible-portal-prototypes)
- [GitHub fork](https://github.com/Ranelim/ansible-backstage-plugins)
- [Upstream repo](https://github.com/ansible/ansible-backstage-plugins)
- [Red Hat Developer Hub docs](https://developers.redhat.com/rhdh)
- [Backstage documentation](https://backstage.io/docs)
- [PatternFly 6](https://www.patternfly.org/)
