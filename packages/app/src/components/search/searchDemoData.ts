export type SearchResultKind = 'project' | 'collection' | 'ee' | 'template' | 'documentation';

export type SearchResultItem = {
  id: string;
  title: string;
  kind: SearchResultKind;
  description: string;
  tags: string[];
  url: string;
  source?: string;
  lastUpdated?: string;
};

export const SEARCH_CATALOG: SearchResultItem[] = [
  // Projects
  {
    id: 'p1',
    title: 'web-app-scaling-suite',
    kind: 'project',
    description: 'Auto-scaling playbooks for web applications across AWS and Azure',
    tags: ['aws', 'azure', 'scaling', 'web'],
    url: '/self-service/projects/catalog',
    source: 'GitHub',
    lastUpdated: '2 hours ago',
  },
  {
    id: 'p2',
    title: 'network-compliance-checker',
    kind: 'project',
    description: 'Automated network compliance scanning and remediation for enterprise routers and switches',
    tags: ['network', 'compliance', 'cisco', 'juniper'],
    url: '/self-service/projects/catalog',
    source: 'GitHub',
    lastUpdated: '4 hours ago',
  },
  {
    id: 'p3',
    title: 'aws-provisioner',
    kind: 'project',
    description: 'Infrastructure provisioning for AWS including VPC, EC2, RDS, and IAM setup',
    tags: ['aws', 'provisioning', 'cloud', 'infrastructure'],
    url: '/self-service/projects/catalog',
    source: 'GitHub',
    lastUpdated: '1 day ago',
  },
  {
    id: 'p4',
    title: 'firewall-policy-engine',
    kind: 'project',
    description: 'Firewall rule management and policy enforcement across Palo Alto and Fortinet devices',
    tags: ['security', 'firewall', 'palo-alto', 'fortinet'],
    url: '/self-service/projects/catalog',
    source: 'GitHub',
    lastUpdated: '1 day ago',
  },
  {
    id: 'p5',
    title: 'rhel-patch-automation',
    kind: 'project',
    description: 'Automated RHEL patching with rolling updates, rollback support, and compliance reporting',
    tags: ['rhel', 'patching', 'linux', 'security'],
    url: '/self-service/projects/catalog',
    source: 'GitHub',
    lastUpdated: '3 days ago',
  },
  {
    id: 'p6',
    title: 'cis-compliance-scanner',
    kind: 'project',
    description: 'CIS benchmark scanning and hardening for RHEL, Ubuntu, and Windows servers',
    tags: ['cis', 'compliance', 'hardening', 'security'],
    url: '/self-service/projects/catalog',
    source: 'GitHub',
    lastUpdated: '5 days ago',
  },

  // Collections
  {
    id: 'c1',
    title: 'ansible.netcommon',
    kind: 'collection',
    description: 'Network resource modules and connection plugins for multi-vendor network automation',
    tags: ['network', 'netcommon', 'certified'],
    url: '/self-service/collections/ansible.netcommon',
    source: 'Private Automation Hub',
    lastUpdated: '1 day ago',
  },
  {
    id: 'c2',
    title: 'amazon.aws',
    kind: 'collection',
    description: 'Modules for managing AWS services including EC2, S3, RDS, Lambda, and IAM',
    tags: ['aws', 'cloud', 'certified'],
    url: '/self-service/collections/amazon.aws',
    source: 'Private Automation Hub',
    lastUpdated: '3 days ago',
  },
  {
    id: 'c3',
    title: 'redhat.rhel_system_roles',
    kind: 'collection',
    description: 'RHEL system roles for networking, storage, timesync, SELinux, and more',
    tags: ['rhel', 'system-roles', 'certified'],
    url: '/self-service/collections/redhat.rhel_system_roles',
    source: 'Private Automation Hub',
    lastUpdated: '1 week ago',
  },
  {
    id: 'c4',
    title: 'cisco.ios',
    kind: 'collection',
    description: 'Modules and plugins for managing Cisco IOS network devices',
    tags: ['cisco', 'network', 'ios', 'certified'],
    url: '/self-service/collections/cisco.ios',
    source: 'Private Automation Hub',
    lastUpdated: '2 weeks ago',
  },
  {
    id: 'c5',
    title: 'community.general',
    kind: 'collection',
    description: 'General-purpose modules for a wide range of platforms and technologies',
    tags: ['general', 'community', 'multi-platform'],
    url: '/self-service/collections/community.general',
    source: 'Public Registries',
    lastUpdated: '4 days ago',
  },
  {
    id: 'c6',
    title: 'ansible.posix',
    kind: 'collection',
    description: 'POSIX modules for ACLs, cron, mount, sysctl, and authorized_keys management',
    tags: ['posix', 'linux', 'certified'],
    url: '/self-service/collections/ansible.posix',
    source: 'Private Automation Hub',
    lastUpdated: '2 weeks ago',
  },

  // Execution Environments
  {
    id: 'ee1',
    title: 'ee-rhel9-ansible-2.16',
    kind: 'ee',
    description: 'RHEL 9 execution environment with Ansible Core 2.16 and common certified collections',
    tags: ['rhel9', 'ansible-2.16', 'production'],
    url: '/self-service/ee/catalog',
    source: 'Private Automation Hub',
    lastUpdated: '1 day ago',
  },
  {
    id: 'ee2',
    title: 'ee-minimal-python3.11',
    kind: 'ee',
    description: 'Minimal Python 3.11 execution environment for lightweight automation tasks',
    tags: ['minimal', 'python3.11', 'lightweight'],
    url: '/self-service/ee/catalog',
    source: 'Private Automation Hub',
    lastUpdated: '2 days ago',
  },
  {
    id: 'ee3',
    title: 'ee-network-automation',
    kind: 'ee',
    description: 'Network-focused EE with netcommon, cisco, arista, and juniper collections pre-installed',
    tags: ['network', 'cisco', 'juniper', 'production'],
    url: '/self-service/ee/catalog',
    source: 'Private Automation Hub',
    lastUpdated: '1 week ago',
  },
  {
    id: 'ee4',
    title: 'ee-cloud-services',
    kind: 'ee',
    description: 'Cloud services EE with AWS, Azure, and GCP modules for multi-cloud automation',
    tags: ['aws', 'azure', 'gcp', 'cloud'],
    url: '/self-service/ee/catalog',
    source: 'Private Automation Hub',
    lastUpdated: '5 days ago',
  },

  // Templates
  {
    id: 't1',
    title: 'AI Jumpstart Project',
    kind: 'template',
    description: 'Create a new Ansible project with AI-generated playbooks based on your description',
    tags: ['ai', 'jumpstart', 'lightspeed'],
    url: '/self-service/projects/create',
    lastUpdated: '1 week ago',
  },
  {
    id: 't2',
    title: 'Source Code Project',
    kind: 'template',
    description: 'Create a project from an existing Git repository with CI/CD pipeline setup',
    tags: ['git', 'source-code', 'pipeline'],
    url: '/self-service/projects/create',
    lastUpdated: '1 week ago',
  },
  {
    id: 't3',
    title: 'AAP Job Template Project',
    kind: 'template',
    description: 'Create a project linked to an existing AAP job template for monitoring and management',
    tags: ['aap', 'job-template', 'import'],
    url: '/self-service/projects/create',
    lastUpdated: '1 week ago',
  },
  {
    id: 't4',
    title: 'Build Custom EE',
    kind: 'template',
    description: 'Build a custom Execution Environment with your choice of collections and Python packages',
    tags: ['ee', 'build', 'custom'],
    url: '/self-service/ee/create',
    lastUpdated: '1 week ago',
  },

  // Documentation
  {
    id: 'd1',
    title: 'Getting Started with Ansible Portal',
    kind: 'documentation',
    description: 'Quick start guide covering project creation, templates, and pipeline setup',
    tags: ['getting-started', 'guide'],
    url: '/docs',
    lastUpdated: '2 weeks ago',
  },
  {
    id: 'd2',
    title: 'Pipeline Configuration Guide',
    kind: 'documentation',
    description: 'How to configure CI/CD pipelines, stages, and deployment gates for Ansible projects',
    tags: ['pipeline', 'ci-cd', 'configuration'],
    url: '/docs',
    lastUpdated: '1 week ago',
  },
  {
    id: 'd3',
    title: 'Connecting to Ansible Automation Platform',
    kind: 'documentation',
    description: 'Setup guide for connecting AAP, configuring sync, and managing job templates',
    tags: ['aap', 'connections', 'setup'],
    url: '/docs',
    lastUpdated: '3 weeks ago',
  },
];

export const KIND_LABELS: Record<SearchResultKind, string> = {
  project: 'Projects',
  collection: 'Collections',
  ee: 'Execution Environments',
  template: 'Templates',
  documentation: 'Documentation',
};

export const KIND_URLS: Record<SearchResultKind, string> = {
  project: '/self-service/projects/catalog',
  collection: '/self-service/collections',
  ee: '/self-service/ee/catalog',
  template: '/self-service/projects/create',
  documentation: '/docs',
};

export const RECENT_SEARCHES = [
  'network compliance',
  'aws provisioner',
  'cisco.ios',
  'ee-rhel9',
];
