export type SyncSource = 'AAP' | 'GitHub' | 'GitLab';
export type SyncContentType =
  | 'Job Templates'
  | 'Collections'
  | 'Teams & Users'
  | 'EE Definitions'
  | 'Projects'
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
    status: 'Not configured',
    syncJobs: [],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    type: 'git',
    status: 'Not configured',
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
    source: 'AAP',
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
    contentType: 'EE Definitions',
    trigger: 'Scheduled',
    started: 'Today 12:00',
    duration: '1m 05s',
    status: 'Completed',
    result: '23 definitions, 2 new',
    itemsAdded: 2,
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
    syncJob: 'Repository Content',
    interval: 'Every 30 min',
    lastRun: 'Today 14:00',
    nextRun: 'Today 14:30',
    enabled: true,
    lastStatus: 'Failed',
  },
];
