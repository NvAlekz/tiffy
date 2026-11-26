import { Ghost } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Logo({ className, iconSize = 17 }) {
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-mint-300 via-mint-400 to-emerald-500 text-ink-950 shadow-lg shadow-mint-500/20',
        className ?? 'size-8',
      )}
    >
      <Ghost size={iconSize} strokeWidth={2.4} />
    </div>
  );
}
