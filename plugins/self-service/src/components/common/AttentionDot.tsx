import { makeStyles } from '@material-ui/core';
import { statusColors } from './statusColors';

const useStyles = makeStyles({
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: statusColors.info,
    flexShrink: 0,
  },
});

/** Unread attention pip — not a count. Clears when the user opens the surface. */
export const AttentionDot = ({ label }: { label: string }) => {
  const classes = useStyles();
  return <span className={classes.dot} aria-label={label} />;
};
