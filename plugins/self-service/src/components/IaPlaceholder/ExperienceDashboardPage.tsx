import { Link as RouterLink } from 'react-router-dom';
import { Page, Header, Content, InfoCard } from '@backstage/core-components';
import {
  Box,
  Chip,
  Link,
  Typography,
  makeStyles,
} from '@material-ui/core';
import {
  EXPERIENCE_LABELS,
  useNavIaModel,
  type NavExperience,
} from '../../hooks/useNavIaModel';

type Kpi = { value: string; label: string; hint: string };
type Shortcut = { label: string; href: string };

type DashCopy = {
  purpose: string;
  kpis: Kpi[];
  attention: string[];
  shortcuts: Shortcut[];
};

const useStyles = makeStyles(theme => ({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    maxWidth: 880,
  },
  muted: {
    color: theme.palette.text.secondary,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: theme.spacing(2),
  },
  kpi: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    minHeight: 96,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
  },
  shortcutRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
}));

const COPY: Partial<Record<NavExperience, DashCopy>> = {
  develop: {
    purpose:
      'Cross-entity overview for Develop — repos, collections, and execution environments. Entity rail items open the lists; this page is posture and attention only.',
    kpis: [
      { value: '12', label: 'Git repositories', hint: '3 need attention' },
      { value: '78', label: 'Avg quality', hint: 'APME score' },
      { value: '4', label: 'EE builds', hint: '1 failed (7d)' },
      { value: '26', label: 'Collections', hint: 'Synced' },
    ],
    attention: [
      'network-harden — quality dropped below threshold',
      'ee-rhel9-base — last build failed',
      '2 repos with pipeline failures',
    ],
    shortcuts: [
      { label: 'Git Repositories', href: '/self-service/repositories' },
      { label: 'Collections', href: '/self-service/collections' },
      { label: 'Execution Environments', href: '/self-service/ee' },
      { label: 'Templates', href: '/create?scope=experience' },
    ],
  },
  compliance: {
    purpose:
      'Experience overview for Compliance — posture across inventories. Inventories in the rail opens the list; overview lives here so the entity page stays list-first.',
    kpis: [
      { value: '86%', label: 'Compliant', hint: 'Across inventories' },
      { value: '3', label: 'Critical findings', hint: 'Open' },
      { value: '11', label: 'Medium findings', hint: 'Open' },
      { value: '2', label: 'Scans running', hint: 'In progress' },
    ],
    attention: [
      'prod-web — 3 critical CIS failures',
      'pci-db — scan overdue by 4 days',
      'Remediation template ready for 8 hosts',
    ],
    shortcuts: [
      { label: 'Inventories', href: '/self-service/inventories' },
      { label: 'Templates', href: '/create?scope=experience' },
      { label: 'Activity', href: '/self-service/create/tasks' },
    ],
  },
  edge: {
    purpose:
      'Experience overview for Edge — fleet health and devices needing attention. Edge fleets in the rail opens the fleets list; Devices / Images stay as entity tabs.',
    kpis: [
      { value: '2', label: 'Fleets', hint: '1 degraded' },
      { value: '148', label: 'Devices', hint: '4 offline' },
      { value: '12', label: 'Pending update', hint: 'Awaiting window' },
      { value: '3', label: 'Images', hint: 'In use' },
    ],
    attention: [
      'plant-floor-a — 4 devices offline',
      '12 devices pending OS image roll',
      'Enrollment token expires in 3 days',
    ],
    shortcuts: [
      { label: 'Edge fleets', href: '/self-service/edge-fleets' },
      { label: 'Templates', href: '/create?scope=experience' },
      { label: 'Activity', href: '/self-service/create/tasks' },
    ],
  },
};

/**
 * Option 3 — experience Dashboard (rail landing for domain experiences).
 * Cross-entity / posture overview. Entity menu items stay list-first.
 */
export const ExperienceDashboardPage = () => {
  const classes = useStyles();
  const { experience } = useNavIaModel();
  const scoped: NavExperience =
    experience === 'admin' || experience === 'all' || experience === 'automate'
      ? 'develop'
      : experience;
  const label = EXPERIENCE_LABELS[scoped] ?? scoped;
  const copy = COPY[scoped] ?? COPY.develop!;

  return (
    <Page themeId="tool">
      <Header
        title={`${label} dashboard`}
        subtitle="Experience overview"
        pageTitleOverride={`${label} dashboard`}
      />
      <Content>
        <Box className={classes.body}>
          <Typography className={classes.muted}>{copy.purpose}</Typography>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              At a glance
            </Typography>
            <Box className={classes.kpiGrid}>
              {copy.kpis.map(kpi => (
                <Box key={kpi.label} className={classes.kpi}>
                  <Typography className={classes.kpiValue}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2">{kpi.label}</Typography>
                  <Typography variant="caption" className={classes.muted}>
                    {kpi.hint}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <InfoCard title="Needs attention">
            <Box className={classes.chipRow}>
              {copy.attention.map(item => (
                <Chip
                  key={item}
                  label={item}
                  size="small"
                  variant="outlined"
                  style={{ borderRadius: 16 }}
                />
              ))}
            </Box>
          </InfoCard>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Open
            </Typography>
            <Box className={classes.shortcutRow}>
              {copy.shortcuts.map(s => (
                <Link
                  key={s.href}
                  component={RouterLink}
                  to={s.href}
                  underline="hover"
                >
                  {s.label}
                </Link>
              ))}
            </Box>
          </Box>
        </Box>
      </Content>
    </Page>
  );
};
