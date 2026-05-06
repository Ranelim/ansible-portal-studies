import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  PropsWithChildren,
} from 'react';

export type QuickstartItemCta = {
  text: string;
  link: string;
};

export type QuickstartItem = {
  id: string;
  title: string;
  description: string;
  icon: 'aap' | 'auth' | 'registry' | 'scm' | 'rbac' | 'sync';
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

const STORAGE_KEY = 'portal-quickstart-progress';

const loadCompleted = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveCompleted = (ids: Set<string>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
};

const ADMIN_QUICKSTART_ITEMS: QuickstartItem[] = [
  {
    id: 'connect-registries',
    title: 'Connect content registries',
    description:
      'Add Private Automation Hub, Red Hat Certified Content, or Ansible Galaxy as content ' +
      'sources to discover collections and execution environments.',
    icon: 'registry',
    roles: ['admin'],
    cta: {
      text: 'Open registries',
      link: '/self-service/admin/connections/registries',
    },
  },
  {
    id: 'connect-scm',
    title: 'Connect source control',
    description:
      'Connect GitHub or GitLab to enable project creation, content discovery from Git repositories, ' +
      'and developer workspaces.',
    icon: 'scm',
    roles: ['admin'],
    cta: {
      text: 'Open GitHub',
      link: '/self-service/admin/connections/github',
    },
  },
  {
    id: 'configure-discovery',
    title: 'Configure content discovery',
    description:
      'Open each connection to define which organizations, repositories, and collections the portal ' +
      'discovers. Content discovery and sync schedules are configured per integration.',
    icon: 'sync',
    roles: ['admin'],
    cta: {
      text: 'Open connections',
      link: '/self-service/admin/connections',
    },
  },
  {
    id: 'configure-rbac',
    title: 'Configure access control',
    description:
      'Define roles and permissions to control who can view, create, or manage content ' +
      'across the portal.',
    icon: 'rbac',
    roles: ['admin'],
    cta: {
      text: 'Manage RBAC',
      link: '/rbac',
    },
  },
];

export const QuickstartProvider = ({ children }: PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(loadCompleted);

  const items = ADMIN_QUICKSTART_ITEMS;

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((completedIds.size / items.length) * 100);
  }, [items.length, completedIds.size]);

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
      saveCompleted(next);
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
