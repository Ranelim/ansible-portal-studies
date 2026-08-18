import { Tooltip, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  sha: {
    display: 'block',
    fontFamily: 'Red Hat Mono, ui-monospace, monospace',
    fontSize: 12,
    lineHeight: 1.3,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
}));

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** APME scanned commit — short SHA in tables; full hash in tooltip. */
export const CommitSha = ({ sha }: { sha?: string }) => {
  const classes = useStyles();
  if (!sha) return null;
  return (
    <Tooltip title={`Scanned commit ${sha}`} arrow>
      <Typography className={classes.sha} component="span">
        {shortSha(sha)}
      </Typography>
    </Tooltip>
  );
};
