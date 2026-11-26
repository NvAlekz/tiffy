import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Send } from 'lucide-react';
import { MAX_MESSAGE_LENGTH } from '../lib/constants';
import { cn } from '../lib/utils';

export default function Composer({ onSendText, onSendImage, uploading }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 116)}px`;
  }, [text]);

  async function submit() {
    const value = text.trim();
    if (!value || sending) return;

    setSending(true);
    setText('');

    try {
      await onSendText(value);
    } catch {
      setText((current) => current || value);
    } finally {
      setSending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onSendImage(file);
  }

  const busy = sending || uploading;

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-ink-900/50 px-2.5 pb-2 pt-2">
      <div
        className={cn(
          'flex items-end gap-1 rounded-2xl border border-white/[0.07] bg-ink-850/80 p-1.5 transition',
          'focus-within:border-mint-400/25 focus-within:bg-ink-850',
        )}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          title="Enviar imagen · también puedes pegarla"
          aria-label="Adjuntar imagen"
          className="mb-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-mint-300 disabled:pointer-events-none disabled:opacity-40"
        >
          {uploading ? <Loader2 size={15} className="animate-spin text-mint-300" /> : <ImagePlus size={15} />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={sending}
          placeholder="Escribe una nota…"
          aria-label="Escribe un mensaje"
          className="tiffy-scroll max-h-[116px] min-h-7 flex-1 resize-none bg-transparent px-1 py-1.5 text-[12px] leading-[1.4] text-slate-100 outline-none placeholder:text-slate-600 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || busy}
          title="Enviar mensaje"
          aria-label="Enviar mensaje"
          className="mb-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-mint-300 to-mint-500 text-ink-950 shadow-md shadow-mint-500/15 transition hover:brightness-110 disabled:bg-none disabled:bg-white/[0.05] disabled:text-slate-600 disabled:shadow-none"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 px-1 text-[8px] text-slate-600">
        <span>{uploading ? 'Preparando imagen…' : 'Enter envía · Shift+Enter salto'}</span>
        {text.length >= 3600 ? (
          <span className={cn('tabular-nums', text.length >= MAX_MESSAGE_LENGTH && 'text-amber-300')}>
            {text.length}/{MAX_MESSAGE_LENGTH}
          </span>
        ) : null}
      </div>
    </div>
  );
}
