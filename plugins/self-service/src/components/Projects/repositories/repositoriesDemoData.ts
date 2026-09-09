export type DiscoveredResource = {
  type: 'playbook' | 'role' | 'collection-dep' | 'execution-environment';
  count: number;
};

export type DiscoveredRepo = {
  name: string;
  org: string;
  provider: 'github' | 'gitlab';
  url: string;
  branch: string;
  visibility: 'public' | 'private' | 'internal';
  discoveredAt: string;
  lastCommitHash: string;
  lastCommitMessage: string;
  lastCommitAuthor: string;
  lastCommitTimestamp: string;
  resources: DiscoveredResource[];
};

export const DISCOVERED_REPOS: DiscoveredRepo[] = [
  {
    name: 'rhel-patching',
    org: 'acme-corp',
    provider: 'github',
    url: 'https://github.com/acme-corp/rhel-patching',
    branch: 'main',
    visibility: 'private',
    discoveredAt: '2026-03-10 14:22',
    lastCommitHash: 'a3f1b2c',
    lastCommitMessage: 'fix: honor maintenance window in patch pre-checks',
    lastCommitAuthor: 'sarah.chen',
    lastCommitTimestamp: '2026-05-25 10:22',
    resources: [
      { type: 'playbook', count: 2 },
      { type: 'role', count: 1 },
      { type: 'collection-dep', count: 1 },
    ],
  },
  {
    name: 'network-firewall-rules',
    org: 'acme-corp',
    provider: 'github',
    url: 'https://github.com/acme-corp/network-firewall-rules',
    branch: 'main',
    visibility: 'private',
    discoveredAt: '2026-03-10 14:22',
    lastCommitHash: 'e7d2f1a',
    lastCommitMessage: 'feat: add zone-based rule validation',
    lastCommitAuthor: 'james.wilson',
    lastCommitTimestamp: '2026-05-24 08:15',
    resources: [
      { type: 'playbook', count: 3 },
      { type: 'role', count: 1 },
      { type: 'collection-dep', count: 2 },
    ],
  },
  {
    name: 'cloud-provisioner',
    org: 'acme-corp',
    provider: 'github',
    url: 'https://github.com/acme-corp/cloud-provisioner',
    branch: 'main',
    visibility: 'private',
    discoveredAt: '2026-03-10 14:22',
    lastCommitHash: 'b4f9c2d',
    lastCommitMessage: 'fix: set changed_when on EC2 provision task',
    lastCommitAuthor: 'alex.kumar',
    lastCommitTimestamp: '2026-05-25 14:30',
    resources: [
      { type: 'playbook', count: 2 },
      { type: 'collection-dep', count: 1 },
      { type: 'execution-environment', count: 1 },
    ],
  },
  {
    name: 'backup-automation',
    org: 'acme-corp',
    provider: 'github',
    url: 'https://github.com/acme-corp/backup-automation',
    branch: 'main',
    visibility: 'private',
    discoveredAt: '2026-03-20 09:15',
    lastCommitHash: 'c1d8e3f',
    lastCommitMessage: 'chore: tighten backup retention defaults',
    lastCommitAuthor: 'david.lee',
    lastCommitTimestamp: '2026-05-22 06:00',
    resources: [
      { type: 'playbook', count: 3 },
      { type: 'role', count: 1 },
      { type: 'collection-dep', count: 2 },
    ],
  },
];
