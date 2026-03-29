import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  makeStyles,
} from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import SyncIcon from '@material-ui/icons/Sync';
import {
  PIPELINE_PROFILES,
  type PipelineProfile,
  type PolicyCheck,
} from '../Projects/catalog/unifiedDemoData';
import { DismissibleBanner } from '../common/DismissibleBanner';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { statusColors } from '../common/statusColors';
import { LastSyncedIndicator } from '../Admin/LastSyncedIndicator';
import { DEMO_CONNECTIONS } from './syncDemoData';

const useStyles = makeStyles(theme => ({
  sectionTitle: {
    fontWeight: 600,
    fontSize: '1.125rem',
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3),
    '&:first-of-type': {
      marginTop: 0,
    },
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  card: {
    borderRadius: 12,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  profileTitle: {
    fontWeight: 600,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  },
  profileDescription: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
    lineHeight: 1.5,
  },
  stageFlow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(0.25),
    marginBottom: theme.spacing(1.5),
  },
  stageChip: {
    fontSize: 11,
    fontWeight: 500,
    height: 22,
  },
  flowChevron: {
    fontSize: 16,
    color: theme.palette.text.disabled,
  },
  policyRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    '&:first-of-type': {
      borderTop: 'none',
      paddingTop: 0,
    },
  },
  policyName: {
    fontSize: 13,
    fontWeight: 500,
    flex: 1,
    minWidth: 0,
  },
  policyMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  orgSyncLine: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
  pacCard: {
    borderRadius: 12,
    maxWidth: 720,
  },
  pacRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  connectedLine: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    fontSize: 14,
  },
  orgPolicyListTitle: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
}));

const aapConnection = DEMO_CONNECTIONS.find(c => c.type === 'aap');
const aapDisplayUrl = aapConnection?.host
  ? `https://${aapConnection.host}`
  : 'https://aap-controller.example.com';
const aapLastSynced = aapConnection?.lastSync ?? '12 minutes ago';

const ORG_DEFAULT_POLICIES =
  PIPELINE_PROFILES.find(p => p.id === 'org-default')?.policies ?? [];

function severityColor(severity: PolicyCheck['severity']): string {
  switch (severity) {
    case 'critical':
      return statusColors.error;
    case 'high':
      return '#e65100';
    case 'medium':
      return statusColors.star;
    case 'low':
      return statusColors.pending;
    default:
      return statusColors.pending;
  }
}

function sourceLabel(source: PipelineProfile['source']): string {
  switch (source) {
    case 'built-in':
      return 'Built-in';
    case 'organization':
      return 'Organization';
    case 'custom':
      return 'Custom';
    default:
      return source;
  }
}

const ProfileCard = ({ profile }: { profile: PipelineProfile }) => {
  const classes = useStyles();
  const isBuiltIn = profile.source === 'built-in';
  const isOrganization = profile.source === 'organization';

  return (
    <Card className={classes.card} variant="outlined">
      <CardContent>
        <Box className={classes.cardHeader}>
          <Typography className={classes.profileTitle} component="div">
            {isBuiltIn && (
              <LockIcon style={{ fontSize: 18, color: statusColors.pending }} />
            )}
            {profile.name}
          </Typography>
          <Chip
            label={sourceLabel(profile.source)}
            size="small"
            variant="outlined"
            style={{ fontSize: 11, fontWeight: 500 }}
          />
        </Box>
        <Typography className={classes.profileDescription}>
          {profile.description}
        </Typography>
        <Typography variant="caption" color="textSecondary" style={{ fontWeight: 600 }}>
          {profile.stages.length} stages
        </Typography>
        <Box className={classes.stageFlow}>
          {profile.stages.map((stage, i) => (
            <Box key={stage} display="flex" alignItems="center">
              {i > 0 && <ChevronRightIcon className={classes.flowChevron} />}
              <Chip label={stage} size="small" className={classes.stageChip} variant="outlined" />
            </Box>
          ))}
        </Box>
        {isOrganization && (
          <Box className={classes.orgSyncLine}>
            <Typography variant="body2" style={{ fontSize: 12, fontWeight: 500 }}>
              Synced from AAP
            </Typography>
            <LastSyncedIndicator source="AAP" timeAgo={aapLastSynced} />
          </Box>
        )}
        <Box>
          {profile.policies.map(policy => (
            <Box key={policy.id} className={classes.policyRow}>
              <Box flex={1} minWidth={0}>
                <Typography className={classes.policyName}>{policy.name}</Typography>
                <Typography className={classes.policyMeta}>{policy.description}</Typography>
                {policy.standard && (
                  <Typography className={classes.policyMeta}>{policy.standard}</Typography>
                )}
              </Box>
              <Chip
                label={policy.severity}
                size="small"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  color: severityColor(policy.severity),
                  borderColor: severityColor(policy.severity),
                }}
                variant="outlined"
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export const PipelinePoliciesPage = () => {
  const classes = useStyles();
  const [syncing, setSyncing] = useState(false);

  const handleSyncNow = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1500);
  };

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Pipeline policies
            <PageHelpIcon
              tooltipLabel="What are pipeline policies?"
              title="What are pipeline policies?"
              description="Pipeline policies define which checks and stages run when automation content is validated in CI. Profiles group stages and policy-as-code rules so teams can apply consistent governance to Git repositories."
            />
          </Box>
        }
        pageTitleOverride="Pipeline policies"
        subtitle="Manage pipeline profiles and policy-as-code configurations"
      />
      <Content>
        <DismissibleBanner
          storageKey="admin-pipeline-policies"
          message="Pipeline profiles define the governance stages applied to Git repositories when content is validated and promoted. Built-in profiles ship with the portal; organization profiles sync from Ansible Automation Platform."
        />
        <Typography className={classes.sectionTitle}>Pipeline profiles</Typography>
        <Box className={classes.cardGrid}>
          {PIPELINE_PROFILES.map(profile => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </Box>

        <Typography className={classes.sectionTitle}>Policy-as-code configuration</Typography>
        <Card className={classes.pacCard} variant="outlined">
          <CardContent>
            <Typography style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
              Organizational policies from Ansible Automation Platform
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Organizational policies are pulled from AAP so rule changes made by your platform team apply on the next sync without redeploying the portal.
            </Typography>
            <Box className={classes.pacRow}>
              <Box className={classes.connectedLine}>
                <CheckCircleOutlineIcon style={{ color: statusColors.success, fontSize: 20 }} />
                <Typography variant="body2">
                  Connected to {aapDisplayUrl}
                </Typography>
              </Box>
              <LastSyncedIndicator source="AAP" timeAgo={aapLastSynced} />
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<SyncIcon />}
                onClick={handleSyncNow}
                disabled={syncing}
                style={{ textTransform: 'none', fontWeight: 500 }}
              >
                {syncing ? 'Syncing…' : 'Sync now'}
              </Button>
            </Box>
            <Typography className={classes.orgPolicyListTitle}>
              Active organization policies
            </Typography>
            <Box>
              {ORG_DEFAULT_POLICIES.map(policy => (
                <Box key={policy.id} className={classes.policyRow}>
                  <Box flex={1} minWidth={0}>
                    <Typography className={classes.policyName}>{policy.name}</Typography>
                    <Typography className={classes.policyMeta}>{policy.description}</Typography>
                  </Box>
                  <Chip
                    label={policy.severity}
                    size="small"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      color: severityColor(policy.severity),
                      borderColor: severityColor(policy.severity),
                    }}
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Content>
    </Page>
  );
};
