import { readStoredLanguage } from './language';

export type AppCurrency = 'AOA' | 'USD' | 'EUR';

export interface CurrencyOption {
  code: AppCurrency;
  label: string;
  locale: string;
  symbol: string;
}

export const APP_CURRENCY_STORAGE_KEY = 'fernagest:app:currency:v1';
export const APP_CURRENCY_UPDATED_EVENT = 'fernagest:app:currency-updated';
export const APP_DEFAULT_CURRENCY: AppCurrency = 'AOA';

export const APP_CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'AOA', label: 'Kwanza (AOA)', locale: 'pt-AO', symbol: 'Kz' },
  { code: 'USD', label: 'Dolar (USD)', locale: 'en-US', symbol: '$' },
  { code: 'EUR', label: 'Euro (EUR)', locale: 'pt-PT', symbol: 'EUR' }
];

const CURRENCY_BY_CODE = APP_CURRENCY_OPTIONS.reduce<Record<AppCurrency, CurrencyOption>>(
  (acc, option) => {
    acc[option.code] = option;
    return acc;
  },
  {} as Record<AppCurrency, CurrencyOption>
);

export const normalizeCurrency = (value: unknown): AppCurrency =>
  value === 'USD' || value === 'EUR' || value === 'AOA' ? value : APP_DEFAULT_CURRENCY;

export const getCurrencyOption = (currency: AppCurrency): CurrencyOption =>
  CURRENCY_BY_CODE[currency] || CURRENCY_BY_CODE[APP_DEFAULT_CURRENCY];

export const readStoredCurrency = (): AppCurrency => {
  if (typeof window === 'undefined') return APP_DEFAULT_CURRENCY;
  try {
    return normalizeCurrency(window.localStorage.getItem(APP_CURRENCY_STORAGE_KEY));
  } catch {
    return APP_DEFAULT_CURRENCY;
  }
};

export const saveCurrency = (currency: AppCurrency) => {
  const normalizedCurrency = normalizeCurrency(currency);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APP_CURRENCY_STORAGE_KEY, normalizedCurrency);
    window.dispatchEvent(
      new CustomEvent<AppCurrency>(APP_CURRENCY_UPDATED_EVENT, {
        detail: normalizedCurrency
      })
    );
  } catch {
    // ignore storage errors
  }
};

export const formatCurrency = (
  value: number,
  currency: AppCurrency = readStoredCurrency(),
  language = readStoredLanguage()
) => {
  const normalizedCurrency = normalizeCurrency(currency);
  const option = getCurrencyOption(normalizedCurrency);
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(language || option.locale, {
    style: 'currency',
    currency: option.code
  }).format(safeValue);
};

export const getCurrencySymbol = (currency: AppCurrency = readStoredCurrency()) =>
  getCurrencyOption(normalizeCurrency(currency)).symbol;
