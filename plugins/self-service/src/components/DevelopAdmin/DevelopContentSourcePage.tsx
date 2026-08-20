import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Page, Header, HeaderTabs, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  Switch,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ArrowBack from '@material-ui/icons/ArrowBack';
import SyncIcon from '@material-ui/icons/Sync';
import {
  DEMO_CONNECTIONS,
  DEMO_SYNC_SCHEDULES,
} from '../Admin/syncDemoData';
import { statusColors } from '../common/statusColors';
import { DEVELOP_ADMIN_BASE, DEVELOP_ADMIN_SUBTITLE } from './developAdminShared';

const FREQUENCY = [
  'Every 15 min',
  'Every 30 min',
  'Every 1 hour',
  'Every 6 hours',
  'Daily',
];

const GIT_ORGS: Record<string, { name: string; branches: string[] }[]> = {
  github: [
    { name: 'ansible-collections', branches: ['main'] },
    { name: 'ansible-network', branches: ['main', 'devel'] },
  ],
  gitlab: [{ name: 'platform-automation', branches: ['main'] }],
};

const PAH_REMOTES = [
  { name: 'rh-certified', description: 'Red Hat Certified Content from partners' },
  { name: 'validated', description: 'Community collections tested against AAP' },
  { name: 'published', description: 'Internally published collections' },
];

const useStyles = makeStyles(theme => ({
  backButton: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.text.secondary,
    padding: '4px 10px',
    marginLeft: -8,
    marginBottom: theme.spacing(1),
    minWidth: 0,
    borderRadius: 16,
    '& .MuiButton-startIcon': { marginRight: 6 },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
  },
  card: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 600,
    fontSize: 15,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  org: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(1.5, 2),
    marginBottom: theme.spacing(1.5),
  },
  orgName: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(1, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': { borderBottom: 'none' },
  },
  pill: {
    textTransform: 'none',
    borderRadius: 20,
    fontSize: 13,
  },
}));

export const DevelopContentSourcePage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { providerId } = useParams<{ providerId: string }>();
  const provider = DEMO_CONNECTIONS.find(c => c.id === providerId);
  const [tab, setTab] = useState(0);

  const initialSchedules = useMemo(() => {
    if (!provider) return [];
    const fromDemo = DEMO_SYNC_SCHEDULES.filter(
      s =>
        s.source.toLowerCase().includes(provider.name.split(' ')[0].toLowerCase()) ||
        (provider.id === 'pah' && s.source === 'Private Automation Hub') ||
        (provider.id === 'github' && s.source === 'GitHub'),
    );
    if (fromDemo.length) return fromDemo.map(s => ({ ...s }));
    return provider.syncJobs.map((job, i) => ({
      id: `${provider.id}-${i}`,
      source: provider.name,
      syncJob: job.name,
      interval: job.interval,
      lastRun: provider.lastSync ?? '—',
      nextRun: '—',
      enabled: job.enabled,
      lastStatus: 'Success' as const,
    }));
  }, [provider]);

  const [schedules, setSchedules] = useState(initialSchedules);

  useEffect(() => {
    setTab(0);
    setSchedules(initialSchedules);
  }, [providerId, initialSchedules]);

  if (!provider) {
    return (
      <Page themeId="app">
        <Header title="Source not found" />
        <Content>
          <Button
            className={classes.backButton}
            variant="text"
            color="inherit"
            size="small"
            startIcon={<ArrowBack fontSize="small" />}
            onClick={() => navigate(`${DEVELOP_ADMIN_BASE}/content`)}
          >
            Content
          </Button>
        </Content>
      </Page>
    );
  }

  const connected = provider.status === 'Active';
  const isGit = provider.type === 'git';
  const orgs = GIT_ORGS[provider.id] ?? [];

  return (
    <Page themeId="app">
      <Header
        title={provider.name}
        pageTitleOverride={provider.name}
        subtitle={DEVELOP_ADMIN_SUBTITLE}
      >
        <Box display="flex" alignItems="center" style={{ gap: 12 }}>
          <Chip
            label={connected ? 'Connected' : 'Not connected'}
            size="small"
            style={{
              backgroundColor: connected
                ? 'rgba(99,153,61,0.15)'
                : 'rgba(0,0,0,0.06)',
              color: connected ? statusColors.success : undefined,
            }}
          />
          <Button
            className={classes.pill}
            variant="outlined"
            color="primary"
            size="small"
            onClick={() =>
              navigate(`/self-service/admin/integrations/${provider.id}`)
            }
          >
            View connection
          </Button>
        </Box>
      </Header>
      <HeaderTabs
        selectedIndex={tab}
        onChange={setTab}
        tabs={[{ id: 'content', label: 'Content' }, { id: 'sync', label: 'Sync' }]}
      />
      <Content>
        <Button
          className={classes.backButton}
          variant="text"
          color="inherit"
          size="small"
          startIcon={<ArrowBack fontSize="small" />}
          onClick={() => navigate(`${DEVELOP_ADMIN_BASE}/content`)}
        >
          Content
        </Button>

        {tab === 0 && isGit && (
          <Box className={classes.card}>
            <Typography className={classes.title}>
              Organizations and repositories
            </Typography>
            <Typography className={classes.hint}>
              What lands under Git Repositories. Connection credentials stay in
              Integrations.
            </Typography>
            {orgs.map(org => (
              <Box key={org.name} className={classes.org}>
                <Typography className={classes.orgName}>{org.name}</Typography>
                <Typography className={classes.hint} style={{ marginBottom: 0 }}>
                  Branches: {org.branches.join(', ')}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {tab === 0 && provider.id === 'pah' && (
          <Box className={classes.card}>
            <Typography className={classes.title}>Content remotes</Typography>
            <Typography className={classes.hint}>
              Remotes that feed Collections. Connect Private Automation Hub in
              Integrations if this source is empty.
            </Typography>
            {PAH_REMOTES.map(remote => (
              <Box key={remote.name} className={classes.org}>
                <Typography className={classes.orgName}>{remote.name}</Typography>
                <Typography className={classes.hint} style={{ marginBottom: 0 }}>
                  {remote.description}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {tab === 1 && (
          <Box className={classes.card}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              style={{ marginBottom: 16 }}
            >
              <Box>
                <Typography className={classes.title} style={{ marginBottom: 0 }}>
                  Sync schedules
                </Typography>
                <Typography className={classes.hint} style={{ marginBottom: 0 }}>
                  How often Develop pulls from {provider.name}.
                </Typography>
              </Box>
              <Button
                className={classes.pill}
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<SyncIcon style={{ fontSize: 16 }} />}
              >
                Sync all now
              </Button>
            </Box>
            {schedules.map(row => (
              <Box key={row.id} className={classes.row}>
                <Box>
                  <Typography style={{ fontWeight: 500, fontSize: 13 }}>
                    {row.syncJob}
                  </Typography>
                  <Typography className={classes.hint} style={{ marginBottom: 0 }}>
                    Last sync: {row.lastRun}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                  <Typography
                    style={{
                      fontSize: 12,
                      color: row.enabled ? statusColors.success : '#999',
                      fontWeight: 500,
                    }}
                  >
                    {row.enabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Switch
                    color="primary"
                    size="small"
                    checked={row.enabled}
                    onChange={(_, enabled) =>
                      setSchedules(prev =>
                        prev.map(s => (s.id === row.id ? { ...s, enabled } : s)),
                      )
                    }
                  />
                  <Select
                    value={row.interval}
                    onChange={event =>
                      setSchedules(prev =>
                        prev.map(s =>
                          s.id === row.id
                            ? { ...s, interval: String(event.target.value) }
                            : s,
                        ),
                      )
                    }
                    variant="outlined"
                    style={{ fontSize: 13, height: 36 }}
                  >
                    {FREQUENCY.map(opt => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                    {!FREQUENCY.includes(row.interval) && (
                      <MenuItem value={row.interval}>{row.interval}</MenuItem>
                    )}
                  </Select>
                </Box>
              </Box>
            ))}
            {schedules.length === 0 && (
              <Typography className={classes.hint}>
                No schedules until this source is connected.
              </Typography>
            )}
          </Box>
        )}
      </Content>
    </Page>
  );
};
