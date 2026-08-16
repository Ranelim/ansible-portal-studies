import { Box, Typography, makeStyles } from '@material-ui/core';
import { QualityOverviewContent } from './QualityOverviewContent';

const useStyles = makeStyles(theme => ({
  hint: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    marginBottom: theme.spacing(2),
  },
}));

/** Cross-repo quality posture — host Dashboard tab. */
export const QualityDashboardTabContent = () => {
  const classes = useStyles();
  return (
    <Box>
      <Typography className={classes.hint}>
        Cross-repository quality posture. Open a repository for findings detail;
        start or resume remediation from the Remediations tab or a repo CTA.
      </Typography>
      <QualityOverviewContent />
    </Box>
  );
};
