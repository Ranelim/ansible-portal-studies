import { useState, useMemo, useCallback } from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import {
  Box,
  Button,
  Typography,
  makeStyles,
  IconButton,
  InputBase,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import AddIcon from '@material-ui/icons/Add';
import { PipelineStatusIcons, PipelineColumnHeader } from './PipelineStatus';
import {
  AapStatusIcons,
  LastJobRunCell,
  AapColumnHeader,
  LastJobRunColumnHeader,
} from './AapStatus';
import { DEMO_PROJECTS, DemoProject } from './projectsDemoData';

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
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    textTransform: 'none',
    fontWeight: 600,
    padding: '10px 24px',
    borderRadius: 20,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: '2px 8px',
    minWidth: 260,
    backgroundColor: theme.palette.background.paper,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
  filterChip: {
    borderRadius: 16,
    textTransform: 'none',
  },
  filterSelect: {
    minWidth: 160,
    '& .MuiSelect-select': {
      padding: '8px 12px',
    },
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
      <Typography variant="h4" className={classes.emptyTitle}>
        No projects yet
      </Typography>
      <Typography className={classes.emptyDescription}>
        Create your first automation project from a software template. Projects
        connect your Git repository to AAP and provide governed CI/CD pipelines
        for your Ansible content.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={() => onTabSwitch(1)}
        className={classes.createButton}
      >
        Create Project
      </Button>
    </Box>
  );
};

type PipelineFilter = 'all' | 'passed' | 'failed' | 'running';

const ProjectsCatalogTable = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => {
  const classes = useStyles();
  const [projects, setProjects] = useState<DemoProject[]>(DEMO_PROJECTS);
  const [searchText, setSearchText] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>('all');
  const [aapFilter, setAapFilter] = useState<string[]>([]);

  const toggleStar = useCallback((name: string) => {
    setProjects(prev =>
      prev.map(p => (p.name === name ? { ...p, starred: !p.starred } : p)),
    );
  }, []);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower));
    }

    if (pipelineFilter !== 'all') {
      result = result.filter(p => {
        if (pipelineFilter === 'passed')
          return p.pipeline.every(s => s.status === 'passed');
        if (pipelineFilter === 'failed')
          return p.pipeline.some(s => s.status === 'failed');
        if (pipelineFilter === 'running')
          return p.pipeline.some(s => s.status === 'running');
        return true;
      });
    }

    if (aapFilter.length > 0) {
      result = result.filter(p => {
        if (aapFilter.includes('synced'))
          return (
            p.aap.project === 'synced' && p.aap.jobTemplate === 'synced'
          );
        if (aapFilter.includes('pending'))
          return (
            p.aap.project === 'pending' || p.aap.jobTemplate === 'pending'
          );
        return true;
      });
    }

    return result;
  }, [projects, searchText, pipelineFilter, aapFilter]);

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
      width: '100px',
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
          <IconButton size="small">
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (projects.length === 0) {
    return <ProjectsEmptyState onTabSwitch={onTabSwitch} />;
  }

  return (
    <Box>
      <Box className={classes.toolbarRow}>
        <Box className={classes.searchBox}>
          <SearchIcon style={{ color: '#999', marginRight: 4 }} />
          <InputBase
            placeholder="Search projects..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            fullWidth
          />
        </Box>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => onTabSwitch(1)}
            style={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Create Project
          </Button>
        </Box>
      </Box>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['all', 'passed', 'failed', 'running'] as PipelineFilter[]).map(
            f => (
              <Chip
                key={f}
                label={f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                onClick={() => setPipelineFilter(f)}
                variant={pipelineFilter === f ? 'default' : 'outlined'}
                color={pipelineFilter === f ? 'primary' : 'default'}
                className={classes.filterChip}
                size="small"
              />
            ),
          )}
          <FormControl variant="outlined" size="small" className={classes.filterSelect}>
            <InputLabel>AAP Status</InputLabel>
            <Select
              multiple
              value={aapFilter}
              onChange={e => setAapFilter(e.target.value as string[])}
              label="AAP Status"
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              {['synced', 'pending'].map(opt => (
                <MenuItem key={opt} value={opt}>
                  <Checkbox checked={aapFilter.includes(opt)} size="small" />
                  <ListItemText primary={opt.charAt(0).toUpperCase() + opt.slice(1)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
      </Box>
      <Table<DemoProject>
        columns={columns}
        data={filteredProjects}
        title={`Projects (${filteredProjects.length})`}
        options={{
          paging: true,
          pageSize: 20,
          search: false,
          sorting: true,
          padding: 'dense',
        }}
      />
    </Box>
  );
};

export const ProjectsCatalogContent = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => {
  return <ProjectsCatalogTable onTabSwitch={onTabSwitch} />;
};
