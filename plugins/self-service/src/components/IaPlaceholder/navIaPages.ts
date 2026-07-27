export type IaTab = {
  id: string;
  label: string;
  expect: string;
};

export type IaPageConfig = {
  title: string;
  subtitle: string;
  purpose: string;
  tabs: IaTab[];
  also?: string;
  preview?: boolean;
  /** Shown when this rail item illustrates PDT sprawl / rejected contribution. */
  antiPattern?: boolean;
};

export const inventoriesIaPage: IaPageConfig = {
  title: 'Inventories',
  subtitle: 'Compliance on host inventories',
  purpose:
    'Scan inventories against compliance profiles, review findings, and remediate hosts.',
  tabs: [
    {
      id: 'catalog',
      label: 'Catalog',
      expect: 'List of all inventories with compliance summary.',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      expect: 'Fleet-level compliance profiles and posture.',
    },
    {
      id: 'scan-history',
      label: 'Scan History',
      expect: 'Past compliance scans across inventories.',
    },
  ],
  also: 'Inventory detail: Overview, Compliance, Hosts, Settings.',
};

export const edgeFleetsIaPage: IaPageConfig = {
  title: 'Edge fleets',
  subtitle: 'Edge device fleet lifecycle (RHEM)',
  purpose:
    'Primary Operate entity for RHEM. Manage fleets — desired state, updates, and health. Devices and images live as tabs here, not as separate left-nav items.',
  preview: true,
  tabs: [
    {
      id: 'fleets',
      label: 'Fleets',
      expect: 'List of fleets and rollout status.',
    },
    {
      id: 'devices',
      label: 'Devices',
      expect: 'Devices across fleets — member of this entity surface, not a sibling nav item.',
    },
    {
      id: 'images',
      label: 'Images',
      expect: 'OS / app images used by fleet desired state.',
    },
  ],
  also: 'Fleet detail: desired state (OS / config / apps), members, updates.',
};

/** Alternate contribution: same plugin, second primary object on the rail (architecture-gated). */
export const edgeDevicesIaPage: IaPageConfig = {
  title: 'Devices',
  subtitle: 'Edge devices (RHEM) — second rail item',
  purpose:
    'Demo only: one plugin contributing two Operate rail items when Devices needs a top-level entry. Prefer tabs under Edge fleets unless architecture review says otherwise.',
  preview: true,
  tabs: [
    {
      id: 'all',
      label: 'All devices',
      expect: 'Org-wide device list and health.',
    },
    {
      id: 'unassigned',
      label: 'Unassigned',
      expect: 'Devices not yet in a fleet.',
    },
  ],
  also: 'Device detail: desired vs reported state, membership, updates.',
};

/** ——— Anti-pattern sprawl seat (Compliance 2 + RHEM 4) ——— */

export const complianceDashboardIaPage: IaPageConfig = {
  title: 'Compliance dashboard',
  subtitle: 'Anti-pattern — second Compliance rail item',
  purpose:
    'Should be a tab (or overview) on Inventories, not a sibling Operate row. Settings for the Compliance plugin belong under Administration → Integrations.',
  antiPattern: true,
  tabs: [
    {
      id: 'posture',
      label: 'Posture',
      expect: 'Org-wide compliance scorecards — better as Inventories → Compliance tab.',
    },
  ],
  also: 'Preferred: Operate → Inventories only; Admin for connection/settings.',
};

export const edgeImagesIaPage: IaPageConfig = {
  title: 'Images',
  subtitle: 'Anti-pattern — RHEM product IA on the Portal rail',
  purpose:
    'OS / app images are secondary to fleets. Keep under Edge fleets (tab or detail), not a top-level Operate item.',
  preview: true,
  antiPattern: true,
  tabs: [
    {
      id: 'catalog',
      label: 'Image catalog',
      expect: 'Better nested under fleet desired-state or a fleets sub-nav.',
    },
  ],
};

export const edgeEnrollmentIaPage: IaPageConfig = {
  title: 'Enrollment',
  subtitle: 'Anti-pattern — RHEM product IA on the Portal rail',
  purpose:
    'Device enrollment is a task/flow, not a primary object for every Operator landing. Prefer action from Devices/Fleets or a guided wizard.',
  preview: true,
  antiPattern: true,
  tabs: [
    {
      id: 'enroll',
      label: 'Enroll devices',
      expect: 'Wizard / action — not a persistent Operate rail item.',
    },
  ],
};

export const edgeRepositoriesIaPage: IaPageConfig = {
  title: 'Repositories',
  subtitle: 'Anti-pattern — RHEM product IA on the Portal rail',
  purpose:
    'Conflicts with Develop → Git Repositories naming and is not an Operate primary object for Portal. Nest under Edge fleets or Admin if config-only.',
  preview: true,
  antiPattern: true,
  tabs: [
    {
      id: 'sources',
      label: 'Content sources',
      expect: 'Config/content source — Admin or in-page under fleets.',
    },
  ],
};
