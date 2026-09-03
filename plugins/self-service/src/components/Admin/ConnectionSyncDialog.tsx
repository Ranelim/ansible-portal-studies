import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Typography,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import SyncIcon from '@material-ui/icons/Sync';
import type { ConnectionProvider } from './syncDemoData';

const useStyles = makeStyles(theme => ({
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  selectAll: {
    textTransform: 'none',
    fontWeight: 500,
    padding: 0,
    minWidth: 0,
    marginBottom: theme.spacing(0.5),
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    marginLeft: -9,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  detail: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
  },
  actions: {
    justifyContent: 'flex-start',
    padding: theme.spacing(2, 3),
    gap: theme.spacing(1),
  },
  primary: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: 20,
  },
  cancel: {
    textTransform: 'none',
    fontWeight: 500,
  },
  close: {
    marginTop: -4,
    marginRight: -8,
  },
}));

export type SyncEntity = {
  id: string;
  label: string;
  detail?: string;
};

export type ConnectionSyncScope = {
  title: string;
  description: string;
  groupLabel: string;
  entities: SyncEntity[];
};

export function syncScopeForConnection(
  provider: ConnectionProvider,
): ConnectionSyncScope {
  switch (provider.id) {
    case 'aap':
      return {
        title: 'Sync Ansible Automation Platform',
        description:
          'Select organizations to sync. Each organization syncs its job templates, users, and teams.',
        groupLabel: 'Organizations',
        entities: [
          { id: 'default', label: 'Default', detail: '14 job templates' },
          {
            id: 'platform',
            label: 'Platform Engineering',
            detail: '18 job templates',
          },
          {
            id: 'appdev',
            label: 'Application Development',
            detail: '10 job templates',
          },
        ],
      };
    case 'orchestrator':
      return {
        title: 'Sync Ansible Orchestrator',
        description:
          'Select software templates to sync into the Portal catalog.',
        groupLabel: 'Software templates',
        entities: [
          { id: 'rhel-patch', label: 'RHEL patching workflow' },
          { id: 'network-provision', label: 'Network provisioning' },
          { id: 'vm-lifecycle', label: 'VM lifecycle' },
          { id: 'compliance-scan', label: 'Compliance scan pipeline' },
        ],
      };
    case 'pah':
      return {
        title: 'Sync Private Automation Hub',
        description:
          'Select remotes to sync collections and execution environments from.',
        groupLabel: 'Remotes',
        entities: [
          {
            id: 'rh-certified',
            label: 'rh-certified',
            detail: 'Red Hat certified content',
          },
          {
            id: 'validated',
            label: 'validated',
            detail: 'Community collections tested against AAP',
          },
          {
            id: 'published',
            label: 'published',
            detail: 'Internally published collections and EE images',
          },
        ],
      };
    case 'github':
      return {
        title: 'Sync GitHub',
        description:
          'Select organizations to scan for playbooks, roles, and collections.',
        groupLabel: 'Organizations',
        entities: [
          { id: 'ansible-collections', label: 'ansible-collections' },
          { id: 'ansible-network', label: 'ansible-network' },
        ],
      };
    case 'gitlab':
      return {
        title: 'Sync GitLab',
        description:
          'Select groups to scan for playbooks, roles, and collections.',
        groupLabel: 'Groups',
        entities: [{ id: 'platform-automation', label: 'platform-automation' }],
      };
    case 'registries':
      return {
        title: 'Sync public registries',
        description: 'Select which public content catalogs to refresh.',
        groupLabel: 'Content catalogs',
        entities: [
          { id: 'certified', label: 'Certified content' },
          { id: 'validated', label: 'Validated content' },
          { id: 'community', label: 'Community content (Galaxy)' },
        ],
      };
    default:
      return {
        title: `Sync ${provider.name}`,
        description: 'Select what to sync from this connection.',
        groupLabel: 'Items',
        entities: [],
      };
  }
}

type ConnectionSyncDialogProps = {
  open: boolean;
  provider: ConnectionProvider | null;
  onClose: () => void;
  onSync?: (selectedIds: string[]) => void;
};

/**
 * Per-connection Sync now — checkbox list of that source's entities.
 * PF6 input modal: verb+object title, primary Sync now, Cancel as text.
 */
export const ConnectionSyncDialog = ({
  open,
  provider,
  onClose,
  onSync,
}: ConnectionSyncDialogProps) => {
  const classes = useStyles();
  const scope = provider ? syncScopeForConnection(provider) : null;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (open && scope) {
      setSelected(new Set(scope.entities.map(e => e.id)));
      setRunning(false);
    }
  }, [open, provider?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!provider || !scope) return null;

  const titleId = `sync-dialog-title-${provider.id}`;
  const descId = `sync-dialog-desc-${provider.id}`;
  const allSelected =
    scope.entities.length > 0 &&
    scope.entities.every(e => selected.has(e.id));

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(scope.entities.map(e => e.id)),
    );
  };

  const handleClose = () => {
    if (running) return;
    onClose();
  };

  const handleSync = () => {
    if (selected.size === 0 || running) return;
    setRunning(true);
    const ids = Array.from(selected);
    window.setTimeout(() => {
      onSync?.(ids);
      setRunning(false);
      onClose();
    }, 900);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <DialogTitle disableTypography>
        <Box className={classes.titleRow}>
          <Box>
            <Typography id={titleId} className={classes.title} component="h2">
              {scope.title}
            </Typography>
            <Typography id={descId} className={classes.description}>
              {scope.description}
            </Typography>
          </Box>
          <IconButton
            className={classes.close}
            aria-label="Close"
            onClick={handleClose}
            disabled={running}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {scope.entities.length === 0 ? (
          <Typography color="textSecondary" variant="body2">
            No sync items are configured for this connection.
          </Typography>
        ) : (
          <>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography className={classes.groupLabel}>
                {scope.groupLabel}
              </Typography>
              <Button
                className={classes.selectAll}
                color="primary"
                size="small"
                onClick={toggleAll}
                disabled={running}
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </Button>
            </Box>
            {scope.entities.map(entity => (
              <FormControlLabel
                key={entity.id}
                className={classes.row}
                control={
                  <Checkbox
                    color="primary"
                    checked={selected.has(entity.id)}
                    onChange={() => toggle(entity.id)}
                    disabled={running}
                    inputProps={{
                      'aria-label': entity.label,
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography className={classes.label}>
                      {entity.label}
                    </Typography>
                    {entity.detail && (
                      <Typography className={classes.detail}>
                        {entity.detail}
                      </Typography>
                    )}
                  </Box>
                }
              />
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button
          className={classes.primary}
          color="primary"
          variant="contained"
          disabled={running || selected.size === 0}
          onClick={handleSync}
          startIcon={<SyncIcon style={{ fontSize: 16 }} />}
        >
          {running ? 'Syncing…' : 'Sync now'}
        </Button>
        <Button
          className={classes.cancel}
          onClick={handleClose}
          disabled={running}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
