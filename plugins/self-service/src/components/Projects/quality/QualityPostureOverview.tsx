import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { Box, Chip, Tooltip, Typography, makeStyles } from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import { QualityScoreMark } from '../catalog/HealthScorePopover';
import {
  SEVERITY_COLORS,
  getApmeFleetFindings,
  getProjectQuality,
  type SeverityClass,
} from '../detail/qualityDemoData';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import {
  remediationsListPath,
  repositoriesListPath,
  scansListPath,
} from './qualitySurfacePaths';
import { countLiveRemediations } from './RemediationsContent';
import {
  isWithinDays,
  type QualityOverviewScope,
} from './qualityWindow';
import { SeverityFilterChips } from './SeverityFilterChips';
import { SeverityMixBar } from './SeverityMixBar';
import { CategoryScanPeek } from './CategoryScanPeek';

type KpiId = 'coverage' | 'health' | 'critical' | 'remediations' | 'scans';

const SEV_ORDER: SeverityClass[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

/** Same stroke as scan-history findings bars — every mix bar in this widget. */
const FINDINGS_BAR_HEIGHT = 6;

const SCOPE_OPTIONS: { id: QualityOverviewScope; value: string; label: string }[] =
  [
    { id: 'current', value: 'current', label: 'Current scan' },
    { id: 7, value: '7', label: 'Last 7 days' },
    { id: 30, value: '30', label: 'Last 30 days' },
  ];

function parseOverviewScope(value: string): QualityOverviewScope {
  if (value === '7') return 7;
  if (value === '30') return 30;
  return 'current';
}

const SCOPE_HELP =
  'Current scan is the latest completed scan for each git repository. Last 7 or 30 days limits Overview to repositories whose latest scan is in that window. Remediations always use the current scan. History is on Scans.';

const useStyles = makeStyles(theme => ({
  kpis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  scopeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  scopeHelp: {
    fontSize: 16,
    color: theme.palette.text.disabled,
    cursor: 'help',
  },
  kpi: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2),
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
  kpiValueCritical: {
    color: SEVERITY_COLORS.critical,
  },
  kpiLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
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
 * Shared Quality / Overview — estate KPIs, then hand off.
 * Git Repositories list, Remediations, and Scans own the queues.
 */
export const QualityPostureOverview = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { experience } = useNavIaModel();
  const [scope, setScope] = useState<QualityOverviewScope>('current');

  const scopedRepos = useMemo(() => {
    return GIT_REPOSITORIES.filter(repo => {
      const q = getProjectQuality(repo.name);
      if (!q) return false;
      if (scope === 'current') return true;
      return isWithinDays(q.lastScannedAt, scope);
    });
  }, [scope]);
  const scopedNames = useMemo(
    () => scopedRepos.map(r => r.name),
    [scopedRepos],
  );

  const stats = useMemo(() => {
    const totalRepos = GIT_REPOSITORIES.length;
    let scannedWithScore = 0;
    let healthSum = 0;
    let withCritical = 0;
    let scansInWindow = 0;
    const windowDays = scope === 'current' ? null : scope;

    for (const repo of GIT_REPOSITORIES) {
      const q = getProjectQuality(repo.name);
      if (!q) continue;
      const inScope =
        scope === 'current' || isWithinDays(q.lastScannedAt, scope);
      if (inScope) {
        scannedWithScore += 1;
        healthSum += q.healthScore;
        if ((q.severityBreakdown.critical ?? 0) > 0) withCritical += 1;
      }
      if (windowDays !== null) {
        const latestId = q.latestScan.scanId;
        const history = q.scanHistory.filter(scan => scan.scanId !== latestId);
        for (const scan of [q.latestScan, ...history]) {
          if (isWithinDays(scan.createdAt, windowDays)) scansInWindow += 1;
        }
      }
    }

    return {
      totalRepos,
      scannedWithScore,
      avgHealth:
        scannedWithScore > 0 ? Math.round(healthSum / scannedWithScore) : null,
      withCritical,
      liveRemediations: countLiveRemediations(),
      scansInWindow,
    };
  }, [scope]);

  const findings = useMemo(
    () => getApmeFleetFindings(scope === 'current' ? undefined : scopedNames),
    [scope, scopedNames],
  );
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

  const activate = useCallback(
    (id: KpiId) => {
      if (id === 'coverage' && stats.scannedWithScore > 0) {
        navigate(
          scope === 'current'
            ? repositoriesListPath('scanned')
            : repositoriesListPath('recent'),
        );
        return;
      }
      if (id === 'health' && stats.avgHealth !== null) {
        navigate(repositoriesListPath('scanned'));
        return;
      }
      if (id === 'critical' && stats.withCritical > 0) {
        navigate(repositoriesListPath('critical'));
        return;
      }
      if (id === 'remediations' && stats.liveRemediations > 0) {
        navigate(remediationsListPath(experience));
        return;
      }
      if (id === 'scans' && stats.scansInWindow > 0) {
        navigate(scansListPath(experience));
      }
    },
    [experience, navigate, scope, stats],
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

  const windowPhrase =
    scope === 'current' ? 'on the current scan' : `in the last ${scope} days`;
  const cards: {
    id: KpiId;
    value: string;
    total?: number;
    label: string;
    enabled: boolean;
    critical?: boolean;
    aria: string;
  }[] = [
    {
      id: 'coverage',
      value: String(stats.scannedWithScore),
      total: stats.totalRepos,
      label:
        scope === 'current'
          ? 'Repositories with a current scan'
          : `Repositories scanned in the last ${scope} days`,
      enabled: stats.scannedWithScore > 0,
      aria: `${stats.scannedWithScore} of ${stats.totalRepos} ${
        scope === 'current'
          ? 'repositories with a current scan'
          : `repositories scanned in the last ${scope} days`
      }`,
    },
    {
      id: 'health',
      value: stats.avgHealth === null ? '—' : String(stats.avgHealth),
      label:
        scope === 'current'
          ? 'Average health on the current scan'
          : `Average health for repositories scanned in the last ${scope} days`,
      enabled: stats.avgHealth !== null,
      aria:
        stats.avgHealth === null
          ? 'Average health unavailable'
          : `Average health ${stats.avgHealth}`,
    },
    {
      id: 'critical',
      value: String(stats.withCritical),
      label: `Repositories with critical findings ${windowPhrase}`,
      enabled: stats.withCritical > 0,
      critical: true,
      aria: `${stats.withCritical} ${
        stats.withCritical === 1 ? 'repository' : 'repositories'
      } with critical findings ${windowPhrase}`,
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
  if (scope !== 'current') {
    cards.push({
      id: 'scans',
      value: String(stats.scansInWindow),
      label: `Scans run in the last ${scope} days`,
      enabled: stats.scansInWindow > 0,
      aria: `${stats.scansInWindow} ${
        stats.scansInWindow === 1 ? 'scan' : 'scans'
      } run in the last ${scope} days`,
    });
  }

  return (
    <Box>
      <Box className={classes.scopeRow}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={String(scope)}
          onChange={(_event, next) => {
            if (next !== null) setScope(parseOverviewScope(String(next)));
          }}
          aria-label="Overview scan scope"
        >
          {SCOPE_OPTIONS.map(opt => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Tooltip title={SCOPE_HELP} arrow>
          <HelpOutlineIcon className={classes.scopeHelp} />
        </Tooltip>
      </Box>
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
            {card.id === 'health' && stats.avgHealth !== null ? (
              <QualityScoreMark
                score={stats.avgHealth}
                fontSize={28}
                denomSize={16}
              />
            ) : (
              <Typography
                className={`${classes.kpiValue} ${
                  card.critical ? classes.kpiValueCritical : ''
                }`}
                component="div"
              >
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
                ? scope === 'current'
                  ? 'finding on the current scan'
                  : `finding on current scans from the last ${scope} days`
                : scope === 'current'
                  ? 'findings on the current scan'
                  : `findings on current scans from the last ${scope} days`}
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
            <CategoryScanPeek
              key={cat.id}
              category={cat.id}
              repoNames={scope === 'current' ? undefined : scopedNames}
            >
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
