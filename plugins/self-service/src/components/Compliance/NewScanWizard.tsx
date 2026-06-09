import { useState, useCallback } from 'react';
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
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import SecurityIcon from '@material-ui/icons/Security';
import StorageIcon from '@material-ui/icons/Storage';
import { statusColors } from '../common/statusColors';
import { INVENTORIES, COMPLIANCE_PROFILES, type ComplianceFramework } from './complianceDemoData';

const STEPS = ['Select inventory', 'Select profile'];

const FRAMEWORKS: { id: ComplianceFramework; label: string; description: string; version: string }[] = [
  { id: 'DISA STIG', label: 'DISA STIG', description: 'Defense Information Systems Agency Security Technical Implementation Guide', version: 'V1R12' },
  { id: 'PCI-DSS', label: 'PCI-DSS', description: 'Payment Card Industry Data Security Standard', version: 'v4.0' },
  { id: 'CIS', label: 'CIS Benchmarks', description: 'Center for Internet Security configuration benchmarks', version: 'L1 v8.0' },
  { id: 'NIST 800-53', label: 'NIST 800-53', description: 'National Institute of Standards and Technology security controls', version: 'Rev 5' },
];

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    maxWidth: 640,
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
  optionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: `${theme.palette.primary.main}04`,
    },
  },
  optionCardSelected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}08`,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLabel: {
    fontWeight: 600,
    fontSize: 14,
  },
  optionMeta: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  optionDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 2,
  },
  reviewBox: {
    padding: theme.spacing(2),
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    marginTop: theme.spacing(2),
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: theme.palette.text.secondary,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: 600,
  },
}));

interface NewScanWizardProps {
  open: boolean;
  onClose: () => void;
  onRunScan: (inventoryId: string, framework: ComplianceFramework) => void;
  preselectedInventoryId?: string;
}

export const NewScanWizard = ({ open, onClose, onRunScan, preselectedInventoryId }: NewScanWizardProps) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedInventory, setSelectedInventory] = useState<string>(preselectedInventoryId ?? '');
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | ''>('');

  const handleReset = useCallback(() => {
    setActiveStep(0);
    setSelectedInventory(preselectedInventoryId ?? '');
    setSelectedFramework('');
  }, [preselectedInventoryId]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleNext = useCallback(() => {
    if (activeStep === 0 && selectedInventory) {
      setActiveStep(1);
    }
  }, [activeStep, selectedInventory]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedInventory && selectedFramework) {
      onRunScan(selectedInventory, selectedFramework);
      handleClose();
    }
  }, [selectedInventory, selectedFramework, onRunScan, handleClose]);

  const selectedInv = INVENTORIES.find(i => i.id === selectedInventory);
  const selectedFw = FRAMEWORKS.find(f => f.id === selectedFramework);
  const existingProfile = COMPLIANCE_PROFILES.find(
    p => p.inventoryId === selectedInventory && p.framework === selectedFramework,
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      classes={{ paper: classes.dialogPaper }}
    >
      <DialogTitle disableTypography>
        <Box className={classes.header}>
          <Box display="flex" alignItems="center">
            <SecurityIcon className={classes.headerIcon} />
            <Box>
              <Typography variant="h6" style={{ fontWeight: 600, fontSize: 18 }}>
                New compliance scan
              </Typography>
              <Typography style={{ fontSize: 13, color: statusColors.pending }}>
                Assess infrastructure against a compliance standard
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} className={classes.stepper} alternativeLabel>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Select inventory */}
        {activeStep === 0 && (
          <Box>
            <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              Which inventory do you want to scan?
            </Typography>
            <RadioGroup
              value={selectedInventory}
              onChange={e => setSelectedInventory(e.target.value)}
            >
              <Box display="flex" flexDirection="column" style={{ gap: 8 }}>
                {INVENTORIES.map(inv => (
                  <Box
                    key={inv.id}
                    className={`${classes.optionCard} ${selectedInventory === inv.id ? classes.optionCardSelected : ''}`}
                    onClick={() => setSelectedInventory(inv.id)}
                  >
                    <Box className={classes.optionIcon} style={{ backgroundColor: `${statusColors.info}12` }}>
                      <StorageIcon style={{ fontSize: 18, color: statusColors.info }} />
                    </Box>
                    <Box flex={1}>
                      <Typography className={classes.optionLabel}>{inv.name}</Typography>
                      <Typography className={classes.optionMeta}>
                        {inv.hostCount} hosts · {inv.profileIds.length} existing {inv.profileIds.length === 1 ? 'profile' : 'profiles'}
                      </Typography>
                    </Box>
                    <FormControlLabel
                      value={inv.id}
                      control={<Radio color="primary" size="small" />}
                      label=""
                      style={{ margin: 0 }}
                      onClick={e => e.stopPropagation()}
                    />
                  </Box>
                ))}
              </Box>
            </RadioGroup>
          </Box>
        )}

        {/* Step 2: Select compliance profile + review */}
        {activeStep === 1 && (
          <Box>
            <Typography style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Which compliance standard?
            </Typography>
            <Typography style={{ fontSize: 12, color: statusColors.pending, marginBottom: 12 }}>
              Scanning <strong>{selectedInv?.name}</strong> ({selectedInv?.hostCount} hosts)
            </Typography>
            <RadioGroup
              value={selectedFramework}
              onChange={e => setSelectedFramework(e.target.value as ComplianceFramework)}
            >
              <Box display="flex" flexDirection="column" style={{ gap: 8 }}>
                {FRAMEWORKS.map(fw => {
                  const alreadyScanned = COMPLIANCE_PROFILES.some(
                    p => p.inventoryId === selectedInventory && p.framework === fw.id,
                  );
                  return (
                    <Box
                      key={fw.id}
                      className={`${classes.optionCard} ${selectedFramework === fw.id ? classes.optionCardSelected : ''}`}
                      onClick={() => setSelectedFramework(fw.id)}
                    >
                      <Box className={classes.optionIcon} style={{ backgroundColor: `${statusColors.info}12` }}>
                        <SecurityIcon style={{ fontSize: 18, color: statusColors.info }} />
                      </Box>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                          <Typography className={classes.optionLabel}>{fw.label}</Typography>
                          <Chip size="small" label={fw.version} style={{ fontSize: 10, height: 18, fontWeight: 500 }} variant="outlined" />
                          {alreadyScanned && (
                            <Chip size="small" label="Previously scanned" style={{ fontSize: 10, height: 18, fontWeight: 500, backgroundColor: `${statusColors.success}12`, color: statusColors.success }} />
                          )}
                        </Box>
                        <Typography className={classes.optionDescription}>{fw.description}</Typography>
                      </Box>
                      <FormControlLabel
                        value={fw.id}
                        control={<Radio color="primary" size="small" />}
                        label=""
                        style={{ margin: 0 }}
                        onClick={e => e.stopPropagation()}
                      />
                    </Box>
                  );
                })}
              </Box>
            </RadioGroup>

            {/* Inline review summary when profile is selected */}
            {selectedFw && (
              <Box className={classes.reviewBox}>
                <Box display="flex" style={{ gap: 32 }}>
                  <Box>
                    <Typography className={classes.reviewLabel}>Inventory</Typography>
                    <Typography className={classes.reviewValue}>{selectedInv?.name}</Typography>
                    <Typography style={{ fontSize: 12, color: statusColors.pending }}>{selectedInv?.hostCount} hosts</Typography>
                  </Box>
                  <Box>
                    <Typography className={classes.reviewLabel}>Standard</Typography>
                    <Typography className={classes.reviewValue}>{selectedFw.label} {selectedFw.version}</Typography>
                  </Box>
                </Box>
                {existingProfile && (
                  <Typography style={{ fontSize: 12, color: statusColors.warning, marginTop: 8 }}>
                    This inventory was previously scanned against {selectedFw.label}. A new scan will update the existing results.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions style={{ padding: '8px 24px 16px' }}>
        <Button onClick={handleClose} style={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Box flex={1} />
        {activeStep > 0 && (
          <Button onClick={handleBack} style={{ textTransform: 'none' }}>
            Back
          </Button>
        )}
        {activeStep === 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={!selectedInventory}
            style={{ textTransform: 'none', fontWeight: 600 }}
          >
            Next
          </Button>
        )}
        {activeStep === 1 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!selectedFramework}
            style={{ textTransform: 'none', fontWeight: 600 }}
          >
            Run scan
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
