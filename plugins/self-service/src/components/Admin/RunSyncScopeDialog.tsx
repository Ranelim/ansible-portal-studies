import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';
import { DEMO_CONNECTIONS } from './syncDemoData';

const SYNCABLE = DEMO_CONNECTIONS.filter(c => c.status === 'Active');

type RunSyncScopeDialogProps = {
  open: boolean;
  onClose: () => void;
  onStarted?: (selectedIds: string[]) => void;
};

/**
 * Opt 2 — explicit sync scope before running (no opaque Sync all on a history page).
 */
export const RunSyncScopeDialog = ({
  open,
  onClose,
  onStarted,
}: RunSyncScopeDialogProps) => {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(SYNCABLE.map(c => c.id)),
  );
  const [running, setRunning] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRun = () => {
    if (selected.size === 0 || running) return;
    setRunning(true);
    const ids = Array.from(selected);
    window.setTimeout(() => {
      setRunning(false);
      onStarted?.(ids);
      onClose();
    }, 1800);
  };

  return (
    <Dialog open={open} onClose={running ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle disableTypography>
        <Typography variant="h6" style={{ fontSize: 16, fontWeight: 600 }}>
          Run sync
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginTop: 4 }}>
          Choose which connections to sync. Activity updates appear in the log below.
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column">
          {SYNCABLE.map(c => (
            <FormControlLabel
              key={c.id}
              control={
                <Checkbox
                  color="primary"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  disabled={running}
                />
              }
              label={
                <Box>
                  <Typography style={{ fontSize: 14, fontWeight: 500 }}>
                    {c.name.replace(/ \(.*\)/, '')}
                  </Typography>
                  {c.host && (
                    <Typography variant="caption" color="textSecondary">
                      {c.host}
                    </Typography>
                  )}
                </Box>
              }
            />
          ))}
          {SYNCABLE.length === 0 && (
            <Typography color="textSecondary" variant="body2">
              No connected integrations. Configure them under Integrations first.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions style={{ padding: '12px 16px' }}>
        <Button
          onClick={onClose}
          disabled={running}
          style={{ textTransform: 'none', borderRadius: 20 }}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          variant="contained"
          disabled={running || selected.size === 0}
          onClick={handleRun}
          startIcon={
            running ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <SyncIcon style={{ fontSize: 16 }} />
            )
          }
          style={{ textTransform: 'none', borderRadius: 20 }}
        >
          {running
            ? 'Syncing…'
            : `Sync ${selected.size} connection${selected.size === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
