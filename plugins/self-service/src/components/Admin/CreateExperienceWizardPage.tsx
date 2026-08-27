import { useEffect, useMemo, useState } from 'react';
import { Page, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  writeExperienceSetup,
  type SetupExperienceId,
  SETUP_EXPERIENCE_IDS,
} from '../../hooks/experienceSetup';
import { writeBridgeExperienceVisibility } from '../../hooks/bridgeExperienceVisibility';
import { readNavPlugins, writeNavPlugins } from '../../hooks/useNavPlugins';
import { writeConnectionSetup } from '../../hooks/connectionSetup';
import { ExperienceThumbnail } from '../IaPlaceholder/experienceVisuals';
import { EXPERIENCE_LABELS } from '../../hooks/useNavIaModel';

type GitProvider = 'github' | 'gitlab';
type GitTestStatus = 'idle' | 'testing' | 'ok' | 'error';

const ENABLEMENT_STEPS = ['Plugins', 'Access and roles', 'Notifications', 'Review'];
const DEVELOP_STEPS = ['Git', 'Hub', 'Access and roles', 'Review'];

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

type PluginChoice = {
  id: string;
  label: string;
  hint: string;
  required: boolean;
};

type WizardConfig = {
  subtitle: string;
  kind: 'develop' | 'enablement';
  steps: string[];
  plugins: PluginChoice[];
  defaultPlugins: Record<string, boolean>;
  defaultSeats: Record<string, boolean>;
};

const WIZARDS: Record<SetupExperienceId, WizardConfig> = {
  develop: {
    kind: 'develop',
    steps: DEVELOP_STEPS,
    subtitle:
      'Connect Git so developers can work with repositories. Private Automation Hub is optional — skip it if you do not need Hub collections yet.',
    plugins: [],
    defaultPlugins: {},
    defaultSeats: {
      sme: false,
      developer: true,
      operator: false,
      admin: true,
    },
  },
  compliance: {
    kind: 'enablement',
    steps: ENABLEMENT_STEPS,
    subtitle:
      'Choose plugins, seats, and notifications, then enable Compliance on the Experiences Bridge.',
    plugins: [
      {
        id: 'compliance',
        label: 'Compliance',
        hint: 'Scan inventories, review findings, and remediate hosts',
        required: true,
      },
      {
        id: 'self-service',
        label: 'Templates and activity',
        hint: 'Run pair for jobs launched from this experience',
        required: false,
      },
    ],
    defaultPlugins: { compliance: true, 'self-service': true },
    defaultSeats: {
      sme: false,
      developer: false,
      operator: true,
      admin: true,
    },
  },
  edge: {
    kind: 'enablement',
    steps: ENABLEMENT_STEPS,
    subtitle:
      'Choose plugins, seats, and notifications, then enable Edge on the Experiences Bridge.',
    plugins: [
      {
        id: 'rhem',
        label: 'Red Hat Edge Manager',
        hint: 'Device fleets, desired state, and updates',
        required: true,
      },
      {
        id: 'self-service',
        label: 'Templates and activity',
        hint: 'Run pair for jobs launched from this experience',
        required: false,
      },
    ],
    defaultPlugins: { rhem: true, 'self-service': true },
    defaultSeats: {
      sme: false,
      developer: false,
      operator: true,
      admin: true,
    },
  },
  orchestrator: {
    kind: 'enablement',
    steps: ENABLEMENT_STEPS,
    subtitle:
      'Orchestrator is installed with this Portal instance. Choose plugins, seats, and notifications, then enable it for the Bridge and the experience switcher.',
    plugins: [
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
    ],
    defaultPlugins: { orchestrator: true, 'self-service': true },
    defaultSeats: {
      sme: false,
      developer: true,
      operator: false,
      admin: true,
    },
  },
};

function isSetupExperienceId(id: string): id is SetupExperienceId {
  return (SETUP_EXPERIENCE_IDS as string[]).includes(id);
}

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
  fieldGroup: {
    marginBottom: theme.spacing(2),
  },
  fieldLabel: {
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
    lineHeight: 1.45,
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
 * One-time setup for an installed experience.
 * Enable shows it on the Bridge with Launch instead of Setup.
 */
export const CreateExperienceWizardPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { experienceId } = useParams<{ experienceId: string }>();
  const fromBridge = (location.state as { from?: string } | null)?.from === 'bridge';

  if (!experienceId || !isSetupExperienceId(experienceId)) {
    return <Navigate to="/self-service/admin/experiences" replace />;
  }

  return (
    <ExperienceSetupWizard
      key={experienceId}
      experienceId={experienceId}
      fromBridge={fromBridge}
      classes={classes}
      navigate={navigate}
    />
  );
};

const ExperienceSetupWizard = ({
  experienceId,
  fromBridge,
  classes,
  navigate,
}: {
  experienceId: SetupExperienceId;
  fromBridge: boolean;
  classes: ReturnType<typeof useStyles>;
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const config = WIZARDS[experienceId];
  const label = EXPERIENCE_LABELS[experienceId];
  const [step, setStep] = useState(0);
  const [plugins, setPlugins] = useState<Record<string, boolean>>(
    config.defaultPlugins,
  );
  const [seats, setSeats] = useState<Record<string, boolean>>(config.defaultSeats);
  const [events, setEvents] = useState<Record<string, boolean>>({
    'workflow-failures': true,
    approvals: true,
    'catalog-updates': false,
  });
  const [gitProvider, setGitProvider] = useState<GitProvider>('github');
  const [gitHost, setGitHost] = useState('https://github.com');
  const [gitToken, setGitToken] = useState('');
  const [gitAuth, setGitAuth] = useState<'token' | 'oauth'>('token');
  const [gitTest, setGitTest] = useState<GitTestStatus>('idle');
  const [hubSkipped, setHubSkipped] = useState(true);
  const [hubInherit, setHubInherit] = useState(true);
  const [hubUrl, setHubUrl] = useState('');
  const [hubToken, setHubToken] = useState('');

  const backTo = fromBridge
    ? '/self-service/experiences'
    : '/self-service/admin/experiences';

  useEffect(() => {
    document.title = `Set up ${label} | Automation Portal`;
  }, [label]);

  useEffect(() => {
    setGitHost(gitProvider === 'github' ? 'https://github.com' : 'https://gitlab.com');
    setGitTest('idle');
  }, [gitProvider]);

  const seatSummary = useMemo(
    () =>
      SEATS.filter(s => seats[s.id])
        .map(s => s.label)
        .join(', ') || 'None selected',
    [seats],
  );
  const pluginSummary = useMemo(
    () =>
      config.plugins
        .filter(p => plugins[p.id])
        .map(p => p.label)
        .join(', ') || 'None selected',
    [config.plugins, plugins],
  );
  const eventSummary = useMemo(
    () =>
      EVENTS.filter(e => events[e.id])
        .map(e => e.label)
        .join(', ') || 'None',
    [events],
  );

  const gitOk = gitTest === 'ok';
  const canAdvanceGit = gitOk;
  const isLast = step >= config.steps.length - 1;
  const gitStep = config.kind === 'develop' && step === 0;
  const hubStep = config.kind === 'develop' && step === 1;

  const testGit = () => {
    if (!gitHost.trim() || !gitToken.trim()) {
      setGitTest('error');
      return;
    }
    setGitTest('testing');
    window.setTimeout(() => setGitTest('ok'), 600);
  };

  const enable = () => {
    if (config.kind === 'develop' && !gitOk) return;
    writeExperienceSetup(experienceId, true);
    writeBridgeExperienceVisibility(experienceId, true);
    if (config.kind === 'develop') {
      writeConnectionSetup(gitProvider, true);
      if (!hubSkipped) writeConnectionSetup('pah', true);
    }
    if (experienceId === 'edge') {
      const current = readNavPlugins();
      writeNavPlugins({ ...current, rhem: true });
    }
    if (experienceId === 'compliance') {
      const current = readNavPlugins();
      writeNavPlugins({ ...current, compliance: true });
    }
    navigate('/self-service/experiences');
  };

  const next = () => {
    if (gitStep && !canAdvanceGit) return;
    setStep(s => s + 1);
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
            onClick={() => navigate(backTo)}
          >
            Experiences
          </Button>
          <Box className={classes.titleRow}>
            <ExperienceThumbnail id={experienceId} size={32} />
            <Typography className={classes.title} component="h1">
              Set up {label}
            </Typography>
          </Box>
          <Typography className={classes.subtitle}>{config.subtitle}</Typography>

          <Stepper activeStep={step} alternativeLabel className={classes.stepper}>
            {config.steps.map(stepLabel => (
              <Step key={stepLabel}>
                <StepLabel>{stepLabel}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {gitStep && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>
                Connect Git
              </Typography>
              <Typography className={classes.sectionHint}>
                Developers need a working Git connection before Develop can
                launch. Test the connection, then continue. This is the same
                GitHub or GitLab setup as Administration → Integrations.
              </Typography>
              <FormControl
                variant="outlined"
                size="small"
                className={classes.fieldGroup}
                fullWidth
              >
                <InputLabel id="git-provider-label">Provider</InputLabel>
                <Select
                  labelId="git-provider-label"
                  label="Provider"
                  value={gitProvider}
                  onChange={e => {
                    setGitProvider(e.target.value as GitProvider);
                    setGitToken('');
                  }}
                >
                  <MenuItem value="github">GitHub</MenuItem>
                  <MenuItem value="gitlab">GitLab</MenuItem>
                </Select>
              </FormControl>
              <Box className={classes.fieldGroup}>
                <Typography className={classes.fieldLabel} component="label">
                  {gitProvider === 'github' ? 'GitHub' : 'GitLab'} host URL
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={gitHost}
                  onChange={e => {
                    setGitHost(e.target.value);
                    setGitTest('idle');
                  }}
                  placeholder={
                    gitProvider === 'github'
                      ? 'https://github.com'
                      : 'https://gitlab.com'
                  }
                />
                <Typography className={classes.helperText}>
                  Use the default for the public host, or enter your self-hosted
                  instance URL.
                </Typography>
              </Box>
              <Typography className={classes.fieldLabel}>
                Authentication
              </Typography>
              <RadioGroup
                value={gitAuth}
                onChange={e => setGitAuth(e.target.value as 'token' | 'oauth')}
              >
                <FormControlLabel
                  value="token"
                  control={<Radio color="primary" size="small" />}
                  label="Personal access token"
                />
                {gitAuth === 'token' && (
                  <Box className={classes.fieldGroup} style={{ marginLeft: 32 }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      type="password"
                      placeholder="Enter access token"
                      value={gitToken}
                      onChange={e => {
                        setGitToken(e.target.value);
                        setGitTest('idle');
                      }}
                    />
                    <Typography className={classes.helperText}>
                      A token with read access to the organizations you want to
                      scan.
                    </Typography>
                  </Box>
                )}
                <FormControlLabel
                  value="oauth"
                  control={<Radio color="primary" size="small" />}
                  label="OAuth application"
                />
                {gitAuth === 'oauth' && (
                  <Alert severity="info" style={{ marginBottom: 16 }}>
                    Prototype: use a personal access token to test the
                    connection. OAuth registration stays in Administration →
                    Integrations.
                  </Alert>
                )}
              </RadioGroup>
              <Box display="flex" alignItems="center" style={{ gap: 12 }}>
                <Button
                  className={classes.pill}
                  variant="outlined"
                  color="primary"
                  disabled={gitTest === 'testing' || gitAuth !== 'token'}
                  onClick={testGit}
                  startIcon={
                    gitTest === 'testing' ? (
                      <CircularProgress size={14} />
                    ) : undefined
                  }
                >
                  {gitTest === 'testing' ? 'Testing…' : 'Test connection'}
                </Button>
              </Box>
              {gitTest === 'ok' && (
                <Alert severity="success" style={{ marginTop: 16 }}>
                  Connection succeeded. You can continue.
                </Alert>
              )}
              {gitTest === 'error' && (
                <Alert severity="error" style={{ marginTop: 16 }}>
                  Enter a host URL and access token, then test the connection.
                </Alert>
              )}
            </Box>
          )}

          {hubStep && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>
                Private Automation Hub
              </Typography>
              <Typography className={classes.sectionHint}>
                Optional. Skip this step if you do not need Hub collections yet.
                You can connect Hub later in Administration → Integrations.
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={hubSkipped}
                    onChange={(_, checked) => setHubSkipped(checked)}
                  />
                }
                label="Skip Hub for now"
              />
              {!hubSkipped && (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        checked={hubInherit}
                        onChange={(_, checked) => setHubInherit(checked)}
                      />
                    }
                    label="Use the Ansible Automation Platform connection"
                  />
                  {!hubInherit && (
                    <>
                      <Box className={classes.fieldGroup}>
                        <Typography className={classes.fieldLabel}>
                          Private Automation Hub URL
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="small"
                          placeholder="https://pah.example.com"
                          value={hubUrl}
                          onChange={e => setHubUrl(e.target.value)}
                        />
                      </Box>
                      <Box className={classes.fieldGroup}>
                        <Typography className={classes.fieldLabel}>
                          API token
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="small"
                          type="password"
                          placeholder="Enter token"
                          value={hubToken}
                          onChange={e => setHubToken(e.target.value)}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}
            </Box>
          )}

          {config.kind === 'enablement' && step === 0 && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>Plugins</Typography>
              <Typography className={classes.sectionHint}>
                Attach installed capabilities to this experience. Install still
                happens at deployment — this step chooses what users see.
              </Typography>
              {config.plugins.map(plugin => (
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

          {((config.kind === 'enablement' && step === 1) ||
            (config.kind === 'develop' && step === 2)) && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>
                Access and roles
              </Typography>
              <Typography className={classes.sectionHint}>
                Which Portal seats can enter {label}. Fine-grained permissions
                stay in Access Control.
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

          {config.kind === 'enablement' && step === 2 && (
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

          {isLast && (
            <Box className={classes.panel}>
              <Typography className={classes.sectionTitle}>Review</Typography>
              <Typography className={classes.sectionHint}>
                Enable {label} for the seats below. It then appears on the Bridge
                with Launch.
              </Typography>
              {config.kind === 'develop' ? (
                <>
                  <Typography className={classes.reviewLine}>
                    <strong>Git:</strong>{' '}
                    {gitProvider === 'github' ? 'GitHub' : 'GitLab'} ({gitHost})
                    — connected
                  </Typography>
                  <Typography className={classes.reviewLine}>
                    <strong>Private Automation Hub:</strong>{' '}
                    {hubSkipped ? 'Skipped' : hubInherit ? 'Using AAP connection' : hubUrl || 'Configured'}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography className={classes.reviewLine}>
                    <strong>Plugins:</strong> {pluginSummary}
                  </Typography>
                  <Typography className={classes.reviewLine}>
                    <strong>Notifications:</strong> {eventSummary}
                  </Typography>
                </>
              )}
              <Typography className={classes.reviewLine}>
                <strong>Seats:</strong> {seatSummary}
              </Typography>
            </Box>
          )}

          <Box className={classes.actions}>
            <Button
              className={classes.pill}
              color="primary"
              onClick={() => navigate(backTo)}
            >
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
            {hubStep && (
              <Button
                className={classes.pill}
                color="primary"
                onClick={() => {
                  setHubSkipped(true);
                  setStep(s => s + 1);
                }}
              >
                Skip
              </Button>
            )}
            {!isLast ? (
              <Button
                className={classes.pill}
                color="primary"
                variant="contained"
                disabled={gitStep && !canAdvanceGit}
                onClick={next}
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
