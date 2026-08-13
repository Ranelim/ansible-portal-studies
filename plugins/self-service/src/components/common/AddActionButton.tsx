import { useState, useRef } from 'react';
import {
  Button,
  Popper,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  makeStyles,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

export type AddActionOption = {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
};

type AddActionButtonProps = {
  label: string;
  options: AddActionOption[];
};

const useStyles = makeStyles(theme => ({
  button: {
    textTransform: 'none',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    borderRadius: 20,
  },
  paper: {
    marginTop: 4,
    minWidth: 280,
    zIndex: 1300,
    border: `1px solid ${theme.palette.divider}`,
  },
  menuItem: {
    padding: '12px 16px',
    alignItems: 'flex-start',
  },
  optionIcon: {
    minWidth: 36,
    marginTop: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
}));

export const AddActionButton = ({ label, options }: AddActionButtonProps) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  if (options.length === 1) {
    return (
      <Button
        variant="contained"
        color="primary"
        size="small"
        className={classes.button}
        startIcon={<AddIcon />}
        onClick={options[0].onClick}
      >
        {label}
      </Button>
    );
  }

  return (
    <>
      <Button
        ref={anchorRef}
        variant="contained"
        color="primary"
        size="small"
        className={classes.button}
        startIcon={<AddIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={() => setOpen(prev => !prev)}
      >
        {label}
      </Button>
      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-end" style={{ zIndex: 1300 }}>
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper className={classes.paper} elevation={8}>
            <MenuList>
              {options.map(opt => (
                <MenuItem
                  key={opt.label}
                  className={classes.menuItem}
                  onClick={() => { setOpen(false); opt.onClick(); }}
                >
                  <ListItemIcon className={classes.optionIcon}>
                    {opt.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={opt.label}
                    secondary={
                      <Typography className={classes.optionDescription}>
                        {opt.description}
                      </Typography>
                    }
                  />
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};
