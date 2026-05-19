import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  makeStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Link,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  infoBox: {
    padding: '12px 16px',
    borderRadius: 8,
    backgroundColor: 'rgba(0,102,204,0.06)',
    border: '1px solid rgba(0,102,204,0.15)',
    marginBottom: 20,
  },
  connectedCard: {
    border: `1px solid rgba(99,153,61,0.3)`,
    borderRadius: 8,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    backgroundColor: 'rgba(99,153,61,0.04)',
  },
  dangerButton: {
    color: statusColors.error,
    borderColor: 'rgba(201,25,11,0.4)',
    '&:hover': {
      borderColor: statusColors.error,
      backgroundColor: 'rgba(201,25,11,0.08)',
    },
  },
}));

export const DevSpacesDetailPage = () => {
  const classes = useStyles();
  const [connected, setConnected] = useState(true);
  const [savedUrl, setSavedUrl] = useState('https://devspaces.apps.example.com');
  const [urlInput, setUrlInput] = useState('');
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const handleSave = () => {
    if (urlInput.trim()) {
      setSavedUrl(urlInput.trim());
      setConnected(true);
      setUrlInput('');
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setSavedUrl('');
    setDisconnectOpen(false);
  };

  return (
    <Page themeId="app">
      <Header
        title="OpenShift Dev Spaces"
        pageTitleOverride="OpenShift Dev Spaces"
        type="Integrations"
        typeLink="/self-service/admin/integrations"
        subtitle="Browser-based development environments for automation content"
      >
        <Tooltip
          title={connected ? 'Dev Spaces is connected and available to developers.' : 'Dev Spaces has not been configured yet.'}
          arrow
        >
          <Chip
            label={connected ? 'Connected' : 'Not connected'}
            size="small"
            style={{
              fontSize: 11,
              height: 22,
              fontWeight: 500,
              backgroundColor: connected ? 'rgba(99,153,61,0.15)' : 'rgba(255,255,255,0.08)',
              color: connected ? statusColors.success : 'rgba(255,255,255,0.5)',
            }}
          />
        </Tooltip>
      </Header>
      <Content>
        <Box style={{ maxWidth: 620 }}>
          {connected ? (
            <>
              <Box className={classes.connectedCard}>
                <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: 16 }}>
                  <CheckCircleIcon style={{ fontSize: 22, color: statusColors.success }} />
                  <Typography style={{ fontSize: 16, fontWeight: 600 }}>
                    Dev Spaces is connected
                  </Typography>
                </Box>

                <Box style={{ marginBottom: 16 }}>
                  <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                    Dashboard URL
                  </Typography>
                  <Typography style={{ fontSize: 13, fontFamily: 'monospace' }}>
                    {savedUrl}
                  </Typography>
                </Box>

                <Box display="flex" style={{ gap: 12 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                    onClick={() => window.open(`${savedUrl}/dashboard/#/workspaces`, '_blank')}
                    style={{ textTransform: 'none', fontSize: 12 }}
                  >
                    Open dashboard
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    className={classes.dangerButton}
                    startIcon={<DeleteOutlineIcon style={{ fontSize: 14 }} />}
                    onClick={() => setDisconnectOpen(true)}
                    style={{ textTransform: 'none', fontSize: 12 }}
                  >
                    Disconnect
                  </Button>
                </Box>
              </Box>

              <Box className={classes.infoBox}>
                <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
                  <strong>Operator updates:</strong> The Dev Spaces Operator is managed directly in
                  OpenShift via OLM (Operator Lifecycle Manager). Version upgrades are not handled
                  through the portal.
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Connect Dev Spaces to the portal
              </Typography>
              <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 24 }}>
                Connect your OpenShift Dev Spaces instance to enable browser-based editing directly from projects in the portal.
              </Typography>

              <Box style={{ marginBottom: 24 }}>
                <Typography style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Dev Spaces URL
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://devspaces.apps.your-cluster.example.com"
                  onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) handleSave(); }}
                />
                <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>
                  The portal uses this URL to construct redirect links — no API calls or credentials are needed.
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={!urlInput.trim()}
                style={{ textTransform: 'none', fontSize: 13, marginBottom: 24 }}
              >
                Save
              </Button>

              <Box className={classes.infoBox}>
                <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
                  <strong>Don't have Dev Spaces?</strong> Ask your OpenShift platform team to install
                  the Dev Spaces Operator.{' '}
                  <Link
                    href="https://docs.redhat.com/en/documentation/red_hat_openshift_dev_spaces/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4DA3FF', fontWeight: 500 }}
                  >
                    Learn how to set it up on OpenShift →
                  </Link>
                </Typography>
              </Box>

              <Typography style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                What this enables for developers
              </Typography>
              <Box style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  '"Edit in Dev Spaces" actions in project kebab menus and detail pages',
                  'Deep links from quality violations to the exact file and line in Dev Spaces',
                  '"Dev Spaces dashboard" link from project sidebars',
                ].map((item, i) => (
                  <Box key={i} display="flex" alignItems="flex-start" style={{ gap: 8 }}>
                    <CheckCircleOutlineIcon style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 2, flexShrink: 0 }} />
                    <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Content>

      <Dialog open={disconnectOpen} onClose={() => setDisconnectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontSize: 16 }}>Disconnect Dev Spaces?</DialogTitle>
        <DialogContent>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {[
              '"Edit in Dev Spaces" actions will no longer appear on projects.',
              'Deep links from quality violations will be removed.',
              '"Dev Spaces dashboard" links will be removed from project sidebars.',
            ].map((c, i) => (
              <Box key={i} display="flex" alignItems="flex-start" style={{ gap: 8 }}>
                <Typography style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>•</Typography>
                <Typography style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>{c}</Typography>
              </Box>
            ))}
          </Box>
          <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            This does not uninstall the Dev Spaces Operator from OpenShift. You can reconnect at any time.
          </Typography>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'flex-start', padding: '16px 24px' }}>
          <Button
            variant="contained"
            onClick={handleDisconnect}
            style={{ textTransform: 'none', backgroundColor: statusColors.error, color: '#fff' }}
          >
            Disconnect
          </Button>
          <Button onClick={() => setDisconnectOpen(false)} style={{ textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
};
