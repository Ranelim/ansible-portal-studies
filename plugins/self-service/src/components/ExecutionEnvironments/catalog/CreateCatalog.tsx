import {
  Box,
  Typography,
  Button,
  Link as MuiLink,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';

const useStyles = makeStyles(theme => ({
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  emptyIcon: {
    fontSize: '4rem',
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(3),
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
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
    marginBottom: theme.spacing(2),
  },
  link: {
    color: theme.palette.primary.main,
    fontSize: 14,
    display: 'inline-block',
  },
}));

export const CreateCatalog = ({
  onTabSwitch,
}: {
  onTabSwitch: (index: number) => void;
}) => {
  const classes = useStyles();

  return (
    <div data-testid="catalog-content">
      <Box className={classes.emptyContainer}>
        <FolderOpenIcon className={classes.emptyIcon} />
        <Typography variant="h4" className={classes.emptyTitle}>
          No execution environments yet
        </Typography>
        <Typography className={classes.emptyDescription}>
          Get started with Execution Environments (EE) to ensure your playbooks
          run consistently. Choose a recommended preset or start from scratch
          for full control. Once saved, follow our guide to build your EE image.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => onTabSwitch(1)}
          className={classes.createButton}
          startIcon={<AddIcon />}
        >
          Create execution environment
        </Button>
        <MuiLink
          href="https://red.ht/self-service_build_and_use_ee_definition"
          underline="hover"
          className={classes.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn how to build and use EE definitions
        </MuiLink>
      </Box>
    </div>
  );
};
