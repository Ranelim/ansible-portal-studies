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
  slice: {
    display: 'flex',
    minWidth: 4,
    height: '100%',
  },
  segment: {
    display: 'block',
    width: '100%',
    minWidth: 4,
    boxSizing: 'border-box',
  },
}));

/** Stacked severity bar — same treatment as scan history findings. */
export function SeverityMixBar({
  breakdown,
  height = 6,
  activeSeverities,
  onSegmentClick,
}: {
  breakdown: Record<SeverityClass, number>;
  height?: number;
  activeSeverities?: Set<SeverityClass>;
  onSegmentClick?: (sev: SeverityClass) => void;
}) {
  const classes = useStyles();
  const total = SEV_ORDER.reduce((sum, sev) => sum + (breakdown[sev] ?? 0), 0);
  if (total === 0) return null;
  const anyActive = (activeSeverities?.size ?? 0) > 0;

  return (
    <Box
      className={classes.bar}
      style={{ height, width: '100%' }}
      role={onSegmentClick ? 'group' : undefined}
      aria-label={onSegmentClick ? 'Filter findings by severity' : undefined}
    >
      {SEV_ORDER.map(sev => {
        const count = breakdown[sev] ?? 0;
        if (count === 0) return null;
        const isActive = activeSeverities?.has(sev) ?? false;
        return (
          <Box key={sev} className={classes.slice} style={{ flex: count }}>
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
                  onSegmentClick
                    ? () => onSegmentClick(sev)
                    : undefined
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
  );
}
