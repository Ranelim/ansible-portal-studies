import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Page, Content } from '@backstage/core-components';
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CodeIcon from '@material-ui/icons/Code';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import DevicesOtherIcon from '@material-ui/icons/DevicesOther';
import SettingsIcon from '@material-ui/icons/Settings';
import ChatIcon from '@material-ui/icons/Chat';
import {
  availableExperiences,
  EXPERIENCE_LABELS,
  useNavIaModel,
  writeNavExperience,
  type NavExperience,
} from '../../hooks/useNavIaModel';
import { useNavPlugins } from '../../hooks/useNavPlugins';
import { useUserRoleContext } from '../../hooks/useUserRole';

type SortMode = 'recent' | 'az';
type CardStyle = 'accent' | 'hub';

type ExperienceId = Exclude<NavExperience, 'all'>;

const RECENT_KEY = 'portal-experience-recent';
const CARD_STYLE_KEY = 'portal-experience-card-style';

/** Temp prototype chrome — kept for when compare bar is re-enabled. */
const MAGENTA = '#BE0098';

/**
 * Compare UI is hidden — force B (Hub catalog).
 * Set to `null` and restore the magenta bar to bring A back.
 */
const FORCED_CARD_STYLE: CardStyle | null = 'hub';

/** User-facing experience blurbs — not IA documentation. */
const EXPERIENCE_BLURB: Record<ExperienceId, string> = {
  automate: 'Run job templates and track recent activity.',
  develop: 'Build and manage automation content — repos, collections, and EEs.',
  compliance: 'Scan inventories, review findings, and remediate hosts.',
  edge: 'Manage edge device fleets, updates, and desired state.',
  admin: 'Configure integrations, plugins, access, and platform sync.',
};

const EXPERIENCE_LANDING: Record<ExperienceId, string> = {
  automate: '/create',
  develop: '/self-service/experience-dashboard',
  compliance: '/self-service/experience-dashboard',
  edge: '/self-service/experience-dashboard',
  admin: '/self-service/admin/overview',
};

const EXPERIENCE_ACCENT: Record<ExperienceId, string> = {
  automate: '#0066CC',
  develop: '#3D1C7C',
  compliance: '#C46100',
  edge: '#147EBC',
  admin: '#6A6E73',
};

/** Hub-style footer counts — exploratory stand-ins for “what’s inside”. */
const EXPERIENCE_COUNTS: Record<
  ExperienceId,
  Array<{ value: number; label: string }>
> = {
  automate: [
    { value: 12, label: 'Templates' },
    { value: 48, label: 'Runs' },
    { value: 3, label: 'Approvals' },
  ],
  develop: [
    { value: 24, label: 'Repos' },
    { value: 86, label: 'Collections' },
    { value: 9, label: 'EEs' },
  ],
  compliance: [
    { value: 6, label: 'Inventories' },
    { value: 4, label: 'Profiles' },
    { value: 128, label: 'Findings' },
  ],
  edge: [
    { value: 3, label: 'Fleets' },
    { value: 142, label: 'Devices' },
    { value: 2, label: 'Images' },
  ],
  admin: [
    { value: 5, label: 'Integrations' },
    { value: 6, label: 'Plugins' },
    { value: 14, label: 'Users' },
  ],
};

const ASSISTANT_COUNTS = [
  { value: 4, label: 'Experiences' },
  { value: 0, label: 'Actions' },
  { value: 1, label: 'Chat' },
];

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
    case 'admin':
      return <SettingsIcon {...props} />;
    case 'assistant':
      return <ChatIcon {...props} />;
    default:
      return null;
  }
}

function readRecent(): ExperienceId[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((id): id is ExperienceId =>
      ['automate', 'develop', 'compliance', 'edge', 'admin'].includes(id),
    );
  } catch {
    return [];
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

export function pushRecentExperience(id: ExperienceId) {
  const next = [id, ...readRecent().filter(x => x !== id)].slice(0, 8);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
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
  promptTitle: {
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.3,
  },
  infoButton: {
    padding: 4,
    color: theme.palette.text.secondary,
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
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-end',
  },
  hubNameBlock: {
    padding: theme.spacing(0, 2, 1),
  },
  hubName: {
    fontWeight: 700,
    fontSize: 16,
    color: theme.palette.primary.main,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  hubProvided: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  hubDescription: {
    padding: theme.spacing(0, 2),
    height: 48,
    overflow: 'hidden',
    fontSize: 14,
    lineHeight: 1.35,
    color: theme.palette.text.primary,
  },
  hubCounts: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5, 2, 2),
    marginTop: 'auto',
  },
  hubCount: {
    textAlign: 'center' as const,
    minWidth: 0,
    flex: 1,
  },
  hubCountValue: {
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.2,
    color: theme.palette.text.primary,
  },
  hubCountLabel: {
    fontSize: 11,
    color: theme.palette.text.secondary,
    lineHeight: 1.2,
  },
  empty: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(3, 0),
  },
}));

/**
 * Experience Bridge — masthead + lean card catalog (no left rail).
 * Enter = whole-card click.
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

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [recent, setRecent] = useState<ExperienceId[]>(() => readRecent());
  const [cardStyle, setCardStyle] = useState<CardStyle>(() => readCardStyle());

  const available = useMemo(
    () =>
      availableExperiences({
        role,
        isAdmin,
        compliance: plugins.compliance,
        rhem: plugins.rhem,
      }).filter(id => id !== 'all') as ExperienceId[],
    [role, isAdmin, plugins.compliance, plugins.rhem],
  );

  // Old /experiences/dashboard bookmark → catalog
  useEffect(() => {
    if (location.pathname.endsWith('/dashboard')) {
      navigate('/self-service/experiences', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    setRecent(readRecent());
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
    // Pin Administration just before Assistant (rendered last in the grid).
    const withoutAdmin = list.filter(id => id !== 'admin');
    return list.includes('admin') ? [...withoutAdmin, 'admin'] : withoutAdmin;
  }, [available, query, sort, recent]);

  const openExperience = useCallback(
    (id: ExperienceId) => {
      pushRecentExperience(id);
      setRecent(readRecent());
      setExperience(id);
      writeNavExperience(id);
      navigate(EXPERIENCE_LANDING[id]);
    },
    [navigate, setExperience],
  );

  const openAssistant = () => {
    navigate('/self-service/assistant');
  };

  const qNorm = query.trim().toLowerCase();
  const assistantMatches =
    !qNorm ||
    ['assistant', 'ai', 'chat', 'help', 'ask'].some(
      k => qNorm.includes(k) || k.startsWith(qNorm),
    );

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
            <Typography className={classes.tileTitle}>
              {EXPERIENCE_LABELS[id]}
            </Typography>
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
            <Box
              className={classes.hubLogo}
              style={{ backgroundColor: EXPERIENCE_ACCENT[id] }}
              aria-hidden
            >
              {experienceIcon(id)}
            </Box>
            <Box className={classes.hubBadgeArea}>
              {id === 'edge' || id === 'compliance' ? (
                <Chip
                  size="small"
                  label="Preview"
                  style={{ height: 22, fontSize: 11 }}
                />
              ) : null}
            </Box>
          </Box>
          <Box className={classes.hubNameBlock}>
            <Typography className={classes.hubName} title={EXPERIENCE_LABELS[id]}>
              {EXPERIENCE_LABELS[id]}
            </Typography>
            <Typography className={classes.hubProvided}>
              Provided by Automation Portal
            </Typography>
          </Box>
          <Typography className={classes.hubDescription}>
            {EXPERIENCE_BLURB[id]}
          </Typography>
          <Box className={classes.hubCounts}>
            {EXPERIENCE_COUNTS[id].map(c => (
              <Box key={c.label} className={classes.hubCount}>
                <Typography className={classes.hubCountValue}>{c.value}</Typography>
                <Typography className={classes.hubCountLabel}>{c.label}</Typography>
              </Box>
            ))}
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
                style={{ height: 22, fontSize: 11, borderRadius: 12 }}
              />
            </Box>
          </Box>
          <Box className={classes.hubNameBlock}>
            <Typography className={classes.hubName}>Assistant</Typography>
            <Typography className={classes.hubProvided}>
              Provided by Automation Portal
            </Typography>
          </Box>
          <Typography className={classes.hubDescription}>
            Helps across your experiences — answers questions and can take
            action for you.
          </Typography>
          <Box className={classes.hubCounts}>
            {ASSISTANT_COUNTS.map(c => (
              <Box key={c.label} className={classes.hubCount}>
                <Typography className={classes.hubCountValue}>{c.value}</Typography>
                <Typography className={classes.hubCountLabel}>{c.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Page themeId="app">
      <Content>
        {/* Card-style compare bar parked — FORCED_CARD_STYLE = 'hub'. Restore bar + null force to compare A. */}

        <Box className={classes.prompt}>
          <Typography className={classes.promptTitle} component="h1">
            Experiences
          </Typography>
          <Tooltip
            title="Experiences are job modes — ways of working in Automation Portal, not plugins. Open a card to enter that mode."
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

        {sortedFiltered.length === 0 && !assistantMatches && (
          <Typography className={classes.empty}>
            No experiences match “{query}”.
          </Typography>
        )}
      </Content>
    </Page>
  );
};
