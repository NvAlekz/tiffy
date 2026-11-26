import { Ghost } from 'lucide-react';

export default function GhostBanner({ active }) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-[60] flex justify-center px-3">
      <div className="ghost-pulse flex items-center gap-1.5 rounded-full border border-mint-400/35 bg-ink-950/90 px-2.5 py-1.5 text-[9.5px] font-medium text-mint-200 backdrop-blur-xl">
        <Ghost size={11} />
        <span>Clics atravesando</span>
        <span className="text-mint-200/50">·</span>
        <span className="text-mint-200/70">Ctrl+Shift+J</span>
      </div>
    </div>
  );
}
