import { useState, useRef, useEffect, useCallback } from 'react';
import { Page, Header, HeaderTabs, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  makeStyles,
  Divider,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Link,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import BuildIcon from '@material-ui/icons/Build';
import LinkIcon from '@material-ui/icons/Link';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  sectionCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2.5),
  },
  prerequisiteStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 0),
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: 'rgba(0,102,204,0.15)',
    color: '#4DA3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
    marginTop: 2,
  },
  docLink: {
    color: '#4DA3FF',
    textDecoration: 'none',
    fontSize: 12,
    '&:hover': { textDecoration: 'underline' },
  },
  fieldGroup: {
    marginBottom: theme.spacing(2.5),
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
    lineHeight: 1.5,
  },
  testResult: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    fontSize: 12,
  },
  infoBox: {
    padding: '12px 16px',
    borderRadius: 8,
    backgroundColor: 'rgba(0,102,204,0.06)',
    border: '1px solid rgba(0,102,204,0.15)',
    marginBottom: 20,
  },
  setupOptionCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(3),
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    flex: 1,
    '&:hover': {
      borderColor: theme.palette.primary.light,
      boxShadow: `0 0 0 1px ${theme.palette.primary.light}`,
    },
  },
  stepper: {
    padding: theme.spacing(2, 0),
    backgroundColor: 'transparent',
  },
  wizardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(3),
  },
  connectedCard: {
    border: `1px solid rgba(99,153,61,0.3)`,
    borderRadius: 8,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    backgroundColor: 'rgba(99,153,61,0.04)',
  },
  connectedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 0),
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  dangerButton: {
    color: statusColors.error,
    borderColor: 'rgba(201,25,11,0.4)',
    '&:hover': {
      borderColor: statusColors.error,
      backgroundColor: 'rgba(201,25,11,0.08)',
    },
  },
  configRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5, 0),
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  configLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  configValue: {
    fontSize: 13,
    fontWeight: 500,
  },
  readOnlyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic',
  },
}));

// ---- Connection tab: Connected state ----

const ConnectionConnected = ({
  url,
  onRequestDisconnect,
}: {
  url: string;
  onRequestDisconnect: () => void;
}) => {
  const classes = useStyles();
  const [lastChecked, setLastChecked] = useState('Just now');
  const [rechecking, setRechecking] = useState(false);

  const handleRecheck = () => {
    setRechecking(true);
    setTimeout(() => {
      setRechecking(false);
      setLastChecked('Just now');
    }, 1200);
  };

  return (
    <>
      <Box className={classes.connectedCard}>
        <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: 16 }}>
          <CheckCircleIcon style={{ fontSize: 22, color: statusColors.success }} />
          <Typography style={{ fontSize: 16, fontWeight: 600 }}>
            Dev Spaces is connected
          </Typography>
        </Box>

        <Box className={classes.connectedRow}>
          <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Dashboard URL</Typography>
          <Typography style={{ fontSize: 13, fontFamily: 'monospace' }}>{url}</Typography>
        </Box>
        <Box className={classes.connectedRow}>
          <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Status</Typography>
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            {rechecking ? (
              <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Checking…</Typography>
            ) : (
              <>
                <CheckCircleOutlineIcon style={{ fontSize: 14, color: statusColors.success }} />
                <Typography style={{ fontSize: 13, color: statusColors.success }}>Reachable</Typography>
                <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>· {lastChecked}</Typography>
                <Button size="small" onClick={handleRecheck}
                  style={{ textTransform: 'none', fontSize: 11, minWidth: 0, padding: '0 4px', color: '#4DA3FF' }}>
                  Recheck
                </Button>
              </>
            )}
          </Box>
        </Box>
        <Box className={classes.connectedRow} style={{ borderBottom: 'none' }}>
          <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Authentication</Typography>
          <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            Handled by OpenShift OAuth (no portal credentials needed)
          </Typography>
        </Box>

        <Box display="flex" style={{ gap: 12, marginTop: 20 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
            onClick={() => window.open(`${url}/dashboard/#/workspaces`, '_blank')}
            style={{ textTransform: 'none', fontSize: 12 }}
          >
            Open dashboard
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.dangerButton}
            startIcon={<DeleteOutlineIcon style={{ fontSize: 14 }} />}
            onClick={onRequestDisconnect}
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
  );
};

// ---- Connection tab: Setup picker (not connected) ----

const SetupPicker = ({
  onChoose,
}: {
  onChoose: (path: 'existing' | 'template') => void;
}) => {
  const classes = useStyles();

  return (
    <>
      <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
        Connect Dev Spaces to the portal
      </Typography>
      <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 20 }}>
        OpenShift Dev Spaces gives developers browser-based VS Code environments with the Ansible
        extension and Lightspeed AI. Choose how to connect.
      </Typography>

      <Box style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Box className={classes.setupOptionCard} onClick={() => onChoose('existing')}>
          <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: 10 }}>
            <LinkIcon style={{ fontSize: 22, color: '#4DA3FF' }} />
            <Typography style={{ fontSize: 14, fontWeight: 600 }}>Connect existing instance</Typography>
          </Box>
          <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            Your OpenShift team already set up Dev Spaces.
            You have the dashboard URL and just need to paste it here.
          </Typography>
          <Typography style={{ fontSize: 11, color: '#4DA3FF', marginTop: 10, fontWeight: 500 }}>
            Takes about 30 seconds →
          </Typography>
        </Box>

        <Box className={classes.setupOptionCard} onClick={() => onChoose('template')}>
          <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: 10 }}>
            <BuildIcon style={{ fontSize: 22, color: '#4DA3FF' }} />
            <Typography style={{ fontSize: 14, fontWeight: 600 }}>Install on OpenShift</Typography>
            <Chip label="Preview" size="small" style={{ fontSize: 10, height: 18, backgroundColor: 'rgba(255,171,0,0.15)', color: '#FFAB00', fontWeight: 600 }} />
          </Box>
          <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            You have cluster-admin access. A guided setup installs
            the Operator, creates the instance, and connects automatically.
          </Typography>
          <Typography style={{ fontSize: 11, color: '#4DA3FF', marginTop: 10, fontWeight: 500 }}>
            Takes about 5 minutes →
          </Typography>
        </Box>
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
  );
};

// ---- Connect existing wizard ----

const CONNECT_STEPS = ['Enter URL', 'Verify', 'Connected'];

const ConnectExistingWizard = ({ onComplete, onCancel }: { onComplete: (url: string) => void; onCancel: () => void }) => {
  const classes = useStyles();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleNext = () => {
    if (step === 0 && url.trim()) {
      setStep(1);
      setTestStatus('testing');
      setTimeout(() => setTestStatus(url.trim() ? 'success' : 'error'), 1500);
    }
  };

  useEffect(() => {
    if (testStatus === 'success' && step === 1) {
      setTimeout(() => setStep(2), 800);
    }
  }, [testStatus, step]);

  return (
    <>
      <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 8 }}>
        <Button size="small" startIcon={<ArrowBackIcon style={{ fontSize: 14 }} />} onClick={onCancel}
          style={{ textTransform: 'none', fontSize: 12, minWidth: 0, color: 'rgba(255,255,255,0.5)' }}>Back</Button>
      </Box>
      <Typography style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Connect existing Dev Spaces instance</Typography>
      <Stepper activeStep={step} className={classes.stepper} alternativeLabel>
        {CONNECT_STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {step === 0 && (
        <>
          <Box className={classes.sectionCard}>
            <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Prerequisites</Typography>
            <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 16 }}>
              Before connecting, your OpenShift platform team must have:
            </Typography>
            <Box className={classes.prerequisiteStep}>
              <Box className={classes.stepNumber}>1</Box>
              <Box>
                <Typography style={{ fontSize: 13, fontWeight: 500 }}>Installed the OpenShift Dev Spaces Operator</Typography>
                <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Available in OperatorHub on any OpenShift 4.16+ cluster.
                </Typography>
                <a href="https://docs.redhat.com/en/documentation/red_hat_openshift_dev_spaces/3.27/html/administration_guide/assembly_installing-dev-spaces_administration_guide"
                  target="_blank" rel="noopener noreferrer" className={classes.docLink}>View installation guide →</a>
              </Box>
            </Box>
            <Box className={classes.prerequisiteStep}>
              <Box className={classes.stepNumber}>2</Box>
              <Box>
                <Typography style={{ fontSize: 13, fontWeight: 500 }}>Created a CheCluster instance</Typography>
                <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Provisions the Dev Spaces dashboard and workspace infrastructure.
                </Typography>
              </Box>
            </Box>
            <Box className={classes.prerequisiteStep} style={{ borderBottom: 'none' }}>
              <Box className={classes.stepNumber}>3</Box>
              <Box>
                <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                  Provided you with the dashboard URL
                  <Chip label="You are here" size="small" style={{ fontSize: 10, height: 18, marginLeft: 8, backgroundColor: 'rgba(0,102,204,0.15)', color: '#4DA3FF' }} />
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box className={classes.fieldGroup}>
            <Typography className={classes.fieldLabel}>Dev Spaces URL *</Typography>
            <TextField fullWidth variant="outlined" size="small" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://devspaces.apps.your-cluster.example.com" autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && url.trim()) handleNext(); }} />
            <Typography className={classes.helperText}>
              Usually looks like <code style={{ fontSize: 11 }}>https://devspaces.apps.&lt;cluster-domain&gt;</code>
            </Typography>
          </Box>
          <Box className={classes.infoBox}>
            <Typography style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Why only a URL?</Typography>
            <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
              The portal constructs redirect URLs — it doesn't call the Dev Spaces API.
              Authentication is handled by OpenShift OAuth in the developer's browser. No tokens or secrets needed.
            </Typography>
          </Box>
          <Box className={classes.wizardFooter}>
            <Button onClick={onCancel} style={{ textTransform: 'none', fontSize: 13 }}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleNext} disabled={!url.trim()}
              style={{ textTransform: 'none', fontSize: 13 }}>Test and connect</Button>
          </Box>
        </>
      )}

      {step === 1 && (
        <Box style={{ textAlign: 'center', padding: '48px 0' }}>
          {testStatus === 'testing' && (
            <>
              <LinearProgress style={{ marginBottom: 24, borderRadius: 2 }} />
              <Typography style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Verifying connection…</Typography>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Checking if the Dev Spaces dashboard is reachable at {url}</Typography>
            </>
          )}
          {testStatus === 'success' && (
            <>
              <CheckCircleIcon style={{ fontSize: 40, color: statusColors.success, marginBottom: 12 }} />
              <Typography style={{ fontSize: 14, fontWeight: 500, color: statusColors.success }}>Dashboard is reachable</Typography>
            </>
          )}
          {testStatus === 'error' && (
            <>
              <ErrorOutlineIcon style={{ fontSize: 40, color: statusColors.error, marginBottom: 12 }} />
              <Typography style={{ fontSize: 14, fontWeight: 500, color: statusColors.error, marginBottom: 8 }}>Could not reach the dashboard</Typography>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
                Check the URL and make sure the Dev Spaces dashboard is accessible from this network.
              </Typography>
              <Box display="flex" justifyContent="center" style={{ gap: 12 }}>
                <Button variant="outlined" onClick={() => { setStep(0); setTestStatus('idle'); }} style={{ textTransform: 'none', fontSize: 13 }}>Edit URL</Button>
                <Button variant="outlined" onClick={() => { setTestStatus('testing'); setTimeout(() => setTestStatus('success'), 1500); }}
                  style={{ textTransform: 'none', fontSize: 13 }}>Retry</Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {step === 2 && (
        <Box style={{ textAlign: 'center', padding: '48px 0' }}>
          <CheckCircleIcon style={{ fontSize: 48, color: statusColors.success, marginBottom: 16 }} />
          <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Dev Spaces is connected</Typography>
          <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
            "Edit in Dev Spaces" actions are now available on all projects.
            Developers can open browser-based workspaces directly from the portal.
          </Typography>
          <Typography style={{ fontSize: 12, fontFamily: 'monospace', color: '#4DA3FF', marginBottom: 24 }}>{url}</Typography>
          <Button variant="contained" color="primary" onClick={() => onComplete(url)} style={{ textTransform: 'none', fontSize: 13 }}>Done</Button>
        </Box>
      )}
    </>
  );
};

// ---- Install on OpenShift wizard ----

const INSTALL_STEPS = ['Cluster access', 'Options', 'Installing', 'Connected'];

const InstallWizard = ({ onComplete, onCancel }: { onComplete: (url: string) => void; onCancel: () => void }) => {
  const classes = useStyles();
  const [step, setStep] = useState(0);
  const [clusterUrl, setClusterUrl] = useState('');
  const [clusterToken, setClusterToken] = useState('');
  const [addAnsibleSample, setAddAnsibleSample] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const derivedUrl = `https://devspaces.apps.${clusterUrl.replace(/^https?:\/\/api\./, '').replace(/:6443$/, '')}`;

  const runInstall = useCallback(() => {
    const stages = [
      { pct: 15, label: 'Subscribing to Dev Spaces Operator…' },
      { pct: 35, label: 'Waiting for Operator to become ready…' },
      { pct: 55, label: 'Creating CheCluster instance…' },
      { pct: 70, label: addAnsibleSample ? 'Adding Ansible workspace sample…' : 'Waiting for Dev Spaces route…' },
      { pct: 85, label: 'Waiting for Dev Spaces route…' },
      { pct: 95, label: 'Verifying dashboard is reachable…' },
      { pct: 100, label: 'Done' },
    ];
    let i = 0;
    const tick = () => {
      if (i < stages.length) {
        setProgress(stages[i].pct);
        setProgressLabel(stages[i].label);
        i++;
        setTimeout(tick, 600 + Math.random() * 400);
      } else {
        setTimeout(() => setStep(3), 500);
      }
    };
    tick();
  }, [addAnsibleSample]);

  useEffect(() => {
    if (step === 2) runInstall();
  }, [step, runInstall]);

  return (
    <>
      <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 8 }}>
        {step < 2 && (
          <Button size="small" startIcon={<ArrowBackIcon style={{ fontSize: 14 }} />}
            onClick={step === 0 ? onCancel : () => setStep(step - 1)}
            style={{ textTransform: 'none', fontSize: 12, minWidth: 0, color: 'rgba(255,255,255,0.5)' }}>Back</Button>
        )}
      </Box>
      <Typography style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Install Dev Spaces on OpenShift</Typography>
      <Stepper activeStep={step} className={classes.stepper} alternativeLabel>
        {INSTALL_STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {step === 0 && (
        <>
          <Box className={classes.fieldGroup}>
            <Typography className={classes.fieldLabel}>OpenShift API URL *</Typography>
            <TextField fullWidth variant="outlined" size="small" value={clusterUrl} onChange={e => setClusterUrl(e.target.value)}
              placeholder="https://api.cluster.example.com:6443" autoFocus />
            <Typography className={classes.helperText}>
              The API endpoint of your OpenShift cluster (from <code style={{ fontSize: 11 }}>oc whoami --show-server</code>).
            </Typography>
          </Box>
          <Box className={classes.fieldGroup}>
            <Typography className={classes.fieldLabel}>Cluster admin token *</Typography>
            <TextField fullWidth variant="outlined" size="small" type="password" value={clusterToken}
              onChange={e => setClusterToken(e.target.value)} placeholder="sha256~..." />
            <Typography className={classes.helperText}>
              A token with cluster-admin privileges (from <code style={{ fontSize: 11 }}>oc whoami -t</code>). Used only during setup — not stored by the portal.
            </Typography>
          </Box>
          <Box style={{ padding: '10px 14px', borderRadius: 6, backgroundColor: 'rgba(255,171,0,0.06)', border: '1px solid rgba(255,171,0,0.2)' }}>
            <Typography style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
              <strong>Requires cluster-admin.</strong> This template creates namespaces and installs an Operator. If you don't have this access, use "Connect existing instance" instead.
            </Typography>
          </Box>
          <Box className={classes.wizardFooter}>
            <Button onClick={onCancel} style={{ textTransform: 'none', fontSize: 13 }}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={() => setStep(1)} disabled={!clusterUrl.trim() || !clusterToken.trim()}
              style={{ textTransform: 'none', fontSize: 13 }}>Next</Button>
          </Box>
        </>
      )}

      {step === 1 && (
        <>
          <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 20 }}>
            Configure what the setup template will install on your cluster.
          </Typography>
          <FormControlLabel control={<Checkbox checked color="primary" size="small" disabled />}
            label={<Box>
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>Install Dev Spaces Operator
                <Chip label="Required" size="small" style={{ fontSize: 10, height: 18, marginLeft: 8, backgroundColor: 'rgba(0,102,204,0.15)', color: '#4DA3FF' }} />
              </Typography>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Subscribes to the Operator via OLM and creates a CheCluster instance.</Typography>
            </Box>} style={{ alignItems: 'flex-start', marginLeft: 0, marginBottom: 16 }} />
          <FormControlLabel control={<Checkbox checked={addAnsibleSample} onChange={(_, v) => setAddAnsibleSample(v)} color="primary" size="small" />}
            label={<Box>
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>Add Ansible workspace sample</Typography>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Adds a getting-started card in the Dev Spaces dashboard with VS Code, the Ansible extension, and Lightspeed AI pre-configured.
              </Typography>
            </Box>} style={{ alignItems: 'flex-start', marginLeft: 0, marginBottom: 16 }} />
          <Divider style={{ margin: '8px 0 16px' }} />
          <Typography style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>What will happen</Typography>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {['Subscribe to the OpenShift Dev Spaces Operator in OperatorHub', 'Create a CheCluster custom resource with default settings',
              addAnsibleSample ? 'Add an Ansible workspace sample with VS Code + Ansible extension' : null,
              'Wait for the Dev Spaces route to become available', 'Verify the dashboard and save the connection automatically',
            ].filter(Boolean).map((item, i) => (
              <Typography key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{i + 1}. {item}</Typography>
            ))}
          </Box>
          <Box className={classes.wizardFooter}>
            <Button onClick={() => setStep(0)} style={{ textTransform: 'none', fontSize: 13 }}>Back</Button>
            <Button variant="contained" color="primary" startIcon={<PlayArrowIcon style={{ fontSize: 16 }} />}
              onClick={() => setStep(2)} style={{ textTransform: 'none', fontSize: 13 }}>Start installation</Button>
          </Box>
        </>
      )}

      {step === 2 && (
        <Box style={{ padding: '48px 0' }}>
          <LinearProgress variant="determinate" value={progress} style={{ marginBottom: 24, borderRadius: 2, height: 6 }} />
          <Typography style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, textAlign: 'center' }}>Installing Dev Spaces…</Typography>
          <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{progressLabel}</Typography>
        </Box>
      )}

      {step === 3 && (
        <Box style={{ textAlign: 'center', padding: '48px 0' }}>
          <CheckCircleIcon style={{ fontSize: 48, color: statusColors.success, marginBottom: 16 }} />
          <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Dev Spaces is installed and connected</Typography>
          <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 12px' }}>
            The Operator is installed, the CheCluster instance is running
            {addAnsibleSample ? ', the Ansible workspace sample is available,' : ''}
            {' '}and the portal is connected. "Edit in Dev Spaces" actions are now live on all projects.
          </Typography>
          <Typography style={{ fontSize: 12, fontFamily: 'monospace', color: '#4DA3FF', marginBottom: 24 }}>{derivedUrl}</Typography>
          <Button variant="contained" color="primary" onClick={() => onComplete(derivedUrl)} style={{ textTransform: 'none', fontSize: 13 }}>Done</Button>
        </Box>
      )}
    </>
  );
};

// ---- Configuration tab ----

const ConfigurationTab = ({ url, connected }: { url: string; connected: boolean }) => {
  const classes = useStyles();

  if (!connected) {
    return (
      <Box style={{ textAlign: 'center', padding: '64px 24px' }}>
        <BuildIcon style={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }} />
        <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
          Not connected
        </Typography>
        <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 420, margin: '0 auto 16px' }}>
          Connect to a Dev Spaces instance first. Once connected, this tab will show:
        </Typography>
        <Box style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
          {[
            'Workspace limits — max running workspaces, idle and run timeouts',
            'Resource quotas — CPU, memory, and storage per workspace',
            'Workspace samples — getting-started templates available to developers',
          ].map((item, i) => (
            <Box key={i} display="flex" alignItems="flex-start" style={{ gap: 8 }}>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>•</Typography>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{item}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <>
      {/* Workspace limits */}
      <Box className={classes.sectionCard}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" style={{ marginBottom: 16 }}>
          <Box>
            <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              Workspace limits
            </Typography>
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              Controls how many workspaces each developer can run and how long they stay active.
              Configured in the CheCluster custom resource on OpenShift.
            </Typography>
          </Box>
          <Box className={classes.readOnlyBadge}>
            <InsertDriveFileOutlinedIcon style={{ fontSize: 12 }} />
            Read-only
          </Box>
        </Box>

        <Box className={classes.configRow}>
          <Typography className={classes.configLabel}>Running workspaces per user</Typography>
          <Typography className={classes.configValue}>3</Typography>
        </Box>
        <Box className={classes.configRow}>
          <Typography className={classes.configLabel}>Idle timeout</Typography>
          <Typography className={classes.configValue}>30 minutes</Typography>
        </Box>
        <Box className={classes.configRow}>
          <Typography className={classes.configLabel}>Run timeout</Typography>
          <Typography className={classes.configValue}>12 hours</Typography>
        </Box>
        <Box className={classes.configRow} style={{ borderBottom: 'none' }}>
          <Typography className={classes.configLabel}>Storage strategy</Typography>
          <Typography className={classes.configValue}>per-user (PVC)</Typography>
        </Box>
      </Box>

      {/* Resource quotas */}
      <Box className={classes.sectionCard}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" style={{ marginBottom: 16 }}>
          <Box>
            <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              Resource quotas
            </Typography>
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              Default CPU and memory limits applied to each workspace container.
            </Typography>
          </Box>
          <Box className={classes.readOnlyBadge}>
            <InsertDriveFileOutlinedIcon style={{ fontSize: 12 }} />
            Read-only
          </Box>
        </Box>

        <Box className={classes.configRow}>
          <Typography className={classes.configLabel}>CPU request / limit</Typography>
          <Typography className={classes.configValue}>500m / 2 cores</Typography>
        </Box>
        <Box className={classes.configRow}>
          <Typography className={classes.configLabel}>Memory request / limit</Typography>
          <Typography className={classes.configValue}>1 Gi / 4 Gi</Typography>
        </Box>
        <Box className={classes.configRow} style={{ borderBottom: 'none' }}>
          <Typography className={classes.configLabel}>Storage per workspace</Typography>
          <Typography className={classes.configValue}>10 Gi</Typography>
        </Box>
      </Box>

      {/* Workspace samples */}
      <Box className={classes.sectionCard}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" style={{ marginBottom: 16 }}>
          <Box>
            <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              Workspace samples
            </Typography>
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              Getting-started templates available in the Dev Spaces dashboard. Developers see these when
              creating a new workspace without a Git URL.
            </Typography>
          </Box>
          <Box className={classes.readOnlyBadge}>
            <InsertDriveFileOutlinedIcon style={{ fontSize: 12 }} />
            Read-only
          </Box>
        </Box>

        <Box className={classes.configRow}>
          <Box>
            <Typography className={classes.configValue}>Ansible Automation</Typography>
            <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              VS Code + Ansible extension + Lightspeed AI
            </Typography>
          </Box>
          <Chip label="Active" size="small" style={{ fontSize: 10, height: 20, backgroundColor: 'rgba(99,153,61,0.15)', color: statusColors.success }} />
        </Box>
        <Box className={classes.configRow}>
          <Box>
            <Typography className={classes.configValue}>Python</Typography>
            <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>VS Code + Python extension</Typography>
          </Box>
          <Chip label="Active" size="small" style={{ fontSize: 10, height: 20, backgroundColor: 'rgba(99,153,61,0.15)', color: statusColors.success }} />
        </Box>
        <Box className={classes.configRow} style={{ borderBottom: 'none' }}>
          <Box>
            <Typography className={classes.configValue}>Go</Typography>
            <Typography style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>VS Code + Go extension</Typography>
          </Box>
          <Chip label="Active" size="small" style={{ fontSize: 10, height: 20, backgroundColor: 'rgba(99,153,61,0.15)', color: statusColors.success }} />
        </Box>
      </Box>

      {/* Read-only explanation */}
      <Box className={classes.infoBox}>
        <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
          These settings are read from the CheCluster custom resource on OpenShift.
          To change them, open the{' '}
          <Link
            href={`${url}/dashboard/#/admin`}
            target="_blank"
            rel="noopener"
            style={{ color: '#4DA3FF', fontWeight: 500 }}
          >
            Dev Spaces admin dashboard
          </Link>
          {' '}or edit the CheCluster CR directly.
        </Typography>
      </Box>
    </>
  );
};

// ---- Main page with HeaderTabs ----

const TABS = [
  { id: 'connection', label: 'Connection' },
  { id: 'configuration', label: 'Configuration' },
];

export const DevSpacesDetailPage = () => {
  const [connected, setConnected] = useState(true);
  const [savedUrl, setSavedUrl] = useState('https://devspaces.apps.example.com');
  const [wizardMode, setWizardMode] = useState<'none' | 'existing' | 'template'>('none');
  const [selectedTab, setSelectedTab] = useState(0);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [kebabAnchor, setKebabAnchor] = useState<null | HTMLElement>(null);

  const handleConnect = (url: string) => {
    setSavedUrl(url);
    setConnected(true);
    setWizardMode('none');
  };

  const handleDisconnect = () => {
    setConnected(false);
    setSavedUrl('');
    setWizardMode('none');
    setSelectedTab(0);
  };

  const openDisconnectDialog = () => {
    setKebabAnchor(null);
    setDisconnectOpen(true);
  };

  const activeTab = TABS[selectedTab]?.id ?? 'connection';

  return (
    <Page themeId="app">
      <Header
        title="OpenShift Dev Spaces"
        pageTitleOverride="OpenShift Dev Spaces"
        type="Integrations"
        typeLink="/self-service/admin/integrations"
        subtitle="Browser-based development environments for automation content"
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Tooltip title={connected ? 'Dev Spaces is connected and available to developers.' : 'Dev Spaces has not been configured yet.'} arrow>
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
          {connected && (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                onClick={() => window.open(`${savedUrl}/dashboard/#/admin`, '_blank')}
                style={{ textTransform: 'none', fontSize: 12, borderColor: 'currentColor', color: 'inherit', opacity: 0.8 }}
              >
                Admin dashboard
              </Button>
              <IconButton
                size="small"
                onClick={e => setKebabAnchor(e.currentTarget)}
                style={{ color: 'inherit', opacity: 0.7 }}
              >
                <MoreVertIcon style={{ fontSize: 20 }} />
              </IconButton>
              <Menu
                anchorEl={kebabAnchor}
                open={Boolean(kebabAnchor)}
                onClose={() => setKebabAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                getContentAnchorEl={null}
              >
                <MenuItem onClick={openDisconnectDialog}>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <DeleteOutlineIcon style={{ fontSize: 18, color: statusColors.error }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Disconnect Dev Spaces"
                    primaryTypographyProps={{ style: { fontSize: 13, color: statusColors.error } }}
                  />
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Header>
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={setSelectedTab}
        tabs={TABS}
      />
      <Content>
        <Box style={{ maxWidth: 720 }}>
          {activeTab === 'connection' && (
            <>
              {connected && wizardMode === 'none' && (
                <ConnectionConnected url={savedUrl} onRequestDisconnect={openDisconnectDialog} />
              )}
              {!connected && wizardMode === 'none' && (
                <SetupPicker onChoose={setWizardMode} />
              )}
              {wizardMode === 'existing' && (
                <ConnectExistingWizard onComplete={handleConnect} onCancel={() => setWizardMode('none')} />
              )}
              {wizardMode === 'template' && (
                <InstallWizard onComplete={handleConnect} onCancel={() => setWizardMode('none')} />
              )}
            </>
          )}
          {activeTab === 'configuration' && (
            <ConfigurationTab url={savedUrl} connected={connected} />
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
            onClick={() => { setDisconnectOpen(false); handleDisconnect(); }}
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
