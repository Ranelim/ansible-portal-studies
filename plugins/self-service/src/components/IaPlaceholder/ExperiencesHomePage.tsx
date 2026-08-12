import { useCallback, useEffect, useMemo, useState } from 'react';
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

type ExperienceId = Exclude<NavExperience, 'all'>;

const RECENT_KEY = 'portal-experience-recent';

/** User-facing experience blurbs — not IA documentation. */
const EXPERIENCE_BLURB: Record<ExperienceId, string> = {
  automate: 'Run job templates and track recent activity.',
  develop: 'Build and manage automation content — repos, collections, and EEs.',
  compliance: 'Scan inventories, review findings, and remediate hosts.',
  edge: 'Manage edge device fleets, updates, and desired state.',
  admin: 'Configure integrations, access, and platform sync.',
};

const EXPERIENCE_LANDING: Record<ExperienceId, string> = {
  automate: '/create',
  develop: '/self-service/experience-dashboard',
  compliance: '/self-service/experience-dashboard',
  edge: '/self-service/experience-dashboard',
  admin: '/self-service/admin/general',
};

const EXPERIENCE_ACCENT: Record<ExperienceId, string> = {
  automate: '#0066CC',
  develop: '#3D1C7C',
  compliance: '#C46100',
  edge: '#147EBC',
  admin: '#6A6E73',
};

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

export function pushRecentExperience(id: ExperienceId) {
  const next = [id, ...readRecent().filter(x => x !== id)].slice(0, 8);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

const useStyles = makeStyles(theme => ({
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
  empty: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(3, 0),
  },
}));

/**
 * Experience Bridge — masthead + lean card catalog (no left rail).
 * Enter = whole-card click.
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

  return (
    <Page themeId="app">
      <Content>
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
                  <Typography className={classes.tileTitle}>
                    Assistant
                  </Typography>
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

        {sortedFiltered.length === 0 && !assistantMatches && (
          <Typography className={classes.empty}>
            No experiences match “{query}”.
          </Typography>
        )}
      </Content>
    </Page>
  );
};
