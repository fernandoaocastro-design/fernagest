export interface NotificationPreferences {
  emailAlerts: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
}

export const NOTIFICATION_PREFERENCES_STORAGE_KEY =
  'fernagest:settings:notifications:v1';
export const NOTIFICATION_PREFERENCES_UPDATED_EVENT =
  'fernagest:settings:notifications:updated:v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailAlerts: true,
  pushNotifications: false,
  weeklyDigest: true
};

const isBrowser = () => typeof window !== 'undefined';

const normalizeNotificationPreferences = (
  value: Partial<NotificationPreferences> | null | undefined
): NotificationPreferences => ({
  emailAlerts:
    typeof value?.emailAlerts === 'boolean'
      ? value.emailAlerts
      : DEFAULT_NOTIFICATION_PREFERENCES.emailAlerts,
  pushNotifications:
    typeof value?.pushNotifications === 'boolean'
      ? value.pushNotifications
      : DEFAULT_NOTIFICATION_PREFERENCES.pushNotifications,
  weeklyDigest:
    typeof value?.weeklyDigest === 'boolean'
      ? value.weeklyDigest
      : DEFAULT_NOTIFICATION_PREFERENCES.weeklyDigest
});

export const readStoredNotificationPreferences = (): NotificationPreferences => {
  if (!isBrowser()) return DEFAULT_NOTIFICATION_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    return normalizeNotificationPreferences(
      JSON.parse(raw) as Partial<NotificationPreferences>
    );
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

export const saveNotificationPreferences = (
  value: NotificationPreferences
): NotificationPreferences => {
  const normalized = normalizeNotificationPreferences(value);
  if (!isBrowser()) return normalized;

  try {
    window.localStorage.setItem(
      NOTIFICATION_PREFERENCES_STORAGE_KEY,
      JSON.stringify(normalized)
    );
    window.dispatchEvent(
      new CustomEvent<NotificationPreferences>(
        NOTIFICATION_PREFERENCES_UPDATED_EVENT,
        { detail: normalized }
      )
    );
  } catch {
    // ignore storage errors
  }

  return normalized;
};
