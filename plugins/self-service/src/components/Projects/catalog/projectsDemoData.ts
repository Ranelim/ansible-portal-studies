export type PipelineStage = {
  name: string;
  status: 'passed' | 'running' | 'failed' | 'pending';
  timestamp?: string;
  detail?: string;
};

export type AapStatus = {
  project: 'synced' | 'pending' | 'error';
  jobTemplate: 'synced' | 'pending' | 'error';
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

export const DEMO_PROJECTS: DemoProject[] = [
  {
    name: 'web-app-scaling-suite',
    title: 'web-app-scaling-suite',
    pipelineType: 'comprehensive',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-14 09:12', detail: 'Commit lab482683 by sarah.chen' },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-14 09:13' },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-14 09:14' },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-14 09:16' },
      { name: 'Integration Test', status: 'passed', timestamp: '2026-03-14 09:22' },
      { name: 'Pushed to AAP', status: 'passed', timestamp: '2026-03-14 09:23' },
    ],
    aap: { project: 'synced', jobTemplate: 'synced' },
    lastJobRun: { status: 'success', timestamp: '2026-03-15 14:30' },
    starred: false,
  },
  {
    name: 'network-compliance-checker',
    title: 'network-compliance-checker',
    pipelineType: 'comprehensive',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-16 08:45', detail: 'Commit f9a21c7 by james.wu' },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-16 08:46' },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-16 08:47' },
      { name: 'EE Compatibility', status: 'running' },
      { name: 'Integration Test', status: 'pending' },
      { name: 'Pushed to AAP', status: 'pending' },
    ],
    aap: { project: 'synced', jobTemplate: 'synced' },
    lastJobRun: { status: 'none' },
    starred: false,
  },
  {
    name: 'aws-provisioner',
    title: 'aws-provisioner',
    pipelineType: 'standard',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-15 16:02', detail: 'Commit 3e8b1a4 by maria.garcia' },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-15 16:03' },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-15 16:04' },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-15 16:06' },
      { name: 'Pushed to AAP', status: 'passed', timestamp: '2026-03-15 16:07' },
    ],
    aap: { project: 'synced', jobTemplate: 'synced' },
    lastJobRun: { status: 'success', timestamp: '2026-03-16 02:00' },
    starred: true,
  },
  {
    name: 'firewall-policy-engine',
    title: 'firewall-policy-engine',
    pipelineType: 'standard',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-16 10:30', detail: 'Commit 7d4e5f2 by alex.kim' },
      { name: 'Lint', status: 'failed', timestamp: '2026-03-16 10:31' },
      { name: 'Policy Check', status: 'pending' },
      { name: 'EE Compatibility', status: 'pending' },
      { name: 'Pushed to AAP', status: 'pending' },
    ],
    aap: { project: 'synced', jobTemplate: 'pending' },
    lastJobRun: { status: 'failed', timestamp: '2026-03-15 22:15' },
    starred: false,
  },
  {
    name: 'rhel-patch-automation',
    title: 'rhel-patch-automation',
    pipelineType: 'comprehensive',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-13 11:20', detail: 'Commit a1c9d83 by david.lee' },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-13 11:21' },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-13 11:22' },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-13 11:25' },
      { name: 'Integration Test', status: 'passed', timestamp: '2026-03-13 11:32' },
      { name: 'Pushed to AAP', status: 'passed', timestamp: '2026-03-13 11:33' },
    ],
    aap: { project: 'synced', jobTemplate: 'synced' },
    lastJobRun: { status: 'success', timestamp: '2026-03-16 06:00' },
    starred: true,
  },
  {
    name: 'cis-compliance-scanner',
    title: 'cis-compliance-scanner',
    pipelineType: 'comprehensive',
    pipeline: [
      { name: 'Commit', status: 'passed', timestamp: '2026-03-16 07:00', detail: 'Commit 5fb3e91 by priya.patel' },
      { name: 'Lint', status: 'passed', timestamp: '2026-03-16 07:01' },
      { name: 'Policy Check', status: 'passed', timestamp: '2026-03-16 07:02' },
      { name: 'EE Compatibility', status: 'passed', timestamp: '2026-03-16 07:05' },
      { name: 'Integration Test', status: 'running' },
      { name: 'Pushed to AAP', status: 'pending' },
    ],
    aap: { project: 'synced', jobTemplate: 'pending' },
    lastJobRun: { status: 'success', timestamp: '2026-03-14 18:45' },
    starred: false,
  },
];
