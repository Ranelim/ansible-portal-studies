import type { QualityViolation } from '../detail/qualityDemoData';

export type CodeLine = { num: number; text: string; highlighted?: boolean };

export type FindingCodeContext = {
  lines: CodeLine[];
  detail?: string;
};

/** Demo snippets keyed by rule id — same evidence as the Quality tab preview. */
export const FINDING_CODE_CONTEXT: Record<string, FindingCodeContext> = {
  'L027': {
    lines: [
      { num: 1, text: '# meta/main.yml' },
      { num: 2, text: '---' },
      { num: 3, text: 'galaxy_info:', highlighted: true },
      { num: 4, text: '  author: ""' },
      { num: 5, text: '  description: ""' },
    ],
    detail:
      'Role metadata should include author, description, license, and supported platforms to help users discover and evaluate this role.',
  },
  'L061': {
    lines: [
      { num: 6, text: 'gather_facts: true' },
      { num: 7, text: '' },
      { num: 8, text: 'enable_reporting: yes', highlighted: true },
      { num: 9, text: 'verbose_output: no' },
    ],
    detail:
      'YAML 1.1 accepts yes/no as booleans, but YAML 1.2 does not. Use true/false for forward compatibility.',
  },
  'M002': {
    lines: [
      { num: 16, text: '    - name: Apply patches to all packages' },
      { num: 17, text: '      ansible.builtin.include_tasks: patch-apply.yml' },
      { num: 18, text: '      ansible.builtin.yum:', highlighted: true },
      { num: 19, text: '        name: "*"' },
      { num: 20, text: '        state: latest' },
    ],
    detail:
      'ansible.builtin.yum is deprecated in AAP 2.7+. Use ansible.builtin.dnf which is a drop-in replacement.',
  },
  'L026': {
    lines: [
      { num: 11, text: '    - name: Copy patching script to target' },
      { num: 12, text: '      copy:', highlighted: true },
      { num: 13, text: '        src: files/patch.sh' },
      { num: 14, text: '        dest: /tmp/patch.sh' },
      { num: 15, text: '        mode: "0755"' },
    ],
    detail:
      'Use the fully qualified collection name (ansible.builtin.copy) to avoid ambiguity with custom modules sharing the same short name.',
  },
  'L013': {
    lines: [
      { num: 20, text: '    - name: Check current patch level' },
      { num: 21, text: '      ansible.builtin.command:', highlighted: true },
      { num: 22, text: '        cmd: rpm -qa --last' },
      { num: 23, text: '      register: patch_level' },
    ],
    detail:
      'Commands that only read state should declare changed_when: false so Ansible reports them as "ok" rather than "changed".',
  },
  'L024': {
    lines: [
      { num: 3, text: '    - ansible.builtin.file:', highlighted: true },
      { num: 4, text: '        path: /var/backup/rollback' },
      { num: 5, text: '        state: directory' },
    ],
    detail:
      'Unnamed tasks make playbook output hard to read and debug. Every task should have a descriptive name.',
  },
  'L059': {
    lines: [
      { num: 6, text: '    - name: Check disk space' },
      { num: 7, text: '      ansible.builtin.command:' },
      { num: 8, text: '        cmd: df -h', highlighted: true },
      { num: 9, text: '        warn: false', highlighted: true },
    ],
    detail:
      'The warn parameter was removed in ansible-core 2.17 (AAP 2.7). Commands no longer emit deprecation warnings by default.',
  },
  'M011': {
    lines: [
      { num: 4, text: 'collections:' },
      { num: 5, text: '  - name: community.general' },
      { num: 6, text: '    version: ">=7.5.0"', highlighted: true },
    ],
    detail:
      'community.general 7.5.0 is unsupported in AAP 2.7. Update to >= 8.0.0 for compatibility.',
  },
  'L021': {
    lines: [
      { num: 32, text: '    - name: Write patch report' },
      { num: 33, text: '      ansible.builtin.copy:' },
      { num: 34, text: '        content: "{{ patch_results | to_nice_yaml }}"', highlighted: true },
      { num: 35, text: '        dest: /var/log/patch-report.yml' },
    ],
    detail:
      'File created without explicit permissions inherits umask defaults, which may be too permissive. Set mode explicitly.',
  },
  'M009': {
    lines: [
      { num: 20, text: '    - name: Apply security updates' },
      { num: 21, text: '      ansible.builtin.dnf:' },
      { num: 22, text: '        name: "{{ item }}"', highlighted: true },
      { num: 23, text: '      with_items: "{{ packages }}"', highlighted: true },
    ],
    detail:
      'with_items is deprecated loop syntax. Use loop for forward compatibility with future Ansible versions.',
  },
  'M022': {
    lines: [
      { num: 1, text: '[defaults]' },
      { num: 2, text: 'inventory = ./inventory' },
      { num: 3, text: 'callback_whitelist = profile_tasks, timer', highlighted: true },
    ],
    detail:
      'callback_whitelist was renamed to callbacks_enabled in ansible-core 2.17. The old name is no longer recognized.',
  },
  'SEC:generic-api-key': {
    lines: [
      { num: 6, text: 'backup_user: ansible' },
      { num: 7, text: '' },
      { num: 8, text: 'encryption_key: "s3cret-backup-key"', highlighted: true },
      { num: 9, text: 'retention_days: 14' },
    ],
    detail:
      'A hardcoded secret in vars is visible in git history. Move this value to Ansible Vault or a credential.',
  },
  'L007': {
    lines: [
      { num: 7, text: '    - name: Verify backup checksum' },
      { num: 8, text: '      ansible.builtin.shell:', highlighted: true },
      { num: 9, text: '        cmd: sha256sum /var/backup/latest.tgz' },
    ],
    detail:
      'Use command unless the task needs a shell feature such as pipes or redirects.',
  },
};

/** Align demo line numbers to the finding’s reported location. */
export function snippetForFinding(item: QualityViolation): FindingCodeContext | null {
  const ctx = FINDING_CODE_CONTEXT[item.ruleId];
  if (!ctx) return null;
  const highlighted = ctx.lines.find(line => line.highlighted);
  if (!highlighted || highlighted.num === item.lineStart) return ctx;
  const delta = item.lineStart - highlighted.num;
  return {
    ...ctx,
    lines: ctx.lines.map(line => ({ ...line, num: line.num + delta })),
  };
}
