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
  Tooltip,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import StorageIcon from '@material-ui/icons/Storage';
import CloudIcon from '@material-ui/icons/Cloud';
import DeviceHubIcon from '@material-ui/icons/DeviceHub';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { DEMO_TEMPLATES, DemoTemplate } from './templatesDemoData';
import { ProjectCreateWizard } from './ProjectCreateWizard';

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  'create-playbook-project': StorageIcon,
  'create-cloud-provisioning-project': CloudIcon,
  'create-network-automation-project': DeviceHubIcon,
};

const TEMPLATE_COLORS: Record<string, string> = {
  'create-playbook-project': '#1565C0',
  'create-cloud-provisioning-project': '#2E7D32',
  'create-network-automation-project': '#E65100',
};

const useStyles = makeStyles(theme => ({
  description: {
    color: theme.palette.text.secondary,
    fontSize: 15,
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
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      boxShadow: theme.shadows[4],
      borderColor: theme.palette.primary.main,
    },
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 2, 1.5),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitleGroup: {
    flex: 1,
    minWidth: 0,
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
    marginBottom: theme.spacing(1),
  },
  pipelineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing(0.5),
  },
  pipelineBadge: {
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'none',
    height: 22,
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
  const IconComponent = TEMPLATE_ICONS[template.name] || StorageIcon;
  const accentColor = TEMPLATE_COLORS[template.name] || '#1565C0';

  return (
    <Card className={classes.card} elevation={0}>
      <Box className={classes.cardHeader}>
        <Box
          className={classes.iconContainer}
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <IconComponent style={{ color: accentColor, fontSize: 22 }} />
        </Box>
        <Box className={classes.cardTitleGroup}>
          <Typography className={classes.cardTitle}>
            {template.title}
          </Typography>
        </Box>
      </Box>
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardDescription}>
          {template.description}
        </Typography>
        <Box className={classes.tagsContainer}>
          {template.tags.map(tag => (
            <Chip key={tag} label={tag} size="small" variant="outlined" style={{ fontSize: 11, height: 20 }} />
          ))}
        </Box>
        <Box className={classes.pipelineRow}>
          <VerifiedUserIcon style={{ fontSize: 14, color: accentColor }} />
          <Chip
            label={`${template.defaultPipeline === 'comprehensive' ? 'Comprehensive' : 'Standard'} pipeline`}
            size="small"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
              fontWeight: 600,
            }}
            className={classes.pipelineBadge}
          />
          <Tooltip title={template.pipelineHint} placement="top" arrow>
            <InfoOutlinedIcon style={{ fontSize: 14, color: '#999', cursor: 'help' }} />
          </Tooltip>
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
          Create project
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
        Choose a template to create a new automation project. Each template
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
