import { useState } from 'react';
import {
  Box,
  Typography,
  Popover,
  IconButton,
  Button,
  CircularProgress,
  makeStyles,
  useTheme,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ErrorIcon from '@material-ui/icons/Error';
import WarningIcon from '@material-ui/icons/Warning';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { statusColors } from '../../common/statusColors';
import {
  type SeverityClass,
  type ProjectQualityData,
  SEVERITY_COLORS,
  getProjectQuality,
} from '../detail/qualityDemoData';

const healthColor = (score: number): string => {
  if (score >= 80) return statusColors.success;
  if (score >= 50) return statusColors.warning;
  return statusColors.error;
};

const healthLabel = (score: number): string => {
  if (score >= 80) return 'Good';
  if (score >= 50) return 'Needs attention';
  return 'Critical';
};

const useStyles = makeStyles(theme => ({
  popoverContent: {
    padding: theme.spacing(2.5),
    maxWidth: 400,
    minWidth: 320,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1.5),
  },
  violationRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '6px 0',
    borderTop: `1px solid ${theme.palette.divider}`,
    '&:first-of-type': { borderTop: 'none' },
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  clickTarget: {
    display: 'inline-flex',
    cursor: 'pointer',
    borderRadius: 4,
    padding: '2px 6px',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const SeverityIcon = ({ severity, size = 14 }: { severity: SeverityClass; size?: number }) => {
  if (severity === 'critical' || severity === 'high') {
    return <ErrorIcon style={{ fontSize: size, color: SEVERITY_COLORS[severity], flexShrink: 0, marginTop: 1 }} />;
  }
  return <WarningIcon style={{ fontSize: size, color: SEVERITY_COLORS[severity], flexShrink: 0, marginTop: 1 }} />;
};

interface HealthScorePopoverProps {
  repoName: string;
  quality?: ProjectQualityData | null;
  fontSize?: number;
  scanning?: boolean;
  onNavigateToQuality?: () => void;
}

export const HealthScorePopover = ({
  repoName,
  quality: qualityProp,
  fontSize = 14,
  scanning = false,
  onNavigateToQuality,
}: HealthScorePopoverProps) => {
  const classes = useStyles();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const quality = qualityProp ?? getProjectQuality(repoName);

  if (!quality) {
    if (scanning) {
      return (
        <Box display="inline-flex" alignItems="center" style={{ gap: 6 }}>
          <CircularProgress size={12} thickness={5} style={{ color: statusColors.info }} />
          <Typography style={{ fontSize: 12, color: statusColors.info, fontWeight: 500 }}>
            Scanning
          </Typography>
        </Box>
      );
    }
    return (
      <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
        —
      </Typography>
    );
  }

  const { healthScore, totalViolations, lastScannedAt, violations } = quality;
  const topViolations = violations.slice(0, 4);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  if (scanning) {
    return (
      <Box display="inline-flex" alignItems="center" style={{ gap: 6 }}>
        <CircularProgress size={12} thickness={5} style={{ color: statusColors.info }} />
        <Typography style={{ fontSize: 12, color: statusColors.info, fontWeight: 500 }}>
          Scanning
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <span className={classes.clickTarget} onClick={handleClick} role="button" tabIndex={0}>
        <Typography style={{ fontSize, fontWeight: 700, color: healthColor(healthScore) }}>
          {healthScore}
        </Typography>
      </span>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box className={classes.popoverContent}>
          <Box className={classes.header}>
            <Box>
              <Box display="flex" alignItems="baseline" style={{ gap: 8 }}>
                <Typography style={{ fontSize: 28, fontWeight: 700, color: healthColor(healthScore), lineHeight: 1 }}>
                  {healthScore}
                </Typography>
                <Typography style={{ fontSize: 13, color: healthColor(healthScore), fontWeight: 500 }}>
                  {healthLabel(healthScore)}
                </Typography>
              </Box>
              <Typography style={{ fontSize: 12, color: theme.palette.text.secondary, marginTop: 4 }}>
                {totalViolations === 0
                  ? 'No violations detected'
                  : `${totalViolations} violation${totalViolations !== 1 ? 's' : ''} found`}
                {' · '}last scanned {lastScannedAt}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {totalViolations === 0 ? (
            <Box display="flex" alignItems="center" style={{ gap: 8, padding: '8px 0' }}>
              <CheckCircleIcon style={{ fontSize: 20, color: statusColors.success }} />
              <Typography style={{ fontSize: 13, color: statusColors.success, fontWeight: 500 }}>
                All checks passed
              </Typography>
            </Box>
          ) : (
            <>
              <Typography style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                Top issues
              </Typography>
              {topViolations.map((v, i) => (
                <Box key={i} className={classes.violationRow}>
                  <SeverityIcon severity={v.severity} />
                  <Box flex={1} minWidth={0}>
                    <Typography style={{ fontSize: 12, fontWeight: 500 }} noWrap>
                      {v.message}
                    </Typography>
                    <Typography style={{ fontSize: 11, color: theme.palette.text.disabled, fontFamily: 'monospace' }}>
                      {v.ruleId} · {v.file}:{v.lineStart}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {violations.length > topViolations.length && (
                <Typography style={{ fontSize: 11, color: theme.palette.text.disabled, marginTop: 4 }}>
                  +{violations.length - topViolations.length} more
                </Typography>
              )}
            </>
          )}

          <Box className={classes.footer}>
            <Typography style={{ fontSize: 11, color: theme.palette.text.disabled }}>
              commit <code style={{ fontSize: 10 }}>{quality.lastScannedCommit}</code>
            </Typography>
            {onNavigateToQuality && (
              <Button
                size="small"
                color="primary"
                onClick={(e) => { e.stopPropagation(); handleClose(); onNavigateToQuality(); }}
                style={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}
              >
                View all →
              </Button>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};
