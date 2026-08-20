import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Page, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Popover,
  Select,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CodeIcon from '@material-ui/icons/Code';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import DevicesOtherIcon from '@material-ui/icons/DevicesOther';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import SettingsIcon from '@material-ui/icons/Settings';
import ChatIcon from '@material-ui/icons/Chat';
import {
  availableExperiences,
  EXPERIENCE_LABELS,
  useNavIaModel,
  writeNavExperience,
} from '../../hooks/useNavIaModel';
import { useBridgeExperienceVisibility } from '../../hooks/bridgeExperienceVisibility';
import {
  EXPERIENCE_LANDING,
  pushRecentExperience,
  readRecentExperiences,
  JOB_EXPERIENCE_IDS,
  type ExperienceId,
  type JobExperienceId,
} from '../../hooks/experienceRecent';
import { useNavPlugins } from '../../hooks/useNavPlugins';
import { useUserRoleContext } from '../../hooks/useUserRole';
import { SHOW_ASSISTANT_EXPERIENCE } from './assistantIaTrial';
import {
  EXPERIENCE_ACCENT,
  ExperienceThumbnail,
} from './experienceVisuals';
import { AttentionDot } from '../common/AttentionDot';
import { useExperienceSetup } from '../../hooks/experienceSetup';
import { useDevSpacesSetup } from '../../hooks/devSpacesSetup';
import { useAttentionSeen } from '../../hooks/attentionSeen';

type SortMode = 'recent' | 'az';
type CardStyle = 'accent' | 'hub';

/** Temp prototype chrome — kept for when compare bar is re-enabled. */
const MAGENTA = '#BE0098';

/**
 * Compare UI is hidden — force B (Hub catalog).
 * Set to `null` and restore the magenta bar to bring A back.
 */
const FORCED_CARD_STYLE: CardStyle | null = 'hub';

/** User-facing experience blurbs — not IA documentation. */
const EXPERIENCE_BLURB: Record<JobExperienceId, string> = {
  automate: 'Run job templates and track recent activity.',
  develop:
    'Create and manage automation content — git repositories, collections, and execution environments.',
  compliance: 'Scan inventories, review findings, and remediate hosts.',
  edge: 'Manage edge device fleets, updates, and desired state.',
  orchestrator:
    'Browse certified Automation Orchestrator workflows and extra node types.',
};

const CARD_STYLE_KEY = 'portal-experience-card-style';

/**
 * Prototype doc targets — replace with real Portal experience docs when available.
 * Prefer docs.redhat.com AAP / self-service portal family.
 */
const EXPERIENCE_DOCS: Record<
  JobExperienceId | 'assistant',
  { summary: string; href: string; linkLabel: string }
> = {
  automate: {
    summary:
      'Use Automate to run job templates and track activity across Automation Portal.',
    href: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/2.6/html/using_self-service_automation_portal/self-service-working-templates_aap-self-service-using',
    linkLabel: 'View Automate documentation',
  },
  develop: {
    summary:
      'Use Develop to manage git repositories, collections, and execution environments. Quality scans and remediations live on Git Repositories.',
    href: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/2.6/html/using_self-service_automation_portal/index',
    linkLabel: 'View Develop documentation',
  },
  compliance: {
    summary:
      'Compliance helps you scan host inventories, review findings, and remediate against security baselines.',
    href: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform',
    linkLabel: 'View Compliance documentation',
  },
  edge: {
    summary:
      'Edge manages device fleets, desired state, and updates for intermittent-connectivity sites.',
    href: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform',
    linkLabel: 'View Edge documentation',
  },
  orchestrator: {
    summary:
      'Orchestrator is a catalog of certified Automation Orchestrator workflows and extra node types.',
    href: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform',
    linkLabel: 'View Orchestrator documentation',
  },
  assistant: {
    summary:
      'Assistant helps across experiences — ask questions and take actions without leaving Automation Portal.',
    href: 'https://docs.redhat.com/en/documentation/red_hat_ansible_automation_platform/2.6/html/using_self-service_automation_portal/index',
    linkLabel: 'View Assistant documentation',
  },
};

function experienceIcon(id: ExperienceId | 'assistant'): ReactNode {
  const props = { style: { fontSize: 22 } };
  switch (id) {
    case 'automate':
      return <PlayArrowIcon {...props} />;
    case 'develop':
      return <CodeIcon {...props} />;
    case 'compliance':
      return <VerifiedUserIcon {...props} />;
    case 'edge':
      return <DevicesOtherIcon {...props} />;
    case 'orchestrator':
      return <AccountTreeIcon {...props} />;
    case 'assistant':
      return <ChatIcon {...props} />;
    default:
      return null;
  }
}

function readCardStyle(): CardStyle {
  if (FORCED_CARD_STYLE) return FORCED_CARD_STYLE;
  try {
    const raw = localStorage.getItem(CARD_STYLE_KEY);
    if (raw === 'hub' || raw === 'accent') return raw;
  } catch {
    /* ignore */
  }
  return 'accent';
}

const useStyles = makeStyles(theme => ({
  /** Full-bleed under masthead — temp A/B chrome only. */
  compareBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    margin: theme.spacing(-3, -3, 2.5),
    padding: theme.spacing(1, 2),
    backgroundColor: MAGENTA,
    color: '#fff',
    borderBottom: `2px solid ${MAGENTA}`,
  },
  compareEyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    opacity: 0.9,
    flexShrink: 0,
  },
  compareHint: {
    fontSize: 12,
    opacity: 0.9,
    marginRight: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  compareTabs: {
    display: 'flex',
    gap: 6,
    marginLeft: 'auto',
  },
  compareTab: {
    appearance: 'none' as const,
    border: '1px solid rgba(255,255,255,0.55)',
    background: 'transparent',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    '&:focus-visible': {
      outline: '2px solid #fff',
      outlineOffset: 2,
    },
  },
  compareTabActive: {
    backgroundColor: '#fff',
    color: MAGENTA,
    borderColor: '#fff',
    '&:hover': {
      backgroundColor: '#fff',
    },
  },
  prompt: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginBottom: theme.spacing(2),
  },
  promptRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
  },
  promptTitle: {
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.3,
  },
  infoButton: {
    padding: 4,
    color: theme.palette.text.secondary,
  },
  cardInfoButton: {
    padding: 0,
    width: 22,
    height: 22,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.secondary,
    // Kill MUI IconButton default min size so it sits flush with chip / logo top
    minWidth: 22,
    minHeight: 22,
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
    },
  },
  /** PF tertiary-style quiet control (MUI outlined) — platform chrome, not a Launch CTA. */
  adminButton: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: 20,
    whiteSpace: 'nowrap',
    color: theme.palette.text.secondary,
    backgroundColor: 'transparent',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.03)',
      borderColor: theme.palette.text.secondary,
      boxShadow: 'none',
    },
    '& .MuiButton-startIcon': {
      color: 'inherit',
    },
  },
  adminButtonLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2.5),
  },
  search: {
    flex: '1 1 220px',
    maxWidth: 360,
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
      backgroundColor: theme.palette.background.paper,
    },
  },
  sortControl: {
    minWidth: 160,
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
      backgroundColor: theme.palette.background.paper,
    },
  },
  tileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: theme.spacing(2.5),
  },
  tile: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 180,
    cursor: 'pointer',
    transition: 'transform 140ms ease, box-shadow 140ms ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  },
  tileAi: {
    borderColor: 'rgba(0, 102, 204, 0.35)',
    boxShadow: '0 0 0 1px rgba(0, 102, 204, 0.08)',
  },
  tileAccent: {
    height: 56,
    position: 'relative',
    backgroundImage:
      'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.12) 100%)',
  },
  tileBody: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    flex: 1,
  },
  tileTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  tileTitle: {
    fontWeight: 700,
    fontSize: 18,
  },
  /** Hub / Galaxy collections gallery — fixed card width wrap. */
  hubGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
  },
  hubCard: {
    width: 280,
    minHeight: 168,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'box-shadow 160ms ease',
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  },
  hubLogoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: theme.spacing(2, 2, 1),
  },
  hubLogo: {
    width: 40,
    height: 40,
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
  },
  hubBadgeArea: {
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    minHeight: 22,
    // Pin to top of logo box (not vertically centered in the 40px row)
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  hubBadgeChip: {
    height: 22,
    fontSize: 11,
  },
  hubNameBlock: {
    padding: theme.spacing(0, 2, 0.5),
  },
  hubName: {
    fontWeight: 700,
    fontSize: 16,
    color: theme.palette.primary.main,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  hubDescription: {
    padding: theme.spacing(0, 2),
    fontSize: 14,
    lineHeight: 1.4,
    color: theme.palette.text.primary,
  },
  hubActions: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: theme.spacing(1.5, 2, 2),
    marginTop: 'auto',
  },
  /** Secondary launch — outlined blue on white (not primary filled). */
  hubLaunch: {
    borderRadius: 20,
    textTransform: 'none',
    fontWeight: 600,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
    },
  },
  popoverPaper: {
    maxWidth: 320,
    padding: theme.spacing(1.5, 2),
  },
  popoverBody: {
    fontSize: 13,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  popoverLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    fontWeight: 600,
  },
  empty: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(3, 0),
  },
  /** Option B + SME: Automate removed — Bridge has no job-mode cards. */
  emptyCallout: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2, 2.5),
    borderRadius: 4,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
  },
  emptyCalloutTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
  emptyCalloutBody: {
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
  },
}));

/** PF-aligned: click info icon → popover with short copy + docs link (MUI implementation). */
const ExperienceDocsPopover = ({
  docsKey,
  label,
}: {
  docsKey: JobExperienceId | 'assistant';
  label: string;
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const docs = EXPERIENCE_DOCS[docsKey];
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        className={classes.cardInfoButton}
        size="small"
        aria-label={`About ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          setAnchorEl(e.currentTarget);
        }}
        onKeyDown={e => e.stopPropagation()}
      >
        <HelpOutlineIcon style={{ fontSize: 18 }} />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={e => e.stopPropagation()}
        PaperProps={{ className: classes.popoverPaper }}
      >
        <Typography className={classes.popoverBody}>{docs.summary}</Typography>
        <Link
          className={classes.popoverLink}
          href={docs.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
        >
          {docs.linkLabel}
          <OpenInNewIcon style={{ fontSize: 14 }} />
        </Link>
      </Popover>
    </>
  );
};

/**
 * Experience Bridge — masthead + lean card catalog (no left rail).
 * Enter = whole-card click or secondary Launch button.
 * Administration = top-right platform control (not an experience card).
 * Magenta A/B tabs = temp design compare (accent tiles vs Hub catalog).
 */
export const ExperiencesHomePage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, hasRole } = useUserRoleContext();
  const { plugins } = useNavPlugins();
  const { setExperience } = useNavIaModel();
  const isAdmin = hasRole('admin');
  const { visibility: bridgeVisibility } = useBridgeExperienceVisibility();
  const { setup: orchestratorSetup } = useExperienceSetup('orchestrator');
  const { connected: devSpacesConnected } = useDevSpacesSetup();
  const { seen: discoverSeen, exiting: discoverExiting } =
    useAttentionSeen('experiences-discover');
  const { seen: needsSetupSeen, exiting: needsSetupExiting } =
    useAttentionSeen('integrations-needs-setup');
  const experienceAttention = !orchestratorSetup && !discoverSeen;
  const integrationsAttention = !devSpacesConnected && !needsSetupSeen;
  const showAdminDot = experienceAttention || integrationsAttention;
  const adminExiting =
    showAdminDot &&
    (!experienceAttention || discoverExiting) &&
    (!integrationsAttention || needsSetupExiting);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [recent, setRecent] = useState<ExperienceId[]>(() =>
    readRecentExperiences(),
  );
  const [cardStyle, setCardStyle] = useState<CardStyle>(() => readCardStyle());

  const available = useMemo(
    () =>
      availableExperiences({
        role,
        isAdmin,
        compliance: plugins.compliance,
        rhem: plugins.rhem,
        bridgeVisibility,
      }).filter((id): id is JobExperienceId =>
        (JOB_EXPERIENCE_IDS as readonly string[]).includes(id),
      ),
    [role, isAdmin, plugins.compliance, plugins.rhem, bridgeVisibility],
  );

  // Old /experiences/dashboard bookmark → catalog
  useEffect(() => {
    if (location.pathname.endsWith('/dashboard')) {
      navigate('/self-service/experiences', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    setRecent(readRecentExperiences());
  }, [location.pathname]);

  useEffect(() => {
    document.title = 'Experiences | Automation Portal';
  }, []);

  const setCardStylePersist = (next: CardStyle) => {
    setCardStyle(next);
    try {
      localStorage.setItem(CARD_STYLE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const sortedFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = available.filter(id => {
      if (!q) return true;
      return (
        EXPERIENCE_LABELS[id].toLowerCase().includes(q) ||
        EXPERIENCE_BLURB[id].toLowerCase().includes(q)
      );
    });
    if (sort === 'az') {
      list = [...list].sort((a, b) =>
        EXPERIENCE_LABELS[a].localeCompare(EXPERIENCE_LABELS[b]),
      );
    } else {
      const rank = new Map(recent.map((id, i) => [id, i]));
      list = [...list].sort((a, b) => {
        const ra = rank.has(a) ? rank.get(a)! : 999;
        const rb = rank.has(b) ? rank.get(b)! : 999;
        if (ra !== rb) return ra - rb;
        return EXPERIENCE_LABELS[a].localeCompare(EXPERIENCE_LABELS[b]);
      });
    }
    return list;
  }, [available, query, sort, recent]);

  const openExperience = useCallback(
    (id: ExperienceId) => {
      pushRecentExperience(id);
      setRecent(readRecentExperiences());
      setExperience(id);
      writeNavExperience(id);
      navigate(EXPERIENCE_LANDING[id]);
    },
    [navigate, setExperience],
  );

  const openAdministration = useCallback(() => {
    setExperience('admin');
    writeNavExperience('admin');
    navigate('/self-service/admin/overview');
  }, [navigate, setExperience]);

  const openAssistant = () => {
    setExperience('assistant');
    writeNavExperience('assistant');
    pushRecentExperience('assistant');
    setRecent(readRecentExperiences());
    navigate('/self-service/assistant');
  };

  const qNorm = query.trim().toLowerCase();
  const assistantMatches =
    SHOW_ASSISTANT_EXPERIENCE &&
    (!qNorm ||
      ['assistant', 'ai', 'chat', 'help', 'ask'].some(
        k => qNorm.includes(k) || k.startsWith(qNorm),
      ));

  // Keep compare bar API warm when re-enabled
  void setCardStylePersist;

  const renderAccentCards = () => (
    <Box className={classes.tileGrid}>
      {sortedFiltered.map(id => (
        <Box
          key={id}
          className={classes.tile}
          role="button"
          tabIndex={0}
          aria-label={`Open ${EXPERIENCE_LABELS[id]}`}
          onClick={() => openExperience(id)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openExperience(id);
            }
          }}
        >
          <Box
            className={classes.tileAccent}
            style={{ backgroundColor: EXPERIENCE_ACCENT[id] }}
          />
          <Box className={classes.tileBody}>
            <Box className={classes.tileTitleRow}>
              <Typography className={classes.tileTitle}>
                {EXPERIENCE_LABELS[id]}
              </Typography>
              <ExperienceDocsPopover
                docsKey={id}
                label={EXPERIENCE_LABELS[id]}
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              {EXPERIENCE_BLURB[id]}
            </Typography>
          </Box>
        </Box>
      ))}

      {assistantMatches && (
        <Box
          className={`${classes.tile} ${classes.tileAi}`}
          role="button"
          tabIndex={0}
          aria-label="Open Assistant"
          onClick={openAssistant}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openAssistant();
            }
          }}
        >
          <Box
            className={classes.tileAccent}
            style={{
              background:
                'linear-gradient(135deg, #0066CC 0%, #3D1C7C 55%, #EE0000 100%)',
            }}
          />
          <Box className={classes.tileBody}>
            <Box className={classes.tileTitleRow}>
              <Typography className={classes.tileTitle}>Assistant</Typography>
              <Chip
                size="small"
                label="AI"
                style={{ height: 22, fontSize: 11, borderRadius: 12 }}
              />
              <ExperienceDocsPopover docsKey="assistant" label="Assistant" />
            </Box>
            <Typography variant="body2" color="textSecondary">
              Helps across your experiences — answers questions and can take
              action for you.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderHubCards = () => (
    <Box className={classes.hubGrid}>
      {sortedFiltered.map(id => (
        <Box
          key={id}
          className={classes.hubCard}
          role="button"
          tabIndex={0}
          aria-label={`Open ${EXPERIENCE_LABELS[id]}`}
          onClick={() => openExperience(id)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openExperience(id);
            }
          }}
        >
          <Box className={classes.hubLogoRow}>
            <ExperienceThumbnail id={id} />
            <Box className={classes.hubBadgeArea}>
              {id === 'edge' || id === 'compliance' || id === 'orchestrator' ? (
                <Chip
                  size="small"
                  label="Preview"
                  className={classes.hubBadgeChip}
                />
              ) : null}
              <ExperienceDocsPopover
                docsKey={id}
                label={EXPERIENCE_LABELS[id]}
              />
            </Box>
          </Box>
          <Box className={classes.hubNameBlock}>
            <Typography className={classes.hubName} title={EXPERIENCE_LABELS[id]}>
              {EXPERIENCE_LABELS[id]}
            </Typography>
          </Box>
          <Typography className={classes.hubDescription}>
            {EXPERIENCE_BLURB[id]}
          </Typography>
          <Box className={classes.hubActions}>
            <Button
              className={classes.hubLaunch}
              variant="outlined"
              color="primary"
              size="small"
              onClick={e => {
                e.stopPropagation();
                openExperience(id);
              }}
            >
              Launch
            </Button>
          </Box>
        </Box>
      ))}

      {assistantMatches && (
        <Box
          className={classes.hubCard}
          role="button"
          tabIndex={0}
          aria-label="Open Assistant"
          onClick={openAssistant}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openAssistant();
            }
          }}
        >
          <Box className={classes.hubLogoRow}>
            <Box
              className={classes.hubLogo}
              style={{
                background:
                  'linear-gradient(135deg, #0066CC 0%, #3D1C7C 55%, #EE0000 100%)',
              }}
              aria-hidden
            >
              {experienceIcon('assistant')}
            </Box>
            <Box className={classes.hubBadgeArea}>
              <Chip
                size="small"
                label="AI"
                className={classes.hubBadgeChip}
                style={{ borderRadius: 12 }}
              />
              <ExperienceDocsPopover docsKey="assistant" label="Assistant" />
            </Box>
          </Box>
          <Box className={classes.hubNameBlock}>
            <Typography className={classes.hubName}>Assistant</Typography>
          </Box>
          <Typography className={classes.hubDescription}>
            Helps across your experiences — answers questions and can take
              action for you.
          </Typography>
          <Box className={classes.hubActions}>
            <Button
              className={classes.hubLaunch}
              variant="outlined"
              color="primary"
              size="small"
              onClick={e => {
                e.stopPropagation();
                openAssistant();
              }}
            >
              Launch
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Page themeId="app">
      <Content>
        {/* Card-style compare bar parked — FORCED_CARD_STYLE = 'hub'. Restore bar + null force to compare A. */}

        <Box className={classes.promptRow}>
          <Box className={classes.prompt} style={{ marginBottom: 0 }}>
            <Typography className={classes.promptTitle} component="h1">
              Experiences
            </Typography>
            <Tooltip
              title="Experiences are job modes — ways of working in Automation Portal, not plugins. Open a card to enter that mode. Administration is platform configuration, not an experience."
              placement="right"
              arrow
            >
              <IconButton
                className={classes.infoButton}
                size="small"
                aria-label="About experiences"
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {isAdmin && (
            <Button
              className={classes.adminButton}
              variant="outlined"
              color="default"
              size="small"
              startIcon={<SettingsIcon fontSize="small" />}
              onClick={openAdministration}
              aria-label={
                showAdminDot
                  ? 'Administration, setup needed'
                  : undefined
              }
            >
              <span className={classes.adminButtonLabel}>
                Administration
                {showAdminDot ? (
                  <AttentionDot
                    label="Setup needed in Administration"
                    exiting={adminExiting}
                  />
                ) : null}
              </span>
            </Button>
          )}
        </Box>

        <Box className={classes.toolbar}>
          <TextField
            className={classes.search}
            size="small"
            variant="outlined"
            placeholder="Search experiences"
            value={query}
            onChange={e => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            inputProps={{ 'aria-label': 'Search experiences' }}
          />
          <FormControl
            className={classes.sortControl}
            size="small"
            variant="outlined"
          >
            <InputLabel id="experience-sort-label">Sort by</InputLabel>
            <Select
              labelId="experience-sort-label"
              label="Sort by"
              value={sort}
              onChange={e => setSort(e.target.value as SortMode)}
            >
              <MenuItem value="recent">Recent</MenuItem>
              <MenuItem value="az">A–Z</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {cardStyle === 'hub' ? renderHubCards() : renderAccentCards()}

        {sortedFiltered.length === 0 && !assistantMatches && available.length > 0 && (
          <Typography className={classes.empty}>
            No experiences match “{query}”.
          </Typography>
        )}
      </Content>
    </Page>
  );
};
