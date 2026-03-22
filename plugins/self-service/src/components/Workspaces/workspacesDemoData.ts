export type WorkspaceStatus = 'running' | 'starting' | 'stopped' | 'error';

export type DemoWorkspace = {
  id: string;
  name: string;
  projectName: string;
  projectTitle: string;
  repoUrl: string;
  branch: string;
  ide: string;
  status: WorkspaceStatus;
  createdAt: string;
  lastAccessed: string;
  cpu: string;
  memory: string;
  extensions: string[];
};

export const DEMO_WORKSPACES: DemoWorkspace[] = [
  {
    id: 'ws-1a2b3c',
    name: 'rhel-patch-automation-ws',
    projectName: 'rhel-patch-automation',
    projectTitle: 'rhel-patch-automation',
    repoUrl: 'https://github.com/acme-corp/rhel-patch-automation',
    branch: 'main',
    ide: 'VS Code (Ansible)',
    status: 'running',
    createdAt: '2026-03-22 08:30',
    lastAccessed: '2 minutes ago',
    cpu: '2 cores',
    memory: '4 GB',
    extensions: [
      'Ansible (Red Hat)',
      'YAML',
      'Ansible Lightspeed',
      'GitLens',
    ],
  },
  {
    id: 'ws-4d5e6f',
    name: 'web-app-scaling-suite-ws',
    projectName: 'web-app-scaling-suite',
    projectTitle: 'web-app-scaling-suite',
    repoUrl: 'https://github.com/acme-corp/web-app-scaling-suite',
    branch: 'main',
    ide: 'VS Code (Ansible)',
    status: 'running',
    createdAt: '2026-03-21 14:15',
    lastAccessed: '18 minutes ago',
    cpu: '2 cores',
    memory: '4 GB',
    extensions: [
      'Ansible (Red Hat)',
      'YAML',
      'Ansible Lightspeed',
      'GitLens',
    ],
  },
  {
    id: 'ws-7g8h9i',
    name: 'network-compliance-ws',
    projectName: 'network-compliance-checker',
    projectTitle: 'network-compliance-checker',
    repoUrl: 'https://github.com/acme-corp/network-compliance-checker',
    branch: 'feat/arista-eos',
    ide: 'VS Code (Ansible)',
    status: 'stopped',
    createdAt: '2026-03-20 10:00',
    lastAccessed: '2 days ago',
    cpu: '2 cores',
    memory: '4 GB',
    extensions: [
      'Ansible (Red Hat)',
      'YAML',
      'Ansible Lightspeed',
    ],
  },
  {
    id: 'ws-0j1k2l',
    name: 'linux-hardening-ws',
    projectName: 'linux-baseline-hardening',
    projectTitle: 'linux-baseline-hardening',
    repoUrl: 'https://github.com/acme-corp/linux-baseline-hardening',
    branch: 'main',
    ide: 'VS Code (Ansible)',
    status: 'stopped',
    createdAt: '2026-03-18 16:30',
    lastAccessed: '4 days ago',
    cpu: '2 cores',
    memory: '4 GB',
    extensions: [
      'Ansible (Red Hat)',
      'YAML',
      'Ansible Lightspeed',
      'GitLens',
      'Remote - SSH',
    ],
  },
];
