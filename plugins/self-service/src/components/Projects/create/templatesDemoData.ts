export type WizardStep = {
  title: string;
  description: string;
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
    steps: [
      { title: 'Details & AI Jumpstart', description: 'Describe what you want to automate or fill in the details manually.' },
      { title: 'Source Code (Git)', description: 'Configure the Git repository for your project\'s source code.' },
      { title: 'Pipeline & Governance', description: 'Select the governance pipeline for your automation code.' },
      { title: 'Destination (AAP)', description: 'Configure how this project connects to your Ansible Automation Platform.' },
    ],
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
    steps: [
      { title: 'Details & AI Jumpstart', description: 'Describe your cloud provisioning needs or fill in the details manually.' },
      { title: 'Source Code (Git)', description: 'Configure the Git repository for your project\'s source code.' },
      { title: 'Pipeline & Governance', description: 'Select the governance pipeline for your automation code.' },
      { title: 'Destination (AAP)', description: 'Configure how this project connects to your Ansible Automation Platform.' },
    ],
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
    steps: [
      { title: 'Details & AI Jumpstart', description: 'Describe your network automation needs or fill in the details manually.' },
      { title: 'Source Code (Git)', description: 'Configure the Git repository for your project\'s source code.' },
      { title: 'Pipeline & Governance', description: 'Select the governance pipeline for your automation code.' },
      { title: 'Destination (AAP)', description: 'Configure how this project connects to your Ansible Automation Platform.' },
    ],
  },
];
