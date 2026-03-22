import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import AddIcon from '@material-ui/icons/Add';
import ComputerIcon from '@material-ui/icons/Computer';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import CodeIcon from '@material-ui/icons/Code';
import { useNavigate } from 'react-router-dom';
import { statusColors } from '../common/statusColors';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { DismissibleBanner } from '../common/DismissibleBanner';
import {
  DEMO_WORKSPACES,
  DemoWorkspace,
  WorkspaceStatus,
} from './workspacesDemoData';

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: theme.spacing(2.5),
  },
  card: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[2],
    },
  },
  cardRunning: {
    borderLeft: `3px solid ${statusColors.success}`,
  },
  cardStopped: {
    borderLeft: `3px solid ${statusColors.pending}`,
  },
  cardError: {
    borderLeft: `3px solid ${statusColors.error}`,
  },
  cardStarting: {
    borderLeft: `3px solid ${statusColors.info}`,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wsName: {
    fontWeight: 600,
    fontSize: 15,
    marginBottom: 4,
  },
  projectLink: {
    fontSize: 13,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  metaRow: {
    display: 'flex',
    gap: theme.spacing(2),
    marginTop: theme.spacing(1.5),
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  metaLabel: {
    fontWeight: 600,
    marginRight: 4,
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  extensionChip: {
    fontSize: 11,
    height: 22,
  },
  emptyRoot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    backgroundColor: theme.palette.action.hover,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2.5),
  },
}));

const statusConfig: Record<
  WorkspaceStatus,
  { label: string; color: string }
> = {
  running: { label: 'Running', color: statusColors.success },
  starting: { label: 'Starting', color: statusColors.info },
  stopped: { label: 'Stopped', color: statusColors.pending },
  error: { label: 'Error', color: statusColors.error },
};

const statusBorderClass = (
  status: WorkspaceStatus,
  classes: ReturnType<typeof useStyles>,
) => {
  switch (status) {
    case 'running':
      return classes.cardRunning;
    case 'starting':
      return classes.cardStarting;
    case 'error':
      return classes.cardError;
    default:
      return classes.cardStopped;
  }
};

const WorkspaceCard = ({
  workspace,
  onAction,
}: {
  workspace: DemoWorkspace;
  onAction: (ws: DemoWorkspace, action: string) => void;
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const cfg = statusConfig[workspace.status];

  return (
    <Card
      className={`${classes.card} ${statusBorderClass(workspace.status, classes)}`}
      variant="outlined"
    >
      <CardContent style={{ padding: 20 }}>
        <Box className={classes.cardHeader}>
          <Box>
            <Typography className={classes.wsName}>
              {workspace.name}
            </Typography>
            <Typography
              className={classes.projectLink}
              onClick={() =>
                navigate(
                  `/self-service/projects/${workspace.projectName}`,
                )
              }
            >
              {workspace.projectTitle}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" style={{ gap: 4 }}>
            <Chip
              size="small"
              icon={
                <FiberManualRecordIcon
                  style={{ fontSize: 10, color: cfg.color }}
                />
              }
              label={cfg.label}
              variant="outlined"
              style={{ fontSize: 11, height: 24 }}
            />
            <IconButton
              size="small"
              onClick={e => setAnchorEl(e.currentTarget)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box className={classes.metaRow}>
          <Typography className={classes.metaItem}>
            <span className={classes.metaLabel}>Branch:</span>
            <code style={{ fontSize: 11 }}>{workspace.branch}</code>
          </Typography>
          <Typography className={classes.metaItem}>
            <span className={classes.metaLabel}>IDE:</span>
            {workspace.ide}
          </Typography>
          <Typography className={classes.metaItem}>
            <span className={classes.metaLabel}>Accessed:</span>
            {workspace.lastAccessed}
          </Typography>
        </Box>

        <Box
          display="flex"
          flexWrap="wrap"
          style={{ gap: 4, marginTop: 12 }}
        >
          {workspace.extensions.map(ext => (
            <Chip
              key={ext}
              size="small"
              label={ext}
              variant="outlined"
              className={classes.extensionChip}
            />
          ))}
        </Box>

        <Box className={classes.actionsRow}>
          <Box display="flex" alignItems="center" style={{ gap: 4 }}>
            <Typography
              className={classes.metaItem}
              style={{ fontSize: 11 }}
            >
              {workspace.cpu} · {workspace.memory}
            </Typography>
          </Box>
          {workspace.status === 'running' ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
              style={{ textTransform: 'none', fontWeight: 500 }}
              onClick={() => onAction(workspace, 'open')}
            >
              Open
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<PlayArrowIcon style={{ fontSize: 14 }} />}
              style={{ textTransform: 'none', fontWeight: 500 }}
              onClick={() => onAction(workspace, 'start')}
            >
              Start
            </Button>
          )}
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          getContentAnchorEl={null}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {workspace.status === 'running' ? (
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                onAction(workspace, 'stop');
              }}
            >
              <ListItemIcon>
                <StopIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Stop workspace" />
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                onAction(workspace, 'start');
              }}
            >
              <ListItemIcon>
                <PlayArrowIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Start workspace" />
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              window.open(workspace.repoUrl, '_blank');
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <CodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View source" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onAction(workspace, 'delete');
            }}
          >
            <ListItemIcon>
              <DeleteOutlineIcon
                fontSize="small"
                style={{ color: statusColors.error }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Delete"
              primaryTypographyProps={{
                style: { color: statusColors.error },
              }}
            />
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export const WorkspacesPage = () => {
  const classes = useStyles();
  const [workspaces, setWorkspaces] = useState(DEMO_WORKSPACES);
  const [createOpen, setCreateOpen] = useState(false);

  const handleAction = (ws: DemoWorkspace, action: string) => {
    if (action === 'open') {
      window.open(ws.repoUrl, '_blank');
    } else if (action === 'start') {
      setWorkspaces(prev =>
        prev.map(w =>
          w.id === ws.id
            ? { ...w, status: 'running' as const, lastAccessed: 'just now' }
            : w,
        ),
      );
    } else if (action === 'stop') {
      setWorkspaces(prev =>
        prev.map(w =>
          w.id === ws.id
            ? { ...w, status: 'stopped' as const, lastAccessed: 'just now' }
            : w,
        ),
      );
    } else if (action === 'delete') {
      setWorkspaces(prev => prev.filter(w => w.id !== ws.id));
    }
  };

  const runningCount = workspaces.filter(
    w => w.status === 'running',
  ).length;
  const stoppedCount = workspaces.filter(
    w => w.status === 'stopped',
  ).length;

  return (
    <Page themeId="app">
      <Header
        title="Workspaces"
        subtitle="Browser-based development environments for your automation projects"
      >
        <PageHelpIcon
          tooltipLabel="What are workspaces?"
          title="What are Workspaces?"
          description="Workspaces are browser-based development environments (Dev Spaces) pre-configured with VS Code, the Ansible extension, and Ansible Lightspeed AI. They let you edit, test, and commit automation content without any local setup."
          variant="header"
        />
      </Header>
      <Content>
        <DismissibleBanner
          storageKey="workspaces-intro"
          message="Workspaces are browser-based VS Code environments connected to your automation projects. Each workspace comes pre-configured with the Ansible extension and Lightspeed AI assistant, so you can start editing playbooks immediately."
        />

        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2.5}
        >
          <Box display="flex" alignItems="center" style={{ gap: 16 }}>
            <Typography variant="h6" style={{ fontWeight: 600 }}>
              {workspaces.length}{' '}
              {workspaces.length === 1 ? 'workspace' : 'workspaces'}
            </Typography>
            {runningCount > 0 && (
              <Chip
                size="small"
                icon={
                  <FiberManualRecordIcon
                    style={{
                      fontSize: 10,
                      color: statusColors.success,
                    }}
                  />
                }
                label={`${runningCount} running`}
                variant="outlined"
                style={{ fontSize: 11, height: 24 }}
              />
            )}
            {stoppedCount > 0 && (
              <Chip
                size="small"
                label={`${stoppedCount} stopped`}
                variant="outlined"
                style={{ fontSize: 11, height: 24 }}
              />
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            style={{ textTransform: 'none', fontWeight: 500 }}
            onClick={() => setCreateOpen(true)}
          >
            New workspace
          </Button>
        </Box>

        {workspaces.length === 0 ? (
          <Box className={classes.emptyRoot}>
            <Box className={classes.emptyIcon}>
              <ComputerIcon
                style={{ fontSize: 36, color: statusColors.pending }}
              />
            </Box>
            <Typography
              variant="h5"
              style={{ fontWeight: 300, marginBottom: 12 }}
            >
              No workspaces yet
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ maxWidth: 420, marginBottom: 20 }}
            >
              Create a workspace to start editing your automation projects in a
              browser-based VS Code environment with the Ansible extension and
              Lightspeed AI pre-configured.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              style={{ textTransform: 'none' }}
              onClick={() => setCreateOpen(true)}
            >
              New workspace
            </Button>
          </Box>
        ) : (
          <Box className={classes.grid}>
            {workspaces.map(ws => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                onAction={handleAction}
              />
            ))}
          </Box>
        )}

        {/* Create dialog */}
        <CreateWorkspaceDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={() => setCreateOpen(false)}
        />
      </Content>
    </Page>
  );
};

const CreateWorkspaceDialog = ({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>New workspace</DialogTitle>
    <DialogContent>
      <Typography
        variant="body2"
        color="textSecondary"
        style={{ marginBottom: 20 }}
      >
        Create a browser-based development environment connected to one of
        your projects.
      </Typography>
      <FormControl fullWidth style={{ marginBottom: 16 }}>
        <InputLabel shrink>Project</InputLabel>
        <Select
          native
          defaultValue=""
          style={{ marginTop: 16 }}
        >
          <option value="" disabled>
            Select a project...
          </option>
          <option value="web-app-scaling-suite">
            web-app-scaling-suite
          </option>
          <option value="rhel-patch-automation">
            rhel-patch-automation
          </option>
          <option value="network-compliance-checker">
            network-compliance-checker
          </option>
          <option value="linux-baseline-hardening">
            linux-baseline-hardening
          </option>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Branch"
        defaultValue="main"
        style={{ marginBottom: 16 }}
        InputLabelProps={{ shrink: true }}
      />
      <FormControl fullWidth style={{ marginBottom: 16 }}>
        <InputLabel shrink>IDE</InputLabel>
        <Select
          native
          defaultValue="vscode-ansible"
          style={{ marginTop: 16 }}
        >
          <option value="vscode-ansible">
            VS Code + Ansible Extension
          </option>
        </Select>
      </FormControl>
      <Box display="flex" alignItems="center" style={{ gap: 8 }}>
        <Tooltip title="Ansible Lightspeed provides AI-powered code suggestions and task completion" arrow>
          <Chip
            size="small"
            label="Ansible Lightspeed AI included"
            variant="outlined"
            style={{ fontSize: 11, height: 22 }}
            icon={
              <FiberManualRecordIcon
                style={{ fontSize: 8, color: statusColors.success }}
              />
            }
          />
        </Tooltip>
      </Box>
    </DialogContent>
    <DialogActions style={{ padding: '8px 24px 16px' }}>
      <Button
        onClick={onClose}
        style={{ textTransform: 'none' }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={onCreate}
        style={{ textTransform: 'none' }}
      >
        Create workspace
      </Button>
    </DialogActions>
  </Dialog>
);
