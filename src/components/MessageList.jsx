import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Check, Copy, Ghost } from 'lucide-react';
import { aliasColor, cn, formatClock, formatDayLabel, isSameDay } from '../lib/utils';

function DayDivider({ timestamp }) {
  return (
    <div className="my-3 flex items-center gap-2 px-1">
      <div className="h-px flex-1 bg-white/[0.05]" />
      <span className="text-[8px] font-medium uppercase tracking-[0.14em] text-slate-600">
        {formatDayLabel(timestamp)}
      </span>
      <div className="h-px flex-1 bg-white/[0.05]" />
    </div>
  );
}

function MessageBubble({ message, own, showAlias, onCopy, onOpenImage, onMediaLoad }) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const hasImage =
    message.type === 'image' &&
    typeof message.image?.dataUrl === 'string' &&
    message.image.dataUrl.startsWith('data:image/');
  const text = message.type === 'text' ? String(message.text ?? '') : '';

  if (!hasImage && !text) return null;

  async function handleCopy() {
    if (!text) return;
    const success = await onCopy(text);
    if (!success) return;

    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className={cn('group flex w-full', own ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[86%] flex-col', own ? 'items-end' : 'items-start')}>
        {showAlias && !own ? (
          <span
            className="mb-0.5 max-w-full truncate px-1 text-[8.5px] font-semibold"
            style={{ color: aliasColor(message.alias) }}
          >
            {message.alias || 'Anónimo'}
          </span>
        ) : null}

        {hasImage ? (
          <button
            type="button"
            onClick={() => onOpenImage(message.image)}
            title="Abrir imagen"
            className="group/image relative block max-w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-800 shadow-md shadow-black/25 outline-none transition hover:border-white/20 focus-visible:ring-2 focus-visible:ring-mint-400/50"
          >
            <img
              src={message.image.dataUrl}
              alt={`Imagen enviada por ${message.alias || 'un usuario'}`}
              width={message.image.width || undefined}
              height={message.image.height || undefined}
              className="max-h-60 w-auto max-w-full object-cover"
              draggable={false}
              onLoad={onMediaLoad}
            />
            <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] tabular-nums text-white/85 backdrop-blur-sm">
              {formatClock(message.createdAt)}
            </span>
          </button>
        ) : (
          <div
            className={cn(
              'relative rounded-2xl px-2.5 py-1.5 text-[12px] leading-[1.45] shadow-sm',
              own
                ? 'rounded-br-md bg-gradient-to-br from-mint-400 to-emerald-500 text-ink-950'
                : 'rounded-bl-md border border-white/[0.06] bg-ink-800 text-slate-100',
            )}
          >
            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{text}</p>
            <div
              className={cn(
                'mt-0.5 flex items-center justify-end gap-1 text-[8px] leading-none',
                own ? 'text-ink-950/55' : 'text-slate-500',
              )}
            >
              <span className="tabular-nums">{formatClock(message.createdAt)}</span>
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? 'Copiado' : 'Copiar mensaje'}
                aria-label="Copiar mensaje"
                className={cn(
                  'grid size-4 place-items-center rounded opacity-0 transition group-hover:opacity-60 focus-visible:opacity-100',
                  own ? 'hover:bg-black/10 hover:opacity-100' : 'hover:bg-white/10 hover:opacity-100',
                )}
              >
                {copied ? <Check size={9} /> : <Copy size={9} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 py-2">
      <div className="ml-auto h-11 w-[58%] animate-pulse rounded-2xl rounded-br-md bg-white/[0.045]" />
      <div className="h-9 w-[46%] animate-pulse rounded-2xl rounded-bl-md bg-white/[0.035]" />
      <div className="ml-auto h-16 w-[64%] animate-pulse rounded-2xl rounded-br-md bg-white/[0.04]" />
    </div>
  );
}

function EmptyState({ room }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
      <div className="grid size-11 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
        <Ghost size={20} />
      </div>
      <p className="mt-3 text-[12px] font-medium text-slate-300">La sala está en silencio</p>
      <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-slate-500">
        Escribe una nota o pega una imagen. Comparte <span className="text-mint-300">#{room}</span> con tu
        amigo.
      </p>
    </div>
  );
}

export default function MessageList({ messages, loading, room, currentUserId, onCopy, onOpenImage }) {
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true);
  const countRef = useRef(0);
  const [showJump, setShowJump] = useState(false);

  function scrollToBottom() {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    pinnedRef.current = true;
    setShowJump(false);
  }

  useEffect(() => {
    if (messages.length === 0) {
      countRef.current = 0;
      return;
    }

    if (pinnedRef.current) {
      scrollToBottom();
    } else if (messages.length > countRef.current) {
      setShowJump(true);
    }

    countRef.current = messages.length;
  }, [messages]);

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) return;

    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    const pinned = distance < 64;
    pinnedRef.current = pinned;

    if (pinned) setShowJump(false);
  }

  function handleMediaLoad() {
    if (pinnedRef.current) scrollToBottom();
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="tiffy-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="flex min-h-full flex-col px-3 py-3">
          {loading ? (
            <LoadingSkeleton />
          ) : messages.length === 0 ? (
            <EmptyState room={room} />
          ) : (
            messages.map((message, index) => {
              const previous = messages[index - 1];
              const own = message.senderId === currentUserId;
              const dayChanged = !previous || !isSameDay(previous.createdAt, message.createdAt);
              const sameSender = previous && previous.senderId === message.senderId && !dayChanged;
              const showAlias = !own && !sameSender;

              return (
                <div
                  key={message.id}
                  className={cn(
                    index > 0 && !sameSender && 'mt-2',
                    dayChanged && index > 0 && 'mt-1',
                  )}
                >
                  {dayChanged ? <DayDivider timestamp={message.createdAt} /> : null}
                  <MessageBubble
                    message={message}
                    own={own}
                    showAlias={showAlias}
                    onCopy={onCopy}
                    onOpenImage={onOpenImage}
                    onMediaLoad={handleMediaLoad}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {showJump ? (
        <button
          type="button"
          onClick={scrollToBottom}
          className="animate-toast absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-ink-900/95 px-2.5 py-1.5 text-[9px] font-medium text-slate-300 shadow-xl shadow-black/40 backdrop-blur transition hover:border-mint-400/30 hover:text-mint-200"
        >
          <ArrowDown size={11} />
          Ir al final
        </button>
      ) : null}
    </div>
  );
}
