import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { Box, Chip, Tooltip, Typography, makeStyles } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { useNavigate } from 'react-router-dom';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import { QualityScoreMark } from '../catalog/HealthScorePopover';
import {
  getApmeFleetFindings,
  getProjectQuality,
  type SeverityClass,
} from '../detail/qualityDemoData';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import {
  remediationsListPath,
  repositoriesListPath,
} from './qualitySurfacePaths';
import { countLiveRemediations } from './RemediationsContent';
import { SeverityFilterChips } from './SeverityFilterChips';
import { SeverityMixBar } from './SeverityMixBar';
import { CategoryScanPeek } from './CategoryScanPeek';
import { QualityTabIntro } from './QualityTabIntro';

type KpiId = 'coverage' | 'health' | 'remediations';

const SEV_ORDER: SeverityClass[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

/** Same stroke as scan-history findings bars — every mix bar in this widget. */
const FINDINGS_BAR_HEIGHT = 6;

function kpiHint(id: KpiId): string {
  switch (id) {
    case 'coverage':
      return 'How many git repositories have a completed scan.';
    case 'health':
      return 'Mean of each repository’s latest scan (0–100). Health is a rollup of findings on that scan, not a separate rubric.';
    case 'remediations':
      return 'Live fix sessions against each repository’s latest scan. An expired session does not clear the health score.';
  }
}

const useStyles = makeStyles(theme => ({
  kpis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  kpi: {
    position: 'relative' as const,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2),
    paddingRight: theme.spacing(4.5),
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    textAlign: 'left' as const,
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  },
  kpiMuted: {
    cursor: 'default',
    '&:hover': {
      borderColor: theme.palette.divider,
    },
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  kpiTotal: {
    fontSize: 16,
    fontWeight: 400,
    color: theme.palette.text.secondary,
    marginLeft: 2,
  },
  kpiLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  kpiHelp: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    fontSize: 16,
    color: theme.palette.text.disabled,
    cursor: 'help',
  },
  mixCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  mixHeader: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
  },
  mixTotal: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  mixMeta: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  mixBar: {
    height: FINDINGS_BAR_HEIGHT,
    marginBottom: theme.spacing(1),
  },
  mixChips: {
    marginBottom: theme.spacing(2),
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(1.25),
    borderTop: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    borderRadius: 4,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  catName: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    minWidth: 180,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 500,
  },
  catHelp: {
    fontSize: 14,
    color: theme.palette.text.disabled,
    cursor: 'help',
  },
  catCount: {
    height: 20,
    fontSize: 11,
    fontWeight: 600,
    flexShrink: 0,
  },
  catBar: {
    flex: 1,
    minWidth: 80,
    height: FINDINGS_BAR_HEIGHT,
    display: 'flex',
    alignItems: 'center',
  },
}));

/**
 * Shared Content quality / Overview — estate KPIs from each repo’s latest scan.
 * Git Repositories list, Remediations, and Scans own the queues.
 */
export const QualityPostureOverview = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { experience } = useNavIaModel();

  const stats = useMemo(() => {
    const totalRepos = GIT_REPOSITORIES.length;
    let scannedWithScore = 0;
    let healthSum = 0;

    for (const repo of GIT_REPOSITORIES) {
      const q = getProjectQuality(repo.name);
      if (!q) continue;
      scannedWithScore += 1;
      healthSum += q.healthScore;
    }

    return {
      totalRepos,
      scannedWithScore,
      avgHealth:
        scannedWithScore > 0 ? Math.round(healthSum / scannedWithScore) : null,
      liveRemediations: countLiveRemediations(),
    };
  }, []);

  const findings = useMemo(() => getApmeFleetFindings(), []);
  const [severityFilter, setSeverityFilter] = useState<Set<SeverityClass>>(
    () => new Set(),
  );

  const toggleSeverity = useCallback((sev: SeverityClass) => {
    setSeverityFilter(prev => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }, []);

  const visibleCategories = useMemo(() => {
    const any = severityFilter.size > 0;
    return findings.categories
      .map(cat => {
        const breakdown = { ...cat.breakdown };
        if (any) {
          for (const sev of SEV_ORDER) {
            if (!severityFilter.has(sev)) breakdown[sev] = 0;
          }
        }
        const count = SEV_ORDER.reduce(
          (sum, sev) => sum + (breakdown[sev] ?? 0),
          0,
        );
        return { ...cat, breakdown, count };
      })
      .filter(cat => cat.count > 0);
  }, [findings.categories, severityFilter]);

  const visibleCatTotal = useMemo(
    () => visibleCategories.reduce((sum, cat) => sum + cat.count, 0),
    [visibleCategories],
  );

  const activate = useCallback(
    (id: KpiId) => {
      if (id === 'coverage' && stats.scannedWithScore > 0) {
        navigate(repositoriesListPath('scanned'));
        return;
      }
      if (id === 'health' && stats.avgHealth !== null) {
        navigate(repositoriesListPath('scanned'));
        return;
      }
      if (id === 'remediations' && stats.liveRemediations > 0) {
        navigate(remediationsListPath(experience));
      }
    },
    [experience, navigate, stats],
  );

  const onKpiKey = useCallback(
    (id: KpiId) => (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate(id);
      }
    },
    [activate],
  );

  const cards: {
    id: KpiId;
    value: string;
    total?: number;
    label: string;
    enabled: boolean;
    aria: string;
  }[] = [
    {
      id: 'coverage',
      value: String(stats.scannedWithScore),
      total: stats.totalRepos,
      label: 'Scanned repositories',
      enabled: stats.scannedWithScore > 0,
      aria: `${stats.scannedWithScore} of ${stats.totalRepos} scanned repositories`,
    },
    {
      id: 'health',
      value: stats.avgHealth === null ? '—' : String(stats.avgHealth),
      label: 'Average health',
      enabled: stats.avgHealth !== null,
      aria:
        stats.avgHealth === null
          ? 'Average health unavailable'
          : `Average health ${stats.avgHealth}`,
    },
    {
      id: 'remediations',
      value: String(stats.liveRemediations),
      label: 'Remediations in progress',
      enabled: stats.liveRemediations > 0,
      aria: `${stats.liveRemediations} ${
        stats.liveRemediations === 1 ? 'remediation' : 'remediations'
      } in progress`,
    },
  ];

  return (
    <Box>
      <QualityTabIntro>
        Posture from each repository’s latest completed scan. History is on
        Scans.
      </QualityTabIntro>
      <Box className={classes.kpis}>
        {cards.map(card => (
          <Box
            key={card.id}
            className={`${classes.kpi} ${card.enabled ? '' : classes.kpiMuted}`}
            role="button"
            tabIndex={card.enabled ? 0 : -1}
            aria-disabled={!card.enabled}
            aria-label={card.aria}
            onClick={() => activate(card.id)}
            onKeyDown={onKpiKey(card.id)}
          >
            <Tooltip title={kpiHint(card.id)} arrow>
              <HelpOutlineIcon
                className={classes.kpiHelp}
                tabIndex={0}
                aria-label={`About ${card.label}`}
                onClick={event => event.stopPropagation()}
                onKeyDown={event => event.stopPropagation()}
              />
            </Tooltip>
            {card.id === 'health' && stats.avgHealth !== null ? (
              <QualityScoreMark
                score={stats.avgHealth}
                fontSize={28}
                denomSize={16}
              />
            ) : (
              <Typography className={classes.kpiValue} component="div">
                {card.value}
                {card.total !== undefined && (
                  <span className={classes.kpiTotal}> / {card.total}</span>
                )}
              </Typography>
            )}
            <Typography className={classes.kpiLabel}>{card.label}</Typography>
          </Box>
        ))}
      </Box>
      {findings.total > 0 && (
        <Box className={classes.mixCard}>
          <Box className={classes.mixHeader}>
            <Typography className={classes.mixTotal} component="span">
              {findings.total}
            </Typography>
            <Typography className={classes.mixMeta} component="span">
              {findings.total === 1
                ? 'finding on latest scans'
                : 'findings on latest scans'}
            </Typography>
          </Box>
          <Box className={classes.mixBar}>
            <SeverityMixBar
              breakdown={findings.bySeverity}
              height={FINDINGS_BAR_HEIGHT}
              activeSeverities={severityFilter}
              onSegmentClick={toggleSeverity}
            />
          </Box>
          <Box className={classes.mixChips}>
            <SeverityFilterChips
              breakdown={findings.bySeverity}
              active={severityFilter}
              onToggle={toggleSeverity}
            />
          </Box>
          {visibleCategories.map(cat => (
            <CategoryScanPeek key={cat.id} category={cat.id}>
              {open => (
                <Box
                  className={classes.catRow}
                  role="button"
                  tabIndex={0}
                  aria-label={`${cat.label}, ${cat.count} findings. Open scans.`}
                  onClick={open}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      open(event);
                    }
                  }}
                >
                  <Typography className={classes.catName} component="div">
                    {cat.label}
                    <Tooltip title={cat.hint} arrow>
                      <HelpOutlineIcon
                        className={classes.catHelp}
                        onClick={event => event.stopPropagation()}
                        onKeyDown={event => event.stopPropagation()}
                      />
                    </Tooltip>
                  </Typography>
                  <Chip
                    size="small"
                    label={cat.count}
                    className={classes.catCount}
                  />
                  <Box className={classes.catBar}>
                    <SeverityMixBar
                      breakdown={cat.breakdown}
                      height={FINDINGS_BAR_HEIGHT}
                      shareOfTotal={
                        visibleCatTotal > 0 ? cat.count / visibleCatTotal : 0
                      }
                    />
                  </Box>
                </Box>
              )}
            </CategoryScanPeek>
          ))}
        </Box>
      )}
    </Box>
  );
};
