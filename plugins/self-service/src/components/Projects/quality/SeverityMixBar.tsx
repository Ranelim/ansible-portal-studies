import { Box, Tooltip, makeStyles } from '@material-ui/core';
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

/** Smallest fill so a 1-finding category stays a pip, not a hairline. */
const MIN_FILL_PX = 12;

const useStyles = makeStyles(theme => ({
  bar: {
    display: 'flex',
    alignItems: 'stretch',
    flexShrink: 0,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
  },
  fill: {
    display: 'flex',
    alignItems: 'stretch',
    height: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  slice: {
    display: 'flex',
    height: '100%',
  },
  segment: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
  },
}));

/** Stacked severity bar. Omit `shareOfTotal` to fill the track. */
export function SeverityMixBar({
  breakdown,
  height = 6,
  shareOfTotal,
  activeSeverities,
  onSegmentClick,
}: {
  breakdown: Record<SeverityClass, number>;
  height?: number;
  /** This category’s share of all findings (0–1). Remainder of the track stays grey. */
  shareOfTotal?: number;
  activeSeverities?: Set<SeverityClass>;
  onSegmentClick?: (sev: SeverityClass) => void;
}) {
  const classes = useStyles();
  const total = SEV_ORDER.reduce((sum, sev) => sum + (breakdown[sev] ?? 0), 0);
  if (total === 0) return null;
  const anyActive = (activeSeverities?.size ?? 0) > 0;
  const relative =
    shareOfTotal != null && Number.isFinite(shareOfTotal)
      ? Math.min(1, Math.max(0, shareOfTotal))
      : 1;
  const scaled = relative < 1;
  const fillPct = `${Math.round(relative * 1000) / 10}%`;

  return (
    <Box
      className={classes.bar}
      style={{ height, width: '100%' }}
      role={onSegmentClick ? 'group' : undefined}
      aria-label={onSegmentClick ? 'Filter findings by severity' : undefined}
    >
      <Box
        className={classes.fill}
        style={{
          width: fillPct,
          minWidth: relative > 0 ? MIN_FILL_PX : 0,
        }}
      >
        {SEV_ORDER.map(sev => {
          const count = breakdown[sev] ?? 0;
          if (count === 0) return null;
          const isActive = activeSeverities?.has(sev) ?? false;
          return (
            <Box
              key={sev}
              className={classes.slice}
              style={{ flex: count, minWidth: scaled ? 0 : 4 }}
            >
              <Tooltip
                title={
                  onSegmentClick
                    ? `${SEV_LABEL[sev]}: ${count} finding${
                        count !== 1 ? 's' : ''
                      }. Click to ${isActive ? 'remove' : 'add'} filter.`
                    : `${SEV_LABEL[sev]}: ${count} finding${
                        count !== 1 ? 's' : ''
                      }`
                }
                arrow
              >
                <Box
                  className={classes.segment}
                  role={onSegmentClick ? 'button' : undefined}
                  tabIndex={onSegmentClick ? 0 : undefined}
                  aria-pressed={onSegmentClick ? isActive : undefined}
                  aria-label={
                    onSegmentClick
                      ? `${SEV_LABEL[sev]}, ${count} findings. ${
                          isActive ? 'Remove' : 'Add'
                        } filter.`
                      : `${SEV_LABEL[sev]}, ${count} findings`
                  }
                  onClick={
                    onSegmentClick ? () => onSegmentClick(sev) : undefined
                  }
                  onKeyDown={
                    onSegmentClick
                      ? e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSegmentClick(sev);
                          }
                        }
                      : undefined
                  }
                  style={{
                    height,
                    minWidth: scaled ? 0 : 4,
                    backgroundColor: SEVERITY_COLORS[sev],
                    cursor: onSegmentClick ? 'pointer' : 'default',
                    opacity: anyActive && !isActive ? 0.35 : 1,
                  }}
                />
              </Tooltip>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
