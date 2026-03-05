export interface NotificationPreferences {
  emailAlerts: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
}

export interface NotificationEmailDeliveryState {
  immediateSentAlertIds: string[];
  weeklyDigestPendingAlertIds: string[];
  weeklyDigestLastSentAt: string | null;
}

export const NOTIFICATION_PREFERENCES_STORAGE_KEY =
  'fernagest:settings:notifications:v1';
export const NOTIFICATION_PREFERENCES_UPDATED_EVENT =
  'fernagest:settings:notifications:updated:v1';
export const NOTIFICATION_EMAIL_DELIVERY_STORAGE_KEY =
  'fernagest:notifications:email:state:v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailAlerts: true,
  pushNotifications: false,
  weeklyDigest: true
};

export const DEFAULT_NOTIFICATION_EMAIL_DELIVERY_STATE: NotificationEmailDeliveryState = {
  immediateSentAlertIds: [],
  weeklyDigestPendingAlertIds: [],
  weeklyDigestLastSentAt: null
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

const normalizeAlertIdList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return Array.from(new Set(ids));
};

const normalizeIsoDateTime = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const normalizeNotificationEmailDeliveryState = (
  value: Partial<NotificationEmailDeliveryState> | null | undefined
): NotificationEmailDeliveryState => ({
  immediateSentAlertIds: normalizeAlertIdList(value?.immediateSentAlertIds),
  weeklyDigestPendingAlertIds: normalizeAlertIdList(value?.weeklyDigestPendingAlertIds),
  weeklyDigestLastSentAt: normalizeIsoDateTime(value?.weeklyDigestLastSentAt)
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

export const readStoredNotificationEmailDeliveryState = (): NotificationEmailDeliveryState => {
  if (!isBrowser()) return DEFAULT_NOTIFICATION_EMAIL_DELIVERY_STATE;

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_EMAIL_DELIVERY_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_EMAIL_DELIVERY_STATE;
    return normalizeNotificationEmailDeliveryState(
      JSON.parse(raw) as Partial<NotificationEmailDeliveryState>
    );
  } catch {
    return DEFAULT_NOTIFICATION_EMAIL_DELIVERY_STATE;
  }
};

export const saveNotificationEmailDeliveryState = (
  value: NotificationEmailDeliveryState
): NotificationEmailDeliveryState => {
  const normalized = normalizeNotificationEmailDeliveryState(value);
  if (!isBrowser()) return normalized;

  try {
    window.localStorage.setItem(
      NOTIFICATION_EMAIL_DELIVERY_STORAGE_KEY,
      JSON.stringify(normalized)
    );
  } catch {
    // ignore storage errors
  }

  return normalized;
};
