import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  makeStyles,
  TextField,
  Chip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AddIcon from '@material-ui/icons/Add';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/Edit';
import { DismissibleBanner } from '../common/DismissibleBanner';
import { PageHelpIcon } from '../common/PageHelpIcon';

const useStyles = makeStyles(theme => ({
  sectionCard: {
    marginBottom: theme.spacing(3),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: 16,
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: theme.spacing(2),
  },
  fieldGroup: {
    marginBottom: theme.spacing(3),
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
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  sourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: 500,
  },
  sourceDetail: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  accordion: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '8px !important',
    marginBottom: theme.spacing(1.5),
    '&:before': {
      display: 'none',
    },
    '&.Mui-expanded': {
      marginBottom: theme.spacing(1.5),
    },
  },
  accordionSummary: {
    '&.Mui-expanded': {
      minHeight: 48,
    },
  },
  accordionDetails: {
    flexDirection: 'column' as const,
    padding: theme.spacing(0, 2, 2, 2),
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
    marginBottom: theme.spacing(1.5),
  },
  orgName: {
    fontSize: 14,
    fontWeight: 600,
  },
  fieldRow: {
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    alignItems: 'flex-start',
  },
  fieldRowItem: {
    flex: 1,
  },
  repoTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    '& th': {
      textAlign: 'left' as const,
      fontSize: 12,
      fontWeight: 600,
      color: theme.palette.text.secondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      padding: theme.spacing(1, 1.5),
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '& td': {
      fontSize: 13,
      padding: theme.spacing(1.5),
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  statusChip: {
    fontSize: 11,
    height: 22,
  },
  saveBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 0, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(2),
  },
  infoCallout: {
    padding: theme.spacing(1.5, 2),
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(0,102,204,0.08)'
        : '#E7F1FA',
    border: `1px solid ${
      theme.palette.type === 'dark' ? 'rgba(0,102,204,0.3)' : '#BEE1F4'
    }`,
    borderRadius: 8,
    marginBottom: theme.spacing(2),
  },
}));

const DEMO_ORGS = ['Default', 'Platform Engineering', 'Application Development', 'Security & Compliance', 'Network Operations'];
const DEMO_SELECTED_ORGS = ['Default', 'Platform Engineering', 'Application Development'];

const DEMO_PAH_REPOS = [
  { name: 'rh-certified', syncInterval: 'Every 1 hour', enabled: true },
  { name: 'validated', syncInterval: 'Every 1 hour', enabled: true },
  { name: 'published', syncInterval: 'Every 6 hours', enabled: true },
];

type GitOrg = {
  name: string;
  branches: string[];
  tags: string[];
  crawlDepth: number;
  syncInterval: string;
};

type GitSource = {
  id: string;
  provider: 'github' | 'gitlab';
  name: string;
  host: string;
  orgs: GitOrg[];
};

const DEMO_GIT_SOURCES: GitSource[] = [
  {
    id: 'gs1',
    provider: 'github',
    name: 'GitHub.com — Ansible Collections',
    host: 'github.com',
    orgs: [
      { name: 'ansible-collections', branches: ['main'], tags: ['v*'], crawlDepth: 5, syncInterval: 'Every 1 hour' },
      { name: 'ansible-network', branches: ['main', 'devel'], tags: ['v*'], crawlDepth: 3, syncInterval: 'Every 1 hour' },
    ],
  },
  {
    id: 'gs2',
    provider: 'gitlab',
    name: 'Internal GitLab — Platform Team',
    host: 'gitlab.internal.example.com',
    orgs: [
      { name: 'platform-automation', branches: ['main'], tags: [], crawlDepth: 5, syncInterval: 'Every 30 min' },
    ],
  },
];

const AAPSyncSection = () => {
  const classes = useStyles();
  const [selectedOrgs, setSelectedOrgs] = useState(DEMO_SELECTED_ORGS);
  const [jtEnabled, setJtEnabled] = useState(true);
  const [jtSurvey, setJtSurvey] = useState(true);
  const [jtLabels, setJtLabels] = useState(['production', 'approved']);
  const [jtExcludeLabels, setJtExcludeLabels] = useState(['deprecated', 'test-only']);
  const [labelInput, setLabelInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');

  const addLabel = (value: string, setter: (fn: (prev: string[]) => string[]) => void, inputSetter: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed) {
      setter(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
      inputSetter('');
    }
  };

  return (
    <Card className={classes.sectionCard} variant="outlined">
      <CardContent>
        <Box className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            AAP Content
          </Typography>
          <Chip label="Connected" size="small" className={classes.statusChip}
            style={{ backgroundColor: 'rgba(99,153,61,0.15)', color: '#63993D' }} />
        </Box>
        <Typography className={classes.sectionDescription}>
          Configure which content is synced from your connected Ansible Automation Platform instance.
        </Typography>

        <Box className={classes.fieldGroup}>
          <Typography className={classes.fieldLabel}>Organizations to sync</Typography>
          <Box className={classes.chipContainer}>
            {selectedOrgs.map(org => (
              <Chip
                key={org}
                label={org}
                size="small"
                onDelete={() => setSelectedOrgs(prev => prev.filter(o => o !== org))}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <Select
            fullWidth
            variant="outlined"
            displayEmpty
            value=""
            onChange={e => {
              const val = e.target.value as string;
              if (val && !selectedOrgs.includes(val)) {
                setSelectedOrgs(prev => [...prev, val]);
              }
            }}
            style={{ marginTop: 4 }}
            inputProps={{ style: { fontSize: 13, padding: '8px 14px' } }}
          >
            <MenuItem value="" disabled>
              <Typography style={{ fontSize: 13, color: '#999' }}>Add organization...</Typography>
            </MenuItem>
            {DEMO_ORGS.filter(o => !selectedOrgs.includes(o)).map(org => (
              <MenuItem key={org} value={org}>
                <Typography style={{ fontSize: 13 }}>{org}</Typography>
              </MenuItem>
            ))}
          </Select>
          <Typography className={classes.helperText}>
            Only content from selected organizations will be synced. At least one is required for user login.
          </Typography>
        </Box>

        <Divider style={{ margin: '16px 0' }} />

        <Typography className={classes.subsectionTitle}>Job template filtering</Typography>

        <FormControlLabel
          control={<Switch checked={jtEnabled} onChange={(_, v) => setJtEnabled(v)} color="primary" size="small" />}
          label={<Typography style={{ fontSize: 13 }}>Sync job templates from AAP</Typography>}
          style={{ marginBottom: 12 }}
        />

        {jtEnabled && (
          <>
            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Include labels</Typography>
              <Box className={classes.chipContainer}>
                {jtLabels.map(label => (
                  <Chip key={label} label={label} size="small" variant="outlined"
                    onDelete={() => setJtLabels(prev => prev.filter(l => l !== label))} />
                ))}
              </Box>
              <TextField
                fullWidth variant="outlined" size="small" placeholder="Type a label and press Enter"
                value={labelInput} onChange={e => setLabelInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(labelInput, setJtLabels, setLabelInput); } }}
              />
              <Typography className={classes.helperText}>
                Only sync job templates with these labels. Leave empty to sync all.
              </Typography>
            </Box>

            <Box className={classes.fieldGroup}>
              <Typography className={classes.fieldLabel}>Exclude labels</Typography>
              <Box className={classes.chipContainer}>
                {jtExcludeLabels.map(label => (
                  <Chip key={label} label={label} size="small" variant="outlined" color="secondary"
                    onDelete={() => setJtExcludeLabels(prev => prev.filter(l => l !== label))} />
                ))}
              </Box>
              <TextField
                fullWidth variant="outlined" size="small" placeholder="Type a label and press Enter"
                value={excludeInput} onChange={e => setExcludeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(excludeInput, setJtExcludeLabels, setExcludeInput); } }}
              />
              <Typography className={classes.helperText}>
                Exclude job templates with these labels from sync.
              </Typography>
            </Box>

            <FormControlLabel
              control={<Switch checked={jtSurvey} onChange={(_, v) => setJtSurvey(v)} color="primary" size="small" />}
              label={<Typography style={{ fontSize: 13 }}>Include survey specifications in synced templates</Typography>}
            />
          </>
        )}

        <Box className={classes.saveBar}>
          <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>
            Reset
          </Button>
          <Button variant="contained" color="primary" style={{ textTransform: 'none', fontSize: 13 }}>
            Save changes
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const PAHSection = () => {
  const classes = useStyles();
  const [pahEnabled, setPahEnabled] = useState(true);
  const [repos] = useState(DEMO_PAH_REPOS);

  return (
    <Card className={classes.sectionCard} variant="outlined">
      <CardContent>
        <Box className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            Collection Repositories
          </Typography>
          <Chip label="Connected" size="small" className={classes.statusChip}
            style={{ backgroundColor: 'rgba(99,153,61,0.15)', color: '#63993D' }} />
        </Box>
        <Typography className={classes.sectionDescription}>
          Configure which collection repositories are synced from Private Automation Hub.
        </Typography>

        <FormControlLabel
          control={<Switch checked={pahEnabled} onChange={(_, v) => setPahEnabled(v)} color="primary" size="small" />}
          label={<Typography style={{ fontSize: 13 }}>Enable PAH collection sync</Typography>}
          style={{ marginBottom: 16 }}
        />

        {pahEnabled && (
          <>
            <table className={classes.repoTable}>
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Sync interval</th>
                  <th>Status</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {repos.map(repo => (
                  <tr key={repo.name}>
                    <td style={{ fontWeight: 500 }}>{repo.name}</td>
                    <td>{repo.syncInterval}</td>
                    <td>
                      <Chip
                        label={repo.enabled ? 'Active' : 'Disabled'}
                        size="small"
                        className={classes.statusChip}
                        style={{
                          backgroundColor: repo.enabled ? 'rgba(99,153,61,0.15)' : 'rgba(255,255,255,0.08)',
                          color: repo.enabled ? '#63993D' : '#999',
                        }}
                      />
                    </td>
                    <td>
                      <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small"><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              size="small" startIcon={<AddIcon />}
              style={{ textTransform: 'none', fontSize: 13, marginTop: 12 }}
              color="primary"
            >
              Add repository
            </Button>
          </>
        )}

        <Box className={classes.saveBar}>
          <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>
            Reset
          </Button>
          <Button variant="contained" color="primary" style={{ textTransform: 'none', fontSize: 13 }}>
            Save changes
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const GitContentSection = () => {
  const classes = useStyles();
  const [sources] = useState<GitSource[]>(DEMO_GIT_SOURCES);

  return (
    <Card className={classes.sectionCard} variant="outlined">
      <CardContent>
        <Box className={classes.sectionHeader}>
          <Typography className={classes.sectionTitle}>
            Git Content Discovery
          </Typography>
        </Box>
        <Typography className={classes.sectionDescription}>
          Configure which Git organizations and repositories the portal scans for automation content
          (collections, roles, playbooks). Each source targets a specific SCM host and one or more organizations.
        </Typography>

        {sources.map(source => (
          <Accordion key={source.id} className={classes.accordion} defaultExpanded={source.id === 'gs1'}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.accordionSummary}
            >
              <Box style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <Chip
                  label={source.provider === 'github' ? 'GitHub' : 'GitLab'}
                  size="small"
                  variant="outlined"
                  className={classes.statusChip}
                />
                <Box>
                  <Typography style={{ fontSize: 14, fontWeight: 600 }}>{source.name}</Typography>
                  <Typography style={{ fontSize: 12, color: '#999' }}>
                    {source.host} · {source.orgs.length} organization{source.orgs.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>
              <Box style={{ marginBottom: 12 }}>
                <Typography className={classes.fieldLabel}>Host</Typography>
                <TextField fullWidth variant="outlined" size="small" value={source.host} InputProps={{ readOnly: true }}
                  style={{ marginBottom: 4 }}
                />
                <Typography className={classes.helperText}>
                  Managed on the <a href="/self-service/admin/connections" style={{ color: '#0066CC' }}>Connections</a> page.
                </Typography>
              </Box>

              <Typography className={classes.subsectionTitle}>
                Organizations ({source.orgs.length})
              </Typography>

              {source.orgs.map((org, orgIdx) => (
                <Box key={orgIdx} className={classes.orgCard}>
                  <Box className={classes.orgHeader}>
                    <Typography className={classes.orgName}>{org.name}</Typography>
                    <IconButton size="small"><DeleteOutlineIcon fontSize="small" /></IconButton>
                  </Box>

                  <Box className={classes.fieldRow}>
                    <Box className={classes.fieldRowItem}>
                      <Typography className={classes.fieldLabel}>Branches</Typography>
                      <Box className={classes.chipContainer}>
                        {org.branches.map(b => (
                          <Chip key={b} label={b} size="small" variant="outlined" onDelete={() => {}} />
                        ))}
                      </Box>
                    </Box>
                    <Box className={classes.fieldRowItem}>
                      <Typography className={classes.fieldLabel}>Tags</Typography>
                      <Box className={classes.chipContainer}>
                        {org.tags.length > 0 ? org.tags.map(t => (
                          <Chip key={t} label={t} size="small" variant="outlined" onDelete={() => {}} />
                        )) : (
                          <Typography style={{ fontSize: 12, color: '#999' }}>No tag filters</Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Box className={classes.fieldRow}>
                    <Box className={classes.fieldRowItem}>
                      <Typography className={classes.fieldLabel}>Crawl depth</Typography>
                      <TextField variant="outlined" size="small" type="number"
                        value={org.crawlDepth} style={{ width: 100 }}
                        inputProps={{ min: 1, max: 10 }}
                      />
                    </Box>
                    <Box className={classes.fieldRowItem}>
                      <Typography className={classes.fieldLabel}>Sync interval</Typography>
                      <Select variant="outlined" value={org.syncInterval}
                        style={{ fontSize: 13, minWidth: 160 }}
                        inputProps={{ style: { padding: '8px 14px' } }}
                      >
                        <MenuItem value="Every 15 min">Every 15 min</MenuItem>
                        <MenuItem value="Every 30 min">Every 30 min</MenuItem>
                        <MenuItem value="Every 1 hour">Every 1 hour</MenuItem>
                        <MenuItem value="Every 6 hours">Every 6 hours</MenuItem>
                        <MenuItem value="Daily">Daily</MenuItem>
                      </Select>
                    </Box>
                  </Box>
                </Box>
              ))}

              <Button
                size="small" startIcon={<AddIcon />}
                style={{ textTransform: 'none', fontSize: 13 }}
                color="primary"
              >
                Add organization
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}

        <Button
          variant="outlined" startIcon={<AddIcon />}
          style={{ textTransform: 'none', fontSize: 13, marginTop: 8 }}
          color="primary"
        >
          Add content source
        </Button>

        <Box className={classes.saveBar}>
          <Button variant="outlined" style={{ textTransform: 'none', fontSize: 13 }}>
            Reset
          </Button>
          <Button variant="contained" color="primary" style={{ textTransform: 'none', fontSize: 13 }}>
            Save changes
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ContentSourcesPage = () => {
  const classes = useStyles();

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Content Sources
            <PageHelpIcon
              tooltipLabel="What are content sources?"
              title="What are Content Sources?"
              description="Content sources define what automation content the portal discovers from your connected platforms. Configure which organizations, repositories, and content types are synced, and how content is filtered."
            />
          </Box>
        }
        pageTitleOverride="Content Sources"
        subtitle="Configure what content the portal discovers from connected platforms"
      />
      <Content>
        <DismissibleBanner
          storageKey="admin-content-sources"
          message="Content sources control what the portal discovers from your connected platforms. Connections (hosts, credentials) are managed on the Connections page. Sync schedules and run history are on the Sync Activity page."
        />

        <Box className={classes.infoCallout}>
          <Typography style={{ fontSize: 13, lineHeight: 1.6 }}>
            <strong>How this page relates to other admin pages:</strong> The{' '}
            <a href="/self-service/admin/connections" style={{ color: '#0066CC' }}>Connections</a> page
            manages <em>where</em> to connect (hosts, credentials). This page manages <em>what</em> to discover.
            The <a href="/self-service/admin/sync-activity" style={{ color: '#0066CC' }}>Sync Activity</a> page
            shows operational status and lets you adjust <em>when</em> syncs run.
          </Typography>
        </Box>

        <AAPSyncSection />
        <PAHSection />
        <GitContentSection />
      </Content>
    </Page>
  );
};
