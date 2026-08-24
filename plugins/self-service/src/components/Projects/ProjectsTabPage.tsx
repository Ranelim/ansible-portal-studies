import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header, Page, HeaderTabs, Content } from '@backstage/core-components';
import { Box, Button, makeStyles } from '@material-ui/core';
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
  StartScanDialog,
  countLiveRemediations,
} from './quality/RemediationsContent';
import { ScanHistoryContent } from './quality/ScanHistoryContent';
import { isDevelopExperience, useNavIaModel } from '../../hooks/useNavIaModel';
import { useAttentionClearOnActive } from '../../hooks/attentionSeen';

/** Non-Develop fallback — full Git Repositories host tabs. */
const HOST_TABS = [
  { id: 'repositories', label: 'Repositories', path: 'list' },
  { id: 'dashboard', label: 'Content quality', path: 'dashboard' },
  { id: 'remediations', label: 'Remediations', path: 'remediations' },
  { id: 'scans', label: 'Scans', path: 'scans' },
  { id: 'ci-activity', label: 'Pipeline activity', path: 'ci-activity' },
];

/** Develop Content quality page — Overview / Remediations / Scans. */
const QUALITY_TABS = [
  { id: 'overview', label: 'Overview', path: 'dashboard' },
  { id: 'remediations', label: 'Remediations', path: 'remediations' },
  { id: 'scans', label: 'Scans', path: 'scans' },
];

type Surface = 'list' | 'dashboard' | 'remediations' | 'scans' | 'ci-activity';

const useStyles = makeStyles(theme => ({
  tabLabel: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    lineHeight: 1,
  },
  headerCta: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    flexShrink: 0,
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

const getHostTabIndexFromPath = (pathname: string): number => {
  const surface = getSurfaceFromPath(pathname);
  if (surface === 'dashboard') return 1;
  if (surface === 'remediations') return 2;
  if (surface === 'scans') return 3;
  if (surface === 'ci-activity') return 4;
  return 0;
};

const getQualityTabIndexFromPath = (pathname: string): number => {
  const surface = getSurfaceFromPath(pathname);
  if (surface === 'remediations') return 1;
  if (surface === 'scans') return 2;
  return 0;
};

const isQualitySurface = (surface: Surface) =>
  surface === 'dashboard' || surface === 'remediations' || surface === 'scans';

/**
 * Git Repositories host.
 * Develop: list is Git Repositories; Content quality is a nested rail item with page tabs.
 */
export const ProjectsTabs: React.FC = () => {
  const classes = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { experience } = useNavIaModel();
  const sectionMode = isDevelopExperience(experience);
  const [createOpen, setCreateOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const liveCount = countLiveRemediations();

  useEffect(() => {
    if (location.pathname.includes('/repositories/create')) {
      setCreateOpen(true);
      navigate('/self-service/repositories/list', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname.includes('/repositories/quality')) {
      navigate('/self-service/repositories/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const surface = useMemo(
    () => getSurfaceFromPath(location.pathname),
    [location.pathname],
  );

  const { seen: remediationsSeen, exiting: remediationsExiting } =
    useAttentionClearOnActive(
      'content-quality-remediations',
      surface === 'remediations' && liveCount > 0,
    );

  const qualityPage = sectionMode && isQualitySurface(surface);

  const onHostTabSelect = useCallback(
    (index: number) => {
      const tab = HOST_TABS[index];
      if (tab) {
        navigate(`/self-service/repositories/${tab.path}`);
      }
    },
    [navigate],
  );

  const onQualityTabSelect = useCallback(
    (index: number) => {
      const tab = QUALITY_TABS[index];
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
      return (
        <RemediationsContent
          key="remediations"
          onStartScan={() => setScanOpen(true)}
        />
      );
    }
    if (surface === 'scans') {
      return <ScanHistoryContent key="scans" />;
    }
    if (surface === 'ci-activity') {
      return <CIActivityContent key="ci-activity" />;
    }
    return <GitRepositoriesContent key="repositories" />;
  }, [surface]);

  const headerTitle = qualityPage
    ? 'Content quality'
    : sectionMode && surface === 'ci-activity'
      ? 'Pipeline activity'
      : 'Git Repositories';

  const headerSubtitle = qualityPage
    ? undefined
    : sectionMode && surface === 'ci-activity'
      ? 'CI and quality pipeline runs for repositories'
      : 'Automation content repositories discovered from your connected sources.';

  const showAddRepo = !qualityPage && surface !== 'ci-activity';

  const remediationsTabLabel = (label: string) =>
    liveCount > 0 ? (
      <span className={classes.tabLabel}>
        <span>{label}</span>
        <ReadCountBadge
          count={liveCount}
          label={`${liveCount} pending remediations`}
          tone={
            remediationsSeen || remediationsExiting ? 'read' : 'unread'
          }
        />
      </span>
    ) : (
      label
    );

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
              {qualityPage ? (
                <PageHelpIcon
                  tooltipLabel="What is Content quality?"
                  title="What is Content quality?"
                  description="Scans Ansible content in your git repositories. Overview uses each repository’s latest completed scan. Remediations are live fix sessions. Scans is history."
                />
              ) : (
                surface === 'list' && (
                  <PageHelpIcon
                    tooltipLabel="What are git repositories?"
                    title="What are git repositories?"
                    description="Git repositories contain your automation content — playbooks, roles, collections, or execution environments. They are discovered from your connected sources (GitHub, GitLab) and appear here automatically. Quality scans run against your repositories to check for best practices and compliance."
                  />
                )
              )}
            </Box>
            {qualityPage && (
              <Button
                color="primary"
                variant="contained"
                size="small"
                className={classes.headerCta}
                onClick={() => setScanOpen(true)}
              >
                Start scan
              </Button>
            )}
            {showAddRepo && (
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
        {...(headerSubtitle ? { subtitle: headerSubtitle } : {})}
      />
      {qualityPage && (
        <HeaderTabs
          selectedIndex={getQualityTabIndexFromPath(location.pathname)}
          onChange={onQualityTabSelect}
          tabs={QUALITY_TABS.map(({ id, label }) => ({
            id,
            label: id === 'remediations' ? remediationsTabLabel(label) : label,
          }))}
        />
      )}
      {!sectionMode && (
        <HeaderTabs
          selectedIndex={getHostTabIndexFromPath(location.pathname)}
          onChange={onHostTabSelect}
          tabs={HOST_TABS.map(({ id, label }) => ({
            id,
            label: id === 'remediations' ? remediationsTabLabel(label) : label,
          }))}
        />
      )}
      <Content>{content}</Content>
      <CreateFromTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        kind="repository"
      />
      <StartScanDialog open={scanOpen} onClose={() => setScanOpen(false)} />
    </Page>
  );
};
