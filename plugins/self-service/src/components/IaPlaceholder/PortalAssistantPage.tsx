import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
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

const useStyles = makeStyles(theme => ({
  title: {
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.3,
    color: theme.palette.text.primary,
  },
  emptyTitle: {
    fontWeight: 600,
    fontSize: 18,
    lineHeight: 1.35,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 1.55,
    color: theme.palette.text.secondary,
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
  const { threads, activeId, isNewChat } = useAssistantChatTrial();
  const active = threads.find(t => t.id === activeId);

  return (
    <div
      data-portal-assistant-shell=""
      role="main"
      aria-label="Assistant"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        height: '100%',
        minHeight: 0,
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'var(--portal-assistant-bg, #fff)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          minHeight: 0,
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: showPageHeader ? '16px 24px 0' : '8px 24px 0',
          boxSizing: 'border-box',
        }}
      >
        {showPageHeader && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              paddingBottom: 12,
            }}
          >
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

        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
          aria-label="Chat thread"
        >
          <div
            style={{
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '16px 16px 24px',
              maxWidth: 440,
              margin: '0 auto',
            }}
            role="status"
          >
            <Typography className={classes.emptyTitle} component="h2">
              {isNewChat || !active
                ? 'AI help for this console'
                : active.title}
            </Typography>
            <Typography className={classes.emptyBody}>
              Ask about anything in Automation Portal — find work, run
              templates, check quality, or navigate experiences — without
              leaving this page.
            </Typography>
          </div>
        </div>
      </div>

      <div
        data-portal-assistant-composer=""
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          alignItems: 'flex-end',
          width: '100%',
          padding: '12px 24px 16px',
          borderTop: '1px solid rgba(0,0,0,0.12)',
          backgroundColor: 'var(--portal-assistant-bg, #fff)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            width: '100%',
            maxWidth: 720,
          }}
        >
          <TextField
            className={classes.input}
            size="small"
            variant="outlined"
            fullWidth
            placeholder="Ask about Automation Portal…"
            multiline
            maxRows={4}
            inputProps={{ 'aria-label': 'Message Assistant' }}
          />
          <IconButton
            className={classes.send}
            color="primary"
            aria-label="Send"
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

/**
 * Full-screen Assistant — cross-experience AI help (prototype).
 *
 * Side-nav trial: Page fills SidebarPage card; composer is flex footer.
 * Flag off → rail-less portal + title Back (rollback).
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
    el.style.setProperty(
      'background-color',
      'var(--portal-assistant-bg, #fff)',
      'important',
    );
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

  const ui = (
    <div ref={shellRef}>
      <AssistantBody
        showPageHeader
        sme={sme}
        onBack={goExperiences}
      />
    </div>
  );

  return createPortal(ui, document.body);
};
