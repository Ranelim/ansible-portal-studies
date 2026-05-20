import { useState, useMemo, useCallback, useEffect } from 'react';
import { DEVSPACES_BASE_URL, DEMO_CONNECTIONS } from '../../Admin/syncDemoData';
import { useUserRoleContext } from '../../../hooks/useUserRole';

const isDevSpacesConnected = DEMO_CONNECTIONS.find(c => c.id === 'devspaces')?.status === 'Active';
import { Table, TableColumn } from '@backstage/core-components';
import {
  Box,
  Button,
  Typography,
  makeStyles,
  IconButton,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Input,
  Paper,
  TextField,
  InputAdornment,
  Link,
  Tooltip,
} from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CodeIcon from '@material-ui/icons/Code';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import CancelIcon from '@material-ui/icons/Cancel';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import GitHubIcon from '@material-ui/icons/GitHub';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import CategoryIcon from '@material-ui/icons/Category';
import MemoryIcon from '@material-ui/icons/Memory';
import Popover from '@material-ui/core/Popover';
import CloseIcon from '@material-ui/icons/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import { DismissibleBanner } from '../../common/DismissibleBanner';
import { EmptyStateLayout, RepositoriesIllustration } from '../../common/EmptyStateLayout';
import { LastSyncedIndicator } from '../../Admin/LastSyncedIndicator';
import { statusColors } from '../../common/statusColors';
import {
  GIT_REPOSITORIES,
  type GitRepository,
  type DiscoveredResourceSummary,
} from './unifiedDemoData';
import { getProjectViolationCount, getProjectSeverityBreakdown, getProjectAapVersion, SEVERITY_COLORS } from '../../Projects/detail/qualityDemoData';
import type { SeverityClass } from '../../Projects/detail/qualityDemoData';
import { MigrateToAnsibleWizard } from './MigrateToAnsibleWizard';

type ProviderFilter = 'all' | 'github' | 'gitlab';

type ActiveFilters = {
  provider: ProviderFilter;
};

const DEFAULT_FILTERS: ActiveFilters = {
  provider: 'all',
};

const hasActiveFilters = (filters: ActiveFilters) =>
  filters.provider !== 'all';

const useStyles = makeStyles(theme => ({
  filterLabel: {
    marginTop: theme.spacing(2),
    fontWeight: 600,
    fontSize: '0.875rem',
    '&:first-child': { marginTop: 0 },
  },
  filterPaper: {
    padding: theme.spacing(1.5),
    borderRadius: 3,
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
  },
  repoLink: {
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  commitInfo: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
  },
  providerIcon: {
    fontSize: 16,
    verticalAlign: 'middle',
    marginRight: 4,
  },
  activeFiltersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    flexWrap: 'wrap' as const,
  },
  activeChip: {
    borderRadius: 16,
    textTransform: 'none' as const,
    fontSize: 12,
  },
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
  },
  resourceBadges: {
    display: 'flex',
    gap: 8,
    flexWrap: 'nowrap' as const,
    alignItems: 'center',
  },
  resourceBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  resourceIcon: {
    fontSize: 14,
  },
  resourcePopover: {
    padding: theme.spacing(2),
    minWidth: 280,
    maxWidth: 380,
  },
  resourcePopoverHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1),
  },
  resourcePopoverTitle: {
    fontWeight: 600,
    fontSize: 14,
  },
  resourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    '&:first-of-type': { borderTop: 'none' },
  },
  resourceRowLabel: {
    fontSize: 13,
    fontWeight: 500,
    flex: 1,
  },
  resourceRowCount: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  resourceClickable: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 12,
    color: theme.palette.text.secondary,
    cursor: 'pointer',
    borderRadius: 4,
    padding: '2px 4px',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const GitLabIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ verticalAlign: 'middle', marginRight: 4 }}
  >
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z" />
  </svg>
);


const RESOURCE_ICON_MAP: Record<string, React.ReactNode> = {
  playbook: <InsertDriveFileOutlinedIcon style={{ fontSize: 14 }} />,
  role: <FolderOutlinedIcon style={{ fontSize: 14 }} />,
  'collection-dep': <CategoryIcon style={{ fontSize: 14 }} />,
  'execution-environment': <MemoryIcon style={{ fontSize: 14 }} />,
};

const RESOURCE_LABEL_MAP: Record<string, string> = {
  playbook: 'Playbook',
  role: 'Role',
  'collection-dep': 'Collection dependency',
  'execution-environment': 'Execution environment',
};

const ResourceBadges = ({ resources, repoName }: { resources: DiscoveredResourceSummary[]; repoName: string }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const totalCount = resources.reduce((sum, r) => sum + r.count, 0);

  return (
    <>
      <Box className={classes.resourceBadges} onClick={handleClick} style={{ cursor: 'pointer' }}>
        {resources.map(r => (
          <Box key={r.type} className={classes.resourceClickable}>
            {RESOURCE_ICON_MAP[r.type]}
            <span>{r.count}</span>
          </Box>
        ))}
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <Box className={classes.resourcePopover}>
          <Box className={classes.resourcePopoverHeader}>
            <Box>
              <Typography className={classes.resourcePopoverTitle}>
                Discovered content
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
                {totalCount} {totalCount === 1 ? 'item' : 'items'} found in {repoName}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box>
            {resources.map(r => (
              <Box key={r.type} className={classes.resourceRow}>
                <Box style={{ color: statusColors.info, display: 'flex', alignSelf: 'flex-start', marginTop: 2 }}>
                  {RESOURCE_ICON_MAP[r.type]}
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography className={classes.resourceRowLabel}>
                    {r.count} {RESOURCE_LABEL_MAP[r.type]}{r.count > 1 ? 's' : ''}
                  </Typography>
                  {r.items && r.items.length > 0 && (
                    <Box style={{ marginTop: 2 }}>
                      {r.items.map(item => (
                        <Typography
                          key={item}
                          variant="body2"
                          style={{ fontSize: 11, lineHeight: 1.6, fontFamily: 'monospace', color: '#555' }}
                        >
                          {item}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

const RowActionsMenu = ({
  repo,
  onDelete,
  onMigrate,
}: {
  repo: GitRepository;
  onDelete: (name: string) => void;
  onMigrate: (repoName: string) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { hasRole } = useUserRoleContext();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  const handleAction = (_action: string) => {
    handleClose();
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        getContentAnchorEl={null}
      >
        {isDevSpacesConnected && hasRole('developer') && (
          <MenuItem onClick={() => {
            window.open(`${DEVSPACES_BASE_URL}/#${repo.url}/tree/${repo.branch}`, '_blank');
            handleClose();
          }}>
            <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Edit in Dev Spaces" secondary={`Branch: ${repo.branch}`} />
          </MenuItem>
        )}
        <MenuItem onClick={() => handleAction('view-source')}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View source" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onDelete(repo.name); handleClose(); }}>
          <ListItemIcon><DeleteOutlineIcon fontSize="small" style={{ color: statusColors.error }} /></ListItemIcon>
          <ListItemText primary="Remove" primaryTypographyProps={{ style: { color: statusColors.error } }} />
        </MenuItem>
      </Menu>
    </>
  );
};

const STARRED_REPOS_KEY = 'portal-starred-repos';

const loadStarredRepos = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STARRED_REPOS_KEY) || '[]'));
  } catch { return new Set(); }
};

const saveStarredRepos = (names: Set<string>) => {
  localStorage.setItem(STARRED_REPOS_KEY, JSON.stringify([...names]));
};

export const GitRepositoriesContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [repos, setRepos] = useState<GitRepository[]>(() => {
    const stored = loadStarredRepos();
    return GIT_REPOSITORIES.map(r => ({
      ...r,
      starred: stored.has(r.name) ? true : r.starred,
    }));
  });
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ActiveFilters>({ ...DEFAULT_FILTERS });


  const toggleStar = useCallback((name: string) => {
    setRepos(prev => {
      const updated = prev.map(r => (r.name === name ? { ...r, starred: !r.starred } : r));
      const starredNames = new Set(updated.filter(r => r.starred).map(r => r.name));
      saveStarredRepos(starredNames);
      return updated;
    });
  }, []);

  const deleteProject = useCallback((name: string) => {
    setRepos(prev => prev.filter(r => r.name !== name));
  }, []);

  const clearFilter = useCallback((key: keyof ActiveFilters) => {
    setFilters(prev => ({ ...prev, [key]: 'all' }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);


  const [migrateRepoName, setMigrateRepoName] = useState<string | null>(null);
  const [migrateWizardOpen, setMigrateWizardOpen] = useState(false);
  const [scanningRepos] = useState<Set<string>>(() => new Set(['network-firewall-rules']));
  const neverScannedRepos = useMemo(() => new Set(['backup-automation']), []);

  useEffect(() => {
    if (location.pathname.includes('/projects/migrate')) {
      setMigrateWizardOpen(true);
      navigate('/self-service/repositories', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleMigrate = useCallback((repoName: string) => {
    setMigrateRepoName(repoName);
    setMigrateWizardOpen(true);
  }, []);

  const filteredRepos = useMemo(() => {
    let result = repos;
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(lower) || r.org.toLowerCase().includes(lower),
      );
    }
    if (filters.provider !== 'all') {
      result = result.filter(r => r.provider === filters.provider);
    }
    return result;
  }, [repos, searchText, filters]);

  if (repos.length === 0) {
    return (
      <EmptyStateLayout
        title="No projects discovered"
        description="Connect a Git source in the Connections page to discover projects containing Ansible automation content. The portal will scan for playbooks, roles, collections, and execution environments."
        illustration={<RepositoriesIllustration />}
      />
    );
  }

  const columns: TableColumn<GitRepository>[] = [
    {
      title: 'Repository',
      field: 'name',
      width: '48%',
      render: (row: GitRepository) => (
        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
          {row.provider === 'github' ? (
            <GitHubIcon className={classes.providerIcon} />
          ) : (
            <GitLabIcon />
          )}
          <Link
            className={classes.repoLink}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigate(`/self-service/repositories/${row.name}`);
            }}
          >
            {row.org}/{row.name}
          </Link>
        </Box>
      ),
    },
    {
      title: (
        <Box display="flex" alignItems="center" style={{ gap: 4 }}>
          Violations
          <Tooltip title="Policy violations detected by automated quality scans. Fix violations to improve content reliability and compliance." arrow>
            <HelpOutlineIcon style={{ fontSize: 14, color: '#999', cursor: 'help' }} />
          </Tooltip>
        </Box>
      ) as unknown as string,
      width: '20%',
      sorting: false,
      render: (row: GitRepository) => {
        const isScanning = scanningRepos.has(row.name);
        const isNeverScanned = neverScannedRepos.has(row.name);

        if (isScanning) {
          return (
            <Chip size="small" label="Scanning" style={{
              fontSize: 11, height: 20, backgroundColor: `${statusColors.info}15`,
              color: statusColors.info, fontWeight: 500,
            }} />
          );
        }
        if (isNeverScanned) {
          return (
            <Link
              style={{ fontSize: 12, cursor: 'pointer', color: statusColors.info }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              Scan now
            </Link>
          );
        }

        const breakdown = getProjectSeverityBreakdown(row.name);
        if (!breakdown) {
          return (
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
              Not scanned
            </Typography>
          );
        }

        const total = getProjectViolationCount(row.name) ?? 0;
        if (total === 0) {
          return (
            <Typography variant="body2" style={{ fontSize: 12, color: statusColors.success, fontWeight: 500 }}>
              Clean
            </Typography>
          );
        }

        const highest: SeverityClass = breakdown.critical > 0 ? 'critical'
          : breakdown.high > 0 ? 'high'
          : breakdown.medium > 0 ? 'medium'
          : 'low';
        const highestCount = breakdown[highest];
        const color = SEVERITY_COLORS[highest];

        return (
          <Box
            display="flex"
            alignItems="center"
            style={{ gap: 6, cursor: 'pointer' }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigate(`/self-service/repositories/${row.name}`);
            }}
          >
            <Chip size="small" label={`${highestCount} ${highest}`} style={{
              fontSize: 11, height: 20,
              backgroundColor: `${color}18`,
              color,
              fontWeight: 600,
              cursor: 'pointer',
            }} />
            {total > highestCount && (
              <Typography variant="body2" color="textSecondary" style={{ fontSize: 11 }}>
                +{total - highestCount}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      title: (
        <Box display="flex" alignItems="center" style={{ gap: 4 }}>
          Content
          <Tooltip title="Automation content discovered in this repository: playbooks, roles, collection dependencies, and execution environments." arrow>
            <HelpOutlineIcon style={{ fontSize: 14, color: '#999', cursor: 'help' }} />
          </Tooltip>
        </Box>
      ) as unknown as string,
      width: '22%',
      sorting: false,
      render: (row: GitRepository) => <ResourceBadges resources={row.resources} repoName={row.name} />,
    },
    {
      title: '',
      width: '10%',
      sorting: false,
      cellStyle: { textAlign: 'right' as const, paddingRight: 8 },
      headerStyle: { textAlign: 'right' as const, paddingRight: 8 },
      render: (row: GitRepository) => (
        <Box className={classes.actionsCell}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleStar(row.name); }}>
            {row.starred ? (
              <StarIcon style={{ color: statusColors.star }} />
            ) : (
              <StarBorderIcon />
            )}
          </IconButton>
          <RowActionsMenu repo={row} onDelete={deleteProject} onMigrate={handleMigrate} />
        </Box>
      ),
    },
  ];

  const filterLabels: { key: keyof ActiveFilters; label: string; value: string }[] = [];
  if (filters.provider !== 'all') {
    filterLabels.push({ key: 'provider', label: 'Provider', value: filters.provider === 'github' ? 'GitHub' : 'GitLab' });
  }

  return (
    <CatalogFilterLayout>
      <CatalogFilterLayout.Filters>
        <TextField
          placeholder="Search repositories..."
          variant="standard"
          fullWidth
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" />
              </InputAdornment>
            ),
            endAdornment: searchText ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchText('')} aria-label="Clear search">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Typography className={classes.filterLabel}>Provider</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={filters.provider}
              onChange={e => setFilters(prev => ({ ...prev, provider: e.target.value as ProviderFilter }))}
              input={<Input disableUnderline />}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="github">GitHub</MenuItem>
              <MenuItem value="gitlab">GitLab</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </CatalogFilterLayout.Filters>

      <CatalogFilterLayout.Content>

        {hasActiveFilters(filters) && (
          <Box className={classes.activeFiltersRow}>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
              Active filters:
            </Typography>
            {filterLabels.map(f => (
              <Chip
                key={f.key}
                label={`${f.label}: ${f.value}`}
                size="small"
                onDelete={() => clearFilter(f.key)}
                deleteIcon={<CancelIcon style={{ fontSize: 16 }} />}
                className={classes.activeChip}
                color="primary"
                variant="outlined"
              />
            ))}
            <Button size="small" onClick={clearAllFilters} style={{ textTransform: 'none', fontSize: 12 }}>
              Clear all
            </Button>
          </Box>
        )}

        <Table<GitRepository>
          columns={columns}
          data={filteredRepos}
          title=""
          options={{
            paging: true,
            pageSize: 10,
            pageSizeOptions: [5, 10, 20],
            emptyRowsWhenPaging: false,
            search: false,
            sorting: true,
            padding: 'dense',
            rowStyle: { cursor: 'pointer' },
          }}
          style={{ width: '100%', overflowX: 'hidden' }}
          onRowClick={(_event, rowData) => {
            if (rowData) {
              const row = rowData as GitRepository;
              navigate(`/self-service/repositories/${row.name}`);
            }
          }}
        />
      </CatalogFilterLayout.Content>


      <MigrateToAnsibleWizard
        open={migrateWizardOpen}
        sourceRepoName={migrateRepoName}
        onClose={() => { setMigrateWizardOpen(false); setMigrateRepoName(null); }}
        onComplete={(newRepoName) => {
          setMigrateWizardOpen(false);
          setMigrateRepoName(null);
          navigate(`/self-service/repositories/${newRepoName}`, { state: { tab: 'quality' } });
        }}
      />
    </CatalogFilterLayout>
  );
};
