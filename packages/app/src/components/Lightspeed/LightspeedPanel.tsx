import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Slide,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import SendIcon from '@material-ui/icons/Send';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import { useLightspeed, ChatMessage } from './LightspeedContext';
import { CHROME_TOP } from '../IaPrototype';

const PANEL_WIDTH = 400;

const useStyles = makeStyles(theme => ({
  panel: {
    position: 'fixed',
    top: CHROME_TOP,
    right: 0,
    bottom: 0,
    zIndex: theme.zIndex.drawer + 2,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    borderLeft: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[8],
    transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  panelNarrow: {
    width: PANEL_WIDTH,
  },
  panelExpanded: {
    width: '100%',
    borderLeft: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.grey[900]
        : theme.palette.primary.main,
    color:
      theme.palette.type === 'dark'
        ? theme.palette.common.white
        : theme.palette.primary.contrastText,
    minHeight: 52,
    gap: theme.spacing(1),
    flexShrink: 0,
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    color: 'inherit',
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: 15,
    flex: 1,
  },
  headerAction: {
    color: 'inherit',
    opacity: 0.8,
    '&:hover': { opacity: 1 },
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  messagesAreaExpanded: {
    maxWidth: 800,
    width: '100%',
    margin: '0 auto',
    padding: theme.spacing(3, 4),
  },
  messageBubble: {
    maxWidth: '88%',
    padding: theme.spacing(1.5, 2),
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  messageBubbleExpanded: {
    maxWidth: '70%',
    fontSize: 14,
    padding: theme.spacing(2, 2.5),
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[100],
    color: theme.palette.text.primary,
    borderBottomLeftRadius: 4,
  },
  timestamp: {
    fontSize: 10,
    color: theme.palette.text.disabled,
    marginTop: 2,
  },
  inputArea: {
    display: 'flex',
    alignItems: 'flex-end',
    padding: theme.spacing(1.5, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    gap: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    flexShrink: 0,
  },
  inputAreaExpanded: {
    maxWidth: 800,
    width: '100%',
    margin: '0 auto',
    padding: theme.spacing(2, 4),
    borderTop: 'none',
  },
  inputWrapper: {
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    flexShrink: 0,
  },
  inputField: {
    flex: 1,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 20,
    padding: theme.spacing(1, 2),
    fontSize: 13,
    backgroundColor: theme.palette.background.paper,
    maxHeight: 120,
    overflowY: 'auto',
  },
  inputFieldExpanded: {
    fontSize: 14,
    padding: theme.spacing(1.5, 2.5),
    borderRadius: 24,
  },
  sendButton: {
    color: theme.palette.primary.main,
  },
  poweredBy: {
    textAlign: 'center',
    padding: theme.spacing(0.5),
    fontSize: 10,
    color: theme.palette.text.disabled,
    flexShrink: 0,
  },
  /** RHDH Local–style Lightspeed FAB (not in masthead icon cluster) */
  fab: {
    position: 'fixed',
    right: theme.spacing(3),
    bottom: theme.spacing(3),
    zIndex: theme.zIndex.drawer + 1,
    width: 56,
    height: 56,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    boxShadow: theme.shadows[6],
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const LightspeedStarIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const MessageBubble = ({
  message,
  expanded,
}: {
  message: ChatMessage;
  expanded: boolean;
}) => {
  const classes = useStyles();
  const isUser = message.role === 'user';

  return (
    <Box>
      <Box
        className={[
          classes.messageBubble,
          isUser ? classes.userBubble : classes.assistantBubble,
          expanded ? classes.messageBubbleExpanded : '',
        ].filter(Boolean).join(' ')}
      >
        {message.content}
      </Box>
      <Typography
        className={classes.timestamp}
        align={isUser ? 'right' : 'left'}
      >
        {formatTime(message.timestamp)}
      </Typography>
    </Box>
  );
};

export const LightspeedPanel = () => {
  const classes = useStyles();
  const {
    isOpen, isExpanded, messages,
    open, close, toggleExpand, sendMessage, clearMessages,
  } = useLightspeed();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* RHDH Local pattern: Lightspeed as FAB, not masthead icon */}
      {!isOpen && (
        <Tooltip title="Lightspeed AI" placement="left" arrow>
          <IconButton
            className={classes.fab}
            onClick={() => open()}
            aria-label="Open Lightspeed AI"
          >
            <LightspeedStarIcon size={22} />
          </IconButton>
        </Tooltip>
      )}
      <Slide direction="left" in={isOpen} mountOnEnter unmountOnExit>
        <Box className={`${classes.panel} ${isExpanded ? classes.panelExpanded : classes.panelNarrow}`}>
          <Box className={classes.header}>
            <Box className={classes.headerIcon}>
              <LightspeedStarIcon size={18} />
            </Box>
            <Typography className={classes.headerTitle}>
              Lightspeed
            </Typography>
            <Tooltip title="Clear conversation" arrow>
              <IconButton size="small" className={classes.headerAction} onClick={clearMessages}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isExpanded ? 'Collapse to panel' : 'Expand to full width'} arrow>
              <IconButton size="small" className={classes.headerAction} onClick={toggleExpand}>
                {isExpanded
                  ? <FullscreenExitIcon fontSize="small" />
                  : <FullscreenIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Close" arrow>
              <IconButton size="small" onClick={close} className={classes.headerAction}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box className={`${classes.messagesArea} ${isExpanded ? classes.messagesAreaExpanded : ''}`}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} expanded={isExpanded} />
            ))}
            <div ref={messagesEndRef} />
          </Box>

          <Box className={classes.inputWrapper}>
            <Box className={`${classes.inputArea} ${isExpanded ? classes.inputAreaExpanded : ''}`}>
              <InputBase
                className={`${classes.inputField} ${isExpanded ? classes.inputFieldExpanded : ''}`}
                placeholder="Ask Lightspeed anything..."
                multiline
                maxRows={4}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <IconButton
                className={classes.sendButton}
                onClick={handleSend}
                disabled={!inputValue.trim()}
                size="small"
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Typography className={classes.poweredBy}>
            Powered by Red Hat Lightspeed
          </Typography>
        </Box>
      </Slide>
    </>
  );
};
