import { useCallback, useEffect, useState } from 'react';
import type { JobExperienceId } from './experienceRecent';
import { clearQuickstartCompleted } from './adminQuickstart';
import { SHOW_ORCHESTRATOR_EXPERIENCE } from '../components/IaPlaceholder/orchestratorExperience';

/** Experiences that need a one-time admin setup wizard after Day 0. */
export type SetupExperienceId = 'develop' | 'compliance' | 'edge' | 'orchestrator';

export const SETUP_EXPERIENCE_IDS: SetupExperienceId[] = [
  'develop',
  'compliance',
  'edge',
  'orchestrator',
];

const KEY = 'portal-experience-setup';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

function isSetupExperienceId(id: string): id is SetupExperienceId {
  return (SETUP_EXPERIENCE_IDS as string[]).includes(id);
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

/** Automate is ready after Day 0. Others are ready after their setup wizard. */
export function isExperienceReady(id: JobExperienceId): boolean {
  if (id === 'automate') return true;
  if (isSetupExperienceId(id)) return isExperienceSetup(id);
  return true;
}

export function writeExperienceSetup(id: SetupExperienceId, setup: boolean) {
  writeAllExperienceSetup({ ...readStore(), [id]: setup });
}

export function writeAllExperienceSetup(next: Record<string, boolean>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  notify();
}

/** Same-window signal so Quick start reloads after a demo-world change. */
export const POST_SETUP_RESET_EVENT = 'portal-post-setup-reset';

function emitDemoWorldChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(POST_SETUP_RESET_EVENT));
  }
}

/**
 * First admin session on the Portal after Day 0: experiences are not enabled
 * yet (except Automate). Clears Quick start checkmarks so the map matches.
 */
export function resetExperienceSetupForSetupLanding() {
  try {
    localStorage.setItem(KEY, JSON.stringify({}));
    clearQuickstartCompleted();
  } catch {
    /* ignore */
  }
  notify();
  emitDemoWorldChanged();
}

/** @deprecated Use resetExperienceSetupForSetupLanding */
export const resetExperienceSetupForPostSetupLanding =
  resetExperienceSetupForSetupLanding;

export function anyExperienceNeedsSetup(): boolean {
  return SETUP_EXPERIENCE_IDS.some(id => {
    if (!SHOW_ORCHESTRATOR_EXPERIENCE && id === 'orchestrator') return false;
    return !isExperienceSetup(id);
  });
}

export function experienceSetupPath(id: SetupExperienceId): string {
  return `/self-service/admin/experiences/${id}/setup`;
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

export function useExperienceReadiness() {
  const [version, setVersion] = useState(0);

  useEffect(
    () => subscribeExperienceSetup(() => setVersion(v => v + 1)),
    [],
  );

  const isReady = useCallback(
    (id: JobExperienceId) => isExperienceReady(id),
    [version],
  );

  return {
    version,
    isReady,
  };
}
