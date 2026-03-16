import { useEffect, useMemo } from 'react';
import { Typography, Box, makeStyles } from '@material-ui/core';
import {
  CatalogFilterLayout,
  EntityKindPicker,
  EntityListProvider,
  EntitySearchBar,
  EntityTagFilter,
  EntityTypeFilter,
  UserListPicker,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import { TemplateGroups } from '@backstage/plugin-scaffolder-react/alpha';
import { WizardCard } from '../../Home/TemplateCard';
import { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
import { TagFilterPicker } from '../../utils/TagFilterPicker';

const useStyles = makeStyles(theme => ({
  description: {
    color: theme.palette.text.secondary,
    fontSize: 16,
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  layoutContainer: {
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
}));

const ProjectTypeFilter = () => {
  const { filters, updateFilters } = useEntityList();

  useEffect(() => {
    if (!filters.type) {
      updateFilters({
        ...filters,
        type: new EntityTypeFilter(['project']),
      });
    }
  }, [filters, updateFilters]);

  return null;
};

const ProjectTagPicker = () => {
  const { backendEntities, filters, updateFilters } = useEntityList();
  const selectedTags = (filters.tags as EntityTagFilter)?.values ?? [];

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const entity of backendEntities) {
      const templateEntity = entity as TemplateEntityV1beta3;
      if (templateEntity.spec?.type?.includes('project')) {
        for (const tag of entity.metadata?.tags || []) {
          tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [backendEntities]);

  const handleTagChange = (newValue: string[]) => {
    updateFilters({
      ...filters,
      tags: newValue.length > 0 ? new EntityTagFilter(newValue) : undefined,
    });
  };

  if (availableTags.length === 0) return null;

  return (
    <TagFilterPicker
      label="Tags"
      options={availableTags}
      value={selectedTags}
      onChange={handleTagChange}
    />
  );
};

export const ProjectsCreateContent = () => {
  const classes = useStyles();

  return (
    <div>
      <Typography variant="body1" className={classes.description}>
        Create a new automation project from a software template. Each template
        scaffolds a Git repository with the right structure, CI/CD pipeline, and
        AAP integration for your use case.
      </Typography>
      <EntityListProvider>
        <ProjectTypeFilter />
        <Box className={classes.layoutContainer}>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntitySearchBar />
              <EntityKindPicker initialFilter="template" hidden />
              <UserListPicker
                initialFilter="all"
                availableFilters={['all', 'starred']}
              />
              <ProjectTagPicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <TemplateGroups
                groups={[
                  {
                    filter: (entity: TemplateEntityV1beta3) =>
                      entity.spec?.type?.includes('project') ?? false,
                  },
                ]}
                TemplateCardComponent={WizardCard}
              />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </Box>
      </EntityListProvider>
    </div>
  );
};
