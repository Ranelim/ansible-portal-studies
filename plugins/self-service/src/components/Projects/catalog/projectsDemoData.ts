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
    name: 'web-app-scaling-suite',
    title: 'web-app-scaling-suite',
    description: 'Automated horizontal and vertical scaling for web application tiers including load balancers, application servers, and database replicas.',
    owner: 'sarah.chen',
    createdAt: '2026-02-10',
    templateUsed: 'Standard Playbook Project',
    pipelineType: 'comprehensive',
    repo: {
      url: 'https://github.com/acme-corp/web-app-scaling-suite',
      branch: 'main',
      provider: 'github',
      lastCommit: { hash: 'lab482683', message: 'fix: adjust scaling thresholds for peak traffic', author: 'sarah.chen', timestamp: '2026-03-14 09:12' },
    },
    resources: [
      { name: 'scale-web-tier.yml', path: 'playbooks/scale-web-tier.yml', type: 'playbook' },
      { name: 'scale-db-replicas.yml', path: 'playbooks/scale-db-replicas.yml', type: 'playbook' },
      { name: 'healthcheck.yml', path: 'playbooks/healthcheck.yml', type: 'playbook' },
      { name: 'common', path: 'roles/common', type: 'role' },
      { name: 'cloud.aws_ops', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'ee-web-scaling', path: 'execution-environment.yml', type: 'execution-environment' },
    ],
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
    jobHistory: [
      { id: 4821, status: 'success', startedAt: '2026-03-15 14:30', duration: '2m 15s', launchedBy: 'sarah.chen' },
      { id: 4790, status: 'success', startedAt: '2026-03-14 10:00', duration: '2m 08s', launchedBy: 'scheduler' },
      { id: 4756, status: 'failed', startedAt: '2026-03-13 14:30', duration: '1m 42s', launchedBy: 'sarah.chen' },
    ],
    pipelineHistory: [
      { id: 312, trigger: 'lab482683', commitMessage: 'fix: adjust scaling thresholds for peak traffic', status: 'passed', startedAt: '2026-03-14 09:12', duration: '8m 26s', stages: [] },
      { id: 308, trigger: 'e7f3b21', commitMessage: 'chore: update cloud.aws_ops collection to 2.1', status: 'passed', startedAt: '2026-03-12 15:44', duration: '8m 10s', stages: [] },
      { id: 301, trigger: '9ab12c4', commitMessage: 'feat: add auto-scaling rules for db replicas', status: 'failed', startedAt: '2026-03-10 11:20', duration: '3m 52s', stages: [] },
    ],
  },
  {
    name: 'network-compliance-checker',
    title: 'network-compliance-checker',
    description: 'Validates network device configurations against organizational security and compliance policies across Cisco, Juniper, and Arista platforms.',
    owner: 'james.wu',
    createdAt: '2026-01-22',
    templateUsed: 'Network Automation Project',
    pipelineType: 'comprehensive',
    repo: {
      url: 'https://github.com/acme-corp/network-compliance-checker',
      branch: 'main',
      provider: 'github',
      lastCommit: { hash: 'f9a21c7', message: 'feat: add Arista EOS compliance rules', author: 'james.wu', timestamp: '2026-03-16 08:45' },
    },
    resources: [
      { name: 'check-compliance.yml', path: 'playbooks/check-compliance.yml', type: 'playbook' },
      { name: 'remediate-findings.yml', path: 'playbooks/remediate-findings.yml', type: 'playbook' },
      { name: 'generate-report.yml', path: 'playbooks/generate-report.yml', type: 'playbook' },
      { name: 'cisco_compliance', path: 'roles/cisco_compliance', type: 'role' },
      { name: 'arista_compliance', path: 'roles/arista_compliance', type: 'role' },
      { name: 'network.base', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'cisco.ios', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'ee-network-compliance', path: 'execution-environment.yml', type: 'execution-environment' },
    ],
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
    jobHistory: [],
    pipelineHistory: [
      { id: 315, trigger: 'f9a21c7', commitMessage: 'feat: add Arista EOS compliance rules', status: 'running', startedAt: '2026-03-16 08:45', duration: '—', stages: [] },
      { id: 310, trigger: 'c4b2e19', commitMessage: 'fix: VLAN validation for trunk ports', status: 'passed', startedAt: '2026-03-14 09:30', duration: '10m 44s', stages: [] },
    ],
  },
  {
    name: 'aws-provisioner',
    title: 'aws-provisioner',
    description: 'Self-service provisioning of AWS infrastructure including EC2 instances, VPCs, security groups, and RDS databases with standardized tagging and compliance.',
    owner: 'maria.garcia',
    createdAt: '2026-01-05',
    templateUsed: 'Cloud Provisioning Project',
    pipelineType: 'standard',
    repo: {
      url: 'https://github.com/acme-corp/aws-provisioner',
      branch: 'main',
      provider: 'github',
      lastCommit: { hash: '3e8b1a4', message: 'chore: update instance type defaults to m6i', author: 'maria.garcia', timestamp: '2026-03-15 16:02' },
    },
    resources: [
      { name: 'provision-ec2.yml', path: 'playbooks/provision-ec2.yml', type: 'playbook' },
      { name: 'provision-rds.yml', path: 'playbooks/provision-rds.yml', type: 'playbook' },
      { name: 'teardown.yml', path: 'playbooks/teardown.yml', type: 'playbook' },
      { name: 'amazon.aws', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'amazon.cloud', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'ee-aws-provisioner', path: 'execution-environment.yml', type: 'execution-environment' },
    ],
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
    jobHistory: [
      { id: 4830, status: 'success', startedAt: '2026-03-16 02:00', duration: '4m 30s', launchedBy: 'scheduler' },
      { id: 4812, status: 'success', startedAt: '2026-03-15 17:00', duration: '3m 55s', launchedBy: 'maria.garcia' },
      { id: 4801, status: 'success', startedAt: '2026-03-14 02:00', duration: '4m 12s', launchedBy: 'scheduler' },
      { id: 4778, status: 'failed', startedAt: '2026-03-12 14:22', duration: '2m 01s', launchedBy: 'maria.garcia' },
    ],
    pipelineHistory: [
      { id: 314, trigger: '3e8b1a4', commitMessage: 'chore: update instance type defaults to m6i', status: 'passed', startedAt: '2026-03-15 16:02', duration: '3m 40s', stages: [] },
      { id: 309, trigger: 'b1a3d5e', commitMessage: 'feat: add spot instance support for dev envs', status: 'passed', startedAt: '2026-03-13 10:15', duration: '3m 22s', stages: [] },
    ],
  },
  {
    name: 'firewall-policy-engine',
    title: 'firewall-policy-engine',
    description: 'Manages firewall rules and security policies across Palo Alto and Fortinet appliances with change validation and rollback capabilities.',
    owner: 'alex.kim',
    createdAt: '2026-02-28',
    templateUsed: 'Network Automation Project',
    pipelineType: 'standard',
    repo: {
      url: 'https://gitlab.acme-corp.com/security/firewall-policy-engine',
      branch: 'develop',
      provider: 'gitlab',
      lastCommit: { hash: '7d4e5f2', message: 'feat: add zone-based policy rules', author: 'alex.kim', timestamp: '2026-03-16 10:30' },
    },
    resources: [
      { name: 'apply-policies.yml', path: 'playbooks/apply-policies.yml', type: 'playbook' },
      { name: 'validate-rules.yml', path: 'playbooks/validate-rules.yml', type: 'playbook' },
      { name: 'rollback.yml', path: 'playbooks/rollback.yml', type: 'playbook' },
      { name: 'paloalto.panos', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'ee-security-automation', path: 'execution-environment.yml', type: 'execution-environment' },
    ],
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
    jobHistory: [
      { id: 4825, status: 'failed', startedAt: '2026-03-15 22:15', duration: '0m 48s', launchedBy: 'alex.kim' },
      { id: 4810, status: 'success', startedAt: '2026-03-14 16:00', duration: '1m 35s', launchedBy: 'alex.kim' },
    ],
    pipelineHistory: [
      { id: 316, trigger: '7d4e5f2', commitMessage: 'feat: add zone-based policy rules', status: 'failed', startedAt: '2026-03-16 10:30', duration: '0m 26s', stages: [] },
      { id: 311, trigger: '2c8a1f0', commitMessage: 'fix: update iptables flush sequence', status: 'passed', startedAt: '2026-03-14 15:10', duration: '3m 18s', stages: [] },
    ],
  },
  {
    name: 'rhel-patch-automation',
    title: 'rhel-patch-automation',
    description: 'Automated RHEL patching workflow with pre-flight checks, staged rollouts, compliance verification, and automated rollback on failure.',
    owner: 'david.lee',
    createdAt: '2025-11-15',
    templateUsed: 'Standard Playbook Project',
    pipelineType: 'comprehensive',
    repo: {
      url: 'https://github.com/acme-corp/rhel-patch-automation',
      branch: 'main',
      provider: 'github',
      lastCommit: { hash: 'a1c9d83', message: 'fix: handle RHEL 9.4 kernel dependency', author: 'david.lee', timestamp: '2026-03-13 11:20' },
    },
    resources: [
      { name: 'patch-servers.yml', path: 'playbooks/patch-servers.yml', type: 'playbook' },
      { name: 'preflight-checks.yml', path: 'playbooks/preflight-checks.yml', type: 'playbook' },
      { name: 'verify-compliance.yml', path: 'playbooks/verify-compliance.yml', type: 'playbook' },
      { name: 'rollback.yml', path: 'playbooks/rollback.yml', type: 'playbook' },
      { name: 'patching', path: 'roles/patching', type: 'role' },
      { name: 'compliance', path: 'roles/compliance', type: 'role' },
      { name: 'redhat.rhel_system_roles', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'ee-rhel-patching', path: 'execution-environment.yml', type: 'execution-environment' },
    ],
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
    jobHistory: [
      { id: 4835, status: 'success', startedAt: '2026-03-16 06:00', duration: '12m 30s', launchedBy: 'scheduler' },
      { id: 4822, status: 'success', startedAt: '2026-03-15 06:00', duration: '11m 55s', launchedBy: 'scheduler' },
      { id: 4808, status: 'success', startedAt: '2026-03-14 06:00', duration: '12m 10s', launchedBy: 'scheduler' },
      { id: 4795, status: 'success', startedAt: '2026-03-13 12:00', duration: '12m 45s', launchedBy: 'david.lee' },
      { id: 4780, status: 'failed', startedAt: '2026-03-12 06:00', duration: '8m 22s', launchedBy: 'scheduler' },
    ],
    pipelineHistory: [
      { id: 307, trigger: 'a1c9d83', commitMessage: 'fix: handle RHEL 9.4 kernel dependency', status: 'passed', startedAt: '2026-03-13 11:20', duration: '10m 57s', stages: [] },
      { id: 299, trigger: '4fe2a11', commitMessage: 'chore: update satellite credentials rotation', status: 'passed', startedAt: '2026-03-10 09:05', duration: '10m 30s', stages: [] },
      { id: 290, trigger: 'c312bb9', commitMessage: 'feat: add rollback on failed smoke test', status: 'passed', startedAt: '2026-03-06 14:18', duration: '10m 22s', stages: [] },
    ],
  },
  {
    name: 'cis-compliance-scanner',
    title: 'cis-compliance-scanner',
    description: 'Scans infrastructure against CIS Benchmarks for RHEL, Windows, and Kubernetes with automated evidence collection for audit reporting.',
    owner: 'priya.patel',
    createdAt: '2026-02-01',
    templateUsed: 'Standard Playbook Project',
    pipelineType: 'comprehensive',
    repo: {
      url: 'https://github.com/acme-corp/cis-compliance-scanner',
      branch: 'main',
      provider: 'github',
      lastCommit: { hash: '5fb3e91', message: 'feat: add CIS Level 2 checks for RHEL 9', author: 'priya.patel', timestamp: '2026-03-16 07:00' },
    },
    resources: [
      { name: 'scan-rhel.yml', path: 'playbooks/scan-rhel.yml', type: 'playbook' },
      { name: 'scan-windows.yml', path: 'playbooks/scan-windows.yml', type: 'playbook' },
      { name: 'generate-evidence.yml', path: 'playbooks/generate-evidence.yml', type: 'playbook' },
      { name: 'cis_rhel', path: 'roles/cis_rhel', type: 'role' },
      { name: 'redhat.rhel_system_roles', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'community.general', path: 'collections/requirements.yml', type: 'collection-dep' },
      { name: 'ee-compliance-scanner', path: 'execution-environment.yml', type: 'execution-environment' },
    ],
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
    jobHistory: [
      { id: 4818, status: 'success', startedAt: '2026-03-14 18:45', duration: '6m 20s', launchedBy: 'priya.patel' },
      { id: 4805, status: 'success', startedAt: '2026-03-13 18:00', duration: '6m 05s', launchedBy: 'scheduler' },
    ],
    pipelineHistory: [
      { id: 317, trigger: '5fb3e91', commitMessage: 'feat: add CIS Level 2 checks for RHEL 9', status: 'running', startedAt: '2026-03-16 07:00', duration: '—', stages: [] },
      { id: 306, trigger: 'b22d4e8', commitMessage: 'fix: correct auditd rule ordering', status: 'passed', startedAt: '2026-03-13 16:40', duration: '11m 15s', stages: [] },
    ],
  },
];
