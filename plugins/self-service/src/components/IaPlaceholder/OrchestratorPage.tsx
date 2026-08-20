import { Page, Header, Content } from '@backstage/core-components';
import { Box, Typography, makeStyles } from '@material-ui/core';
import { ExperienceThumbnail } from './experienceVisuals';

const useStyles = makeStyles(theme => ({
  body: {
    maxWidth: 720,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  muted: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    lineHeight: 1.5,
  },
}));

/** Placeholder landing after Orchestrator is enabled. */
export const OrchestratorPage = () => {
  const classes = useStyles();
  return (
    <Page themeId="tool">
      <Header
        title={
          <Box className={classes.titleRow}>
            <ExperienceThumbnail id="orchestrator" size={32} />
            Orchestrator
          </Box>
        }
        pageTitleOverride="Orchestrator"
        subtitle="Browse certified workflows and extra node types."
      />
      <Content>
        <Box className={classes.body}>
          <Typography className={classes.muted}>
            Certified Automation Orchestrator workflows and node plugins will
            appear here. This surface is a placeholder for the stakeholder
            demo — the experience is enabled; catalog content is not wired.
          </Typography>
        </Box>
      </Content>
    </Page>
  );
};
