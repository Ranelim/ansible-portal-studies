import { Page, Header, Content } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import { PageHelpIcon } from '../common/PageHelpIcon';

/**
 * Administration landing — Usage / Metrics Dashboard (first Admin rail item).
 * Prototype shell only (Taufique Aug 13): title + description; charts TBD later.
 */
export const GeneralPage = () => (
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
    <Content />
  </Page>
);
