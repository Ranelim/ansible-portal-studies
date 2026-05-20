import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Input,
  Paper,
  Link,
  makeStyles,
  Tooltip,
} from '@material-ui/core';
import { Table, TableColumn } from '@backstage/core-components';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import GitHubIcon from '@material-ui/icons/GitHub';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import CategoryIcon from '@material-ui/icons/Category';
import MemoryIcon from '@material-ui/icons/Memory';
import CancelIcon from '@material-ui/icons/Cancel';
import { DismissibleBanner } from '../../common/DismissibleBanner';
import { PageHelpIcon } from '../../common/PageHelpIcon';
import {
  EmptyStateLayout,
  RepositoriesIllustration,
} from '../../common/EmptyStateLayout';
import { LastSyncedIndicator } from '../../Admin/LastSyncedIndicator';
import {
  DISCOVERED_REPOS,
  DiscoveredRepo,
  DiscoveredResource,
} from './repositoriesDemoData';

type ProviderFilter = 'all' | 'github' | 'gitlab';

const useStyles = makeStyles(theme => ({
  filterLabel: {
    marginTop: theme.spacing(2),
    fontWeight: 600,
    fontSize: '0.875rem',
    '&:first-child': {
      marginTop: 0,
    },
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
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  resourceBadges: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
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
  providerIcon: {
    fontSize: 16,
    verticalAlign: 'middle',
    marginRight: 4,
  },
  commitInfo: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
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

const ResourceBadges = ({
  resources,
}: {
  resources: DiscoveredResource[];
}) => {
  const classes = useStyles();

  const iconMap: Record<string, React.ReactNode> = {
    playbook: <InsertDriveFileOutlinedIcon className={classes.resourceIcon} />,
    role: <FolderOutlinedIcon className={classes.resourceIcon} />,
    'collection-dep': <CategoryIcon className={classes.resourceIcon} />,
    'execution-environment': <MemoryIcon className={classes.resourceIcon} />,
  };

  const labelMap: Record<string, string> = {
    playbook: 'playbook',
    role: 'role',
    'collection-dep': 'collection',
    'execution-environment': 'EE',
  };

  return (
    <Box className={classes.resourceBadges}>
      {resources.map(r => (
        <Tooltip
          key={r.type}
          title={`${r.count} ${labelMap[r.type]}${r.count > 1 ? 's' : ''}`}
          arrow
        >
          <Box className={classes.resourceBadge}>
            {iconMap[r.type]}
            <span>
              {r.count} {labelMap[r.type]}
              {r.count > 1 ? 's' : ''}
            </span>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
};

const RepositoriesEmptyState = () => (
  <EmptyStateLayout
    title="No repositories discovered"
    description="Connect a Git source in the Connections page to discover repositories containing Ansible automation content. The portal will scan for playbooks, roles, collections, and execution environments."
    illustration={<RepositoriesIllustration />}
  />
);

export const RepositoriesContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const repos = DISCOVERED_REPOS;
  const [searchText, setSearchText] = useState('');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');

  const filteredRepos = useMemo(() => {
    let result = [...repos];

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        r =>
          r.name.toLowerCase().includes(lower) ||
          r.org.toLowerCase().includes(lower),
      );
    }

    if (providerFilter !== 'all') {
      result = result.filter(r => r.provider === providerFilter);
    }

    return result;
  }, [repos, searchText, providerFilter]);

  if (repos.length === 0) {
    return <RepositoriesEmptyState />;
  }

  const hasActiveFilters = providerFilter !== 'all';

  const columns: TableColumn<DiscoveredRepo>[] = [
    {
      title: 'Repository',
      field: 'name',
      render: (row: DiscoveredRepo) => (
        <Box>
          <Box display="flex" alignItems="center" style={{ gap: 4 }}>
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
          <Typography className={classes.commitInfo} style={{ marginTop: 2 }}>
            Last commit:{' '}
            <code style={{ fontSize: 11 }}>
              {row.lastCommitHash.substring(0, 7)}
            </code>{' '}
            {row.lastCommitMessage}
          </Typography>
        </Box>
      ),
    },
    {
      title: 'Discovered content',
      sorting: false,
      render: (row: DiscoveredRepo) => (
        <ResourceBadges resources={row.resources} />
      ),
    },
    {
      title: 'Branch',
      field: 'branch',
      render: (row: DiscoveredRepo) => (
        <Chip
          size="small"
          label={row.branch}
          variant="outlined"
          style={{ fontSize: 11, height: 22, fontFamily: 'monospace' }}
        />
      ),
    },
    {
      title: 'Discovered',
      field: 'discoveredAt',
      render: (row: DiscoveredRepo) => (
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 13 }}>
          {row.discoveredAt}
        </Typography>
      ),
    },
  ];

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
                <IconButton
                  size="small"
                  onClick={() => setSearchText('')}
                  aria-label="Clear search"
                >
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
              value={providerFilter}
              onChange={e =>
                setProviderFilter(e.target.value as ProviderFilter)
              }
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
        <DismissibleBanner
          storageKey="projects-repositories"
          message="Repositories are Git repos discovered from your connected sources that contain Ansible automation content. Quality scans run automatically to check for best practices and compliance."
        />

        <Box className={classes.contentHeader}>
          <Box>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" style={{ fontWeight: 600 }}>
                {filteredRepos.length}{' '}
                {filteredRepos.length === 1
                  ? 'repository'
                  : 'repositories'}{' '}
                discovered
              </Typography>
              <PageHelpIcon
                variant="inline"
                tooltipLabel="What are repositories?"
                title="What are Repositories?"
                description="Repositories are Git repos discovered from your connected sources (GitHub, GitLab) that contain Ansible automation content such as playbooks, roles, collections, or execution environments. Quality scans validate content against best practices and compliance rules."
              />
            </Box>
            <LastSyncedIndicator
              source="GitHub and GitLab"
              timeAgo="12 minutes ago"
            />
          </Box>
        </Box>

        {hasActiveFilters && (
          <Box className={classes.activeFiltersRow}>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ fontSize: 12 }}
            >
              Active filters:
            </Typography>
            {providerFilter !== 'all' && (
              <Chip
                label={`Provider: ${providerFilter === 'github' ? 'GitHub' : 'GitLab'}`}
                size="small"
                onDelete={() => setProviderFilter('all')}
                deleteIcon={<CancelIcon style={{ fontSize: 16 }} />}
                className={classes.activeChip}
                color="primary"
                variant="outlined"
              />
            )}
            <Button
              size="small"
              onClick={() => {
                setProviderFilter('all');
              }}
              style={{ textTransform: 'none', fontSize: 12 }}
            >
              Clear all
            </Button>
          </Box>
        )}

        <Table<DiscoveredRepo>
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
              const row = rowData as DiscoveredRepo;
              navigate(`/self-service/repositories/${row.name}`);
            }
          }}
        />
      </CatalogFilterLayout.Content>
    </CatalogFilterLayout>
  );
};
