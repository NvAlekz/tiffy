import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

const TONES = {
  error: {
    icon: AlertTriangle,
    className: 'border-rose-400/25 bg-rose-950/95 text-rose-100',
    iconClassName: 'text-rose-300',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-mint-400/25 bg-ink-900/95 text-mint-200',
    iconClassName: 'text-mint-300',
  },
  info: {
    icon: Info,
    className: 'border-white/10 bg-ink-900/95 text-slate-200',
    iconClassName: 'text-slate-400',
  },
};

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const tone = TONES[toast.tone] ?? TONES.info;
  const Icon = tone.icon;

  return (
    <div className="absolute inset-x-3 bottom-[82px] z-40 flex justify-center">
      <div
        role="status"
        className={cn(
          'animate-toast flex w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-[11px] leading-snug shadow-xl shadow-black/30 backdrop-blur-xl',
          tone.className,
        )}
      >
        <Icon size={13} className={cn('mt-0.5 shrink-0', tone.iconClassName)} />
        <p className="min-w-0 flex-1 break-words">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="-m-0.5 rounded-md p-0.5 opacity-60 transition hover:bg-white/10 hover:opacity-100"
          aria-label="Cerrar aviso"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
