import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles(theme => ({
  headerIcon: {
    color: theme.palette.common.white,
    opacity: 0.7,
    fontSize: 20,
    cursor: 'pointer',
    marginLeft: theme.spacing(1),
    '&:hover': {
      opacity: 1,
    },
  },
  inlineIcon: {
    fontSize: 18,
    color: theme.palette.text.disabled,
    cursor: 'pointer',
    marginLeft: theme.spacing(0.5),
    '&:hover': {
      color: theme.palette.text.secondary,
    },
  },
  popover: {
    padding: theme.spacing(2.5),
    maxWidth: 380,
  },
  title: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: theme.spacing(1),
  },
  description: {
    fontSize: 13,
    lineHeight: 1.6,
    color: theme.palette.text.secondary,
  },
}));

interface PageHelpIconProps {
  tooltipLabel: string;
  title: string;
  description: string;
  variant?: 'header' | 'inline';
}

export const PageHelpIcon = ({
  tooltipLabel,
  title,
  description,
  variant = 'header',
}: PageHelpIconProps) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title={tooltipLabel} arrow>
        <span
          style={{ display: 'inline-flex', cursor: 'pointer' }}
          onClick={e => setAnchorEl(e.currentTarget)}
          role="button"
          tabIndex={0}
        >
          <HelpOutlineIcon
            className={
              variant === 'header' ? classes.headerIcon : classes.inlineIcon
            }
          />
        </span>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box className={classes.popover}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Typography className={classes.title}>{title}</Typography>
            <IconButton size="small" onClick={() => setAnchorEl(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography className={classes.description}>
            {description}
          </Typography>
        </Box>
      </Popover>
    </>
  );
};
