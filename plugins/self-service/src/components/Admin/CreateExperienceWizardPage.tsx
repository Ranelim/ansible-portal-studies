import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CodeIcon from '@material-ui/icons/Code';
import SecurityIcon from '@material-ui/icons/Security';
import RouterIcon from '@material-ui/icons/Router';
import DashboardIcon from '@material-ui/icons/Dashboard';
import type { ComponentType } from 'react';

const STEPS = [
  'Details',
  'Appearance',
  'Seats and access',
  'Plugins',
  'Notifications',
  'Review',
];

const ICONS: Array<{ id: string; label: string; Icon: ComponentType<{ color?: 'primary' | 'action' }> }> = [
  { id: 'automate', label: 'Run', Icon: PlayArrowIcon },
  { id: 'develop', label: 'Develop', Icon: CodeIcon },
  { id: 'compliance', label: 'Compliance', Icon: SecurityIcon },
  { id: 'edge', label: 'Edge', Icon: RouterIcon },
  { id: 'overview', label: 'Overview', Icon: DashboardIcon },
];

const SEATS = [
  { id: 'sme', label: 'SME' },
  { id: 'developer', label: 'Developer' },
  { id: 'operator', label: 'Operator' },
  { id: 'admin', label: 'Admin' },
];

const PLUGINS = [
  {
    id: 'self-service',
    label: 'Self-service (run)',
    hint: 'Templates and Activity in this experience',
  },
  {
    id: 'apme',
    label: 'APME Quality Scanning',
    hint: 'Class B on Git Repositories — not a new rail row',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    hint: 'Class B on Inventories',
  },
  {
    id: 'rhem',
    label: 'RHEM (Edge Manager)',
    hint: 'Class A Edge fleets when installed',
  },
];

const OBJECTS = [
  'Templates and Activity (run pair)',
  'Git Repositories',
  'Collections',
  'Execution environments',
  'Inventories',
  'Edge fleets',
];

const EVENTS = [
  { id: 'template-run-failures', label: 'Template run failures' },
  { id: 'quality-alerts', label: 'Quality alerts' },
  { id: 'compliance-results', label: 'Compliance results' },
  { id: 'fleet-updates', label: 'Fleet updates' },
];

const useStyles = makeStyles(theme => ({
  banner: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    maxWidth: 720,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  preview: {
    height: 22,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'none',
  },
  stepper: {
    padding: theme.spacing(1, 0, 3),
    backgroundColor: 'transparent',
  },
  section: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2),
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: 16,
    marginBottom: theme.spacing(0.5),
  },
  sectionHint: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    lineHeight: 1.45,
    maxWidth: 640,
  },
  field: {
    marginBottom: theme.spacing(2),
    maxWidth: 480,
  },
  iconGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  iconTile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minWidth: 88,
    padding: theme.spacing(1.5, 1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    background: 'none',
    cursor: 'default',
  },
  iconTileOn: {
    borderColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(0, 102, 204, 0.12)'
        : 'rgba(0, 102, 204, 0.06)',
  },
  checkCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  pluginHint: {
    display: 'block',
    marginLeft: 32,
    marginTop: -4,
    marginBottom: 8,
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(1),
  },
  pill: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
}));

/**
 * Concept software template — Administration → Experiences.
 * Not wired. Plugins and Access Control remain the systems of record.
 */
export const CreateExperienceWizardPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const back = () => navigate('/self-service/admin/experiences');

  return (
    <Page themeId="tool">
      <Header
        title={
          <Box className={classes.titleRow}>
            Create experience
            <Tooltip
              title="Preview software template. Not generally available. Does not provision an experience."
              arrow
            >
              <span>
                <Chip
                  size="small"
                  variant="outlined"
                  label="Preview"
                  className={classes.preview}
                  color="primary"
                />
              </span>
            </Tooltip>
          </Box>
        }
        type="Experiences"
        typeLink="/self-service/admin/experiences"
        pageTitleOverride="Create experience"
        subtitle="Software template to propose a Bridge job-mode experience. Plugins and Access Control stay the systems of record."
      />
      <Content>
        <Typography className={classes.banner}>
          Concept wizard — all steps are shown on one page. Create does not
          add a Bridge card. An experience is a durable job world, not a
          plugin folder.
        </Typography>

        <Stepper activeStep={0} alternativeLabel className={classes.stepper}>
          {STEPS.map(label => (
            <Step key={label} completed={false}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>1. Details</Typography>
          <Typography className={classes.sectionHint}>
            Name and describe the job world users enter from the Bridge.
          </Typography>
          <TextField
            className={classes.field}
            label="Name"
            variant="outlined"
            size="small"
            fullWidth
            defaultValue="Operate"
            helperText="Rail and Bridge card title. Prefer a job label, not a product acronym."
          />
          <TextField
            className={classes.field}
            label="Description"
            variant="outlined"
            size="small"
            fullWidth
            multiline
            rows={2}
            defaultValue="Infrastructure and edge operations for inventories and fleets."
          />
          <TextField
            className={classes.field}
            label="Documentation link"
            variant="outlined"
            size="small"
            fullWidth
            defaultValue="https://docs.redhat.com/"
            helperText="Opens from the Bridge card info icon."
          />
        </Box>

        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>2. Appearance</Typography>
          <Typography className={classes.sectionHint}>
            Icon and one-line summary on the Bridge card.
          </Typography>
          <Box className={classes.iconGrid}>
            {ICONS.map(({ id, label, Icon }) => (
              <Box
                key={id}
                className={`${classes.iconTile} ${
                  id === 'compliance' ? classes.iconTileOn : ''
                }`}
              >
                <Icon color={id === 'compliance' ? 'primary' : 'action'} />
                <Typography style={{ fontSize: 12 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
          <TextField
            className={classes.field}
            style={{ marginTop: 16 }}
            label="Bridge card summary"
            variant="outlined"
            size="small"
            fullWidth
            defaultValue="Scan inventories, review findings, and remediate hosts."
          />
        </Box>

        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>
            3. Seats and access
          </Typography>
          <Typography className={classes.sectionHint}>
            Which Portal seats see this experience on the Bridge. Fine-grained
            RBAC stays in Access Control — this is orientation, not a second
            permission model.
          </Typography>
          <Box className={classes.checkCol}>
            {SEATS.map(seat => (
              <FormControlLabel
                key={seat.id}
                control={
                  <Checkbox
                    color="primary"
                    defaultChecked={seat.id !== 'sme'}
                  />
                }
                label={seat.label}
              />
            ))}
          </Box>
          <FormControlLabel
            control={<Switch color="primary" defaultChecked />}
            label="Show on Bridge by default"
          />
        </Box>

        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>4. Plugins</Typography>
          <Typography className={classes.sectionHint}>
            Attach installed capabilities. Install still happens under Plugins.
            Prefer extending an object host (Class B) over a new rail row.
          </Typography>
          {PLUGINS.map(plugin => (
            <Box key={plugin.id}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    defaultChecked={plugin.id === 'compliance'}
                  />
                }
                label={plugin.label}
              />
              <Typography className={classes.pluginHint} component="span">
                {plugin.hint}
              </Typography>
            </Box>
          ))}
          <Typography className={classes.sectionHint} style={{ marginTop: 8 }}>
            Primary objects on the experience rail
          </Typography>
          {OBJECTS.map(name => (
            <FormControlLabel
              key={name}
              control={
                <Checkbox
                  color="primary"
                  defaultChecked={
                    name.startsWith('Templates') || name === 'Inventories'
                  }
                />
              }
              label={name}
            />
          ))}
        </Box>

        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>
            5. Notifications
          </Typography>
          <Typography className={classes.sectionHint}>
            Event types this experience can send to the central inbox. Users
            mute types in User settings. Platform channels stay in
            Administration → Notifications.
          </Typography>
          {EVENTS.map(event => (
            <FormControlLabel
              key={event.id}
              control={
                <Checkbox
                  color="primary"
                  defaultChecked={event.id === 'compliance-results'}
                />
              }
              label={event.label}
            />
          ))}
        </Box>

        <Box className={classes.section}>
          <Typography className={classes.sectionTitle}>6. Review</Typography>
          <Typography className={classes.sectionHint}>
            Operate · Operator and Admin · Compliance plugin on Inventories ·
            Compliance results in the inbox · On Bridge.
          </Typography>
        </Box>

        <Box className={classes.actions}>
          <Button className={classes.pill} color="primary" onClick={back}>
            Cancel
          </Button>
          <Button
            className={classes.pill}
            color="primary"
            variant="contained"
            onClick={back}
          >
            Create
          </Button>
        </Box>
      </Content>
    </Page>
  );
};
