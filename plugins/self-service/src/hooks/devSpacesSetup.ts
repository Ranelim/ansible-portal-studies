import { useCallback, useEffect, useState } from 'react';

const KEY = 'portal-devspaces-setup';

export type DevSpacesSetupState = {
  connected: boolean;
  url: string;
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function readStore(): DevSpacesSetupState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<
      string,
      unknown
    >;
    return {
      connected: raw.connected === true,
      url: typeof raw.url === 'string' ? raw.url : '',
    };
  } catch {
    return { connected: false, url: '' };
  }
}

function writeStore(next: DevSpacesSetupState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  notify();
}

export function isDevSpacesConnected(): boolean {
  return readStore().connected;
}

export function getDevSpacesSetup(): DevSpacesSetupState {
  return readStore();
}

export function writeDevSpacesSetup(next: DevSpacesSetupState) {
  writeStore(next);
}

export function subscribeDevSpacesSetup(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useDevSpacesSetup() {
  const [state, setState] = useState(readStore);

  useEffect(
    () => subscribeDevSpacesSetup(() => setState(readStore())),
    [],
  );

  const connect = useCallback((url: string) => {
    const next = { connected: true, url: url.trim() };
    writeStore(next);
    setState(next);
  }, []);

  const disconnect = useCallback(() => {
    const next = { connected: false, url: '' };
    writeStore(next);
    setState(next);
  }, []);

  return { ...state, connect, disconnect };
}
