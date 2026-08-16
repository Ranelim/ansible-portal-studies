import { Page, Header, Content } from '@backstage/core-components';
import { Box, Typography, makeStyles } from '@material-ui/core';
import {
  EXPERIENCE_LABELS,
  useNavIaModel,
  type NavExperience,
} from '../../hooks/useNavIaModel';

const useStyles = makeStyles(theme => ({
  body: {
    maxWidth: 720,
  },
  muted: {
    color: theme.palette.text.secondary,
  },
}));

/** Concept-page purpose only — no KPI / attention / shortcut mock content. */
const PURPOSE: Partial<Record<NavExperience, string>> = {
  develop:
    'Cross-entity overview for Develop — repos, collections, and execution environments. Entity rail items open the lists; this page is posture and attention only.',
  compliance:
    'Experience overview for Compliance — posture across inventories. Inventories in the rail opens the list; overview lives here so the entity page stays list-first.',
  edge:
    'Experience overview for Edge — fleet health and devices needing attention. Edge fleets in the rail opens the fleets list; Devices / Images stay as entity tabs.',
};

/**
 * Experience Dashboard (rail landing) — concept chrome: title + description only.
 */
export const ExperienceDashboardPage = () => {
  const classes = useStyles();
  const { experience } = useNavIaModel();
  const scoped: NavExperience =
    experience === 'admin' || experience === 'all' || experience === 'automate'
      ? 'develop'
      : experience;
  const label = EXPERIENCE_LABELS[scoped] ?? scoped;
  const purpose = PURPOSE[scoped] ?? PURPOSE.develop!;

  return (
    <Page themeId="tool">
      <Header
        title={`${label} dashboard`}
        subtitle="Experience overview"
        pageTitleOverride={`${label} dashboard`}
      />
      <Content>
        <Box className={classes.body}>
          <Typography className={classes.muted}>{purpose}</Typography>
        </Box>
      </Content>
    </Page>
  );
};
