import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Menu,
  MenuItem,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
  EXPERIENCE_LABELS,
  EXPERIENCE_LANDING,
  pushRecentExperience,
  readRecentExperiences,
  sortExperiencesByRecent,
  writeNavExperience,
  useNavIaModel,
  type ExperienceId,
} from '@ansible/plugin-backstage-self-service';

/** Trial height for rail back + switcher (was 24). Revert this to roll back. */
export const EXPERIENCE_CHROME_HIT = 32;

const useStyles = makeStyles(theme => ({
  /** Same muted chip as the rail back chevron — stretched for the label. */
  trigger: {
    appearance: 'none' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    width: '100%',
    minWidth: 0,
    height: EXPERIENCE_CHROME_HIT,
    margin: 0,
    padding: '0 8px 0 10px',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    color: theme.palette.text.secondary,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255,255,255,0.14)'
          : 'rgba(0,0,0,0.1)',
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 1,
    },
    '&[aria-expanded="true"]': {
      color: theme.palette.text.primary,
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255,255,255,0.14)'
          : 'rgba(0,0,0,0.1)',
    },
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    minWidth: 0,
  },
  caret: {
    fontSize: 16,
    opacity: 0.7,
    flexShrink: 0,
  },
  paper: {
    minWidth: 180,
    marginTop: 4,
    boxShadow: theme.shadows[3],
    border: `1px solid ${theme.palette.divider}`,
  },
  heading: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: theme.palette.text.secondary,
    padding: theme.spacing(1, 1.5, 0.5),
    lineHeight: 1.3,
  },
  item: {
    fontSize: 14,
    minHeight: 36,
    paddingTop: 6,
    paddingBottom: 6,
  },
}));

type ExperienceSwitcherProps = {
  current: ExperienceId;
  available: ExperienceId[];
};

/**
 * Quiet experience switcher — same wash as the rail back chevron.
 * SME / single-seat: render a static label instead.
 */
export const ExperienceSwitcher = ({
  current,
  available,
}: ExperienceSwitcherProps) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { setExperience } = useNavIaModel();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const items = useMemo(
    () => sortExperiencesByRecent(available, readRecentExperiences()),
    [available, open],
  );

  const fullLabel = EXPERIENCE_LABELS[current];
  const triggerLabel = current === 'admin' ? 'Admin' : fullLabel;

  if (available.length <= 1) {
    return (
      <Typography className={classes.label} component="span">
        {triggerLabel}
      </Typography>
    );
  }

  const go = (id: ExperienceId) => {
    setAnchor(null);
    if (id === current) return;
    pushRecentExperience(id);
    setExperience(id);
    writeNavExperience(id);
    navigate(EXPERIENCE_LANDING[id]);
  };

  return (
    <Box minWidth={0} flex={1} width="100%">
      <button
        type="button"
        className={classes.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Current experience: ${fullLabel}. Switch experience`}
        onClick={e => setAnchor(e.currentTarget)}
      >
        <span className={classes.label}>{triggerLabel}</span>
        <ExpandMoreIcon className={classes.caret} />
      </button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        MenuListProps={{ dense: true, disablePadding: false }}
        PaperProps={{ className: classes.paper, elevation: 0 }}
      >
        <Typography className={classes.heading} component="div">
          Recent experiences
        </Typography>
        {items.map(id => (
          <MenuItem
            key={id}
            className={classes.item}
            selected={id === current}
            onClick={() => go(id)}
          >
            {EXPERIENCE_LABELS[id]}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
