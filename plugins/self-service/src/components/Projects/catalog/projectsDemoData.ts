export type PipelineStage = {
  name: string;
  status: 'passed' | 'running' | 'failed' | 'pending';
  timestamp?: string;
  duration?: string;
  detail?: string;
  description: string;
};

export type AapStatus = {
  project: 'pushed' | 'not-pushed' | 'error';
  jobTemplate: 'pushed' | 'not-pushed' | 'error';
};

export type LastJobRun = {
  status: 'success' | 'failed' | 'running' | 'none';
  timestamp?: string;
};

export type ProjectCommit = {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
};

export type ProjectRepo = {
  url: string;
  branch: string;
  provider: 'github' | 'gitlab';
  lastCommit: ProjectCommit;
};

export type ProjectResource = {
  name: string;
  path: string;
  type: 'playbook' | 'role' | 'collection-dep' | 'execution-environment';
};

export type JobRunEntry = {
  id: number;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  duration: string;
  launchedBy: string;
};

export type PipelineRun = {
  id: number;
  trigger: string;
  commitMessage?: string;
  status: 'passed' | 'failed' | 'running';
  startedAt: string;
  duration: string;
  stages: PipelineStage[];
};

export type DemoProject = {
  name: string;
  title: string;
  pipeline: PipelineStage[];
  pipelineType: 'comprehensive' | 'standard';
  aap: AapStatus;
  lastJobRun: LastJobRun;
  starred: boolean;
  description: string;
  owner: string;
  createdAt: string;
  templateUsed: string;
  repo: ProjectRepo;
  resources: ProjectResource[];
  jobHistory: JobRunEntry[];
  pipelineHistory: PipelineRun[];
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  'Commit': 'Detects and validates the latest code change pushed to the repository.',
  'Lint': 'Checks playbook structure, YAML syntax, and best practices using ansible-lint.',
  'Policy Check': 'Validates content against organizational governance policies and security standards.',
  'EE Compatibility': 'Verifies that the automation content runs correctly inside the target Execution Environment.',
  'Integration Test': 'Runs end-to-end tests against a sandboxed environment to catch regressions.',
  'Pushed to AAP': 'Syncs the validated content to Ansible Automation Platform for deployment.',
};

export const DEMO_PROJECTS: DemoProject[] = [
  {
    name: 'rhel-patching',
    title: 'rhel-patching',
    description: 'Automated RHEL server patching with pre-flight validation and compliance verification.',
    owner: 'sarah.chen',
    createdAt: '2026-03-10',
    templateUsed: 'Standard Playbook Repository',
    pipelineType: 'comprehensive',
    repo: {
      url: 'https://github.com/acme-corp/rhel-patching',
      branch: 'main',
      provider: 'github',
      lastCommit: { hash: 'a3f1b2c', message: 'fix: honor maintenance window in patch pre-checks', author: 'sarah.chen', timestamp: '2026-05-25 10:22' },
    },
    resources: [
      { name: 'patch-rhel.yml', path: 'playbooks/patch-rhel.yml', type: 'playbook' },
      { name: 'validate-patches.yml', path: 'playbooks/validate-patches.yml', type: 'playbook' },
      { name: 'patch-baseline', path: 'roles/patch-baseline', type: 'role' },
      { name: 'ansible.posix', path: 'collections/requirements.yml', type: 'collection-dep' },
    ],
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-05-25 10:22', duration: '3s', detail: 'Commit a3f1b2c by sarah.chen', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-05-25 10:23', duration: '28s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-05-25 10:24', duration: '45s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-05-25 10:26', duration: '1m 52s', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'passed', timestamp: '2026-05-25 10:31', duration: '5m 10s', description: STAGE_DESCRIPTIONS['Integration Test'] },
    ],
    aap: { project: 'not-pushed', jobTemplate: 'not-pushed' },
    lastJobRun: { status: 'success', timestamp: '2026-05-25 10:31' },
    starred: true,
    jobHistory: [],
    pipelineHistory: [
      { id: 205, trigger: 'a3f1b2c', commitMessage: 'fix: honor maintenance window in patch pre-checks', status: 'passed', startedAt: '2026-05-25 10:22', duration: '8m 18s', stages: [] },
      { id: 201, trigger: 'e4a9c22', commitMessage: 'feat: add pre-patch snapshot for critical hosts', status: 'passed', startedAt: '2026-03-19 10:20', duration: '7m 45s', stages: [] },
      { id: 198, trigger: '91d3b7e', commitMessage: 'fix: exclude dev hosts from production patch window', status: 'failed', startedAt: '2026-03-17 16:05', duration: '3m 22s', stages: [] },
      { id: 194, trigger: 'f2c8a10', commitMessage: 'chore: pin ansible.posix to 1.5.4', status: 'passed', startedAt: '2026-03-15 09:30', duration: '7m 50s', stages: [] },
    ],
  },
  {
    name: 'network-firewall-rules',
    title: 'network-firewall-rules',
    description: 'Palo Alto and Cisco firewall rule management with automated compliance checks.',
    owner: 'james.wilson',
    createdAt: '2026-02-18',
    templateUsed: 'Network Automation Repository',
    pipelineType: 'comprehensive',
    repo: {
      url: 'https://github.com/acme-corp/network-firewall-rules',
      branch: 'main',
      provider: 'github',
      lastCommit: { hash: 'e7d2f1a', message: 'feat: add zone-based rule validation', author: 'james.wilson', timestamp: '2026-05-24 08:15' },
    },
    resources: [
      { name: 'apply-rules.yml', path: 'tasks/apply-rules.yml', type: 'playbook' },
      { name: 'validate-rules.yml', path: 'tasks/validate-rules.yml', type: 'playbook' },
      { name: 'rollback.yml', path: 'tasks/rollback.yml', type: 'playbook' },
      { name: 'firewall-base', path: 'roles/firewall-base', type: 'role' },
      { name: 'paloalto.panos', path: 'collections/requirements.yml', type: 'collection-dep' },
    ],
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-05-24 08:15', duration: '2s', detail: 'Commit e7d2f1a by james.wilson', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-05-24 08:16', duration: '22s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-05-24 08:17', duration: '38s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-05-24 08:19', duration: '1m 40s', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'passed', timestamp: '2026-05-24 08:23', duration: '4m 05s', description: STAGE_DESCRIPTIONS['Integration Test'] },
    ],
    aap: { project: 'not-pushed', jobTemplate: 'not-pushed' },
    lastJobRun: { status: 'success', timestamp: '2026-05-24 08:23' },
    starred: false,
    jobHistory: [],
    pipelineHistory: [
      { id: 210, trigger: 'e7d2f1a', commitMessage: 'feat: add zone-based rule validation', status: 'passed', startedAt: '2026-05-24 08:15', duration: '6m 47s', stages: [] },
      { id: 207, trigger: 'c8b1e34', commitMessage: 'fix: correct PAN-OS API timeout handling', status: 'passed', startedAt: '2026-03-18 14:30', duration: '6m 20s', stages: [] },
      { id: 203, trigger: '5f9d2a7', commitMessage: 'feat: add rule conflict detection', status: 'failed', startedAt: '2026-03-16 09:45', duration: '2m 55s', stages: [] },
    ],
  },
  {
    name: 'cloud-provisioner',
    title: 'cloud-provisioner',
    description: 'Multi-cloud infrastructure provisioning with Terraform and Ansible integration.',
    owner: 'alex.kumar',
    createdAt: '2026-01-22',
    templateUsed: 'Cloud Automation Repository',
    pipelineType: 'comprehensive',
    repo: {
      url: 'https://github.com/acme-corp/cloud-provisioner',
      branch: 'main',
      provider: 'github',
      lastCommit: { hash: 'b4f9c2d', message: 'fix: set changed_when on EC2 provision task', author: 'alex.kumar', timestamp: '2026-05-25 14:30' },
    },
    resources: [
      { name: 'provision.yml', path: 'playbooks/provision.yml', type: 'playbook' },
      { name: 'teardown.yml', path: 'playbooks/teardown.yml', type: 'playbook' },
      { name: 'cloud-base', path: 'roles/cloud-base', type: 'role' },
      { name: 'amazon.aws', path: 'collections/requirements.yml', type: 'collection-dep' },
    ],
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-05-25 14:30', duration: '2s', detail: 'Commit b4f9c2d by alex.kumar', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-05-25 14:31', duration: '25s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-05-25 14:32', duration: '40s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-05-25 14:34', duration: '1m 45s', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'passed', timestamp: '2026-05-25 14:38', duration: '4m 30s', description: STAGE_DESCRIPTIONS['Integration Test'] },
    ],
    aap: { project: 'not-pushed', jobTemplate: 'not-pushed' },
    lastJobRun: { status: 'success', timestamp: '2026-05-25 14:38' },
    starred: false,
    jobHistory: [],
    pipelineHistory: [
      { id: 195, trigger: 'b4f9c2d', commitMessage: 'fix: set changed_when on EC2 provision task', status: 'passed', startedAt: '2026-05-25 14:30', duration: '7m 02s', stages: [] },
      { id: 192, trigger: 'b3a7d91', commitMessage: 'fix: AWS credential rotation handling', status: 'passed', startedAt: '2026-03-17 10:45', duration: '6m 50s', stages: [] },
    ],
  },
  {
    name: 'backup-automation',
    title: 'backup-automation',
    description:
      'Scheduled PostgreSQL and MySQL backups with rotation, restore drills, and offsite copy.',
    owner: 'david.lee',
    createdAt: '2026-02-04',
    templateUsed: 'Standard Playbook Repository',
    pipelineType: 'comprehensive',
    repo: {
      url: 'https://github.com/acme-corp/backup-automation',
      branch: 'main',
      provider: 'github',
      lastCommit: {
        hash: 'c1d8e3f',
        message: 'chore: tighten backup retention defaults',
        author: 'david.lee',
        timestamp: '2026-05-22 06:00',
      },
    },
    resources: [
      { name: 'backup-postgres.yml', path: 'playbooks/backup-postgres.yml', type: 'playbook' },
      { name: 'backup-mysql.yml', path: 'playbooks/backup-mysql.yml', type: 'playbook' },
      { name: 'restore-database.yml', path: 'playbooks/restore-database.yml', type: 'playbook' },
      { name: 'db-backup-agent', path: 'roles/db-backup-agent', type: 'role' },
      { name: 'community.postgresql', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'community.mysql', path: 'collections/requirements.yml', type: 'collection-dep' },
    ],
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-05-22 06:00', duration: '2s', detail: 'Commit c1d8e3f by david.lee', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'failed', timestamp: '2026-05-22 06:01', duration: '31s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'failed', timestamp: '2026-05-22 06:02', duration: '42s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'pending', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'pending', description: STAGE_DESCRIPTIONS['Integration Test'] },
    ],
    aap: { project: 'not-pushed', jobTemplate: 'not-pushed' },
    lastJobRun: { status: 'failed', timestamp: '2026-05-22 06:02' },
    starred: false,
    jobHistory: [],
    pipelineHistory: [
      { id: 88, trigger: 'c1d8e3f', commitMessage: 'chore: tighten backup retention defaults', status: 'failed', startedAt: '2026-05-22 06:00', duration: '1m 15s', stages: [] },
      { id: 85, trigger: '9a1c4d2', commitMessage: 'chore: pin community.postgresql to 3.4.0', status: 'failed', startedAt: '2026-03-16 11:20', duration: '1m 02s', stages: [] },
    ],
  },
];
