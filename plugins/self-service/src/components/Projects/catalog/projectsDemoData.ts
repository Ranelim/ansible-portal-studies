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

export type DemoProject = {
  name: string;
  title: string;
  pipeline: PipelineStage[];
  pipelineType: 'comprehensive' | 'standard';
  aap: AapStatus;
  lastJobRun: LastJobRun;
  starred: boolean;
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
    name: 'web-app-scaling-suite',
    title: 'web-app-scaling-suite',
    pipelineType: 'comprehensive',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-14 09:12', duration: '4s', detail: 'Commit lab482683 by sarah.chen', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-14 09:13', duration: '38s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-14 09:14', duration: '52s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-14 09:16', duration: '1m 48s', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'passed', timestamp: '2026-03-14 09:22', duration: '5m 32s', description: STAGE_DESCRIPTIONS['Integration Test'] },
      { name: 'Pushed to AAP', status: 'passed', timestamp: '2026-03-14 09:23', duration: '12s', description: STAGE_DESCRIPTIONS['Pushed to AAP'] },
    ],
    aap: { project: 'pushed', jobTemplate: 'pushed' },
    lastJobRun: { status: 'success', timestamp: '2026-03-15 14:30' },
    starred: false,
  },
  {
    name: 'network-compliance-checker',
    title: 'network-compliance-checker',
    pipelineType: 'comprehensive',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-16 08:45', duration: '3s', detail: 'Commit f9a21c7 by james.wu', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-16 08:46', duration: '41s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-16 08:47', duration: '1m 05s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'running', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'pending', description: STAGE_DESCRIPTIONS['Integration Test'] },
      { name: 'Pushed to AAP', status: 'pending', description: STAGE_DESCRIPTIONS['Pushed to AAP'] },
    ],
    aap: { project: 'pushed', jobTemplate: 'pushed' },
    lastJobRun: { status: 'none' },
    starred: false,
  },
  {
    name: 'aws-provisioner',
    title: 'aws-provisioner',
    pipelineType: 'standard',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-15 16:02', duration: '5s', detail: 'Commit 3e8b1a4 by maria.garcia', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-15 16:03', duration: '29s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-15 16:04', duration: '47s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-15 16:06', duration: '2m 10s', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Pushed to AAP', status: 'passed', timestamp: '2026-03-15 16:07', duration: '9s', description: STAGE_DESCRIPTIONS['Pushed to AAP'] },
    ],
    aap: { project: 'pushed', jobTemplate: 'pushed' },
    lastJobRun: { status: 'success', timestamp: '2026-03-16 02:00' },
    starred: true,
  },
  {
    name: 'firewall-policy-engine',
    title: 'firewall-policy-engine',
    pipelineType: 'standard',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-16 10:30', duration: '4s', detail: 'Commit 7d4e5f2 by alex.kim', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'failed', timestamp: '2026-03-16 10:31', duration: '22s', detail: '3 errors: missing name in tasks, deprecated module usage', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'pending', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'pending', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Pushed to AAP', status: 'pending', description: STAGE_DESCRIPTIONS['Pushed to AAP'] },
    ],
    aap: { project: 'pushed', jobTemplate: 'not-pushed' },
    lastJobRun: { status: 'failed', timestamp: '2026-03-15 22:15' },
    starred: false,
  },
  {
    name: 'rhel-patch-automation',
    title: 'rhel-patch-automation',
    pipelineType: 'comprehensive',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-13 11:20', duration: '3s', detail: 'Commit a1c9d83 by david.lee', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-13 11:21', duration: '35s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-13 11:22', duration: '58s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-13 11:25', duration: '2m 22s', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'passed', timestamp: '2026-03-13 11:32', duration: '6m 48s', description: STAGE_DESCRIPTIONS['Integration Test'] },
      { name: 'Pushed to AAP', status: 'passed', timestamp: '2026-03-13 11:33', duration: '11s', description: STAGE_DESCRIPTIONS['Pushed to AAP'] },
    ],
    aap: { project: 'pushed', jobTemplate: 'pushed' },
    lastJobRun: { status: 'success', timestamp: '2026-03-16 06:00' },
    starred: true,
  },
  {
    name: 'cis-compliance-scanner',
    title: 'cis-compliance-scanner',
    pipelineType: 'comprehensive',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-16 07:00', duration: '4s', detail: 'Commit 5fb3e91 by priya.patel', description: STAGE_DESCRIPTIONS['Commit'] },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-16 07:01', duration: '44s', description: STAGE_DESCRIPTIONS['Lint'] },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-16 07:02', duration: '1m 12s', description: STAGE_DESCRIPTIONS['Policy Check'] },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-16 07:05', duration: '2m 35s', description: STAGE_DESCRIPTIONS['EE Compatibility'] },
      { name: 'Integration Test', status: 'running', description: STAGE_DESCRIPTIONS['Integration Test'] },
      { name: 'Pushed to AAP', status: 'pending', description: STAGE_DESCRIPTIONS['Pushed to AAP'] },
    ],
    aap: { project: 'pushed', jobTemplate: 'not-pushed' },
    lastJobRun: { status: 'success', timestamp: '2026-03-14 18:45' },
    starred: false,
  },
];
