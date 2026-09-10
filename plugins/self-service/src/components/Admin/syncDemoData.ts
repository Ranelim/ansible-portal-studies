export type SyncSource =
  | 'AAP'
  | 'Orchestrator'
  | 'Private Automation Hub'
  | 'GitHub'
  | 'Public Registries';
export type SyncContentType =
  | 'Job Templates'
  | 'Collections'
  | 'Teams & Users'
  | 'EE Definitions'
  | 'Projects'
  | 'Job Run Logs'
  | 'Certified Content'
  | 'Validated Content'
  | 'Community Content';

export type SyncTrigger = 'Scheduled' | 'Manual';
export type SyncStatus = 'Completed' | 'Failed' | 'In Progress' | 'Partial';

export type SyncChangeItem = {
  name: string;
  action: 'added' | 'updated' | 'removed' | 'skipped';
  detail?: string;
};

export type SyncHistoryEntry = {
  id: string;
  source: SyncSource;
  contentType: SyncContentType;
  trigger: SyncTrigger;
  triggeredBy?: string;
  started: string;
  duration: string;
  status: SyncStatus;
  result: string;
  errorDetail?: string;
  itemsAdded?: number;
  itemsUpdated?: number;
  itemsRemoved?: number;
  changes?: SyncChangeItem[];
  logLines?: string[];
};

export type SyncScheduleEntry = {
  id: string;
  source: SyncSource;
  syncJob: string;
  interval: string;
  lastRun: string;
  nextRun: string;
  enabled: boolean;
  lastStatus: 'Success' | 'Failed';
};

export type ConnectionProvider = {
  id: string;
  name: string;
  type: 'aap' | 'orchestrator' | 'pah' | 'git' | 'registry' | 'devtools';
  status: 'Active' | 'Not configured' | 'Error';
  lastSync?: string;
  host?: string;
  auth?: string;
  orgCount?: number;
  syncJobs: { name: string; interval: string; enabled: boolean }[];
};

/** GitHub Pages study deploy — app is not at domain root. */
const STUDY_GH_PAGES_PREFIX = '/ansible-portal-studies';

/** Subpath when the SPA is hosted under a prefix (e.g. GitHub Pages). */
export function appPublicBasePath(): string {
  if (typeof window !== 'undefined') {
    const { pathname } = window.location;
    if (
      pathname === STUDY_GH_PAGES_PREFIX ||
      pathname.startsWith(`${STUDY_GH_PAGES_PREFIX}/`)
    ) {
      return STUDY_GH_PAGES_PREFIX;
    }
  }
  const built =
    typeof process !== 'undefined' &&
    typeof process.env !== 'undefined' &&
    process.env.PUBLIC_URL
      ? process.env.PUBLIC_URL.replace(/\/$/, '')
      : '';
  return built && built !== '/' ? built : '';
}

/** Dev Spaces mockup HTML (packages/app/public) with deploy subpath when needed. */
export function devSpacesMockupPath(): string {
  return `${appPublicBasePath()}/devspaces-mockup.html`;
}

/** @deprecated use devSpacesMockupPath() */
export const DEVSPACES_BASE_URL = devSpacesMockupPath();

export function devSpacesMockupUrl(
  query?: Record<string, string | number | undefined>,
): string {
  const base = devSpacesMockupPath();
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export const DEMO_CONNECTIONS: ConnectionProvider[] = [
  {
    id: 'aap',
    name: 'Ansible Automation Platform (AAP)',
    type: 'aap',
    status: 'Active',
    lastSync: '3 minutes ago',
    host: 'aap-controller.example.com',
    auth: 'OAuth (configured during setup)',
    orgCount: 3,
    syncJobs: [
      { name: 'Job Templates', interval: 'Every 30 minutes', enabled: true },
      { name: 'Teams & Users', interval: 'Every 1 hour', enabled: true },
      { name: 'Job Run Logs', interval: 'Every 15 minutes', enabled: true },
    ],
  },
  {
    id: 'orchestrator',
    name: 'Ansible Orchestrator',
    type: 'orchestrator',
    status: 'Not configured',
    lastSync: '18 minutes ago',
    host: 'orchestrator.example.com',
    auth: 'OAuth',
    syncJobs: [
      { name: 'Software Templates', interval: 'Every 30 minutes', enabled: true },
    ],
  },
  {
    id: 'pah',
    name: 'Private Automation Hub (PAH)',
    type: 'pah',
    status: 'Not configured',
    lastSync: '1 hour ago',
    host: 'hub.example.com',
    auth: 'OAuth (inherited from AAP)',
    syncJobs: [
      { name: 'Collections', interval: 'Every 1 hour', enabled: true },
      { name: 'EE Definitions', interval: 'Every 6 hours', enabled: true },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    type: 'git',
    status: 'Active',
    lastSync: '28 minutes ago',
    host: 'github.internal.com',
    auth: 'Personal Access Token',
    orgCount: 2,
    syncJobs: [
      { name: 'Repository Content', interval: 'Every 30 minutes', enabled: true },
    ],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    type: 'git',
    status: 'Active',
    lastSync: '1 hour ago',
    host: 'gitlab.internal.com',
    auth: 'OAuth',
    orgCount: 1,
    syncJobs: [
      { name: 'Repository Content', interval: 'Every 1 hour', enabled: true },
    ],
  },
  {
    id: 'registries',
    name: 'Public Registries (internet required)',
    type: 'registry',
    status: 'Active',
    lastSync: 'Today 02:00',
    host: 'galaxy.ansible.com / registry.redhat.io',
    syncJobs: [
      { name: 'Certified Content', interval: 'Daily', enabled: true },
      { name: 'Validated Content', interval: 'Daily', enabled: true },
      { name: 'Community Content (Galaxy)', interval: 'Daily', enabled: false },
    ],
  },
  {
    id: 'devspaces',
    name: 'OpenShift Dev Spaces',
    type: 'devtools',
    status: 'Not configured',
    host: 'devspaces.apps.ansible-rhdh.testing.ansible.com',
    syncJobs: [],
  },
];

export const DEMO_SYNC_HISTORY: SyncHistoryEntry[] = [
  {
    id: 'h1',
    source: 'AAP',
    contentType: 'Job Templates',
    trigger: 'Scheduled',
    started: 'Today 14:30',
    duration: '12s',
    status: 'Completed',
    result: '42 templates, 3 updated',
    itemsAdded: 0,
    itemsUpdated: 3,
    itemsRemoved: 0,
    changes: [
      { name: 'Deploy RHEL Patch', action: 'updated', detail: 'Variables updated: survey_spec, extra_vars' },
      { name: 'Network Compliance Scan', action: 'updated', detail: 'Credentials changed' },
      { name: 'Provision AWS EC2', action: 'updated', detail: 'Inventory source updated' },
    ],
    logLines: [
      '[14:30:00] Starting sync: AAP Job Templates',
      '[14:30:00] Connecting to aap-controller.example.com...',
      '[14:30:01] Authentication successful (OAuth2 client credentials)',
      '[14:30:01] Fetching job templates from /api/v2/job_templates/?page_size=200',
      '[14:30:02] Retrieved 42 templates (page 1 of 1)',
      '[14:30:03] Comparing with local catalog...',
      '[14:30:04] Template "Deploy RHEL Patch" (id:14) — updated: survey_spec changed, extra_vars changed',
      '[14:30:05] Template "Network Compliance Scan" (id:27) — updated: credentials changed',
      '[14:30:06] Template "Provision AWS EC2" (id:31) — updated: inventory source updated',
      '[14:30:08] 39 templates unchanged',
      '[14:30:10] Writing 3 entity updates to catalog...',
      '[14:30:11] Catalog refresh triggered for 3 entities',
      '[14:30:12] Sync completed successfully in 12s',
      '[14:30:12] Summary: 0 added, 3 updated, 0 removed, 39 unchanged',
    ],
  },
  {
    id: 'h2',
    source: 'Private Automation Hub',
    contentType: 'Collections',
    trigger: 'Manual',
    triggeredBy: 'John Smith',
    started: 'Today 14:22',
    duration: '48s',
    status: 'Completed',
    result: '156 collections, 0 new',
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsRemoved: 0,
  },
  {
    id: 'h3',
    source: 'GitHub',
    contentType: 'Projects',
    trigger: 'Scheduled',
    started: 'Today 14:00',
    duration: '2m 14s',
    status: 'Failed',
    result: 'Connection timeout',
    errorDetail: 'Failed to connect to github.internal.com: ETIMEDOUT after 30000ms. Check network connectivity and firewall rules.',
    logLines: [
      '[14:00:00] Starting sync: GitHub Repository Content',
      '[14:00:00] Connecting to github.internal.com...',
      '[14:00:30] ERROR: Connection timed out after 30000ms',
      '[14:00:30] Retrying (attempt 2 of 3)...',
      '[14:01:00] ERROR: Connection timed out after 30000ms',
      '[14:01:00] Retrying (attempt 3 of 3)...',
      '[14:01:30] ERROR: Connection timed out after 30000ms',
      '[14:01:30] All retry attempts exhausted',
      '[14:02:14] Sync failed: ETIMEDOUT — unable to reach github.internal.com',
      '[14:02:14] Suggestion: Check network connectivity, firewall rules, and DNS resolution for github.internal.com',
    ],
  },
  {
    id: 'h4',
    source: 'AAP',
    contentType: 'Teams & Users',
    trigger: 'Scheduled',
    started: 'Today 13:00',
    duration: '8s',
    status: 'Completed',
    result: '12 groups, 1 new member',
    itemsAdded: 1,
    itemsUpdated: 0,
    itemsRemoved: 0,
  },
  {
    id: 'h5',
    source: 'AAP',
    contentType: 'Job Run Logs',
    trigger: 'Scheduled',
    started: 'Today 12:45',
    duration: '22s',
    status: 'Completed',
    result: '87 logs synced',
    itemsAdded: 14,
    itemsUpdated: 0,
    itemsRemoved: 0,
  },
  {
    id: 'h6',
    source: 'Private Automation Hub',
    contentType: 'EE Definitions',
    trigger: 'Scheduled',
    started: 'Today 12:00',
    duration: '1m 05s',
    status: 'Completed',
    result: '23 definitions, 2 new',
    itemsAdded: 2,
    itemsUpdated: 0,
    itemsRemoved: 0,
    changes: [
      { name: 'ee-rhel9-ansible-2.16', action: 'added', detail: 'New EE definition from PAH, tagged latest' },
      { name: 'ee-minimal-python3.11', action: 'added', detail: 'New EE definition from PAH, tagged latest' },
    ],
    logLines: [
      '[12:00:00] Starting sync: PAH EE Definitions',
      '[12:00:00] Connecting to Private Automation Hub...',
      '[12:00:01] Authentication inherited from AAP connection',
      '[12:00:02] Fetching EE definitions from /api/v2/execution-environments/',
      '[12:00:04] Retrieved 23 definitions',
      '[12:00:05] Comparing with local catalog...',
      '[12:00:06] New: ee-rhel9-ansible-2.16 (tagged: latest)',
      '[12:00:07] New: ee-minimal-python3.11 (tagged: latest)',
      '[12:00:10] 21 definitions unchanged',
      '[12:00:50] Writing 2 new entities to catalog...',
      '[12:01:05] Sync completed successfully in 1m 05s',
      '[12:01:05] Summary: 2 added, 0 updated, 0 removed, 21 unchanged',
    ],
  },
  {
    id: 'h7',
    source: 'Public Registries',
    contentType: 'Certified Content',
    trigger: 'Scheduled',
    started: 'Today 02:00',
    duration: '4m 32s',
    status: 'Completed',
    result: '1,247 collections',
    itemsAdded: 12,
    itemsUpdated: 8,
    itemsRemoved: 0,
  },
  {
    id: 'h8',
    source: 'Public Registries',
    contentType: 'Validated Content',
    trigger: 'Scheduled',
    started: 'Today 02:05',
    duration: '3m 18s',
    status: 'Completed',
    result: '892 collections',
    itemsAdded: 5,
    itemsUpdated: 3,
    itemsRemoved: 0,
  },
  {
    id: 'h9',
    source: 'AAP',
    contentType: 'Job Templates',
    trigger: 'Manual',
    triggeredBy: 'Sarah Chen',
    started: 'Yesterday 16:15',
    duration: '11s',
    status: 'Completed',
    result: '42 templates, 1 new',
    itemsAdded: 1,
    itemsUpdated: 0,
    itemsRemoved: 0,
  },
  {
    id: 'h10',
    source: 'GitHub',
    contentType: 'Projects',
    trigger: 'Scheduled',
    started: 'Yesterday 13:30',
    duration: '1m 58s',
    status: 'Completed',
    result: '6 projects, 0 new',
    itemsAdded: 0,
    itemsUpdated: 2,
    itemsRemoved: 0,
  },
  {
    id: 'h11',
    source: 'Private Automation Hub',
    contentType: 'Collections',
    trigger: 'Scheduled',
    started: 'Yesterday 12:00',
    duration: '52s',
    status: 'Partial',
    result: '148 of 156 collections (8 skipped)',
    errorDetail: '8 collections skipped due to missing metadata. Collections: custom.legacy_roles, custom.deprecated_utils, and 6 others.',
    itemsAdded: 0,
    itemsUpdated: 4,
    itemsRemoved: 0,
  },
  {
    id: 'h12',
    source: 'AAP',
    contentType: 'Teams & Users',
    trigger: 'Scheduled',
    started: 'Yesterday 11:00',
    duration: '7s',
    status: 'Completed',
    result: '12 groups, 0 changes',
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsRemoved: 0,
  },
];

export const DEMO_SYNC_SCHEDULES: SyncScheduleEntry[] = [
  {
    id: 's1',
    source: 'AAP',
    syncJob: 'Job Templates',
    interval: 'Every 30 min',
    lastRun: 'Today 14:30',
    nextRun: 'Today 15:00',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's2',
    source: 'AAP',
    syncJob: 'Teams & Users',
    interval: 'Every 1 hour',
    lastRun: 'Today 13:00',
    nextRun: 'Today 14:00',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's3',
    source: 'AAP',
    syncJob: 'Job Run Logs',
    interval: 'Every 15 min',
    lastRun: 'Today 14:45',
    nextRun: 'Today 15:00',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's-orch-1',
    source: 'Orchestrator',
    syncJob: 'Software Templates',
    interval: 'Every 30 min',
    lastRun: 'Today 14:12',
    nextRun: 'Today 14:42',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's4',
    source: 'Private Automation Hub',
    syncJob: 'Collections',
    interval: 'Every 1 hour',
    lastRun: 'Today 14:22',
    nextRun: 'Today 15:22',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's5',
    source: 'Private Automation Hub',
    syncJob: 'EE Base Images',
    interval: 'Every 6 hours',
    lastRun: 'Today 12:00',
    nextRun: 'Today 18:00',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's6',
    source: 'GitHub',
    syncJob: 'Repository Content',
    interval: 'Every 30 min',
    lastRun: 'Today 14:00',
    nextRun: 'Today 14:30',
    enabled: true,
    lastStatus: 'Failed',
  },
  {
    id: 's7',
    source: 'Public Registries',
    syncJob: 'Certified Content',
    interval: 'Daily',
    lastRun: 'Today 02:00',
    nextRun: 'Tomorrow 02:00',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's8',
    source: 'Public Registries',
    syncJob: 'Validated Content',
    interval: 'Daily',
    lastRun: 'Today 02:05',
    nextRun: 'Tomorrow 02:05',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's9',
    source: 'Public Registries',
    syncJob: 'Community Content (Galaxy)',
    interval: 'Daily',
    lastRun: 'Never',
    nextRun: '—',
    enabled: false,
    lastStatus: 'Success',
  },
];
