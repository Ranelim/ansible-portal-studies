import { useEffect, useState } from 'react';
import { isDevSpacesConnected } from './devSpacesSetup';
import { readSetupDemoMode } from './setupDemoMode';

/** Integrations that persist connected vs not — Dev Spaces stays in its own store. */
export const SYNC_CONNECTION_IDS = [
  'aap',
  'pah',
  'github',
  'gitlab',
  'registries',
] as const;

export type SyncConnectionId = (typeof SYNC_CONNECTION_IDS)[number];

export type ConnectionSetupMap = Record<SyncConnectionId, boolean>;

const KEY = 'portal-connection-setup';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function isSyncConnectionId(id: string): id is SyncConnectionId {
  return (SYNC_CONNECTION_IDS as readonly string[]).includes(id);
}

/** After Day 0: AAP only. Git, Hub, and registries still need connecting. */
export const FIRST_SESSION_CONNECTIONS: ConnectionSetupMap = {
  aap: true,
  pah: false,
  github: false,
  gitlab: false,
  registries: false,
};

/** Experiences ready. Optional Dev Spaces leftover is the Dev Spaces store. */
export const POST_SETUP_CONNECTIONS: ConnectionSetupMap = {
  aap: true,
  pah: true,
  github: true,
  gitlab: true,
  registries: true,
};

function defaultFromDemoMode(): ConnectionSetupMap {
  return readSetupDemoMode() === 'post-setup'
    ? { ...POST_SETUP_CONNECTIONS }
    : { ...FIRST_SESSION_CONNECTIONS };
}

function readStore(): ConnectionSetupMap {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as Record<
      string,
      unknown
    > | null;
    if (!raw || typeof raw !== 'object') return defaultFromDemoMode();
    const next = defaultFromDemoMode();
    SYNC_CONNECTION_IDS.forEach(id => {
      if (typeof raw[id] === 'boolean') next[id] = raw[id];
    });
    return next;
  } catch {
    return defaultFromDemoMode();
  }
}

function writeStore(next: ConnectionSetupMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  notify();
}

export function readConnectionSetup(): ConnectionSetupMap {
  return readStore();
}

export function writeAllConnectionSetup(next: ConnectionSetupMap) {
  writeStore({ ...next });
}

export function writeConnectionSetup(id: SyncConnectionId, connected: boolean) {
  writeStore({ ...readStore(), [id]: connected });
}

export function isConnectionConnected(id: string): boolean {
  if (id === 'devspaces') return isDevSpacesConnected();
  if (!isSyncConnectionId(id)) return false;
  return readStore()[id];
}

export function anyConnectionNeedsSetup(): boolean {
  const map = readStore();
  return (
    SYNC_CONNECTION_IDS.some(id => !map[id]) || !isDevSpacesConnected()
  );
}

export function withLiveConnectionStatus<
  T extends { id: string; status: string; lastSync?: string },
>(
  provider: T,
  extras: { connectionMap: ConnectionSetupMap; devSpacesConnected: boolean },
): T {
  const connected =
    provider.id === 'devspaces'
      ? extras.devSpacesConnected
      : isSyncConnectionId(provider.id)
        ? extras.connectionMap[provider.id]
        : false;
  if (connected) {
    return { ...provider, status: 'Active' };
  }
  return { ...provider, status: 'Not configured', lastSync: undefined };
}

export function subscribeConnectionSetup(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useConnectionSetup() {
  const [map, setMap] = useState(readStore);

  useEffect(
    () => subscribeConnectionSetup(() => setMap(readStore())),
    [],
  );

  return map;
}
