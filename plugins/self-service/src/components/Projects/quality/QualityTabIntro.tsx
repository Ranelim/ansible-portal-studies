import type { ReactNode } from 'react';
import { Box, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  intro: {
    marginBottom: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(0.5),
  },
}));

/** Tab-scoped heading. Theme variants only — not a second page Header. */
export function QualityTabIntro({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const classes = useStyles();
  return (
    <Box className={classes.intro}>
      {title && (
        <Typography variant="h4" component="h2" className={classes.title}>
          {title}
        </Typography>
      )}
      <Typography variant="body2" color="textSecondary">
        {children}
      </Typography>
    </Box>
  );
}
