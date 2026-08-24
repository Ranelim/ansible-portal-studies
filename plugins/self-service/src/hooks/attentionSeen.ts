import { useCallback, useEffect, useState } from 'react';

export type AttentionKey =
  | 'integrations-needs-setup'
  | 'experiences-discover'
  | 'content-quality-remediations';

type AttentionPhase = 'unread' | 'exiting' | 'seen';

/** Hold after landing on the unread tab, then play the exit animation. */
export const ATTENTION_HOLD_MS = 1000;
/** Keep in sync with AttentionDot / ReadCountBadge CSS. */
export const ATTENTION_EXIT_MS = 300;

const listeners = new Set<() => void>();
let store: Record<string, AttentionPhase> = {};
const exitTimers = new Map<string, number>();

function notify() {
  listeners.forEach(fn => fn());
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getAttentionPhase(id: AttentionKey): AttentionPhase {
  return store[id] ?? 'unread';
}

export function isAttentionSeen(id: AttentionKey): boolean {
  return getAttentionPhase(id) === 'seen';
}

export function markAttentionSeen(id: AttentionKey) {
  const timer = exitTimers.get(id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    exitTimers.delete(id);
  }
  if (store[id] === 'seen') return;
  store = { ...store, [id]: 'seen' };
  notify();
}

/** Shrink / drain, then mark seen. Safe to call more than once. */
export function beginAttentionExit(id: AttentionKey) {
  const phase = getAttentionPhase(id);
  if (phase === 'seen' || phase === 'exiting') return;
  store = { ...store, [id]: 'exiting' };
  notify();
  const ms = prefersReducedMotion() ? 0 : ATTENTION_EXIT_MS;
  const timer = window.setTimeout(() => {
    exitTimers.delete(id);
    markAttentionSeen(id);
  }, ms);
  exitTimers.set(id, timer);
}

export function subscribeAttentionSeen(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Session-only. A full refresh restores the blue attention dots. */
export function useAttentionSeen(id: AttentionKey) {
  const [phase, setPhase] = useState(() => getAttentionPhase(id));

  useEffect(
    () => subscribeAttentionSeen(() => setPhase(getAttentionPhase(id))),
    [id],
  );

  const markSeen = useCallback(() => {
    markAttentionSeen(id);
  }, [id]);

  return {
    seen: phase === 'seen',
    exiting: phase === 'exiting',
    markSeen,
  };
}

/**
 * After `isActive` for 1s, play the shared exit animation and clear the pip.
 * Leaving the tab during the hold cancels; once the animation starts it finishes.
 */
export function useAttentionClearOnActive(id: AttentionKey, isActive: boolean) {
  const attention = useAttentionSeen(id);

  useEffect(() => {
    if (!isActive || attention.seen || attention.exiting) return undefined;
    const hold = window.setTimeout(() => {
      beginAttentionExit(id);
    }, ATTENTION_HOLD_MS);
    return () => window.clearTimeout(hold);
  }, [id, isActive, attention.seen, attention.exiting]);

  return attention;
}
