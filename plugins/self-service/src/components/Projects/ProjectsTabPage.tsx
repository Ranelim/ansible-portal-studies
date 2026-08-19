import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box, makeStyles } from '@material-ui/core';
import { useLocation, useNavigate } from 'react-router-dom';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import SearchIcon from '@material-ui/icons/Search';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { ReadCountBadge } from '../common/ReadCountBadge';
import { AddActionButton } from '../common/AddActionButton';
import { CreateFromTemplateDialog } from '../common/CreateFromTemplateDialog';
import { GitRepositoriesContent } from './catalog/GitRepositoriesContent';
import { CIActivityContent } from './ci/CIActivityContent';
import { QualityDashboardTabContent } from './quality/QualityDashboardTabContent';
import {
  RemediationsContent,
  countLiveRemediations,
} from './quality/RemediationsContent';
import { ScanHistoryContent } from './quality/ScanHistoryContent';
import { isDevelopExperience, useNavIaModel } from '../../hooks/useNavIaModel';

/** Develop host tabs (unused while rail is nested). */
const HOST_TABS = [
  { id: 'repositories', label: 'Repositories', path: 'list' },
  { id: 'dashboard', label: 'Quality', path: 'dashboard' },
  { id: 'remediations', label: 'Remediations', path: 'remediations' },
  { id: 'scans', label: 'Scans', path: 'scans' },
  { id: 'ci-activity', label: 'Pipeline activity', path: 'ci-activity' },
];

type Surface = 'list' | 'dashboard' | 'remediations' | 'scans' | 'ci-activity';

const useTabStyles = makeStyles(theme => ({
  tabLabel: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    lineHeight: 1,
  },
}));

const getSurfaceFromPath = (pathname: string): Surface => {
  if (
    pathname.includes('/repositories/dashboard') ||
    pathname.includes('/repositories/quality')
  ) {
    return 'dashboard';
  }
  if (pathname.includes('/repositories/remediations')) return 'remediations';
  if (pathname.includes('/repositories/scans')) return 'scans';
  if (pathname.includes('/repositories/ci-activity')) return 'ci-activity';
  return 'list';
};

const getTabIndexFromPath = (pathname: string): number => {
  const surface = getSurfaceFromPath(pathname);
  if (surface === 'dashboard') return 1;
  if (surface === 'remediations') return 2;
  if (surface === 'scans') return 3;
  if (surface === 'ci-activity') return 4;
  return 0;
};

/**
 * Git Repositories host.
 * Develop: no host tabs — rail picks Repositories / Quality / Remediations / Scans
 */
export const ProjectsTabs: React.FC = () => {
  const classes = useTabStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { experience } = useNavIaModel();
  const sectionMode = isDevelopExperience(experience);
  const hideHostTabs = sectionMode;
  const [createOpen, setCreateOpen] = useState(false);
  const liveCount = countLiveRemediations();

  useEffect(() => {
    if (location.pathname.includes('/repositories/create')) {
      setCreateOpen(true);
      navigate('/self-service/repositories/list', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Legacy Quality path → Quality surface (dashboard route)
  useEffect(() => {
    if (location.pathname.includes('/repositories/quality')) {
      navigate('/self-service/repositories/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const selectedTab = useMemo(
    () => getTabIndexFromPath(location.pathname),
    [location.pathname],
  );

  const surface = useMemo(
    () => getSurfaceFromPath(location.pathname),
    [location.pathname],
  );

  const onTabSelect = useCallback(
    (index: number) => {
      const tab = HOST_TABS[index];
      if (tab) {
        navigate(`/self-service/repositories/${tab.path}`);
      }
    },
    [navigate],
  );

  const content = useMemo(() => {
    if (surface === 'dashboard') {
      return <QualityDashboardTabContent key="dashboard" />;
    }
    if (surface === 'remediations') {
      return <RemediationsContent key="remediations" />;
    }
    if (surface === 'scans') {
      return <ScanHistoryContent key="scans" />;
    }
    if (surface === 'ci-activity') {
      return <CIActivityContent key="ci-activity" />;
    }
    return <GitRepositoriesContent key="repositories" />;
  }, [surface]);

  const headerTitle =
    sectionMode && surface === 'dashboard'
      ? 'Quality'
      : sectionMode && surface === 'remediations'
        ? 'Remediations'
        : sectionMode && surface === 'scans'
          ? 'Scans'
          : sectionMode && surface === 'ci-activity'
            ? 'Pipeline activity'
            : 'Git Repositories';

  const headerSubtitle =
    sectionMode && surface === 'dashboard'
      ? 'Current scan per repository. Last 7 days counts scan activity.'
      : sectionMode && surface === 'remediations'
        ? 'Live remediation sessions you can resume'
        : sectionMode && surface === 'scans'
          ? 'Scan snapshots across repositories. Current is the latest scan.'
          : sectionMode && surface === 'ci-activity'
            ? 'CI and quality pipeline runs for repositories'
            : 'Automation content repositories discovered from your connected sources';

  const showCreate = !sectionMode || surface === 'list';

  return (
    <Page themeId="app">
      <Header
        title={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
          >
            <Box display="flex" alignItems="center">
              {headerTitle}
              {(!sectionMode || surface === 'list') && (
                <PageHelpIcon
                  tooltipLabel="What are git repositories?"
                  title="What are git repositories?"
                  description="Git repositories contain your automation content — playbooks, roles, collections, or execution environments. They are discovered from your connected sources (GitHub, GitLab) and appear here automatically. Quality scans run against your repositories to check for best practices and compliance."
                />
              )}
            </Box>
            {showCreate && (
              <AddActionButton
                label="Add repository"
                options={[
                  {
                    label: 'Create from template',
                    description:
                      'Scaffold a new repository from a curated template with best-practice structure.',
                    icon: <FileCopyOutlinedIcon fontSize="small" />,
                    onClick: () => setCreateOpen(true),
                  },
                  {
                    label: 'Import existing repository',
                    description:
                      'Connect an existing Git repository to discover and govern its automation content.',
                    icon: <SearchIcon fontSize="small" />,
                    onClick: () => navigate('/self-service/catalog-import'),
                  },
                ]}
              />
            )}
          </Box>
        }
        pageTitleOverride={headerTitle}
        subtitle={headerSubtitle}
      />
      {!hideHostTabs && (
        <HeaderTabs
          selectedIndex={selectedTab}
          onChange={onTabSelect}
          tabs={HOST_TABS.map(({ id, label }) => ({
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
      )}
      <Content>{content}</Content>
      <CreateFromTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        kind="repository"
      />
    </Page>
  );
};
