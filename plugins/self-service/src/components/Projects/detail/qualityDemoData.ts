export type SeverityClass = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type QualityViolation = {
  ruleId: string;
  message: string;
  file: string;
  lineStart: number;
  severity: SeverityClass;
  fixTier: 'deterministic' | 'ai' | 'manual';
};

export type AiProposal = {
  id: string;
  ruleId: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  explanation: string;
  diffHunk: string;
  confidence: number;
  tier: number;
  status: 'proposed' | 'declined';
  suggestion?: string;
};

export type TrendPoint = {
  scanIndex: number;
  totalViolations: number;
  fixable: number;
};

export type ScanResult = {
  scanId: string;
  scanType: 'check' | 'remediate';
  createdAt: string;
  totalViolations: number;
  fixable: number;
  aiCandidates: number;
  aiAccepted: number;
  aiDeclined: number;
  manualReview: number;
  remediatedCount: number;
  severityBreakdown: Record<SeverityClass, number>;
  commitHash: string;
};

export type CollectionDependency = {
  fqcn: string;
  version: string;
  source: string;
  violations: number;
};

export type PythonDependency = {
  name: string;
  version: string;
  cveCount: number;
  highestSeverity?: SeverityClass;
};

export type ProjectQualityData = {
  healthScore: number;
  totalViolations: number;
  lastScannedAt: string;
  lastScannedCommit: string;
  scanCount: number;
  severityBreakdown: Record<SeverityClass, number>;
  trend: TrendPoint[];
  latestScan: ScanResult;
  scanHistory: ScanResult[];
  violations: QualityViolation[];
  proposals: AiProposal[];
  ansibleCoreVersion: string;
  collections: CollectionDependency[];
  pythonPackages: PythonDependency[];
};

const QUALITY_DATA: Record<string, ProjectQualityData> = {
  'rhel-patching': {
    healthScore: 82,
    totalViolations: 7,
    lastScannedAt: '2 hours ago',
    lastScannedCommit: 'a3f1b2c',
    scanCount: 14,
    severityBreakdown: { critical: 0, high: 1, medium: 3, low: 2, info: 1 },
    trend: [
      { scanIndex: 1, totalViolations: 18, fixable: 12 },
      { scanIndex: 2, totalViolations: 15, fixable: 10 },
      { scanIndex: 3, totalViolations: 12, fixable: 8 },
      { scanIndex: 4, totalViolations: 10, fixable: 7 },
      { scanIndex: 5, totalViolations: 7, fixable: 5 },
    ],
    latestScan: {
      scanId: 'scan-rhel-014',
      scanType: 'remediate',
      createdAt: '2 hours ago',
      totalViolations: 7,
      fixable: 5,
      aiCandidates: 3,
      aiAccepted: 2,
      aiDeclined: 1,
      manualReview: 2,
      remediatedCount: 4,
      severityBreakdown: { critical: 0, high: 1, medium: 3, low: 2, info: 1 },
      commitHash: 'a3f1b2c',
    },
    scanHistory: [
      {
        scanId: 'scan-rhel-014', scanType: 'remediate', createdAt: 'Apr 14, 2026 10:22',
        totalViolations: 7, fixable: 5, aiCandidates: 3, aiAccepted: 2, aiDeclined: 1,
        manualReview: 2, remediatedCount: 4,
        severityBreakdown: { critical: 0, high: 1, medium: 3, low: 2, info: 1 },
        commitHash: 'a3f1b2c',
      },
      {
        scanId: 'scan-rhel-013', scanType: 'check', createdAt: 'Apr 12, 2026 14:05',
        totalViolations: 10, fixable: 7, aiCandidates: 4, aiAccepted: 0, aiDeclined: 0,
        manualReview: 3, remediatedCount: 0,
        severityBreakdown: { critical: 0, high: 2, medium: 4, low: 3, info: 1 },
        commitHash: 'f8e2d1a',
      },
      {
        scanId: 'scan-rhel-012', scanType: 'remediate', createdAt: 'Apr 10, 2026 09:15',
        totalViolations: 12, fixable: 8, aiCandidates: 5, aiAccepted: 4, aiDeclined: 1,
        manualReview: 3, remediatedCount: 7,
        severityBreakdown: { critical: 1, high: 2, medium: 5, low: 3, info: 1 },
        commitHash: 'c4b3a9f',
      },
      {
        scanId: 'scan-rhel-011', scanType: 'check', createdAt: 'Apr 8, 2026 16:30',
        totalViolations: 15, fixable: 10, aiCandidates: 6, aiAccepted: 0, aiDeclined: 0,
        manualReview: 5, remediatedCount: 0,
        severityBreakdown: { critical: 1, high: 3, medium: 6, low: 4, info: 1 },
        commitHash: 'b2a7e3d',
      },
      {
        scanId: 'scan-rhel-010', scanType: 'remediate', createdAt: 'Apr 5, 2026 11:00',
        totalViolations: 18, fixable: 12, aiCandidates: 7, aiAccepted: 5, aiDeclined: 2,
        manualReview: 5, remediatedCount: 8,
        severityBreakdown: { critical: 2, high: 4, medium: 6, low: 4, info: 2 },
        commitHash: 'e1d5c8b',
      },
    ],
    violations: [
      { ruleId: 'fqcn[action-core]', message: 'Use FQCN for builtin module actions', file: 'tasks/main.yml', lineStart: 12, severity: 'medium', fixTier: 'deterministic' },
      { ruleId: 'yaml[truthy]', message: 'Truthy value should be one of [false, true]', file: 'defaults/main.yml', lineStart: 8, severity: 'low', fixTier: 'deterministic' },
      { ruleId: 'risky-file-permissions', message: 'File permissions unset or incorrect', file: 'tasks/patch-apply.yml', lineStart: 34, severity: 'high', fixTier: 'ai' },
      { ruleId: 'no-changed-when', message: 'Commands should not change things if nothing needs doing', file: 'tasks/pre-check.yml', lineStart: 22, severity: 'medium', fixTier: 'ai' },
      { ruleId: 'name[missing]', message: 'All tasks should be named', file: 'tasks/rollback.yml', lineStart: 5, severity: 'medium', fixTier: 'deterministic' },
      { ruleId: 'deprecated-module', message: 'Module is deprecated, use the replacement', file: 'tasks/report.yml', lineStart: 18, severity: 'low', fixTier: 'manual' },
      { ruleId: 'meta-no-info', message: 'Role metadata should contain relevant info', file: 'meta/main.yml', lineStart: 1, severity: 'info', fixTier: 'manual' },
    ],
    proposals: [
      {
        id: 'prop-1',
        ruleId: 'risky-file-permissions',
        file: 'tasks/patch-apply.yml',
        lineStart: 34,
        lineEnd: 40,
        explanation: 'The file module is creating files without explicit permissions. Adding mode: "0644" ensures consistent file permissions and prevents potential security issues.',
        diffHunk: `--- a/tasks/patch-apply.yml\n+++ b/tasks/patch-apply.yml\n@@ -34,6 +34,7 @@\n     - name: Write patch report\n       ansible.builtin.copy:\n         content: "{{ patch_results | to_nice_yaml }}"\n         dest: /var/log/patch-report.yml\n+        mode: "0644"`,
        confidence: 0.94,
        tier: 2,
        status: 'proposed',
      },
      {
        id: 'prop-2',
        ruleId: 'no-changed-when',
        file: 'tasks/pre-check.yml',
        lineStart: 22,
        lineEnd: 28,
        explanation: 'This shell task always reports "changed" even when checking status. Adding changed_when with a condition prevents false change reports.',
        diffHunk: `--- a/tasks/pre-check.yml\n+++ b/tasks/pre-check.yml\n@@ -22,6 +22,7 @@\n     - name: Check current kernel version\n       ansible.builtin.shell: uname -r\n       register: kernel_version\n+      changed_when: false`,
        confidence: 0.91,
        tier: 2,
        status: 'proposed',
      },
      {
        id: 'prop-3',
        ruleId: 'deprecated-module',
        file: 'tasks/report.yml',
        lineStart: 18,
        lineEnd: 24,
        explanation: 'The yum module is deprecated for RHEL 8+. However, replacing it requires verifying the dnf module supports all parameters used here.',
        diffHunk: '',
        confidence: 0.42,
        tier: 2,
        status: 'declined',
        suggestion: 'Consider replacing ansible.builtin.yum with ansible.builtin.dnf. Verify parameter compatibility before applying.',
      },
    ],
    ansibleCoreVersion: '2.16.3',
    collections: [
      { fqcn: 'ansible.posix', version: '1.5.4', source: 'galaxy', violations: 0 },
      { fqcn: 'community.general', version: '7.5.0', source: 'galaxy', violations: 2 },
      { fqcn: 'redhat.rhel_system_roles', version: '1.23.0', source: 'automation_hub', violations: 0 },
    ],
    pythonPackages: [
      { name: 'jmespath', version: '1.0.1', cveCount: 0 },
      { name: 'netaddr', version: '0.8.0', cveCount: 1, highestSeverity: 'medium' },
      { name: 'cryptography', version: '41.0.7', cveCount: 0 },
      { name: 'requests', version: '2.31.0', cveCount: 0 },
    ],
  },
  'network-firewall-rules': {
    healthScore: 64,
    totalViolations: 14,
    lastScannedAt: '1 day ago',
    lastScannedCommit: 'e7d2f1a',
    scanCount: 8,
    severityBreakdown: { critical: 1, high: 3, medium: 5, low: 4, info: 1 },
    trend: [
      { scanIndex: 1, totalViolations: 22, fixable: 14 },
      { scanIndex: 2, totalViolations: 20, fixable: 13 },
      { scanIndex: 3, totalViolations: 18, fixable: 11 },
      { scanIndex: 4, totalViolations: 14, fixable: 9 },
    ],
    latestScan: {
      scanId: 'scan-web-008',
      scanType: 'check',
      createdAt: '1 day ago',
      totalViolations: 14,
      fixable: 9,
      aiCandidates: 5,
      aiAccepted: 0,
      aiDeclined: 0,
      manualReview: 5,
      remediatedCount: 0,
      severityBreakdown: { critical: 1, high: 3, medium: 5, low: 4, info: 1 },
      commitHash: 'e7d2f1a',
    },
    scanHistory: [],
    violations: [],
    proposals: [],
    ansibleCoreVersion: '2.15.8',
    collections: [
      { fqcn: 'amazon.aws', version: '6.5.0', source: 'galaxy', violations: 1 },
      { fqcn: 'community.aws', version: '6.4.0', source: 'galaxy', violations: 3 },
      { fqcn: 'ansible.posix', version: '1.5.4', source: 'galaxy', violations: 0 },
    ],
    pythonPackages: [
      { name: 'boto3', version: '1.28.0', cveCount: 0 },
      { name: 'botocore', version: '1.31.0', cveCount: 0 },
      { name: 'pyyaml', version: '5.4.1', cveCount: 2, highestSeverity: 'high' },
      { name: 'urllib3', version: '1.26.18', cveCount: 1, highestSeverity: 'medium' },
    ],
  },
  'cloud-provisioner': {
    healthScore: 91,
    totalViolations: 3,
    lastScannedAt: '4 hours ago',
    lastScannedCommit: 'b4f9c2d',
    scanCount: 22,
    severityBreakdown: { critical: 0, high: 0, medium: 1, low: 1, info: 1 },
    trend: [
      { scanIndex: 1, totalViolations: 8, fixable: 6 },
      { scanIndex: 2, totalViolations: 5, fixable: 4 },
      { scanIndex: 3, totalViolations: 3, fixable: 2 },
    ],
    latestScan: {
      scanId: 'scan-cis-022',
      scanType: 'check',
      createdAt: '4 hours ago',
      totalViolations: 3,
      fixable: 2,
      aiCandidates: 1,
      aiAccepted: 0,
      aiDeclined: 0,
      manualReview: 1,
      remediatedCount: 0,
      severityBreakdown: { critical: 0, high: 0, medium: 1, low: 1, info: 1 },
      commitHash: 'b4f9c2d',
    },
    scanHistory: [],
    violations: [],
    proposals: [],
    ansibleCoreVersion: '2.16.3',
    collections: [
      { fqcn: 'ansible.posix', version: '1.5.4', source: 'galaxy', violations: 0 },
      { fqcn: 'community.general', version: '7.5.0', source: 'galaxy', violations: 0 },
    ],
    pythonPackages: [
      { name: 'jmespath', version: '1.0.1', cveCount: 0 },
    ],
  },
  'backup-automation': {
    healthScore: 44,
    totalViolations: 21,
    lastScannedAt: '3 days ago',
    lastScannedCommit: 'c1d8e3f',
    scanCount: 5,
    severityBreakdown: { critical: 2, high: 5, medium: 8, low: 4, info: 2 },
    trend: [
      { scanIndex: 1, totalViolations: 28, fixable: 16 },
      { scanIndex: 2, totalViolations: 25, fixable: 14 },
      { scanIndex: 3, totalViolations: 21, fixable: 12 },
    ],
    latestScan: {
      scanId: 'scan-fw-005',
      scanType: 'check',
      createdAt: '3 days ago',
      totalViolations: 21,
      fixable: 12,
      aiCandidates: 6,
      aiAccepted: 0,
      aiDeclined: 0,
      manualReview: 9,
      remediatedCount: 0,
      severityBreakdown: { critical: 2, high: 5, medium: 8, low: 4, info: 2 },
      commitHash: 'c1d8e3f',
    },
    scanHistory: [],
    violations: [],
    proposals: [],
    ansibleCoreVersion: '2.15.4',
    collections: [
      { fqcn: 'paloalto.panos', version: '2.19.0', source: 'galaxy', violations: 3 },
      { fqcn: 'ansible.netcommon', version: '5.3.0', source: 'galaxy', violations: 1 },
    ],
    pythonPackages: [
      { name: 'pan-os-python', version: '1.11.0', cveCount: 1, highestSeverity: 'high' },
      { name: 'paramiko', version: '3.3.1', cveCount: 0 },
    ],
  },
};

export function getProjectQuality(projectName: string): ProjectQualityData | null {
  return QUALITY_DATA[projectName] ?? null;
}

export function getProjectHealthScore(repoName: string): number | undefined {
  return QUALITY_DATA[repoName]?.healthScore;
}

export function getProjectViolationCount(repoName: string): number | undefined {
  return QUALITY_DATA[repoName]?.totalViolations;
}

export function getProjectSeverityBreakdown(repoName: string): Record<SeverityClass, number> | undefined {
  return QUALITY_DATA[repoName]?.severityBreakdown;
}

export const SEVERITY_COLORS: Record<SeverityClass, string> = {
  critical: '#A30000',
  high: '#C9190B',
  medium: '#F0AB00',
  low: '#3E8635',
  info: '#6A6E73',
};

// ---------------------------------------------------------------------------
// AAP Version Upgrade
// ---------------------------------------------------------------------------

export type UpgradeFindingCategory =
  | 'deprecated-module'
  | 'changed-parameter'
  | 'collection-update'
  | 'python-dependency'
  | 'removed-feature';

export const UPGRADE_CATEGORY_LABELS: Record<UpgradeFindingCategory, string> = {
  'deprecated-module': 'Deprecated modules',
  'changed-parameter': 'Changed parameters',
  'collection-update': 'Collection updates',
  'python-dependency': 'Python dependencies',
  'removed-feature': 'Removed features',
};

export type UpgradeFinding = {
  id: string;
  category: UpgradeFindingCategory;
  severity: SeverityClass;
  title: string;
  description: string;
  file?: string;
  lineStart?: number;
  currentValue: string;
  suggestedValue: string;
  autoFixable: boolean;
  confidence: number;
};

export type AapUpgradeData = {
  currentVersion: string;
  latestVersion: string;
  findings: UpgradeFinding[];
  summary: {
    total: number;
    autoFixable: number;
    manualReview: number;
    breakingChanges: number;
  };
};

export const AAP_VERSIONS = ['2.4', '2.5', '2.6', '2.7'] as const;

const UPGRADE_DATA: Record<string, AapUpgradeData> = {
  'rhel-patching': {
    currentVersion: '2.4',
    latestVersion: '2.7',
    findings: [
      {
        id: 'uf-1',
        category: 'deprecated-module',
        severity: 'high',
        title: 'ansible.builtin.yum is deprecated',
        description: 'The yum module is deprecated in AAP 2.5+ for RHEL 8 and later. Use ansible.builtin.dnf instead, which supports the same parameters.',
        file: 'tasks/patch-apply.yml',
        lineStart: 14,
        currentValue: 'ansible.builtin.yum',
        suggestedValue: 'ansible.builtin.dnf',
        autoFixable: true,
        confidence: 0.96,
      },
      {
        id: 'uf-2',
        category: 'deprecated-module',
        severity: 'medium',
        title: 'ansible.builtin.command with warn parameter',
        description: 'The warn parameter for command/shell modules has been removed in ansible-core 2.17 (AAP 2.7). Remove the parameter or use a different approach.',
        file: 'tasks/pre-check.yml',
        lineStart: 8,
        currentValue: 'warn: false',
        suggestedValue: 'Remove parameter',
        autoFixable: true,
        confidence: 0.92,
      },
      {
        id: 'uf-3',
        category: 'changed-parameter',
        severity: 'high',
        title: 'include_tasks loop syntax changed',
        description: 'The "with_items" syntax for include_tasks is deprecated. Use "loop" instead for AAP 2.5+ compatibility.',
        file: 'tasks/main.yml',
        lineStart: 22,
        currentValue: 'with_items: "{{ packages }}"',
        suggestedValue: 'loop: "{{ packages }}"',
        autoFixable: true,
        confidence: 0.94,
      },
      {
        id: 'uf-4',
        category: 'collection-update',
        severity: 'medium',
        title: 'community.general requires 8.x for AAP 2.7',
        description: 'Current version 7.5.0 is not supported in AAP 2.7. Update to community.general >= 8.0.0 for full compatibility.',
        file: 'collections/requirements.yml',
        lineStart: 6,
        currentValue: 'community.general: 7.5.0',
        suggestedValue: 'community.general: 8.5.0',
        autoFixable: true,
        confidence: 0.98,
      },
      {
        id: 'uf-5',
        category: 'collection-update',
        severity: 'low',
        title: 'ansible.posix version bump recommended',
        description: 'While 1.5.4 is still compatible, version 1.6.0+ includes AAP 2.7 optimizations and bug fixes.',
        file: 'collections/requirements.yml',
        lineStart: 4,
        currentValue: 'ansible.posix: 1.5.4',
        suggestedValue: 'ansible.posix: 1.6.2',
        autoFixable: true,
        confidence: 0.99,
      },
      {
        id: 'uf-6',
        category: 'python-dependency',
        severity: 'medium',
        title: 'cryptography package requires update',
        description: 'AAP 2.7 requires cryptography >= 42.0.0 due to OpenSSL 3.x requirements. Current version 41.0.7 is incompatible.',
        file: 'execution-environment.yml',
        lineStart: 9,
        currentValue: 'cryptography==41.0.7',
        suggestedValue: 'cryptography>=42.0.0',
        autoFixable: true,
        confidence: 0.95,
      },
      {
        id: 'uf-7',
        category: 'removed-feature',
        severity: 'critical',
        title: 'Callback plugin whitelist format changed',
        description: 'The callback_whitelist config option was renamed to callbacks_enabled in ansible-core 2.15 and removed in 2.17. Update ansible.cfg accordingly.',
        file: 'ansible.cfg',
        lineStart: 3,
        currentValue: 'callback_whitelist = profile_tasks',
        suggestedValue: 'callbacks_enabled = profile_tasks',
        autoFixable: true,
        confidence: 0.97,
      },
      {
        id: 'uf-8',
        category: 'removed-feature',
        severity: 'high',
        title: 'Python 2 shebang lines detected',
        description: 'AAP 2.6+ does not support Python 2. Update shebang lines and ensure all custom modules use Python 3 compatible syntax.',
        file: 'library/custom_facts.py',
        lineStart: 1,
        currentValue: '#!/usr/bin/python',
        suggestedValue: '#!/usr/bin/python3',
        autoFixable: false,
        confidence: 0,
      },
      {
        id: 'uf-9',
        category: 'changed-parameter',
        severity: 'low',
        title: 'async_status retry behavior changed',
        description: 'The retries parameter default changed from 3 to 1 in AAP 2.6. Explicitly set retries if your playbook depends on the old default.',
        file: 'tasks/patch-apply.yml',
        lineStart: 42,
        currentValue: 'Implicit retries: 3',
        suggestedValue: 'retries: 3',
        autoFixable: true,
        confidence: 0.88,
      },
    ],
    summary: {
      total: 9,
      autoFixable: 8,
      manualReview: 1,
      breakingChanges: 3,
    },
  },
  'backup-automation': {
    currentVersion: '2.4',
    latestVersion: '2.7',
    findings: [],
    summary: { total: 12, autoFixable: 9, manualReview: 3, breakingChanges: 2 },
  },
  'network-firewall-rules': {
    currentVersion: '2.5',
    latestVersion: '2.7',
    findings: [],
    summary: { total: 5, autoFixable: 4, manualReview: 1, breakingChanges: 1 },
  },
};

export function getProjectUpgradeData(projectName: string): AapUpgradeData | null {
  return UPGRADE_DATA[projectName] ?? null;
}

export function getProjectAapVersion(projectName: string): string | undefined {
  return UPGRADE_DATA[projectName]?.currentVersion;
}
