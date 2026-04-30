import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Page,
  Header,
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
  Tabs,
  Tab,
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
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { SyncErrorModal } from './SyncErrorModal';
import {
  DEMO_CONNECTIONS,
  DEMO_SYNC_STATUS,
  ConnectionProvider,
  SyncEntityStatus,
} from './syncDemoData';
import { useRestartRequired } from './RestartContext';
import { statusColors } from '../common/statusColors';
import SyncIcon from '@material-ui/icons/Sync';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import LoopIcon from '@material-ui/icons/Loop';
import ScheduleIcon from '@material-ui/icons/Schedule';
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
      <Box ref={sentinelRef} className={classes.stickyFooter} style={isStuck ? { visibility: 'hidden' } : undefined}>
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
// Connection Tab content per provider type
// ---------------------------------------------------------------------------

const AAPConnectionTab = ({ provider, onSave }: { provider: ConnectionProvider; onSave: () => void }) => {
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
    </>
  );
};

const PAHConnectionTab = ({ onSave }: { onSave: () => void }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  return (
    <>
      <Box style={{
        padding: '12px 16px', borderRadius: 8,
        backgroundColor: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.15)',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <InfoOutlinedIcon style={{ fontSize: 18, color: '#0066CC', flexShrink: 0, marginTop: 1 }} />
        <Box>
          <Typography style={{ fontSize: 13, lineHeight: 1.6 }}>
            Private Automation Hub shares the AAP connection. The Hub API endpoint and credentials
            are derived automatically from your Ansible Automation Platform configuration.
          </Typography>
          <Button
            size="small"
            color="primary"
            onClick={() => navigate('/self-service/admin/integrations/aap')}
            style={{ textTransform: 'none', fontSize: 12, marginTop: 4, padding: '2px 0', minWidth: 0 }}
          >
            Go to AAP connection settings
          </Button>
        </Box>
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
      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>Test connection</Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>Save changes</Button>
      </StickyFooter>
    </>
  );
};

const GitConnectionTab = ({ provider, onSave }: { provider: ConnectionProvider; onSave: () => void }) => {
  const classes = useStyles();
  const providerLabel = provider.id === 'github' ? 'GitHub' : 'GitLab';

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
      <Typography className={classes.helperText} style={{ marginBottom: 16, marginTop: 0 }}>
        Both a personal access token and an OAuth application are required for {providerLabel} integration.
      </Typography>

      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>Personal access token *</Typography>
        <TextField fullWidth variant="outlined" size="small" type="password" placeholder="Enter access token" />
        <Typography className={classes.helperText}>
          A token with read access to the organizations you want to scan.
        </Typography>
      </Box>

      <Divider style={{ margin: '8px 0 16px' }} />

      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>OAuth Client ID *</Typography>
        <TextField fullWidth variant="outlined" size="small" placeholder="Enter OAuth Client ID" />
      </Box>
      <Box className={classes.fieldGroup}>
        <Typography className={classes.fieldLabel}>OAuth Client Secret *</Typography>
        <TextField fullWidth variant="outlined" size="small" type="password" placeholder="Enter OAuth Client Secret" />
        <Typography className={classes.helperText}>
          Register an OAuth application in your {providerLabel} settings to obtain these credentials.
        </Typography>
      </Box>

      <StickyFooter>
        <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>Test connection</Button>
        <Button variant="contained" color="primary" onClick={onSave} style={{ textTransform: 'none', fontSize: 13 }}>Save changes</Button>
      </StickyFooter>
    </>
  );
};

const RegistryConnectionTab = ({ onSave }: { onSave: () => void }) => {
  const classes = useStyles();
  const [certified, setCertified] = useState(true);
  const [validated, setValidated] = useState(true);
  const [galaxy, setGalaxy] = useState(false);
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
            <Typography className={classes.sectionTitle}>Job template filters</Typography>
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
          <Box key={remote.name} className={classes.scheduleRow} display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>{remote.name}</Typography>
              <Typography style={{ fontSize: 12, color: '#999' }}>{remote.description}</Typography>
            </Box>
            <IconButton size="small">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
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
// Sync Tab — last sync status + per-source schedule configuration
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

const SyncStatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'Healthy':
      return <CheckCircleOutlineIcon style={{ fontSize: 18, color: statusColors.success }} />;
    case 'Failed':
      return <ErrorOutlineIcon style={{ fontSize: 18, color: statusColors.error }} />;
    case 'In Progress':
      return <LoopIcon style={{ fontSize: 18, color: statusColors.info }} />;
    default:
      return <SyncIcon style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />;
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

const SyncTab = ({ provider, isConfigured, onGoToConnection, onViewDetails }: { provider: ConnectionProvider; isConfigured: boolean; onGoToConnection: () => void; onViewDetails: (e: SyncEntityStatus) => void }) => {
  const classes = useStyles();

  if (!isConfigured) {
    return <SyncTabEmptyState provider={provider} onGoToConnection={onGoToConnection} />;
  }

  const entityStatuses = DEMO_SYNC_STATUS.filter(s => s.providerId === provider.id);

  return (
    <>
      <Box className={classes.sectionCard} style={{ marginBottom: 24 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" style={{ marginBottom: 16 }}>
          <Box>
            <Typography className={classes.sectionTitle}>Last sync results</Typography>
            <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Current sync status for each {provider.type === 'git' ? 'organization' : 'content type'} from {provider.name}.
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

        {entityStatuses.length > 0 ? entityStatuses.map(entity => (
          <Box
            key={entity.id}
            className={classes.scheduleRow}
            style={{
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 6,
              backgroundColor: entity.status === 'Failed' ? 'rgba(244,67,54,0.05)' : undefined,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                <SyncStatusIcon status={entity.status} />
                <Typography style={{ fontSize: 13, fontWeight: 500 }}>{entity.entity}</Typography>
              </Box>
              <Box display="flex" alignItems="center" style={{ gap: 16 }}>
                {entity.lastSync && (
                  <Typography style={{ fontSize: 12, color: '#999' }}>
                    {entity.lastSync}
                    {entity.lastSyncDuration && ` · ${entity.lastSyncDuration}`}
                  </Typography>
                )}
                {entity.nextSync && (
                  <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                    <ScheduleIcon style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                    <Typography style={{ fontSize: 12, color: '#999' }}>
                      {entity.nextSync}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            {entity.status === 'Failed' && entity.errorDetail && (
              <Box display="flex" alignItems="center" style={{ paddingLeft: 26, gap: 8 }}>
                <Typography style={{ fontSize: 12, color: statusColors.error, lineHeight: 1.4 }}>
                  {entity.errorDetail}
                </Typography>
                <Typography
                  component="span"
                  onClick={() => onViewDetails(entity)}
                  style={{
                    fontSize: 11,
                    color: '#4DA3FF',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  View details
                </Typography>
              </Box>
            )}
          </Box>
        )) : (
          <Typography style={{ fontSize: 13, color: '#999', padding: '16px 0', textAlign: 'center' }}>
            No sync data available yet.
          </Typography>
        )}
      </Box>

      {provider.type !== 'git' && (
        <Box className={classes.sectionCard}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography className={classes.sectionTitle}>Sync interval</Typography>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                How often the portal syncs all content from {provider.name}.
              </Typography>
            </Box>
            <Select
              variant="outlined"
              value={intervalToValue(entityStatuses[0]?.interval || 'Every 30 min')}
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
      )}

      {provider.type === 'git' && entityStatuses.length > 0 && (
        <Box style={{ marginTop: 8 }}>
          <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Sync intervals are configured per organization on the Content tab.
          </Typography>
        </Box>
      )}
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

  const parentLabel = 'Integrations';
  const parentLink = '/self-service/admin/integrations';

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
  const [modalEntity, setModalEntity] = useState<SyncEntityStatus | null>(null);

  const resolveTab = (): 'connection' | 'content' | 'sync' => {
    const tab = tabs[selectedTab];
    return (tab?.id as 'connection' | 'content' | 'sync') ?? 'connection';
  };
  const activeTab = resolveTab();

  const description = providerDescription(provider.id);
  const providerSyncStatuses = DEMO_SYNC_STATUS.filter(s => s.providerId === provider.id);
  const failedSyncs = providerSyncStatuses.filter(s => s.status === 'Failed');

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
      <Content>
        {failedSyncs.length > 0 && (
          <Box
            style={{
              borderLeft: `3px solid ${statusColors.error}`,
              borderRadius: 2,
              backgroundColor: 'rgba(244,67,54,0.06)',
              padding: '4px 0 4px 0',
              marginBottom: 16,
              position: 'relative',
            }}
          >
            {failedSyncs.map(entity => (
              <Box
                key={entity.id}
                display="flex"
                alignItems="center"
                style={{ padding: '4px 12px', gap: 8 }}
              >
                <ErrorOutlineIcon style={{ fontSize: 14, color: statusColors.error, flexShrink: 0 }} />
                <Typography style={{ fontSize: 13 }}>
                  <strong>{entity.entity}</strong>: sync failed.{' '}
                  <Typography
                    component="span"
                    onClick={() => setModalEntity(entity)}
                    style={{ fontSize: 13, color: '#4DA3FF', cursor: 'pointer' }}
                  >
                    View details
                  </Typography>
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        <SyncErrorModal
          entity={modalEntity}
          open={modalEntity !== null}
          onClose={() => setModalEntity(null)}
        />
        <Tabs
          value={selectedTab}
          onChange={(_, v) => setSelectedTab(v)}
          indicatorColor="primary"
          textColor="primary"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: 16 }}
        >
          {tabs.map(t => (
            <Tab key={t.id} label={t.label} style={{ textTransform: 'none', minWidth: 80 }} />
          ))}
        </Tabs>

        {activeTab === 'connection' && (
          <>
            {provider.id === 'aap' && <AAPConnectionTab provider={provider} onSave={handleSave} />}
            {provider.id === 'pah' && <PAHConnectionTab onSave={handleSave} />}
            {provider.type === 'git' && <GitConnectionTab provider={provider} onSave={handleSave} />}
            {provider.type === 'registry' && <RegistryConnectionTab onSave={handleSave} />}
          </>
        )}

        {activeTab === 'content' && (
          <>
            {provider.id === 'aap' && <AAPContentTab onSave={handleSave} />}
            {provider.id === 'pah' && <PAHContentTab onSave={handleSave} />}
            {provider.type === 'git' && <GitContentTab provider={provider} onSave={handleSave} />}
          </>
        )}

        {activeTab === 'sync' && (
          <SyncTab provider={provider} isConfigured={isConfigured} onGoToConnection={() => setSelectedTab(0)} onViewDetails={setModalEntity} />
        )}

      </Content>
    </Page>
  );
};
