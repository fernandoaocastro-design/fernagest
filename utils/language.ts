export type AppLanguage = 'pt-AO' | 'en-US';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
}

export const APP_LANGUAGE_STORAGE_KEY = 'fernagest:app:language:v1';
export const APP_LANGUAGE_UPDATED_EVENT = 'fernagest:app:language-updated';
export const APP_DEFAULT_LANGUAGE: AppLanguage = 'pt-AO';

export const APP_LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'pt-AO', label: 'Português (AO)' },
  { code: 'en-US', label: 'English (US)' }
];

export const normalizeLanguage = (value: unknown): AppLanguage =>
  value === 'en-US' ? 'en-US' : APP_DEFAULT_LANGUAGE;

export const readStoredLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return APP_DEFAULT_LANGUAGE;
  try {
    return normalizeLanguage(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY));
  } catch {
    return APP_DEFAULT_LANGUAGE;
  }
};

export const saveLanguage = (language: AppLanguage) => {
  const normalizedLanguage = normalizeLanguage(language);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalizedLanguage);
    window.dispatchEvent(
      new CustomEvent<AppLanguage>(APP_LANGUAGE_UPDATED_EVENT, {
        detail: normalizedLanguage
      })
    );
  } catch {
    // ignore storage errors
  }
};

export const formatDate = (
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  language: AppLanguage = readStoredLanguage()
) => {
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return '';
  return new Intl.DateTimeFormat(normalizeLanguage(language), options).format(dateValue);
};

export const formatTime = (
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  language: AppLanguage = readStoredLanguage()
) => {
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return '';
  return new Intl.DateTimeFormat(normalizeLanguage(language), options).format(dateValue);
};
