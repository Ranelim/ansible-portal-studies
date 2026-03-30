import { useState, useMemo, useCallback, useEffect } from 'react';
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
import SecurityIcon from '@material-ui/icons/Security';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEMO_TEMPLATES, DemoTemplate } from './templatesDemoData';
import { ProjectCreateWizard } from './ProjectCreateWizard';
import { ImportProjectWizard } from '../repositories/ImportProjectWizard';
import { DISCOVERED_REPOS } from '../repositories/repositoriesDemoData';
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
  const isGovernance = template.type === 'governance';

  return (
    <Card
      className={classes.card}
      variant="outlined"
      style={isGovernance ? { borderStyle: 'dashed', borderColor: '#0066CC' } : undefined}
    >
      <Box className={classes.cardTitleArea}>
        <Typography className={classes.cardTitle}>
          {isGovernance && <SecurityIcon style={{ fontSize: 16, verticalAlign: 'text-bottom', marginRight: 4, color: '#0066CC' }} />}
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
              label={tag}
              size="small"
              variant="outlined"
              style={{ fontSize: 11, height: 20 }}
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
          {isGovernance ? 'Enable governance' : 'Use template'}
        </Button>
      </CardActions>
    </Card>
  );
};

export const ProjectsCreateContent = () => {
  const classes = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [activeWizard, setActiveWizard] = useState<DemoTemplate | null>(null);
  const [governanceRepo, setGovernanceRepo] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { autoStartTemplate?: string; repoName?: string } | null;
    if (state?.autoStartTemplate === 'enable-governance') {
      const repo = state.repoName ? DISCOVERED_REPOS.find(r => r.name === state.repoName) : null;
      if (repo) {
        setGovernanceRepo(repo.name);
      }
      window.history.replaceState({}, '');
    }
  }, [location.state]);

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
    if (template.name === 'enable-governance') {
      setGovernanceRepo('__pick__');
      return;
    }
    setActiveWizard(template);
  }, []);

  const handleWizardClose = useCallback(() => {
    setActiveWizard(null);
    setGovernanceRepo(null);
  }, []);

  const handleGovernanceComplete = useCallback((repoName: string) => {
    setGovernanceRepo(null);
    navigate('/self-service/projects/catalog', {
      state: { justGoverned: repoName },
    });
  }, [navigate]);

  if (governanceRepo) {
    const repo = DISCOVERED_REPOS.find(r => r.name === governanceRepo) ?? DISCOVERED_REPOS[0];
    return (
      <ImportProjectWizard
        repo={repo}
        onClose={handleWizardClose}
        onComplete={handleGovernanceComplete}
      />
    );
  }

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
      <DismissibleBanner
        storageKey="projects-templates"
        message="Templates are pre-configured blueprints for scaffolding new automation repositories. Each template creates a Git repository with best-practice directory structure, CI/CD pipeline, and Ansible content."
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
