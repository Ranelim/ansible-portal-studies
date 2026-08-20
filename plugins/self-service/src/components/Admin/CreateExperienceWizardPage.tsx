import { useEffect, useMemo, useState } from 'react';
import { Page, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Step,
  StepLabel,
  Stepper,
  Typography,
  makeStyles,
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { writeExperienceSetup } from '../../hooks/experienceSetup';
import { writeBridgeExperienceVisibility } from '../../hooks/bridgeExperienceVisibility';
import { ExperienceThumbnail } from '../IaPlaceholder/experienceVisuals';

const STEPS = ['Plugins', 'Access and roles', 'Notifications', 'Review'];

const PLUGINS = [
  {
    id: 'orchestrator',
    label: 'Automation Orchestrator',
    hint: 'Certified workflows and extra node types for this experience',
    required: true,
  },
  {
    id: 'self-service',
    label: 'Templates and activity',
    hint: 'Run pair for workflows launched from this experience',
    required: false,
  },
];

const SEATS = [
  { id: 'sme', label: 'SME' },
  { id: 'developer', label: 'Developer' },
  { id: 'operator', label: 'Operator' },
  { id: 'admin', label: 'Admin' },
];

const EVENTS = [
  { id: 'workflow-failures', label: 'Workflow failures' },
  { id: 'approvals', label: 'Approvals needed' },
  { id: 'catalog-updates', label: 'Catalog updates' },
];

const useStyles = makeStyles(theme => ({
  column: {
    width: '100%',
    maxWidth: 720,
  },
  back: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 14,
    color: theme.palette.text.secondary,
    padding: '4px 10px',
    marginLeft: theme.spacing(-1),
    marginBottom: theme.spacing(1),
    minWidth: 0,
    borderRadius: 16,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '& .MuiButton-startIcon': {
      marginRight: 6,
    },
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(0.5),
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  subtitle: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: theme.spacing(3),
  },
  stepper: {
    padding: 0,
    marginBottom: theme.spacing(3),
    backgroundColor: 'transparent',
  },
  panel: {
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
  },
  pluginHint: {
    display: 'block',
    marginLeft: 32,
    marginTop: -4,
    marginBottom: 8,
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  reviewLine: {
    fontSize: 14,
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
  },
  pill: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
}));

/**
 * One-time setup for an installed experience (software-template stepper).
 * Does not create an experience at runtime — Enable shows it on the Bridge.
 */
export const CreateExperienceWizardPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [plugins, setPlugins] = useState<Record<string, boolean>>({
    orchestrator: true,
    'self-service': true,
  });
  const [seats, setSeats] = useState<Record<string, boolean>>({
    sme: false,
    developer: true,
    operator: false,
    admin: true,
  });
  const [events, setEvents] = useState<Record<string, boolean>>({
    'workflow-failures': true,
    approvals: true,
    'catalog-updates': false,
  });

  const back = () => navigate('/self-service/admin/experiences');

  useEffect(() => {
    document.title = 'Set up Orchestrator | Automation Portal';
  }, []);

  const seatSummary = useMemo(
    () =>
      SEATS.filter(s => seats[s.id])
        .map(s => s.label)
        .join(', ') || 'None selected',
    [seats],
  );
  const pluginSummary = useMemo(
    () =>
      PLUGINS.filter(p => plugins[p.id])
        .map(p => p.label)
        .join(', '),
    [plugins],
  );
  const eventSummary = useMemo(
    () =>
      EVENTS.filter(e => events[e.id])
        .map(e => e.label)
        .join(', ') || 'None',
    [events],
  );

  const enable = () => {
    writeExperienceSetup('orchestrator', true);
    writeBridgeExperienceVisibility('orchestrator', true);
    navigate('/self-service/admin/experiences');
  };

  return (
    <Page themeId="app">
      <Content>
        <Box className={classes.column}>
          <Button
            className={classes.back}
            variant="text"
            color="inherit"
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={back}
          >
            Experiences
          </Button>
          <Box className={classes.titleRow}>
            <ExperienceThumbnail id="orchestrator" size={32} />
            <Typography className={classes.title} component="h1">
              Set up Orchestrator
            </Typography>
          </Box>
          <Typography className={classes.subtitle}>
            Orchestrator is installed with this Portal instance. Choose plugins,
            seats, and notifications, then enable it for the Bridge and the
            experience switcher.
          </Typography>

          <Stepper activeStep={step} alternativeLabel className={classes.stepper}>
            {STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {step === 0 && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>Plugins</Typography>
              <Typography className={classes.sectionHint}>
                Attach installed capabilities to this experience. Install still
                happens at deployment — this step chooses what users see.
              </Typography>
              {PLUGINS.map(plugin => (
                <Box key={plugin.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={plugins[plugin.id]}
                        disabled={plugin.required}
                        onChange={(_, checked) =>
                          setPlugins(prev => ({ ...prev, [plugin.id]: checked }))
                        }
                      />
                    }
                    label={
                      plugin.required ? (
                        <Box
                          component="span"
                          display="inline-flex"
                          alignItems="center"
                          style={{ gap: 8 }}
                        >
                          {plugin.label}
                          <Chip size="small" label="Required" />
                        </Box>
                      ) : (
                        plugin.label
                      )
                    }
                  />
                  <Typography className={classes.pluginHint} component="span">
                    {plugin.hint}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {step === 1 && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>
                Access and roles
              </Typography>
              <Typography className={classes.sectionHint}>
                Which Portal seats can enter Orchestrator. Fine-grained
                permissions stay in Access Control.
              </Typography>
              {SEATS.map(seat => (
                <FormControlLabel
                  key={seat.id}
                  control={
                    <Checkbox
                      color="primary"
                      checked={seats[seat.id]}
                      onChange={(_, checked) =>
                        setSeats(prev => ({ ...prev, [seat.id]: checked }))
                      }
                    />
                  }
                  label={seat.label}
                />
              ))}
            </Box>
          )}

          {step === 2 && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>
                Notifications
              </Typography>
              <Typography className={classes.sectionHint}>
                Event types this experience can send to the central inbox. Users
                mute types in user settings. Platform channels stay in
                Administration → Notifications.
              </Typography>
              {EVENTS.map(event => (
                <FormControlLabel
                  key={event.id}
                  control={
                    <Checkbox
                      color="primary"
                      checked={events[event.id]}
                      onChange={(_, checked) =>
                        setEvents(prev => ({ ...prev, [event.id]: checked }))
                      }
                    />
                  }
                  label={event.label}
                />
              ))}
            </Box>
          )}

          {step === 3 && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>Review</Typography>
              <Typography className={classes.sectionHint}>
                Enable Orchestrator for the seats below. It then appears on the
                Bridge and in the experience switcher.
              </Typography>
              <Typography className={classes.reviewLine}>
                <strong>Plugins:</strong> {pluginSummary}
              </Typography>
              <Typography className={classes.reviewLine}>
                <strong>Seats:</strong> {seatSummary}
              </Typography>
              <Typography className={classes.reviewLine}>
                <strong>Notifications:</strong> {eventSummary}
              </Typography>
            </Box>
          )}

          <Box className={classes.actions}>
            <Button className={classes.pill} color="primary" onClick={back}>
              Cancel
            </Button>
            {step > 0 && (
              <Button
                className={classes.pill}
                color="primary"
                onClick={() => setStep(s => s - 1)}
              >
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                className={classes.pill}
                color="primary"
                variant="contained"
                onClick={() => setStep(s => s + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                className={classes.pill}
                color="primary"
                variant="contained"
                onClick={enable}
              >
                Enable
              </Button>
            )}
          </Box>
        </Box>
      </Content>
    </Page>
  );
};
