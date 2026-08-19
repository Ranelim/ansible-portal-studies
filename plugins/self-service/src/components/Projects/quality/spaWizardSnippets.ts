/**
 * Demo Current / Proposed YAML for the SPA-faithful remediation wizard.
 * Mirrors APME proposal slots when Gateway diffs are not wired.
 */

export type WizardSnippet = {
  explanation: string;
  current: string[];
  proposed: string[];
  confidence?: number;
};

const BY_RULE: Record<string, WizardSnippet> = {
  'fqcn[action-core]': {
    explanation: 'Replace the bare module name with a fully qualified collection name.',
    current: ['    - copy:', '        src: files/app.conf', '        dest: /etc/app/app.conf'],
    proposed: [
      '    - ansible.builtin.copy:',
      '        src: files/app.conf',
      '        dest: /etc/app/app.conf',
    ],
  },
  'risky-file-permissions': {
    explanation: 'Add an explicit mode so file tasks are not overly permissive.',
    current: [
      '    - name: copy a config file',
      '      ansible.builtin.copy:',
      '        src: files/app.conf',
      '        dest: /etc/app/app.conf',
    ],
    proposed: [
      '    - name: copy a config file',
      '      ansible.builtin.copy:',
      '        src: files/app.conf',
      '        dest: /etc/app/app.conf',
      '        mode: "0644"',
    ],
    confidence: 0.94,
  },
  'no-changed-when': {
    explanation: 'Mark read-only command tasks so they do not report changed.',
    current: [
      '    - name: get the hostname',
      '      ansible.builtin.command:',
      '        cmd: hostname',
    ],
    proposed: [
      '    - name: get the hostname',
      '      ansible.builtin.command:',
      '        cmd: hostname',
      '      changed_when: false',
    ],
    confidence: 0.93,
  },
  'name[missing]': {
    explanation: 'Add a descriptive task name.',
    current: ['    - ansible.builtin.file:', '        path: /var/tmp/rollback', '        state: directory'],
    proposed: [
      '    - name: Ensure rollback directory exists',
      '      ansible.builtin.file:',
      '        path: /var/tmp/rollback',
      '        state: directory',
    ],
  },
  'yaml[truthy]': {
    explanation: 'Use YAML booleans true / false.',
    current: ['firewall_enabled: yes'],
    proposed: ['firewall_enabled: true'],
  },
  'aap-deprecated-module': {
    explanation: 'Replace the deprecated PanOS module with panos_security_policy.',
    current: ['    - paloalto.panos.panos_security_rule:', '        rule_name: allow-web'],
    proposed: ['    - paloalto.panos.panos_security_policy:', '        rule_name: allow-web'],
  },
  'aap-collection-update': {
    explanation: 'Pin paloalto.panos to a supported collection version.',
    current: ['  - name: paloalto.panos', '    version: 2.19.0'],
    proposed: ['  - name: paloalto.panos', '    version: ">=3.0.0"'],
  },
  'aap-removed-config': {
    explanation: 'Rename callback_whitelist to callbacks_enabled (ansible-core 2.17).',
    current: ['callback_whitelist = timer, profile_tasks'],
    proposed: ['callbacks_enabled = timer, profile_tasks'],
  },
  'aap-removed-param': {
    explanation: 'Remove the warn parameter (dropped in ansible-core 2.17).',
    current: ['    - name: Check patch readiness', '      ansible.builtin.command:', '        cmd: dnf check-update', '        warn: false'],
    proposed: ['    - name: Check patch readiness', '      ansible.builtin.command:', '        cmd: dnf check-update'],
  },
  'aap-deprecated-syntax': {
    explanation: 'Replace with_items with loop.',
    current: ['      with_items:', '        - web', '        - db'],
    proposed: ['      loop:', '        - web', '        - db'],
  },
  'command-instead-of-shell': {
    explanation: 'Use command unless the task needs a shell pipe.',
    current: ['    - ansible.builtin.shell: rpm -q kernel'],
    proposed: ['    - ansible.builtin.command: rpm -q kernel'],
  },
  'SEC-001': {
    explanation: 'Move secrets out of plaintext vars into a vault.',
    current: ['backup_key: "hardcoded-aes-key"'],
    proposed: ['backup_key: "{{ vault_backup_key }}"'],
  },
  'deprecated-module': {
    explanation: 'Replace ansible.netcommon.net_ping with a vendor-specific ping module.',
    current: ['    - ansible.netcommon.net_ping:', '        dest: "{{ gateway }"'],
    proposed: ['    - cisco.ios.ios_ping:', '        dest: "{{ gateway }"'],
  },
  'no-jinja-when': {
    explanation: 'Use a Jinja test in when: without extra template braces.',
    current: ['      when: "{{ item.enabled }}"'],
    proposed: ['      when: item.enabled | bool'],
  },
  'meta-no-info': {
    explanation: 'Add author, description, and license to role metadata.',
    current: ['galaxy_info:', '  author: ""'],
    proposed: [
      'galaxy_info:',
      '  author: network-team',
      '  description: Firewall rule automation',
      '  license: MIT',
    ],
  },
};

export function snippetForRule(ruleId: string): WizardSnippet {
  return (
    BY_RULE[ruleId] ?? {
      explanation: '',
      current: [],
      proposed: [],
    }
  );
}
