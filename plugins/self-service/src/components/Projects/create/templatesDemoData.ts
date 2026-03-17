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
  defaultPipeline: 'comprehensive' | 'standard';
  steps: WizardStep[];
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

export const CUSTOM_PIPELINE_STAGES = [
  { id: 'syntax', label: 'Syntax Check', description: 'Validates YAML and Ansible syntax correctness' },
  { id: 'lint', label: 'Ansible Lint', description: 'Enforces Ansible best practices and coding standards' },
  { id: 'yaml-lint', label: 'YAML Lint', description: 'Validates YAML formatting and structure' },
  { id: 'policy', label: 'Policy Check (OPA)', description: 'Validates against organizational policies for credential exposure, hardcoded secrets, etc.' },
  { id: 'ee-compat', label: 'EE Compatibility', description: 'Verifies playbook runs correctly in the target Execution Environment' },
  { id: 'molecule', label: 'Integration Test (Molecule)', description: 'Runs Molecule scenarios on temporary infrastructure to validate behavior' },
  { id: 'sast', label: 'Security Scan (SAST)', description: 'Scans for security vulnerabilities and insecure patterns' },
];

export const COMPREHENSIVE_STAGES = [
  'Commit', 'Lint', 'Policy Check', 'EE Compatibility', 'Integration Test', 'Pushed to AAP',
];

export const STANDARD_STAGES = [
  'Commit', 'Lint', 'Policy Check', 'EE Compatibility', 'Pushed to AAP',
];

const WIZARD_STEPS: WizardStep[] = [
  {
    title: 'Details & AI Jumpstart',
    description: 'Describe what you want to automate, or fill in the details manually.',
    why: 'Naming and describing your project up front helps your team discover and understand it. AI Jumpstart can save time by pre-filling the remaining steps based on your intent.',
  },
  {
    title: 'Source Code (Git)',
    description: 'Create a new repository or select an existing synced repo.',
    why: 'Every automation project is backed by a Git repository. This is where your playbooks, roles, and inventory live — and it enables version control, collaboration, and auditability.',
  },
  {
    title: 'Pipeline & Governance',
    description: 'Select the governance pipeline for your automation code.',
    why: 'Pipelines run automated checks (linting, policy, testing) on every commit so only safe, tested, and compliant playbooks reach production. Choosing the right level of governance balances speed with risk.',
  },
  {
    title: 'Destination (AAP)',
    description: 'Configure how this project connects to your Ansible Automation Platform.',
    why: 'Connecting to AAP lets your automation be executed, scheduled, and monitored centrally. This step ensures your project and job templates are registered and ready to run.',
  },
  {
    title: 'Review & Create',
    description: 'Review your selections before creating the project.',
    why: 'A final review prevents misconfiguration. Once created, the repository, pipeline, and AAP resources are provisioned automatically.',
  },
];

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    name: 'create-playbook-project',
    title: 'Ansible Playbook Project',
    description:
      'Scaffold a general-purpose Ansible playbook project with a standard directory structure, role scaffolding, inventory layout, and CI linting pipeline. The most common starting point for configuration management and server provisioning automation.',
    tags: ['ansible', 'playbook', 'project', 'starter'],
    owner: 'group:default/platform-engineering',
    type: 'project',
    defaultPipeline: 'standard',
    steps: WIZARD_STEPS,
  },
  {
    name: 'create-cloud-provisioning-project',
    title: 'Cloud Provisioning Project',
    description:
      'Scaffold an automation project pre-configured for cloud infrastructure provisioning. Includes the relevant cloud collections, credential structure, and dynamic inventory plugins for AWS, Azure, or GCP.',
    tags: ['ansible', 'cloud', 'aws', 'azure', 'gcp', 'project'],
    owner: 'group:default/platform-engineering',
    type: 'project',
    defaultPipeline: 'comprehensive',
    steps: WIZARD_STEPS,
  },
  {
    name: 'create-network-automation-project',
    title: 'Network Automation Project',
    description:
      'Scaffold an automation project for network device configuration and compliance management. Pre-configured with network collections for Cisco, Juniper, or Arista platforms, and includes NETCONF/RESTCONF/SSH connection profiles.',
    tags: ['ansible', 'network', 'cisco', 'juniper', 'arista', 'project'],
    owner: 'group:default/network-operations',
    type: 'project',
    defaultPipeline: 'comprehensive',
    steps: WIZARD_STEPS,
  },
];
