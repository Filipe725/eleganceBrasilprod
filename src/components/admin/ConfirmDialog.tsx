'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Ação destrutiva (vermelho) ou neutra (tinta padrão). */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmação do painel admin — substitui o `window.confirm()`
 * nativo do navegador (sem estilo, trava a UI, mostra a URL do site) por
 * um pop-up consistente com o resto do painel.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancelar"
        className="absolute inset-0 animate-fade-in bg-ink-950/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger ? 'bg-red-50 text-red-600' : 'bg-gold-500/10 text-gold-600'
            }`}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-display text-lg font-semibold text-ink-900"
            >
              {title}
            </h2>
            <p id="confirm-dialog-message" className="mt-1.5 text-sm text-ink-700/80">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="tap-target rounded-xl border border-ink-700/25 px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-ink-900/5 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            autoFocus
            className={`tap-target inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-ink-900 hover:bg-ink-800'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
