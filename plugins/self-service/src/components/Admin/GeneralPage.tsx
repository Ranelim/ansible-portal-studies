import { useState } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Collapse,
  IconButton,
  makeStyles,
  Chip,
  LinearProgress,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import LaunchIcon from '@material-ui/icons/Launch';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  sectionCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginTop: 4,
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': { borderBottom: 'none' },
  },
}));

const QUICK_START_STEPS = [
  {
    label: 'Connect to AAP',
    description: 'Connect to Ansible Automation Platform to import job templates, inventories, and credentials.',
    done: true,
    status: 'Connected to aap.example.com',
    link: '/self-service/admin/connections/aap',
  },
  {
    label: 'Select AAP organizations',
    description: 'Choose which AAP organizations to sync users, teams, and content from.',
    done: true,
    status: '3 organizations syncing',
    link: '/self-service/admin/connections/aap',
  },
  {
    label: 'Connect a content registry',
    description: 'Add a Private Automation Hub or Galaxy instance to discover certified and validated collections.',
    done: true,
    status: 'Private Automation Hub connected',
    link: '/self-service/admin/connections/pah',
  },
  {
    label: 'Connect source control',
    description: 'Link GitHub or GitLab to discover repositories and sync automation projects.',
    done: false,
    link: '/self-service/admin/scm',
  },
  {
    label: 'Configure content sync schedule',
    description: 'Set how often the portal syncs content from connected sources. Configure on each connection\'s Sync tab.',
    done: false,
    link: '/self-service/admin/sync-activity',
  },
];

export const GeneralPage = () => {
  const classes = useStyles();
  const doneCount = QUICK_START_STEPS.filter(s => s.done).length;
  const allDone = doneCount === QUICK_START_STEPS.length;
  const [progressOpen, setProgressOpen] = useState(!allDone);

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            General
            <PageHelpIcon
              tooltipLabel="What is the General page?"
              title="General Settings"
              description="View portal configuration and deployment status. Changes to settings on this page require a portal restart to take effect."
            />
          </Box>
        }
        pageTitleOverride="General"
        subtitle="Portal configuration and deployment status. Changes to settings require a portal restart."
      />
      <Content>


        {/* Configuration Progress — collapsible, open by default while steps remain */}
        <Card className={classes.sectionCard} variant="outlined">
          <CardContent style={{ paddingBottom: progressOpen ? undefined : 16 }}>
            <Box
              display="flex" justifyContent="space-between" alignItems="center"
              style={{ cursor: 'pointer' }}
              onClick={() => setProgressOpen(!progressOpen)}
            >
              <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                <Typography className={classes.sectionTitle} style={{ marginBottom: 0 }}>
                  Configuration Progress
                </Typography>
                <Chip
                  label={`${doneCount} of ${QUICK_START_STEPS.length}`}
                  size="small"
                  style={{
                    fontSize: 11,
                    height: 22,
                    backgroundColor: allDone ? 'rgba(99,153,61,0.15)' : 'rgba(77,163,255,0.15)',
                    color: allDone ? statusColors.success : '#4DA3FF',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <IconButton size="small" style={{ marginRight: -8 }}>
                {progressOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {!progressOpen && (
              <Box style={{ marginTop: 10 }}>
                <LinearProgress
                  variant="determinate"
                  value={(doneCount / QUICK_START_STEPS.length) * 100}
                  style={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            )}

            <Collapse in={progressOpen}>
              <Typography className={classes.sectionDescription} style={{ marginTop: 4 }}>
                Track your portal setup. Complete all steps to unlock the full experience.
              </Typography>

              <Box style={{ margin: '12px 0 16px' }}>
                <LinearProgress
                  variant="determinate"
                  value={(doneCount / QUICK_START_STEPS.length) * 100}
                  style={{ height: 6, borderRadius: 3 }}
                />
              </Box>

              {QUICK_START_STEPS.map(step => (
                <Box key={step.label} className={classes.statusRow} style={{ alignItems: 'flex-start', padding: '12px 0' }}>
                  <Box display="flex" alignItems="flex-start" style={{ gap: 10, flex: 1 }}>
                    {step.done ? (
                      <CheckCircleOutlineIcon style={{ fontSize: 18, color: statusColors.success, marginTop: 1 }} />
                    ) : (
                      <RadioButtonUncheckedIcon style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)', marginTop: 1 }} />
                    )}
                    <Box>
                      <Typography style={{ fontSize: 13, fontWeight: 500, color: step.done ? 'inherit' : 'rgba(255,255,255,0.85)' }}>
                        {step.label}
                      </Typography>
                      <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginTop: 2 }}>
                        {step.description}
                      </Typography>
                      {step.done && step.status && (
                        <Typography style={{ fontSize: 12, color: statusColors.success, marginTop: 3 }}>
                          {step.status}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {step.done ? (
                    <Typography style={{ fontSize: 12, color: '#999', flexShrink: 0, marginTop: 1 }}>Done</Typography>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      href={step.link}
                      style={{ textTransform: 'none', fontSize: 12, flexShrink: 0, marginTop: -1 }}
                    >
                      Configure
                    </Button>
                  )}
                </Box>
              ))}

              <Box style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Button
                  size="small"
                  color="primary"
                  startIcon={<LaunchIcon style={{ fontSize: 14 }} />}
                  style={{ textTransform: 'none', fontSize: 12 }}
                >
                  Open Quick Start guide
                </Button>
              </Box>
            </Collapse>
          </CardContent>
        </Card>


        {/* System Information */}
        <Card className={classes.sectionCard} variant="outlined">
          <CardContent>
            <Box marginBottom={2}>
              <Typography className={classes.sectionTitle}>System Information</Typography>
              <Typography className={classes.sectionDescription}>
                Portal deployment details.
              </Typography>
            </Box>

            <Box className={classes.statusRow}>
              <Typography style={{ fontSize: 13, color: '#999' }}>Deployment mode</Typography>
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>Local development</Typography>
            </Box>
            <Box className={classes.statusRow}>
              <Typography style={{ fontSize: 13, color: '#999' }}>Portal version</Typography>
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>1.0.0-dev</Typography>
            </Box>
            <Box className={classes.statusRow}>
              <Typography style={{ fontSize: 13, color: '#999' }}>Portal base URL</Typography>
              <Typography style={{ fontSize: 13, fontWeight: 500 }}>https://portal.example.com</Typography>
            </Box>
          </CardContent>
        </Card>
      </Content>
    </Page>
  );
};
