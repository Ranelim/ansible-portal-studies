import { useState, useMemo, useCallback } from 'react';
import {
  Typography,
  Box,
  makeStyles,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Chip,
  Divider,
  Button,
  InputBase,
  Grid,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { DEMO_TEMPLATES, DemoTemplate } from './templatesDemoData';
import { ProjectCreateWizard } from './ProjectCreateWizard';

const useStyles = makeStyles(theme => ({
  description: {
    color: theme.palette.text.secondary,
    fontSize: 16,
    lineHeight: 1.6,
    marginBottom: theme.spacing(2),
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: '4px 12px',
    marginBottom: theme.spacing(3),
    maxWidth: 400,
    backgroundColor: theme.palette.background.paper,
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  cardContent: {
    flexGrow: 1,
    padding: theme.spacing(2),
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  cardType: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: theme.spacing(1),
  },
  pipelineBadge: {
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'none',
  },
  cardActions: {
    justifyContent: 'space-between',
    padding: '8px 16px',
  },
  ownerLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  startButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 16,
  },
}));

const TemplateCard = ({
  template,
  onStart,
}: {
  template: DemoTemplate;
  onStart: (template: DemoTemplate) => void;
}) => {
  const classes = useStyles();

  return (
    <Card className={classes.card}>
      <CardHeader
        title={
          <Typography className={classes.cardTitle}>
            {template.title}
          </Typography>
        }
        subheader={
          <Typography className={classes.cardType}>{template.type}</Typography>
        }
        style={{ paddingBottom: 0 }}
      />
      <Divider />
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardDescription}>
          {template.description}
        </Typography>
        <Divider />
        <Box className={classes.tagsContainer}>
          {template.tags.map(tag => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
        <Box mt={1.5}>
          <Chip
            label={`${template.defaultPipeline === 'comprehensive' ? 'Comprehensive' : 'Standard'} pipeline`}
            size="small"
            color={template.defaultPipeline === 'comprehensive' ? 'secondary' : 'default'}
            className={classes.pipelineBadge}
          />
        </Box>
      </CardContent>
      <Divider />
      <CardActions className={classes.cardActions}>
        <Box className={classes.ownerLabel}>
          <PersonIcon style={{ fontSize: 16 }} />
          <Typography variant="body2" color="textSecondary">
            {template.owner.replace('group:default/', '')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          className={classes.startButton}
          startIcon={<PlayArrowIcon />}
          onClick={() => onStart(template)}
        >
          Start
        </Button>
      </CardActions>
    </Card>
  );
};

export const ProjectsCreateContent = () => {
  const classes = useStyles();
  const [searchText, setSearchText] = useState('');
  const [activeWizard, setActiveWizard] = useState<DemoTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    if (!searchText) return DEMO_TEMPLATES;
    const lower = searchText.toLowerCase();
    return DEMO_TEMPLATES.filter(
      t =>
        t.title.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.tags.some(tag => tag.includes(lower)),
    );
  }, [searchText]);

  const handleStart = useCallback((template: DemoTemplate) => {
    setActiveWizard(template);
  }, []);

  const handleWizardClose = useCallback(() => {
    setActiveWizard(null);
  }, []);

  if (activeWizard) {
    return (
      <ProjectCreateWizard
        template={activeWizard}
        onClose={handleWizardClose}
      />
    );
  }

  return (
    <Box>
      <Typography variant="body1" className={classes.description}>
        Create a new automation project from a software template. Each template
        scaffolds a Git repository with the right structure, CI/CD pipeline, and
        AAP integration for your use case.
      </Typography>
      <Box className={classes.searchBox}>
        <SearchIcon style={{ color: '#999', marginRight: 8 }} />
        <InputBase
          placeholder="Search templates..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          fullWidth
        />
      </Box>
      <Grid container spacing={3}>
        {filteredTemplates.map(template => (
          <Grid item xs={12} sm={6} md={4} key={template.name}>
            <TemplateCard template={template} onStart={handleStart} />
          </Grid>
        ))}
      </Grid>
      {filteredTemplates.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="textSecondary">
            No templates match your search
          </Typography>
        </Box>
      )}
    </Box>
  );
};
