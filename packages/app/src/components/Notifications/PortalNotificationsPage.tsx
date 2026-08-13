import { useMemo, useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import WarningIcon from '@material-ui/icons/Warning';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import {
  EXPERIENCE_LABELS,
  type NavExperience,
} from '@ansible/plugin-backstage-self-service';

type ExperienceFilter = 'all' | Exclude<NavExperience, 'all'>;
type Severity = 'Critical' | 'Important' | 'Normal';
type ReadFilter = 'all' | 'unread';

type DemoItem = {
  id: string;
  title: string;
  entity: string;
  experience: Exclude<NavExperience, 'all'>;
  when: string;
  severity: Severity;
  unread: boolean;
};

/** PF6 status intent — bar + label share these colors (icon + text, not color alone). */
const SEVERITY_STYLE: Record<
  Severity,
  { color: string; bg: string; label: string }
> = {
  Critical: { color: '#C9190B', bg: 'rgba(201, 25, 11, 0.12)', label: 'Critical' },
  Important: {
    color: '#F0AB00',
    bg: 'rgba(240, 171, 0, 0.16)',
    label: 'Important',
  },
  Normal: { color: '#0066CC', bg: 'rgba(0, 102, 204, 0.12)', label: 'Normal' },
};

const DEMO_ITEMS: DemoItem[] = [
  {
    id: '1',
    title: 'Template run failed',
    entity: 'network-harden',
    experience: 'automate',
    when: '12 minutes ago',
    severity: 'Critical',
    unread: true,
  },
  {
    id: '2',
    title: 'Quality score dropped',
    entity: 'edge-firewall',
    experience: 'develop',
    when: '1 hour ago',
    severity: 'Important',
    unread: true,
  },
  {
    id: '3',
    title: 'Compliance scan completed',
    entity: 'prod-rhel',
    experience: 'compliance',
    when: 'Yesterday',
    severity: 'Normal',
    unread: false,
  },
  {
    id: '4',
    title: 'Fleet update ready',
    entity: 'store-edge-west',
    experience: 'edge',
    when: '2 hours ago',
    severity: 'Normal',
    unread: true,
  },
];

const FILTER_EXPERIENCES: Array<Exclude<NavExperience, 'all'>> = [
  'automate',
  'develop',
  'compliance',
  'edge',
  'admin',
];

function readLastExperience(): Exclude<NavExperience, 'all'> | null {
  try {
    const raw = localStorage.getItem('portal-nav-experience');
    if (
      raw === 'automate' ||
      raw === 'develop' ||
      raw === 'compliance' ||
      raw === 'edge' ||
      raw === 'admin'
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readReturnExperience(): Exclude<NavExperience, 'all'> | null {
  try {
    const raw = sessionStorage.getItem('portal-global-shell-return');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      kind?: string;
      experience?: string;
    };
    if (
      parsed?.kind === 'experience' &&
      (parsed.experience === 'automate' ||
        parsed.experience === 'develop' ||
        parsed.experience === 'compliance' ||
        parsed.experience === 'edge' ||
        parsed.experience === 'admin')
    ) {
      return parsed.experience;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function SeverityIcon({ severity }: { severity: Severity }) {
  const style = { fontSize: 14, color: SEVERITY_STYLE[severity].color };
  if (severity === 'Critical') return <ErrorOutlineIcon style={style} aria-hidden />;
  if (severity === 'Important') return <WarningIcon style={style} aria-hidden />;
  return <InfoOutlinedIcon style={style} aria-hidden />;
}

const useStyles = makeStyles(theme => ({
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  experienceSelect: {
    minWidth: 200,
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
      backgroundColor: theme.palette.background.paper,
    },
  },
  unreadBtn: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    minWidth: 0,
  },
  list: {
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: 0,
  },
  row: {
    position: 'relative',
    alignItems: 'flex-start',
    paddingTop: theme.spacing(1.75),
    paddingBottom: theme.spacing(1.75),
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: 'background-color 120ms ease',
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      // Slightly stronger than unread wash so hover still reads
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.04)',
    },
  },
  rowUnread: {
    // Cool grey whisper — unread, not severity (avoids warning-yellow collision)
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0, 0, 0, 0.035)',
  },
  severityBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  title: {
    fontWeight: 500,
    fontSize: 14,
    lineHeight: 1.35,
    color: theme.palette.text.primary,
  },
  titleUnread: {
    fontWeight: 700,
  },
  severityLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 22,
    padding: '0 8px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1,
    flexShrink: 0,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
  meta: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    width: '100%',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

/**
 * Cross-experience notification center — PF6 status intent on MUI.
 * Severity = bar + label; unread = cool wash + title weight + toolbar filter.
 */
export const PortalNotificationsPage = () => {
  const classes = useStyles();
  const [experienceFilter, setExperienceFilter] =
    useState<ExperienceFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const currentExperience = useMemo(
    () => readReturnExperience() ?? readLastExperience(),
    [],
  );

  const unreadCount = useMemo(
    () => DEMO_ITEMS.filter(i => i.unread).length,
    [],
  );

  const counts = useMemo(() => {
    const map: Partial<Record<Exclude<NavExperience, 'all'>, number>> = {};
    for (const id of FILTER_EXPERIENCES) {
      map[id] = DEMO_ITEMS.filter(i => i.experience === id).length;
    }
    return map;
  }, []);

  const menuExperiences = useMemo(() => {
    const withItems = FILTER_EXPERIENCES.filter(id => (counts[id] ?? 0) > 0);
    if (!currentExperience || !(counts[currentExperience] > 0)) {
      return withItems;
    }
    return [
      currentExperience,
      ...withItems.filter(id => id !== currentExperience),
    ];
  }, [counts, currentExperience]);

  const visible = useMemo(() => {
    return DEMO_ITEMS.filter(item => {
      if (
        experienceFilter !== 'all' &&
        item.experience !== experienceFilter
      ) {
        return false;
      }
      if (readFilter === 'unread' && !item.unread) {
        return false;
      }
      return true;
    });
  }, [experienceFilter, readFilter]);

  return (
    <Page themeId="app">
      <Header title="Notifications" pageTitleOverride="Notifications" />
      <Content>
        <Box className={classes.toolbar}>
          <FormControl
            className={classes.experienceSelect}
            size="small"
            variant="outlined"
          >
            <InputLabel id="notifications-experience-label">
              Experience
            </InputLabel>
            <Select
              labelId="notifications-experience-label"
              label="Experience"
              value={experienceFilter}
              onChange={e =>
                setExperienceFilter(e.target.value as ExperienceFilter)
              }
              inputProps={{ 'aria-label': 'Filter by experience' }}
            >
              <MenuItem value="all">All ({DEMO_ITEMS.length})</MenuItem>
              {menuExperiences.map(id => (
                <MenuItem key={id} value={id}>
                  {EXPERIENCE_LABELS[id]}
                  {id === currentExperience ? ' (current)' : ''}
                  {` (${counts[id] ?? 0})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            className={classes.unreadBtn}
            color="primary"
            variant={readFilter === 'unread' ? 'contained' : 'text'}
            size="small"
            onClick={() =>
              setReadFilter(prev => (prev === 'unread' ? 'all' : 'unread'))
            }
            aria-pressed={readFilter === 'unread'}
          >
            {unreadCount} unread
          </Button>
        </Box>

        <List className={classes.list} disablePadding>
          {visible.map(item => {
            const sev = SEVERITY_STYLE[item.severity];
            return (
              <ListItem
                key={item.id}
                className={`${classes.row} ${
                  item.unread ? classes.rowUnread : ''
                }`}
                button={false}
              >
                <span
                  className={classes.severityBar}
                  style={{ backgroundColor: sev.color }}
                  aria-hidden
                />
                <ListItemText
                  disableTypography
                  primary={
                    <Box className={classes.titleRow}>
                      <Typography
                        className={`${classes.title} ${
                          item.unread ? classes.titleUnread : ''
                        }`}
                        component="span"
                      >
                        {item.title}
                      </Typography>
                      <span
                        className={classes.severityLabel}
                        style={{ color: sev.color, backgroundColor: sev.bg }}
                      >
                        <span className={classes.srOnly}>
                          Severity: {sev.label}.{' '}
                          {item.unread ? 'Unread. ' : 'Read. '}
                        </span>
                        <SeverityIcon severity={item.severity} />
                        {sev.label}
                      </span>
                    </Box>
                  }
                  secondary={
                    <Typography className={classes.meta} component="p">
                      {item.entity} · {EXPERIENCE_LABELS[item.experience]} ·{' '}
                      {item.when}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
          {visible.length === 0 && (
            <ListItem>
              <Box className={classes.empty}>
                <NotificationsNoneIcon style={{ opacity: 0.3, fontSize: 36 }} />
                <Typography color="textSecondary">
                  {readFilter === 'unread'
                    ? "You're all caught up"
                    : experienceFilter === 'all'
                      ? "You're all caught up"
                      : `No notifications in ${EXPERIENCE_LABELS[experienceFilter]}`}
                </Typography>
              </Box>
            </ListItem>
          )}
        </List>
      </Content>
    </Page>
  );
};
