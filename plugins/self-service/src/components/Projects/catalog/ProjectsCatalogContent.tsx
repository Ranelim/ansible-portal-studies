import { useState, useEffect } from 'react';
import { Progress, Table, TableColumn } from '@backstage/core-components';
import {
  CatalogFilterLayout,
  EntityListProvider,
  UserListPicker,
  catalogApiRef,
  useStarredEntities,
} from '@backstage/plugin-catalog-react';
import {
  Box,
  Button,
  Chip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { useNavigate } from 'react-router-dom';
import StarBorder from '@material-ui/icons/StarBorder';
import { TagFilterPicker } from '../../utils/TagFilterPicker';

const useStyles = makeStyles(theme => ({
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
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

const ProjectsTagPicker = ({
  entities,
  selectedTags,
  onTagChange,
}: {
  entities: Entity[];
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
}) => {
  const availableTags = Array.from(
    new Set(entities.flatMap(e => e.metadata?.tags || [])),
  ).sort();

  if (availableTags.length === 0) return null;

  return (
    <TagFilterPicker
      label="Tags"
      options={availableTags}
      value={selectedTags}
      onChange={onTagChange}
    />
  );
};

const ProjectsTable = ({
  entities,
  loading,
}: {
  entities: Entity[];
  loading: boolean;
}) => {
  const navigate = useNavigate();
  const { isStarredEntity, toggleStarredEntity } = useStarredEntities();

  const columns: TableColumn<Entity>[] = [
    {
      title: 'Name',
      field: 'metadata.name',
      render: (entity: Entity) => (
        <Typography
          variant="body2"
          style={{ cursor: 'pointer', fontWeight: 500 }}
          onClick={() =>
            navigate(
              `/catalog/default/component/${entity.metadata.name}`,
            )
          }
        >
          {entity.metadata.title || entity.metadata.name}
        </Typography>
      ),
    },
    {
      title: 'Description',
      field: 'metadata.description',
      render: (entity: Entity) => (
        <Typography variant="body2" color="textSecondary">
          {entity.metadata.description || '—'}
        </Typography>
      ),
    },
    {
      title: 'Owner',
      field: 'spec.owner',
      render: (entity: Entity) => (
        <Typography variant="body2">
          {(entity.spec as Record<string, string>)?.owner || '—'}
        </Typography>
      ),
    },
    {
      title: 'Tags',
      render: (entity: Entity) => (
        <Box display="flex" flexWrap="wrap" style={{ gap: 4 }}>
          {(entity.metadata.tags || []).map(tag => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      ),
    },
    {
      title: 'Starred',
      width: '60px',
      render: (entity: Entity) => {
        const starred = isStarredEntity(entity);
        return (
          <Box
            style={{ cursor: 'pointer' }}
            onClick={() => toggleStarredEntity(entity)}
          >
            {starred ? (
              <StarBorder style={{ color: '#faaf00' }} />
            ) : (
              <StarBorder />
            )}
          </Box>
        );
      },
    },
  ];

  if (loading) return <Progress />;

  return (
    <Table
      columns={columns}
      data={entities}
      title="Projects"
      options={{
        paging: true,
        pageSize: 20,
        search: true,
        sorting: true,
      }}
    />
  );
};

const ProjectsListPage = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => {
  const catalogApi = useApi(catalogApiRef);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .getEntities({
        filter: [{ kind: 'Component', 'spec.type': 'service' }],
      })
      .then(response => {
        if (cancelled) return;
        const projectEntities = response.items.filter(
          e =>
            e.metadata.tags?.includes('ansible') &&
            !(e.spec as Record<string, string>)?.type?.includes(
              'execution-environment',
            ),
        );
        setEntities(projectEntities);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogApi]);

  const filteredEntities =
    selectedTags.length > 0
      ? entities.filter(e =>
          selectedTags.some(tag => e.metadata.tags?.includes(tag)),
        )
      : entities;

  if (!loading && entities.length === 0) {
    return <ProjectsEmptyState onTabSwitch={onTabSwitch} />;
  }

  return (
    <CatalogFilterLayout>
      <CatalogFilterLayout.Filters>
        <UserListPicker
          initialFilter="all"
          availableFilters={['all', 'starred']}
        />
        <ProjectsTagPicker
          entities={entities}
          selectedTags={selectedTags}
          onTagChange={setSelectedTags}
        />
      </CatalogFilterLayout.Filters>
      <CatalogFilterLayout.Content>
        <ProjectsTable entities={filteredEntities} loading={loading} />
      </CatalogFilterLayout.Content>
    </CatalogFilterLayout>
  );
};

export const ProjectsCatalogContent = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => {
  return (
    <EntityListProvider>
      <ProjectsListPage onTabSwitch={onTabSwitch} />
    </EntityListProvider>
  );
};
