import { useCallback, useEffect, useState } from 'react';

/** Installed experiences that still need a one-time admin setup wizard. */
export type SetupExperienceId = 'orchestrator';

const KEY = 'portal-experience-setup';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function readStore(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<
      string,
      unknown
    >;
    const next: Record<string, boolean> = {};
    Object.keys(raw).forEach(id => {
      if (typeof raw[id] === 'boolean') next[id] = raw[id];
    });
    return next;
  } catch {
    return {};
  }
}

export function isExperienceSetup(id: SetupExperienceId): boolean {
  return readStore()[id] === true;
}

export function writeExperienceSetup(id: SetupExperienceId, setup: boolean) {
  const next = { ...readStore(), [id]: setup };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  notify();
}

export function subscribeExperienceSetup(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useExperienceSetup(id: SetupExperienceId) {
  const [setup, setSetup] = useState(() => isExperienceSetup(id));

  useEffect(
    () =>
      subscribeExperienceSetup(() => setSetup(isExperienceSetup(id))),
    [id],
  );

  const markSetup = useCallback(() => {
    writeExperienceSetup(id, true);
    setSetup(true);
  }, [id]);

  return { setup, markSetup };
}
