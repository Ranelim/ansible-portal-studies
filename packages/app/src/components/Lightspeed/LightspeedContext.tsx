import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  PropsWithChildren,
} from 'react';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type LightspeedContextType = {
  isOpen: boolean;
  isExpanded: boolean;
  messages: ChatMessage[];
  open: (contextMessage?: string) => void;
  close: () => void;
  toggle: () => void;
  toggleExpand: () => void;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
};

const LightspeedCtx = createContext<LightspeedContextType | null>(null);

const DEMO_GREETING: ChatMessage = {
  role: 'assistant',
  content:
    "Hi, I'm Lightspeed — your AI assistant for Red Hat Developer Hub. " +
    'I can help you understand pipeline failures, draft automation content, ' +
    'troubleshoot issues, or explore RHDH features. How can I help?',
  timestamp: new Date(),
};

const generateDemoResponse = (userMessage: string): string => {
  const lower = userMessage.toLowerCase();
  if (lower.includes('pipeline') || lower.includes('fail') || lower.includes('lint')) {
    return (
      'Based on the pipeline context, the **Lint** stage failed with 3 errors:\n\n' +
      '1. **Missing name in tasks** — Tasks at lines 12, 28, and 45 are missing the `name` attribute. ' +
      'Adding descriptive names improves readability and debugging.\n' +
      '2. **Deprecated module usage** — `command` module at line 33 should be replaced with `ansible.builtin.command`.\n\n' +
      'Would you like me to suggest fixes for these issues?'
    );
  }
  if (lower.includes('aap') || lower.includes('push') || lower.includes('deploy')) {
    return (
      'Pushing to AAP creates or updates two resources in your Ansible Controller:\n\n' +
      '- **AAP Project** — links to your Git repository so the Controller can pull content.\n' +
      '- **Job Template** — defines how the automation runs (inventory, credentials, EE).\n\n' +
      'This is a manual action by design — it gives you control over when validated content reaches production.'
    );
  }
  if (lower.includes('execution environment') || lower.includes(' ee ') || lower.includes('ee ')) {
    return (
      'Execution Environments (EEs) are container images that package Ansible, ' +
      'Python dependencies, and collections into a consistent runtime. They replace ' +
      'the legacy `ansible-tower` virtual environments. You can build custom EEs with ' +
      '`ansible-builder` or use certified ones from Red Hat.'
    );
  }
  return (
    "I can help with that. Could you provide a bit more detail about what you're looking for? " +
    'For example, I can explain pipeline stages, help debug failures, ' +
    'draft playbook content, or walk you through RHDH features.'
  );
};

export const LightspeedProvider = ({ children }: PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([DEMO_GREETING]);

  const open = useCallback((contextMessage?: string) => {
    if (contextMessage) {
      const userMsg: ChatMessage = {
        role: 'user',
        content: contextMessage,
        timestamp: new Date(),
      };
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: generateDemoResponse(contextMessage),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg, aiMsg]);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (prev) setIsExpanded(false);
      return !prev;
    });
  }, []);

  const toggleExpand = useCallback(() => setIsExpanded(prev => !prev), []);

  const sendMessage = useCallback((content: string) => {
    const userMsg: ChatMessage = { role: 'user', content, timestamp: new Date() };
    const aiMsg: ChatMessage = {
      role: 'assistant',
      content: generateDemoResponse(content),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg, aiMsg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([DEMO_GREETING]);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      open(detail?.context);
    };
    window.addEventListener('lightspeed:open', handler);
    return () => window.removeEventListener('lightspeed:open', handler);
  }, [open]);

  return (
    <LightspeedCtx.Provider value={{
      isOpen, isExpanded, messages,
      open, close, toggle, toggleExpand, sendMessage, clearMessages,
    }}>
      {children}
    </LightspeedCtx.Provider>
  );
};

export const useLightspeed = () => {
  const ctx = useContext(LightspeedCtx);
  if (!ctx) throw new Error('useLightspeed must be used within LightspeedProvider');
  return ctx;
};
