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
      lastCommit: { hash: 'b7c3a1f', message: 'fix: skip kernel update when reboot is not allowed', author: 'sarah.chen', timestamp: '2026-03-21 14:35' },
    },
    resources: [
      { name: 'patch-rhel.yml', path: 'playbooks/patch-rhel.yml', type: 'playbook' },
      { name: 'validate-patches.yml', path: 'playbooks/validate-patches.yml', type: 'playbook' },
      { name: 'patch-baseline', path: 'roles/patch-baseline', type: 'role' },
      { name: 'ansible.posix', path: 'collections/requirements.yml', type: 'collection-dep' },
    ],
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-21 14:35', duration: '3s', detail: 'Commit b7c3a1f by sarah.chen', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-21 14:36', duration: '28s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-21 14:37', duration: '45s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-21 14:39', duration: '1m 52s', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'passed', timestamp: '2026-03-21 14:44', duration: '5m 10s', description: STAGE_DESCRIPTIONS['Integration Test'] },
    ],
    aap: { project: 'not-pushed', jobTemplate: 'not-pushed' },
    lastJobRun: { status: 'success', timestamp: '2026-03-22 06:00' },
    starred: true,
    jobHistory: [],
    pipelineHistory: [
      { id: 205, trigger: 'b7c3a1f', commitMessage: 'fix: skip kernel update when reboot is not allowed', status: 'passed', startedAt: '2026-03-21 14:35', duration: '8m 18s', stages: [] },
      { id: 201, trigger: 'e4a9c22', commitMessage: 'feat: add pre-patch snapshot for critical hosts', status: 'passed', startedAt: '2026-03-19 10:20', duration: '7m 45s', stages: [] },
      { id: 198, trigger: '91d3b7e', commitMessage: 'fix: exclude dev hosts from production patch window', status: 'failed', startedAt: '2026-03-17 16:05', duration: '3m 22s', stages: [] },
      { id: 194, trigger: 'f2c8a10', commitMessage: 'chore: pin ansible.posix to 1.5.4', status: 'passed', startedAt: '2026-03-15 09:30', duration: '7m 50s', stages: [] },
    ],
  },
];
