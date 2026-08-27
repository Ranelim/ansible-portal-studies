import { useState, type FormEvent } from 'react';
import { Box, Button, TextField, Typography, makeStyles } from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import { writeNavExperience } from '../../hooks/useNavIaModel';
import redHatLogo from '../../assets/redhat-logo.png';

/**
 * Demo facsimile of the AAP Gateway login (PatternFly Login page).
 * Username + password, "Log in" — not Portal chrome, not real OAuth.
 * Any non-empty credentials continue. Do not import PatternFly React.
 */
const useStyles = makeStyles({
  root: {
    position: 'fixed',
    top: 'var(--portal-setup-demo-bar, 0px)',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    backgroundColor: '#151515',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    boxSizing: 'border-box',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    alignSelf: 'center',
    maxWidth: 440,
    width: '100%',
  },
  brandText: {
    color: '#fff',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#fff',
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.2,
    color: 'rgba(255,255,255,0.75)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: '40px 32px 32px',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: 8,
    color: '#151515',
  },
  subtitle: {
    fontSize: 14,
    color: '#6a6e73',
    marginBottom: 24,
    lineHeight: 1.5,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
    color: '#151515',
  },
  submit: {
    textTransform: 'none',
    fontWeight: 500,
    marginTop: 8,
    // AAP Gateway / PF login — full-width primary, not Portal pills.
    borderRadius: 3,
    minHeight: 36,
  },
  demoNote: {
    display: 'block',
    marginTop: 16,
    fontSize: 12,
    color: '#6a6e73',
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 24,
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
});

export const AapDemoLoginPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim() !== '' && password.trim() !== '' && !submitting;

  const handleLogIn = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      sessionStorage.setItem('portal-welcome-modal-dismissed-session', 'true');
      sessionStorage.setItem('portal-setup-just-completed', 'true');
    } catch {
      /* ignore */
    }
    writeNavExperience('admin');
    window.setTimeout(() => {
      navigate('/self-service/admin/overview');
    }, 400);
  };

  return (
    <Box className={classes.root}>
      <Box className={classes.brand}>
        <img
          src={redHatLogo}
          alt=""
          width={36}
          height={36}
          style={{ objectFit: 'contain' }}
        />
        <Box className={classes.brandText}>
          <Typography className={classes.brandTitle}>Red Hat</Typography>
          <Typography className={classes.brandSubtitle}>
            Ansible Automation Platform
          </Typography>
        </Box>
      </Box>

      <Box className={classes.card} component="main">
        <Typography className={classes.title} component="h1">
          Log in to your account
        </Typography>
        <Typography className={classes.subtitle}>
          Enter your Ansible Automation Platform credentials.
        </Typography>
        <form onSubmit={handleLogIn} noValidate>
          <Typography className={classes.label} component="label" htmlFor="aap-demo-username">
            Username
          </Typography>
          <TextField
            id="aap-demo-username"
            className={classes.field}
            fullWidth
            variant="outlined"
            size="small"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <Typography className={classes.label} component="label" htmlFor="aap-demo-password">
            Password
          </Typography>
          <TextField
            id="aap-demo-password"
            className={classes.field}
            fullWidth
            variant="outlined"
            size="small"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={!canSubmit}
            className={classes.submit}
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <Typography className={classes.demoNote} component="span">
          Prototype demo — credentials are not verified. Any username and password
          continue into Automation Portal.
        </Typography>
      </Box>
    </Box>
  );
};
