import { useCallback, useEffect, useState } from 'react';

/** Job-mode experiences an admin can show or hide on Bridge + the switcher. */
export type BridgeExperienceId =
  | 'automate'
  | 'develop'
  | 'compliance'
  | 'edge'
  | 'orchestrator';

const KEY = 'portal-bridge-experience-visibility';

const DEFAULT_VISIBLE: Record<BridgeExperienceId, boolean> = {
  automate: true,
  develop: true,
  compliance: true,
  edge: true,
  orchestrator: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function isBridgeExperienceId(id: string): id is BridgeExperienceId {
  return (
    id === 'automate' ||
    id === 'develop' ||
    id === 'compliance' ||
    id === 'edge' ||
    id === 'orchestrator'
  );
}

export function readBridgeExperienceVisibility(): Record<
  BridgeExperienceId,
  boolean
> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<
      string,
      unknown
    >;
    const next = { ...DEFAULT_VISIBLE };
    (Object.keys(DEFAULT_VISIBLE) as BridgeExperienceId[]).forEach(id => {
      if (typeof raw[id] === 'boolean') {
        next[id] = raw[id];
      }
    });
    return next;
  } catch {
    return { ...DEFAULT_VISIBLE };
  }
}

export function writeBridgeExperienceVisibility(
  id: BridgeExperienceId,
  visible: boolean,
) {
  const next = { ...readBridgeExperienceVisibility(), [id]: visible };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  notify();
}

/** Assistant / Admin / Bridge 'all' are not governed by this toggle. */
export function isJobExperienceOnBridge(id: string): boolean {
  if (!isBridgeExperienceId(id)) return true;
  return readBridgeExperienceVisibility()[id];
}

export function subscribeBridgeExperienceVisibility(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useBridgeExperienceVisibility() {
  const [visibility, setVisibility] = useState(readBridgeExperienceVisibility);

  useEffect(
    () =>
      subscribeBridgeExperienceVisibility(() =>
        setVisibility(readBridgeExperienceVisibility()),
      ),
    [],
  );

  const setVisible = useCallback(
    (id: BridgeExperienceId, visible: boolean) => {
      writeBridgeExperienceVisibility(id, visible);
      setVisibility(readBridgeExperienceVisibility());
    },
    [],
  );

  return { visibility, setVisible };
}
