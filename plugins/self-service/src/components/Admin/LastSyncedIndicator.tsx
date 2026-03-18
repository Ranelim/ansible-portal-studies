import { Typography, makeStyles } from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: 13,
  },
  icon: {
    fontSize: 14,
    color: theme.palette.text.disabled,
  },
}));

export const LastSyncedIndicator = ({
  source,
  timeAgo,
}: {
  source: string;
  timeAgo: string;
}) => {
  const classes = useStyles();
  return (
    <Typography variant="body2" className={classes.root}>
      <SyncIcon className={classes.icon} />
      Content from {source}, last synced {timeAgo}
    </Typography>
  );
};
