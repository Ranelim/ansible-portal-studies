import { Box, Link, makeStyles } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { usePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';

import { CONFIGURATION_DOCS_URL } from './constants';
import {
  EmptyStateLayout,
  CollectionsIllustration,
} from '../common/EmptyStateLayout';

const useStyles = makeStyles(theme => ({
  docsLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing(1),
    fontSize: 13,
  },
  docsIcon: {
    fontSize: 14,
  },
}));

export interface EmptyStateProps {
  hasConfiguredSources?: boolean | null;
}

export const EmptyState = ({ hasConfiguredSources }: EmptyStateProps) => {
  const classes = useStyles();
  const { allowed } = usePermission({
    permission: catalogEntityCreatePermission,
  });

  if (hasConfiguredSources === false) {
    return (
      <EmptyStateLayout
        title="No content sources configured"
        description={
          allowed
            ? 'Content sources are not defined in the application configuration. To view collections, connect a Private Automation Hub provider under Administration > Connections.'
            : 'Content sources are not currently configured for this environment. Contact your organization administrator to add content providers.'
        }
        illustration={
          <Box>
            <CollectionsIllustration />
            {allowed && (
              <Box textAlign="center" mt={1}>
                <Link
                  href={CONFIGURATION_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.docsLink}
                >
                  View documentation
                  <OpenInNewIcon className={classes.docsIcon} />
                </Link>
              </Box>
            )}
          </Box>
        }
      />
    );
  }

  return (
    <EmptyStateLayout
      title="No collections yet"
      description={
        allowed
          ? 'No collections were retrieved from the configured sources. Use Administration > Connections to verify your provider settings and trigger a sync.'
          : 'No collections are available in the catalog. Contact your organization administrator to sync the content sources.'
      }
      illustration={<CollectionsIllustration />}
    />
  );
};
