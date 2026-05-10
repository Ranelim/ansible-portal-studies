import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Page,
  Header,
  HeaderTabs,
  Content,
} from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  makeStyles,
  TextField,
  Switch,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  Radio,
  RadioGroup,
  Collapse,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import AddIcon from '@material-ui/icons/Add';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  DEMO_CONNECTIONS,
  DEMO_SYNC_SCHEDULES,
  ConnectionProvider,
} from './syncDemoData';
import { useRestartRequired } from './RestartContext';
import { statusColors } from '../common/statusColors';
import SyncIcon from '@material-ui/icons/Sync';
import {
  Select,
  MenuItem as MuiMenuItem,
} from '@material-ui/core';

const useStyles = makeStyles(theme => ({
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
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 8,
  },
  sectionCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2.5),
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: theme.spacing(2),
  },
  orgCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 6,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  orgHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  fieldRow: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap' as const,
  },
  fieldRowItem: {
    flex: 1,
    minWidth: 120,
  },
  stickyFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
  },
  stickyFooterFixed: {
    position: 'fixed' as const,
    bottom: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    zIndex: 100,
    backdropFilter: 'blur(8px)',
  },
  scheduleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': { borderBottom: 'none' },
  },
}));

const StickyFooter = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [leftOffset, setLeftOffset] = useState(0);

  const measure = useCallback(() => {
    if (sentinelRef.current) {
      setLeftOffset(sentinelRef.current.getBoundingClientRect().left);
    }
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const stuck = !entry.isIntersecting;
        setIsStuck(stuck);
        if (stuck) measure();
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return (
    <>
      {isStuck && (
        <Box className={classes.stickyFooterFixed} style={{ left: leftOffset, right: 0 }}>
          {children}
        </Box>
      )}
      <Box ref={sentinelRef as any} className={classes.stickyFooter} style={isStuck ? { visibility: 'hidden' } : undefined}>
        {children}
      </Box>
    </>
  );
};

const providerDescription = (id: string): string => {
  switch (id) {
    case 'aap':
      return 'Provides job templates, user and team sync, and OAuth-based authentication for the portal.';
    case 'pah':
      return 'Syncs collections, execution environments, and roles from your private content hub.';
    case 'github':
      return 'Imports repositories containing playbooks, roles, and automation projects from GitHub.';
    case 'gitlab':
      return 'Imports repositories containing playbooks, roles, and automation projects from GitLab.';
    case 'registries':
      return 'Indexes certified and validated content from Ansible Galaxy and Red Hat public registries.';
    default:
      return '';
  }
};


// ---------------------------------------------------------------------------
// Disconnect section — tiered by risk
// ---------------------------------------------------------------------------

type DisconnectRisk = 'low' | 'medium' | 'high';

interface DisconnectConfig {
  risk: DisconnectRisk;
  title: string;
  consequences: string[];
  reassurance?: string;
  confirmName?: string;
}

const disconnectConfigs: Record<string, DisconnectConfig> = {
  aap: {
    risk: 'high',
    title: 'Disconnect Ansible Automation Platform?',
    consequences: [
      'OAuth-based login will stop working — users will not be able to sign in.',
      'Job template sync will stop. Existing templates remain but will go stale.',
      'User and team sync from AAP organizations will stop.',
    ],
    reassurance: 'Credentials and configuration are removed from the portal only. Your AAP Controller is not affected. You can reconnect at any time.',
    confirmName: 'Ansible Automation Platform',
  },
  pah: {
    risk: 'medium',
    title: 'Disconnect Private Automation Hub?',
    consequences: [
      'Collection and execution environment sync will stop.',
      'Existing content remains in the catalog but will not receive updates.',
    ],
    reassurance: 'Your Private Automation Hub is not affected. You can reconnect at any time.',
  },
  github: {
    risk: 'medium',
    title: 'Disconnect GitHub?',
    consequences: [
      'Repository scanning and import will stop.',
      'Existing projects remain in the catalog but will not receive updates.',
    ],
    reassurance: 'Your GitHub repositories are not affected. You can reconnect at any time.',
  },
  gitlab: {
    risk: 'medium',
    title: 'Disconnect GitLab?',
    consequences: [
      'Repository scanning and import will stop.',
      'Existing projects remain in the catalog but will not receive updates.',
    ],
    reassurance: 'Your GitLab repositories are not affected. You can reconnect at any time.',
  },
  registries: {
    risk: 'low',
    title: 'Disconnect public registries?',
    consequences: [
      'Public content indexing will stop. Existing collection entries remain but will go stale.',
    ],
    reassurance: 'You can re-enable registries at any time.',
  },
};

const DisconnectSection = ({
  providerId,
  providerName,
  isConfigured,
  onDisconnect,
}: {
  providerId: string;
  providerName: string;
  isConfigured: boolean;
  onDisconnect: () => void;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typedName, setTypedName] = useState('');

  if (!isConfigured) return null;

  const config = disconnectConfigs[providerId] ?? {
    risk: 'low' as DisconnectRisk,
    title: `Disconnect ${providerName}?`,
    consequences: ['This integration will be removed from the portal.'],
    reassurance: 'You can reconnect at any time.',
  };

  const canConfirm = config.risk === 'high'
    ? typedName === config.confirmName
    : true;

  return (
    <>
      <Divider style={{ margin: '24px 0 20px' }} />
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography style={{ fontSize: 13, fontWeight: 500, color: statusColors.error }}>
            Disconnect this integration
          </Typography>
          <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            Remove credentials and stop all sync from {providerName}.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DeleteOutlineIcon style={{ fontSize: 14 }} />}
          onClick={() => { setConfirmOpen(true); setTypedName(''); }}
          style={{
            textTransform: 'none',
            fontSize: 12,
            flexShrink: 0,
            marginLeft: 16,
            borderColor: 'rgba(201,25,11,0.4)',
            color: statusColors.error,
          }}
        >
          Disconnect
        </Button>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontSize: 16 }}>{config.title}</DialogTitle>
        <DialogContent>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {config.consequences.map((c, i) => (
              <Box key={i} display="flex" alignItems="flex-start" style={{ gap: 8 }}>
                <Typography style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
                  •
                </Typography>
                <Typography style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
                  {c}
                </Typography>
              </Box>
            ))}
          </Box>
          {config.reassurance && (
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: config.risk === 'high' ? 16 : 0 }}>
              {config.reassurance}
            </Typography>
          )}
          {config.risk === 'high' && config.confirmName && (
            <Box style={{ marginTop: 4 }}>
              <Typography style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                Type <strong>{config.confirmName}</strong> to confirm
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder={config.confirmName}
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                inputProps={{ style: { fontSize: 13 } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions style={{ justifyContent: 'flex-start', padding: '16px 24px' }}>
          <Button
            variant="contained"
            disabled={!canConfirm}
            onClick={() => { setConfirmOpen(false); onDisconnect(); }}
            style={{
              textTransform: 'none',
              backgroundColor: canConfirm ? statusColors.error : undefined,
              color: canConfirm ? '#fff' : undefined,
            }}
          >
            Disconnect
          </Button>
          <Button onClick={() => setConfirmOpen(false)} style={{ textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ---------------------------------------------------------------------------
// Connection Tab content per provider type
// ---------------------------------------------------------------------------

const AAPConnectionTab = ({ provider, onSave, onDisconnect }: { provider: ConnectionProvider; onSave: () => void; onDisconnect: () => void }) => {
  const classes = useStyles();
  const isConfigured = provider.status !== 'Not configured';

  return (
    <>
      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>AAP Controller URL *</Typography>
        <TextField fullWidth variant="outlined" size="small"
          defaultValue={isConfigured ? `https://${provider.host}` : ''}
          placeholder="https://aap.example.com"
          disabled={isConfigured}
          InputProps={isConfigured ? { style: { opacity: 0.6 } } : undefined}
        />
        {isConfigured && (
          <Box display="flex" alignItems="center" style={{ gap: 4, marginTop: 4 }}>
            <InsertDriveFileOutlinedIcon style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
              Set in configuration file
            </Typography>
          </Box>
        )}
      </Box>
      <FormControlLabel
        control={<Checkbox defaultChecked color="primary" size="small" />}
        label={<Typography style={{ fontSize: 13 }}>Verify TLS certificate</Typography>}
        style={{ marginBottom: 16, display: 'flex' }}
      />
      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>Admin Personal Access Token *</Typography>
        <TextField fullWidth variant="outlined" size="small" type="password"
          defaultValue={isConfigured ? '••••••••••' : ''} placeholder="Enter access token" />
        <Typography className={classes.helperText}>Required for API access and content sync.</Typography>
      </Box>
      <Divider style={{ margin: '8px 0 16px' }} />
      <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>OAuth Credentials</Typography>
      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>OAuth Client ID *</Typography>
        <TextField fullWidth variant="outlined" size="small"
          defaultValue={isConfigured ? 'portal-oauth-app' : ''} placeholder="Enter Client ID" />
      </Box>
      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>OAuth Client Secret *</Typography>
        <TextField fullWidth variant="outlined" size="small" type="password"
          defaultValue={isConfigured ? '••••••••••' : ''} placeholder="Enter secret" />
      </Box>
      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>
          {isConfigured ? 'Test connection' : 'Cancel'}
        </Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>
          {isConfigured ? 'Save changes' : 'Connect'}
        </Button>
      </StickyFooter>
      <DisconnectSection providerId={provider.id} providerName={provider.name} isConfigured={isConfigured} onDisconnect={onDisconnect} />
    </>
  );
};

const PAHConnectionTab = ({ provider, onSave, onDisconnect }: { provider: ConnectionProvider; onSave: () => void; onDisconnect: () => void }) => {
  const classes = useStyles();
  const [inherit, setInherit] = useState(true);
  const isConfigured = provider.status !== 'Not configured';
  return (
    <>
      <FormControlLabel
        control={<Checkbox checked={inherit} onChange={(_, v) => setInherit(v)} color="primary" size="small" />}
        label={<Typography style={{ fontSize: 13 }}>Use AAP connection (same host and credentials)</Typography>}
        style={{ marginBottom: 16, display: 'flex' }}
      />
      {!inherit && (
        <>
          <Box className={classes.fieldGroup}>
            <Typography className={classes.fieldLabel}>Private Automation Hub URL *</Typography>
            <TextField fullWidth variant="outlined" size="small" placeholder="https://pah.example.com" />
          </Box>
          <Box className={classes.fieldGroup}>
            <Typography className={classes.fieldLabel}>API Token *</Typography>
            <TextField fullWidth variant="outlined" size="small" type="password" placeholder="Enter PAH token" />
          </Box>
        </>
      )}
      {inherit && (
        <>
          <Box style={{
            padding: '12px 16px', borderRadius: 8,
            backgroundColor: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.15)',
            marginBottom: 20,
          }}>
            <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
              Credentials are inherited from the AAP connection. The portal derives the Hub API endpoint
              from the AAP Controller URL. Uncheck above to configure separately.
            </Typography>
          </Box>
          <Box className={classes.fieldGroup}>
            <Typography className={classes.fieldLabel}>Derived Hub URL</Typography>
            <TextField fullWidth variant="outlined" size="small"
              value="https://aap-controller.example.com/api/automation-hub/"
              disabled
              InputProps={{ style: { opacity: 0.6 } }}
            />
            <Box display="flex" alignItems="center" style={{ gap: 4, marginTop: 4 }}>
              <InsertDriveFileOutlinedIcon style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                Inherited from AAP connection
              </Typography>
            </Box>
          </Box>
          <Box className={classes.fieldGroup}>
            <Typography className={classes.fieldLabel}>Authentication</Typography>
            <TextField fullWidth variant="outlined" size="small"
              value="Using AAP admin token"
              disabled
              InputProps={{ style: { opacity: 0.6 } }}
            />
            <Box display="flex" alignItems="center" style={{ gap: 4, marginTop: 4 }}>
              <InsertDriveFileOutlinedIcon style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                Inherited from AAP connection
              </Typography>
            </Box>
          </Box>
        </>
      )}
      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>Test connection</Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>Save changes</Button>
      </StickyFooter>
      <DisconnectSection providerId={provider.id} providerName={provider.name} isConfigured={isConfigured} onDisconnect={onDisconnect} />
    </>
  );
};

const GitConnectionTab = ({ provider, onSave, onDisconnect }: { provider: ConnectionProvider; onSave: () => void; onDisconnect: () => void }) => {
  const classes = useStyles();
  const [authMethod, setAuthMethod] = useState<'token' | 'oauth'>('token');
  const providerLabel = provider.id === 'github' ? 'GitHub' : 'GitLab';
  const isConfigured = provider.status !== 'Not configured';

  return (
    <>
      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>{provider.name} Host URL</Typography>
        <TextField fullWidth variant="outlined" size="small"
          defaultValue={provider.id === 'github' ? 'https://github.com' : 'https://gitlab.com'}
          placeholder={`https://${provider.id}.example.com`} />
        <Typography className={classes.helperText}>
          Use the default for public {providerLabel}, or enter your self-hosted instance URL.
        </Typography>
      </Box>
      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>API Base URL (optional)</Typography>
        <TextField fullWidth variant="outlined" size="small"
          placeholder={provider.id === 'github' ? 'https://api.github.com' : ''} />
        <Typography className={classes.helperText}>Required only for self-hosted instances with non-standard API paths.</Typography>
      </Box>

      <Divider style={{ margin: '8px 0 16px' }} />
      <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Authentication</Typography>
      <Typography className={classes.helperText} style={{ marginBottom: 12, marginTop: 0 }}>
        How the portal authenticates to {providerLabel} when scanning repositories.
      </Typography>

      <RadioGroup
        value={authMethod}
        onChange={e => setAuthMethod(e.target.value as 'token' | 'oauth')}
      >
        <FormControlLabel
          value="token"
          control={<Radio color="primary" size="small" />}
          label={
            <Typography style={{ fontSize: 13, fontWeight: 500 }}>
              Personal access token
              <Typography component="span" style={{ fontSize: 12, color: '#999', marginLeft: 6 }}>recommended</Typography>
            </Typography>
          }
          style={{ marginBottom: 4 }}
        />
        {authMethod === 'token' && (
          <Box style={{ marginLeft: 30, marginBottom: 12 }}>
            <Box className={classes.fieldGroup}>
              <TextField fullWidth variant="outlined" size="small" type="password" placeholder="Enter access token" />
              <Typography className={classes.helperText}>
                A token with read access to the organizations you want to scan.
              </Typography>
            </Box>
          </Box>
        )}

        <FormControlLabel
          value="oauth"
          control={<Radio color="primary" size="small" />}
          label={<Typography style={{ fontSize: 13, fontWeight: 500 }}>OAuth application</Typography>}
          style={{ marginBottom: 4 }}
        />
        {authMethod === 'oauth' && (
          <Box style={{ marginLeft: 30, marginBottom: 12 }}>
            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Client ID *</Typography>
              <TextField fullWidth variant="outlined" size="small" placeholder="Enter OAuth Client ID" />
            </Box>
            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Client Secret *</Typography>
              <TextField fullWidth variant="outlined" size="small" type="password" placeholder="Enter OAuth Client Secret" />
            </Box>
            <Typography className={classes.helperText}>
              Register an OAuth application in your {providerLabel} settings to obtain these credentials.
            </Typography>
          </Box>
        )}
      </RadioGroup>

      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>Test connection</Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>Save changes</Button>
      </StickyFooter>
      <DisconnectSection providerId={provider.id} providerName={provider.name} isConfigured={isConfigured} onDisconnect={onDisconnect} />
    </>
  );
};

const RegistryConnectionTab = ({ provider, onSave, onDisconnect }: { provider: ConnectionProvider; onSave: () => void; onDisconnect: () => void }) => {
  const classes = useStyles();
  const [certified, setCertified] = useState(true);
  const [validated, setValidated] = useState(true);
  const [galaxy, setGalaxy] = useState(false);
  const isConfigured = provider.status !== 'Not configured';
  return (
    <>
      <Typography style={{ fontSize: 13, color: '#999', marginBottom: 16, lineHeight: 1.5 }}>
        Enable public content sources. These require internet access from the portal.
      </Typography>
      <FormControlLabel
        control={<Switch checked={certified} onChange={(_, v) => setCertified(v)} color="primary" size="small" />}
        label={
          <Box>
            <Typography style={{ fontSize: 13, fontWeight: 500 }}>Red Hat Certified Content</Typography>
            <Typography style={{ fontSize: 12, color: '#999' }}>Officially tested and supported collections from Red Hat partners</Typography>
          </Box>
        }
        style={{ marginBottom: 12, alignItems: 'flex-start', display: 'flex' }}
      />
      <FormControlLabel
        control={<Switch checked={validated} onChange={(_, v) => setValidated(v)} color="primary" size="small" />}
        label={
          <Box>
            <Typography style={{ fontSize: 13, fontWeight: 500 }}>Validated Content</Typography>
            <Typography style={{ fontSize: 12, color: '#999' }}>Community collections tested against Ansible Automation Platform</Typography>
          </Box>
        }
        style={{ marginBottom: 12, alignItems: 'flex-start', display: 'flex' }}
      />
      <FormControlLabel
        control={<Switch checked={galaxy} onChange={(_, v) => setGalaxy(v)} color="primary" size="small" />}
        label={
          <Box>
            <Typography style={{ fontSize: 13, fontWeight: 500 }}>Ansible Galaxy (community)</Typography>
            <Typography style={{ fontSize: 12, color: '#999' }}>Open community content — not officially supported</Typography>
          </Box>
        }
        style={{ marginBottom: 12, alignItems: 'flex-start', display: 'flex' }}
      />
      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>Reset</Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>Save changes</Button>
      </StickyFooter>
      <DisconnectSection providerId={provider.id} providerName={provider.name} isConfigured={isConfigured} onDisconnect={onDisconnect} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Content Tab per provider type
// ---------------------------------------------------------------------------

const EditableChipList = ({ items: initialItems, title, chipColor }: {
  items: string[];
  title: string;
  chipColor?: 'default' | 'secondary';
}) => {
  const classes = useStyles();
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
    }
    setNewItem('');
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box className={classes.chipContainer} style={{ flex: 1 }}>
          {items.length > 0 ? items.map(item => (
            <Chip key={item} label={item} size="small" variant="outlined" color={chipColor || 'default'} />
          )) : (
            <Typography style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>None configured</Typography>
          )}
        </Box>
        <Button
          size="small" color="primary"
          onClick={() => setOpen(true)}
          style={{ textTransform: 'none', fontSize: 12, minWidth: 0, padding: '2px 8px', flexShrink: 0 }}
        >
          Edit
        </Button>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontSize: 16 }}>{title}</DialogTitle>
        <DialogContent>
          <Box className={classes.chipContainer} style={{ marginBottom: 12 }}>
            {items.map(item => (
              <Chip
                key={item} label={item} size="small" variant="outlined"
                color={chipColor || 'default'}
                onDelete={() => setItems(items.filter(x => x !== item))}
              />
            ))}
          </Box>
          <Box display="flex" style={{ gap: 8 }}>
            <TextField
              fullWidth size="small" variant="outlined"
              placeholder="Add a label..."
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              inputProps={{ style: { fontSize: 13 } }}
            />
            <Button
              variant="outlined" size="small" color="primary"
              onClick={handleAdd}
              disabled={!newItem.trim()}
              style={{ textTransform: 'none', fontSize: 12, flexShrink: 0 }}
            >
              Add
            </Button>
          </Box>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'flex-start', padding: '16px 24px' }}>
          <Button onClick={() => setOpen(false)} variant="contained" color="primary" style={{ textTransform: 'none' }}>Done</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ToggleWithStatus = ({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) => (
  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
    <Box style={{ flex: 1 }}>
      <Typography style={{ fontSize: 13, fontWeight: 500 }}>{label}</Typography>
      {description && (
        <Typography style={{ fontSize: 12, color: '#999', lineHeight: 1.5 }}>{description}</Typography>
      )}
    </Box>
    <Box display="flex" alignItems="center" style={{ gap: 6, flexShrink: 0 }}>
      <Typography style={{ fontSize: 12, color: checked ? statusColors.success : '#999', fontWeight: 500 }}>
        {checked ? 'Enabled' : 'Disabled'}
      </Typography>
      <Switch checked={checked} onChange={(_, v) => onChange(v)} color="primary" size="small" />
    </Box>
  </Box>
);

const AAPContentTab = ({ onSave }: { onSave: () => void }) => {
  const classes = useStyles();
  const [jtEnabled, setJtEnabled] = useState(true);
  const [jtSurvey, setJtSurvey] = useState(true);

  return (
    <>
      <Box className={classes.sectionCard}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom={1}>
          <Box style={{ flex: 1 }}>
            <Typography className={classes.sectionTitle}>Organizations to sync</Typography>
            <Typography className={classes.sectionDescription}>
              Select which AAP organizations the portal should sync content from. At least one organization is required for user login.
            </Typography>
          </Box>
        </Box>
        <EditableChipList
          items={['Default', 'Platform Engineering', 'Application Development']}
          title="Edit organizations"
        />
      </Box>

      <Box className={classes.sectionCard}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom={1}>
          <Box style={{ flex: 1 }}>
            <Typography className={classes.sectionTitle}>Job template sync</Typography>
            <Typography className={classes.sectionDescription}>
              Control which job templates appear as self-service templates in the portal catalog.
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" style={{ gap: 6, flexShrink: 0 }}>
            <Typography style={{ fontSize: 12, color: jtEnabled ? statusColors.success : '#999', fontWeight: 500 }}>
              {jtEnabled ? 'Enabled' : 'Disabled'}
            </Typography>
            <Switch checked={jtEnabled} onChange={(_, v) => setJtEnabled(v)} color="primary" size="small" />
          </Box>
        </Box>

        {jtEnabled && (
          <Box style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Include labels</Typography>
              <EditableChipList items={['production', 'approved']} title="Edit include labels" />
              <Typography className={classes.helperText}>Only templates with these labels will be synced.</Typography>
            </Box>
            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Exclude labels</Typography>
              <EditableChipList items={['deprecated', 'test-only']} title="Edit exclude labels" chipColor="secondary" />
              <Typography className={classes.helperText}>Templates with these labels will be skipped during sync.</Typography>
            </Box>
            <ToggleWithStatus
              checked={jtSurvey}
              onChange={setJtSurvey}
              label="Include survey specifications"
              description="Sync survey forms so users can fill in parameters when launching templates."
            />
          </Box>
        )}
      </Box>

      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>Reset</Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>Save changes</Button>
      </StickyFooter>
    </>
  );

};

const PAHContentTab = ({ onSave }: { onSave: () => void }) => {
  const classes = useStyles();
  const remotes = [
    { name: 'rh-certified', description: 'Red Hat Certified Content from partners' },
    { name: 'validated', description: 'Community collections tested against AAP' },
    { name: 'published', description: 'Internally published collections and EE images' },
  ];
  return (
    <>
      <Box className={classes.sectionCard}>
        <Typography className={classes.sectionTitle}>Content remotes</Typography>
        <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
          Select which PAH remotes to sync content from. Each remote maps to a content source in your private hub.
        </Typography>
        {remotes.map(remote => (
          <Box key={remote.name} className={classes.scheduleRow}>
            <Box>
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>{remote.name}</Typography>
              <Typography style={{ fontSize: 12, color: '#999' }}>{remote.description}</Typography>
            </Box>
          </Box>
        ))}
        <Button size="small" startIcon={<AddIcon />} color="primary" style={{ textTransform: 'none', fontSize: 12, marginTop: 8 }}>
          Add remote
        </Button>
      </Box>
      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>Reset</Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>Save changes</Button>
      </StickyFooter>
    </>
  );
};

const GitContentTab = ({ provider, onSave }: { provider: ConnectionProvider; onSave: () => void }) => {
  const classes = useStyles();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isGithub = provider.id === 'github';
  const demoOrgs = isGithub
    ? [
        { name: 'ansible-collections', branches: ['main'], tags: ['v*'], crawlDepth: 5, interval: 'Every 1 hour' },
        { name: 'ansible-network', branches: ['main', 'devel'], tags: ['v*'], crawlDepth: 3, interval: 'Every 1 hour' },
      ]
    : [
        { name: 'platform-automation', branches: ['main'], tags: [], crawlDepth: 5, interval: 'Every 30 min' },
      ];

  return (
    <>
      <Typography className={classes.helperText} style={{ marginBottom: 16, marginTop: 0 }}>
        Which organizations and repositories to scan for automation content (collections, roles, playbooks).
      </Typography>
      {demoOrgs.map((org, i) => (
        <Box key={i} className={classes.orgCard}>
          <Box className={classes.orgHeader}>
            <Typography style={{ fontSize: 14, fontWeight: 600 }}>{org.name}</Typography>
            <IconButton size="small"><DeleteOutlineIcon fontSize="small" /></IconButton>
          </Box>
          <Box className={classes.fieldRow}>
            <Box className={classes.fieldRowItem}>
              <Typography className={classes.fieldLabel}>Branches</Typography>
              <Box className={classes.chipContainer}>
                {org.branches.map(b => <Chip key={b} label={b} size="small" variant="outlined" onDelete={() => {}} />)}
              </Box>
            </Box>
            <Box className={classes.fieldRowItem}>
              <Typography className={classes.fieldLabel}>Tags</Typography>
              <Box className={classes.chipContainer}>
                {org.tags.length > 0
                  ? org.tags.map(t => <Chip key={t} label={t} size="small" variant="outlined" onDelete={() => {}} />)
                  : <Typography style={{ fontSize: 12, color: '#666' }}>No tag filters</Typography>
                }
              </Box>
            </Box>
            <Box style={{ minWidth: 80 }}>
              <Typography className={classes.fieldLabel}>Crawl depth</Typography>
              <TextField variant="outlined" size="small" type="number" value={org.crawlDepth}
                style={{ width: 72 }} inputProps={{ min: 1, max: 10 }} />
            </Box>
            <Box style={{ minWidth: 130 }}>
              <Typography className={classes.fieldLabel}>Sync interval</Typography>
              <Typography style={{ fontSize: 13 }}>{org.interval}</Typography>
            </Box>
          </Box>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} color="primary" style={{ textTransform: 'none', fontSize: 12 }}>
        Add organization
      </Button>

      <Divider style={{ margin: '20px 0 0' }} />
      <Box
        display="flex" alignItems="center" justifyContent="space-between"
        style={{ cursor: 'pointer', padding: '12px 0' }}
        onClick={() => setAdvancedOpen(!advancedOpen)}
      >
        <Typography style={{ fontSize: 13, fontWeight: 600 }}>Advanced</Typography>
        {advancedOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>
      <Collapse in={advancedOpen}>
        <Box className={classes.fieldGroup}>
          <Typography className={classes.fieldLabel}>Execution environment filename</Typography>
          <TextField fullWidth variant="outlined" size="small"
            defaultValue="execution-environment.yml"
            placeholder="execution-environment.yml" />
          <Typography className={classes.helperText}>
            Filename pattern used to detect execution environment definitions in repositories.
          </Typography>
        </Box>
      </Collapse>

      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>Reset</Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>Save changes</Button>
      </StickyFooter>
    </>
  );
};

// ---------------------------------------------------------------------------
// Sync Tab — per-source schedules + recent history
// ---------------------------------------------------------------------------

const FREQUENCY_OPTIONS = [
  { value: '15', label: 'Every 15 min' },
  { value: '30', label: 'Every 30 min' },
  { value: '60', label: 'Every 1 hour' },
  { value: '360', label: 'Every 6 hours' },
  { value: '720', label: 'Every 12 hours' },
  { value: '1440', label: 'Daily' },
];

const intervalToValue = (interval: string): string => {
  if (interval.includes('15')) return '15';
  if (interval.includes('30')) return '30';
  if (interval === 'Daily') return '1440';
  if (interval.includes('6')) return '360';
  if (interval.includes('12')) return '720';
  return '60';
};

const connectionIdToSource = (id: string): string => {
  switch (id) {
    case 'aap': return 'AAP';
    case 'pah': return 'Private Automation Hub';
    case 'github': return 'GitHub';
    case 'gitlab': return 'GitLab';
    case 'registries': return 'Public Registries';
    default: return '';
  }
};

const SyncTabEmptyState = ({ provider, onGoToConnection }: { provider: ConnectionProvider; onGoToConnection: () => void }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      style={{ padding: '64px 24px', textAlign: 'center' }}
    >
      <SyncIcon style={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }} />
      <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
        No sync schedules available
      </Typography>
      <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 400, marginBottom: 24 }}>
        Configure a connection to {provider.name} first. Once the connection is established, you can set up sync schedules for each content type.
      </Typography>
      <Button
        variant="outlined"
        color="primary"
        style={{ textTransform: 'none' }}
        onClick={onGoToConnection}
      >
        Configure connection
      </Button>
    </Box>
  );
};

const SyncTab = ({ provider, isConfigured, onGoToConnection }: { provider: ConnectionProvider; isConfigured: boolean; onGoToConnection: () => void }) => {
  const classes = useStyles();

  if (!isConfigured) {
    return <SyncTabEmptyState provider={provider} onGoToConnection={onGoToConnection} />;
  }

  const sourceName = connectionIdToSource(provider.id);
  const initialSchedules = DEMO_SYNC_SCHEDULES.filter(s => s.source === sourceName);
  const [scheduleState, setScheduleState] = useState(
    initialSchedules.map(s => ({ ...s })),
  );
  const [confirmDisable, setConfirmDisable] = useState<{ id: string; name: string } | null>(null);

  const handleToggle = (id: string, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      const sched = scheduleState.find(s => s.id === id);
      setConfirmDisable({ id, name: sched?.syncJob || '' });
    } else {
      setScheduleState(prev => prev.map(s => s.id === id ? { ...s, enabled: true } : s));
    }
  };

  const handleConfirmDisable = () => {
    if (confirmDisable) {
      setScheduleState(prev => prev.map(s => s.id === confirmDisable.id ? { ...s, enabled: false } : s));
      setConfirmDisable(null);
    }
  };

  return (
    <>
      <Box className={classes.sectionCard}>
        <Box display="flex" justifyContent="space-between" alignItems="center" style={{ marginBottom: 16 }}>
          <Box>
            <Typography className={classes.sectionTitle}>Sync Schedules</Typography>
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Configure how often each content type is synced from {provider.name}.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<SyncIcon style={{ fontSize: 14 }} />}
            style={{ textTransform: 'none', fontSize: 12 }}
          >
            Sync all now
          </Button>
        </Box>

        {scheduleState.length > 0 ? scheduleState.map(s => (
          <Box key={s.id} className={classes.scheduleRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>{s.syncJob}</Typography>
              <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                <Select
                  variant="outlined"
                  value={intervalToValue(s.interval)}
                  disabled={!s.enabled}
                  style={{ fontSize: 13, height: 32, minWidth: 150 }}
                >
                  {FREQUENCY_OPTIONS.map(opt => (
                    <MuiMenuItem key={opt.value} value={opt.value} style={{ fontSize: 13 }}>
                      {opt.label}
                    </MuiMenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                <Switch
                  checked={s.enabled}
                  onChange={() => handleToggle(s.id, s.enabled)}
                  color="primary"
                  size="small"
                />
                <Typography style={{ fontSize: 12, color: s.enabled ? statusColors.success : '#999', fontWeight: 500 }}>
                  {s.enabled ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>
              <Typography style={{ fontSize: 12, color: '#999' }}>
                Last sync:{' '}
                <a
                  href={`/self-service/admin/sync-activity/${s.id}`}
                  style={{ color: '#4DA3FF', textDecoration: 'none' }}
                >
                  {s.lastRun}
                </a>
              </Typography>
            </Box>
          </Box>
        )) : (
          <Typography style={{ fontSize: 13, color: '#999', padding: '16px 0', textAlign: 'center' }}>
            No sync schedules configured. Connect this source first.
          </Typography>
        )}
      </Box>

      <Dialog open={!!confirmDisable} onClose={() => setConfirmDisable(null)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontSize: 16 }}>
          Disable {confirmDisable?.name} sync?
        </DialogTitle>
        <DialogContent>
          <Typography style={{ fontSize: 13 }}>
            This content type will no longer be automatically updated from {provider.name}. You can re-enable it at any time.
          </Typography>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'flex-start', padding: '16px 24px' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmDisable}
            style={{ textTransform: 'none' }}
          >
            Disable
          </Button>
          <Button
            onClick={() => setConfirmDisable(null)}
            style={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main detail page with HeaderTabs
// ---------------------------------------------------------------------------

const buildTabs = (hasContent: boolean) => {
  const tabs = [{ id: 'connection', label: 'Connection' }];
  if (hasContent) tabs.push({ id: 'content', label: 'Content' });
  tabs.push({ id: 'sync', label: 'Sync' });
  return tabs;
};

export const ConnectionDetailPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { providerId } = useParams<{ providerId: string }>();
  const { setRestartRequired } = useRestartRequired();
  const handleSave = () => setRestartRequired(true);
  const handleDisconnect = () => {
    setRestartRequired(true);
    navigate(parentLink);
  };

  const isScmRoute = location.pathname.includes('/admin/scm/');
  const parentLabel = isScmRoute ? 'SCM Integration' : 'Integrations';
  const parentLink = isScmRoute ? '/self-service/admin/scm' : '/self-service/admin/integrations';

  const provider = DEMO_CONNECTIONS.find(c => c.id === providerId);

  if (!provider) {
    return (
      <Page themeId="app">
        <Header title="Connection not found" />
        <Content>
          <Typography>No connection found with ID "{providerId}".</Typography>
          <Button onClick={() => navigate(parentLink)} style={{ textTransform: 'none', marginTop: 16 }}>
            Back to {parentLabel}
          </Button>
        </Content>
      </Page>
    );
  }

  const isConfigured = provider.status !== 'Not configured';
  const hasContent = provider.type !== 'registry';
  const tabs = buildTabs(hasContent);

  const initialTabIndex = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const idx = tabs.findIndex(t => t.id === tabParam);
      return idx >= 0 ? idx : 0;
    }
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedTab, setSelectedTab] = useState(initialTabIndex);

  const resolveTab = (): 'connection' | 'content' | 'sync' => {
    const tab = tabs[selectedTab];
    return (tab?.id as 'connection' | 'content' | 'sync') ?? 'connection';
  };
  const activeTab = resolveTab();

  const description = providerDescription(provider.id);

  return (
    <Page themeId="app">
      <Header
        title={provider.name}
        pageTitleOverride={provider.name}
        type={parentLabel}
        typeLink={parentLink}
        subtitle={description}
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Tooltip title={isConfigured ? 'This source is connected and syncing content to the portal.' : 'This source has not been configured yet.'} arrow>
            <Chip
              label={isConfigured ? (provider.status === 'Active' ? 'Connected' : 'Error') : 'Not connected'}
              size="small"
              style={{
                fontSize: 11,
                height: 22,
                fontWeight: 500,
                backgroundColor: isConfigured
                  ? (provider.status === 'Active' ? 'rgba(99,153,61,0.15)' : 'rgba(201,25,11,0.15)')
                  : 'rgba(255,255,255,0.08)',
                color: isConfigured
                  ? (provider.status === 'Active' ? statusColors.success : statusColors.error)
                  : 'rgba(255,255,255,0.5)',
              }}
            />
          </Tooltip>
          {isConfigured && provider.lastSync && (
            <Box>
              <Typography style={{ fontSize: 11, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>
                Last sync
              </Typography>
              <Typography style={{ fontSize: 13, color: '#fff' }}>
                {provider.lastSync}
              </Typography>
            </Box>
          )}
        </Box>
      </Header>
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={setSelectedTab}
        tabs={tabs}
      />
      <Content>

        {activeTab === 'connection' && (
          <>
            {provider.type === 'aap' && <AAPConnectionTab provider={provider} onSave={handleSave} onDisconnect={handleDisconnect} />}
            {provider.type === 'pah' && <PAHConnectionTab provider={provider} onSave={handleSave} onDisconnect={handleDisconnect} />}
            {provider.type === 'git' && <GitConnectionTab provider={provider} onSave={handleSave} onDisconnect={handleDisconnect} />}
            {provider.type === 'registry' && <RegistryConnectionTab provider={provider} onSave={handleSave} onDisconnect={handleDisconnect} />}
          </>
        )}

        {activeTab === 'content' && (
          <>
            {provider.type === 'aap' && <AAPContentTab onSave={handleSave} />}
            {provider.type === 'pah' && <PAHContentTab onSave={handleSave} />}
            {provider.type === 'git' && <GitContentTab provider={provider} onSave={handleSave} />}
          </>
        )}

        {activeTab === 'sync' && (
          <SyncTab provider={provider} isConfigured={isConfigured} onGoToConnection={() => setSelectedTab(0)} />
        )}

      </Content>
    </Page>
  );
};
