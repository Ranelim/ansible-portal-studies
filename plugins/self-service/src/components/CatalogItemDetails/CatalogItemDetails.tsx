import { useState, useEffect, useCallback } from 'react';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  catalogApiRef,
  EntityProvider,
  UnregisterEntityDialog,
} from '@backstage/plugin-catalog-react';
import { Content, Header, HeaderTabs, Page } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Link,
  makeStyles,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { rootRouteRef, selectedTemplateRouteRef } from '../../routes';

const useStyles = makeStyles(theme => ({
  breadcrumbs: {
    marginBottom: theme.spacing(1),
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      fontSize: 14,
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& .MuiBreadcrumbs-separator': {
      fontSize: 14,
    },
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: theme.palette.text.secondary,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(0.5),
  },
  titleArea: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  typeBadge: {
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'capitalize' as const,
  },
  actionsArea: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  useButton: {
    textTransform: 'none' as const,
    fontWeight: 600,
    borderRadius: 20,
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  },
  mainColumn: {
    minWidth: 0,
  },
  sidebarColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing(2),
  },
  readmeCard: {
    minHeight: 200,
  },
  readmeTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  readmeContent: {
    fontSize: 14,
    lineHeight: 1.7,
    color: theme.palette.text.secondary,
    whiteSpace: 'pre-wrap' as const,
  },
  aboutLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 2,
  },
  aboutValue: {
    fontSize: 14,
    marginBottom: theme.spacing(1.5),
    wordBreak: 'break-word' as const,
  },
  aboutLink: {
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: theme.spacing(0.5),
    marginTop: 4,
  },
  tag: {
    fontSize: 11,
    height: 22,
  },
  yamlContainer: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: '"Red Hat Mono", "JetBrains Mono", "Fira Code", monospace',
    fontSize: 13,
    lineHeight: 1.6,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    overflow: 'auto',
    maxHeight: '70vh',
    whiteSpace: 'pre' as const,
  },
  parameterCard: {
    marginBottom: theme.spacing(1.5),
  },
  parameterTitle: {
    fontSize: 14,
    fontWeight: 600,
  },
  parameterDesc: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0),
  },
  emptyReadme: {
    textAlign: 'center' as const,
    padding: theme.spacing(6),
    color: theme.palette.text.disabled,
  },
}));

const AboutCard = ({ entity }: { entity: Entity }) => {
  const classes = useStyles();
  const spec = entity.spec as Record<string, unknown> | undefined;
  const description = entity.metadata.description;
  const owner = spec?.owner as string | undefined;
  const type = spec?.type as string | undefined;
  const tags = (entity.metadata.tags ?? []) as string[];
  const sourceAnnotation =
    entity.metadata.annotations?.['backstage.io/source-location'] ??
    entity.metadata.annotations?.['backstage.io/managed-by-location'] ??
    '';
  const sourceUrl = sourceAnnotation
    .replace(/^url:/, '')
    .replace(/\/catalog-info\.yaml$/, '');

  return (
    <Card variant="outlined">
      <CardHeader
        title="About"
        titleTypographyProps={{ variant: 'h6', style: { fontSize: 16, fontWeight: 600 } }}
      />
      <Divider />
      <CardContent>
        {description && (
          <>
            <Typography className={classes.aboutLabel}>Description</Typography>
            <Typography className={classes.aboutValue}>{description}</Typography>
          </>
        )}

        {owner && (
          <>
            <Typography className={classes.aboutLabel}>Owner</Typography>
            <Typography className={classes.aboutValue}>
              {owner.replace(/^(user|group):/, '').replace(/^default\//, '')}
            </Typography>
          </>
        )}

        {type && (
          <>
            <Typography className={classes.aboutLabel}>Type</Typography>
            <Typography className={classes.aboutValue} style={{ textTransform: 'capitalize' }}>
              {type}
            </Typography>
          </>
        )}

        {sourceUrl && (
          <>
            <Typography className={classes.aboutLabel}>Source</Typography>
            <Box className={classes.aboutValue}>
              <Link
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.aboutLink}
              >
                View in source
                <OpenInNewIcon style={{ fontSize: 14 }} />
              </Link>
            </Box>
          </>
        )}

        {tags.length > 0 && (
          <>
            <Typography className={classes.aboutLabel}>Tags</Typography>
            <Box className={classes.tags}>
              {tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  className={classes.tag}
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const ResourcesCard = ({ entity }: { entity: Entity }) => {
  const classes = useStyles();
  const links = entity.metadata.links ?? [];

  if (links.length === 0) return null;

  return (
    <Card variant="outlined">
      <CardHeader
        title="Resources"
        titleTypographyProps={{ variant: 'h6', style: { fontSize: 16, fontWeight: 600 } }}
      />
      <Divider />
      <CardContent>
        {links.map((link, idx) => (
          <Box key={idx} className={classes.resourceItem}>
            <OpenInNewIcon style={{ fontSize: 16, color: '#1976d2' }} />
            <Link
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14 }}
            >
              {link.title || link.url}
            </Link>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

const ParametersCard = ({ entity }: { entity: Entity }) => {
  const classes = useStyles();
  const spec = entity.spec as Record<string, unknown> | undefined;
  const parameters = spec?.parameters as Array<Record<string, unknown>> | undefined;

  if (!parameters || parameters.length === 0) return null;

  return (
    <Card variant="outlined">
      <CardHeader
        title="Parameters"
        titleTypographyProps={{ variant: 'h6', style: { fontSize: 16, fontWeight: 600 } }}
      />
      <Divider />
      <CardContent>
        {parameters.map((step, idx) => {
          const stepTitle = (step.title as string) || `Step ${idx + 1}`;
          const stepDesc = step.description as string | undefined;
          const properties = step.properties as Record<string, unknown> | undefined;
          const fieldCount = properties ? Object.keys(properties).length : 0;

          return (
            <Box key={idx} className={classes.parameterCard}>
              <Typography className={classes.parameterTitle}>
                {idx + 1}. {stepTitle}
              </Typography>
              {stepDesc && (
                <Typography className={classes.parameterDesc}>{stepDesc}</Typography>
              )}
              <Typography variant="caption" color="textSecondary">
                {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
              </Typography>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
};

const OverviewTab = ({ entity }: { entity: Entity }) => {
  const classes = useStyles();
  const description = entity.metadata.description ?? '';

  return (
    <Box className={classes.twoColumnLayout}>
      <Box className={classes.mainColumn}>
        <Card variant="outlined" className={classes.readmeCard}>
          <CardContent>
            <Typography className={classes.readmeTitle}>README</Typography>
            <Divider style={{ margin: '12px 0' }} />
            {description ? (
              <Typography className={classes.readmeContent}>
                {description}
                {'\n\n'}
                This template creates a new entity in the Backstage catalog. Use the &quot;Use template&quot; button to start the guided creation wizard.
              </Typography>
            ) : (
              <Box className={classes.emptyReadme}>
                <Typography variant="body2">
                  No README content available for this template.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box className={classes.sidebarColumn}>
        <AboutCard entity={entity} />
        <ParametersCard entity={entity} />
        <ResourcesCard entity={entity} />
      </Box>
    </Box>
  );
};

const YamlTab = ({ entity }: { entity: Entity }) => {
  const classes = useStyles();

  const cleanEntity = { ...entity };
  delete (cleanEntity as Record<string, unknown>).relations;

  const yamlText = JSON.stringify(cleanEntity, null, 2);

  return (
    <Box>
      <Typography variant="body2" color="textSecondary" style={{ marginBottom: 8 }}>
        Template entity definition as registered in the catalog
      </Typography>
      <Box className={classes.yamlContainer}>
        {yamlText}
      </Box>
    </Box>
  );
};

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'definition', label: 'Definition' },
];

export const CatalogItemsDetails = () => {
  const classes = useStyles();
  const { namespace, templateName } = useParams<{
    namespace: string;
    templateName: string;
  }>();
  const catalogApi = useApi(catalogApiRef);
  const rootRoute = useRouteRef(rootRouteRef);
  const templateRouteRef = useRouteRef(selectedTemplateRouteRef);
  const navigate = useNavigate();

  const [entity, setEntity] = useState<Entity | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [selectedTab, setSelectedTab] = useState(0);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const fetchEntity = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await catalogApi.getEntityByRef(
        `template:${namespace}/${templateName}`,
      );
      setEntity(response);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [namespace, templateName, catalogApi]);

  useEffect(() => {
    fetchEntity();
  }, [fetchEntity]);

  const cleanUpAfterRemoval = async () => {
    setConfirmationDialogOpen(false);
    navigate(rootRoute());
  };

  const handleUseTemplate = () => {
    if (namespace && templateName) {
      navigate(templateRouteRef({ namespace, templateName }));
    }
  };

  if (loading) {
    return (
      <Page themeId="app">
        <Header title="Loading..." />
        <Content>
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        </Content>
      </Page>
    );
  }

  if (error || !entity) {
    return (
      <Page themeId="app">
        <Header title="Template not found" />
        <Content>
          <Box textAlign="center" py={6}>
            <Typography variant="h5" gutterBottom>
              Template not found
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              {error?.message || `The template "${namespace}/${templateName}" could not be loaded.`}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/create')}
              style={{ marginTop: 16, textTransform: 'none' }}
            >
              Back to Software Templates
            </Button>
          </Box>
        </Content>
      </Page>
    );
  }

  const displayTitle = entity.metadata.title || entity.metadata.name;
  const specType = (entity.spec as Record<string, unknown>)?.type as string | undefined;
  const sourceAnnotation =
    entity.metadata.annotations?.['backstage.io/source-location'] ??
    entity.metadata.annotations?.['backstage.io/managed-by-location'] ??
    '';
  const sourceUrl = sourceAnnotation
    .replace(/^url:/, '')
    .replace(/\/catalog-info\.yaml$/, '');

  return (
    <EntityProvider entity={entity}>
      <Page themeId="app">
        <Content>
          {/* Breadcrumbs */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            className={classes.breadcrumbs}
          >
            <RouterLink to="/create">Software Templates</RouterLink>
            <Typography className={classes.breadcrumbCurrent}>
              {displayTitle}
            </Typography>
          </Breadcrumbs>

          {/* Title row */}
          <Box className={classes.headerRow}>
            <Box className={classes.titleArea}>
              <Typography className={classes.title}>{displayTitle}</Typography>
              {specType && (
                <Chip
                  label={specType}
                  size="small"
                  variant="outlined"
                  className={classes.typeBadge}
                />
              )}
            </Box>
            <Box className={classes.actionsArea}>
              <Button
                variant="contained"
                color="primary"
                className={classes.useButton}
                onClick={handleUseTemplate}
              >
                Use template
              </Button>
              <IconButton size="small" onClick={e => setMenuAnchor(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Tabs */}
          <HeaderTabs
            selectedIndex={selectedTab}
            onChange={setSelectedTab}
            tabs={tabs}
          />

          <Box mt={3}>
            {selectedTab === 0 ? (
              <OverviewTab entity={entity} />
            ) : (
              <YamlTab entity={entity} />
            )}
          </Box>

          {/* Kebab menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            getContentAnchorEl={null}
          >
            {sourceUrl && (
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  window.open(sourceUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <ListItemText primary="View in source" />
              </MenuItem>
            )}
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setConfirmationDialogOpen(true);
              }}
            >
              <ListItemText
                primary="Unregister"
                primaryTypographyProps={{ style: { color: '#f44336' } }}
              />
            </MenuItem>
          </Menu>

          {/* Unregister dialog */}
          <UnregisterEntityDialog
            open={confirmationDialogOpen}
            entity={entity}
            onConfirm={cleanUpAfterRemoval}
            onClose={() => setConfirmationDialogOpen(false)}
          />
        </Content>
      </Page>
    </EntityProvider>
  );
};
