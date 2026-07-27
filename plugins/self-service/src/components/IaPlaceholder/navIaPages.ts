/**
 * Entity page tab pattern (Portal IA — apply to every primary entity surface)
 *
 * Order (fixed slots; omit empty ones):
 *   1. Dashboard     — optional. Cross-object overview/KPIs. LANDING when present.
 *   2. {Entity}      — required. Plural entity name for the list (never "Catalog").
 *                      LANDING when there is no Dashboard.
 *   3. Domain tabs   — ecosystem (Quality, Devices, Scans, Profiles, Images…).
 *   4. Trailing      — exactly one of:
 *                        Templates — filtered run/scaffold templates for this entity
 *                        Settings  — user-scoped prefs for this whole surface
 *                      Never Admin/integration config (that stays Administration).
 *
 * Rules:
 * - Never land on domain or trailing tabs.
 * - Never name the list tab "Catalog" (Catalog = Portal-wide discovery only).
 * - Don't invent a Dashboard that duplicates the list.
 */

export type IaTab = {
  id: string;
  label: string;
  expect: string;
  /** Marks the Dashboard or entity-list landing slot for docs/guards. */
  slot?: 'dashboard' | 'list' | 'domain' | 'trailing';
};

export type IaPageConfig = {
  title: string;
  subtitle: string;
  purpose: string;
  tabs: IaTab[];
  also?: string;
  preview?: boolean;
  antiPattern?: boolean;
};

/** Landing tab index: Dashboard if present, else first list tab, else 0. */
export function landingTabIndex(tabs: IaTab[]): number {
  const dash = tabs.findIndex(t => t.slot === 'dashboard' || t.id === 'dashboard');
  if (dash >= 0) return dash;
  const list = tabs.findIndex(t => t.slot === 'list');
  if (list >= 0) return list;
  return 0;
}

export const inventoriesIaPage: IaPageConfig = {
  title: 'Inventories',
  subtitle: 'Compliance on host inventories',
  purpose:
    'Entity pattern: Dashboard (landing) → Inventories list → domain tabs → Templates. Scan inventories, review findings, remediate hosts.',
  tabs: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      slot: 'dashboard',
      expect:
        'Landing. Org/posture KPIs across inventories — open findings, compliance %, recent scans. Not a second list.',
    },
    {
      id: 'inventories',
      label: 'Inventories',
      slot: 'list',
      expect: 'Table of inventories with compliance summary. Primary object list (never named Catalog).',
    },
    {
      id: 'scans',
      label: 'Scans',
      slot: 'domain',
      expect: 'Scan history across inventories.',
    },
    {
      id: 'profiles',
      label: 'Profiles',
      slot: 'domain',
      expect: 'Compliance profiles applied to inventories.',
    },
    {
      id: 'templates',
      label: 'Templates',
      slot: 'trailing',
      expect:
        'Remediation / scan-related templates for this entity. Not the global Run → Templates list.',
    },
  ],
  also: 'Inventory detail: Overview, Compliance, Hosts. Admin connection settings stay under Administration.',
};

export const edgeFleetsIaPage: IaPageConfig = {
  title: 'Edge fleets',
  subtitle: 'Edge device fleet lifecycle (RHEM)',
  purpose:
    'Entity pattern: Dashboard (landing) → Fleets list → Devices / Images → Templates. Devices are tabs here, not left-nav items.',
  preview: true,
  tabs: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      slot: 'dashboard',
      expect:
        'Landing. Fleet health, devices pending update, rollout status. Distinct from the Fleets table.',
    },
    {
      id: 'fleets',
      label: 'Fleets',
      slot: 'list',
      expect: 'List of fleets and rollout status — primary RHEM object list.',
    },
    {
      id: 'devices',
      label: 'Devices',
      slot: 'domain',
      expect: 'Devices across fleets (ecosystem tab).',
    },
    {
      id: 'images',
      label: 'Images',
      slot: 'domain',
      expect: 'OS / app images used by fleet desired state.',
    },
    {
      id: 'templates',
      label: 'Templates',
      slot: 'trailing',
      expect: 'Edge / fleet-related job templates for this entity, if any.',
    },
  ],
  also: 'Fleet detail: desired state (OS / config / apps), members, updates.',
};

/** ——— Legacy anti-pattern pages (routes redirect away; kept for reference) ——— */

export const edgeDevicesIaPage: IaPageConfig = {
  title: 'Devices',
  subtitle: 'Do not use as a rail item',
  purpose: 'Devices belong under Edge fleets as a domain tab.',
  preview: true,
  antiPattern: true,
  tabs: [
    {
      id: 'all',
      label: 'All devices',
      expect: 'Prefer Edge fleets → Devices tab.',
    },
  ],
};

export const complianceDashboardIaPage: IaPageConfig = {
  title: 'Compliance dashboard',
  subtitle: 'Do not use as a rail item',
  purpose: 'Dashboard is a tab on Inventories, not a sibling Operate row.',
  antiPattern: true,
  tabs: [
    {
      id: 'posture',
      label: 'Posture',
      expect: 'Prefer Inventories → Dashboard.',
    },
  ],
};

export const edgeImagesIaPage: IaPageConfig = {
  title: 'Images',
  subtitle: 'Do not use as a rail item',
  purpose: 'Images belong under Edge fleets as a domain tab.',
  preview: true,
  antiPattern: true,
  tabs: [
    {
      id: 'catalog',
      label: 'Images',
      expect: 'Prefer Edge fleets → Images.',
    },
  ],
};

export const edgeEnrollmentIaPage: IaPageConfig = {
  title: 'Enrollment',
  subtitle: 'Do not use as a rail item',
  purpose: 'Enrollment is an action/flow, not a persistent Operate item.',
  preview: true,
  antiPattern: true,
  tabs: [
    {
      id: 'enroll',
      label: 'Enroll devices',
      expect: 'Wizard from Fleets or Devices.',
    },
  ],
};

export const edgeRepositoriesIaPage: IaPageConfig = {
  title: 'Repositories',
  subtitle: 'Do not use as a rail item',
  purpose: 'Conflicts with Git Repositories; nest under fleets or Admin if config-only.',
  preview: true,
  antiPattern: true,
  tabs: [
    {
      id: 'sources',
      label: 'Content sources',
      expect: 'Admin or fleet detail — not Operate rail.',
    },
  ],
};
