import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputBase,
  Typography,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import SearchIcon from '@material-ui/icons/Search';
import PersonIcon from '@material-ui/icons/Person';
import { useNavigate } from 'react-router-dom';
import {
  RESOURCE_TEMPLATE_COPY,
  RESOURCE_TEMPLATES,
  ResourceTemplate,
  ResourceTemplateKind,
} from './resourceTemplates';

const useStyles = makeStyles(theme => ({
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  subtitle: {
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: 14,
    lineHeight: 1.5,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: '4px 12px',
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: 15,
    lineHeight: 1.3,
    padding: theme.spacing(2, 2, 1),
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
  },
  useButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
  empty: {
    textAlign: 'center',
    padding: theme.spacing(6, 2),
  },
}));

type CreateFromTemplateDialogProps = {
  open: boolean;
  onClose: () => void;
  kind: ResourceTemplateKind;
  /** Where to send the user after they pick a template. Defaults to scaffolder wizard. */
  onSelectTemplate?: (template: ResourceTemplate) => void;
};

const TemplateCard = ({
  template,
  onStart,
}: {
  template: ResourceTemplate;
  onStart: (template: ResourceTemplate) => void;
}) => {
  const classes = useStyles();
  return (
    <Card className={classes.card} variant="outlined">
      <Typography className={classes.cardTitle}>{template.title}</Typography>
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
                fontSize: 11,
                height: 20,
                ...(tag === 'quality-scan'
                  ? {
                      borderColor: '#0066CC40',
                      backgroundColor: '#0066CC08',
                      color: '#0066CC',
                      fontWeight: 500,
                    }
                  : {}),
              }}
            />
          ))}
        </Box>
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Box className={classes.ownerLabel}>
          <PersonIcon style={{ fontSize: 14 }} />
          <Typography variant="caption" color="textSecondary">
            {template.owner}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="small"
          className={classes.useButton}
          onClick={() => onStart(template)}
        >
          Use template
        </Button>
      </CardActions>
    </Card>
  );
};

/**
 * Object-depth Templates entry: header Create CTA → filtered template modal.
 * One catalog with object filter — not a separate Templates product.
 */
export const CreateFromTemplateDialog = ({
  open,
  onClose,
  kind,
  onSelectTemplate,
}: CreateFromTemplateDialogProps) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const copy = RESOURCE_TEMPLATE_COPY[kind];
  const templates = RESOURCE_TEMPLATES[kind];

  const filtered = useMemo(() => {
    if (!searchText) return templates;
    const lower = searchText.toLowerCase();
    return templates.filter(
      t =>
        t.title.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.tags.some(tag => tag.includes(lower)),
    );
  }, [searchText, templates]);

  const handleStart = useCallback(
    (template: ResourceTemplate) => {
      onClose();
      setSearchText('');
      if (onSelectTemplate) {
        onSelectTemplate(template);
        return;
      }
      navigate(`/self-service/create/templates/default/${template.name}`);
    },
    [navigate, onClose, onSelectTemplate],
  );

  const handleClose = useCallback(() => {
    setSearchText('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="create-from-template-title"
    >
      <DialogTitle disableTypography id="create-from-template-title">
        <Box className={classes.titleRow}>
          <Box>
            <Typography variant="h6" style={{ fontWeight: 600 }}>
              {copy.dialogTitle}
            </Typography>
            <Typography className={classes.subtitle}>
              {copy.dialogSubtitle}
            </Typography>
          </Box>
          <IconButton
            aria-label="Close"
            onClick={handleClose}
            size="small"
            style={{ marginTop: -4 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers style={{ paddingTop: 16 }}>
        <Box className={classes.searchBox}>
          <SearchIcon style={{ color: '#999', marginRight: 8 }} />
          <InputBase
            placeholder="Search templates..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            fullWidth
            inputProps={{ 'aria-label': 'Search templates' }}
          />
        </Box>
        <Grid container spacing={2}>
          {filtered.map(template => (
            <Grid item xs={12} sm={6} key={template.name}>
              <TemplateCard template={template} onStart={handleStart} />
            </Grid>
          ))}
        </Grid>
        {filtered.length === 0 && (
          <Box className={classes.empty}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No templates match your search
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Try adjusting your search terms.
            </Typography>
            <Button
              size="small"
              onClick={() => setSearchText('')}
              style={{ textTransform: 'none', marginTop: 16, borderRadius: 20 }}
            >
              Clear search
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
