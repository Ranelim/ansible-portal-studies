import { useCallback, useEffect } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box, makeStyles } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHelpIcon } from '../../common/PageHelpIcon';
import { ReadCountBadge } from '../../common/ReadCountBadge';
import { QualityOverviewContent } from './QualityOverviewContent';
import { QualityPostureOverview } from './QualityPostureOverview';
import {
  RemediationsContent,
  countLiveRemediations,
} from './RemediationsContent';
import { ScanHistoryContent } from './ScanHistoryContent';
import { SHOW_CONTENT_QUALITY_FINDINGS_TAB } from './contentQualityIa';

type Surface = 'overview' | 'remediations' | 'findings' | 'scans';

const ALL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'remediations', label: 'Remediations' },
  { id: 'findings', label: 'Findings' },
  { id: 'scans', label: 'Scans' },
];

/** Findings tab parked — set SHOW_CONTENT_QUALITY_FINDINGS_TAB to revive. */
const TABS = SHOW_CONTENT_QUALITY_FINDINGS_TAB
  ? ALL_TABS
  : ALL_TABS.filter(tab => tab.id !== 'findings');

function getSurface(pathname: string): Surface {
  if (pathname.includes('/apme/findings')) return 'findings';
  if (pathname.includes('/apme/scans')) return 'scans';
  if (pathname.includes('/apme/remediations')) return 'remediations';
  return 'overview';
}

function pathForTab(id: string): string {
  if (id === 'findings') return '/self-service/apme/findings';
  if (id === 'scans') return '/self-service/apme/scans';
  if (id === 'remediations') return '/self-service/apme/remediations';
  return '/self-service/apme';
}

const useTabStyles = makeStyles(theme => ({
  tabLabel: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    lineHeight: 1,
  },
}));

/**
 * Exploration only — Content quality pin (compare vs host tabs).
 * Overview = fleet posture. Remediations = live sessions. Scans = history.
 * Findings (by-rule) parked — SHOW_CONTENT_QUALITY_FINDINGS_TAB.
 */
export const ApmeHostPage = () => {
  const classes = useTabStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const surface = getSurface(location.pathname);
  const selectedTab = Math.max(
    0,
    TABS.findIndex(tab => tab.id === surface),
  );
  const liveCount = countLiveRemediations();

  useEffect(() => {
    if (!SHOW_CONTENT_QUALITY_FINDINGS_TAB && surface === 'findings') {
      navigate('/self-service/apme', { replace: true });
    }
  }, [surface, navigate]);

  const onTabSelect = useCallback(
    (index: number) => {
      const tab = TABS[index];
      if (tab) navigate(pathForTab(tab.id));
    },
    [navigate],
  );

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Content quality
            <PageHelpIcon
              tooltipLabel="What is content quality?"
              title="What is content quality?"
              description="Scans Ansible content in your git repositories for policy, quality, secrets, and modernization findings. Overview is fleet posture. Remediations are live sessions. Scans lists history."
            />
          </Box>
        }
        pageTitleOverride="Content quality"
        subtitle="Policy and modernization scanning for Ansible content in your git repositories"
      />
      <HeaderTabs
        selectedIndex={selectedTab}
        onChange={onTabSelect}
        tabs={TABS.map(({ id, label }) => ({
          id,
          label:
            id === 'remediations' && liveCount > 0 ? (
              <span className={classes.tabLabel}>
                <span>{label}</span>
                <ReadCountBadge
                  count={liveCount}
                  label={`${liveCount} live remediations`}
                />
              </span>
            ) : (
              label
            ),
        }))}
      />
      <Content>
        {surface === 'findings' && SHOW_CONTENT_QUALITY_FINDINGS_TAB ? (
          <QualityOverviewContent />
        ) : surface === 'scans' ? (
          <ScanHistoryContent />
        ) : surface === 'remediations' ? (
          <RemediationsContent />
        ) : (
          <QualityPostureOverview />
        )}
      </Content>
    </Page>
  );
};
