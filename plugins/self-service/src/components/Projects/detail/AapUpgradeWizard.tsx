import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
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
  Collapse,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import SystemUpdateIcon from '@material-ui/icons/SystemUpdate';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { statusColors } from '../../common/statusColors';
import {
  type AapUpgradeData,
  type UpgradeFinding,
  type UpgradeFindingCategory,
  AAP_VERSIONS,
  UPGRADE_CATEGORY_LABELS,
  SEVERITY_COLORS,
} from './qualityDemoData';

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    maxWidth: 720,
    borderRadius: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerIcon: {
    color: statusColors.info,
    marginRight: theme.spacing(1.5),
    fontSize: 28,
  },
  stepper: {
    padding: theme.spacing(1, 0, 2),
    backgroundColor: 'transparent',
  },
  versionCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(3),
    padding: theme.spacing(2.5),
    borderRadius: 10,
    marginBottom: theme.spacing(2.5),
  },
  versionBox: {
    textAlign: 'center',
    minWidth: 100,
  },
  statCard: {
    textAlign: 'center',
    padding: theme.spacing(1.5),
    borderRadius: 8,
    flex: 1,
    minWidth: 80,
  },
  findingRow: {
    padding: theme.spacing(1, 2),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: theme.spacing(1.5, 2, 0.5),
  },
}));

const STEPS = ['Select target', 'Analysis', 'Compatibility report'];

interface AapUpgradeWizardProps {
  open: boolean;
  projectName: string;
  upgradeData: AapUpgradeData;
  onClose: () => void;
  onComplete: () => void;
}

const CATEGORY_ICONS: Record<UpgradeFindingCategory, React.ReactNode> = {
  'deprecated-module': <ErrorIcon style={{ fontSize: 14, color: SEVERITY_COLORS.high }} />,
  'changed-parameter': <WarningIcon style={{ fontSize: 14, color: SEVERITY_COLORS.medium }} />,
  'collection-update': <SystemUpdateIcon style={{ fontSize: 14, color: SEVERITY_COLORS.medium }} />,
  'python-dependency': <SystemUpdateIcon style={{ fontSize: 14, color: SEVERITY_COLORS.medium }} />,
  'removed-feature': <ErrorIcon style={{ fontSize: 14, color: SEVERITY_COLORS.critical }} />,
};

export const AapUpgradeWizard = ({
  open,
  projectName,
  upgradeData,
  onClose,
  onComplete,
}: AapUpgradeWizardProps) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [targetVersion, setTargetVersion] = useState(upgradeData.latestVersion);
  const [analyzing, setAnalyzing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState(false);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  const availableTargets = useMemo(() => {
    const currentIdx = AAP_VERSIONS.indexOf(upgradeData.currentVersion as typeof AAP_VERSIONS[number]);
    return AAP_VERSIONS.filter((_, i) => i > currentIdx);
  }, [upgradeData.currentVersion]);

  const findings = upgradeData.findings;

  const groupedFindings = useMemo(() => {
    const groups: Record<UpgradeFindingCategory, UpgradeFinding[]> = {
      'deprecated-module': [],
      'changed-parameter': [],
      'collection-update': [],
      'python-dependency': [],
      'removed-feature': [],
    };
    for (const f of findings) {
      groups[f.category].push(f);
    }
    return groups;
  }, [findings]);

  const handleClose = useCallback(() => {
    if (!analyzing) {
      setActiveStep(0);
      setAnalyzing(false);
      setSelected(new Set());
      setApplied(false);
      setExpandedFinding(null);
      onClose();
    }
  }, [analyzing, onClose]);

  const handleNext = useCallback(() => {
    if (activeStep === 0) {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setActiveStep(1);
        setTimeout(() => {
          setActiveStep(2);
        }, 2200);
      }, 2000);
    } else if (activeStep === 2 && !applied) {
      setApplied(true);
    } else {
      onComplete();
    }
  }, [activeStep, applied, onComplete]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFixable = useCallback(() => {
    setSelected(new Set(findings.filter(f => f.autoFixable).map(f => f.id)));
  }, [findings]);

  const confidenceBar = (pct: number) => {
    const percent = Math.round(pct * 100);
    const color = percent >= 90 ? statusColors.success : percent >= 70 ? statusColors.warning : statusColors.error;
    return (
      <Tooltip title={`${percent}% confidence`} arrow>
        <Box display="flex" alignItems="center" style={{ gap: 4, minWidth: 65 }}>
          <Box style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', overflow: 'hidden' }}>
            <Box style={{ width: `${percent}%`, height: '100%', borderRadius: 2, backgroundColor: color }} />
          </Box>
          <Typography style={{ fontSize: 10, color: '#666', minWidth: 28 }}>{percent}%</Typography>
        </Box>
      </Tooltip>
    );
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 8 }}>
              Upgrade your Ansible automation content to be compatible with a newer version of Ansible Automation Platform. APME will analyze your project for deprecated modules, changed APIs, and incompatible dependencies.
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 24, fontSize: 12 }}>
              No changes will be made until you review and approve them.
            </Typography>

            <Paper variant="outlined" className={classes.versionCard}>
              <Box className={classes.versionBox}>
                <Typography style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Current</Typography>
                <Typography style={{ fontSize: 28, fontWeight: 700, color: statusColors.warning }}>
                  {upgradeData.currentVersion}
                </Typography>
                <Chip size="small" label="AAP" style={{ fontSize: 10, height: 18, marginTop: 4, backgroundColor: `${statusColors.warning}20`, color: statusColors.warning }} />
              </Box>
              <ArrowForwardIcon style={{ fontSize: 28, color: statusColors.info }} />
              <Box className={classes.versionBox}>
                <Typography style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Target</Typography>
                <Typography style={{ fontSize: 28, fontWeight: 700, color: statusColors.success }}>
                  {targetVersion}
                </Typography>
                <Chip size="small" label="AAP" style={{ fontSize: 10, height: 18, marginTop: 4, backgroundColor: `${statusColors.success}20`, color: statusColors.success }} />
              </Box>
            </Paper>

            <FormControl variant="outlined" size="small" fullWidth style={{ marginBottom: 20 }}>
              <InputLabel>Target AAP version</InputLabel>
              <Select
                value={targetVersion}
                onChange={e => setTargetVersion(e.target.value as string)}
                label="Target AAP version"
              >
                {availableTargets.map(v => (
                  <MenuItem key={v} value={v}>
                    AAP {v}{v === upgradeData.latestVersion ? ' (latest)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              What will be checked
            </Typography>
            <Box component="ul" style={{ margin: 0, paddingLeft: 20 }}>
              {[
                'Deprecated and removed modules in ansible-core',
                'Changed module parameters and return values',
                'Collection version compatibility',
                'Python dependency requirements',
                'Removed configuration options',
              ].map(item => (
                <li key={item}>
                  <Typography variant="body2" style={{ fontSize: 13, lineHeight: 1.7 }}>
                    {item}
                  </Typography>
                </li>
              ))}
            </Box>

            {analyzing && (
              <Box style={{ marginTop: 24 }}>
                <Typography variant="body2" style={{ marginBottom: 8, fontWeight: 500 }}>
                  Scanning for compatibility issues...
                </Typography>
                <LinearProgress />
                <Typography variant="caption" color="textSecondary" style={{ marginTop: 4, display: 'block' }}>
                  Checking {projectName} against AAP {targetVersion} requirements
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box style={{ textAlign: 'center', padding: '32px 0' }}>
            <Box style={{ marginBottom: 16 }}>
              <Typography style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
                Analyzing compatibility...
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: 24, fontSize: 13 }}>
                Checking {projectName} against AAP {targetVersion}
              </Typography>
              <LinearProgress style={{ borderRadius: 4, marginBottom: 24 }} />
            </Box>
            <Box style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
              {[
                { label: 'Parsing playbooks and roles', done: true },
                { label: 'Checking module compatibility', done: true },
                { label: 'Validating collection versions', done: false },
                { label: 'Scanning Python dependencies', done: false },
                { label: 'Generating upgrade report', done: false },
              ].map((step, i) => (
                <Box key={i} display="flex" alignItems="center" style={{ gap: 8, padding: '5px 0' }}>
                  {step.done ? (
                    <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                  ) : (
                    <Box style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #ccc' }} />
                  )}
                  <Typography style={{ fontSize: 13, color: step.done ? 'inherit' : '#999' }}>{step.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            {/* Summary stat cards */}
            <Box display="flex" style={{ gap: 12, marginBottom: 20 }}>
              <Paper variant="outlined" className={classes.statCard}>
                <Typography style={{ fontSize: 24, fontWeight: 700, color: upgradeData.summary.total > 0 ? statusColors.warning : statusColors.success }}>
                  {upgradeData.summary.total}
                </Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>Total findings</Typography>
              </Paper>
              <Paper variant="outlined" className={classes.statCard}>
                <Typography style={{ fontSize: 24, fontWeight: 700, color: statusColors.success }}>
                  {upgradeData.summary.autoFixable}
                </Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>Auto-fixable</Typography>
              </Paper>
              <Paper variant="outlined" className={classes.statCard}>
                <Typography style={{ fontSize: 24, fontWeight: 700, color: statusColors.warning }}>
                  {upgradeData.summary.manualReview}
                </Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>Manual review</Typography>
              </Paper>
              <Paper variant="outlined" className={classes.statCard}>
                <Typography style={{ fontSize: 24, fontWeight: 700, color: SEVERITY_COLORS.critical }}>
                  {upgradeData.summary.breakingChanges}
                </Typography>
                <Typography style={{ fontSize: 11, color: '#666' }}>Breaking</Typography>
              </Paper>
            </Box>

            {applied ? (
              <Box style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircleIcon style={{ fontSize: 48, color: statusColors.success, marginBottom: 8 }} />
                <Typography style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                  Upgrade changes applied
                </Typography>
                <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16, fontSize: 13 }}>
                  {selected.size} fix{selected.size !== 1 ? 'es' : ''} applied to a new branch. A pull request has been created for review.
                </Typography>
                <Paper variant="outlined" style={{ padding: '12px 16px', textAlign: 'left', borderRadius: 8, marginBottom: 12 }}>
                  <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                    <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
                    <Typography variant="body2" style={{ fontSize: 12 }}>
                      Branch: <strong>upgrade/aap-{targetVersion}</strong>
                    </Typography>
                  </Box>
                </Paper>
                <Button
                  variant="contained" color="primary" size="small"
                  startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
                  component="a"
                  href={`https://github.com/acme-corp/${projectName}/pull/43`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ textTransform: 'none', fontSize: 12 }}
                >
                  View pull request
                </Button>
              </Box>
            ) : (
              <>
                {/* Action bar */}
                <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
                  <Typography style={{ fontSize: 13, color: '#666' }}>
                    Select findings to apply automated fixes
                  </Typography>
                  <Box display="flex" style={{ gap: 8 }}>
                    <Button size="small" onClick={selectAllFixable}
                      style={{ textTransform: 'none', fontSize: 11 }}>
                      Select all fixable
                    </Button>
                    <Button size="small" onClick={() => setSelected(new Set())}
                      style={{ textTransform: 'none', fontSize: 11 }}>
                      Clear
                    </Button>
                  </Box>
                </Box>

                {/* Findings by category */}
                <Paper variant="outlined" style={{ borderRadius: 8, overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
                  {(Object.keys(groupedFindings) as UpgradeFindingCategory[]).map(cat => {
                    const items = groupedFindings[cat];
                    if (items.length === 0) return null;
                    return (
                      <Box key={cat}>
                        <Typography className={classes.categoryHeader}>
                          {CATEGORY_ICONS[cat]}{' '}
                          {UPGRADE_CATEGORY_LABELS[cat]} ({items.length})
                        </Typography>
                        {items.map((f, i) => (
                          <Box key={f.id}>
                            <Box
                              className={classes.findingRow}
                              display="flex" alignItems="center"
                              style={{
                                gap: 10,
                                borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                              }}
                              onClick={() => setExpandedFinding(expandedFinding === f.id ? null : f.id)}
                            >
                              {f.autoFixable ? (
                                <Box
                                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleItem(f.id); }}
                                  style={{
                                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                    border: selected.has(f.id) ? 'none' : '2px solid #ccc',
                                    backgroundColor: selected.has(f.id) ? statusColors.info : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {selected.has(f.id) && <CheckCircleIcon style={{ fontSize: 16, color: '#fff' }} />}
                                </Box>
                              ) : (
                                <Tooltip title="Requires manual review" arrow>
                                  <WarningIcon style={{ fontSize: 16, color: statusColors.warning, flexShrink: 0 }} />
                                </Tooltip>
                              )}
                              <Chip
                                size="small" label={f.severity}
                                style={{
                                  fontSize: 10, height: 18, fontWeight: 600,
                                  backgroundColor: `${SEVERITY_COLORS[f.severity]}18`,
                                  color: SEVERITY_COLORS[f.severity],
                                  textTransform: 'capitalize',
                                }}
                              />
                              <Typography style={{ fontSize: 12, flex: 1 }} noWrap>{f.title}</Typography>
                              {f.autoFixable && confidenceBar(f.confidence)}
                              {expandedFinding === f.id ? (
                                <ExpandLessIcon style={{ fontSize: 16, color: '#999' }} />
                              ) : (
                                <ExpandMoreIcon style={{ fontSize: 16, color: '#999' }} />
                              )}
                            </Box>
                            <Collapse in={expandedFinding === f.id}>
                              <Box style={{ padding: '8px 16px 12px 44px', backgroundColor: '#fafafa' }}>
                                <Typography style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 8 }}>
                                  {f.description}
                                </Typography>
                                {f.file && (
                                  <Typography style={{ fontSize: 11, color: '#888', marginBottom: 6, fontFamily: 'monospace' }}>
                                    {f.file}{f.lineStart ? `:${f.lineStart}` : ''}
                                  </Typography>
                                )}
                                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                                  <Chip size="small" variant="outlined" label={f.currentValue}
                                    style={{ fontSize: 10, height: 20, fontFamily: 'monospace', textDecoration: 'line-through', color: statusColors.error, borderColor: `${statusColors.error}40` }} />
                                  <ArrowForwardIcon style={{ fontSize: 14, color: '#999' }} />
                                  <Chip size="small" variant="outlined" label={f.suggestedValue}
                                    style={{ fontSize: 10, height: 20, fontFamily: 'monospace', color: statusColors.success, borderColor: `${statusColors.success}40` }} />
                                </Box>
                              </Box>
                            </Collapse>
                          </Box>
                        ))}
                      </Box>
                    );
                  })}
                </Paper>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const primaryLabel = () => {
    if (activeStep === 0) return 'Analyze';
    if (activeStep === 2 && applied) return 'Done';
    if (activeStep === 2 && selected.size > 0) return `Apply ${selected.size} fix${selected.size !== 1 ? 'es' : ''}`;
    if (activeStep === 2) return 'Select fixes to apply';
    return 'Next';
  };

  const primaryDisabled = () => {
    if (analyzing) return true;
    if (activeStep === 1) return true;
    if (activeStep === 2 && !applied && selected.size === 0) return true;
    return false;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      classes={{ paper: classes.dialogPaper }}
    >
      <DialogTitle disableTypography>
        <Box className={classes.header}>
          <Box display="flex" alignItems="center">
            <SystemUpdateIcon className={classes.headerIcon} />
            <Box>
              <Typography variant="h6" style={{ fontWeight: 600, fontSize: 18 }}>
                Upgrade to AAP {targetVersion}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ fontSize: 12 }}>
                Check and fix compatibility for {projectName}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleClose} disabled={analyzing}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        {activeStep !== 1 && (
          <Stepper activeStep={activeStep} className={classes.stepper} alternativeLabel>
            {STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </DialogTitle>

      <DialogContent style={{ paddingTop: 0, minHeight: 280 }}>
        {renderStep()}
      </DialogContent>

      <DialogActions style={{ padding: '12px 24px' }}>
        {activeStep !== 1 && (
          <>
            <Button onClick={handleClose} style={{ textTransform: 'none' }} disabled={analyzing}>
              {applied ? '' : 'Cancel'}
            </Button>
            <Box flex={1} />
            {activeStep > 0 && activeStep < 2 && !analyzing && (
              <Button onClick={handleBack} style={{ textTransform: 'none' }}>
                Back
              </Button>
            )}
            <Button
              variant="contained" color="primary"
              onClick={handleNext}
              disabled={primaryDisabled()}
              style={{ textTransform: 'none', borderRadius: 20 }}
            >
              {primaryLabel()}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
