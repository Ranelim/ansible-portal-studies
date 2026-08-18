import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Select,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import WarningIcon from '@material-ui/icons/Warning';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import SettingsIcon from '@material-ui/icons/Settings';
import {
  EXPERIENCE_LABELS,
  writeNavExperience,
  type NavExperience,
} from '@ansible/plugin-backstage-self-service';
import {
  NOTIFICATION_PREF_EVENT,
  readNotificationPrefs,
  type NotificationEventType,
  type NotificationPrefs,
} from './notificationPrefs';

type ExperienceFilter = 'all' | Exclude<NavExperience, 'all'>;
type Severity = 'Critical' | 'Important' | 'Normal';
type ReadFilter = 'all' | 'unread';

type DemoItem = {
  id: string;
  title: string;
  description: string;
  /** Richer author payload shown when expanded. */
  detail: string;
  entity: string;
  experience: Exclude<NavExperience, 'all'>;
  eventType: NotificationEventType;
  when: string;
  severity: Severity;
  unread: boolean;
  /** Prototype deep link into the relevant experience surface. */
  href: string;
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

const INITIAL_ITEMS: DemoItem[] = [
  {
    id: '1',
    title: 'Template run failed',
    description: 'network-harden failed on step “Apply firewall rules”.',
    detail:
      'The run stopped after the playbook could not apply the firewall ruleset on host web-03. Review the Activity log, then re-run the template or open the repository to fix the task.',
    entity: 'network-harden',
    experience: 'automate',
    eventType: 'template-run-failures',
    when: '12 minutes ago',
    severity: 'Critical',
    unread: true,
    href: '/self-service/create/tasks',
  },
  {
    id: '2',
    title: 'Quality score dropped',
    description: 'edge-firewall fell from 82 to 64 after the latest scan.',
    detail:
      'APME reported new high-severity findings in roles/firewall. Score impact is concentrated in policy and security validators. Open the repository Quality tab to triage findings.',
    entity: 'edge-firewall',
    experience: 'develop-tabs',
    eventType: 'quality-alerts',
    when: '1 hour ago',
    severity: 'Important',
    unread: true,
    href: '/self-service/repositories',
  },
  {
    id: '3',
    title: 'Compliance scan completed',
    description: 'prod-rhel finished with no new critical findings.',
    detail:
      'Scheduled OpenSCAP scan against the DISA STIG profile completed successfully. No new critical findings since the last remediation cycle. Open Inventories to review the full report.',
    entity: 'prod-rhel',
    experience: 'compliance',
    eventType: 'compliance-results',
    when: 'Yesterday',
    severity: 'Normal',
    unread: false,
    href: '/self-service/inventories',
  },
  {
    id: '4',
    title: 'Fleet update ready',
    description: 'store-edge-west has a staged OS update ready to roll out.',
    detail:
      'A new OS image is staged for store-edge-west (48 devices). Review the update window and rollout policy before approving. Open Edge fleets to continue.',
    entity: 'store-edge-west',
    experience: 'edge',
    eventType: 'fleet-updates',
    when: '2 hours ago',
    severity: 'Normal',
    unread: true,
    href: '/self-service/edge-fleets',
  },
];

const FILTER_EXPERIENCES: Array<Exclude<NavExperience, 'all'>> = [
  'automate',
  'develop-tabs',
  'develop-drawer',
  'develop-apme',
  'compliance',
  'edge',
  'admin',
];

function readLastExperience(): Exclude<NavExperience, 'all'> | null {
  try {
    const raw = localStorage.getItem('portal-nav-experience');
    if (
      raw === 'automate' ||
      raw === 'develop-tabs' ||
      raw === 'develop-drawer' ||
      raw === 'develop-apme' ||
      raw === 'compliance' ||
      raw === 'edge' ||
      raw === 'admin'
    ) {
      return raw;
    }
    if (raw === 'develop' || raw === 'develop-section') return 'develop-tabs';
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
        parsed.experience === 'develop-tabs' ||
        parsed.experience === 'develop-drawer' ||
        parsed.experience === 'develop-apme' ||
        parsed.experience === 'compliance' ||
        parsed.experience === 'edge' ||
        parsed.experience === 'admin')
    ) {
      return parsed.experience;
    }
    if (
      parsed?.kind === 'experience' &&
      (parsed.experience === 'develop' ||
        parsed.experience === 'develop-section')
    ) {
      return 'develop-tabs';
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
  toolbarSpacer: {
    flex: 1,
    minWidth: theme.spacing(1),
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
  markAllBtn: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: 20,
  },
  settingsBtn: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: 20,
  },
  list: {
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: 0,
  },
  row: {
    position: 'relative',
    display: 'block',
    padding: 0,
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  rowUnread: {
    // Warm attention wash (not cool grey) — clears when expand marks read.
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(240, 171, 0, 0.14)'
        : '#FFFBE6',
  },
  rowExpanded: {
    // Stay neutral once open — do not keep unread tint under expanded detail.
    backgroundColor: 'transparent',
  },
  severityBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  rowHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    width: '100%',
    margin: 0,
    paddingTop: theme.spacing(1.75),
    paddingBottom: theme.spacing(1.75),
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(1.5),
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    font: 'inherit',
    color: 'inherit',
    transition: 'background-color 120ms ease',
    '&:hover': {
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.04)',
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: -2,
    },
  },
  rowHeaderBody: {
    flex: 1,
    minWidth: 0,
  },
  chevron: {
    flexShrink: 0,
    marginLeft: theme.spacing(1),
    marginTop: 2,
    color: theme.palette.text.secondary,
    transition: 'transform 160ms ease',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
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
  description: {
    fontSize: 13,
    lineHeight: 1.4,
    color: theme.palette.text.primary,
    marginTop: 4,
    opacity: 0.9,
  },
  meta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
  },
  expandPanel: {
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  detail: {
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.text.primary,
    marginTop: 0,
    marginBottom: theme.spacing(1.5),
    maxWidth: 720,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  actionBtn: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: 20,
  },
  empty: {
    textAlign: 'center',
    width: '100%',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

/**
 * Cross-experience notification center.
 * Row click expands author detail and marks that item read (expand = ack).
 * Multiple items can stay open — opening one does not collapse others.
 * Deep link is a secondary “Open in …” CTA. Open center ≠ mark all read.
 */
export const PortalNotificationsPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [items, setItems] = useState<DemoItem[]>(INITIAL_ITEMS);
  const [experienceFilter, setExperienceFilter] =
    useState<ExperienceFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    readNotificationPrefs(),
  );

  useEffect(() => {
    const refresh = () => setPrefs(readNotificationPrefs());
    window.addEventListener(NOTIFICATION_PREF_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(NOTIFICATION_PREF_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const currentExperience = useMemo(
    () => readReturnExperience() ?? readLastExperience(),
    [],
  );

  const subscribedItems = useMemo(
    () => items.filter(i => prefs[i.eventType]),
    [items, prefs],
  );

  const unreadCount = useMemo(
    () => subscribedItems.filter(i => i.unread).length,
    [subscribedItems],
  );

  const counts = useMemo(() => {
    const map: Partial<Record<Exclude<NavExperience, 'all'>, number>> = {};
    for (const id of FILTER_EXPERIENCES) {
      map[id] = subscribedItems.filter(i => i.experience === id).length;
    }
    return map;
  }, [subscribedItems]);

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
    return subscribedItems.filter(item => {
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
  }, [subscribedItems, experienceFilter, readFilter]);

  const markAllRead = () => {
    setItems(prev => prev.map(i => ({ ...i, unread: false })));
    if (readFilter === 'unread') {
      setReadFilter('all');
    }
  };

  const markItemRead = (id: string) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, unread: false } : i)),
    );
  };

  const toggleExpanded = (id: string) => {
    const wasOpen = expandedIds.has(id);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (wasOpen) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (!wasOpen) {
      markItemRead(id);
    }
  };

  const openInExperience = (item: DemoItem) => {
    markItemRead(item.id);
    writeNavExperience(item.experience);
    navigate(item.href);
  };

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
              <MenuItem value="all">All ({subscribedItems.length})</MenuItem>
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

          <Box className={classes.toolbarSpacer} />

          <Button
            className={classes.settingsBtn}
            color="primary"
            variant="text"
            size="small"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/notifications/settings')}
            style={{ borderRadius: 20 }}
          >
            Notification settings
          </Button>

          <Button
            className={classes.markAllBtn}
            color="primary"
            variant="outlined"
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={markAllRead}
            disabled={unreadCount === 0}
            style={{ borderRadius: 20 }}
          >
            Mark all read
          </Button>
        </Box>

        <List className={classes.list} disablePadding>
          {visible.map(item => {
            const sev = SEVERITY_STYLE[item.severity];
            const expanded = expandedIds.has(item.id);
            const experienceLabel = EXPERIENCE_LABELS[item.experience];
            const panelId = `notification-detail-${item.id}`;

            return (
              <ListItem
                key={item.id}
                className={`${classes.row} ${
                  item.unread && !expanded ? classes.rowUnread : ''
                } ${expanded ? classes.rowExpanded : ''}`}
                disableGutters
              >
                <span
                  className={classes.severityBar}
                  style={{ backgroundColor: sev.color }}
                  aria-hidden
                />
                <button
                  type="button"
                  className={classes.rowHeader}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleExpanded(item.id)}
                >
                  <Box className={classes.rowHeaderBody}>
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
                    <Typography className={classes.description} component="p">
                      {item.description}
                    </Typography>
                    <Typography className={classes.meta} component="p">
                      {item.entity} · {experienceLabel} · {item.when}
                    </Typography>
                  </Box>
                  <ExpandMoreIcon
                    className={`${classes.chevron} ${
                      expanded ? classes.chevronOpen : ''
                    }`}
                    fontSize="small"
                    aria-hidden
                  />
                </button>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <Box
                    id={panelId}
                    className={classes.expandPanel}
                    role="region"
                    aria-label={`${item.title} details`}
                  >
                    <Typography className={classes.detail} component="p">
                      {item.detail}
                    </Typography>
                    <Box className={classes.actions}>
                      <Button
                        className={classes.actionBtn}
                        color="primary"
                        variant="contained"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => openInExperience(item)}
                        style={{ borderRadius: 20 }}
                      >
                        Open in {experienceLabel}
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </ListItem>
            );
          })}
          {visible.length === 0 && (
            <ListItem>
              <Box className={classes.empty}>
                <NotificationsNoneIcon style={{ opacity: 0.3, fontSize: 36 }} />
                <Typography color="textSecondary">
                  {subscribedItems.length === 0 ? (
                    <>
                      No notification types enabled.{' '}
                      <Button
                        color="primary"
                        size="small"
                        className={classes.settingsBtn}
                        onClick={() => navigate('/notifications/settings')}
                        style={{
                          textTransform: 'none',
                          minWidth: 0,
                          padding: 0,
                          verticalAlign: 'baseline',
                        }}
                      >
                        Notification settings
                      </Button>
                    </>
                  ) : readFilter === 'unread'
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
