import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  Collapse,
  Tooltip,
  makeStyles,
  useTheme,
} from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import GitHubIcon from '@material-ui/icons/GitHub';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import IconButton from '@material-ui/core/IconButton';
import { statusColors } from '../../common/statusColors';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import { qualitySummaryOnRepo } from './qualitySurfacePaths';
import {
  getFleetViolationData,
  SEVERITY_COLORS,
  APME_CATEGORY_LABEL,
  type ApmeRuleCategory,
  type FleetViolationRule,
  type SeverityClass,
} from '../detail/qualityDemoData';

const CATEGORY_LABELS = APME_CATEGORY_LABEL;

const SEVERITY_WEIGHT: Record<SeverityClass, number> = {
  critical: 50, high: 20, medium: 5, low: 2, info: 1,
};

const FIX_LABELS: Record<string, { label: string; color: string; darkColor: string }> = {
  deterministic: { label: 'Auto-fix', color: '#1a7f37', darkColor: '#3fb950' },
  ai: { label: 'AI-fix', color: '#6753ac', darkColor: '#a78bfa' },
  manual: { label: 'Manual', color: '#6b7280', darkColor: '#9ca3af' },
};

const useStyles = makeStyles(theme => {
  const isDark = theme.palette.type === 'dark';
  return {
    summaryBar: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: theme.spacing(1),
    },
    sevBar: {
      display: 'flex',
      gap: 12,
      marginBottom: theme.spacing(2),
      flexWrap: 'wrap' as const,
    },
    sevItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      borderRadius: 6,
      cursor: 'pointer',
      transition: 'all 0.15s',
      border: '1px solid transparent',
    },
    sevItemActive: {
      border: '1px solid',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: 13,
      '& thead': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      '& th': {
        textAlign: 'left' as const,
        padding: '10px 12px',
        fontWeight: 600,
        fontSize: 12,
        color: theme.palette.text.secondary,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.3,
        cursor: 'pointer',
        userSelect: 'none' as const,
        '&:hover': { color: theme.palette.text.primary },
      },
      '& td': {
        padding: '10px 12px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        verticalAlign: 'middle' as const,
      },
      '& tbody tr:last-child td': {
        borderBottom: 'none',
      },
      '& tbody tr:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
  };
});

type SortColumn = 'impact' | 'severity' | 'repos' | 'occurrences' | 'category';

export const QualityOverviewContent = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  const navigate = useNavigate();
  const { experience } = useNavIaModel();
  const openRepoSummary = qualitySummaryOnRepo(experience);

  const fleet = useMemo(() => getFleetViolationData(), []);

  const [severityFilters, setSeverityFilters] = useState<Set<SeverityClass>>(new Set());
  const [categoryFilters, setCategoryFilters] = useState<Set<ApmeRuleCategory>>(new Set());
  const [sortCol, setSortCol] = useState<SortColumn>('impact');
  const [sortAsc, setSortAsc] = useState(false);

  const allRules = useMemo(() => {
    const rules: FleetViolationRule[] = [];
    for (const cat of fleet.categories) {
      for (const rule of cat.rules) {
        rules.push(rule);
      }
    }
    return rules;
  }, [fleet]);

  const filteredRules = useMemo(() => {
    let result = allRules;
    if (severityFilters.size > 0) result = result.filter(r => severityFilters.has(r.severity));
    if (categoryFilters.size > 0) result = result.filter(r => categoryFilters.has(r.category));
    return result;
  }, [allRules, severityFilters, categoryFilters]);

  const sortedRules = useMemo(() => {
    const sevOrder: Record<SeverityClass, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

    return [...filteredRules].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'impact':
          cmp = (SEVERITY_WEIGHT[b.severity] * b.repos.length) - (SEVERITY_WEIGHT[a.severity] * a.repos.length);
          break;
        case 'severity':
          cmp = sevOrder[a.severity] - sevOrder[b.severity];
          break;
        case 'repos':
          cmp = b.repos.length - a.repos.length;
          break;
        case 'occurrences':
          cmp = b.totalCount - a.totalCount;
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortAsc ? -cmp : cmp;
    });
  }, [filteredRules, sortCol, sortAsc]);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  const toggleSeverity = (sev: SeverityClass) => {
    setSeverityFilters(prev => { const n = new Set(prev); if (n.has(sev)) n.delete(sev); else n.add(sev); return n; });
  };

  const toggleCategory = (cat: ApmeRuleCategory) => {
    setCategoryFilters(prev => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; });
  };

  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const sevOrder: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];
  const hasFilter = severityFilters.size > 0 || categoryFilters.size > 0;
  const filteredViolationCount = filteredRules.reduce((s, r) => s + r.totalCount, 0);
  const reposClean = fleet.totalRepos - fleet.reposWithIssues;
  const sortArrow = (col: SortColumn) => sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : '';

  return (
    <Box>
      {/* Summary */}
      <Box className={classes.summaryBar}>
        <Typography style={{ fontSize: 20, fontWeight: 700, color: statusColors.error }}>
          {hasFilter ? filteredViolationCount : fleet.totalViolations}
        </Typography>
        <Typography style={{ fontSize: 13, color: theme.palette.text.secondary }}>
          {hasFilter
            ? `of ${fleet.totalViolations} findings · ${sortedRules.length} rule${sortedRules.length !== 1 ? 's' : ''} · ${fleet.reposWithIssues} repositories`
            : `findings · ${allRules.length} rules · ${fleet.reposWithIssues} repositories`
          }
          {reposClean > 0 && !hasFilter && (
            <span style={{ marginLeft: 6 }}>
              · <span style={{ color: statusColors.success, fontWeight: 500 }}>{reposClean} clean</span>
            </span>
          )}
        </Typography>
      </Box>

      {/* Severity filter chips */}
      <Box className={classes.sevBar}>
        {sevOrder.map(sev => {
          const count = fleet.bySeverity[sev];
          if (count === 0) return null;
          const isActive = severityFilters.has(sev);
          const isDimmed = hasFilter && !isActive && severityFilters.size > 0;
          const color = SEVERITY_COLORS[sev];
          return (
            <Box
              key={sev}
              className={`${classes.sevItem} ${isActive ? classes.sevItemActive : ''}`}
              style={{
                backgroundColor: isActive ? `${color}12` : undefined,
                borderColor: isActive ? `${color}60` : undefined,
                opacity: isDimmed ? 0.45 : 1,
              }}
              onClick={() => toggleSeverity(sev)}
            >
              <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
              <Typography style={{ fontSize: 12, textTransform: 'capitalize', color: isActive ? color : theme.palette.text.secondary, fontWeight: isActive ? 600 : 400 }}>
                {sev}
              </Typography>
              <Typography style={{ fontSize: 12, fontWeight: 700, color }}>{count}</Typography>
            </Box>
          );
        })}

      </Box>

      {/* Active filter status line */}
      {hasFilter && (
        <Box display="flex" alignItems="center" style={{ marginBottom: 12, gap: 8 }}>
          <Typography style={{ fontSize: 12, color: theme.palette.text.secondary }}>
            Showing {filteredViolationCount} of {fleet.totalViolations} findings
          </Typography>
          {Array.from(categoryFilters).map(cat => (
            <Chip key={cat} size="small" label={CATEGORY_LABELS[cat]}
              onDelete={() => toggleCategory(cat)}
              style={{ height: 20, fontSize: 11, fontWeight: 600 }} />
          ))}
          <span
            onClick={() => { setSeverityFilters(new Set()); setCategoryFilters(new Set()); }}
            style={{ fontSize: 12, color: theme.palette.primary.main, cursor: 'pointer' }}
          >
            Clear filters
          </span>
        </Box>
      )}

      {/* Rules table */}
      <Card variant="outlined" style={{ borderRadius: 8, overflow: 'hidden' }}>
        <Box style={{ overflow: 'auto' }}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th style={{ width: 36, padding: '10px 4px' }}></th>
                <th style={{ width: 80 }} onClick={() => handleSort('severity')}>Severity{sortArrow('severity')}</th>
                <th onClick={() => handleSort('impact')}>Rule{sortArrow('impact')}</th>
                <th style={{ width: 100 }} onClick={() => handleSort('category')}>Category{sortArrow('category')}</th>
                <th style={{ width: 80 }} onClick={() => handleSort('repos')}>Repos{sortArrow('repos')}</th>
                <th style={{ width: 100 }} onClick={() => handleSort('occurrences')}>Occurrences{sortArrow('occurrences')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedRules.map(rule => {
                const color = SEVERITY_COLORS[rule.severity];
                const isExpanded = expandedRule === rule.ruleId;

                return [
                  <tr
                    key={rule.ruleId}
                    onClick={() => setExpandedRule(isExpanded ? null : rule.ruleId)}
                    style={{ cursor: 'pointer', ...(isExpanded ? { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)' } : {}) }}
                  >
                    <td style={{ width: 36, padding: '8px 4px' }}>
                      <IconButton size="small">
                        {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                      </IconButton>
                    </td>
                    <td>
                      <Chip size="small" label={`${rule.totalCount} ${rule.severity}`}
                        style={{
                          fontSize: 10, height: 20, textTransform: 'capitalize', fontWeight: 600,
                          backgroundColor: `${color}15`, color,
                        }}
                      />
                    </td>
                    <td>
                      <Tooltip title={`Rule ID: ${rule.ruleId}`} arrow enterDelay={400}>
                        <Typography style={{ fontSize: 13 }}>{rule.message}</Typography>
                      </Tooltip>
                    </td>
                    <td>
                      <Typography
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          toggleCategory(rule.category);
                        }}
                        style={{
                          fontSize: 11,
                          color: categoryFilters.has(rule.category) ? theme.palette.primary.main : theme.palette.text.secondary,
                          cursor: 'pointer',
                          fontWeight: categoryFilters.has(rule.category) ? 600 : 400,
                        }}
                      >
                        {CATEGORY_LABELS[rule.category]}
                      </Typography>
                    </td>
                    <td>
                      <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                        {rule.repos.length}
                      </Typography>
                    </td>
                    <td>
                      <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                        {rule.totalCount}
                      </Typography>
                    </td>
                  </tr>,
                  isExpanded ? (
                    <tr key={`${rule.ruleId}-repos`}>
                      <td colSpan={6} style={{ padding: 0, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa' }}>
                        <Collapse in={isExpanded}>
                          <Box style={{ padding: '4px 0 4px 52px' }}>
                            {rule.repos.map(r => {
                              const fixCfg = FIX_LABELS[r.fixTier] ?? FIX_LABELS.manual;
                              return (
                                <Box
                                  key={r.name}
                                  display="flex" alignItems="center"
                                  style={{
                                    padding: '6px 12px',
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    gap: 12,
                                  }}
                                >
                                  <Box display="flex" alignItems="center" style={{ gap: 6, flex: 1, minWidth: 0 }}>
                                    <GitHubIcon style={{ fontSize: 13, color: theme.palette.text.secondary, flexShrink: 0 }} />
                                    <Typography style={{ fontSize: 12, fontWeight: 500 }}>{r.name}</Typography>
                                    {r.count > 1 && (
                                      <Chip size="small" label={`×${r.count}`} style={{ fontSize: 10, height: 16, fontWeight: 600 }} />
                                    )}
                                  </Box>
                                  <Typography style={{ fontSize: 11, fontWeight: 500, color: isDark ? fixCfg.darkColor : fixCfg.color, flexShrink: 0 }}>
                                    {fixCfg.label}
                                  </Typography>
                                  <Typography style={{ fontSize: 11, color: theme.palette.text.secondary, flexShrink: 0 }}>
                                    {r.lastScannedAt ?? '—'}
                                  </Typography>
                                  <Typography
                                    style={{ fontSize: 11, color: theme.palette.primary.main, cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      navigate(
                                        openRepoSummary
                                          ? `/self-service/repositories/${r.name}`
                                          : `/self-service/repositories/${r.name}?tab=quality&rule=${encodeURIComponent(rule.ruleId)}`,
                                      );
                                    }}
                                  >
                                    View details →
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                        </Collapse>
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </Box>
      </Card>

      {sortedRules.length === 0 && (
        <Box style={{ textAlign: 'center', padding: '48px 24px' }}>
          {hasFilter ? (
            <Typography style={{ fontSize: 14, color: theme.palette.text.secondary }}>
              No findings match the current filters.
            </Typography>
          ) : (
            <>
              <CheckCircleIcon style={{ fontSize: 40, color: statusColors.success, marginBottom: 8 }} />
              <Typography style={{ fontSize: 16, fontWeight: 500 }}>All repositories are clean</Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};
