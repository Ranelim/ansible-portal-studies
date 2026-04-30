export type SyncSource = 'AAP' | 'PAH' | 'GitHub' | 'GitLab';
export type SyncStatus = 'Healthy' | 'Failed' | 'In Progress' | 'Never synced';

export type SyncEntityStatus = {
  id: string;
  entity: string;
  source: SyncSource;
  providerId: string;
  lastSync: string | null;
  lastSyncDuration: string | null;
  status: SyncStatus;
  nextSync: string | null;
  errorDetail: string | null;
  errorTrace: string | null;
  interval: string;
  enabled: boolean;
};

export type ConnectionProvider = {
  id: string;
  name: string;
  type: 'aap' | 'git' | 'registry';
  status: 'Active' | 'Not configured' | 'Error';
  lastSync?: string;
  host?: string;
  auth?: string;
  orgCount?: number;
  syncJobs: { name: string; interval: string; enabled: boolean }[];
};

export const DEMO_CONNECTIONS: ConnectionProvider[] = [
  {
    id: 'aap',
    name: 'Ansible Automation Platform',
    type: 'aap',
    status: 'Active',
    lastSync: '3 minutes ago',
    host: 'aap-controller.example.com',
    auth: 'OAuth (configured during setup)',
    orgCount: 3,
    syncJobs: [
      { name: 'Job Templates', interval: 'Every 30 minutes', enabled: true },
      { name: 'Teams & Users', interval: 'Every 1 hour', enabled: true },
      { name: 'Collections', interval: 'Every 1 hour', enabled: true },
    ],
  },
  {
    id: 'pah',
    name: 'Private Automation Hub',
    type: 'aap',
    status: 'Active',
    lastSync: '10 minutes ago',
    host: 'aap-controller.example.com/hub',
    auth: 'Shared via AAP connection',
    syncJobs: [
      { name: 'Certified Content', interval: 'Every 6 hours', enabled: true },
      { name: 'Validated Content', interval: 'Every 6 hours', enabled: true },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    type: 'git',
    status: 'Active',
    lastSync: '14 minutes ago',
    host: 'github.internal.com',
    auth: 'GitHub App (ansible-portal)',
    syncJobs: [
      { name: 'ansible-collections', interval: 'Every 1 hour', enabled: true },
      { name: 'ansible-network', interval: 'Every 1 hour', enabled: true },
    ],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    type: 'git',
    status: 'Not configured',
    syncJobs: [],
  },
];

export const DEMO_SYNC_STATUS: SyncEntityStatus[] = [
  {
    id: 'aap-job-templates',
    entity: 'Job Templates',
    source: 'AAP',
    providerId: 'aap',
    lastSync: 'Today 14:30',
    lastSyncDuration: '12s',
    status: 'Healthy',
    nextSync: 'In 27 min',
    errorDetail: null,
    errorTrace: null,
    interval: 'Every 30 min',
    enabled: true,
  },
  {
    id: 'aap-teams-users',
    entity: 'Teams & Users',
    source: 'AAP',
    providerId: 'aap',
    lastSync: 'Today 14:30',
    lastSyncDuration: '8s',
    status: 'Healthy',
    nextSync: 'In 27 min',
    errorDetail: null,
    errorTrace: null,
    interval: 'Every 30 min',
    enabled: true,
  },
  {
    id: 'aap-collections',
    entity: 'Collections',
    source: 'AAP',
    providerId: 'aap',
    lastSync: 'Today 14:30',
    lastSyncDuration: '48s',
    status: 'Healthy',
    nextSync: 'In 27 min',
    errorDetail: null,
    errorTrace: null,
    interval: 'Every 30 min',
    enabled: true,
  },
  {
    id: 'aap-ee-definitions',
    entity: 'EE Definitions',
    source: 'AAP',
    providerId: 'aap',
    lastSync: 'Today 14:30',
    lastSyncDuration: '1m 05s',
    status: 'Healthy',
    nextSync: 'In 27 min',
    errorDetail: null,
    errorTrace: null,
    interval: 'Every 30 min',
    enabled: true,
  },
  {
    id: 'pah-content',
    entity: 'Certified & Validated Content',
    source: 'PAH',
    providerId: 'pah',
    lastSync: 'Today 08:00',
    lastSyncDuration: '2m 30s',
    status: 'Healthy',
    nextSync: 'In 1h 57min',
    errorDetail: null,
    errorTrace: null,
    interval: 'Every 6 hours',
    enabled: true,
  },
  {
    id: 'github-ansible-collections',
    entity: 'ansible-collections',
    source: 'GitHub',
    providerId: 'github',
    lastSync: 'Today 14:15',
    lastSyncDuration: '1m 42s',
    status: 'Healthy',
    nextSync: 'In 43 min',
    errorDetail: null,
    errorTrace: null,
    interval: 'Every 1 hour',
    enabled: true,
  },
  {
    id: 'github-ansible-network',
    entity: 'ansible-network',
    source: 'GitHub',
    providerId: 'github',
    lastSync: 'Today 14:00',
    lastSyncDuration: '2m 14s',
    status: 'Failed',
    nextSync: null,
    errorDetail: 'GitHub API rate limit exceeded for installation. Resets at 15:00 UTC.',
    errorTrace: `GET https://api.github.internal.com/orgs/ansible-network/repos?per_page=100&page=1
HTTP 403 Forbidden

{
  "message": "API rate limit exceeded for installation ID 12345.",
  "documentation_url": "https://docs.github.com/rest/overview/rate-limits-for-the-rest-api",
  "x-ratelimit-limit": "5000",
  "x-ratelimit-remaining": "0",
  "x-ratelimit-reset": "1714488000"
}

at GitHubDiscoveryProcessor.processOrg (github-discovery.ts:142)
at CatalogBuilder.runProviders (catalog-builder.ts:87)
at TaskRunner.run (task-runner.ts:34)`,
    interval: 'Every 1 hour',
    enabled: true,
  },
];

// Legacy types preserved for backward compatibility during migration
export type SyncTrigger = 'Scheduled' | 'Manual';
export type SyncContentType =
  | 'Job Templates'
  | 'Collections'
  | 'Teams & Users'
  | 'EE Definitions'
  | 'Projects'
  | 'Certified Content'
  | 'Validated Content'
  | 'Community Content';

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
  status: 'Completed' | 'Failed' | 'In Progress' | 'Partial';
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

export const DEMO_SYNC_HISTORY: SyncHistoryEntry[] = [];

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
    syncJob: 'Collections',
    interval: 'Every 1 hour',
    lastRun: 'Today 14:22',
    nextRun: 'Today 15:22',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's4',
    source: 'AAP',
    syncJob: 'EE Definitions',
    interval: 'Every 6 hours',
    lastRun: 'Today 12:00',
    nextRun: 'Today 18:00',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's5',
    source: 'GitHub',
    syncJob: 'ansible-collections',
    interval: 'Every 1 hour',
    lastRun: 'Today 14:15',
    nextRun: 'Today 15:15',
    enabled: true,
    lastStatus: 'Success',
  },
  {
    id: 's6',
    source: 'GitHub',
    syncJob: 'ansible-network',
    interval: 'Every 1 hour',
    lastRun: 'Today 14:00',
    nextRun: 'Today 15:00',
    enabled: true,
    lastStatus: 'Failed',
  },
];
