import { Box, Typography, makeStyles } from '@material-ui/core';
import { QualityOverviewContent } from './QualityOverviewContent';

const useStyles = makeStyles(theme => ({
  hint: {
    color: theme.palette.text.secondary,
    fontSize: 13,
    marginBottom: theme.spacing(2),
  },
}));

/**
 * Cross-repo findings-by-rule — host Quality tab, and Content quality Findings
 * when SHOW_CONTENT_QUALITY_FINDINGS_TAB is true (parked on develop-apme).
 */
export const QualityDashboardTabContent = ({ hint }: { hint?: string }) => {
  const classes = useStyles();
  return (
    <Box>
      <Typography className={classes.hint}>
        {hint ??
          'Findings grouped by rule across repositories. Open a repository for detail; start or resume remediation from Remediations or a repo CTA.'}
      </Typography>
      <QualityOverviewContent />
    </Box>
  );
};
