import { useState, useRef, useEffect, useCallback } from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  makeStyles,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import BuildIcon from '@material-ui/icons/Build';
import { statusColors } from '../common/statusColors';

const useStyles = makeStyles(theme => ({
  sectionCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2.5),
  },
  prerequisiteStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 0),
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: 'rgba(0,102,204,0.15)',
    color: '#4DA3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
    marginTop: 2,
  },
  docLink: {
    color: '#4DA3FF',
    textDecoration: 'none',
    fontSize: 12,
    '&:hover': { textDecoration: 'underline' },
  },
  fieldGroup: {
    marginBottom: theme.spacing(2.5),
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
    lineHeight: 1.5,
  },
  stickyFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(3),
  },
  stickyFooterFixed: {
    position: 'fixed' as const,
    bottom: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    zIndex: 100,
    backdropFilter: 'blur(8px)',
  },
  testResult: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    fontSize: 12,
  },
  infoBox: {
    padding: '12px 16px',
    borderRadius: 8,
    backgroundColor: 'rgba(0,102,204,0.06)',
    border: '1px solid rgba(0,102,204,0.15)',
    marginBottom: 20,
  },
  setupOptionCard: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2.5),
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    '&:hover': { borderColor: theme.palette.primary.light },
  },
  setupOptionCardSelected: {
    borderColor: '#4DA3FF',
    boxShadow: '0 0 0 1px #4DA3FF',
  },
  templateFieldGroup: {
    marginBottom: theme.spacing(2),
  },
}));

const StickyFooter = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [leftOffset, setLeftOffset] = useState(0);

  const measure = useCallback(() => {
    if (sentinelRef.current) {
      setLeftOffset(sentinelRef.current.getBoundingClientRect().left);
    }
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const stuck = !entry.isIntersecting;
        setIsStuck(stuck);
        if (stuck) measure();
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return (
    <>
      {isStuck && (
        <Box className={classes.stickyFooterFixed} style={{ left: leftOffset, right: 0 }}>
          {children}
        </Box>
      )}
      <Box ref={sentinelRef as any} className={classes.stickyFooter} style={isStuck ? { visibility: 'hidden' } : undefined}>
        {children}
      </Box>
    </>
  );
};

const TestResultInline = ({ status }: { status: 'idle' | 'testing' | 'success' | 'error' }) => {
  const classes = useStyles();
  if (status === 'testing') {
    return (
      <Box className={classes.testResult}>
        <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          Testing connection…
        </Typography>
      </Box>
    );
  }
  if (status === 'success') {
    return (
      <Box className={classes.testResult}>
        <CheckCircleOutlineIcon style={{ fontSize: 16, color: statusColors.success }} />
        <Typography style={{ fontSize: 12, color: statusColors.success }}>
          Dev Spaces dashboard is reachable
        </Typography>
      </Box>
    );
  }
  if (status === 'error') {
    return (
      <Box className={classes.testResult}>
        <ErrorOutlineIcon style={{ fontSize: 16, color: statusColors.error }} />
        <Typography style={{ fontSize: 12, color: statusColors.error }}>
          Could not reach the Dev Spaces dashboard. Check the URL and try again.
        </Typography>
      </Box>
    );
  }
  return null;
};

export const DevSpacesDetailPage = () => {
  const classes = useStyles();
  const [setupPath, setSetupPath] = useState<'existing' | 'template'>('existing');
  const [url, setUrl] = useState('https://devspaces.apps.example.com');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('success');
  const [saved, setSaved] = useState(true);
  const testTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [clusterUrl, setClusterUrl] = useState('');
  const [clusterToken, setClusterToken] = useState('');
  const [addAnsibleSample, setAddAnsibleSample] = useState(true);
  const [templateRunning, setTemplateRunning] = useState(false);
  const [templateDone, setTemplateDone] = useState(false);

  const runTest = useCallback((targetUrl: string) => {
    if (!targetUrl.trim()) return;
    if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
    setTestStatus('testing');
    testTimeoutRef.current = setTimeout(() => {
      setTestStatus(targetUrl.trim() ? 'success' : 'error');
    }, 1200);
  }, []);

  const handleUrlBlur = () => {
    if (url.trim() && testStatus === 'idle') {
      runTest(url);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setSaved(false);
    setTestStatus('idle');
  };

  const handleSave = () => {
    setSaved(true);
  };

  const handleRunTemplate = () => {
    setTemplateRunning(true);
    setTimeout(() => {
      const derivedUrl = `https://devspaces.apps.${clusterUrl.replace(/^https?:\/\/api\./, '').replace(/:6443$/, '')}`;
      setTemplateRunning(false);
      setTemplateDone(true);
      setUrl(derivedUrl);
      setTestStatus('testing');
      setTimeout(() => {
        setTestStatus('success');
        setSaved(true);
      }, 1500);
    }, 3000);
  };

  const isDirty = !saved && url.trim();

  return (
    <Page themeId="app">
      <Header
        title="OpenShift Dev Spaces"
        pageTitleOverride="OpenShift Dev Spaces"
        type="Integrations"
        typeLink="/self-service/admin/integrations"
        subtitle="Browser-based development environments for automation content"
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Chip
            label={saved ? 'Connected' : 'Not connected'}
            size="small"
            style={{
              fontSize: 11,
              height: 22,
              fontWeight: 500,
              backgroundColor: saved ? 'rgba(99,153,61,0.15)' : 'rgba(255,255,255,0.08)',
              color: saved ? statusColors.success : 'rgba(255,255,255,0.5)',
            }}
          />
          {saved && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<OpenInNewIcon style={{ fontSize: 14 }} />}
              onClick={() => window.open(`${url}/dashboard/#/workspaces`, '_blank')}
              style={{ textTransform: 'none', fontSize: 12, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              Open dashboard
            </Button>
          )}
        </Box>
      </Header>
      <Content>
        <Box style={{ maxWidth: 720 }}>

          {/* Setup path picker */}
          <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            How do you want to set up Dev Spaces?
          </Typography>
          <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 16 }}>
            Choose how to connect the portal to OpenShift Dev Spaces. You can point to an existing
            instance, or use a template to install it on your OpenShift cluster.
          </Typography>

          <Box style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <Box
              className={`${classes.setupOptionCard} ${setupPath === 'existing' ? classes.setupOptionCardSelected : ''}`}
              onClick={() => setSetupPath('existing')}
            >
              <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: 8 }}>
                <OpenInNewIcon style={{ fontSize: 20, color: setupPath === 'existing' ? '#4DA3FF' : 'rgba(255,255,255,0.4)' }} />
                <Typography style={{ fontSize: 14, fontWeight: 600 }}>
                  Connect existing instance
                </Typography>
              </Box>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Your OpenShift team already installed Dev Spaces. Paste the URL to connect it to the portal.
              </Typography>
            </Box>

            <Box
              className={`${classes.setupOptionCard} ${setupPath === 'template' ? classes.setupOptionCardSelected : ''}`}
              onClick={() => setSetupPath('template')}
            >
              <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: 8 }}>
                <BuildIcon style={{ fontSize: 20, color: setupPath === 'template' ? '#4DA3FF' : 'rgba(255,255,255,0.4)' }} />
                <Typography style={{ fontSize: 14, fontWeight: 600 }}>
                  Install on OpenShift
                </Typography>
              </Box>
              <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                You have cluster-admin access to an OpenShift cluster. A template will install the Operator,
                create the instance, and connect automatically.
              </Typography>
            </Box>
          </Box>

          {/* ---- PATH A: Connect existing instance ---- */}
          {setupPath === 'existing' && (
            <>
              <Box className={classes.sectionCard}>
                <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  Prerequisites
                </Typography>
                <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 16 }}>
                  These steps are performed by your OpenShift platform team. Once complete, they provide
                  you with the Dev Spaces dashboard URL to enter below.
                </Typography>

                <Box className={classes.prerequisiteStep}>
                  <Box className={classes.stepNumber}>1</Box>
                  <Box>
                    <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                      Install the OpenShift Dev Spaces Operator
                    </Typography>
                    <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      Available in OperatorHub on any OpenShift 4.16+ cluster. Creates the Dev Workspace
                      Operator as a dependency.
                    </Typography>
                    <a
                      href="https://docs.redhat.com/en/documentation/red_hat_openshift_dev_spaces/3.27/html/administration_guide/assembly_installing-dev-spaces_administration_guide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.docLink}
                    >
                      View installation guide →
                    </a>
                  </Box>
                </Box>

                <Box className={classes.prerequisiteStep}>
                  <Box className={classes.stepNumber}>2</Box>
                  <Box>
                    <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                      Create a CheCluster instance
                    </Typography>
                    <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      After installing the Operator, create a CheCluster custom resource with default settings.
                      This provisions the Dev Spaces dashboard and workspace infrastructure.
                    </Typography>
                  </Box>
                </Box>

                <Box className={classes.prerequisiteStep} style={{ borderBottom: 'none' }}>
                  <Box className={classes.stepNumber}>3</Box>
                  <Box>
                    <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                      Add an Ansible workspace sample
                      <Chip label="Optional" size="small" variant="outlined" style={{ fontSize: 10, height: 18, marginLeft: 8 }} />
                    </Typography>
                    <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      Add a getting-started sample that points to a repository with an Ansible devfile.
                      This gives developers a one-click "Ansible workspace" card in the Dev Spaces dashboard.
                    </Typography>
                    <a
                      href="https://github.com/redhat-cop/ansible-devspaces"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={classes.docLink}
                    >
                      Ansible Dev Spaces reference repo →
                    </a>
                  </Box>
                </Box>
              </Box>

              <Divider style={{ margin: '8px 0 24px' }} />

              <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Connection
              </Typography>
              <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 16 }}>
                Paste the Dev Spaces URL below. The portal will automatically verify the connection.
              </Typography>

              <Box className={classes.fieldGroup}>
                <Typography className={classes.fieldLabel}>Dev Spaces URL *</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={url}
                  onChange={e => handleUrlChange(e.target.value)}
                  onBlur={handleUrlBlur}
                  placeholder="https://devspaces.apps.your-cluster.example.com"
                />
                <Typography className={classes.helperText}>
                  The base URL of your OpenShift Dev Spaces dashboard.
                  Usually looks like <code style={{ fontSize: 11 }}>https://devspaces.apps.&lt;cluster-domain&gt;</code>
                </Typography>
                <TestResultInline status={testStatus} />
              </Box>

              <Box className={classes.infoBox}>
                <Typography style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Why only a URL?
                </Typography>
                <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
                  The portal does not call the Dev Spaces API. It constructs redirect URLs that open
                  workspaces in the developer's browser. Dev Spaces handles its own authentication
                  through OpenShift OAuth — no tokens or secrets are needed here.
                </Typography>
              </Box>
            </>
          )}

          {/* ---- PATH B: Install via software template ---- */}
          {setupPath === 'template' && (
            <>
              <Box className={classes.sectionCard}>
                <Typography style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  Install Dev Spaces on OpenShift
                </Typography>
                <Typography style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 16 }}>
                  This template installs the Dev Spaces Operator, creates a CheCluster instance, and
                  optionally adds an Ansible workspace sample. You need <strong>cluster-admin</strong> access
                  to the target OpenShift cluster.
                </Typography>

                <Box className={classes.templateFieldGroup}>
                  <Typography className={classes.fieldLabel}>OpenShift API URL *</Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={clusterUrl}
                    onChange={e => setClusterUrl(e.target.value)}
                    placeholder="https://api.cluster.example.com:6443"
                    disabled={templateDone}
                  />
                  <Typography className={classes.helperText}>
                    The API endpoint of your OpenShift cluster (from <code style={{ fontSize: 11 }}>oc whoami --show-server</code>).
                  </Typography>
                </Box>

                <Box className={classes.templateFieldGroup}>
                  <Typography className={classes.fieldLabel}>Cluster admin token *</Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="password"
                    value={clusterToken}
                    onChange={e => setClusterToken(e.target.value)}
                    placeholder="sha256~..."
                    disabled={templateDone}
                  />
                  <Typography className={classes.helperText}>
                    A token with cluster-admin privileges (from <code style={{ fontSize: 11 }}>oc whoami -t</code>).
                    Used only during setup — not stored by the portal.
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addAnsibleSample}
                      onChange={(_, v) => setAddAnsibleSample(v)}
                      color="primary"
                      size="small"
                      disabled={templateDone}
                    />
                  }
                  label={
                    <Box>
                      <Typography style={{ fontSize: 13, fontWeight: 500 }}>
                        Add Ansible workspace sample
                      </Typography>
                      <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        Adds a getting-started card in the Dev Spaces dashboard with VS Code, the Ansible
                        extension, and Lightspeed AI pre-configured.
                      </Typography>
                    </Box>
                  }
                  style={{ alignItems: 'flex-start', marginLeft: 0, marginBottom: 16 }}
                />

                {!templateDone && (
                  <Box style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255,171,0,0.06)',
                    border: '1px solid rgba(255,171,0,0.2)',
                    marginBottom: 16,
                  }}>
                    <Typography style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
                      <strong>Requires cluster-admin.</strong> This template creates namespaces and installs
                      an Operator. If you don't have cluster-admin access, ask your OpenShift platform team
                      to install Dev Spaces and use the "Connect existing instance" option instead.
                    </Typography>
                  </Box>
                )}

                {templateDone ? (
                  <Box style={{
                    padding: '16px 20px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(99,153,61,0.08)',
                    border: '1px solid rgba(99,153,61,0.25)',
                  }}>
                    <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 8 }}>
                      <CheckCircleOutlineIcon style={{ fontSize: 20, color: statusColors.success }} />
                      <Typography style={{ fontSize: 14, fontWeight: 600, color: statusColors.success }}>
                        Dev Spaces is installed and connected
                      </Typography>
                    </Box>
                    <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      The template installed the Operator, created a CheCluster instance
                      {addAnsibleSample ? ', added the Ansible workspace sample,' : ','} verified the dashboard is
                      reachable, and saved the connection. "Edit in Dev Spaces" actions are now available
                      on all projects.
                    </Typography>
                    <Box display="flex" alignItems="center" style={{ gap: 8, marginTop: 12 }}>
                      <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        Dashboard URL:
                      </Typography>
                      <Typography style={{ fontSize: 12, fontFamily: 'monospace', color: '#4DA3FF' }}>
                        {url}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon style={{ fontSize: 16 }} />}
                    onClick={handleRunTemplate}
                    disabled={!clusterUrl.trim() || !clusterToken.trim() || templateRunning}
                    style={{ textTransform: 'none', fontSize: 13 }}
                  >
                    {templateRunning ? 'Installing… this may take a few minutes' : 'Run setup template'}
                  </Button>
                )}
              </Box>

              {!templateDone && (
                <Box className={classes.infoBox}>
                  <Typography style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    What this template does
                  </Typography>
                  <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                      'Subscribes to the OpenShift Dev Spaces Operator in OperatorHub',
                      'Creates a CheCluster custom resource with default settings',
                      addAnsibleSample ? 'Adds an Ansible workspace sample with VS Code + Ansible extension' : null,
                      'Waits for the Dev Spaces route to become available',
                      'Verifies the dashboard, saves the URL, and connects automatically',
                    ].filter(Boolean).map((item, i) => (
                      <Box key={i} display="flex" alignItems="flex-start" style={{ gap: 8 }}>
                        <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                          {i + 1}. {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* What this enables — shared */}
          <Box className={classes.sectionCard} style={{ backgroundColor: 'rgba(99,153,61,0.04)' }}>
            <Typography style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              What this enables for developers
            </Typography>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                '"Edit in Dev Spaces" actions in project kebab menus and detail pages',
                'Deep links from quality violations to the exact file and line in Dev Spaces',
                '"Manage workspaces" link to the Dev Spaces dashboard from project sidebars',
              ].map((item, i) => (
                <Box key={i} display="flex" alignItems="flex-start" style={{ gap: 8 }}>
                  <CheckCircleOutlineIcon style={{ fontSize: 14, color: statusColors.success, marginTop: 2, flexShrink: 0 }} />
                  <Typography style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box className={classes.infoBox}>
            <Typography style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.8 }}>
              <strong>Operator updates:</strong> The Dev Spaces Operator is managed directly in
              OpenShift via OLM (Operator Lifecycle Manager). Version upgrades are not handled
              through the portal.
            </Typography>
          </Box>

          {/* Sticky footer — only for the manual path when there are unsaved changes */}
          {setupPath === 'existing' && (
            <StickyFooter>
              <Button
                variant="outlined"
                onClick={() => runTest(url)}
                disabled={!url.trim() || testStatus === 'testing'}
                style={{ textTransform: 'none', fontSize: 13 }}
              >
                {testStatus === 'testing' ? 'Testing…' : 'Retest connection'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={!url.trim() || !isDirty}
                style={{ textTransform: 'none', fontSize: 13 }}
              >
                {saved ? 'Saved' : 'Save'}
              </Button>
            </StickyFooter>
          )}

        </Box>
      </Content>
    </Page>
  );
};
