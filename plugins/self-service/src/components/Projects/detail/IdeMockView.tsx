import {
  Box,
  Typography,
  Dialog,
  IconButton,
  Link,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import FolderIcon from '@material-ui/icons/Folder';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useState } from 'react';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    height: '100%',
    backgroundColor: '#1e1e1e',
    color: '#cccccc',
    fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
    fontSize: 13,
  },
  activityBar: {
    width: 48,
    backgroundColor: '#333333',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 8,
    gap: 16,
    borderRight: '1px solid #252525',
  },
  activityIcon: {
    width: 28,
    height: 28,
    opacity: 0.6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:first-child': { opacity: 1, borderLeft: '2px solid #fff' },
  },
  sidebar: {
    width: 240,
    backgroundColor: '#252526',
    borderRight: '1px solid #1e1e1e',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '8px 12px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#bbbbbb',
  },
  treeItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 0 2px 12px',
    gap: 4,
    cursor: 'pointer',
    '&:hover': { backgroundColor: '#2a2d2e' },
  },
  treeItemNested: {
    paddingLeft: 24,
  },
  treeItemDeep: {
    paddingLeft: 36,
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    backgroundColor: '#252526',
    borderBottom: '1px solid #1e1e1e',
    height: 35,
  },
  tab: {
    padding: '6px 12px',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e1e1e',
    borderRight: '1px solid #252526',
    borderTop: '2px solid #007acc',
    color: '#ffffff',
  },
  welcomeContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    overflow: 'auto',
  },
  welcomeCard: {
    maxWidth: 600,
    width: '100%',
    textAlign: 'center',
  },
  ansibleLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#EE0000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 24,
    textAlign: 'left',
  },
  actionLink: {
    padding: '10px 14px',
    borderRadius: 6,
    backgroundColor: '#2a2d2e',
    border: '1px solid #3c3c3c',
    cursor: 'pointer',
    '&:hover': { backgroundColor: '#37373d', borderColor: '#007acc' },
  },
  statusBar: {
    height: 22,
    backgroundColor: '#007acc',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    fontSize: 11,
    color: '#ffffff',
    gap: 12,
  },
  terminal: {
    height: 120,
    backgroundColor: '#1e1e1e',
    borderTop: '1px solid #3c3c3c',
    padding: '6px 12px',
    fontSize: 11,
    color: '#888',
    overflow: 'hidden',
  },
  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
    fontSize: 11,
    color: '#ccc',
    borderBottom: '1px solid #3c3c3c',
    paddingBottom: 4,
  },
}));

type FileNode = {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
};

const ProjectTree = ({ projectName, classes }: { projectName: string; classes: ReturnType<typeof useStyles> }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root', 'playbooks', 'roles']));

  const tree: FileNode[] = [
    {
      name: projectName,
      type: 'folder',
      children: [
        {
          name: 'playbooks',
          type: 'folder',
          children: [
            { name: 'site.yml', type: 'file' },
            { name: 'patch-rhel.yml', type: 'file' },
            { name: 'validate-patches.yml', type: 'file' },
          ],
        },
        {
          name: 'roles',
          type: 'folder',
          children: [
            { name: 'patch-baseline', type: 'folder', children: [
              { name: 'tasks', type: 'folder', children: [{ name: 'main.yml', type: 'file' }] },
              { name: 'handlers', type: 'folder', children: [{ name: 'main.yml', type: 'file' }] },
              { name: 'defaults', type: 'folder', children: [{ name: 'main.yml', type: 'file' }] },
            ]},
          ],
        },
        { name: 'ansible.cfg', type: 'file' },
        { name: 'requirements.yml', type: 'file' },
        { name: 'README.md', type: 'file' },
        { name: '.ansible-lint', type: 'file' },
      ],
    },
  ];

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const renderNode = (node: FileNode, depth: number, path: string) => {
    const fullPath = `${path}/${node.name}`;
    const isExpanded = expanded.has(node.name);
    const depthClass = depth === 0 ? '' : depth === 1 ? classes.treeItemNested : classes.treeItemDeep;

    if (node.type === 'folder') {
      return (
        <Box key={fullPath}>
          <Box className={`${classes.treeItem} ${depthClass}`} onClick={() => toggle(node.name)}>
            {isExpanded ? <ExpandMoreIcon style={{ fontSize: 14 }} /> : <ChevronRightIcon style={{ fontSize: 14 }} />}
            <FolderIcon style={{ fontSize: 14, color: '#dcb67a' }} />
            <Typography style={{ fontSize: 12 }}>{node.name}</Typography>
          </Box>
          {isExpanded && node.children?.map(child => renderNode(child, depth + 1, fullPath))}
        </Box>
      );
    }
    return (
      <Box key={fullPath} className={`${classes.treeItem} ${depthClass}`} style={{ paddingLeft: depth * 12 + 24 }}>
        <InsertDriveFileIcon style={{ fontSize: 14, color: node.name.endsWith('.yml') ? '#519aba' : '#888' }} />
        <Typography style={{ fontSize: 12 }}>{node.name}</Typography>
      </Box>
    );
  };

  return <>{tree.map(n => renderNode(n, 0, ''))}</>;
};

const WelcomeTab = ({ classes, projectName }: { classes: ReturnType<typeof useStyles>; projectName: string }) => (
  <Box className={classes.welcomeContent}>
    <Box className={classes.welcomeCard}>
      <Box className={classes.ansibleLogo}>A</Box>
      <Typography style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
        Ansible
      </Typography>
      <Typography style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
        by Red Hat
      </Typography>
      <Typography style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>
        Workspace: <span style={{ color: '#4fc1ff' }}>{projectName}</span> · branch: <span style={{ color: '#4fc1ff' }}>main</span>
      </Typography>
      <Typography style={{ fontSize: 12, color: '#666', marginBottom: 24 }}>
        Ansible extension is active. Lightspeed is connected.
      </Typography>

      <Box className={classes.quickActions}>
        <Box className={classes.actionLink}>
          <Typography style={{ fontSize: 12, color: '#4fc1ff', fontWeight: 500 }}>Create a playbook</Typography>
          <Typography style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Generate with Lightspeed AI</Typography>
        </Box>
        <Box className={classes.actionLink}>
          <Typography style={{ fontSize: 12, color: '#4fc1ff', fontWeight: 500 }}>Run playbook</Typography>
          <Typography style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Execute with ansible-navigator</Typography>
        </Box>
        <Box className={classes.actionLink}>
          <Typography style={{ fontSize: 12, color: '#4fc1ff', fontWeight: 500 }}>Open Lightspeed</Typography>
          <Typography style={{ fontSize: 11, color: '#888', marginTop: 2 }}>AI-assisted content creation</Typography>
        </Box>
        <Box className={classes.actionLink}>
          <Typography style={{ fontSize: 12, color: '#4fc1ff', fontWeight: 500 }}>View problems</Typography>
          <Typography style={{ fontSize: 11, color: '#888', marginTop: 2 }}>3 violations from ansible-lint</Typography>
        </Box>
      </Box>

      <Box style={{ marginTop: 28, textAlign: 'left', padding: '0 4px' }}>
        <Typography style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Recent</Typography>
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="#" style={{ fontSize: 12, color: '#4fc1ff', textDecoration: 'none' }}>
            playbooks/patch-rhel.yml
          </Link>
          <Link href="#" style={{ fontSize: 12, color: '#4fc1ff', textDecoration: 'none' }}>
            roles/patch-baseline/tasks/main.yml
          </Link>
        </Box>
      </Box>
    </Box>
  </Box>
);

export const IdeMockView = ({
  open,
  onClose,
  projectName,
}: {
  open: boolean;
  onClose: () => void;
  projectName: string;
}) => {
  const classes = useStyles();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        style: {
          width: '90vw',
          height: '80vh',
          maxWidth: 1200,
          backgroundColor: '#1e1e1e',
          borderRadius: 8,
          overflow: 'hidden',
        },
      }}
    >
      <Box className={classes.root}>
        {/* Activity bar */}
        <Box className={classes.activityBar}>
          <Box className={classes.activityIcon}>
            <InsertDriveFileIcon style={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Box className={classes.activityIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ccc"><circle cx="11" cy="11" r="7" stroke="#ccc" strokeWidth="2" fill="none"/><line x1="16" y1="16" x2="22" y2="22" stroke="#ccc" strokeWidth="2"/></svg>
          </Box>
          <Box className={classes.activityIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15l-5-5 1.4-1.4L11 14.2l7.6-7.6L20 8l-9 9z" fill="#ccc"/></svg>
          </Box>
          <Box className={classes.activityIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ccc"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
          </Box>
        </Box>

        {/* Sidebar */}
        <Box className={classes.sidebar}>
          <Box className={classes.sidebarHeader}>Explorer</Box>
          <ProjectTree projectName={projectName} classes={classes} />
        </Box>

        {/* Editor area */}
        <Box className={classes.editorArea}>
          {/* Tab bar */}
          <Box className={classes.tabBar}>
            <Box className={classes.tab}>
              <Box style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#EE0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>A</Typography>
              </Box>
              <Typography style={{ fontSize: 12 }}>Welcome</Typography>
            </Box>
          </Box>

          {/* Welcome content */}
          <WelcomeTab classes={classes} projectName={projectName} />

          {/* Terminal */}
          <Box className={classes.terminal}>
            <Box className={classes.terminalHeader}>
              <Typography style={{ fontSize: 11, fontWeight: 500 }}>TERMINAL</Typography>
              <Typography style={{ fontSize: 11, color: '#888' }}>PROBLEMS (3)</Typography>
              <Typography style={{ fontSize: 11, color: '#888' }}>OUTPUT</Typography>
            </Box>
            <Typography style={{ fontSize: 11, color: '#4ec9b0', fontFamily: 'monospace' }}>
              $ ansible-lint
            </Typography>
            <Typography style={{ fontSize: 11, color: '#d4d4d4', fontFamily: 'monospace', marginTop: 2 }}>
              WARNING  Listing 3 violation(s) that are fatal
            </Typography>
            <Typography style={{ fontSize: 11, color: '#f48771', fontFamily: 'monospace', marginTop: 1 }}>
              roles/patch-baseline/tasks/main.yml:12: no-changed-when
            </Typography>
            <Typography style={{ fontSize: 11, color: '#f48771', fontFamily: 'monospace', marginTop: 1 }}>
              roles/patch-baseline/tasks/main.yml:28: fqcn[action-core]
            </Typography>
            <Typography style={{ fontSize: 11, color: '#ce9178', fontFamily: 'monospace', marginTop: 1 }}>
              playbooks/patch-rhel.yml:5: yaml[truthy]
            </Typography>
          </Box>

          {/* Status bar */}
          <Box className={classes.statusBar}>
            <Typography style={{ fontSize: 11 }}>main</Typography>
            <Typography style={{ fontSize: 11 }}>Ansible</Typography>
            <Typography style={{ fontSize: 11 }}>Lightspeed ✓</Typography>
            <Box flex={1} />
            <Typography style={{ fontSize: 11 }}>Dev Spaces</Typography>
          </Box>
        </Box>
      </Box>

      {/* Close button overlay */}
      <IconButton
        onClick={onClose}
        style={{ position: 'absolute', top: 8, right: 8, color: '#888' }}
        size="small"
      >
        <CloseIcon style={{ fontSize: 18 }} />
      </IconButton>
    </Dialog>
  );
};
