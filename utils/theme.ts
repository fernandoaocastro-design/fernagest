export type AppTheme = 'light' | 'dark';

export const APP_THEME_STORAGE_KEY = 'fernagest:ui:theme:v1';
export const APP_THEME_UPDATED_EVENT = 'fernagest:ui:theme-updated';
export const APP_DEFAULT_THEME: AppTheme = 'light';

export const normalizeTheme = (value: unknown): AppTheme =>
  value === 'dark' ? 'dark' : APP_DEFAULT_THEME;

export const applyTheme = (theme: AppTheme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = theme === 'dark';
  root.classList.toggle('dark', isDark);
  root.setAttribute('data-theme', theme);
};

export const readStoredTheme = (): AppTheme => {
  if (typeof window === 'undefined') return APP_DEFAULT_THEME;
  try {
    return normalizeTheme(window.localStorage.getItem(APP_THEME_STORAGE_KEY));
  } catch {
    return APP_DEFAULT_THEME;
  }
};

export const saveTheme = (theme: AppTheme) => {
  const normalizedTheme = normalizeTheme(theme);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(APP_THEME_STORAGE_KEY, normalizedTheme);
      window.dispatchEvent(
        new CustomEvent<AppTheme>(APP_THEME_UPDATED_EVENT, {
          detail: normalizedTheme
        })
      );
    } catch {
      // ignore storage errors
    }
  }
  applyTheme(normalizedTheme);
};
