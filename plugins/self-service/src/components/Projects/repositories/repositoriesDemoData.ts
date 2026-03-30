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
  hasProject: boolean;
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
    lastCommitHash: 'b7c3a1f',
    lastCommitMessage: 'fix: skip kernel update when reboot is not allowed',
    lastCommitAuthor: 'sarah.chen',
    lastCommitTimestamp: '2026-03-21 14:35',
    resources: [
      { type: 'playbook', count: 2 },
      { type: 'role', count: 1 },
      { type: 'collection-dep', count: 1 },
    ],
    hasProject: true,
  },
  {
    name: 'network-firewall-rules',
    org: 'acme-corp',
    provider: 'github',
    url: 'https://github.com/acme-corp/network-firewall-rules',
    branch: 'main',
    visibility: 'private',
    discoveredAt: '2026-03-10 14:22',
    lastCommitHash: 'a2d8e41',
    lastCommitMessage: 'feat: add zone-based policy for DMZ segment',
    lastCommitAuthor: 'james.wu',
    lastCommitTimestamp: '2026-03-20 11:15',
    resources: [
      { type: 'playbook', count: 3 },
      { type: 'role', count: 1 },
      { type: 'collection-dep', count: 2 },
    ],
    hasProject: true,
  },
  {
    name: 'cloud-provisioner',
    org: 'acme-corp',
    provider: 'github',
    url: 'https://github.com/acme-corp/cloud-provisioner',
    branch: 'main',
    visibility: 'private',
    discoveredAt: '2026-03-10 14:22',
    lastCommitHash: '5e1f9d3',
    lastCommitMessage: 'chore: update instance type defaults to m6i',
    lastCommitAuthor: 'maria.garcia',
    lastCommitTimestamp: '2026-03-19 16:02',
    resources: [
      { type: 'playbook', count: 2 },
      { type: 'collection-dep', count: 1 },
      { type: 'execution-environment', count: 1 },
    ],
    hasProject: true,
  },
  {
    name: 'backup-automation',
    org: 'acme-corp',
    provider: 'github',
    url: 'https://github.com/acme-corp/backup-automation',
    branch: 'main',
    visibility: 'private',
    discoveredAt: '2026-03-20 09:15',
    lastCommitHash: 'c4f2e88',
    lastCommitMessage: 'add PostgreSQL backup rotation playbook',
    lastCommitAuthor: 'david.lee',
    lastCommitTimestamp: '2026-03-19 08:55',
    resources: [
      { type: 'playbook', count: 3 },
      { type: 'role', count: 1 },
      { type: 'collection-dep', count: 2 },
    ],
    hasProject: false,
  },
];
