import { Page, Header, Content } from '@backstage/core-components';
import { Box, Card, CardContent, Typography, makeStyles } from '@material-ui/core';
import { PageHelpIcon } from '../common/PageHelpIcon';

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: theme.spacing(2),
  },
  card: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    height: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  description: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: theme.spacing(2),
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderRadius: 4,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.03)',
    border: `1px dashed ${theme.palette.divider}`,
  },
  placeholderLabel: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    opacity: 0.7,
  },
}));

const PLACEHOLDER_CARDS = [
  {
    title: 'Experience usage',
    description: 'Launches and activity per experience.',
  },
  {
    title: 'Active users',
    description: 'Seats and recent sign-ins across the instance.',
  },
  {
    title: 'Template runs',
    description: 'Run volume and success rate over time.',
  },
  {
    title: 'Installed capabilities',
    description: 'Plugins and experiences with uninstall actions later.',
  },
];

/**
 * Administration landing — Usage / Metrics Dashboard (first Admin rail item).
 * Prototype placeholder only (Taufique Aug 13): empty cards, not real telemetry.
 */
export const GeneralPage = () => {
  const classes = useStyles();

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Dashboard
            <PageHelpIcon
              tooltipLabel="What is Dashboard?"
              title="Administration Dashboard"
              description="Admin-only usage and metrics for this Portal instance — experience activity, seats, and capability health. Platform configuration (Integrations, Access, Plugins) lives on the other Administration rail items."
            />
          </Box>
        }
        pageTitleOverride="Dashboard"
        subtitle="Usage and metrics for this Portal instance. Charts and actions TBD."
      />
      <Content>
        <Box className={classes.grid}>
          {PLACEHOLDER_CARDS.map(card => (
            <Card key={card.title} className={classes.card} variant="outlined">
              <CardContent>
                <Typography className={classes.title}>{card.title}</Typography>
                <Typography className={classes.description}>
                  {card.description}
                </Typography>
                <Box className={classes.placeholder} aria-hidden>
                  <Typography className={classes.placeholderLabel}>
                    Image / chart TBD
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Content>
    </Page>
  );
};
