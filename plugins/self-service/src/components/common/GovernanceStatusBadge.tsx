import { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  Popover,
  Button,
  IconButton,
  makeStyles,
} from '@material-ui/core';
import SecurityIcon from '@material-ui/icons/Security';
import CloseIcon from '@material-ui/icons/Close';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import type { GovernanceStatus } from '../Projects/catalog/unifiedDemoData';
import { statusColors } from './statusColors';

const TIERS: {
  status: GovernanceStatus;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    status: 'discovered',
    label: 'Discovered',
    description: 'Repository detected from a connected Git source. No CI/CD pipeline or AAP connection.',
    color: statusColors.info,
  },
  {
    status: 'governed',
    label: 'Governed',
    description: 'CI/CD pipeline is active. Content is validated against policy checks on every commit.',
    color: statusColors.custom,
  },
  {
    status: 'pushed-to-aap',
    label: 'Connected to AAP',
    description: 'Fully governed and connected to Ansible Automation Platform. AAP syncs automatically from this repository.',
    color: statusColors.success,
  },
];

const CTA_BY_STATUS: Record<
  GovernanceStatus,
  { label: string; action: string } | null
> = {
  discovered: { label: 'Enable governance', action: 'enable-governance' },
  governed: { label: 'Push to AAP', action: 'push-to-aap' },
  'pushed-to-aap': null,
};

const useStyles = makeStyles(theme => ({
  popover: {
    padding: theme.spacing(2.5),
    minWidth: 320,
    maxWidth: 400,
  },
  popoverHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1.5),
  },
  popoverTitle: {
    fontWeight: 600,
    fontSize: 14,
  },
  tierRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0),
    position: 'relative' as const,
  },
  tierConnector: {
    position: 'absolute' as const,
    left: 9,
    top: 30,
    width: 2,
    height: 'calc(100% - 14px)',
    backgroundColor: theme.palette.divider,
  },
  tierLabel: {
    fontWeight: 600,
    fontSize: 13,
  },
  tierDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
    marginTop: 2,
  },
  currentBadge: {
    fontSize: 10,
    height: 16,
    fontWeight: 600,
    marginLeft: 6,
  },
  ctaBox: {
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  clickableChip: {
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.85,
    },
  },
  helpIcon: {
    display: 'inline-flex',
    cursor: 'help',
    verticalAlign: 'middle',
    marginLeft: 4,
  },
}));

type BadgeVariant = 'chip' | 'header';

export const GovernanceStatusBadge = ({
  status,
  variant = 'chip',
  onAction,
}: {
  status: GovernanceStatus;
  variant?: BadgeVariant;
  onAction?: (action: string) => void;
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const currentTier = TIERS.find(t => t.status === status) ?? TIERS[0];
  const currentIndex = TIERS.findIndex(t => t.status === status);
  const cta = CTA_BY_STATUS[status];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const chipSize = variant === 'header' ? 'medium' : 'small';

  return (
    <>
      <Chip
        size={chipSize}
        label={currentTier.label}
        variant="outlined"
        icon={
          status !== 'discovered' ? (
            <SecurityIcon
              style={{ fontSize: variant === 'header' ? 16 : 14, color: currentTier.color }}
            />
          ) : undefined
        }
        onClick={handleClick}
        className={classes.clickableChip}
        style={{
          fontSize: variant === 'header' ? 13 : 11,
          height: variant === 'header' ? 28 : 24,
          fontWeight: 500,
          color: currentTier.color,
          borderColor: currentTier.color,
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <Box className={classes.popover}>
          <Box className={classes.popoverHeader}>
            <Box>
              <Typography className={classes.popoverTitle}>
                Repository governance
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
                Repositories advance through governance tiers as you add pipelines and connect to AAP.
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {TIERS.map((tier, i) => {
            const isReached = i <= currentIndex;
            const isCurrent = tier.status === status;
            return (
              <Box key={tier.status} className={classes.tierRow}>
                {i < TIERS.length - 1 && (
                  <Box
                    className={classes.tierConnector}
                    style={{
                      backgroundColor: i < currentIndex ? tier.color : '#e0e0e0',
                    }}
                  />
                )}
                <Box style={{ flexShrink: 0, marginTop: 2 }}>
                  {isReached ? (
                    <CheckCircleIcon style={{ fontSize: 20, color: tier.color }} />
                  ) : (
                    <RadioButtonUncheckedIcon style={{ fontSize: 20, color: '#bdbdbd' }} />
                  )}
                </Box>
                <Box flex={1}>
                  <Box display="flex" alignItems="center">
                    <Typography
                      className={classes.tierLabel}
                      style={{ color: isReached ? 'inherit' : '#888' }}
                    >
                      {tier.label}
                    </Typography>
                    {isCurrent && (
                      <Chip
                        size="small"
                        label="Current"
                        className={classes.currentBadge}
                        style={{
                          backgroundColor: `${tier.color}18`,
                          color: tier.color,
                          borderColor: tier.color,
                        }}
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography className={classes.tierDescription}>
                    {tier.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          {cta && (
            <Box className={classes.ctaBox}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                onClick={() => {
                  handleClose();
                  onAction?.(cta.action);
                }}
                style={{ textTransform: 'none', fontWeight: 500, borderRadius: 20 }}
              >
                {cta.label}
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export const GovernanceStatusHelp = () => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <span
        className={classes.helpIcon}
        onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
      >
        <HelpOutlineIcon style={{ fontSize: 14, color: '#999' }} />
      </span>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <Box style={{ padding: 16, maxWidth: 320 }}>
          <Typography style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            Governance status
          </Typography>
          {TIERS.map(tier => (
            <Box key={tier.status} style={{ marginBottom: 8 }}>
              <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: tier.color,
                    flexShrink: 0,
                  }}
                />
                <Typography style={{ fontWeight: 600, fontSize: 12 }}>{tier.label}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" style={{ fontSize: 11, marginLeft: 14, lineHeight: 1.4 }}>
                {tier.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
};
