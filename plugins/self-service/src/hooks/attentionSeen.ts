import { useCallback, useEffect, useState } from 'react';

export type AttentionKey = 'integrations-needs-setup' | 'experiences-discover';

const listeners = new Set<() => void>();
let store: Record<string, boolean> = {};

function notify() {
  listeners.forEach(fn => fn());
}

export function isAttentionSeen(id: AttentionKey): boolean {
  return store[id] === true;
}

export function markAttentionSeen(id: AttentionKey) {
  if (store[id] === true) return;
  store = { ...store, [id]: true };
  notify();
}

export function subscribeAttentionSeen(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Session-only. A full refresh restores the blue attention dots. */
export function useAttentionSeen(id: AttentionKey) {
  const [seen, setSeen] = useState(() => isAttentionSeen(id));

  useEffect(
    () => subscribeAttentionSeen(() => setSeen(isAttentionSeen(id))),
    [id],
  );

  const markSeen = useCallback(() => {
    markAttentionSeen(id);
    setSeen(true);
  }, [id]);

  return { seen, markSeen };
}
