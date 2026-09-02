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
    transition:
      'background-color 300ms cubic-bezier(.4, 0, .2, 1), color 300ms cubic-bezier(.4, 0, .2, 1)',
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  unread: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText || '#fff',
  },
}));

/**
 * PatternFly count badge as an MUI span.
 * Chip is the wrong control — its metrics sit above RHDH HeaderTabs text.
 * `read` = grey (`pf-m-read`). `unread` = theme primary (same as tab ink).
 */
export const ReadCountBadge = ({
  count,
  label,
  tone = 'read',
  showZero = false,
}: {
  count: number;
  label: string;
  tone?: 'read' | 'unread';
  showZero?: boolean;
}) => {
  const classes = useStyles();
  if (count < 0 || (count === 0 && !showZero)) return null;
  return (
    <span
      className={`${classes.badge}${tone === 'unread' ? ` ${classes.unread}` : ''}`}
      aria-label={label}
    >
      {count}
    </span>
  );
};
