export type FeedbackLevel = 'info' | 'success' | 'warning' | 'error';

export interface NotifyPayload {
  level: FeedbackLevel;
  message: string;
  durationMs?: number;
}

export interface ConfirmPayload {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (result: boolean) => void;
}

const FEEDBACK_NOTIFY_EVENT = 'fernagest:notify';
const FEEDBACK_CONFIRM_EVENT = 'fernagest:confirm';

const isBrowser = () => typeof window !== 'undefined';

export const feedbackEvents = {
  notify: FEEDBACK_NOTIFY_EVENT,
  confirm: FEEDBACK_CONFIRM_EVENT
};

export const notify = (level: FeedbackLevel, message: string, durationMs = 3500) => {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new CustomEvent<NotifyPayload>(FEEDBACK_NOTIFY_EVENT, {
      detail: { level, message, durationMs }
    })
  );
};

export const notifySuccess = (message: string, durationMs?: number) =>
  notify('success', message, durationMs);

export const notifyError = (message: string, durationMs?: number) =>
  notify('error', message, durationMs);

export const notifyInfo = (message: string, durationMs?: number) =>
  notify('info', message, durationMs);

export const notifyWarning = (message: string, durationMs?: number) =>
  notify('warning', message, durationMs);

export const confirmAction = (
  input:
    | string
    | {
        title?: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        danger?: boolean;
      }
) => {
  if (!isBrowser()) return Promise.resolve(false);

  const details = typeof input === 'string' ? { message: input } : input;

  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(
      new CustomEvent<ConfirmPayload>(FEEDBACK_CONFIRM_EVENT, {
        detail: {
          ...details,
          resolve
        }
      })
    );
  });
};
