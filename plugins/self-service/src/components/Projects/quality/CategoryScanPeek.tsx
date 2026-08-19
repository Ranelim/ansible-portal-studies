import { useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import {
  Box,
  Button,
  Popover,
  Typography,
  makeStyles,
} from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import { useNavigate } from 'react-router-dom';
import { GIT_REPOSITORIES } from '../catalog/unifiedDemoData';
import { GitLabIcon } from '../../common/icons';
import {
  APME_CATEGORY_LABEL,
  SEVERITY_COLORS,
  getApmeCategoryRepoHits,
  type ApmeRuleCategory,
  type SeverityClass,
} from '../detail/qualityDemoData';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import { scanSnapshotPath } from './qualitySurfacePaths';

const SEV_ORDER: SeverityClass[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
];

const SEV_LABEL: Record<SeverityClass, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const useStyles = makeStyles(theme => ({
  paper: {
    width: 400,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'min(420px, calc(100vh - 96px))',
    overflowY: 'auto',
    padding: theme.spacing(2),
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
  },
  group: {
    marginTop: theme.spacing(1),
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '16px minmax(0, 1fr) 28px auto',
    alignItems: 'center',
    columnGap: theme.spacing(1),
    padding: '6px 0',
  },
  providerIcon: {
    fontSize: 14,
    color: theme.palette.text.secondary,
  },
  repo: {
    minWidth: 0,
    fontSize: 13,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  count: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
  },
  viewBtn: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: 12,
    borderRadius: 20,
    minWidth: 0,
    padding: '2px 10px',
  },
}));

/** Peek: scans that have this category, grouped by severity in the mix. */
export function CategoryScanPeek({
  category,
  repoNames,
  children,
}: {
  category: ApmeRuleCategory;
  repoNames?: string[];
  children: (open: (event: SyntheticEvent<HTMLElement>) => void) => ReactNode;
}) {
  const classes = useStyles();
  const navigate = useNavigate();
  const { experience } = useNavIaModel();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const hits = useMemo(
    () => getApmeCategoryRepoHits(category, repoNames),
    [category, repoNames],
  );
  const grouped = useMemo(() => {
    return SEV_ORDER.map(sev => ({
      sev,
      rows: hits
        .filter(hit => hit.breakdown[sev] > 0)
        .map(hit => ({
          repoName: hit.repoName,
          scanId: hit.scanId,
          count: hit.breakdown[sev],
        }))
        .sort((a, b) => b.count - a.count),
    })).filter(group => group.rows.length > 0);
  }, [hits]);
  const repoCount = hits.length;
  const findingCount = hits.reduce((sum, hit) => sum + hit.count, 0);

  const open = (event: SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      {children(open)}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        onClick={e => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ className: classes.paper }}
      >
        <Typography className={classes.title}>
          {APME_CATEGORY_LABEL[category]}
        </Typography>
        <Typography className={classes.meta}>
          {findingCount} finding{findingCount !== 1 ? 's' : ''} on current
          scans · {repoCount}{' '}
          {repoCount === 1 ? 'repository' : 'repositories'}
        </Typography>
        {grouped.map(group => (
          <Box key={group.sev} className={classes.group}>
            <Typography
              className={classes.groupLabel}
              style={{ color: SEVERITY_COLORS[group.sev] }}
            >
              {SEV_LABEL[group.sev]}
            </Typography>
            {group.rows.map(hit => {
              const repo = GIT_REPOSITORIES.find(r => r.name === hit.repoName);
              const org = repo?.org ?? '';
              const gitlab = repo?.provider === 'gitlab';
              return (
                <Box key={`${group.sev}-${hit.repoName}`} className={classes.row}>
                  {gitlab ? (
                    <GitLabIcon className={classes.providerIcon} />
                  ) : (
                    <GitHubIcon className={classes.providerIcon} />
                  )}
                  <Typography
                    className={classes.repo}
                    title={`${org}/${hit.repoName}`}
                  >
                    {org ? `${org}/${hit.repoName}` : hit.repoName}
                  </Typography>
                  <Typography className={classes.count}>{hit.count}</Typography>
                  <Button
                    size="small"
                    color="primary"
                    className={classes.viewBtn}
                    onClick={() => {
                      setAnchorEl(null);
                      navigate(
                        scanSnapshotPath(experience, hit.scanId, {
                          repo: hit.repoName,
                          category,
                        }),
                      );
                    }}
                  >
                    View scan
                  </Button>
                </Box>
              );
            })}
          </Box>
        ))}
      </Popover>
    </>
  );
}
