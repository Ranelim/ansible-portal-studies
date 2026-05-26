export type WizardStep = {
  title: string;
  description: string;
  why: string;
};

export type DemoTemplate = {
  name: string;
  title: string;
  description: string;
  tags: string[];
  owner: string;
  type: string;
};

export type SyncedRepo = {
  name: string;
  org: string;
  host: 'github.com' | 'gitlab.com';
  visibility: 'public' | 'private' | 'internal';
  url: string;
};

export const SYNCED_REPOS: SyncedRepo[] = [
  { name: 'infra-playbooks', org: 'acme-corp', host: 'github.com', visibility: 'private', url: 'https://github.com/acme-corp/infra-playbooks' },
  { name: 'network-configs', org: 'acme-corp', host: 'github.com', visibility: 'private', url: 'https://github.com/acme-corp/network-configs' },
  { name: 'cloud-provisioning', org: 'acme-corp', host: 'github.com', visibility: 'internal', url: 'https://github.com/acme-corp/cloud-provisioning' },
  { name: 'rhel-hardening', org: 'acme-corp', host: 'gitlab.com', visibility: 'private', url: 'https://gitlab.com/acme-corp/rhel-hardening' },
  { name: 'security-compliance', org: 'acme-corp', host: 'gitlab.com', visibility: 'private', url: 'https://gitlab.com/acme-corp/security-compliance' },
  { name: 'windows-patching', org: 'platform-team', host: 'github.com', visibility: 'private', url: 'https://github.com/platform-team/windows-patching' },
];

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    name: 'create-playbook-project',
    title: 'Ansible Playbook Repository',
    description:
      'General-purpose playbook repository with a standard directory structure, role scaffolding, and inventory layout. Includes APME quality scanning via GitHub Actions.',
    tags: ['playbook', 'starter', 'config-management', 'quality-scan'],
    owner: 'group:default/platform-engineering',
    type: 'project',
  },
  {
    name: 'create-cloud-provisioning-project',
    title: 'Cloud Provisioning Repository',
    description:
      'Pre-configured for cloud infrastructure provisioning with relevant cloud collections, credential structure, and dynamic inventory plugins for AWS, Azure, or GCP. Includes APME quality scanning.',
    tags: ['cloud', 'aws', 'azure', 'gcp', 'provisioning', 'quality-scan'],
    owner: 'group:default/platform-engineering',
    type: 'project',
  },
  {
    name: 'create-network-automation-project',
    title: 'Network Automation Repository',
    description:
      'Network device configuration and compliance management with collections for Cisco, Juniper, or Arista platforms. Includes NETCONF/RESTCONF/SSH connection profiles and APME quality scanning.',
    tags: ['network', 'cisco', 'juniper', 'arista', 'compliance', 'quality-scan'],
    owner: 'group:default/network-operations',
    type: 'project',
  },
];
