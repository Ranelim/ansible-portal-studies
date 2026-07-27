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
      'One menu item per primary entity (Git Repositories, Inventories, Edge fleets, …). Each entity holds its ecosystem — related plugins, tabs, and actions — instead of new sibling rail rows. Pinned Home / Catalog / Templates / Activity / learn, then a flat phonebook; Admin in a bottom drawer.',
  },
  {
    id: 'curated',
    label: 'Option 2 — Curated sections',
    blurb:
      'Same entity rule as Option 1 — one rail item per primary entity, ecosystem on the page. Run (Templates + Activity) on top as the global run band, then Develop / Operate by seat.',
  },
  {
    id: 'experiences',
    label: 'Option 3 — Experiences (toggle)',
    blurb:
      'One experience at a time. Continuous rail: Templates + Activity + entities (no Manage). Ecosystem tabs on the entity page. Platform config only in Administration.',
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
    minWidth: 320,
    maxWidth: 420,
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
      setExperience('all');
      writeNavExperience('all');
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
        Explore how Automation Portal could structure the left nav as we add plugins.
        Switch models below — this banner is design exploration only, not product UI.
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
              style={{ whiteSpace: 'normal', maxWidth: 420, alignItems: 'flex-start' }}
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
