export type ComplianceFramework = 'DISA STIG' | 'PCI-DSS' | 'CIS' | 'NIST 800-53';

export type StigSeverity = 'CAT I' | 'CAT II' | 'CAT III';

export type ProfileStatus =
  | 'not-scanned'
  | 'assessed'
  | 'remediation-in-progress'
  | 'verification-pending'
  | 'verified';

export type ScanType = 'assessment' | 'remediation' | 'verification';

export type ScanStatus = 'running' | 'completed' | 'failed';

export type HostResult = {
  hostname: string;
  status: 'pass' | 'fail' | 'error' | 'notapplicable';
  expected?: string;
  actual?: string;
};

export type ComplianceRule = {
  ruleId: string;
  title: string;
  severity: StigSeverity;
  category: string;
  description: string;
  hostResults: HostResult[];
  passCount: number;
  failCount: number;
  totalHosts: number;
};

export type ComplianceScan = {
  scanId: string;
  profileId: string;
  profileName: string;
  inventoryName: string;
  scanType: ScanType;
  status: ScanStatus;
  triggeredBy: 'scheduled' | 'manual';
  startedAt: string;
  duration: string;
  complianceScore: number | null;
  rulesEvaluated: number;
  rulesFailing: number;
  hostsScanned: number;
};

export type ComplianceProfile = {
  id: string;
  name: string;
  framework: ComplianceFramework;
  frameworkVersion: string;
  inventoryName: string;
  hostCount: number;
  lastAssessedAt: string | null;
  complianceScore: number | null;
  previousScore: number | null;
  trend: number | null;
  status: ProfileStatus;
  rulesEvaluated: number;
  rulesFailing: number;
  scoreHistory: { date: string; score: number }[];
};

// ---------------------------------------------------------------------------
// Hosts
// ---------------------------------------------------------------------------

const PROD_RHEL_HOSTS = [
  'prod-web-01', 'prod-web-02', 'prod-web-03', 'prod-web-04',
  'prod-app-01', 'prod-app-02', 'prod-app-03',
  'prod-db-01', 'prod-db-02',
  'prod-cache-01',
];

const STAGING_HOSTS = [
  'stg-web-01', 'stg-web-02',
  'stg-app-01', 'stg-app-02',
  'stg-db-01',
];

const NETWORK_HOSTS = [
  'core-sw-01', 'core-sw-02',
  'dist-sw-01', 'dist-sw-02', 'dist-sw-03',
  'fw-01', 'fw-02',
];

const DMZ_HOSTS = [
  'dmz-proxy-01', 'dmz-proxy-02',
  'dmz-web-01', 'dmz-web-02', 'dmz-web-03',
  'dmz-ids-01',
];

// ---------------------------------------------------------------------------
// Helper: generate host results for a rule
// ---------------------------------------------------------------------------

function makeHostResults(
  hosts: string[],
  failRate: number,
  expected?: string,
  actual?: string,
): HostResult[] {
  const failCount = Math.round(hosts.length * failRate);
  return hosts.map((hostname, i) => ({
    hostname,
    status: i < failCount ? 'fail' as const : 'pass' as const,
    ...(i < failCount && expected ? { expected, actual } : {}),
  }));
}

// ---------------------------------------------------------------------------
// Findings per profile
// ---------------------------------------------------------------------------

const PROD_STIG_RULES: ComplianceRule[] = [
  {
    ruleId: 'RHEL-09-211010',
    title: 'Ensure SSH root login is disabled',
    severity: 'CAT I',
    category: 'Access Control',
    description: 'SSH must be configured to prevent root login to reduce the attack surface.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.3, 'PermitRootLogin no', 'PermitRootLogin yes'),
    passCount: 7, failCount: 3, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-211045',
    title: 'Ensure audit log storage size is configured',
    severity: 'CAT I',
    category: 'Audit and Accountability',
    description: 'The audit system must be configured to allocate sufficient storage for audit log data.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.2, 'max_log_file = 8', 'max_log_file = 2'),
    passCount: 8, failCount: 2, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-231190',
    title: 'Ensure password minimum length is configured',
    severity: 'CAT II',
    category: 'Identification and Authentication',
    description: 'Password complexity must enforce a minimum length of 15 characters.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.5, 'minlen = 15', 'minlen = 8'),
    passCount: 5, failCount: 5, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-252070',
    title: 'Ensure FIPS mode is enabled',
    severity: 'CAT I',
    category: 'System and Communications Protection',
    description: 'FIPS 140-2/140-3 mode must be enabled for cryptographic operations.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.1, 'fips_enabled = 1', 'fips_enabled = 0'),
    passCount: 9, failCount: 1, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-271030',
    title: 'Ensure chrony is configured for time synchronization',
    severity: 'CAT II',
    category: 'Audit and Accountability',
    description: 'The system must use an authoritative time source for clock synchronization.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.4, 'server ntp.internal.corp', 'server not configured'),
    passCount: 6, failCount: 4, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-213015',
    title: 'Ensure firewalld is active and enabled',
    severity: 'CAT II',
    category: 'System and Communications Protection',
    description: 'The firewall service must be active to control network traffic.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.3, 'active (running)', 'inactive (dead)'),
    passCount: 7, failCount: 3, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-232010',
    title: 'Ensure accounts have password expiration',
    severity: 'CAT II',
    category: 'Identification and Authentication',
    description: 'User accounts must have a defined password expiration period of 60 days or less.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.2, 'PASS_MAX_DAYS 60', 'PASS_MAX_DAYS 99999'),
    passCount: 8, failCount: 2, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-291035',
    title: 'Ensure AIDE is installed for integrity checking',
    severity: 'CAT II',
    category: 'System and Information Integrity',
    description: 'Advanced Intrusion Detection Environment must be installed for file integrity verification.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.0),
    passCount: 10, failCount: 0, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-255015',
    title: 'Ensure SELinux is enforcing',
    severity: 'CAT I',
    category: 'Access Control',
    description: 'SELinux must be in enforcing mode to provide mandatory access control.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.0),
    passCount: 10, failCount: 0, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-672020',
    title: 'Ensure TMUX is used for session locking',
    severity: 'CAT III',
    category: 'Access Control',
    description: 'Terminal session locking must be enabled via tmux after 15 minutes of inactivity.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.6, 'lock-after-time 900', 'not configured'),
    passCount: 4, failCount: 6, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-411025',
    title: 'Ensure system-wide crypto policy is FIPS',
    severity: 'CAT II',
    category: 'System and Communications Protection',
    description: 'The system-wide cryptographic policy must be set to FIPS or stricter.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.1, 'FIPS', 'DEFAULT'),
    passCount: 9, failCount: 1, totalHosts: 10,
  },
  {
    ruleId: 'RHEL-09-653020',
    title: 'Ensure rsyslog is configured to send logs to central server',
    severity: 'CAT III',
    category: 'Audit and Accountability',
    description: 'System logs must be forwarded to a centralized log management server.',
    hostResults: makeHostResults(PROD_RHEL_HOSTS, 0.3, '*.* @@loghost.internal:514', 'not configured'),
    passCount: 7, failCount: 3, totalHosts: 10,
  },
];

const STAGING_PCI_RULES: ComplianceRule[] = [
  {
    ruleId: 'PCI-DSS-1.1.1',
    title: 'Ensure firewall and router configurations restrict connections',
    severity: 'CAT I',
    category: 'Network Security',
    description: 'Network firewalls must restrict inbound and outbound traffic to that which is necessary.',
    hostResults: makeHostResults(STAGING_HOSTS, 0.4, 'restrict enabled', 'open access'),
    passCount: 3, failCount: 2, totalHosts: 5,
  },
  {
    ruleId: 'PCI-DSS-2.2.1',
    title: 'Ensure only one primary function per server',
    severity: 'CAT II',
    category: 'Secure Configuration',
    description: 'Each server must implement only one primary function to reduce attack surface.',
    hostResults: makeHostResults(STAGING_HOSTS, 0.6, 'single-function', 'multi-function'),
    passCount: 2, failCount: 3, totalHosts: 5,
  },
  {
    ruleId: 'PCI-DSS-6.5.1',
    title: 'Ensure injection flaws are addressed',
    severity: 'CAT I',
    category: 'Application Security',
    description: 'Applications must be protected against injection flaws including SQL and OS command injection.',
    hostResults: makeHostResults(STAGING_HOSTS, 0.2, 'patched', 'vulnerable'),
    passCount: 4, failCount: 1, totalHosts: 5,
  },
  {
    ruleId: 'PCI-DSS-8.2.3',
    title: 'Ensure passwords require minimum complexity',
    severity: 'CAT II',
    category: 'Access Control',
    description: 'Passwords must require a minimum length of 12 characters with numeric and alphabetic characters.',
    hostResults: makeHostResults(STAGING_HOSTS, 0.4, 'minlen=12 complexity=on', 'minlen=8 complexity=off'),
    passCount: 3, failCount: 2, totalHosts: 5,
  },
  {
    ruleId: 'PCI-DSS-10.2.1',
    title: 'Ensure audit trails record all individual user access to cardholder data',
    severity: 'CAT I',
    category: 'Monitoring and Logging',
    description: 'Audit trails must capture all individual access to cardholder data environments.',
    hostResults: makeHostResults(STAGING_HOSTS, 0.0),
    passCount: 5, failCount: 0, totalHosts: 5,
  },
  {
    ruleId: 'PCI-DSS-11.5.1',
    title: 'Ensure file integrity monitoring is deployed',
    severity: 'CAT II',
    category: 'Monitoring and Logging',
    description: 'File integrity monitoring software must alert personnel to unauthorized modification of critical system files.',
    hostResults: makeHostResults(STAGING_HOSTS, 0.4, 'aide installed', 'aide not found'),
    passCount: 3, failCount: 2, totalHosts: 5,
  },
];

const NETWORK_CIS_RULES: ComplianceRule[] = [
  {
    ruleId: 'CIS-NET-1.1.1',
    title: 'Ensure management plane ACLs are configured',
    severity: 'CAT I',
    category: 'Management Plane',
    description: 'Access control lists must restrict management plane access to authorized networks.',
    hostResults: makeHostResults(NETWORK_HOSTS, 0.0),
    passCount: 7, failCount: 0, totalHosts: 7,
  },
  {
    ruleId: 'CIS-NET-2.2.1',
    title: 'Ensure NTP authentication is enabled',
    severity: 'CAT II',
    category: 'Services',
    description: 'NTP must use authentication to prevent time synchronization attacks.',
    hostResults: makeHostResults(NETWORK_HOSTS, 0.14, 'ntp authenticate', 'no ntp authenticate'),
    passCount: 6, failCount: 1, totalHosts: 7,
  },
  {
    ruleId: 'CIS-NET-3.1.1',
    title: 'Ensure logging to remote syslog server is configured',
    severity: 'CAT II',
    category: 'Logging',
    description: 'Network devices must send logs to a centralized syslog server.',
    hostResults: makeHostResults(NETWORK_HOSTS, 0.0),
    passCount: 7, failCount: 0, totalHosts: 7,
  },
  {
    ruleId: 'CIS-NET-4.1.3',
    title: 'Ensure SNMP community strings are not default',
    severity: 'CAT I',
    category: 'Services',
    description: 'Default SNMP community strings must be changed to prevent unauthorized access.',
    hostResults: makeHostResults(NETWORK_HOSTS, 0.0),
    passCount: 7, failCount: 0, totalHosts: 7,
  },
];

const DMZ_NIST_RULES: ComplianceRule[] = [
  {
    ruleId: 'NIST-AC-2',
    title: 'Ensure account management procedures are implemented',
    severity: 'CAT II',
    category: 'Access Control',
    description: 'Account creation, modification, disabling, and removal must follow documented procedures.',
    hostResults: makeHostResults(DMZ_HOSTS, 0.33, 'account policy enforced', 'no policy configured'),
    passCount: 4, failCount: 2, totalHosts: 6,
  },
  {
    ruleId: 'NIST-AU-3',
    title: 'Ensure audit record content includes required fields',
    severity: 'CAT II',
    category: 'Audit and Accountability',
    description: 'Audit records must contain information about the type, time, source, and outcome of events.',
    hostResults: makeHostResults(DMZ_HOSTS, 0.5, 'full audit fields', 'partial audit fields'),
    passCount: 3, failCount: 3, totalHosts: 6,
  },
  {
    ruleId: 'NIST-CM-6',
    title: 'Ensure configuration settings are established and documented',
    severity: 'CAT III',
    category: 'Configuration Management',
    description: 'Configuration baselines must be documented and enforced across the information system.',
    hostResults: makeHostResults(DMZ_HOSTS, 0.17, 'baseline applied', 'baseline missing'),
    passCount: 5, failCount: 1, totalHosts: 6,
  },
  {
    ruleId: 'NIST-IA-5',
    title: 'Ensure authenticator management is implemented',
    severity: 'CAT I',
    category: 'Identification and Authentication',
    description: 'Authenticators (passwords, tokens, certificates) must be managed per organizational policy.',
    hostResults: makeHostResults(DMZ_HOSTS, 0.33, 'managed authenticators', 'unmanaged'),
    passCount: 4, failCount: 2, totalHosts: 6,
  },
  {
    ruleId: 'NIST-SC-7',
    title: 'Ensure boundary protection mechanisms are in place',
    severity: 'CAT I',
    category: 'System and Communications Protection',
    description: 'Network boundary devices must monitor and control communications at managed interfaces.',
    hostResults: makeHostResults(DMZ_HOSTS, 0.17, 'boundary controls active', 'controls disabled'),
    passCount: 5, failCount: 1, totalHosts: 6,
  },
];

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export const COMPLIANCE_PROFILES: ComplianceProfile[] = [
  {
    id: 'prod-rhel-stig',
    name: 'Production RHEL — DISA STIG',
    framework: 'DISA STIG',
    frameworkVersion: 'V1R12',
    inventoryName: 'prod-rhel-servers',
    hostCount: 10,
    lastAssessedAt: '2 hours ago',
    complianceScore: 72,
    previousScore: 69,
    trend: 3,
    status: 'assessed',
    rulesEvaluated: 12,
    rulesFailing: 8,
    scoreHistory: [
      { date: 'May 1', score: 58 },
      { date: 'May 8', score: 62 },
      { date: 'May 15', score: 65 },
      { date: 'May 22', score: 69 },
      { date: 'May 29', score: 69 },
      { date: 'Jun 5', score: 72 },
    ],
  },
  {
    id: 'staging-pci',
    name: 'Staging — PCI-DSS',
    framework: 'PCI-DSS',
    frameworkVersion: 'v4.0',
    inventoryName: 'staging-all',
    hostCount: 5,
    lastAssessedAt: '1 day ago',
    complianceScore: 63,
    previousScore: 65,
    trend: -2,
    status: 'remediation-in-progress',
    rulesEvaluated: 6,
    rulesFailing: 4,
    scoreHistory: [
      { date: 'May 1', score: 55 },
      { date: 'May 8', score: 58 },
      { date: 'May 15', score: 61 },
      { date: 'May 22', score: 63 },
      { date: 'May 29', score: 65 },
      { date: 'Jun 5', score: 63 },
    ],
  },
  {
    id: 'network-cis',
    name: 'Network Infrastructure — CIS',
    framework: 'CIS',
    frameworkVersion: 'L1 v8.0',
    inventoryName: 'network-devices',
    hostCount: 7,
    lastAssessedAt: '3 days ago',
    complianceScore: 96,
    previousScore: 93,
    trend: 3,
    status: 'verified',
    rulesEvaluated: 4,
    rulesFailing: 1,
    scoreHistory: [
      { date: 'May 1', score: 82 },
      { date: 'May 8', score: 86 },
      { date: 'May 15', score: 89 },
      { date: 'May 22', score: 93 },
      { date: 'May 29', score: 93 },
      { date: 'Jun 5', score: 96 },
    ],
  },
  {
    id: 'dmz-nist',
    name: 'DMZ Perimeter — NIST 800-53',
    framework: 'NIST 800-53',
    frameworkVersion: 'Rev 5',
    inventoryName: 'dmz-hosts',
    hostCount: 6,
    lastAssessedAt: '5 days ago',
    complianceScore: 67,
    previousScore: null,
    trend: null,
    status: 'assessed',
    rulesEvaluated: 5,
    rulesFailing: 4,
    scoreHistory: [
      { date: 'Jun 3', score: 67 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Scan history (fleet-level)
// ---------------------------------------------------------------------------

export const COMPLIANCE_SCANS: ComplianceScan[] = [
  {
    scanId: 'scan-001', profileId: 'prod-rhel-stig', profileName: 'Production RHEL — DISA STIG',
    inventoryName: 'prod-rhel-servers', scanType: 'assessment', status: 'completed',
    triggeredBy: 'scheduled', startedAt: 'Jun 8, 2026 8:00 AM', duration: '4m 12s',
    complianceScore: 72, rulesEvaluated: 12, rulesFailing: 8, hostsScanned: 10,
  },
  {
    scanId: 'scan-002', profileId: 'staging-pci', profileName: 'Staging — PCI-DSS',
    inventoryName: 'staging-all', scanType: 'remediation', status: 'running',
    triggeredBy: 'manual', startedAt: 'Jun 7, 2026 3:15 PM', duration: '12m (in progress)',
    complianceScore: null, rulesEvaluated: 6, rulesFailing: 4, hostsScanned: 5,
  },
  {
    scanId: 'scan-003', profileId: 'staging-pci', profileName: 'Staging — PCI-DSS',
    inventoryName: 'staging-all', scanType: 'assessment', status: 'completed',
    triggeredBy: 'manual', startedAt: 'Jun 7, 2026 2:45 PM', duration: '2m 08s',
    complianceScore: 63, rulesEvaluated: 6, rulesFailing: 4, hostsScanned: 5,
  },
  {
    scanId: 'scan-004', profileId: 'network-cis', profileName: 'Network Infrastructure — CIS',
    inventoryName: 'network-devices', scanType: 'verification', status: 'completed',
    triggeredBy: 'manual', startedAt: 'Jun 5, 2026 11:30 AM', duration: '3m 45s',
    complianceScore: 96, rulesEvaluated: 4, rulesFailing: 1, hostsScanned: 7,
  },
  {
    scanId: 'scan-005', profileId: 'network-cis', profileName: 'Network Infrastructure — CIS',
    inventoryName: 'network-devices', scanType: 'remediation', status: 'completed',
    triggeredBy: 'manual', startedAt: 'Jun 5, 2026 10:45 AM', duration: '5m 20s',
    complianceScore: null, rulesEvaluated: 4, rulesFailing: 1, hostsScanned: 7,
  },
  {
    scanId: 'scan-006', profileId: 'network-cis', profileName: 'Network Infrastructure — CIS',
    inventoryName: 'network-devices', scanType: 'assessment', status: 'completed',
    triggeredBy: 'scheduled', startedAt: 'Jun 5, 2026 9:00 AM', duration: '3m 10s',
    complianceScore: 93, rulesEvaluated: 4, rulesFailing: 2, hostsScanned: 7,
  },
  {
    scanId: 'scan-007', profileId: 'prod-rhel-stig', profileName: 'Production RHEL — DISA STIG',
    inventoryName: 'prod-rhel-servers', scanType: 'assessment', status: 'completed',
    triggeredBy: 'scheduled', startedAt: 'Jun 1, 2026 8:00 AM', duration: '4m 05s',
    complianceScore: 69, rulesEvaluated: 12, rulesFailing: 9, hostsScanned: 10,
  },
  {
    scanId: 'scan-008', profileId: 'dmz-nist', profileName: 'DMZ Perimeter — NIST 800-53',
    inventoryName: 'dmz-hosts', scanType: 'assessment', status: 'completed',
    triggeredBy: 'manual', startedAt: 'Jun 3, 2026 2:00 PM', duration: '2m 55s',
    complianceScore: 67, rulesEvaluated: 5, rulesFailing: 4, hostsScanned: 6,
  },
  {
    scanId: 'scan-009', profileId: 'prod-rhel-stig', profileName: 'Production RHEL — DISA STIG',
    inventoryName: 'prod-rhel-servers', scanType: 'assessment', status: 'completed',
    triggeredBy: 'scheduled', startedAt: 'May 25, 2026 8:00 AM', duration: '3m 58s',
    complianceScore: 69, rulesEvaluated: 12, rulesFailing: 9, hostsScanned: 10,
  },
  {
    scanId: 'scan-010', profileId: 'staging-pci', profileName: 'Staging — PCI-DSS',
    inventoryName: 'staging-all', scanType: 'assessment', status: 'failed',
    triggeredBy: 'scheduled', startedAt: 'May 20, 2026 6:00 AM', duration: '0m 45s',
    complianceScore: null, rulesEvaluated: 0, rulesFailing: 0, hostsScanned: 0,
  },
];

// ---------------------------------------------------------------------------
// Findings keyed by profile ID
// ---------------------------------------------------------------------------

export const COMPLIANCE_FINDINGS: Record<string, ComplianceRule[]> = {
  'prod-rhel-stig': PROD_STIG_RULES,
  'staging-pci': STAGING_PCI_RULES,
  'network-cis': NETWORK_CIS_RULES,
  'dmz-nist': DMZ_NIST_RULES,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getProfile(id: string): ComplianceProfile | undefined {
  return COMPLIANCE_PROFILES.find(p => p.id === id);
}

export function getProfileScans(profileId: string): ComplianceScan[] {
  return COMPLIANCE_SCANS.filter(s => s.profileId === profileId);
}

export function getProfileFindings(profileId: string): ComplianceRule[] {
  return COMPLIANCE_FINDINGS[profileId] || [];
}

export function getFleetSummary() {
  const profiles = COMPLIANCE_PROFILES;
  const withScores = profiles.filter(p => p.complianceScore !== null);
  const avgScore = withScores.length
    ? Math.round(withScores.reduce((sum, p) => sum + (p.complianceScore ?? 0), 0) / withScores.length)
    : 0;
  const totalHosts = profiles.reduce((sum, p) => sum + p.hostCount, 0);
  const remediationsInProgress = profiles.filter(p => p.status === 'remediation-in-progress').length;

  return {
    totalProfiles: profiles.length,
    totalHosts,
    averageCompliance: avgScore,
    remediationsInProgress,
  };
}
