import { useState, useMemo, useCallback } from 'react';
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
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import AddIcon from '@material-ui/icons/Add';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CodeIcon from '@material-ui/icons/Code';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import CancelIcon from '@material-ui/icons/Cancel';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import { PipelineStatusIcons, PipelineColumnHeader } from './PipelineStatus';
import {
  AapStatusIcons,
  LastJobRunCell,
  AapColumnHeader,
  LastJobRunColumnHeader,
} from './AapStatus';
import { DEMO_PROJECTS, DemoProject } from './projectsDemoData';

type PipelineFilter = 'all' | 'passed' | 'failed' | 'running';
type AapFilter = 'all' | 'pushed' | 'not-pushed';
type JobRunFilter = 'all' | 'success' | 'failed' | 'running';

type ActiveFilters = {
  pipeline: PipelineFilter;
  aap: AapFilter;
  jobRun: JobRunFilter;
};

const DEFAULT_FILTERS: ActiveFilters = {
  pipeline: 'all',
  aap: 'all',
  jobRun: 'all',
};

const hasActiveFilters = (filters: ActiveFilters) =>
  filters.pipeline !== 'all' || filters.aap !== 'all' || filters.jobRun !== 'all';

const useStyles = makeStyles(theme => ({
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  emptyIcon: {
    fontSize: '4rem',
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(3),
  },
  emptyTitle: {
    fontWeight: 300,
    fontSize: '2rem',
    marginBottom: theme.spacing(2),
  },
  emptyDescription: {
    color: theme.palette.text.secondary,
    fontSize: 16,
    lineHeight: 1.6,
    marginBottom: theme.spacing(3),
    maxWidth: 500,
  },
  createButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
  filterLabel: {
    marginTop: theme.spacing(2),
    fontWeight: 600,
    fontSize: '0.875rem',
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
  projectLink: {
    cursor: 'pointer',
    fontWeight: 500,
    color: theme.palette.primary.main,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
}));

const ProjectsEmptyState = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => {
  const classes = useStyles();
  return (
    <Box className={classes.emptyContainer}>
      <FolderOpenIcon className={classes.emptyIcon} />
      <Typography variant="h4" className={classes.emptyTitle}>
        No projects yet
      </Typography>
      <Typography className={classes.emptyDescription}>
        Create your first automation project from a template. Projects connect
        your Git repository to AAP and provide governed CI/CD pipelines for your
        Ansible content.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => onTabSwitch(1)}
        className={classes.createButton}
        startIcon={<AddIcon />}
      >
        Create Project
      </Button>
    </Box>
  );
};

const RowActionsMenu = ({
  project,
  onDelete,
}: {
  project: DemoProject;
  onDelete: (name: string) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isPushed = project.aap.project === 'pushed' && project.aap.jobTemplate === 'pushed';

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleAction = (action: string) => {
    // eslint-disable-next-line no-console
    console.log(`${action}: ${project.name}`);
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
        <MenuItem onClick={() => handleAction('edit-workspace')}>
          <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit in Workspace" />
        </MenuItem>
        <MenuItem onClick={() => handleAction('view-source')}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="View Source" />
        </MenuItem>
        <Divider />
        {isPushed ? (
          <MenuItem onClick={() => handleAction('view-in-aap')}>
            <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="View in AAP" />
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleAction('push-to-aap')}>
            <ListItemIcon><CloudUploadIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Push to AAP" />
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { onDelete(project.name); handleClose(); }}>
          <ListItemIcon><DeleteOutlineIcon fontSize="small" style={{ color: '#f44336' }} /></ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ style: { color: '#f44336' } }} />
        </MenuItem>
      </Menu>
    </>
  );
};

const ProjectsCatalogTable = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => {
  const classes = useStyles();
  const [projects, setProjects] = useState<DemoProject[]>(DEMO_PROJECTS);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ActiveFilters>({ ...DEFAULT_FILTERS });

  const toggleStar = useCallback((name: string) => {
    setProjects(prev =>
      prev.map(p => (p.name === name ? { ...p, starred: !p.starred } : p)),
    );
  }, []);

  const deleteProject = useCallback((name: string) => {
    setProjects(prev => prev.filter(p => p.name !== name));
  }, []);

  const clearFilter = useCallback((key: keyof ActiveFilters) => {
    setFilters(prev => ({ ...prev, [key]: 'all' }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower));
    }

    if (filters.pipeline !== 'all') {
      result = result.filter(p => {
        if (filters.pipeline === 'passed')
          return p.pipeline.every(s => s.status === 'passed');
        if (filters.pipeline === 'failed')
          return p.pipeline.some(s => s.status === 'failed');
        if (filters.pipeline === 'running')
          return p.pipeline.some(s => s.status === 'running');
        return true;
      });
    }

    if (filters.aap !== 'all') {
      result = result.filter(p => {
        if (filters.aap === 'pushed')
          return p.aap.project === 'pushed' && p.aap.jobTemplate === 'pushed';
        if (filters.aap === 'not-pushed')
          return p.aap.project === 'not-pushed' || p.aap.jobTemplate === 'not-pushed';
        return true;
      });
    }

    if (filters.jobRun !== 'all') {
      result = result.filter(p => p.lastJobRun.status === filters.jobRun);
    }

    return result;
  }, [projects, searchText, filters]);

  const columns: TableColumn<DemoProject>[] = [
    {
      title: 'Name',
      field: 'name',
      render: (row: DemoProject) => (
        <Typography variant="body2" className={classes.projectLink}>
          {row.title}
        </Typography>
      ),
    },
    {
      title: (<PipelineColumnHeader />) as unknown as string,
      sorting: false,
      render: (row: DemoProject) => (
        <PipelineStatusIcons
          stages={row.pipeline}
          pipelineType={row.pipelineType}
        />
      ),
    },
    {
      title: (<AapColumnHeader />) as unknown as string,
      sorting: false,
      render: (row: DemoProject) => <AapStatusIcons aap={row.aap} />,
    },
    {
      title: (<LastJobRunColumnHeader />) as unknown as string,
      sorting: false,
      render: (row: DemoProject) => <LastJobRunCell jobRun={row.lastJobRun} />,
    },
    {
      title: '',
      width: '80px',
      sorting: false,
      render: (row: DemoProject) => (
        <Box className={classes.actionsCell}>
          <IconButton size="small" onClick={() => toggleStar(row.name)}>
            {row.starred ? (
              <StarIcon style={{ color: '#faaf00' }} />
            ) : (
              <StarBorderIcon />
            )}
          </IconButton>
          <RowActionsMenu project={row} onDelete={deleteProject} />
        </Box>
      ),
    },
  ];

  if (projects.length === 0) {
    return <ProjectsEmptyState onTabSwitch={onTabSwitch} />;
  }

  const filterLabels: { key: keyof ActiveFilters; label: string; value: string }[] = [];
  if (filters.pipeline !== 'all') {
    filterLabels.push({
      key: 'pipeline',
      label: 'Pipeline',
      value: filters.pipeline.charAt(0).toUpperCase() + filters.pipeline.slice(1),
    });
  }
  if (filters.aap !== 'all') {
    filterLabels.push({
      key: 'aap',
      label: 'AAP',
      value: filters.aap === 'pushed' ? 'Pushed' : 'Not pushed',
    });
  }
  if (filters.jobRun !== 'all') {
    filterLabels.push({
      key: 'jobRun',
      label: 'Last Job Run',
      value: filters.jobRun.charAt(0).toUpperCase() + filters.jobRun.slice(1),
    });
  }

  return (
    <CatalogFilterLayout>
      <CatalogFilterLayout.Filters>
        <TextField
          placeholder="Search projects..."
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

        <Typography className={classes.filterLabel}>Pipeline Status</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={filters.pipeline}
              onChange={e => setFilters(prev => ({ ...prev, pipeline: e.target.value as PipelineFilter }))}
              input={<Input disableUnderline />}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="passed">Passed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="running">Running</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Typography className={classes.filterLabel}>AAP Status</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={filters.aap}
              onChange={e => setFilters(prev => ({ ...prev, aap: e.target.value as AapFilter }))}
              input={<Input disableUnderline />}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pushed">Pushed</MenuItem>
              <MenuItem value="not-pushed">Not pushed</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Typography className={classes.filterLabel}>Last Job Run</Typography>
        <Paper className={classes.filterPaper}>
          <FormControl fullWidth>
            <Select
              value={filters.jobRun}
              onChange={e => setFilters(prev => ({ ...prev, jobRun: e.target.value as JobRunFilter }))}
              input={<Input disableUnderline />}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="running">Running</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </CatalogFilterLayout.Filters>

      <CatalogFilterLayout.Content>
        <Box className={classes.contentHeader}>
          <Typography variant="h6" style={{ fontWeight: 600 }}>
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => onTabSwitch(1)}
            className={classes.createButton}
          >
            Create Project
          </Button>
        </Box>

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
            <Button
              size="small"
              onClick={clearAllFilters}
              style={{ textTransform: 'none', fontSize: 12 }}
            >
              Clear all
            </Button>
          </Box>
        )}

        <Table<DemoProject>
          columns={columns}
          data={filteredProjects}
          title=""
          options={{
            paging: true,
            pageSize: 10,
            pageSizeOptions: [5, 10, 20],
            emptyRowsWhenPaging: false,
            search: false,
            sorting: true,
            padding: 'dense',
          }}
          style={{ width: '100%', overflowX: 'hidden' }}
        />
      </CatalogFilterLayout.Content>
    </CatalogFilterLayout>
  );
};

export const ProjectsCatalogContent = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => {
  return <ProjectsCatalogTable onTabSwitch={onTabSwitch} />;
};
