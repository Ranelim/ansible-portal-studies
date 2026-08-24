/** Shared user notification prefs (prototype — localStorage). */

export type NotificationEventType =
  | 'template-run-failures'
  | 'quality-alerts'
  | 'compliance-results'
  | 'fleet-updates';

export type NotificationPrefs = Record<NotificationEventType, boolean>;

export const NOTIFICATION_PREF_STORAGE_KEY = 'portal-notification-prefs';
export const NOTIFICATION_PREF_EVENT = 'portal-notification-prefs';

export const NOTIFICATION_EVENT_OPTIONS: Array<{
  id: NotificationEventType;
  title: string;
  description: string;
}> = [
  {
    id: 'template-run-failures',
    title: 'Template run failures',
    description: 'When a template run fails or stops with an error.',
  },
  {
    id: 'quality-alerts',
    title: 'Quality alerts',
    description: 'When a repository health score drops or new high findings appear.',
  },
  {
    id: 'compliance-results',
    title: 'Compliance results',
    description: 'When a compliance scan finishes or findings change.',
  },
  {
    id: 'fleet-updates',
    title: 'Fleet updates',
    description: 'When an edge fleet has an update ready or a rollout needs attention.',
  },
];

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  'template-run-failures': true,
  'quality-alerts': true,
  'compliance-results': true,
  'fleet-updates': true,
};

export function readNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREF_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function writeNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(NOTIFICATION_PREF_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(NOTIFICATION_PREF_EVENT));
}
