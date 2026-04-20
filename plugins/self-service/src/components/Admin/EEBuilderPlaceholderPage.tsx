import { Page, Header, Content } from '@backstage/core-components';
import { Box, Typography, Chip } from '@material-ui/core';
import MemoryIcon from '@material-ui/icons/Memory';

export const EEBuilderPlaceholderPage = () => {
  return (
    <Page themeId="app">
      <Header
        title="EE Builder"
        pageTitleOverride="EE Builder"
        subtitle="Execution Environment build configuration"
      />
      <Content>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: 300, textAlign: 'center', opacity: 0.6 }}
        >
          <MemoryIcon style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }} />
          <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 8 }}>
            Coming soon
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ maxWidth: 420, lineHeight: 1.6 }}>
            Configure base images, build timeouts, target registries, and resource limits
            for Execution Environment builds. This page is planned for a future release.
          </Typography>
          <Chip
            label="Planned for v2"
            size="small"
            variant="outlined"
            style={{ marginTop: 16, fontSize: 12 }}
          />
        </Box>
      </Content>
    </Page>
  );
};
