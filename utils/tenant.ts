export const ACTIVE_COMPANY_STORAGE_KEY = 'fernagest:tenant:active_company_id:v1';
export const ACTIVE_COMPANY_UPDATED_EVENT = 'fernagest:tenant:active_company_id:updated:v1';

const isBrowser = () => typeof window !== 'undefined';

const normalizeCompanyId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const readStoredActiveCompanyId = (): string | null => {
  if (!isBrowser()) return null;

  try {
    return normalizeCompanyId(window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY));
  } catch {
    return null;
  }
};

export const saveActiveCompanyId = (companyId: string | null): string | null => {
  const normalized = normalizeCompanyId(companyId);
  if (!isBrowser()) return normalized;

  const current = readStoredActiveCompanyId();
  if (current === normalized) return normalized;

  try {
    if (normalized) {
      window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, normalized);
    } else {
      window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
    }

    window.dispatchEvent(
      new CustomEvent<string | null>(ACTIVE_COMPANY_UPDATED_EVENT, {
        detail: normalized
      })
    );
  } catch {
    // ignore storage errors
  }

  return normalized;
};
