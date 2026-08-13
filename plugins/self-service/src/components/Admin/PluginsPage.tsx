import { useNavigate } from 'react-router-dom';
import { Page, Header, Content, Link } from '@backstage/core-components';
import {
  Box,
  Chip,
  Typography,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from '@material-ui/core';
import ExtensionIcon from '@material-ui/icons/Extension';
import { PageHelpIcon } from '../common/PageHelpIcon';

type PluginStatus = 'Enabled' | 'Preview' | 'Disabled';

type PortalPluginRow = {
  id: string;
  name: string;
  description: string;
  status: PluginStatus;
  /** Optional deep link into capability config (not a separate Admin rail item). */
  configHref?: string;
  configLabel?: string;
};

const DEMO_PLUGINS: PortalPluginRow[] = [
  {
    id: 'self-service',
    name: 'Self-service',
    description: 'Git Repositories, Templates, Activity, and shared Admin surfaces.',
    status: 'Enabled',
  },
  {
    id: 'apme',
    name: 'APME Quality Scanning',
    description:
      'Quality tab on Git Repositories. Connect target AAP version under Integrations.',
    status: 'Preview',
    configHref: '/self-service/admin/integrations',
    configLabel: 'Open Integrations',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'Inventories compliance scanning and remediation workflows.',
    status: 'Preview',
  },
  {
    id: 'devspaces',
    name: 'Dev Spaces',
    description:
      'Adds “Edit in Dev Spaces” on projects. Wire the OpenShift Dev Spaces URL under Integrations → Developer tools.',
    status: 'Enabled',
    configHref: '/self-service/admin/integrations/devspaces',
    configLabel: 'Configure connection',
  },
  {
    id: 'ee-builder',
    name: 'EE Builder',
    description:
      'Execution Environment build configuration (base images, registries, timeouts).',
    status: 'Disabled',
    configHref: '/self-service/admin/ee-builder',
    configLabel: 'Open EE Builder',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Global inbox and masthead bell. User prefs live under Settings → Notifications.',
    status: 'Preview',
  },
];

const useStyles = makeStyles(theme => ({
  intro: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
    maxWidth: 720,
  },
  tableWrap: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
  },
  nameCell: {
    fontWeight: 600,
    fontSize: 14,
  },
  desc: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    maxWidth: 480,
  },
  emptyIcon: {
    opacity: 0.35,
    marginRight: theme.spacing(1),
    verticalAlign: 'middle',
  },
}));

function statusChip(status: PluginStatus) {
  if (status === 'Enabled') {
    return (
      <Chip
        label="Enabled"
        size="small"
        style={{ backgroundColor: '#e6f9e6', color: '#1e4620', fontSize: 11, height: 22 }}
      />
    );
  }
  if (status === 'Preview') {
    return (
      <Chip
        label="Preview"
        size="small"
        style={{ backgroundColor: 'rgba(0,102,204,0.12)', color: '#0066CC', fontSize: 11, height: 22 }}
      />
    );
  }
  return (
    <Chip
      label="Disabled"
      size="small"
      variant="outlined"
      style={{ fontSize: 11, height: 22 }}
    />
  );
}

/**
 * Administration → Plugins — installed Portal capabilities / enablement inventory.
 * External system wiring stays under Integrations (e.g. Dev Spaces URL).
 * EE Builder config is reached from here, not as its own Admin rail item.
 */
export const PluginsPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Plugins
            <PageHelpIcon
              tooltipLabel="What are Plugins?"
              title="Plugins"
              description="Plugins are Portal capabilities installed on this instance (preview, enablement, lifecycle). Connecting external systems — AAP, GitHub, container registries, Dev Spaces — stays under Integrations."
            />
          </Box>
        }
        pageTitleOverride="Plugins"
        subtitle="Installed Portal capabilities. Connect external systems under Integrations."
      />
      <Content>
        <Typography className={classes.intro} variant="body2">
          <ExtensionIcon className={classes.emptyIcon} fontSize="small" />
          This inventory is not a menu of experiences. Enablement here does not add
          left-nav items by itself — features attach to object homes or Integrations
          as designed.
        </Typography>

        <Box className={classes.tableWrap}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plugin</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DEMO_PLUGINS.map(plugin => (
                <TableRow key={plugin.id}>
                  <TableCell>
                    <Typography className={classes.nameCell}>{plugin.name}</Typography>
                    <Typography className={classes.desc}>{plugin.description}</Typography>
                  </TableCell>
                  <TableCell>{statusChip(plugin.status)}</TableCell>
                  <TableCell align="right">
                    {plugin.configHref ? (
                      <Button
                        color="primary"
                        size="small"
                        style={{ textTransform: 'none', borderRadius: 20 }}
                        onClick={() => navigate(plugin.configHref!)}
                      >
                        {plugin.configLabel ?? 'Configure'}
                      </Button>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            Looking for GitHub or GitLab? Those are source-control{' '}
            <Link to="/self-service/admin/integrations">Integrations</Link>
            , not plugins. Container registries (for EE images) are also under
            Integrations — not Git Repositories.
          </Typography>
        </Box>
      </Content>
    </Page>
  );
};
