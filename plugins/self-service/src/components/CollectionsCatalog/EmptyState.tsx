import { Box, Link, Typography } from '@material-ui/core';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import SettingsIcon from '@material-ui/icons/Settings';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { usePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';

import { useCollectionsStyles } from './styles';
import { CONFIGURATION_DOCS_URL } from './constants';

export interface EmptyStateProps {
  hasConfiguredSources?: boolean | null;
}

export const EmptyState = ({
  hasConfiguredSources,
}: EmptyStateProps) => {
  const classes = useCollectionsStyles();
  const { allowed } = usePermission({
    permission: catalogEntityCreatePermission,
  });

  if (hasConfiguredSources === false) {
    return (
      <Box className={classes.emptyState}>
        <SettingsIcon className={classes.emptyStateIcon} />
        <Typography variant="h4" className={classes.emptyStateTitle}>
          No content sources configured
        </Typography>
        <Typography className={classes.emptyStateDescription}>
          {allowed
            ? 'Content sources are not defined in the application configuration. To view collections, configure a provider in the app-config.yaml file.'
            : 'Content sources are not currently configured for this environment. Contact your organization administrator to add content providers.'}
        </Typography>
        {allowed && (
          <Link
            href={CONFIGURATION_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.emptyStateDocsLink}
          >
            View Documentation
            <OpenInNewIcon className={classes.emptyStateDocsIcon} />
          </Link>
        )}
      </Box>
    );
  }

  return (
    <Box className={classes.emptyState}>
      <FolderOpenIcon className={classes.emptyStateIcon} />
      <Typography variant="h4" className={classes.emptyStateTitle}>
        No collections yet
      </Typography>
      <Typography className={classes.emptyStateDescription}>
        {allowed
          ? 'No collections were retrieved from the configured sources. Use Administration > Connections to trigger a sync.'
          : 'No collections are available in the catalog. Contact your organization administrator to sync the content sources.'}
      </Typography>
    </Box>
  );
};
