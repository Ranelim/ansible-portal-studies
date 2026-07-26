import { useCallback, useMemo, useState } from 'react';

export type NavPluginId =
  | 'apme'
  | 'compliance'
  | 'rhem'
  | 'rhemDevices'
  /** Anti-pattern seat: Compliance + RHEM dump secondary surfaces onto the Operate rail. */
  | 'navSprawl';

export type NavPluginsState = Record<NavPluginId, boolean>;

const STORAGE_KEY = 'portal-nav-plugins';

const DEFAULT_PLUGINS: NavPluginsState = {
  apme: true,
  compliance: true,
  rhem: false,
  /** Prototype: second RHEM rail item (Devices). Rare — only when object needs top-level entry. */
  rhemDevices: false,
  navSprawl: false,
};

function readPlugins(): NavPluginsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLUGINS };
    return { ...DEFAULT_PLUGINS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PLUGINS };
  }
}

/** Prototype-only: which optional experiences appear in nav (seat / plugin factory sim). */
export function useNavPlugins() {
  const [plugins, setPluginsState] = useState<NavPluginsState>(readPlugins);

  const setPlugins = useCallback((next: Partial<NavPluginsState>) => {
    setPluginsState(prev => {
      const merged = { ...prev, ...next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const replacePlugins = useCallback((next: NavPluginsState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPluginsState(next);
  }, []);

  return useMemo(
    () => ({ plugins, setPlugins, replacePlugins }),
    [plugins, setPlugins, replacePlugins],
  );
}

export function writeNavPlugins(next: NavPluginsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
