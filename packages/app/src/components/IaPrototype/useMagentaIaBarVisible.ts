import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'portal-magenta-ia-bar-visible';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function readVisible(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
  } catch {
    /* ignore */
  }
  return true;
}

export function writeMagentaIaBarVisible(visible: boolean) {
  localStorage.setItem(STORAGE_KEY, visible ? '1' : '0');
  notify();
}

/** Prototype TEMP magenta compare bar — show/hide (masthead eye + layout). */
export function useMagentaIaBarVisible() {
  const [visible, setVisibleState] = useState(readVisible);

  useEffect(() => {
    const sync = () => setVisibleState(readVisible());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const setVisible = useCallback((next: boolean) => {
    writeMagentaIaBarVisible(next);
    setVisibleState(next);
  }, []);

  const toggle = useCallback(() => {
    setVisible(!readVisible());
  }, [setVisible]);

  return useMemo(
    () => ({ visible, setVisible, toggle }),
    [visible, setVisible, toggle],
  );
}
