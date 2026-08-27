import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  PropsWithChildren,
} from 'react';
import {
  POST_SETUP_RESET_EVENT,
  OPEN_QUICKSTART_EVENT,
  readQuickstartCompleted,
  writeQuickstartCompleted,
} from '@ansible/plugin-backstage-self-service';

export type QuickstartItemCta = {
  text: string;
  link: string;
};

export type QuickstartItem = {
  id: string;
  title: string;
  description: string;
  icon:
    | 'aap'
    | 'auth'
    | 'registry'
    | 'scm'
    | 'rbac'
    | 'sync'
    | 'play'
    | 'develop'
    | 'compliance'
    | 'edge'
    | 'orchestrator'
    | 'experiences';
  roles: ('admin' | 'developer')[];
  cta?: QuickstartItemCta;
};

type QuickstartContextType = {
  isOpen: boolean;
  items: QuickstartItem[];
  completedIds: Set<string>;
  progress: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleItem: (id: string) => void;
  isCompleted: (id: string) => boolean;
};

const QuickstartCtx = createContext<QuickstartContextType | null>(null);

const ADMIN_QUICKSTART_ITEMS: QuickstartItem[] = [
  {
    id: 'connect-integrations',
    title: 'Connect integrations',
    description:
      'Connect Git, Private Automation Hub, registries, and Dev Spaces. Ansible Automation Platform is already connected from Day 0.',
    icon: 'registry',
    roles: ['admin'],
    cta: {
      text: 'Open Integrations',
      link: '/self-service/admin/integrations',
    },
  },
  {
    id: 'configure-access',
    title: 'Configure access control',
    description:
      'Define who can view, create, and manage content, and who can enter each experience.',
    icon: 'rbac',
    roles: ['admin'],
    cta: {
      text: 'Manage access',
      link: '/rbac',
    },
  },
  {
    id: 'setup-experiences',
    title: 'Discover and set up experiences',
    description:
      'Enable Develop, Compliance, Edge, and Orchestrator so they appear with Launch on the Bridge. Hide and edit stay here — not on the cards.',
    icon: 'experiences',
    roles: ['admin'],
    cta: {
      text: 'Open Experiences',
      link: '/self-service/admin/experiences?tab=discover',
    },
  },
  {
    id: 'review-sync',
    title: 'Review sync schedules',
    description:
      'Set how often the Portal syncs templates and content from your connections.',
    icon: 'sync',
    roles: ['admin'],
    cta: {
      text: 'Open Integrations',
      link: '/self-service/admin/integrations',
    },
  },
];

export const QuickstartProvider = ({ children }: PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    readQuickstartCompleted,
  );

  useEffect(() => {
    const onWorldChange = () => {
      setCompletedIds(readQuickstartCompleted());
      setIsOpen(false);
    };
    const onOpen = () => setIsOpen(true);
    window.addEventListener(POST_SETUP_RESET_EVENT, onWorldChange);
    window.addEventListener(OPEN_QUICKSTART_EVENT, onOpen);
    return () => {
      window.removeEventListener(POST_SETUP_RESET_EVENT, onWorldChange);
      window.removeEventListener(OPEN_QUICKSTART_EVENT, onOpen);
    };
  }, []);

  const items = ADMIN_QUICKSTART_ITEMS;

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    const done = items.filter(item => completedIds.has(item.id)).length;
    return Math.round((done / items.length) * 100);
  }, [items, completedIds]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const toggleItem = useCallback((id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      writeQuickstartCompleted(next);
      return next;
    });
  }, []);

  const isCompleted = useCallback(
    (id: string) => completedIds.has(id),
    [completedIds],
  );

  return (
    <QuickstartCtx.Provider
      value={{
        isOpen,
        items,
        completedIds,
        progress,
        open,
        close,
        toggle,
        toggleItem,
        isCompleted,
      }}
    >
      {children}
    </QuickstartCtx.Provider>
  );
};

export const useQuickstart = () => {
  const ctx = useContext(QuickstartCtx);
  if (!ctx)
    throw new Error('useQuickstart must be used within QuickstartProvider');
  return ctx;
};
