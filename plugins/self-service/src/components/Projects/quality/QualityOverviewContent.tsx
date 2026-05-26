import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Link,
  makeStyles,
  Collapse,
  IconButton,
} from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import SecurityIcon from '@material-ui/icons/Security';
import BugReportIcon from '@material-ui/icons/BugReport';
import BuildIcon from '@material-ui/icons/Build';
import VerifiedUserOutlinedIcon from '@material-ui/icons/VerifiedUserOutlined';
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
    gap: theme.spacing(0.5),
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap' as const,
  },
  summaryChip: {
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    cursor: 'pointer',
    transition: 'all 0.15s',
    '&:hover': { borderColor: theme.palette.primary.main },
  },
  summaryChipActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}08`,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  categoryCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    marginBottom: theme.spacing(2),
    overflow: 'hidden',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    cursor: 'pointer',
    gap: 12,
    '&:hover': { backgroundColor: 'rgba(0,0,0,0.01)' },
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
    '&:hover': { backgroundColor: 'rgba(0,0,0,0.01)' },
  },
  ruleMessage: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  ruleId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#888',
    marginTop: 2,
  },
  repoChip: {
    fontSize: 11,
    height: 22,
    cursor: 'pointer',
    '&:hover': { boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' },
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
      <Box flex={1} minWidth={0}>
        <Typography className={classes.ruleMessage}>{rule.message}</Typography>
        <Typography className={classes.ruleId}>{rule.ruleId}</Typography>
      </Box>
      <Box className={classes.repoList}>
        {rule.repos.map(repo => (
          <Chip
            key={repo.name}
            size="small"
            label={`${repo.name}${repo.count > 1 ? ` (${repo.count})` : ''}`}
            className={classes.repoChip}
            variant="outlined"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigate(`/self-service/repositories/${repo.name}?tab=quality`);
            }}
          />
        ))}
      </Box>
      <Chip
        size="small"
        label={`${rule.totalCount}`}
        style={{
          fontSize: 11, height: 22, fontWeight: 700, minWidth: 28,
          backgroundColor: `${color}12`, color, flexShrink: 0,
        }}
      />
    </Box>
  );
};

const CategorySection = ({
  category,
  expanded,
  onToggle,
  severityFilter,
}: {
  category: FleetViolationCategory;
  expanded: boolean;
  onToggle: () => void;
  severityFilter: SeverityClass | null;
}) => {
  const classes = useStyles();
  const color = CATEGORY_COLORS[category.category];
  const icon = CATEGORY_ICONS[category.category];

  const filteredRules = severityFilter
    ? category.rules.filter(r => r.severity === severityFilter)
    : category.rules;

  const filteredTotal = filteredRules.reduce((s, r) => s + r.totalCount, 0);

  if (severityFilter && filteredRules.length === 0) return null;

  return (
    <Box className={classes.categoryCard}>
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
  const fleet = useMemo(() => getFleetViolationData(), []);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() =>
    new Set(fleet.categories.map(c => c.category)),
  );
  const [severityFilter, setSeverityFilter] = useState<SeverityClass | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ViolationCategory | null>(null);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const filteredCategories = categoryFilter
    ? fleet.categories.filter(c => c.category === categoryFilter)
    : fleet.categories;

  const sevOrder: SeverityClass[] = ['critical', 'high', 'medium', 'low', 'info'];

  return (
    <Box>
      {/* Summary bar */}
      <Box className={classes.summaryBar}>
        <Box className={classes.summaryChip} style={{ cursor: 'default', borderColor: 'transparent' }}>
          <Typography className={classes.summaryValue} style={{ color: statusColors.error }}>
            {fleet.totalViolations}
          </Typography>
          <Typography className={classes.summaryLabel}>
            violations
          </Typography>
        </Box>
        <Box className={classes.summaryChip} style={{ cursor: 'default', borderColor: 'transparent' }}>
          <Typography className={classes.summaryValue}>
            {fleet.reposWithIssues}
          </Typography>
          <Typography className={classes.summaryLabel}>
            of {fleet.totalRepos} repos affected
          </Typography>
        </Box>
        <Box style={{ flex: 1 }} />
        {categoryFilter && (
          <Chip
            size="small"
            label={`Category: ${fleet.categories.find(c => c.category === categoryFilter)?.label}`}
            onDelete={() => setCategoryFilter(null)}
            style={{ fontSize: 11, height: 24 }}
            color="primary"
            variant="outlined"
          />
        )}
        {severityFilter && (
          <Chip
            size="small"
            label={`Severity: ${severityFilter}`}
            onDelete={() => setSeverityFilter(null)}
            style={{ fontSize: 11, height: 24, textTransform: 'capitalize' }}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Severity breakdown — clickable filters */}
      <Box className={classes.sevBar}>
        {sevOrder.map(sev => {
          const count = fleet.bySeverity[sev];
          if (count === 0) return null;
          const isActive = severityFilter === sev;
          const color = SEVERITY_COLORS[sev];
          return (
            <Box
              key={sev}
              className={`${classes.sevItem} ${isActive ? classes.sevItemActive : ''}`}
              style={{
                backgroundColor: isActive ? `${color}12` : undefined,
                borderColor: isActive ? `${color}60` : undefined,
              }}
              onClick={() => setSeverityFilter(isActive ? null : sev)}
            >
              <Box style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
              <Typography style={{ fontSize: 12, textTransform: 'capitalize', color: isActive ? color : '#555', fontWeight: isActive ? 600 : 400 }}>
                {sev}
              </Typography>
              <Typography style={{ fontSize: 12, fontWeight: 700, color }}>{count}</Typography>
            </Box>
          );
        })}
      </Box>

      {/* Category sections */}
      {filteredCategories.map(cat => (
        <CategorySection
          key={cat.category}
          category={cat}
          expanded={expandedCategories.has(cat.category)}
          onToggle={() => toggleCategory(cat.category)}
          severityFilter={severityFilter}
        />
      ))}

      {filteredCategories.length === 0 && (
        <Box style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Typography style={{ fontSize: 14, color: '#888' }}>
            No violations match the current filters.
          </Typography>
        </Box>
      )}
    </Box>
  );
};
