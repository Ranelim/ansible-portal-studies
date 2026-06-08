import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
} from '@material-ui/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import BuildIcon from '@material-ui/icons/Build';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import { statusColors } from '../common/statusColors';
import { COMPLIANCE_PROFILES, type ComplianceProfile, type ProfileStatus } from './complianceDemoData';

const useStyles = makeStyles(theme => ({
  table: {
    '& .MuiTableCell-head': {
      fontWeight: 600,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: theme.palette.text.secondary,
      borderBottom: `2px solid ${theme.palette.divider}`,
      padding: theme.spacing(1.5, 2),
    },
    '& .MuiTableCell-body': {
      padding: theme.spacing(1.5, 2),
      fontSize: 13,
    },
  },
  row: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  profileName: {
    fontWeight: 600,
    fontSize: 14,
    color: theme.palette.text.primary,
  },
  inventoryMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  scoreCell: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 700,
  },
  trendChip: {
    fontSize: 11,
    fontWeight: 600,
    height: 20,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
  },
  trendIcon: {
    fontSize: 14,
  },
  frameworkChip: {
    fontSize: 11,
    fontWeight: 600,
    height: 22,
  },
  kebab: {
    padding: 4,
  },
}));

const STATUS_CONFIG: Record<ProfileStatus, { label: string; color: string }> = {
  'not-scanned': { label: 'Not scanned', color: statusColors.pending },
  'assessed': { label: 'Assessed', color: statusColors.info },
  'remediation-in-progress': { label: 'Remediation in progress', color: statusColors.warning },
  'verification-pending': { label: 'Verification pending', color: statusColors.custom },
  'verified': { label: 'Verified', color: statusColors.success },
};

function getScoreColor(score: number | null): string {
  if (score === null) return statusColors.pending;
  if (score >= 90) return statusColors.success;
  if (score >= 70) return statusColors.warning;
  return statusColors.error;
}

const ProfileRow = ({ profile }: { profile: ComplianceProfile }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const statusCfg = STATUS_CONFIG[profile.status];

  return (
    <TableRow
      className={classes.row}
      onClick={() => navigate(`/self-service/compliance/${profile.id}`)}
    >
      <TableCell>
        <Typography className={classes.profileName}>{profile.name}</Typography>
        <Typography className={classes.inventoryMeta}>
          {profile.inventoryName} ({profile.hostCount} hosts)
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={`${profile.framework} ${profile.frameworkVersion}`}
          size="small"
          variant="outlined"
          className={classes.frameworkChip}
        />
      </TableCell>
      <TableCell>{profile.lastAssessedAt ?? '—'}</TableCell>
      <TableCell>
        {profile.complianceScore !== null ? (
          <Box className={classes.scoreCell}>
            <Typography
              className={classes.scoreValue}
              style={{ color: getScoreColor(profile.complianceScore) }}
            >
              {profile.complianceScore}%
            </Typography>
            {profile.trend !== null && profile.trend !== 0 && (
              <Chip
                size="small"
                className={classes.trendChip}
                label={
                  <Box display="flex" alignItems="center" style={{ gap: 2 }}>
                    {profile.trend > 0 ? (
                      <ArrowUpwardIcon className={classes.trendIcon} />
                    ) : (
                      <ArrowDownwardIcon className={classes.trendIcon} />
                    )}
                    {Math.abs(profile.trend)}%
                  </Box>
                }
                style={{
                  backgroundColor: profile.trend > 0
                    ? `${statusColors.success}20`
                    : `${statusColors.error}20`,
                  color: profile.trend > 0 ? statusColors.success : statusColors.error,
                }}
              />
            )}
          </Box>
        ) : (
          <Typography style={{ color: statusColors.pending, fontSize: 13 }}>—</Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography style={{ fontSize: 13 }}>
          {profile.rulesFailing > 0 ? (
            <span style={{ color: statusColors.error, fontWeight: 600 }}>{profile.rulesFailing}</span>
          ) : (
            <span style={{ color: statusColors.success }}>0</span>
          )}
          {' / '}{profile.rulesEvaluated}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          size="small"
          label={statusCfg.label}
          style={{
            backgroundColor: `${statusCfg.color}18`,
            color: statusCfg.color,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      </TableCell>
      <TableCell align="right" onClick={e => e.stopPropagation()}>
        <IconButton
          className={classes.kebab}
          size="small"
          onClick={e => setAnchorEl(e.currentTarget)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          getContentAnchorEl={null}
        >
          <MenuItem onClick={() => { setAnchorEl(null); }}>
            <ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Assess now" />
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate(`/self-service/compliance/${profile.id}`); }}>
            <ListItemIcon><BuildIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Build remediation" />
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate(`/self-service/compliance/${profile.id}`); }}>
            <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="View details" />
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
};

export const ProfilesContent = () => {
  const classes = useStyles();

  return (
    <TableContainer>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Profile</TableCell>
            <TableCell>Framework</TableCell>
            <TableCell>Last assessed</TableCell>
            <TableCell>Compliance</TableCell>
            <TableCell>Failing / Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {COMPLIANCE_PROFILES.map(profile => (
            <ProfileRow key={profile.id} profile={profile} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
