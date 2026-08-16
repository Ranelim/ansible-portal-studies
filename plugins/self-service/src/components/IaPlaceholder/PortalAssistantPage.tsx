import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Page, Content } from '@backstage/core-components';
import SendIcon from '@material-ui/icons/Send';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { useUserRoleContext } from '../../hooks/useUserRole';
import { isSmeRole } from './navIaReviewMods';
import { ASSISTANT_SIDE_NAV_TRIAL } from './assistantIaTrial';
import { useAssistantChatTrial } from './assistantChatTrialStore';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };

const useStyles = makeStyles(theme => ({
  title: {
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.3,
    color: theme.palette.text.primary,
  },
  shell: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    height: '100%',
    minHeight: 0,
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.default,
    overflow: 'hidden',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flexShrink: 0,
    padding: theme.spacing(2, 3, 1.5),
  },
  /** Gemini-like empty: greeting + floating composer, vertically centered. */
  emptyStage: {
    flex: '1 1 auto',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3, 3, 6),
    boxSizing: 'border-box',
  },
  emptyGreeting: {
    fontWeight: 300,
    fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: theme.palette.text.primary,
    textAlign: 'center',
    margin: 0,
    maxWidth: 520,
  },
  emptyHint: {
    marginTop: theme.spacing(1.5),
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    maxWidth: 420,
  },
  floatComposerWrap: {
    width: '100%',
    maxWidth: 680,
    marginTop: theme.spacing(4),
  },
  stickyComposer: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: theme.spacing(1.5, 3, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    boxSizing: 'border-box',
  },
  stickyComposerInner: {
    width: '100%',
    maxWidth: 720,
  },
  thread: {
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    width: '100%',
    maxWidth: 720,
    margin: '0 auto',
    padding: theme.spacing(2, 3, 2),
    boxSizing: 'border-box',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    padding: theme.spacing(1.25, 2),
    borderRadius: 20,
    backgroundColor: theme.palette.action.hover,
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.primary,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    padding: theme.spacing(1.25, 0),
    fontSize: 14,
    lineHeight: 1.55,
    color: theme.palette.text.primary,
  },
  /** Single pill surface — TextField is the only box (no wrapper chrome). */
  pillInput: {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: 28,
      backgroundColor: theme.palette.background.paper,
      paddingRight: theme.spacing(0.5),
      alignItems: 'flex-end',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.divider,
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.text.disabled,
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.text.secondary,
      borderWidth: 1,
    },
    '& .MuiInputBase-input': {
      fontSize: 15,
      lineHeight: 1.45,
      padding: theme.spacing(1.5, 1, 1.5, 2),
    },
  },
  send: {
    borderRadius: 20,
    height: 40,
    width: 40,
    flexShrink: 0,
    marginBottom: 2,
  },
}));

function readChromeTopPx(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--portal-chrome-top')
    .trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 64;
}

type ShellBox = { top: number; height: number };

function measureShellBox(): ShellBox {
  const chrome = readChromeTopPx();
  const vv = window.visualViewport;
  const vh = vv?.height ?? window.innerHeight;
  const offsetTop = vv?.offsetTop ?? 0;
  return {
    top: offsetTop + chrome,
    height: Math.max(240, vh - chrome),
  };
}

type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  variant: 'float' | 'sticky';
  autoFocus?: boolean;
};

const Composer = ({
  value,
  onChange,
  onSend,
  variant,
  autoFocus,
}: ComposerProps) => {
  const classes = useStyles();

  return (
    <TextField
      className={classes.pillInput}
      data-portal-assistant-composer=""
      data-composer-variant={variant}
      size="small"
      variant="outlined"
      fullWidth
      placeholder="Ask about Automation Portal…"
      multiline
      maxRows={4}
      value={value}
      autoFocus={autoFocus}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
      }}
      inputProps={{ 'aria-label': 'Message Assistant' }}
      InputProps={{
        endAdornment: (
          <IconButton
            className={classes.send}
            color="primary"
            aria-label="Send"
            onClick={onSend}
            disabled={!value.trim()}
            edge="end"
          >
            <SendIcon fontSize="small" />
          </IconButton>
        ),
      }}
    />
  );
};

type AssistantBodyProps = {
  showPageHeader: boolean;
  sme: boolean;
  onBack?: () => void;
};

const AssistantBody = ({
  showPageHeader,
  sme,
  onBack,
}: AssistantBodyProps) => {
  const classes = useStyles();
  const { activeId, isNewChat, active, renameActive } = useAssistantChatTrial();
  const [draft, setDraft] = useState('');
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({});

  const messages = messagesByChat[activeId] ?? [];
  const isEmpty = messages.length === 0;

  useEffect(() => {
    setDraft('');
  }, [activeId]);

  const send = () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      text,
    };
    const reply: ChatMessage = {
      id: `m-${Date.now()}-a`,
      role: 'assistant',
      text: 'This is a prototype reply. In product, Assistant would answer from Automation Portal context.',
    };
    setMessagesByChat(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), userMsg, reply],
    }));
    setDraft('');
    if (isNewChat) {
      const title =
        text.length > 48 ? `${text.slice(0, 45).trim()}…` : text;
      renameActive(title);
    }
  };

  return (
    <div
      className={classes.shell}
      data-portal-assistant-shell=""
      role="main"
      aria-label="Assistant"
    >
      {showPageHeader && (
        <div className={classes.pageHeader}>
          {!sme && onBack && (
            <IconButton
              size="small"
              aria-label="Back to Experiences"
              onClick={onBack}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Typography className={classes.title} component="h1">
            Assistant
          </Typography>
        </div>
      )}

      {isEmpty ? (
        <div className={classes.emptyStage} role="status">
          <Typography className={classes.emptyGreeting} component="h2">
            {isNewChat || !active
              ? 'Where should we start?'
              : active.title}
          </Typography>
          <Typography className={classes.emptyHint}>
            Ask about templates, quality, inventories, or how to move
            through experiences — without leaving this page.
          </Typography>
          <div className={classes.floatComposerWrap}>
            <Composer
              variant="float"
              value={draft}
              onChange={setDraft}
              onSend={send}
              autoFocus
            />
          </div>
        </div>
      ) : (
        <>
          <div className={classes.thread} aria-label="Chat thread">
            {messages.map(m => (
              <Box
                key={m.id}
                className={
                  m.role === 'user'
                    ? classes.bubbleUser
                    : classes.bubbleAssistant
                }
              >
                {m.text}
              </Box>
            ))}
          </div>
          <div className={classes.stickyComposer}>
            <div className={classes.stickyComposerInner}>
              <Composer
                variant="sticky"
                value={draft}
                onChange={setDraft}
                onSend={send}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Full-screen Assistant — cross-experience AI help (prototype).
 *
 * Empty state: centered greeting + floating composer (sticky footer hidden).
 * Active chat: thread + sticky bottom composer.
 */
export const PortalAssistantPage = () => {
  const navigate = useNavigate();
  const { role } = useUserRoleContext();
  const sme = isSmeRole(role);
  const shellRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<ShellBox>(() =>
    typeof window !== 'undefined'
      ? measureShellBox()
      : { top: 64, height: 600 },
  );

  useEffect(() => {
    document.title = 'Assistant | Automation Portal';
  }, []);

  useEffect(() => {
    if (!ASSISTANT_SIDE_NAV_TRIAL) return undefined;
    document.documentElement.setAttribute('data-portal-assistant-rail', '');
    return () => {
      document.documentElement.removeAttribute('data-portal-assistant-rail');
    };
  }, []);

  useEffect(() => {
    if (ASSISTANT_SIDE_NAV_TRIAL) return undefined;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useLayoutEffect(() => {
    if (ASSISTANT_SIDE_NAV_TRIAL) return undefined;
    const sync = () => setBox(measureShellBox());
    sync();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', sync);
    vv?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    return () => {
      vv?.removeEventListener('resize', sync);
      vv?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  useLayoutEffect(() => {
    if (ASSISTANT_SIDE_NAV_TRIAL) return;
    const el = shellRef.current;
    if (!el) return;
    el.style.setProperty('position', 'fixed', 'important');
    el.style.setProperty('top', `${box.top}px`, 'important');
    el.style.setProperty('left', '0', 'important');
    el.style.setProperty('right', '0', 'important');
    el.style.setProperty('bottom', 'auto', 'important');
    el.style.setProperty('height', `${box.height}px`, 'important');
    el.style.setProperty('width', '100%', 'important');
    el.style.setProperty('z-index', '1200', 'important');
    el.style.setProperty('display', 'flex', 'important');
    el.style.setProperty('flex-direction', 'column', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    el.style.setProperty('box-sizing', 'border-box', 'important');
  }, [box]);

  const goExperiences = () => navigate('/self-service/experiences');

  if (ASSISTANT_SIDE_NAV_TRIAL) {
    return (
      <Page themeId="tool">
        <Content noPadding>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: '1 1 auto',
              height: '100%',
              minHeight: 0,
            }}
          >
            <AssistantBody showPageHeader={false} sme={sme} />
          </div>
        </Content>
      </Page>
    );
  }

  return createPortal(
    <div ref={shellRef}>
      <AssistantBody showPageHeader sme={sme} onBack={goExperiences} />
    </div>,
    document.body,
  );
};
