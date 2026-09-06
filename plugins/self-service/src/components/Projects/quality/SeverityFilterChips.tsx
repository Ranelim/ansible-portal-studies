import { Box, Chip, Tooltip, makeStyles } from '@material-ui/core';
import {
  SEVERITY_COLORS,
  type SeverityClass,
} from '../detail/qualityDemoData';

const SEV_ORDER: SeverityClass[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

const SEV_LABEL: Record<SeverityClass, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const SEV_TIPS: Record<SeverityClass, string> = {
  critical: 'Critical — Must fix before deployment',
  high: 'High — Should fix soon',
  medium: 'Medium — Recommended improvement',
  low: 'Low — Optional enhancement',
  info: 'Info — No action required',
};

const useStyles = makeStyles(theme => ({
  groups: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.2,
    color: theme.palette.text.secondary,
    margin: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  chip: {
    height: 28,
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 16,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.04)',
    },
  },
  catChip: {
    color: theme.palette.text.primary,
    borderColor: theme.palette.divider,
  },
  catChipOn: {
    borderColor: theme.palette.text.primary,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
  },
}));

export type MixCategoryChip = {
  id: string;
  label: string;
  count: number;
  hint: string;
};

/** Outlined severity chips — same filter control on Overview and scan details. */
export function SeverityFilterChips({
  breakdown,
  active,
  onToggle,
  categories,
  activeCategory,
  onToggleCategory,
  lanes,
  activeLanes,
  onToggleLane,
  severityLabel,
  categoryLabel,
}: {
  breakdown: Record<SeverityClass, number>;
  active: Set<SeverityClass>;
  onToggle: (sev: SeverityClass) => void;
  categories?: MixCategoryChip[];
  activeCategory?: string;
  onToggleCategory?: (id: string) => void;
  lanes?: MixCategoryChip[];
  activeLanes?: Set<string>;
  onToggleLane?: (id: string) => void;
  severityLabel?: string;
  categoryLabel?: string;
}) {
  const classes = useStyles();
  const present = SEV_ORDER.filter(sev => (breakdown[sev] ?? 0) > 0);
  const catList = categories ?? [];
  const laneList = lanes ?? [];
  if (present.length === 0 && catList.length === 0 && laneList.length === 0) {
    return null;
  }
  const anyActive = active.size > 0;
  const catDim =
    activeCategory && activeCategory !== 'all' ? activeCategory : '';
  const laneActive = activeLanes ?? new Set<string>();
  const anyLaneActive = laneActive.size > 0;
  const grouped = Boolean(severityLabel || categoryLabel);

  const severityChips = present.map(sev => {
    const count = breakdown[sev] ?? 0;
    const isActive = active.has(sev);
    return (
      <Tooltip
        key={sev}
        title={`${SEV_TIPS[sev]}. Click to ${
          isActive ? 'remove' : 'add'
        } filter.`}
        arrow
      >
        <span>
          <Chip
            size="small"
            variant="outlined"
            clickable
            label={`${SEV_LABEL[sev]} (${count})`}
            onClick={() => onToggle(sev)}
            aria-pressed={isActive}
            className={classes.chip}
            style={{
              borderColor: SEVERITY_COLORS[sev],
              color: SEVERITY_COLORS[sev],
              backgroundColor: isActive
                ? `${SEVERITY_COLORS[sev]}18`
                : 'transparent',
              opacity: anyActive && !isActive ? 0.4 : 1,
            }}
          />
        </span>
      </Tooltip>
    );
  });
  const categoryChips = catList.map(cat => {
    const isActive = activeCategory === cat.id;
    return (
      <Tooltip
        key={cat.id}
        title={`${cat.hint}. Click to ${isActive ? 'clear' : 'apply'} filter.`}
        arrow
      >
        <span>
          <Chip
            size="small"
            variant="outlined"
            clickable
            label={`${cat.label} (${cat.count})`}
            onClick={() => onToggleCategory?.(cat.id)}
            aria-pressed={isActive}
            className={`${classes.chip} ${classes.catChip}${
              isActive ? ` ${classes.catChipOn}` : ''
            }`}
            style={{
              opacity: catDim && !isActive ? 0.4 : 1,
            }}
          />
        </span>
      </Tooltip>
    );
  });
  const laneChips = laneList.map(lane => {
    const isActive = laneActive.has(lane.id);
    return (
      <Tooltip
        key={lane.id}
        title={`${lane.hint.replace(/\.$/, '')}. Click to ${
          isActive ? 'remove' : 'add'
        } filter.`}
        arrow
      >
        <span>
          <Chip
            size="small"
            variant="outlined"
            clickable
            label={`${lane.label} (${lane.count})`}
            onClick={() => onToggleLane?.(lane.id)}
            aria-pressed={isActive}
            className={`${classes.chip} ${classes.catChip}${
              isActive ? ` ${classes.catChipOn}` : ''
            }`}
            style={{
              opacity: anyLaneActive && !isActive ? 0.4 : 1,
            }}
          />
        </span>
      </Tooltip>
    );
  });

  if (!grouped) {
    return (
      <Box className={classes.row}>
        {severityChips}
        {categoryChips}
        {laneChips}
      </Box>
    );
  }

  return (
    <Box className={classes.groups}>
      {present.length > 0 ? (
        <div className={classes.group}>
          {severityLabel ? (
            <p className={classes.groupLabel}>{severityLabel}</p>
          ) : null}
          <div className={classes.row}>{severityChips}</div>
        </div>
      ) : null}
      {catList.length > 0 ? (
        <div className={classes.group}>
          {categoryLabel ? (
            <p className={classes.groupLabel}>{categoryLabel}</p>
          ) : null}
          <div className={classes.row}>{categoryChips}</div>
        </div>
      ) : null}
      {laneList.length > 0 ? (
        <div className={classes.row}>{laneChips}</div>
      ) : null}
    </Box>
  );
}
