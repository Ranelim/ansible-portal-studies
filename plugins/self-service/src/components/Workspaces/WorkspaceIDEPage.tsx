import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, IconButton, makeStyles } from '@material-ui/core';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import SendIcon from '@material-ui/icons/Send';
import CloseIcon from '@material-ui/icons/Close';
import { DEMO_WORKSPACES } from './workspacesDemoData';
import { statusColors } from '../common/statusColors';

const SIDEBAR_BG = '#252526';
const EDITOR_BG = '#1e1e1e';
const TITLEBAR_BG = '#323233';
const ACTIVITY_BG = '#333333';
const PANEL_BG = '#1e1e1e';
const CHAT_BG = '#252526';
const BORDER = '#3c3c3c';
const TEXT = '#cccccc';
const TEXT_DIM = '#858585';
const ACCENT = '#569cd6';
const KEYWORD = '#c586c0';
const STRING = '#ce9178';
const COMMENT = '#6a9955';
const FUNC = '#dcdcaa';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
    backgroundColor: EDITOR_BG,
    fontFamily: "'Consolas', 'Courier New', monospace",
    color: TEXT,
    overflow: 'hidden',
  },
  titleBar: {
    height: 30,
    backgroundColor: TITLEBAR_BG,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: `1px solid ${BORDER}`,
    fontSize: 12,
    color: TEXT_DIM,
    flexShrink: 0,
  },
  mainArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  activityBar: {
    width: 48,
    backgroundColor: ACTIVITY_BG,
    borderRight: `1px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 8,
    gap: 4,
    flexShrink: 0,
  },
  activityIcon: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    cursor: 'pointer',
    color: TEXT_DIM,
    '&:hover': {
      color: TEXT,
    },
  },
  activityIconActive: {
    color: TEXT,
    borderLeft: `2px solid white`,
  },
  sidebar: {
    width: 240,
    backgroundColor: SIDEBAR_BG,
    borderRight: `1px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '10px 16px 6px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: TEXT_DIM,
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px 3px 16px',
    fontSize: 13,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#2a2d2e',
    },
  },
  fileItemActive: {
    backgroundColor: '#37373d',
  },
  folderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px 3px 8px',
    fontSize: 13,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#2a2d2e',
    },
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  tabBar: {
    height: 35,
    backgroundColor: TITLEBAR_BG,
    display: 'flex',
    alignItems: 'stretch',
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 16px',
    fontSize: 13,
    borderRight: `1px solid ${BORDER}`,
    cursor: 'pointer',
    backgroundColor: SIDEBAR_BG,
    color: TEXT_DIM,
  },
  tabActive: {
    backgroundColor: EDITOR_BG,
    color: TEXT,
    borderBottom: `1px solid ${EDITOR_BG}`,
  },
  editorContent: {
    flex: 1,
    padding: '16px 0 16px 56px',
    overflow: 'auto',
    fontSize: 14,
    lineHeight: 1.6,
    position: 'relative',
    backgroundColor: EDITOR_BG,
  },
  lineNumbers: {
    position: 'absolute',
    left: 0,
    top: 16,
    width: 48,
    textAlign: 'right',
    color: TEXT_DIM,
    fontSize: 14,
    lineHeight: 1.6,
    userSelect: 'none',
    paddingRight: 12,
  },
  chatPanel: {
    width: 340,
    backgroundColor: CHAT_BG,
    borderLeft: `1px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  chatHeader: {
    padding: '10px 16px',
    borderBottom: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#264f78',
    borderRadius: '12px 12px 2px 12px',
    padding: '8px 14px',
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: '85%',
  },
  chatBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: '#2d2d2d',
    borderRadius: '12px 12px 12px 2px',
    padding: '8px 14px',
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: '85%',
    border: `1px solid ${BORDER}`,
  },
  chatInput: {
    padding: '8px 12px',
    borderTop: `1px solid ${BORDER}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  chatInputField: {
    flex: 1,
    backgroundColor: '#3c3c3c',
    border: 'none',
    borderRadius: 6,
    padding: '8px 12px',
    color: TEXT,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    '&::placeholder': {
      color: TEXT_DIM,
    },
  },
  terminalArea: {
    height: 200,
    backgroundColor: PANEL_BG,
    borderTop: `1px solid ${BORDER}`,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '4px 16px',
    backgroundColor: TITLEBAR_BG,
    borderBottom: `1px solid ${BORDER}`,
    fontSize: 12,
    color: TEXT_DIM,
  },
  terminalContent: {
    flex: 1,
    padding: '8px 16px',
    fontSize: 13,
    overflow: 'auto',
  },
  statusBar: {
    height: 22,
    backgroundColor: '#007acc',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    fontSize: 12,
    gap: 16,
    flexShrink: 0,
  },
}));

const FILE_TREE = [
  {
    name: 'playbooks',
    type: 'folder' as const,
    children: [
      { name: 'patch-rhel.yml', type: 'file' as const },
      { name: 'validate-patches.yml', type: 'file' as const },
    ],
  },
  {
    name: 'roles',
    type: 'folder' as const,
    children: [
      { name: 'patch-baseline/', type: 'file' as const },
    ],
  },
  {
    name: 'inventory',
    type: 'folder' as const,
    children: [{ name: 'production', type: 'file' as const }],
  },
  { name: 'ansible.cfg', type: 'file' as const },
  { name: 'requirements.yml', type: 'file' as const },
  { name: 'execution-environment.yml', type: 'file' as const },
  { name: 'README.md', type: 'file' as const },
];

const EDITOR_CONTENT = `---
# playbooks/patch-rhel.yml
# Fix: skip kernel update when reboot is not allowed
- name: Patch RHEL servers
  hosts: rhel_servers
  become: true
  vars:
    reboot_timeout: 600
    allow_reboot: true
    snapshot_before_patch: true
    excluded_packages:
      - kernel-debug

  pre_tasks:
    - name: Validate connectivity
      ansible.builtin.ping:

    - name: Check available disk space
      ansible.builtin.shell: |
        df -BG / | tail -1 | awk '{print $4}'
      register: disk_space
      changed_when: false

    - name: Fail if disk space is insufficient
      ansible.builtin.fail:
        msg: "Insufficient disk space: {{ disk_space.stdout }}"
      when: disk_space.stdout | regex_replace('G','') | int < 5

    - name: Create pre-patch snapshot
      ansible.builtin.include_role:
        name: patch-baseline
        tasks_from: snapshot
      when: snapshot_before_patch | bool

  tasks:
    - name: Update all packages excluding kernel when reboot disallowed
      ansible.builtin.dnf:
        name: "*"
        state: latest
        exclude: "{{ excluded_packages + (['kernel*'] if not allow_reboot else []) | join(',') }}"
      register: patch_result

    - name: Check if reboot is required
      ansible.builtin.stat:
        path: /var/run/reboot-required
      register: reboot_check

    - name: Reboot if required and allowed
      ansible.builtin.reboot:
        reboot_timeout: "{{ reboot_timeout }}"
      when:
        - reboot_check.stat.exists
        - allow_reboot | bool

    - name: Skip reboot notification
      ansible.builtin.debug:
        msg: "Reboot required but skipped — allow_reboot is false"
      when:
        - reboot_check.stat.exists
        - not (allow_reboot | bool)

  post_tasks:
    - name: Verify critical services
      ansible.builtin.service:
        name: "{{ item }}"
        state: started
      loop:
        - sshd
        - rsyslog
        - crond

    - name: Generate patch report
      ansible.builtin.template:
        src: templates/patch-report.j2
        dest: /var/log/patch-report.txt`;

const CHAT_MESSAGES = [
  {
    role: 'user' as const,
    text: 'The pipeline Lint stage failed with "risky reboot without conditional". How do I fix this?',
  },
  {
    role: 'ai' as const,
    text: `The linter flagged the \`ansible.builtin.reboot\` task because it runs unconditionally. When \`allow_reboot\` is false, the kernel update should be skipped entirely and the reboot should not execute.

Update the reboot task to add a conditional:

\`\`\`yaml
- name: Reboot if required and allowed
  ansible.builtin.reboot:
    reboot_timeout: "{{ reboot_timeout }}"
  when:
    - reboot_check.stat.exists
    - allow_reboot | bool
\`\`\`

You should also exclude \`kernel*\` packages from the update when reboot is not allowed, so the host doesn't install a kernel it can't activate.`,
  },
  {
    role: 'user' as const,
    text: 'Good idea. Should I also notify the operator when a reboot was skipped?',
  },
  {
    role: 'ai' as const,
    text: `Yes — add a debug task right after the reboot task so the play output clearly shows the skip reason:

\`\`\`yaml
- name: Skip reboot notification
  ansible.builtin.debug:
    msg: "Reboot required but skipped — allow_reboot is false"
  when:
    - reboot_check.stat.exists
    - not (allow_reboot | bool)
\`\`\`

This makes the skip visible in job logs and AAP output without failing the play.`,
  },
];

const syntaxHighlight = (line: string) => {
  if (line.trimStart().startsWith('#')) {
    return <span style={{ color: COMMENT }}>{line}</span>;
  }
  if (line.trimStart().startsWith('- name:')) {
    const idx = line.indexOf('- name:');
    return (
      <>
        <span>{line.substring(0, idx)}</span>
        <span style={{ color: KEYWORD }}>- name:</span>
        <span style={{ color: STRING }}>{line.substring(idx + 7)}</span>
      </>
    );
  }
  if (line.includes(': ') && !line.trimStart().startsWith('-')) {
    const colonIdx = line.indexOf(':');
    const key = line.substring(0, colonIdx);
    const val = line.substring(colonIdx);
    return (
      <>
        <span style={{ color: ACCENT }}>{key}</span>
        <span>{val}</span>
      </>
    );
  }
  return <span>{line}</span>;
};

export const WorkspaceIDEPage = () => {
  const classes = useStyles();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({ playbooks: true, roles: false, inventory: false });
  const [showChat, setShowChat] = useState(true);

  const workspace = DEMO_WORKSPACES.find(w => w.id === workspaceId);
  const wsName = workspace?.name || 'ansible-workspace';
  const projectName = workspace?.projectName || 'automation-project';

  const editorLines = EDITOR_CONTENT.split('\n');

  const toggleFolder = (name: string) => {
    setExpandedFolders(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <Box className={classes.root}>
      {/* Title bar */}
      <Box className={classes.titleBar}>
        {wsName} — {projectName} — VS Code (Ansible)
      </Box>

      <Box className={classes.mainArea}>
        {/* Activity bar */}
        <Box className={classes.activityBar}>
          {['📁', '🔍', '🔀', '🐛', '🧩'].map((icon, i) => (
            <Box
              key={i}
              className={`${classes.activityIcon} ${i === 0 ? classes.activityIconActive : ''}`}
            >
              <Typography style={{ fontSize: 18 }}>{icon}</Typography>
            </Box>
          ))}
        </Box>

        {/* File explorer sidebar */}
        <Box className={classes.sidebar}>
          <Box className={classes.sidebarHeader}>Explorer</Box>
          <Box style={{ padding: '4px 0' }}>
            {FILE_TREE.map(item =>
              item.type === 'folder' ? (
                <Box key={item.name}>
                  <Box
                    className={classes.folderItem}
                    onClick={() => toggleFolder(item.name)}
                  >
                    {expandedFolders[item.name] ? (
                      <ExpandMoreIcon
                        style={{ fontSize: 16, color: TEXT_DIM }}
                      />
                    ) : (
                      <ChevronRightIcon
                        style={{ fontSize: 16, color: TEXT_DIM }}
                      />
                    )}
                    {expandedFolders[item.name] ? (
                      <FolderOpenIcon
                        style={{ fontSize: 16, color: '#dcb67a' }}
                      />
                    ) : (
                      <FolderIcon
                        style={{ fontSize: 16, color: '#dcb67a' }}
                      />
                    )}
                    <span>{item.name}</span>
                  </Box>
                  {expandedFolders[item.name] &&
                    item.children?.map(child => (
                      <Box
                        key={child.name}
                        className={`${classes.fileItem} ${child.name === 'patch-rhel.yml' ? classes.fileItemActive : ''}`}
                        style={{ paddingLeft: 36 }}
                      >
                        <InsertDriveFileOutlinedIcon
                          style={{ fontSize: 14, color: TEXT_DIM }}
                        />
                        <span>{child.name}</span>
                      </Box>
                    ))}
                </Box>
              ) : (
                <Box key={item.name} className={classes.fileItem}>
                  <InsertDriveFileOutlinedIcon
                    style={{ fontSize: 14, color: TEXT_DIM }}
                  />
                  <span>{item.name}</span>
                </Box>
              ),
            )}
          </Box>
        </Box>

        {/* Editor + terminal */}
        <Box className={classes.editorArea}>
          {/* Tab bar */}
          <Box className={classes.tabBar}>
            <Box className={`${classes.tab} ${classes.tabActive}`}>
              <InsertDriveFileOutlinedIcon
                style={{ fontSize: 14 }}
              />
              patch-rhel.yml
            </Box>
            <Box className={classes.tab}>
              <InsertDriveFileOutlinedIcon
                style={{ fontSize: 14 }}
              />
              validate-patches.yml
            </Box>
          </Box>

          {/* Editor */}
          <Box className={classes.editorContent}>
            <Box className={classes.lineNumbers}>
              {editorLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </Box>
            <pre style={{ margin: 0, fontFamily: 'inherit' }}>
              {editorLines.map((line, i) => (
                <div key={i}>{syntaxHighlight(line)}</div>
              ))}
            </pre>
          </Box>

          {/* Terminal */}
          <Box className={classes.terminalArea}>
            <Box className={classes.terminalHeader}>
              <Typography
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: TEXT,
                }}
              >
                Terminal
              </Typography>
              <Typography style={{ fontSize: 12, color: TEXT_DIM }}>
                Problems
              </Typography>
              <Typography style={{ fontSize: 12, color: TEXT_DIM }}>
                Output
              </Typography>
            </Box>
            <Box className={classes.terminalContent}>
              <div>
                <span style={{ color: statusColors.success }}>{projectName}</span>
                <span style={{ color: TEXT_DIM }}> (main) </span>
                <span style={{ color: TEXT }}>$ ansible-lint playbooks/patch-rhel.yml</span>
              </div>
              <div style={{ color: statusColors.error }}>
                WARNING: risky-reboot: Reboot task without conditional (patch-rhel.yml:34)
              </div>
              <div style={{ color: statusColors.error }}>
                Failed: 1 failure(s), 0 warning(s) on 1 file(s).
              </div>
              <div>
                <span style={{ color: statusColors.success }}>{projectName}</span>
                <span style={{ color: TEXT_DIM }}> (main) </span>
                <span style={{ color: TEXT }}>$ ansible-lint playbooks/patch-rhel.yml</span>
              </div>
              <div style={{ color: statusColors.success }}>
                Passed: 0 failure(s), 0 warning(s) on 1 file(s).
              </div>
              <div>
                <span style={{ color: statusColors.success }}>{projectName}</span>
                <span style={{ color: TEXT_DIM }}> (main) </span>
                <span style={{ color: TEXT }}>$ git commit -am &quot;fix: skip kernel update when reboot is not allowed&quot;</span>
              </div>
              <div style={{ color: TEXT_DIM }}>
                [main b7c3a1f] fix: skip kernel update when reboot is not allowed
              </div>
              <div style={{ color: TEXT_DIM }}>
                &nbsp;1 file changed, 12 insertions(+), 3 deletions(-)
              </div>
              <div>
                <span style={{ color: statusColors.success }}>{projectName}</span>
                <span style={{ color: TEXT_DIM }}> (main) </span>
                <span style={{ color: TEXT }}>$ git push origin main</span>
              </div>
              <div style={{ color: TEXT_DIM }}>
                To github.com:acme-corp/rhel-patching.git
              </div>
              <div style={{ color: TEXT_DIM }}>
                &nbsp;&nbsp; a2d8e41..b7c3a1f  main -&gt; main
              </div>
              <div>
                <span style={{ color: statusColors.success }}>{projectName}</span>
                <span style={{ color: TEXT_DIM }}> (main) </span>
                <span style={{ color: TEXT }}>$ </span>
                <span style={{ color: TEXT }} className="cursor-blink">█</span>
              </div>
            </Box>
          </Box>
        </Box>

        {/* Lightspeed AI chat panel */}
        {showChat && (
          <Box className={classes.chatPanel}>
            <Box className={classes.chatHeader}>
              <Box
                display="flex"
                alignItems="center"
                style={{ gap: 8 }}
              >
                <FiberManualRecordIcon
                  style={{
                    fontSize: 8,
                    color: statusColors.success,
                  }}
                />
                <Typography
                  style={{ fontSize: 13, fontWeight: 600, color: TEXT }}
                >
                  Ansible Lightspeed
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setShowChat(false)}
                style={{ color: TEXT_DIM }}
              >
                <CloseIcon style={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <Box className={classes.chatMessages}>
              {CHAT_MESSAGES.map((msg, i) => (
                <Box
                  key={i}
                  className={
                    msg.role === 'user'
                      ? classes.chatBubbleUser
                      : classes.chatBubbleAI
                  }
                >
                  {msg.role === 'ai' ? (
                    <Box>
                      {msg.text.split('```').map((part, pi) =>
                        pi % 2 === 0 ? (
                          <Typography
                            key={pi}
                            style={{
                              fontSize: 13,
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {part.replace(/^yaml\n/, '')}
                          </Typography>
                        ) : (
                          <pre
                            key={pi}
                            style={{
                              margin: '8px 0',
                              padding: 10,
                              backgroundColor: '#1a1a1a',
                              borderRadius: 6,
                              fontSize: 12,
                              lineHeight: 1.5,
                              overflow: 'auto',
                              color: '#d4d4d4',
                            }}
                          >
                            {part.replace(/^yaml\n/, '')}
                          </pre>
                        ),
                      )}
                    </Box>
                  ) : (
                    <Typography
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            <Box className={classes.chatInput}>
              <input
                className={classes.chatInputField}
                placeholder="Ask Lightspeed..."
                readOnly
              />
              <IconButton size="small" style={{ color: ACCENT }}>
                <SendIcon style={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Status bar */}
      <Box className={classes.statusBar}>
        <Typography style={{ fontSize: 12 }}>
          main
        </Typography>
        <Typography style={{ fontSize: 12 }}>
          YAML
        </Typography>
        <Typography style={{ fontSize: 12 }}>
          Ansible
        </Typography>
        <Box style={{ flex: 1 }} />
        <Typography style={{ fontSize: 12 }}>
          Lightspeed: Connected
        </Typography>
        <Typography style={{ fontSize: 12 }}>
          UTF-8
        </Typography>
        <Typography style={{ fontSize: 12 }}>
          Ln 24, Col 8
        </Typography>
      </Box>
    </Box>
  );
};
