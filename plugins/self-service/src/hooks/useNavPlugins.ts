import { useCallback, useEffect, useMemo, useState } from 'react';

export type NavPluginId = 'apme' | 'compliance' | 'rhem';

export type NavPluginsState = Record<NavPluginId, boolean>;

const STORAGE_KEY = 'portal-nav-plugins';

const DEFAULT_PLUGINS: NavPluginsState = {
  apme: true,
  compliance: true,
  rhem: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

/** Drop legacy anti-pattern flags from stored JSON. */
function sanitize(raw: Partial<NavPluginsState> & Record<string, unknown>): NavPluginsState {
  return {
    apme: Boolean(raw.apme ?? DEFAULT_PLUGINS.apme),
    compliance: Boolean(raw.compliance ?? DEFAULT_PLUGINS.compliance),
    rhem: Boolean(raw.rhem ?? DEFAULT_PLUGINS.rhem),
  };
}

function readPlugins(): NavPluginsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLUGINS };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PLUGINS };
  }
}

export function readNavPlugins(): NavPluginsState {
  return readPlugins();
}

/** Prototype-only: which optional plugins appear in nav (seat sim). */
export function useNavPlugins() {
  const [plugins, setPluginsState] = useState<NavPluginsState>(readPlugins);

  // Re-read after seat switch reloads / other tabs; always strip legacy flags
  useEffect(() => {
    const next = readPlugins();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPluginsState(next);
  }, []);

  useEffect(() => {
    const sync = () => setPluginsState(readPlugins());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const setPlugins = useCallback((next: Partial<NavPluginsState>) => {
    setPluginsState(prev => {
      const merged = sanitize({ ...prev, ...next });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      notify();
      return merged;
    });
  }, []);

  const replacePlugins = useCallback((next: NavPluginsState) => {
    const clean = sanitize(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    setPluginsState(clean);
    notify();
  }, []);

  return useMemo(
    () => ({ plugins, setPlugins, replacePlugins }),
    [plugins, setPlugins, replacePlugins],
  );
}

export function writeNavPlugins(next: NavPluginsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(next)));
  notify();
}
