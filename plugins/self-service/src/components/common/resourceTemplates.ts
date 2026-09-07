/**
 * Object-scoped scaffolder templates for Create-from-template modals.
 * Same catalog family as experience / masthead Templates — filtered by resource.
 * Prototype demo data only (not production SoT).
 */

export type ResourceTemplateKind =
  | 'repository'
  | 'execution-environment'
  | 'inventory'
  | 'edge-fleet';

export type ResourceTemplate = {
  name: string;
  title: string;
  description: string;
  tags: string[];
  owner: string;
};

export const RESOURCE_TEMPLATE_COPY: Record<
  ResourceTemplateKind,
  { dialogTitle: string; dialogSubtitle: string; createLabel: string }
> = {
  repository: {
    dialogTitle: 'Create repository',
    dialogSubtitle:
      'Choose a template to scaffold a new Git repository with best-practice structure.',
    createLabel: 'Create repository',
  },
  'execution-environment': {
    dialogTitle: 'Create execution environment',
    dialogSubtitle:
      'Choose a template to create a new execution environment definition.',
    createLabel: 'Create execution environment',
  },
  inventory: {
    dialogTitle: 'Create inventory',
    dialogSubtitle:
      'Choose a template to scaffold an inventory and related compliance workflows.',
    createLabel: 'Create inventory',
  },
  'edge-fleet': {
    dialogTitle: 'Create fleet',
    dialogSubtitle:
      'Choose a template to scaffold an edge fleet and desired-state baseline.',
    createLabel: 'Create fleet',
  },
};

const REPOSITORY_TEMPLATES: ResourceTemplate[] = [
  {
    name: 'create-playbook-project',
    title: 'Ansible Playbook Repository',
    description:
      'General-purpose playbook repository with a standard directory structure, role scaffolding, and inventory layout. Includes quality scanning via GitHub Actions.',
    tags: ['playbook', 'starter', 'quality-scan'],
    owner: 'platform-engineering',
  },
  {
    name: 'create-cloud-provisioning-project',
    title: 'Cloud Provisioning Repository',
    description:
      'Pre-configured for cloud infrastructure provisioning with cloud collections, credential structure, and dynamic inventory plugins.',
    tags: ['cloud', 'aws', 'azure', 'gcp', 'quality-scan'],
    owner: 'platform-engineering',
  },
  {
    name: 'create-network-automation-project',
    title: 'Network Automation Repository',
    description:
      'Network device configuration and compliance management with collections for Cisco, Juniper, or Arista platforms.',
    tags: ['network', 'cisco', 'compliance', 'quality-scan'],
    owner: 'network-operations',
  },
];

const EE_TEMPLATES: ResourceTemplate[] = [
  {
    name: 'create-ee-minimal',
    title: 'Minimal execution environment',
    description:
      'Lean EE definition with ansible-core and common collections. Good starting point for most content.',
    tags: ['ee', 'minimal', 'starter'],
    owner: 'platform-engineering',
  },
  {
    name: 'create-ee-cloud',
    title: 'Cloud operations EE',
    description:
      'Execution environment preloaded with AWS, Azure, and GCP collections for infrastructure automation.',
    tags: ['ee', 'cloud', 'aws'],
    owner: 'platform-engineering',
  },
  {
    name: 'create-ee-network',
    title: 'Network automation EE',
    description:
      'Execution environment with network collections and connection plugins for multi-vendor devices.',
    tags: ['ee', 'network'],
    owner: 'network-operations',
  },
];

const INVENTORY_TEMPLATES: ResourceTemplate[] = [
  {
    name: 'create-inventory-static',
    title: 'Static inventory',
    description:
      'Scaffold a static inventory with host groups and variables ready for compliance scanning.',
    tags: ['inventory', 'static', 'compliance'],
    owner: 'platform-ops',
  },
  {
    name: 'create-inventory-dynamic',
    title: 'Dynamic inventory',
    description:
      'Inventory scaffold wired for cloud dynamic sources and scheduled compliance assessments.',
    tags: ['inventory', 'dynamic', 'cloud'],
    owner: 'platform-ops',
  },
];

const EDGE_FLEET_TEMPLATES: ResourceTemplate[] = [
  {
    name: 'create-edge-fleet-basic',
    title: 'Basic edge fleet',
    description:
      'Fleet desired-state baseline with OS image, config, and app slots for site rollouts.',
    tags: ['edge', 'fleet', 'rhem'],
    owner: 'edge-ops',
  },
  {
    name: 'create-edge-fleet-store',
    title: 'Retail / store fleet',
    description:
      'Store-oriented fleet template with intermittent-connectivity assumptions and staged updates.',
    tags: ['edge', 'fleet', 'retail'],
    owner: 'edge-ops',
  },
];

export const RESOURCE_TEMPLATES: Record<ResourceTemplateKind, ResourceTemplate[]> =
  {
    repository: REPOSITORY_TEMPLATES,
    'execution-environment': EE_TEMPLATES,
    inventory: INVENTORY_TEMPLATES,
    'edge-fleet': EDGE_FLEET_TEMPLATES,
  };
