import { DEMO_PROJECTS, type DemoProject, type ProjectResource } from './projectsDemoData';
import { DISCOVERED_REPOS, type DiscoveredRepo } from '../repositories/repositoriesDemoData';

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
  status: 'passed' | 'failed' | 'running';
  startedAt: string;
  duration: string;
  stages: PipelineStage[];
};

export type PolicyCheck = {
  id: string;
  name: string;
  description: string;
  standard?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
};

export type PipelineProfile = {
  id: string;
  name: string;
  description: string;
  stages: string[];
  source: 'built-in' | 'organization' | 'custom';
  policies: PolicyCheck[];
};

export const PIPELINE_PROFILES: PipelineProfile[] = [
  {
    id: 'stig-rhel9',
    name: 'STIG RHEL9',
    description:
      'Enforces DISA STIG security controls for RHEL 9 automation content. Required for DoD and government environments.',
    stages: [
      'Commit',
      'Lint',
      'Quality Scan',
      'STIG Compliance',
      'EE Compatibility',
      'Integration Test',
    ],
    source: 'built-in',
    policies: [
      {
        id: 'stig-no-hardcoded-credentials',
        name: 'No hardcoded credentials',
        description: 'Secrets must not appear in playbooks, roles, or variables committed to the repository.',
        standard: 'STIG V-230264',
        severity: 'critical',
      },
      {
        id: 'stig-vault-encryption',
        name: 'Vault encryption required',
        description: 'Sensitive values must be encrypted with Ansible Vault or an approved secret manager.',
        standard: 'STIG V-230265',
        severity: 'critical',
      },
      {
        id: 'stig-no-community-modules-prod',
        name: 'No community modules in production',
        description: 'Production content must use supported or certified collections only.',
        standard: 'STIG',
        severity: 'high',
      },
      {
        id: 'stig-approved-base-images',
        name: 'Approved base images only',
        description: 'Execution environments must use organization-approved base images.',
        standard: 'STIG',
        severity: 'high',
      },
      {
        id: 'stig-min-ansible-core',
        name: 'Minimum ansible-core version',
        description: 'Content must target an ansible-core version that meets the platform baseline.',
        standard: 'STIG',
        severity: 'medium',
      },
      {
        id: 'stig-apme-quality-scan',
        name: 'APME quality scan required',
        description: 'All pushes must pass an APME quality scan. Violations must be below the threshold before merging.',
        standard: 'APME',
        severity: 'high',
      },
    ],
  },
  {
    id: 'org-default',
    name: 'Organization Default',
    description:
      'Standard governance pipeline enforcing organizational policies defined by your platform team.',
    stages: ['Commit', 'Lint', 'Quality Scan', 'Policy Check', 'EE Compatibility'],
    source: 'organization',
    policies: [
      {
        id: 'org-no-hardcoded-credentials',
        name: 'No hardcoded credentials',
        description: 'Blocks commits that contain plaintext passwords, API keys, or tokens.',
        severity: 'critical',
      },
      {
        id: 'org-approved-collections',
        name: 'Approved collections only',
        description: 'Only collections on the organization allow list may be referenced.',
        severity: 'high',
      },
      {
        id: 'org-content-structure',
        name: 'Content structure validation',
        description: 'Enforces required directory layout and metadata files for automation projects.',
        severity: 'medium',
      },
      {
        id: 'org-naming-conventions',
        name: 'Naming conventions',
        description: 'Playbooks, roles, and variables must follow organizational naming rules.',
        severity: 'low',
      },
      {
        id: 'org-apme-quality-gate',
        name: 'Quality scan gate',
        description: 'APME quality scans run on every push and pull request. Critical and high violations block merge.',
        severity: 'high',
      },
    ],
  },
  {
    id: 'cis-benchmark',
    name: 'CIS Benchmark',
    description:
      'Validates automation content against CIS Benchmark controls for infrastructure hardening.',
    stages: [
      'Commit',
      'Lint',
      'Quality Scan',
      'CIS Compliance',
      'EE Compatibility',
      'Integration Test',
    ],
    source: 'built-in',
    policies: [
      {
        id: 'cis-level-1',
        name: 'CIS Level 1 controls',
        description: 'Validates alignment with CIS Level 1 hardening recommendations.',
        standard: 'CIS',
        severity: 'high',
      },
      {
        id: 'cis-level-2',
        name: 'CIS Level 2 controls',
        description: 'Optional deeper checks for CIS Level 2 where enabled by policy.',
        standard: 'CIS',
        severity: 'medium',
      },
      {
        id: 'cis-hardened-images',
        name: 'Hardened base images',
        description: 'EE definitions must reference CIS-hardened or approved image baselines.',
        standard: 'CIS',
        severity: 'high',
      },
      {
        id: 'cis-audit-logging',
        name: 'Audit logging enabled',
        description: 'Automation that configures systems must enable audit logging where applicable.',
        standard: 'CIS',
        severity: 'medium',
      },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description:
      'Lightweight pipeline with basic linting. Suitable for development or non-production content.',
    stages: ['Commit', 'Lint'],
    source: 'built-in',
    policies: [
      {
        id: 'min-yaml-validation',
        name: 'Basic YAML validation',
        description: 'Ensures YAML files parse correctly and meet basic structural rules.',
        severity: 'medium',
      },
      {
        id: 'min-no-syntax-errors',
        name: 'No syntax errors',
        description: 'Fails the pipeline when Ansible syntax errors are detected.',
        severity: 'high',
      },
    ],
  },
];

export const STAGE_DESCRIPTIONS: Record<string, string> = {
  Commit: 'Detects and validates the latest code change pushed to the repository.',
  Lint: 'Checks playbook structure, YAML syntax, and best practices using ansible-lint.',
  'Policy Check':
    'Validates content against organizational governance policies and security standards.',
  'STIG Compliance':
    'Validates automation content against DISA STIG controls for RHEL 9 and related security requirements.',
  'CIS Compliance':
    'Validates automation content against CIS Benchmark controls for infrastructure hardening.',
  'EE Compatibility':
    'Verifies that the automation content runs correctly inside the target Execution Environment.',
  'Integration Test':
    'Runs end-to-end tests against a sandboxed environment to catch regressions.',
};

export type GovernanceStatus = 'discovered' | 'governed' | 'pushed-to-aap';

export type DiscoveredResourceSummary = {
  type: 'playbook' | 'role' | 'collection-dep' | 'execution-environment';
  count: number;
  items: string[];
};

export type GitRepository = {
  name: string;
  org: string;
  provider: 'github' | 'gitlab';
  url: string;
  branch: string;
  visibility: 'public' | 'private' | 'internal';
  discoveredAt: string;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
    timestamp: string;
  };
  resources: DiscoveredResourceSummary[];
  governance: GovernanceStatus;
  pipelineProfileId?: string;
  pipeline?: PipelineStage[];
  aap?: AapStatus;
  lastJobRun?: LastJobRun;
  description?: string;
  owner?: string;
  createdAt?: string;
  templateUsed?: string;
  starred?: boolean;
  pipelineHistory?: PipelineRun[];
  jobHistory?: JobRunEntry[];
};

const DISCOVERED_ONLY_NAMES = new Set([
  'backup-automation',
]);

const PIPELINE_PROFILE_BY_REPO: Record<string, string> = {
  'rhel-patching': 'stig-rhel9',
};

const discoveredByName = new Map(DISCOVERED_REPOS.map(r => [r.name, r]));

function aggregateResources(resources: ProjectResource[]): DiscoveredResourceSummary[] {
  const grouped: Record<string, string[]> = {};
  for (const res of resources) {
    if (!grouped[res.type]) grouped[res.type] = [];
    grouped[res.type].push(res.name);
  }
  const order: Array<'playbook' | 'role' | 'collection-dep' | 'execution-environment'> = [
    'playbook',
    'role',
    'collection-dep',
    'execution-environment',
  ];
  return order
    .filter(t => (grouped[t]?.length ?? 0) > 0)
    .map(type => ({ type, count: grouped[type]!.length, items: grouped[type]! }));
}

function orgFromProjectUrl(p: DemoProject): string {
  const url = p.repo.url;
  const gh = url.match(/github\.com\/([^/]+)\//);
  if (gh) return gh[1];
  const gl = url.match(/gitlab[^/]+\/([^/]+)\//);
  return gl ? gl[1] : 'unknown';
}

function mapPipelineStagesForProfile(
  stages: DemoProject['pipeline'],
  profileId: string,
): PipelineStage[] {
  return stages
    .filter(stage => stage.name !== 'Pushed to AAP')
    .map(stage => {
      if (stage.name !== 'Policy Check') return stage as PipelineStage;
      if (profileId === 'stig-rhel9') {
        return {
          ...(stage as PipelineStage),
          name: 'STIG Compliance',
          description: STAGE_DESCRIPTIONS['STIG Compliance'],
        };
      }
      if (profileId === 'cis-benchmark') {
        return {
          ...(stage as PipelineStage),
          name: 'CIS Compliance',
          description: STAGE_DESCRIPTIONS['CIS Compliance'],
        };
      }
      return { ...(stage as PipelineStage), description: STAGE_DESCRIPTIONS['Policy Check'] };
    });
}

function demoProjectToGitRepository(p: DemoProject): GitRepository {
  const profileId = PIPELINE_PROFILE_BY_REPO[p.name];
  const meta = discoveredByName.get(p.name);
  return {
    name: p.name,
    org: meta?.org ?? orgFromProjectUrl(p),
    provider: p.repo.provider,
    url: p.repo.url,
    branch: p.repo.branch,
    visibility: meta?.visibility ?? 'private',
    discoveredAt: meta?.discoveredAt ?? `${p.createdAt} 00:00`,
    lastCommit: {
      hash: p.repo.lastCommit.hash,
      message: p.repo.lastCommit.message,
      author: p.repo.lastCommit.author,
      timestamp: p.repo.lastCommit.timestamp,
    },
    resources: aggregateResources(p.resources),
    governance: 'discovered',
    pipelineProfileId: profileId,
    pipeline: mapPipelineStagesForProfile(p.pipeline, profileId),
    aap: p.aap,
    lastJobRun: p.lastJobRun,
    description: p.description,
    owner: p.owner,
    createdAt: p.createdAt,
    templateUsed: p.templateUsed,
    starred: p.starred,
    pipelineHistory: p.pipelineHistory,
    jobHistory: p.jobHistory,
  };
}

const DISCOVERED_RESOURCE_NAMES: Record<string, Record<string, string[]>> = {
  'network-firewall-rules': {
    playbook: ['apply-rules.yml', 'validate-rules.yml', 'rollback.yml'],
    role: ['firewall-base'],
    'collection-dep': ['paloalto.panos', 'ansible.netcommon'],
  },
  'cloud-provisioner': {
    playbook: ['provision-ec2.yml', 'teardown.yml'],
    'collection-dep': ['amazon.aws'],
    'execution-environment': ['ee-cloud-ops.yml'],
  },
  'backup-automation': {
    playbook: ['backup-postgres.yml', 'backup-mysql.yml', 'restore-database.yml'],
    role: ['db-backup-agent'],
    'collection-dep': ['community.postgresql', 'community.mysql'],
  },
};

function discoveredResourcesWithNames(r: DiscoveredRepo): DiscoveredResourceSummary[] {
  const nameMap = DISCOVERED_RESOURCE_NAMES[r.name] ?? {};
  return r.resources.map(res => ({
    type: res.type,
    count: res.count,
    items: nameMap[res.type] ?? Array.from({ length: res.count }, (_, i) => `${res.type}-${i + 1}`),
  }));
}

function discoveredRepoToGitRepository(r: DiscoveredRepo): GitRepository {
  return {
    name: r.name,
    org: r.org,
    provider: r.provider,
    url: r.url,
    branch: r.branch,
    visibility: r.visibility,
    discoveredAt: r.discoveredAt,
    lastCommit: {
      hash: r.lastCommitHash,
      message: r.lastCommitMessage,
      author: r.lastCommitAuthor,
      timestamp: r.lastCommitTimestamp,
    },
    resources: discoveredResourcesWithNames(r),
    governance: 'discovered',
  };
}

const governedRepos = DEMO_PROJECTS.map(demoProjectToGitRepository);
const ungovernedRepos = DISCOVERED_REPOS.filter(r => DISCOVERED_ONLY_NAMES.has(r.name)).map(
  discoveredRepoToGitRepository,
);

export const GIT_REPOSITORIES: GitRepository[] = [...governedRepos, ...ungovernedRepos];
