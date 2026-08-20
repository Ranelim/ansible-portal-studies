import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import { PageHelpIcon } from '../common/PageHelpIcon';
import {
  DEMO_CONNECTIONS,
  type ConnectionProvider,
} from '../Admin/syncDemoData';
import { statusColors } from '../common/statusColors';
import { DEVELOP_ADMIN_BASE, DEVELOP_ADMIN_SUBTITLE } from './developAdminShared';

const GIT_IDS = ['github', 'gitlab'];
const COLLECTION_IDS = ['pah'];

const useStyles = makeStyles(theme => ({
  intro: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    maxWidth: 640,
    marginBottom: theme.spacing(1),
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: '1.125rem',
    marginTop: theme.spacing(3),
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: theme.spacing(2),
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: theme.spacing(2),
  },
  card: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    height: '100%',
  },
  cardContent: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  name: {
    fontWeight: 600,
    fontSize: 14,
  },
  meta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: theme.spacing(1.5),
  },
  pill: {
    textTransform: 'none',
    fontSize: 12,
    borderRadius: 20,
  },
}));

const SourceCard = ({ provider }: { provider: ConnectionProvider }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const connected = provider.status === 'Active';
  const configured = provider.status !== 'Not configured';

  const open = () => {
    if (!configured) {
      navigate(`/self-service/admin/integrations/${provider.id}`);
      return;
    }
    navigate(`${DEVELOP_ADMIN_BASE}/content/${provider.id}`);
  };

  return (
    <Card className={classes.card} variant="outlined">
      <CardActionArea onClick={open}>
        <CardContent className={classes.cardContent}>
          <Box className={classes.headerRow}>
            <Typography className={classes.name}>{provider.name}</Typography>
            <Chip
              label={
                connected ? 'Connected' : configured ? 'Error' : 'Not connected'
              }
              size="small"
              style={{
                fontSize: 11,
                height: 22,
                backgroundColor: connected
                  ? 'rgba(99,153,61,0.15)'
                  : configured
                    ? 'rgba(201,25,11,0.15)'
                    : 'rgba(0,0,0,0.06)',
                color: connected
                  ? statusColors.success
                  : configured
                    ? statusColors.error
                    : undefined,
              }}
            />
          </Box>
          <Typography className={classes.meta}>
            {configured
              ? `${provider.host ?? ''} · Last sync ${provider.lastSync ?? '—'}`
              : 'Connect this source in platform Integrations first.'}
          </Typography>
          <Box className={classes.footer}>
            {configured ? (
              <Button
                className={classes.pill}
                size="small"
                color="primary"
                startIcon={<SyncIcon style={{ fontSize: 16 }} />}
                disabled={syncing}
                onClick={event => {
                  event.stopPropagation();
                  setSyncing(true);
                  window.setTimeout(() => setSyncing(false), 2000);
                }}
              >
                {syncing ? 'Syncing…' : 'Sync now'}
              </Button>
            ) : (
              <Box display="flex" alignItems="center" style={{ gap: 6 }}>
                <LinkOffIcon style={{ fontSize: 14, color: '#999' }} />
                <Typography className={classes.meta}>Not configured</Typography>
              </Box>
            )}
            <Box
              display="flex"
              alignItems="center"
              style={{ gap: 4, color: '#0066CC', fontSize: 12 }}
            >
              {configured ? 'Configure' : 'Connect'}{' '}
              <ArrowForwardIcon style={{ fontSize: 14 }} />
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export const DevelopContentPage = () => {
  const classes = useStyles();
  const git = DEMO_CONNECTIONS.filter(c => GIT_IDS.includes(c.id));
  const collections = DEMO_CONNECTIONS.filter(c =>
    COLLECTION_IDS.includes(c.id),
  );

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Content
            <PageHelpIcon
              tooltipLabel="What is Content?"
              title="Develop Content sync"
              description="Which Git and Hub content lands in Develop, and how often it syncs. Credentials stay under platform Administration → Integrations."
            />
          </Box>
        }
        pageTitleOverride="Content"
        subtitle={DEVELOP_ADMIN_SUBTITLE}
      />
      <Content>
        <Typography className={classes.intro}>
          Scope and schedule for Develop objects. GitHub, GitLab, and Private
          Automation Hub connections are in Administration → Integrations.
        </Typography>

        <Typography className={classes.sectionTitle}>Source control</Typography>
        <Typography className={classes.sectionDescription}>
          Repositories that appear under Git Repositories.
        </Typography>
        <Box className={classes.cardGrid}>
          {git.map(provider => (
            <SourceCard key={provider.id} provider={provider} />
          ))}
        </Box>

        <Typography className={classes.sectionTitle}>Collections</Typography>
        <Typography className={classes.sectionDescription}>
          Remotes that feed the Collections catalog.
        </Typography>
        <Box className={classes.cardGrid}>
          {collections.map(provider => (
            <SourceCard key={provider.id} provider={provider} />
          ))}
        </Box>
      </Content>
    </Page>
  );
};
