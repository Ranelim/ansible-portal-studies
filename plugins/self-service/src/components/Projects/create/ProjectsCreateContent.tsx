import { useState, useMemo, useCallback } from 'react';
import {
  Typography,
  Box,
  makeStyles,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  InputBase,
  Grid,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import { useNavigate } from 'react-router-dom';
import { DEMO_TEMPLATES, DemoTemplate } from './templatesDemoData';
import { DismissibleBanner } from '../../common/DismissibleBanner';

const useStyles = makeStyles(theme => ({
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
  cardTitleArea: {
    padding: theme.spacing(2, 2, 1),
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 15,
    lineHeight: 1.3,
  },
  cardContent: {
    flexGrow: 1,
    padding: theme.spacing(0, 2, 2),
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 1.6,
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
  },
  cardActions: {
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  ownerLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  createButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
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
    <Card
      className={classes.card}
      variant="outlined"
    >
      <Box className={classes.cardTitleArea}>
        <Typography className={classes.cardTitle}>
          {template.title}
        </Typography>
      </Box>
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardDescription}>
          {template.description}
        </Typography>
        <Box className={classes.tagsContainer}>
          {template.tags.map(tag => (
            <Chip
              key={tag}
              label={tag === 'quality-scan' ? 'APME quality scan' : tag}
              size="small"
              variant="outlined"
              style={{
                fontSize: 11, height: 20,
                ...(tag === 'quality-scan' ? {
                  borderColor: '#0066CC40',
                  backgroundColor: '#0066CC08',
                  color: '#0066CC',
                  fontWeight: 500,
                } : {}),
              }}
            />
          ))}
        </Box>
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Box className={classes.ownerLabel}>
          <PersonIcon style={{ fontSize: 14 }} />
          <Typography variant="caption" color="textSecondary">
            {template.owner.replace('group:default/', '')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="small"
          className={classes.createButton}
          onClick={() => onStart(template)}
        >
          Use template
        </Button>
      </CardActions>
    </Card>
  );
};

export const ProjectsCreateContent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

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
    navigate(`/self-service/create/templates/default/${template.name}`);
  }, [navigate]);

  return (
    <Box>
      <DismissibleBanner
        storageKey="projects-templates"
        message="Templates are pre-configured blueprints for scaffolding new automation repositories. Each template creates a Git repository with best-practice directory structure and Ansible content."
      />
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
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No templates match your search
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search terms or browse all available templates.
          </Typography>
          <Button
            size="small"
            onClick={() => setSearchText('')}
            style={{ textTransform: 'none', marginTop: 16 }}
          >
            Clear search
          </Button>
        </Box>
      )}
    </Box>
  );
};
