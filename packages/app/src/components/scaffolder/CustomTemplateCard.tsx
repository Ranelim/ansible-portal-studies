import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  Divider,
  Typography,
  Button,
  makeStyles,
} from '@material-ui/core';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import StarIcon from '@material-ui/icons/Star';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useCallback } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
import { useStarredEntities } from '@backstage/plugin-catalog-react';

const useStyles = makeStyles(theme => ({
  card: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing(2, 2, 0),
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: 600,
    height: 22,
    textTransform: 'capitalize' as const,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    marginLeft: theme.spacing(1),
    flexShrink: 0,
  },
  smallIconBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: theme.spacing(1.5, 2, 1),
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: theme.spacing(0.5),
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
  },
  description: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: theme.spacing(0.5),
    padding: theme.spacing(0, 2, 1),
  },
  tag: {
    fontSize: 11,
    height: 20,
  },
  ownerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0, 2, 1),
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  actions: {
    padding: theme.spacing(0, 2, 2),
    justifyContent: 'flex-start',
  },
  useButton: {
    textTransform: 'none' as const,
    fontWeight: 600,
    borderRadius: 20,
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2.5),
  },
}));

export const CustomTemplateCard = ({
  template,
}: {
  template: TemplateEntityV1beta3;
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { isStarredEntity, toggleStarredEntity } = useStarredEntities();
  const starred = isStarredEntity(template);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const name = template.metadata.name;
  const title = template.metadata.title || name;
  const description = template.metadata.description ?? '';
  const tags = (template.metadata.tags ?? []) as string[];
  const specType = (template.spec as Record<string, unknown>)?.type as string | undefined;
  const owner = (template.spec as Record<string, unknown>)?.owner as string | undefined;
  const namespace = template.metadata.namespace ?? 'default';

  const detailUrl = `/self-service/catalog/${namespace}/${name}`;
  const wizardUrl = `/create/templates/${namespace}/${name}`;

  const handleTitleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(detailUrl);
    },
    [navigate, detailUrl],
  );

  const handleUse = useCallback(() => {
    navigate(wizardUrl);
  }, [navigate, wizardUrl]);

  return (
    <Card className={classes.card} variant="outlined">
      <Box className={classes.cardHeader}>
        {specType && (
          <Chip
            label={specType}
            size="small"
            variant="outlined"
            className={classes.typeBadge}
          />
        )}
        <Box className={classes.headerActions}>
          <IconButton
            className={classes.smallIconBtn}
            size="small"
            onClick={() => toggleStarredEntity(template)}
            aria-label={starred ? 'Unstar template' : 'Star template'}
          >
            {starred ? (
              <StarIcon fontSize="small" style={{ color: '#faaf00' }} />
            ) : (
              <StarBorderIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            className={classes.smallIconBtn}
            size="small"
            onClick={e => setMenuAnchor(e.currentTarget)}
            aria-label="Template actions"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <CardContent className={classes.content}>
        <Typography
          className={classes.title}
          onClick={handleTitleClick}
          role="link"
          tabIndex={0}
        >
          {title}
        </Typography>
        {description && (
          <Typography className={classes.description}>
            {description}
          </Typography>
        )}
      </CardContent>

      {tags.length > 0 && (
        <Box className={classes.tags}>
          {tags.slice(0, 5).map(tag => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              className={classes.tag}
            />
          ))}
        </Box>
      )}

      {owner && (
        <Box className={classes.ownerRow}>
          <span>by</span>
          <Typography variant="body2" style={{ fontSize: 12, fontWeight: 500 }}>
            {owner.replace(/^(user|group):/, '').replace(/^default\//, '')}
          </Typography>
        </Box>
      )}

      <CardActions className={classes.actions}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          className={classes.useButton}
          onClick={handleUse}
        >
          Use template
        </Button>
      </CardActions>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        getContentAnchorEl={null}
      >
        <MenuItem onClick={() => { setMenuAnchor(null); navigate(detailUrl); }}>
          <ListItemText primary="View details" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setMenuAnchor(null); toggleStarredEntity(template); }}>
          <ListItemText primary={starred ? 'Remove from favorites' : 'Add to favorites'} />
        </MenuItem>
      </Menu>
    </Card>
  );
};
