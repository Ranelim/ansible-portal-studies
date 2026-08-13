import { Page, Header, Content, Link } from '@backstage/core-components';
import { Box, Typography, Chip, Button } from '@material-ui/core';
import MemoryIcon from '@material-ui/icons/Memory';
import { useNavigate } from 'react-router-dom';

/**
 * EE Builder config — reached from Administration → Plugins, not a top-level Admin rail item.
 */
export const EEBuilderPlaceholderPage = () => {
  const navigate = useNavigate();

  return (
    <Page themeId="app">
      <Header
        title="EE Builder"
        pageTitleOverride="EE Builder"
        subtitle="Execution Environment build configuration"
        type="Plugins"
        typeLink="/self-service/admin/plugins"
      />
      <Content>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: 300, textAlign: 'center', opacity: 0.85 }}
        >
          <MemoryIcon style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }} />
          <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 8 }}>
            Coming soon
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ maxWidth: 420, lineHeight: 1.6 }}
          >
            Configure base images, build timeouts, target container registries, and
            resource limits for Execution Environment builds. This capability is
            listed under{' '}
            <Link to="/self-service/admin/plugins">Plugins</Link> — not as its own
            Administration rail item.
          </Typography>
          <Chip
            label="Planned for v2"
            size="small"
            variant="outlined"
            style={{ marginTop: 16, fontSize: 12 }}
          />
          <Button
            color="primary"
            variant="outlined"
            size="small"
            style={{ marginTop: 16, textTransform: 'none', borderRadius: 20 }}
            onClick={() => navigate('/self-service/admin/plugins')}
          >
            Back to Plugins
          </Button>
        </Box>
      </Content>
    </Page>
  );
};
