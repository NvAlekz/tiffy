import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    cancelRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape' && !loading) onCancel();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="tiffy-confirm-title"
        aria-describedby="tiffy-confirm-description"
        className="animate-rise w-full rounded-2xl border border-white/10 bg-ink-900 p-4 shadow-2xl shadow-black/50"
      >
        <div className="mb-2.5 flex items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-300">
            <AlertTriangle size={16} />
          </div>
          <h2 id="tiffy-confirm-title" className="text-[13px] font-semibold text-white">
            {title}
          </h2>
        </div>

        <p id="tiffy-confirm-description" className="text-[11.5px] leading-relaxed text-slate-400">
          {description}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-9 flex-1 rounded-lg border border-white/10 bg-white/[0.04] text-[11.5px] font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-9 flex-1 rounded-lg text-[11.5px] font-semibold transition',
              'bg-rose-500 text-white shadow-lg shadow-rose-950/30 hover:bg-rose-400 disabled:opacity-60',
            )}
          >
            {loading ? 'Borrando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
