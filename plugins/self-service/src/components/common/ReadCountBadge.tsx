import { makeStyles } from '@material-ui/core';
import { statusColors } from './statusColors';

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
  unread: {
    backgroundColor: statusColors.info,
    color: '#fff',
  },
}));

/**
 * PatternFly count badge as an MUI span.
 * Chip is the wrong control — its metrics sit above RHDH HeaderTabs text.
 * `read` = grey (`pf-m-read`). `unread` = info blue for setup attention.
 */
export const ReadCountBadge = ({
  count,
  label,
  tone = 'read',
}: {
  count: number;
  label: string;
  tone?: 'read' | 'unread';
}) => {
  const classes = useStyles();
  if (count <= 0) return null;
  return (
    <span
      className={`${classes.badge}${tone === 'unread' ? ` ${classes.unread}` : ''}`}
      aria-label={label}
    >
      {count}
    </span>
  );
};
