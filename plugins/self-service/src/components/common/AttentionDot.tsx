import { makeStyles } from '@material-ui/core';
import { statusColors } from './statusColors';

const EXIT_EASING = 'cubic-bezier(.4, 0, .7, .2)';

const useStyles = makeStyles({
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: statusColors.info,
    flexShrink: 0,
    transform: 'scale(1)',
    opacity: 1,
    transformOrigin: 'center center',
    transition: `transform 300ms ${EXIT_EASING}, opacity 300ms ${EXIT_EASING}, width 300ms ${EXIT_EASING}, height 300ms ${EXIT_EASING}`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  exiting: {
    transform: 'scale(0)',
    opacity: 0,
    width: 0,
    height: 0,
  },
});

/** Unread attention pip — shrinks away after the unread tab has been in view. */
export const AttentionDot = ({
  label,
  exiting = false,
}: {
  label: string;
  exiting?: boolean;
}) => {
  const classes = useStyles();
  return (
    <span
      className={`${classes.dot}${exiting ? ` ${classes.exiting}` : ''}`}
      aria-label={exiting ? undefined : label}
      aria-hidden={exiting || undefined}
    />
  );
};
