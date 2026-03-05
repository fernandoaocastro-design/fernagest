import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';
import { ConfirmPayload, feedbackEvents, NotifyPayload } from '../utils/feedback';

interface ToastItem extends NotifyPayload {
  id: number;
}

const FeedbackCenter = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmPayload | null>(null);

  useEffect(() => {
    const onNotify = (event: Event) => {
      const customEvent = event as CustomEvent<NotifyPayload>;
      const detail = customEvent.detail;
      const toast: ToastItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        level: detail.level,
        message: detail.message,
        durationMs: detail.durationMs
      };

      setToasts((prev) => [...prev, toast]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, toast.durationMs || 3500);
    };

    const onConfirm = (event: Event) => {
      const customEvent = event as CustomEvent<ConfirmPayload>;
      setConfirmRequest(customEvent.detail);
    };

    window.addEventListener(feedbackEvents.notify, onNotify as EventListener);
    window.addEventListener(feedbackEvents.confirm, onConfirm as EventListener);

    return () => {
      window.removeEventListener(feedbackEvents.notify, onNotify as EventListener);
      window.removeEventListener(feedbackEvents.confirm, onConfirm as EventListener);
    };
  }, []);

  const tone = useMemo(() => {
    return {
      success: {
        box: 'border-green-200 bg-green-50 text-green-900',
        icon: <CheckCircle2 size={16} className="text-green-600" />
      },
      error: {
        box: 'border-red-200 bg-red-50 text-red-900',
        icon: <XCircle size={16} className="text-red-600" />
      },
      warning: {
        box: 'border-amber-200 bg-amber-50 text-amber-900',
        icon: <AlertTriangle size={16} className="text-amber-600" />
      },
      info: {
        box: 'border-blue-200 bg-blue-50 text-blue-900',
        icon: <Info size={16} className="text-blue-600" />
      }
    } as const;
  }, []);

  const resolveConfirm = (result: boolean) => {
    if (!confirmRequest) return;
    confirmRequest.resolve(result);
    setConfirmRequest(null);
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-80 max-w-[90vw] rounded-lg border px-3 py-2 shadow-sm flex items-start gap-2 ${tone[toast.level].box}`}
          >
            <div className="mt-0.5">{tone[toast.level].icon}</div>
            <p className="text-sm leading-snug">{toast.message}</p>
          </div>
        ))}
      </div>

      {confirmRequest && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmRequest.title || 'Confirmar ação'}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{confirmRequest.message}</p>
            </div>
            <div className="p-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => resolveConfirm(false)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                {confirmRequest.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => resolveConfirm(true)}
                className={`px-3 py-2 rounded-lg text-sm text-white ${
                  confirmRequest.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmRequest.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackCenter;
