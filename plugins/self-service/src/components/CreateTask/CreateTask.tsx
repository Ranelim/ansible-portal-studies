import { useEffect, useState, useMemo } from 'react';
import {
  Content,
  MarkdownContent,
} from '@backstage/core-components';
import { StepForm } from './StepForm';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  TemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  makeStyles,
  useTheme,
} from '@material-ui/core';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { rootRouteRef } from '../../routes';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  backButton: {
    textTransform: 'none',
    fontWeight: 500,
    marginBottom: theme.spacing(2),
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
  description: {
    color: theme.palette.text.secondary,
    maxWidth: '75ch',
    lineHeight: 1.57,
    marginBottom: theme.spacing(3),
  },
}));

const ApprovalDisclaimer = () => {
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  return (
    <Box
      display="flex"
      alignItems="flex-start"
      style={{
        gap: 10,
        padding: '12px 16px',
        marginBottom: 16,
        borderRadius: 4,
        backgroundColor: isDark ? 'rgba(41, 121, 255, 0.08)' : 'rgba(41, 121, 255, 0.06)',
        border: `1px solid ${isDark ? 'rgba(41, 121, 255, 0.25)' : 'rgba(41, 121, 255, 0.2)'}`,
      }}
    >
      <InfoOutlinedIcon style={{ fontSize: 18, color: '#2979ff', marginTop: 2, flexShrink: 0 }} />
      <Typography variant="body2" style={{ color: isDark ? '#e0e0e0' : 'rgba(0,0,0,0.7)', lineHeight: 1.5 }}>
        This workflow requires approval at one or more steps. Completion time depends on when approvals are granted.
      </Typography>
    </Box>
  );
};

export const CreateTask = () => {
  const classes = useStyles();
  const { namespace, templateName } = useParams<{
    namespace: string;
    templateName: string;
  }>();
  const scaffolderApi = useApi(scaffolderApiRef);
  const catalogApi = useApi(catalogApiRef);
  const rootLink = useRouteRef(rootRouteRef);
  const location = useLocation();

  const [entityTemplate, setEntityTemplate] =
    useState<TemplateParameterSchema | null>(null);
  const [templateEntity, setTemplateEntity] = useState<{
    spec?: { type?: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const initialFormData = useMemo(() => {
    const state = location.state as {
      initialFormData?: Record<string, any>;
    } | null;
    return state?.initialFormData;
  }, [location.state]);

  const demoTaskRoutes: Record<string, string> = {
    'workflow-trigger-demo': 'demo-aws-workflow-approved',
    'aws-provisioning-workflow': 'demo-aws-workflow-approved',
    'deploy-database-update': 'demo-job-completing',
    'rhel-server-patching': 'demo-patching-completed',
  };

  const finalSubmit = async (
    formData: Record<string, any>,
    secrets?: Record<string, string>,
  ) => {
    if (!namespace || !templateName) {
      throw new Error('Missing namespace or name in URL parameters');
    }

    const demoTaskId = demoTaskRoutes[templateName];
    if (demoTaskId) {
      navigate(`${rootLink()}/create/tasks/${demoTaskId}`);
      return;
    }

    try {
      const task = await scaffolderApi.scaffold({
        templateRef: `template:${namespace}/${templateName}`,
        values: formData,
        secrets,
      });

      // Redirect to the task details page
      navigate(`${rootLink()}/create/tasks/${task.taskId}`);
    } catch (err) {
      console.error('Error during final submit:', err); // eslint-disable-line no-console
    }
  };

  useEffect(() => {
    const fetchEntity = async () => {
      setLoading(true);
      try {
        if (!templateName || !namespace) {
          throw new Error('Missing name or namespace in URL parameters');
        }
        const response =
          await scaffolderApi.getTemplateParameterSchema(templateName);
        setEntityTemplate(response as TemplateParameterSchema);

        try {
          const entityRef = `template:${namespace}/${templateName}`;
          const entity = await catalogApi.getEntityByRef(entityRef);
          if (entity) {
            setTemplateEntity(entity);
          }
        } catch {
          // Get back to home page if we can't fetch the entity
          // fail silently
        }
      } catch (err) {
        setError('Failed to fetch entity');
      } finally {
        setLoading(false);
      }
    };

    fetchEntity();
  }, [templateName, namespace, scaffolderApi, catalogApi]);

  if (loading) {
    return (
      <Content>
        <Box className={classes.root}>
          <Typography variant="body1">Loading entity...</Typography>
        </Box>
      </Content>
    );
  }

  if (error) {
    return (
      <Content>
        <Box className={classes.root}>
          <Typography variant="body1">{error}</Typography>
        </Box>
      </Content>
    );
  }

  if (!entityTemplate) {
    return (
      <Content>
        <Box className={classes.root}>
          <Typography variant="body1">No entity data available.</Typography>
        </Box>
      </Content>
    );
  }

  const [description, templateInfo] = entityTemplate.description
    ? entityTemplate.description.split('(Template Info)')
    : [];

  const handleBack = () => {
    const isExecutionEnvironment =
      templateEntity?.spec?.type?.includes('execution-environment') ?? false;

    if (isExecutionEnvironment) {
      navigate(`${rootLink()}/ee/create`);
    } else {
      navigate(`${rootLink()}`);
    }
  };

  return (
    <Content>
      <Box className={classes.root}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          className={classes.backButton}
          data-testid="back-button"
        >
          Templates
        </Button>
        <Typography
          className={classes.title}
          data-testid="template-task--title"
        >
          {entityTemplate.title}
        </Typography>
        {description && (
          <Typography className={classes.description}>
            {description}
          </Typography>
        )}
        {templateEntity?.spec?.type === 'workflow-job-template' && (
          <ApprovalDisclaimer />
        )}
        <Grid container direction="row-reverse" spacing={3}>
          {templateInfo && (
            <Grid item xs={12} sm={12} md={5} lg={5}>
              <Card variant="outlined">
                <CardHeader title="About Template" />
                <CardContent>
                  <MarkdownContent content={templateInfo} />
                </CardContent>
              </Card>
            </Grid>
          )}
          <Grid
            item
            xs={12}
            sm={12}
            md={templateInfo ? 7 : 12}
            lg={templateInfo ? 7 : 12}
          >
            <Card variant="outlined">
              <CardContent>
                <StepForm
                  steps={entityTemplate.steps}
                  submitFunction={finalSubmit}
                  initialFormData={initialFormData}
                  storageKey={`${namespace}/${templateName}`}
                />
              </CardContent>
            </Card>
            <Box
              display="flex"
              justifyContent="flex-end"
              marginTop="16px"
              marginBottom={4}
            >
              <Button
                onClick={handleBack}
                variant="text"
                color="primary"
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Content>
  );
};
