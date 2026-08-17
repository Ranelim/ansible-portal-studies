export type SeverityClass = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ViolationCategory = 'lint' | 'aap-compatibility' | 'security' | 'best-practice';

export type QualityViolation = {
  ruleId: string;
  message: string;
  ruleDescription: string;
  file: string;
  lineStart: number;
  severity: SeverityClass;
  fixTier: 'deterministic' | 'ai' | 'manual';
  category: ViolationCategory;
  scope: 'task' | 'play' | 'role' | 'playbook' | 'collection' | 'block' | 'inventory';
  validatorSource: 'native' | 'opa' | 'ansible' | 'gitleaks' | 'dep_audit' | 'collection_health';
  yamlPath?: string;
  aiReason?: string;
  aiSuggestion?: string;
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

export type ScanRemediationOutcome =
  | 'none'
  | 'in-progress'
  | 'suggestions-ready'
  | 'pr-open'
  | 'pr-merged';

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
  scanSource: 'github-action' | 'manual';
  trigger?: 'push' | 'pull_request' | 'schedule' | 'manual';
  ciRunUrl?: string;
  ciRunId?: string;
  remainingViolations?: number;
  remainingSeverity?: Record<SeverityClass, number>;
  remediationOutcome?: ScanRemediationOutcome;
  prUrl?: string;
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

export type RemediationStatus =
  | 'none'
  | 'available'
  | 'in-progress'
  | 'proposals-ready'
  | 'pr-open'
  | 'pr-merged';

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
  remediationStatus: RemediationStatus;
  remediationPrUrl?: string;
  remediationBranch?: string;
  remediationSummary?: {
    addressed: number;
    remaining: number;
    autoFixed: number;
    aiProposed: number;
  };
};

const QUALITY_DATA: Record<string, ProjectQualityData> = {
  'rhel-patching': {
    healthScore: 68,
    totalViolations: 12,
    lastScannedAt: '2 hours ago',
    lastScannedCommit: 'a3f1b2c',
    scanCount: 14,
    severityBreakdown: { critical: 1, high: 3, medium: 5, low: 2, info: 1 },
    trend: [
      { scanIndex: 1, totalViolations: 18, fixable: 12 },
      { scanIndex: 2, totalViolations: 15, fixable: 10 },
      { scanIndex: 3, totalViolations: 12, fixable: 8 },
      { scanIndex: 4, totalViolations: 10, fixable: 7 },
      { scanIndex: 5, totalViolations: 7, fixable: 5 },
    ],
    remediationStatus: 'available',
    latestScan: {
      scanId: 'scan-rhel-014',
      scanType: 'check',
      createdAt: '2 hours ago',
      totalViolations: 12,
      fixable: 10,
      aiCandidates: 3,
      aiAccepted: 0,
      aiDeclined: 0,
      manualReview: 2,
      remediatedCount: 0,
      severityBreakdown: { critical: 1, high: 3, medium: 5, low: 2, info: 1 },
      commitHash: 'a3f1b2c',
      scanSource: 'github-action',
      trigger: 'push',
      ciRunUrl: 'https://github.com/acme-corp/rhel-patching/actions/runs/9841',
      ciRunId: 'Quality Scan #287',
    },
    scanHistory: [
      {
        scanId: 'scan-rhel-014', scanType: 'check', createdAt: 'May 25, 2026 10:22',
        totalViolations: 12, fixable: 10, aiCandidates: 3, aiAccepted: 0, aiDeclined: 0,
        manualReview: 2, remediatedCount: 0,
        severityBreakdown: { critical: 1, high: 3, medium: 5, low: 2, info: 1 },
        commitHash: 'a3f1b2c', scanSource: 'github-action', trigger: 'push',
        ciRunUrl: 'https://github.com/acme-corp/rhel-patching/actions/runs/9841',
        ciRunId: 'Quality Scan #287',
        remainingViolations: 12,
        remainingSeverity: { critical: 1, high: 3, medium: 5, low: 2, info: 1 },
        remediationOutcome: 'none',
      },
      {
        scanId: 'scan-rhel-013', scanType: 'check', createdAt: 'May 23, 2026 14:05',
        totalViolations: 10, fixable: 7, aiCandidates: 4, aiAccepted: 0, aiDeclined: 0,
        manualReview: 3, remediatedCount: 5,
        severityBreakdown: { critical: 0, high: 2, medium: 4, low: 3, info: 1 },
        commitHash: 'f8e2d1a', scanSource: 'github-action', trigger: 'pull_request',
        ciRunId: 'Quality Scan #285',
        remainingViolations: 5,
        remainingSeverity: { critical: 0, high: 1, medium: 2, low: 1, info: 1 },
        remediationOutcome: 'pr-merged',
        prUrl: 'https://github.com/acme-corp/rhel-patching/pull/42',
      },
      {
        scanId: 'scan-rhel-012', scanType: 'check', createdAt: 'May 21, 2026 09:15',
        totalViolations: 12, fixable: 8, aiCandidates: 5, aiAccepted: 0, aiDeclined: 0,
        manualReview: 3, remediatedCount: 8,
        severityBreakdown: { critical: 1, high: 2, medium: 5, low: 3, info: 1 },
        commitHash: 'c4b3a9f', scanSource: 'github-action', trigger: 'push',
        ciRunId: 'Quality Scan #280',
        remainingViolations: 4,
        remainingSeverity: { critical: 0, high: 0, medium: 2, low: 1, info: 1 },
        remediationOutcome: 'pr-merged',
        prUrl: 'https://github.com/acme-corp/rhel-patching/pull/38',
      },
      {
        scanId: 'scan-rhel-011', scanType: 'check', createdAt: 'May 19, 2026 16:30',
        totalViolations: 15, fixable: 10, aiCandidates: 6, aiAccepted: 0, aiDeclined: 0,
        manualReview: 5, remediatedCount: 0,
        severityBreakdown: { critical: 1, high: 3, medium: 6, low: 4, info: 1 },
        commitHash: 'b2a7e3d', scanSource: 'github-action', trigger: 'schedule',
        ciRunId: 'Quality Scan #275',
        remainingViolations: 15,
        remainingSeverity: { critical: 1, high: 3, medium: 6, low: 4, info: 1 },
        remediationOutcome: 'none',
      },
      {
        scanId: 'scan-rhel-010', scanType: 'check', createdAt: 'May 16, 2026 11:00',
        totalViolations: 18, fixable: 12, aiCandidates: 7, aiAccepted: 0, aiDeclined: 0,
        manualReview: 5, remediatedCount: 12,
        severityBreakdown: { critical: 2, high: 4, medium: 6, low: 4, info: 2 },
        commitHash: 'e1d5c8b', scanSource: 'github-action', trigger: 'push',
        ciRunId: 'Quality Scan #268',
        remainingViolations: 0,
        remainingSeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        remediationOutcome: 'pr-merged',
        prUrl: 'https://github.com/acme-corp/rhel-patching/pull/31',
      },
    ],
    violations: [
      { ruleId: 'fqcn[action-core]', message: 'Use FQCN for builtin module actions', ruleDescription: 'Module actions should use fully qualified collection name (FQCN) format', file: 'tasks/main.yml', lineStart: 12, severity: 'medium', fixTier: 'deterministic', category: 'lint', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/main.yml/plays[0]/tasks[1]' },
      { ruleId: 'yaml[truthy]', message: 'Truthy value should be one of [false, true]', ruleDescription: 'Truthy and falsy values should use consistent YAML boolean format', file: 'defaults/main.yml', lineStart: 8, severity: 'low', fixTier: 'deterministic', category: 'lint', scope: 'play', validatorSource: 'native', yamlPath: 'defaults/main.yml' },
      { ruleId: 'risky-file-permissions', message: 'File permissions unset or incorrect', ruleDescription: 'File tasks should specify explicit permissions to prevent security issues', file: 'tasks/patch-apply.yml', lineStart: 34, severity: 'high', fixTier: 'ai', category: 'security', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/patch-apply.yml/plays[0]/tasks[3]' },
      { ruleId: 'no-changed-when', message: 'Commands should not change things if nothing needs doing', ruleDescription: 'Tasks that run shell or command modules should use changed_when to indicate when changes occur', file: 'tasks/pre-check.yml', lineStart: 22, severity: 'medium', fixTier: 'ai', category: 'lint', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/pre-check.yml/plays[0]/tasks[2]' },
      { ruleId: 'name[missing]', message: 'All tasks should be named', ruleDescription: 'All tasks should have a descriptive name for readability and troubleshooting', file: 'tasks/rollback.yml', lineStart: 5, severity: 'medium', fixTier: 'deterministic', category: 'best-practice', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/rollback.yml/plays[0]/tasks[0]' },
      { ruleId: 'deprecated-module', message: 'Module is deprecated, use the replacement', ruleDescription: 'Deprecated modules will be removed in a future ansible-core version', file: 'tasks/report.yml', lineStart: 18, severity: 'low', fixTier: 'manual', category: 'lint', scope: 'task', validatorSource: 'ansible', yamlPath: 'tasks/report.yml/plays[0]/tasks[1]', aiReason: 'Complex parameter usage requires manual verification of replacement module compatibility', aiSuggestion: 'Replace ansible.builtin.yum with ansible.builtin.dnf. Verify parameter compatibility before applying.' },
      { ruleId: 'meta-no-info', message: 'Role metadata should contain relevant info', ruleDescription: 'Role meta/main.yml should include author, description, license, and supported platforms', file: 'meta/main.yml', lineStart: 3, severity: 'info', fixTier: 'manual', category: 'best-practice', scope: 'role', validatorSource: 'native', yamlPath: 'meta/main.yml' },
      { ruleId: 'aap-deprecated-module', message: 'ansible.builtin.yum is deprecated in AAP 2.5+ — use ansible.builtin.dnf', ruleDescription: 'The yum module is deprecated for ansible-core 2.17+. Use ansible.builtin.dnf as the drop-in replacement.', file: 'tasks/patch-apply.yml', lineStart: 14, severity: 'high', fixTier: 'deterministic', category: 'aap-compatibility', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/patch-apply.yml/plays[0]/tasks[1]' },
      { ruleId: 'aap-removed-param', message: 'warn parameter removed in ansible-core 2.17 (AAP 2.7)', ruleDescription: 'The warn parameter was removed from command/shell modules in ansible-core 2.17', file: 'tasks/pre-check.yml', lineStart: 8, severity: 'medium', fixTier: 'deterministic', category: 'aap-compatibility', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/pre-check.yml/plays[0]/tasks[0]' },
      { ruleId: 'aap-deprecated-syntax', message: 'with_items is deprecated — use loop for AAP 2.5+ compatibility', ruleDescription: 'The with_* loop syntax is deprecated in favor of the loop keyword with appropriate filters', file: 'tasks/main.yml', lineStart: 22, severity: 'high', fixTier: 'deterministic', category: 'aap-compatibility', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/main.yml/plays[0]/tasks[3]' },
      { ruleId: 'aap-collection-update', message: 'community.general 7.5.0 unsupported in AAP 2.7 — update to >= 8.0.0', ruleDescription: 'Collection version is incompatible with the target ansible-core version', file: 'collections/requirements.yml', lineStart: 6, severity: 'medium', fixTier: 'deterministic', category: 'aap-compatibility', scope: 'collection', validatorSource: 'collection_health', yamlPath: 'collections/requirements.yml' },
      { ruleId: 'aap-removed-config', message: 'callback_whitelist renamed to callbacks_enabled (removed in ansible-core 2.17)', ruleDescription: 'Configuration key was renamed in ansible-core 2.17. The old name is no longer recognized.', file: 'ansible.cfg', lineStart: 3, severity: 'critical', fixTier: 'deterministic', category: 'aap-compatibility', scope: 'playbook', validatorSource: 'native', yamlPath: 'ansible.cfg' },
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
    remediationStatus: 'pr-open',
    remediationPrUrl: 'https://github.com/acme-corp/network-firewall-rules/pull/15',
    remediationBranch: 'apme/remediate-008',
    remediationSummary: { addressed: 9, remaining: 5, autoFixed: 6, aiProposed: 3 },
    latestScan: {
      scanId: 'scan-net-008',
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
      scanSource: 'github-action',
      trigger: 'push',
      ciRunId: 'Quality Scan #54',
    },
    scanHistory: [
      {
        scanId: 'scan-net-008', scanType: 'check', createdAt: 'May 24, 2026 08:15',
        totalViolations: 14, fixable: 9, aiCandidates: 5, aiAccepted: 0, aiDeclined: 0,
        manualReview: 5, remediatedCount: 9,
        severityBreakdown: { critical: 1, high: 3, medium: 5, low: 4, info: 1 },
        commitHash: 'e7d2f1a', scanSource: 'github-action', trigger: 'push',
        ciRunId: 'Quality Scan #54',
        remainingViolations: 5,
        remainingSeverity: { critical: 0, high: 1, medium: 2, low: 1, info: 1 },
        remediationOutcome: 'pr-open',
        prUrl: 'https://github.com/acme-corp/network-firewall-rules/pull/15',
      },
      {
        scanId: 'scan-net-007', scanType: 'check', createdAt: 'May 22, 2026 16:40',
        totalViolations: 18, fixable: 11, aiCandidates: 6, aiAccepted: 0, aiDeclined: 0,
        manualReview: 7, remediatedCount: 11,
        severityBreakdown: { critical: 1, high: 4, medium: 6, low: 5, info: 2 },
        commitHash: 'd3b8e1c', scanSource: 'github-action', trigger: 'schedule',
        ciRunId: 'Quality Scan #51',
        remainingViolations: 0,
        remainingSeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        remediationOutcome: 'pr-merged',
        prUrl: 'https://github.com/acme-corp/network-firewall-rules/pull/12',
      },
    ],
    violations: [
      { ruleId: 'fqcn[action-core]', message: 'Use FQCN for builtin module actions', ruleDescription: 'Module actions should use fully qualified collection name (FQCN) format', file: 'tasks/apply-rules.yml', lineStart: 8, severity: 'medium', fixTier: 'deterministic', category: 'lint', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/apply-rules.yml/plays[0]/tasks[0]' },
      { ruleId: 'fqcn[action-core]', message: 'Use FQCN for builtin module actions', ruleDescription: 'Module actions should use fully qualified collection name (FQCN) format', file: 'tasks/validate-rules.yml', lineStart: 15, severity: 'medium', fixTier: 'deterministic', category: 'lint', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/validate-rules.yml/plays[0]/tasks[1]' },
      { ruleId: 'risky-file-permissions', message: 'File permissions unset or incorrect', ruleDescription: 'File tasks should specify explicit permissions to prevent security issues', file: 'tasks/apply-rules.yml', lineStart: 22, severity: 'high', fixTier: 'ai', category: 'security', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/apply-rules.yml/plays[0]/tasks[2]' },
      { ruleId: 'no-changed-when', message: 'Commands should not change things if nothing needs doing', file: 'tasks/validate-rules.yml', lineStart: 31, severity: 'medium', fixTier: 'ai', category: 'lint' },
      { ruleId: 'name[missing]', message: 'All tasks should be named', file: 'tasks/rollback.yml', lineStart: 3, severity: 'medium', fixTier: 'deterministic', category: 'best-practice' },
      { ruleId: 'name[missing]', message: 'All tasks should be named', file: 'tasks/rollback.yml', lineStart: 12, severity: 'medium', fixTier: 'deterministic', category: 'best-practice' },
      { ruleId: 'yaml[truthy]', message: 'Truthy value should be one of [false, true]', file: 'defaults/main.yml', lineStart: 5, severity: 'low', fixTier: 'deterministic', category: 'lint' },
      { ruleId: 'yaml[truthy]', message: 'Truthy value should be one of [false, true]', file: 'defaults/main.yml', lineStart: 12, severity: 'low', fixTier: 'deterministic', category: 'lint' },
      { ruleId: 'aap-deprecated-module', message: 'paloalto.panos.panos_security_rule deprecated in collection 3.0 — use paloalto.panos.panos_security_policy', file: 'tasks/apply-rules.yml', lineStart: 35, severity: 'high', fixTier: 'deterministic', category: 'aap-compatibility' },
      { ruleId: 'aap-collection-update', message: 'paloalto.panos 2.19.0 has known issues — update to >= 3.0.0', file: 'collections/requirements.yml', lineStart: 2, severity: 'high', fixTier: 'deterministic', category: 'aap-compatibility' },
      { ruleId: 'aap-removed-config', message: 'callback_whitelist renamed to callbacks_enabled (removed in ansible-core 2.17)', file: 'ansible.cfg', lineStart: 4, severity: 'critical', fixTier: 'deterministic', category: 'aap-compatibility' },
      { ruleId: 'deprecated-module', message: 'Module ansible.netcommon.net_ping is deprecated — use vendor-specific ping module', file: 'tasks/validate-rules.yml', lineStart: 44, severity: 'low', fixTier: 'manual', category: 'lint' },
      { ruleId: 'no-jinja-when', message: 'Jinja2 templates should not be used in when conditions', file: 'tasks/apply-rules.yml', lineStart: 48, severity: 'low', fixTier: 'deterministic', category: 'lint' },
      { ruleId: 'meta-no-info', message: 'Role metadata should contain relevant info', file: 'meta/main.yml', lineStart: 3, severity: 'info', fixTier: 'manual', category: 'best-practice' },
    ],
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
    remediationStatus: 'in-progress',
    remediationSummary: { addressed: 0, remaining: 3, autoFixed: 0, aiProposed: 0 },
    latestScan: {
      scanId: 'scan-cloud-022',
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
      scanSource: 'github-action',
      trigger: 'push',
      ciRunId: 'Quality Scan #102',
    },
    scanHistory: [
      {
        scanId: 'scan-cloud-022', scanType: 'check', createdAt: 'May 25, 2026 14:30',
        totalViolations: 3, fixable: 2, aiCandidates: 1, aiAccepted: 0, aiDeclined: 0,
        manualReview: 1, remediatedCount: 0,
        severityBreakdown: { critical: 0, high: 0, medium: 1, low: 1, info: 1 },
        commitHash: 'b4f9c2d', scanSource: 'github-action', trigger: 'push',
        ciRunId: 'Quality Scan #102',
      },
    ],
    violations: [
      { ruleId: 'yaml[truthy]', message: 'Truthy value should be one of [false, true]', ruleDescription: 'Truthy and falsy values should use consistent YAML boolean format', file: 'defaults/main.yml', lineStart: 3, severity: 'low', fixTier: 'deterministic', category: 'lint', scope: 'play', validatorSource: 'native', yamlPath: 'defaults/main.yml' },
      { ruleId: 'no-changed-when', message: 'Commands should not change things if nothing needs doing', ruleDescription: 'Tasks that run shell or command modules should use changed_when to indicate when changes occur', file: 'tasks/provision-ec2.yml', lineStart: 18, severity: 'medium', fixTier: 'ai', category: 'lint', scope: 'task', validatorSource: 'native', yamlPath: 'tasks/provision-ec2.yml/plays[0]/tasks[2]' },
      { ruleId: 'meta-no-info', message: 'Role metadata should contain relevant info', ruleDescription: 'Role meta/main.yml should include author, description, license, and supported platforms', file: 'meta/main.yml', lineStart: 3, severity: 'info', fixTier: 'manual', category: 'best-practice', scope: 'role', validatorSource: 'native', yamlPath: 'meta/main.yml' },
    ],
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
    remediationStatus: 'proposals-ready',
    remediationBranch: 'apme/remediate-005',
    remediationSummary: { addressed: 12, remaining: 9, autoFixed: 8, aiProposed: 4 },
    latestScan: {
      scanId: 'scan-bak-005',
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
      scanSource: 'github-action',
      trigger: 'schedule',
      ciRunId: 'Quality Scan #19',
    },
    scanHistory: [
      {
        scanId: 'scan-bak-005', scanType: 'check', createdAt: 'May 22, 2026 06:00',
        totalViolations: 21, fixable: 12, aiCandidates: 6, aiAccepted: 0, aiDeclined: 0,
        manualReview: 9, remediatedCount: 0,
        severityBreakdown: { critical: 2, high: 5, medium: 8, low: 4, info: 2 },
        commitHash: 'c1d8e3f', scanSource: 'github-action', trigger: 'schedule',
        ciRunId: 'Quality Scan #19',
      },
    ],
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

export function getProjectRemediationStatus(repoName: string): RemediationStatus | undefined {
  return QUALITY_DATA[repoName]?.remediationStatus;
}

export function getProjectCompatibilityCount(repoName: string): number {
  const data = QUALITY_DATA[repoName];
  if (!data) return 0;
  return data.violations.filter(v => v.category === 'aap-compatibility').length;
}

export function getProjectTargetVersion(repoName: string): string | undefined {
  return QUALITY_DATA[repoName]?.ansibleCoreVersion;
}

export type FleetViolationRule = {
  ruleId: string;
  message: string;
  severity: SeverityClass;
  category: ViolationCategory;
  repos: { name: string; count: number; fixTier: QualityViolation['fixTier']; lastScannedAt?: string }[];
  totalCount: number;
};

export type FleetViolationCategory = {
  category: ViolationCategory;
  label: string;
  totalViolations: number;
  reposAffected: number;
  rules: FleetViolationRule[];
};

export function getFleetViolationData(): {
  categories: FleetViolationCategory[];
  totalViolations: number;
  totalRepos: number;
  reposWithIssues: number;
  bySeverity: Record<SeverityClass, number>;
} {
  const ruleMap = new Map<string, FleetViolationRule>();
  const allRepoNames = new Set<string>();
  const reposWithViolations = new Set<string>();

  for (const [repoName, data] of Object.entries(QUALITY_DATA)) {
    allRepoNames.add(repoName);
    if (data.violations.length === 0 && data.totalViolations > 0) {
      // Has violations but not detailed — use severity breakdown
      reposWithViolations.add(repoName);
      continue;
    }
    for (const v of data.violations) {
      reposWithViolations.add(repoName);
      const existing = ruleMap.get(v.ruleId);
      if (existing) {
        const repoEntry = existing.repos.find(r => r.name === repoName);
        if (repoEntry) {
          repoEntry.count++;
        } else {
          existing.repos.push({ name: repoName, count: 1, fixTier: v.fixTier, lastScannedAt: data.lastScannedAt });
        }
        existing.totalCount++;
      } else {
        ruleMap.set(v.ruleId, {
          ruleId: v.ruleId,
          message: v.message,
          severity: v.severity,
          category: v.category,
          repos: [{ name: repoName, count: 1, fixTier: v.fixTier, lastScannedAt: data.lastScannedAt }],
          totalCount: 1,
        });
      }
    }
  }

  const categoryOrder: ViolationCategory[] = ['aap-compatibility', 'security', 'lint', 'best-practice'];
  const categoryLabels: Record<ViolationCategory, string> = {
    'aap-compatibility': 'AAP compatibility',
    'security': 'Security',
    'lint': 'Lint',
    'best-practice': 'Best practice',
  };
  const sevOrder: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];

  const categories: FleetViolationCategory[] = categoryOrder.map(cat => {
    const rules = Array.from(ruleMap.values())
      .filter(r => r.category === cat)
      .sort((a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity));
    const repoSet = new Set<string>();
    rules.forEach(r => r.repos.forEach(repo => repoSet.add(repo.name)));
    return {
      category: cat,
      label: categoryLabels[cat],
      totalViolations: rules.reduce((sum, r) => sum + r.totalCount, 0),
      reposAffected: repoSet.size,
      rules,
    };
  }).filter(c => c.totalViolations > 0);

  const bySeverity: Record<SeverityClass, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const r of ruleMap.values()) {
    bySeverity[r.severity] += r.totalCount;
  }

  // Add repos that have totalViolations but no detailed violations
  let totalViolations = Array.from(ruleMap.values()).reduce((s, r) => s + r.totalCount, 0);
  for (const [repoName, data] of Object.entries(QUALITY_DATA)) {
    if (data.violations.length === 0 && data.totalViolations > 0) {
      totalViolations += data.totalViolations;
      for (const sev of sevOrder) {
        bySeverity[sev] += data.severityBreakdown[sev];
      }
    }
  }

  return {
    categories,
    totalViolations,
    totalRepos: allRepoNames.size,
    reposWithIssues: reposWithViolations.size,
    bySeverity,
  };
}

export const SEVERITY_COLORS: Record<SeverityClass, string> = {
  critical: '#A30000',
  high: '#C9190B',
  medium: '#F0AB00',
  low: '#3E8635',
  info: '#6A6E73',
};

export type PipelineStep = {
  label: string;
  status: 'done' | 'active' | 'pending';
  detail?: string;
};

export type WorkflowStatus =
  | 'not-scanned'
  | 'scanning'
  | 'clean'
  | 'has-violations'
  | 'remediation-available'
  | 'remediation-in-review'
  | 'remaining';

export type FleetQualityRow = {
  repoName: string;
  workflowStatus: WorkflowStatus;
  statusLabel: string;
  issuesCount: number;
  fixableCount: number;
  manualCount: number;
  remainingCount: number;
  highestSeverity: SeverityClass | null;
  severityBreakdown: Record<SeverityClass, number>;
  lastScannedAt: string;
  lastScannedCommit: string;
  pipeline: PipelineStep[];
};

export function getFleetQualityData(): FleetQualityRow[] {
  const scenarios: Record<string, { status: WorkflowStatus; label: string; remaining: number; pipeline: PipelineStep[] }> = {
    'rhel-patching': {
      status: 'remediation-in-review',
      label: '10 addressed · review in IDE',
      remaining: 2,
      pipeline: [
        { label: 'Scanned', status: 'done', detail: '2 hours ago · push · commit a3f1b2c' },
        { label: '12 violations found', status: 'done', detail: '1 critical · 3 high · 5 medium' },
        { label: '10 addressed (8 auto + 2 AI)', status: 'done', detail: 'PR #42 open for review' },
        { label: 'Review PR', status: 'active', detail: '2 remaining need manual fix' },
      ],
    },
    'network-firewall-rules': {
      status: 'has-violations',
      label: '14 violations found',
      remaining: 14,
      pipeline: [
        { label: 'Scanned', status: 'done', detail: '1 day ago · push · commit e7d2f1a' },
        { label: '14 violations found', status: 'active', detail: '1 critical · 3 high · 5 medium' },
        { label: 'Suggest fixes', status: 'pending', detail: '9 auto-fixable · 5 manual' },
        { label: 'Review PR', status: 'pending' },
      ],
    },
    'cloud-provisioner': {
      status: 'has-violations',
      label: '3 minor issues',
      remaining: 3,
      pipeline: [
        { label: 'Scanned', status: 'done', detail: '4 hours ago · push · commit b4f9c2d' },
        { label: '3 violations found', status: 'active', detail: '1 medium · 1 low · 1 info' },
        { label: 'Suggest fixes', status: 'pending', detail: '2 auto-fixable · 1 manual' },
      ],
    },
    'backup-automation': {
      status: 'remaining',
      label: '21 violations · needs attention',
      remaining: 21,
      pipeline: [
        { label: 'Scanned', status: 'done', detail: '3 days ago · scheduled · commit c1d8e3f' },
        { label: '21 violations found', status: 'active', detail: '2 critical · 5 high · 8 medium' },
        { label: 'Suggest fixes', status: 'pending', detail: '12 auto-fixable · 9 manual' },
        { label: 'Review PR', status: 'pending' },
      ],
    },
  };

  return Object.entries(QUALITY_DATA).map(([name, data]) => {
    const scenario = scenarios[name];
    const highest: SeverityClass | null = data.totalViolations === 0 ? null
      : data.severityBreakdown.critical > 0 ? 'critical'
      : data.severityBreakdown.high > 0 ? 'high'
      : data.severityBreakdown.medium > 0 ? 'medium'
      : 'low';

    return {
      repoName: name,
      workflowStatus: scenario?.status ?? 'not-scanned',
      statusLabel: scenario?.label ?? 'Not scanned',
      issuesCount: data.totalViolations,
      fixableCount: data.latestScan.fixable,
      manualCount: data.latestScan.manualReview,
      remainingCount: scenario?.remaining ?? data.totalViolations,
      highestSeverity: highest,
      severityBreakdown: data.severityBreakdown,
      lastScannedAt: data.lastScannedAt,
      lastScannedCommit: data.lastScannedCommit,
      pipeline: scenario?.pipeline ?? [
        { label: 'Scan', status: 'pending' },
        { label: 'Results', status: 'pending' },
        { label: 'Review in IDE', status: 'pending' },
      ],
    };
  });
}

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
