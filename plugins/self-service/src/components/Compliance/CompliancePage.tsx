import { useCallback, useMemo } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box, Typography, Chip, makeStyles } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { statusColors } from '../common/statusColors';
import { getFleetSummary } from './complianceDemoData';
import { ProfilesContent } from './ProfilesContent';
import { ScanHistoryContent } from './ScanHistoryContent';

const tabs = [
  { id: 'profiles', label: 'Profiles' },
  { id: 'scan-history', label: 'Scan History' },
];

const getTabIndex = (pathname: string): number => {
  if (pathname.includes('/compliance/scan-history')) return 1;
  return 0;
};

const useStyles = makeStyles(theme => ({
  summaryBar: {
    display: 'flex',
    gap: theme.spacing(3),
    padding: theme.spacing(0, 0, 2),
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
}));

const FleetSummaryBar = () => {
  const classes = useStyles();
  const summary = getFleetSummary();

  return (
    <Box className={classes.summaryBar}>
      <Box className={classes.summaryItem}>
        <Typography className={classes.summaryValue}>{summary.totalProfiles}</Typography>
        <Typography className={classes.summaryLabel}>profiles</Typography>
      </Box>
      <Box className={classes.summaryItem}>
        <Typography className={classes.summaryValue}>{summary.totalHosts}</Typography>
        <Typography className={classes.summaryLabel}>hosts</Typography>
      </Box>
      <Box className={classes.summaryItem}>
        <Typography className={classes.summaryValue}>{summary.averageCompliance}%</Typography>
        <Typography className={classes.summaryLabel}>avg. compliance</Typography>
      </Box>
      {summary.remediationsInProgress > 0 && (
        <Box className={classes.summaryItem}>
          <Chip
            size="small"
            label={`${summary.remediationsInProgress} remediation in progress`}
            style={{
              backgroundColor: `${statusColors.warning}20`,
              color: statusColors.warning,
              fontWeight: 600,
              fontSize: 12,
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export const CompliancePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedTab = useMemo(() => getTabIndex(location.pathname), [location.pathname]);

  const onTabSelect = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (tab) {
        const path = index === 0 ? '/self-service/compliance' : `/self-service/compliance/${tab.id}`;
        navigate(path);
      }
    },
    [navigate],
  );

  const content = useMemo(() => {
    if (selectedTab === 1) return <ScanHistoryContent key="scan-history" />;
    return <ProfilesContent key="profiles" />;
  }, [selectedTab]);

  return (
    <Page themeId="tool">
      <Header
        title="Compliance"
        subtitle="Monitor and enforce security and regulatory compliance across your infrastructure"
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={tabs.map(({ id, label }) => ({ id, label }))}
      />
      <Content>
        <FleetSummaryBar />
        {content}
      </Content>
    </Page>
  );
};
