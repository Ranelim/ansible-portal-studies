import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
} from '@material-ui/core';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import CloseIcon from '@material-ui/icons/Close';
import SyncIcon from '@material-ui/icons/Sync';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
export type SyncEntityStatus = {
  source: string;
  entity: string;
  lastSync?: string;
  lastSyncDuration?: string;
  interval?: string;
  errorDetail?: string;
  errorTrace?: string;
  providerId?: string;
};
import { statusColors } from '../common/statusColors';

type SyncErrorModalProps = {
  entity: SyncEntityStatus | null;
  open: boolean;
  onClose: () => void;
};

export const SyncErrorModal = ({ entity, open, onClose }: SyncErrorModalProps) => {
  const [retrying, setRetrying] = useState(false);

  if (!entity) return null;

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#1e1e1e',
          backgroundImage: 'none',
          borderRadius: 8,
          maxWidth: 560,
        },
      }}
    >
      <DialogTitle
        disableTypography
        style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <Box display="flex" alignItems="center" style={{ gap: 10 }}>
          <ErrorOutlineIcon style={{ fontSize: 20, color: statusColors.error }} />
          <Box>
            <Typography style={{ fontSize: 15, fontWeight: 600 }}>
              Sync failed
            </Typography>
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {entity.source} — {entity.entity}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} style={{ padding: 4, marginTop: -2 }}>
          <CloseIcon style={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent style={{ padding: '16px 20px' }}>
        {entity.lastSync && (
          <Box display="flex" style={{ gap: 16, marginBottom: 16 }}>
            <Box>
              <Typography style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                Last attempt
              </Typography>
              <Typography style={{ fontSize: 13 }}>
                {entity.lastSync}
                {entity.lastSyncDuration && ` (${entity.lastSyncDuration})`}
              </Typography>
            </Box>
            <Box>
              <Typography style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                Schedule
              </Typography>
              <Typography style={{ fontSize: 13 }}>{entity.interval}</Typography>
            </Box>
          </Box>
        )}

        {entity.errorDetail && (
          <Box style={{ marginBottom: 12 }}>
            <Typography style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
              Error
            </Typography>
            <Typography style={{ fontSize: 13, color: statusColors.error, lineHeight: 1.5 }}>
              {entity.errorDetail}
            </Typography>
          </Box>
        )}

        {entity.errorTrace && (
          <Box
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              border: '1px solid rgba(244,67,54,0.2)',
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.7)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowX: 'auto',
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {entity.errorTrace}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions style={{ padding: '12px 20px', justifyContent: 'space-between' }}>
        <Button
          size="small"
          startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
          href={`/self-service/admin/integrations/${entity.providerId}?tab=sync`}
          style={{ textTransform: 'none', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
        >
          Go to {entity.source} settings
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<SyncIcon style={{ fontSize: 14 }} />}
          onClick={handleRetry}
          disabled={retrying}
          style={{ textTransform: 'none', fontSize: 13 }}
        >
          {retrying ? 'Retrying...' : 'Retry sync'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
