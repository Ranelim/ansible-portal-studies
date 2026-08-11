import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useNavIaModel,
  writeNavIaModel,
  writeNavExperience,
  NAV_IA_REVIEW_MODS,
  type NavIaModel,
} from '@ansible/plugin-backstage-self-service';
import { IA_BANNER_HEIGHT } from './chromeHeights';
import { modelHomePath } from './navIaLandings';

const IA_MODEL_OPTIONS: Array<{
  id: NavIaModel;
  label: string;
  blurb: string;
}> = [
  {
    id: 'flat',
    label: 'Option 1 — Flat list (RHDH)',
    blurb:
      'Unlabeled rail: Home, Catalog, Templates, Activity, Documentation, Learning Paths, then a flat entity phonebook (Git Repositories, EEs, Collections, Inventories, Edge fleets by seat). No Develop/Operate/Learn section labels. Administration in a bottom drawer. Includes Backstage rail Search (modal). Entity tabs: Dashboard? → {Entity} list → domain → Templates | Settings.',
  },
  {
    id: 'curated',
    label: 'Option 2 — Pins + job-band sections',
    blurb:
      'Recommended. Top stack like Option 1 but lean: Templates + Activity only (no Home/Catalog, no “Run” label). Then labeled job bands: Develop / Operate (by seat + plugins) → Learn → Administration (admin). One rail item per primary object; plugins extend hosts as tabs. Includes rail Search. Seat landings: SME → Templates; Dev/Admin → Git Repositories; Operator → Inventories / Edge fleets.',
  },
  {
    id: 'experiences',
    label: 'Option 3 — Experiences (toggle)',
    blurb:
      'Job-mode switcher: enter one experience at a time (Automate, Develop, Compliance, Edge, Administration, or All). Domain rail: Dashboard → Templates → Activity → entities → Settings. All (Home): insight Dashboard · Experiences catalog · Plugins (admin only) · Settings. Entity pages are list-first (no entity Dashboard tab). Exploration only — not required for plugin placement.',
  },
  {
    id: 'hybrid',
    label: 'Option 4 — Pins + job bands (header search)',
    blurb:
      'Same rail as Option 2 (Templates + Activity, then Develop / Operate / Learn / Administration by seat) but no floating Search on the rail. Use header OmniSearch; full results stay on /search. Best for walking SME / Developer / Operator / Admin seats on the recommended IA without Backstage Search modal chrome.',
  },
];

const useStyles = makeStyles(theme => ({
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: IA_BANNER_HEIGHT,
    zIndex: theme.zIndex.drawer + 2,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(0, 2),
    backgroundColor: '#5e40c0',
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.18)',
    boxSizing: 'border-box',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.85,
    flexShrink: 0,
  },
  copy: {
    fontSize: 13,
    lineHeight: 1.35,
    opacity: 0.95,
    flex: '1 1 auto',
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  select: {
    minWidth: 340,
    maxWidth: 460,
    flexShrink: 0,
    '& .MuiOutlinedInput-root': {
      height: 32,
      color: '#fff',
      backgroundColor: 'rgba(255,255,255,0.12)',
      fontSize: 13,
      fontWeight: 600,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255,255,255,0.35)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255,255,255,0.55)',
    },
    '& .MuiSvgIcon-root': {
      color: '#fff',
    },
  },
}));

/**
 * Full-width prototype chrome above the Automation Portal masthead.
 * Switches navigation IA models for design exploration (AAP-84131).
 */
export const IaPrototypeBanner = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { model, setModel, setExperience } = useNavIaModel();

  if (location.pathname.includes('/setup')) {
    return null;
  }

  const active = IA_MODEL_OPTIONS.find(o => o.id === model) ?? IA_MODEL_OPTIONS[0];

  const onChange = (next: NavIaModel) => {
    setModel(next);
    writeNavIaModel(next);
    if (next === 'experiences') {
      let role = 'sme';
      try {
        role = localStorage.getItem('portal-user-role') || 'sme';
      } catch {
        /* ignore */
      }
      // Review mod: SME defaults into Automate so they are not stuck on All
      const nextExp =
        NAV_IA_REVIEW_MODS && role === 'sme' ? 'automate' : 'all';
      setExperience(nextExp);
      writeNavExperience(nextExp);
    }
    // Always land on that model's home so content matches the left nav
    navigate(modelHomePath(next));
  };

  return (
    <Box className={classes.banner} role="region" aria-label="Navigation IA prototype">
      <Typography className={classes.eyebrow} component="span">
        Nav IA prototype
      </Typography>
      <Typography className={classes.copy} component="span">
        Explore how Automation Portal could structure the rail (side nav) as we
        add plugins. Switch models below — design exploration only, not product
        UI.
      </Typography>
      <FormControl variant="outlined" size="small" className={classes.select}>
        <Select
          value={model}
          onChange={e => onChange(e.target.value as NavIaModel)}
          displayEmpty
          renderValue={() => active.label}
          inputProps={{ 'aria-label': 'Navigation IA model' }}
        >
          {IA_MODEL_OPTIONS.map(opt => (
            <MenuItem
              key={opt.id}
              value={opt.id}
              style={{ whiteSpace: 'normal', maxWidth: 520, alignItems: 'flex-start' }}
            >
              <Box py={0.5}>
                <Typography variant="body2" style={{ fontWeight: 600 }}>
                  {opt.label}
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ display: 'block', lineHeight: 1.4, marginTop: 2 }}
                >
                  {opt.blurb}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};
