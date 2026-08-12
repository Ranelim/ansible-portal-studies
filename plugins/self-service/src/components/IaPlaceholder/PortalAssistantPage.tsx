import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Content } from '@backstage/core-components';
import {
  Box,
  IconButton,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

const useStyles = makeStyles(theme => ({
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 120px)',
    maxWidth: 800,
    margin: '0 auto',
    minHeight: 420,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 600,
    fontSize: 18,
    flex: 1,
  },
  thread: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    overflowY: 'auto',
    padding: theme.spacing(1, 0),
    marginBottom: theme.spacing(2),
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '16px 16px 16px 4px',
    padding: theme.spacing(1.5, 2),
    fontSize: 14,
    lineHeight: 1.55,
    color: theme.palette.text.secondary,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: theme.palette.action.hover,
    borderRadius: '16px 16px 4px 16px',
    padding: theme.spacing(1.5, 2),
    fontSize: 14,
    lineHeight: 1.55,
    color: theme.palette.text.disabled,
  },
  composer: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: 20,
      backgroundColor: theme.palette.background.paper,
    },
  },
  send: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  footer: {
    marginTop: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    fontSize: 12,
  },
}));

/**
 * Full-screen Assistant — Lightspeed-like chat skeleton (prototype).
 * Content is TBD placeholders only.
 */
export const PortalAssistantPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Assistant | Automation Portal';
  }, []);

  return (
    <Page themeId="app">
      <Content>
        <Box className={classes.shell}>
          <Box className={classes.topBar}>
            <IconButton
              size="small"
              aria-label="Back to experiences"
              onClick={() => navigate('/self-service/experiences')}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography className={classes.title} component="h1">
              Assistant
            </Typography>
          </Box>

          <Box className={classes.thread} aria-label="Chat thread">
            <Box className={classes.bubbleAssistant}>
              TBD — Welcome / capabilities (cross-experience help)
            </Box>
            <Box className={classes.bubbleUser}>TBD — Example user message</Box>
            <Box className={classes.bubbleAssistant}>
              TBD — Example assistant reply
            </Box>
            <Box className={classes.bubbleAssistant}>
              TBD — Suggested actions / tool results
            </Box>
          </Box>

          <Box className={classes.composer}>
            <TextField
              className={classes.input}
              size="small"
              variant="outlined"
              fullWidth
              disabled
              placeholder="TBD — Message input"
              multiline
              maxRows={4}
              inputProps={{ 'aria-label': 'Message (placeholder)' }}
            />
            <IconButton
              className={classes.send}
              color="primary"
              disabled
              aria-label="Send (placeholder)"
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography className={classes.footer}>
            Prototype skeleton · Full-screen chat · TBD
          </Typography>
        </Box>
      </Content>
    </Page>
  );
};
