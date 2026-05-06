import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Paper,
  LinearProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import TransformIcon from '@material-ui/icons/Transform';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import DescriptionIcon from '@material-ui/icons/Description';
import { statusColors } from '../../common/statusColors';

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    maxWidth: 680,
    borderRadius: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerIcon: {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1.5),
    fontSize: 28,
  },
  stepper: {
    padding: theme.spacing(1, 0, 2),
    backgroundColor: 'transparent',
  },
  sourceCard: {
    padding: theme.spacing(2),
    borderRadius: 8,
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  analysisStat: {
    textAlign: 'center',
    padding: theme.spacing(1.5),
    borderRadius: 8,
    flex: 1,
    minWidth: 80,
  },
  mappingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    borderRadius: 6,
    marginBottom: 4,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  arrow: {
    color: theme.palette.text.disabled,
    fontSize: 18,
    flexShrink: 0,
  },
  resultCard: {
    padding: theme.spacing(3),
    borderRadius: 12,
    textAlign: 'center',
    border: `1px solid ${statusColors.success}40`,
  },
}));

const STEPS = ['Source', 'Analysis', 'Configure', 'Review'];

type SourceType = 'chef' | 'puppet';

interface MappingItem {
  source: string;
  sourceType: string;
  target: string;
  targetType: string;
  confidence: 'high' | 'medium' | 'low';
}

const DEMO_MAPPINGS: MappingItem[] = [
  { source: 'recipes/default.rb', sourceType: 'Recipe', target: 'roles/webserver/tasks/main.yml', targetType: 'Role', confidence: 'high' },
  { source: 'recipes/configure.rb', sourceType: 'Recipe', target: 'roles/webserver/tasks/configure.yml', targetType: 'Tasks', confidence: 'high' },
  { source: 'recipes/firewall.rb', sourceType: 'Recipe', target: 'roles/webserver/tasks/firewall.yml', targetType: 'Tasks', confidence: 'medium' },
  { source: 'templates/nginx.conf.erb', sourceType: 'Template', target: 'roles/webserver/templates/nginx.conf.j2', targetType: 'Template', confidence: 'high' },
  { source: 'attributes/default.rb', sourceType: 'Attributes', target: 'roles/webserver/defaults/main.yml', targetType: 'Defaults', confidence: 'high' },
  { source: 'metadata.rb', sourceType: 'Metadata', target: 'galaxy.yml', targetType: 'Collection meta', confidence: 'medium' },
  { source: 'Berksfile', sourceType: 'Dependencies', target: 'requirements.yml', targetType: 'Dependencies', confidence: 'low' },
];

const CONFIDENCE_COLORS: Record<string, string> = {
  high: statusColors.success,
  medium: '#F0AB00',
  low: statusColors.error,
};

interface MigrateToAnsibleWizardProps {
  open: boolean;
  sourceRepoName?: string | null;
  onClose: () => void;
  onComplete: (newRepoName: string) => void;
}

export const MigrateToAnsibleWizard = ({
  open,
  sourceRepoName,
  onClose,
  onComplete,
}: MigrateToAnsibleWizardProps) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('chef');
  const [targetName, setTargetName] = useState('');
  const [targetOrg, setTargetOrg] = useState('acme-corp');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (open && sourceRepoName) {
      setSourceUrl(`https://github.com/acme-corp/${sourceRepoName}`);
      setTargetName(`${sourceRepoName}-ansible`);
      setSourceType('chef');
    }
    if (!open) {
      setActiveStep(0);
      setSourceUrl('');
      setTargetName('');
      setAnalyzing(false);
    }
  }, [open, sourceRepoName]);

  const handleNext = useCallback(() => {
    if (activeStep === 0) {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setActiveStep(1);
      }, 2000);
    } else if (activeStep === 3) {
      onComplete(targetName);
    } else {
      setActiveStep(prev => prev + 1);
    }
  }, [activeStep, targetName, onComplete]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const canProceed = () => {
    if (activeStep === 0) return sourceUrl.trim().length > 0;
    if (activeStep === 2) return targetName.trim().length > 0;
    return true;
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 8 }}>
              Migrate automation content from Chef or Puppet to Ansible. The tool will analyze the source repository, map content to Ansible equivalents, and create a new Git repository with the migrated Ansible project.
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 20, fontSize: 12 }}>
              The source repository will not be modified.
            </Typography>
            <TextField
              label="Source repository URL"
              fullWidth
              variant="outlined"
              size="small"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://github.com/org/chef-cookbook"
              helperText="The Git repository containing the Chef or Puppet content to migrate"
              style={{ marginBottom: 16 }}
            />
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Source type</InputLabel>
              <Select
                value={sourceType}
                onChange={e => setSourceType(e.target.value as SourceType)}
                label="Source type"
              >
                <MenuItem value="chef">Chef (Cookbooks)</MenuItem>
                <MenuItem value="puppet">Puppet (Manifests)</MenuItem>
              </Select>
            </FormControl>
            {analyzing && (
              <Box style={{ marginTop: 24 }}>
                <Typography variant="body2" style={{ marginBottom: 8, fontWeight: 500 }}>
                  Analyzing repository...
                </Typography>
                <LinearProgress />
                <Typography variant="caption" color="textSecondary" style={{ marginTop: 4, display: 'block' }}>
                  Scanning content structure and identifying migration candidates
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Paper variant="outlined" className={classes.sourceCard}>
              <FolderOpenIcon style={{ fontSize: 32, color: statusColors.info }} />
              <Box>
                <Typography style={{ fontWeight: 600, fontSize: 14 }}>
                  {sourceRepoName || 'chef-webserver'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Chef cookbook · 4 recipes · 2 templates · 12 resources
                </Typography>
              </Box>
            </Paper>

            <Box display="flex" style={{ gap: 12, marginBottom: 20 }}>
              <Paper variant="outlined" className={classes.analysisStat}>
                <Typography style={{ fontSize: 24, fontWeight: 700, color: statusColors.success }}>85%</Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>Auto-migratable</Typography>
              </Paper>
              <Paper variant="outlined" className={classes.analysisStat}>
                <Typography style={{ fontSize: 24, fontWeight: 700 }}>7</Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>Content items</Typography>
              </Paper>
              <Paper variant="outlined" className={classes.analysisStat}>
                <Typography style={{ fontSize: 24, fontWeight: 700, color: '#F0AB00' }}>1</Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>Needs review</Typography>
              </Paper>
              <Paper variant="outlined" className={classes.analysisStat}>
                <Typography style={{ fontSize: 24, fontWeight: 700, color: statusColors.success }}>5</Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>High confidence</Typography>
              </Paper>
            </Box>

            <Typography style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Content mapping
            </Typography>
            <Paper variant="outlined" style={{ borderRadius: 8 }}>
              {DEMO_MAPPINGS.map((m, i) => (
                <Box key={i} className={classes.mappingRow} style={i < DEMO_MAPPINGS.length - 1 ? { borderBottom: '1px solid #eee' } : {}}>
                  <DescriptionIcon style={{ fontSize: 16, color: '#999' }} />
                  <Box flex={1} minWidth={0}>
                    <Typography style={{ fontSize: 12, fontFamily: 'monospace' }} noWrap>{m.source}</Typography>
                    <Typography style={{ fontSize: 10, color: '#999' }}>{m.sourceType}</Typography>
                  </Box>
                  <Typography className={classes.arrow}>→</Typography>
                  <Box flex={1} minWidth={0}>
                    <Typography style={{ fontSize: 12, fontFamily: 'monospace' }} noWrap>{m.target}</Typography>
                    <Typography style={{ fontSize: 10, color: '#999' }}>{m.targetType}</Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={m.confidence}
                    style={{
                      fontSize: 10,
                      height: 18,
                      backgroundColor: `${CONFIDENCE_COLORS[m.confidence]}18`,
                      color: CONFIDENCE_COLORS[m.confidence],
                      fontWeight: 600,
                    }}
                  />
                </Box>
              ))}
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
              Configure where the new Ansible project will be created and how it should be structured.
            </Typography>

            <Typography style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Git repository
            </Typography>
            <FormControl variant="outlined" size="small" fullWidth style={{ marginBottom: 12 }}>
              <InputLabel>SCM provider</InputLabel>
              <Select defaultValue="github" label="SCM provider">
                <MenuItem value="github">GitHub — github.com</MenuItem>
                <MenuItem value="gitlab">GitLab — gitlab.com</MenuItem>
                <MenuItem value="github-ent">GitHub Enterprise — git.acme-corp.com</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Organization / Group"
              fullWidth
              variant="outlined"
              size="small"
              value={targetOrg}
              onChange={e => setTargetOrg(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <TextField
              label="Repository name"
              fullWidth
              variant="outlined"
              size="small"
              value={targetName}
              onChange={e => setTargetName(e.target.value)}
              helperText={`Will create: ${targetOrg}/${targetName}`}
              style={{ marginBottom: 12 }}
            />
            <TextField
              label="Default branch"
              fullWidth
              variant="outlined"
              size="small"
              defaultValue="main"
              style={{ marginBottom: 20 }}
            />

            <Typography style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Ansible project
            </Typography>
            <FormControl variant="outlined" size="small" fullWidth style={{ marginBottom: 12 }}>
              <InputLabel>Target structure</InputLabel>
              <Select defaultValue="collection" label="Target structure">
                <MenuItem value="collection">Ansible Collection</MenuItem>
                <MenuItem value="role">Standalone Role</MenuItem>
                <MenuItem value="playbook">Playbook Repository</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Run quality scan after creation</InputLabel>
              <Select defaultValue="yes" label="Run quality scan after creation">
                <MenuItem value="yes">Yes — run a full quality scan</MenuItem>
                <MenuItem value="no">No — I will scan later</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Paper variant="outlined" className={classes.resultCard}>
              <CheckCircleIcon style={{ fontSize: 48, color: statusColors.success, marginBottom: 8 }} />
              <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                Ready to migrate
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
                A new Ansible project will be created with the migrated content and an initial quality scan.
              </Typography>
              <Box display="flex" justifyContent="center" style={{ gap: 24 }}>
                <Box>
                  <Typography style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>Source</Typography>
                  <Typography style={{ fontSize: 13, fontWeight: 500 }}>{sourceRepoName || 'chef-webserver'}</Typography>
                  <Chip size="small" label="Chef" style={{ fontSize: 10, height: 18, marginTop: 4 }} />
                </Box>
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                  <TransformIcon style={{ fontSize: 24, color: statusColors.info }} />
                </Box>
                <Box>
                  <Typography style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>Target</Typography>
                  <Typography style={{ fontSize: 13, fontWeight: 500 }}>{targetOrg}/{targetName}</Typography>
                  <Chip size="small" label="Ansible" style={{ fontSize: 10, height: 18, marginTop: 4, backgroundColor: `${statusColors.success}20`, color: statusColors.success }} />
                </Box>
              </Box>
            </Paper>

            <Box style={{ marginTop: 16 }}>
              <Typography style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                This will:
              </Typography>
              <Box component="ul" style={{ margin: 0, paddingLeft: 20 }}>
                <li>
                  <Typography variant="body2" style={{ fontSize: 13 }}>
                    Create a new Git repository <strong>{targetOrg}/{targetName}</strong>
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" style={{ fontSize: 13 }}>
                    Convert 7 Chef content items to Ansible equivalents
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" style={{ fontSize: 13 }}>
                    Run a quality scan on the generated Ansible content
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" style={{ fontSize: 13 }}>
                    Flag 1 item for manual review
                  </Typography>
                </li>
              </Box>
            </Box>

            {DEMO_MAPPINGS.filter(m => m.confidence === 'low').length > 0 && (
              <Box display="flex" alignItems="flex-start" style={{ gap: 8, marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: '#F0AB0010', border: '1px solid #F0AB0030' }}>
                <WarningIcon style={{ fontSize: 18, color: '#F0AB00', marginTop: 2 }} />
                <Box>
                  <Typography style={{ fontSize: 12, fontWeight: 600 }}>Manual review needed</Typography>
                  <Typography style={{ fontSize: 12, color: '#666' }}>
                    {DEMO_MAPPINGS.filter(m => m.confidence === 'low').length} item(s) have low migration confidence and may need manual adjustment after creation.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      classes={{ paper: classes.dialogPaper }}
    >
      <DialogTitle disableTypography>
        <Box className={classes.header}>
          <Box display="flex" alignItems="center">
            <TransformIcon className={classes.headerIcon} />
            <Box>
              <Typography variant="h6" style={{ fontWeight: 600, fontSize: 18 }}>
                Migrate to Ansible
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
                Convert a Chef or Puppet project into an Ansible project
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Stepper activeStep={activeStep} className={classes.stepper} alternativeLabel>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent style={{ paddingTop: 0, minHeight: 280 }}>
        {renderStep()}
      </DialogContent>

      <DialogActions style={{ padding: '12px 24px' }}>
        <Button
          onClick={onClose}
          style={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Box flex={1} />
        {activeStep > 0 && !analyzing && (
          <Button
            onClick={handleBack}
            style={{ textTransform: 'none' }}
          >
            Back
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          disabled={!canProceed() || analyzing}
          style={{ textTransform: 'none', borderRadius: 20 }}
        >
          {activeStep === 0 ? 'Analyze' : activeStep === 3 ? 'Create project' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
