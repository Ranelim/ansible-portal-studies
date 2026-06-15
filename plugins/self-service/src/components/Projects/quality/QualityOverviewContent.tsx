import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  makeStyles,
  useTheme,
  Collapse,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import SecurityIcon from '@material-ui/icons/Security';
import BugReportIcon from '@material-ui/icons/BugReport';
import BuildIcon from '@material-ui/icons/Build';
import VerifiedUserOutlinedIcon from '@material-ui/icons/VerifiedUserOutlined';
import GitHubIcon from '@material-ui/icons/GitHub';
import { statusColors } from '../../common/statusColors';
import {
  getFleetViolationData,
  SEVERITY_COLORS,
  type FleetViolationCategory,
  type FleetViolationRule,
  type ViolationCategory,
  type SeverityClass,
} from '../detail/qualityDemoData';

const CATEGORY_ICONS: Record<ViolationCategory, React.ReactNode> = {
  'aap-compatibility': <VerifiedUserOutlinedIcon style={{ fontSize: 18 }} />,
  'security': <SecurityIcon style={{ fontSize: 18 }} />,
  'lint': <BugReportIcon style={{ fontSize: 18 }} />,
  'best-practice': <BuildIcon style={{ fontSize: 18 }} />,
};

const CATEGORY_COLORS: Record<ViolationCategory, string> = {
  'aap-compatibility': '#0066CC',
  'security': '#A30000',
  'lint': '#F0AB00',
  'best-practice': '#3E8635',
};

const useStyles = makeStyles(theme => ({
  summaryBar: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: theme.spacing(2),
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  categoryCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    marginBottom: theme.spacing(2),
    overflow: 'hidden',
  },
  categoryCardPrimary: {
    border: `1px solid ${theme.palette.type === 'dark' ? 'rgba(0,102,204,0.25)' : '#0066CC30'}`,
    borderRadius: 12,
    marginBottom: theme.spacing(2),
    overflow: 'hidden',
    boxShadow: theme.palette.type === 'dark' ? '0 1px 4px rgba(0, 102, 204, 0.15)' : '0 1px 4px rgba(0, 102, 204, 0.08)',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    cursor: 'pointer',
    gap: 12,
    '&:hover': { backgroundColor: theme.palette.action.hover },
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryTitle: {
    fontWeight: 600,
    fontSize: 15,
    flex: 1,
  },
  categoryMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  ruleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '10px 20px 10px 64px',
    borderTop: `1px solid ${theme.palette.divider}`,
    gap: 12,
    '&:hover': { backgroundColor: theme.palette.action.hover },
  },
  ruleMessage: {
    fontSize: 13,
    color: theme.palette.text.primary,
    flex: 1,
  },
  repoChip: {
    fontSize: 11,
    height: 22,
    cursor: 'pointer',
    color: theme.palette.primary.main,
    borderColor: `${theme.palette.primary.main}40`,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: `${theme.palette.primary.main}08`,
    },
  },
  repoList: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
    alignItems: 'center',
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
}));

const RuleRow = ({ rule }: { rule: FleetViolationRule }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const color = SEVERITY_COLORS[rule.severity];

  return (
    <Box className={classes.ruleRow}>
      <Chip
        size="small"
        label={rule.severity}
        style={{
          fontSize: 10, height: 20, textTransform: 'capitalize', fontWeight: 600,
          backgroundColor: `${color}15`, color, marginTop: 2, flexShrink: 0,
        }}
      />
      <Tooltip title={`Rule: ${rule.ruleId}`} arrow enterDelay={400}>
        <Box flex={1} minWidth={0}>
          <Typography className={classes.ruleMessage}>{rule.message}</Typography>
        </Box>
      </Tooltip>
      <Box className={classes.repoList}>
        {rule.repos.map(repo => (
          <Chip
            key={repo.name}
            size="small"
            label={
              <Box display="flex" alignItems="center" style={{ gap: 4 }}>
                <GitHubIcon style={{ fontSize: 11, opacity: 0.6 }} />
                {`${repo.name}${repo.count > 1 ? ` (${repo.count})` : ''}`}
              </Box>
            }
            className={classes.repoChip}
            variant="outlined"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigate(`/self-service/repositories/${repo.name}?tab=quality&rule=${encodeURIComponent(rule.ruleId)}`);
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const CategorySection = ({
  category,
  expanded,
  onToggle,
  severityFilters,
  isPrimary,
}: {
  category: FleetViolationCategory;
  expanded: boolean;
  onToggle: () => void;
  severityFilters: Set<SeverityClass>;
  isPrimary?: boolean;
}) => {
  const classes = useStyles();
  const color = CATEGORY_COLORS[category.category];
  const icon = CATEGORY_ICONS[category.category];

  const hasFilter = severityFilters.size > 0;
  const filteredRules = hasFilter
    ? category.rules.filter(r => severityFilters.has(r.severity))
    : category.rules;

  const filteredTotal = filteredRules.reduce((s, r) => s + r.totalCount, 0);

  if (hasFilter && filteredRules.length === 0) return null;

  return (
    <Box className={isPrimary ? classes.categoryCardPrimary : classes.categoryCard}>
      <Box className={classes.categoryHeader} onClick={onToggle}>
        <Box className={classes.categoryIcon} style={{ backgroundColor: `${color}12`, color }}>
          {icon}
        </Box>
        <Box flex={1}>
          <Typography className={classes.categoryTitle}>
            {category.label}
          </Typography>
          <Typography className={classes.categoryMeta}>
            {filteredTotal} violation{filteredTotal !== 1 ? 's' : ''} across {category.reposAffected} repo{category.reposAffected !== 1 ? 's' : ''} · {filteredRules.length} rule{filteredRules.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={filteredTotal}
          style={{
            fontSize: 12, height: 24, fontWeight: 700, minWidth: 32,
            backgroundColor: `${color}15`, color,
          }}
        />
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        {filteredRules.map(rule => (
          <RuleRow key={rule.ruleId} rule={rule} />
        ))}
      </Collapse>
    </Box>
  );
};

export const QualityOverviewContent = () => {
  const classes = useStyles();
  const theme = useTheme();
  const fleet = useMemo(() => getFleetViolationData(), []);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() =>
    new Set(fleet.categories.map(c => c.category)),
  );
  const [severityFilters, setSeverityFilters] = useState<Set<SeverityClass>>(new Set());

  const toggleSeverity = (sev: SeverityClass) => {
    setSeverityFilters(prev => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev); else next.add(sev);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const sevOrder: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];
  const hasFilter = severityFilters.size > 0;
  const filteredViolationCount = hasFilter
    ? sevOrder.reduce((sum, sev) => sum + (severityFilters.has(sev) ? fleet.bySeverity[sev] : 0), 0)
    : fleet.totalViolations;

  return (
    <Box>
      {/* Violation count */}
      <Box className={classes.summaryBar}>
        <Typography className={classes.summaryValue} style={{ color: statusColors.error }}>
          {hasFilter ? filteredViolationCount : fleet.totalViolations}
        </Typography>
        <Typography className={classes.summaryLabel}>
          {hasFilter
            ? `of ${fleet.totalViolations} violations across ${fleet.reposWithIssues} repositories`
            : `violations across ${fleet.reposWithIssues} repositories`
          }
        </Typography>
      </Box>

      {/* Severity breakdown — multi-select filters */}
      <Box className={classes.sevBar}>
        {sevOrder.map(sev => {
          const count = fleet.bySeverity[sev];
          if (count === 0) return null;
          const isActive = severityFilters.has(sev);
          const isDimmed = hasFilter && !isActive;
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
        {hasFilter && (
          <Chip
            size="small"
            label="Clear"
            onDelete={() => setSeverityFilters(new Set())}
            onClick={() => setSeverityFilters(new Set())}
            style={{ fontSize: 11, height: 22, marginLeft: 4 }}
            variant="outlined"
          />
        )}
      </Box>

      {/* Category sections — AAP compatibility visually elevated */}
      {fleet.categories
        .filter(cat => !hasFilter || cat.rules.some(r => severityFilters.has(r.severity)))
        .map(cat => (
          <CategorySection
            key={cat.category}
            category={cat}
            expanded={expandedCategories.has(cat.category)}
            onToggle={() => toggleCategory(cat.category)}
            severityFilters={severityFilters}
            isPrimary={cat.category === 'aap-compatibility'}
          />
        ))}

      {fleet.categories.filter(cat => !hasFilter || cat.rules.some(r => severityFilters.has(r.severity))).length === 0 && (
        <Box style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Typography style={{ fontSize: 14, color: theme.palette.text.secondary }}>
            No violations match the current filters.
          </Typography>
        </Box>
      )}
    </Box>
  );
};
