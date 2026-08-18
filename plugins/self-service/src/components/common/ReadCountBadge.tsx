import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    boxSizing: 'border-box',
    height: 18,
    minWidth: 18,
    padding: '0 6px',
    margin: 0,
    borderRadius: 9999,
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1,
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.grey[700]
        : theme.palette.grey[300],
    color: theme.palette.text.secondary,
  },
}));

/**
 * PatternFly read badge (`pf-m-read`) as an MUI span.
 * Chip is the wrong control — its metrics sit above RHDH HeaderTabs text.
 */
export const ReadCountBadge = ({
  count,
  label,
}: {
  count: number;
  label: string;
}) => {
  const classes = useStyles();
  if (count <= 0) return null;
  return (
    <span className={classes.badge} aria-label={label}>
      {count}
    </span>
  );
};
