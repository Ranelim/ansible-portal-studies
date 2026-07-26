import { useState, useEffect } from 'react';
import { TechDocsIndexPage } from '@backstage/plugin-techdocs';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Page, Header, Content } from '@backstage/core-components';
import { Box, Typography, Button, makeStyles } from '@material-ui/core';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';

const useStyles = makeStyles(theme => ({
  emptyRoot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    backgroundColor: theme.palette.action.hover,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
  },
  icon: {
    fontSize: 40,
    color: theme.palette.text.disabled,
  },
  title: {
    fontWeight: 300,
    fontSize: '1.75rem',
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.primary,
  },
  description: {
    fontSize: 14,
    lineHeight: 1.7,
    color: theme.palette.text.secondary,
    maxWidth: 480,
    marginBottom: theme.spacing(3),
  },
}));

export const TechDocsWrapper = () => {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const [hasDocs, setHasDocs] = useState<boolean | null>(null);

  useEffect(() => {
    catalogApi
      .getEntities({
        filter: [{ 'metadata.annotations.backstage.io/techdocs-ref': '*' }],
        fields: ['metadata.name'],
      })
      .then(response => {
        const items = Array.isArray(response)
          ? response
          : response?.items || [];
        setHasDocs(items.length > 0);
      })
      .catch(() => {
        setHasDocs(false);
      });
  }, [catalogApi]);

  if (hasDocs === null) {
    return null;
  }

  if (hasDocs) {
    return <TechDocsIndexPage />;
  }

  return (
    <Page themeId="documentation">
      <Header
        title="Documentation"
        subtitle="Documentation available in Automation Portal"
      />
      <Content>
        <Box className={classes.emptyRoot}>
          <Box className={classes.iconWrapper}>
            <LibraryBooksIcon className={classes.icon} />
          </Box>
          <Typography variant="h4" className={classes.title}>
            No documentation yet
          </Typography>
          <Typography className={classes.description}>
            Documentation is automatically generated from entities that have a
            TechDocs reference configured. Once your projects or components
            include TechDocs annotations, their documentation will appear here.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            style={{ textTransform: 'none' }}
            href="https://backstage.io/docs/features/techdocs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn about TechDocs
          </Button>
        </Box>
      </Content>
    </Page>
  );
};
