import { useCallback, useMemo } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box, Typography, Chip, Breadcrumbs, Link as MuiLink, makeStyles } from '@material-ui/core';
import { Link, useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { statusColors } from '../common/statusColors';
import { getProfile, type ProfileStatus } from './complianceDemoData';
import { FindingsContent } from './FindingsContent';
import { ProfileHistoryContent } from './ProfileHistoryContent';

const tabs = [
  { id: 'findings', label: 'Findings' },
  { id: 'history', label: 'History' },
];

const getTabIndex = (pathname: string): number => {
  if (pathname.endsWith('/history')) return 1;
  return 0;
};

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

const useStyles = makeStyles(theme => ({
  breadcrumb: {
    marginBottom: theme.spacing(2),
  },
  breadcrumbLink: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
  summaryBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
    padding: theme.spacing(0, 0, 2),
    alignItems: 'center',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(0.5),
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
  },
  summaryLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  metaRow: {
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
}));

export const ProfileDetailPage = () => {
  const classes = useStyles();
  const { profileId } = useParams<{ profileId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const profile = profileId ? getProfile(profileId) : undefined;

  const selectedTab = useMemo(() => getTabIndex(location.pathname), [location.pathname]);

  const onTabSelect = useCallback(
    (index: number) => {
      const base = `/self-service/compliance/${profileId}`;
      navigate(index === 1 ? `${base}/history` : base);
    },
    [navigate, profileId],
  );

  if (!profile) {
    return <Navigate to="/self-service/compliance" replace />;
  }

  const statusCfg = STATUS_CONFIG[profile.status];

  const content = useMemo(() => {
    if (selectedTab === 1) return <ProfileHistoryContent profileId={profile.id} />;
    return <FindingsContent profileId={profile.id} profileStatus={profile.status} />;
  }, [selectedTab, profile.id, profile.status]);

  return (
    <Page themeId="tool">
      <Header
        title={profile.name}
        subtitle={`${profile.framework} ${profile.frameworkVersion} · ${profile.inventoryName} (${profile.hostCount} hosts)`}
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={tabs.map(({ id, label }) => ({ id, label }))}
      />
      <Content>
        <Breadcrumbs
          separator={<NavigateNextIcon style={{ fontSize: 16 }} />}
          className={classes.breadcrumb}
        >
          <MuiLink component={Link} to="/self-service/compliance" className={classes.breadcrumbLink}>
            Compliance
          </MuiLink>
          <Typography className={classes.breadcrumbCurrent}>{profile.name}</Typography>
        </Breadcrumbs>

        <Box className={classes.summaryBar}>
          {profile.complianceScore !== null && (
            <Box className={classes.summaryItem}>
              <Typography
                className={classes.summaryValue}
                style={{ color: getScoreColor(profile.complianceScore) }}
              >
                {profile.complianceScore}%
              </Typography>
              <Typography className={classes.summaryLabel}>compliance</Typography>
            </Box>
          )}
          <Box className={classes.summaryItem}>
            <Typography className={classes.summaryValue}>{profile.hostCount}</Typography>
            <Typography className={classes.summaryLabel}>hosts</Typography>
          </Box>
          <Box className={classes.summaryItem}>
            <Typography className={classes.summaryValue}>{profile.rulesEvaluated}</Typography>
            <Typography className={classes.summaryLabel}>rules evaluated</Typography>
          </Box>
          <Box className={classes.summaryItem}>
            <Typography
              className={classes.summaryValue}
              style={{ color: profile.rulesFailing > 0 ? statusColors.error : statusColors.success }}
            >
              {profile.rulesFailing}
            </Typography>
            <Typography className={classes.summaryLabel}>rules failing</Typography>
          </Box>
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
        </Box>

        {content}
      </Content>
    </Page>
  );
};
