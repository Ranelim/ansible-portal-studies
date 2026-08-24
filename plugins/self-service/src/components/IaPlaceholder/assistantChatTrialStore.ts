import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type AssistantChatThread = {
  id: string;
  title: string;
  updatedAt: number;
};

/** Bump when seed / model changes so stale trial lists reset. */
const STORAGE_KEY = 'portal-assistant-chats-trial-v2';

type Store = {
  threads: AssistantChatThread[];
  activeId: string;
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

function uid(): string {
  return `chat-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Empty draft — lives under “New chat”, not under Recents (Gemini pattern). */
export function isBlankAssistantThread(t: AssistantChatThread): boolean {
  return t.title === 'New chat';
}

function blankThread(): AssistantChatThread {
  return { id: uid(), title: 'New chat', updatedAt: Date.now() };
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      if (
        parsed?.threads?.length &&
        typeof parsed.activeId === 'string' &&
        parsed.threads.some(t => t.id === parsed.activeId)
      ) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const draft = blankThread();
  const pastA: AssistantChatThread = {
    id: uid(),
    title: 'How do I run a template?',
    updatedAt: Date.now() - 86_400_000,
  };
  const pastB: AssistantChatThread = {
    id: uid(),
    title: 'Check repo health score',
    updatedAt: Date.now() - 172_800_000,
  };
  return { threads: [draft, pastA, pastB], activeId: draft.id };
}

let store: Store =
  typeof window !== 'undefined'
    ? readStore()
    : { threads: [], activeId: '' };

function persist(next: Store) {
  store = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot(): Store {
  return store;
}

function getServerSnapshot(): Store {
  return store;
}

/** Prototype chat-thread list shared by Assistant rail + page. */
export function useAssistantChatTrial() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const active = snap.threads.find(t => t.id === snap.activeId);
  const isNewChat = Boolean(active && isBlankAssistantThread(active));
  const recents = useMemo(
    () =>
      snap.threads
        .filter(t => !isBlankAssistantThread(t))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [snap.threads],
  );

  /** Focus empty draft — reuse one blank; do not duplicate under Recents. */
  const newChat = useCallback(() => {
    const existingBlank = store.threads.find(isBlankAssistantThread);
    if (existingBlank) {
      persist({
        threads: [
          existingBlank,
          ...store.threads.filter(t => t.id !== existingBlank.id),
        ],
        activeId: existingBlank.id,
      });
      return;
    }
    const thread = blankThread();
    persist({
      threads: [thread, ...store.threads],
      activeId: thread.id,
    });
  }, []);

  const selectChat = useCallback((id: string) => {
    if (!store.threads.some(t => t.id === id)) return;
    persist({ ...store, activeId: id });
  }, []);

  const clearHistory = useCallback(() => {
    const draft = blankThread();
    persist({ threads: [draft], activeId: draft.id });
  }, []);

  const renameActive = useCallback((title: string) => {
    const trimmed = title.trim() || 'New chat';
    persist({
      ...store,
      threads: store.threads.map(t =>
        t.id === store.activeId
          ? { ...t, title: trimmed, updatedAt: Date.now() }
          : t,
      ),
    });
  }, []);

  return {
    threads: snap.threads,
    activeId: snap.activeId,
    active,
    isNewChat,
    recents,
    newChat,
    selectChat,
    clearHistory,
    renameActive,
  };
}
