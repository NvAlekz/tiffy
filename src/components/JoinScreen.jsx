import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Hash, Keyboard, Power, Shuffle, User } from 'lucide-react';
import { MAX_ALIAS_LENGTH, MAX_ROOM_CODE_LENGTH } from '../lib/constants';
import { loadDraft, saveDraft } from '../lib/storage';
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '../lib/utils';
import Logo from './Logo';

export default function JoinScreen({ onJoin, desktop }) {
  const [draft] = useState(loadDraft);
  const [room, setRoom] = useState(draft.room);
  const [alias, setAlias] = useState(draft.alias);
  const [error, setError] = useState('');
  const roomRef = useRef(null);
  const aliasRef = useRef(null);

  useEffect(() => {
    if (draft.room) {
      aliasRef.current?.focus();
    } else {
      roomRef.current?.focus();
    }
  }, [draft.room]);

  function handleSubmit(event) {
    event.preventDefault();

    const cleanRoom = normalizeRoomCode(room);
    const cleanAlias = alias.replace(/\s+/g, ' ').trim().slice(0, MAX_ALIAS_LENGTH);

    if (!isValidRoomCode(cleanRoom)) {
      setError('El código debe tener entre 2 y 40 caracteres: a-z, 0-9, guion o guion bajo.');
      roomRef.current?.focus();
      return;
    }

    if (cleanAlias.length < 2) {
      setError('Tu alias necesita al menos 2 caracteres.');
      aliasRef.current?.focus();
      return;
    }

    setError('');
    const next = { room: cleanRoom, alias: cleanAlias };
    saveDraft(next);
    onJoin(next);
  }

  function handleRandomRoom() {
    setRoom(generateRoomCode());
    setError('');
    aliasRef.current?.focus();
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="window-drag flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.05] px-3">
        <Logo className="size-7" iconSize={15} />
        <span className="text-[12px] font-semibold tracking-tight text-white">tiffy</span>
        <span className="rounded-full border border-mint-400/20 bg-mint-400/10 px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-[0.14em] text-mint-300">
          privado
        </span>
        <button
          type="button"
          onClick={desktop?.quit}
          disabled={!desktop?.available}
          title="Salir de Tiffy"
          aria-label="Salir de Tiffy"
          className="no-drag ml-auto grid size-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-rose-300 disabled:pointer-events-none disabled:opacity-30"
        >
          <Power size={13} />
        </button>
      </header>

      <div className="tiffy-scroll flex-1 overflow-y-auto px-4 pb-4">
        <div className="pt-5">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-mint-400/80">
            Dos personas · una sala
          </p>
          <h1 className="text-[25px] font-semibold leading-[1.12] tracking-[-0.025em] text-white">
            Tu línea privada.
            <br />
            <span className="text-mint-300">Fuera de cámara.</span>
          </h1>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-400">
            Notas e imágenes al instante. La ventana no aparece en Zoom, Teams, Discord ni OBS.
          </p>
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="tiffy-room" className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Código de sala
              </label>
              <span className="text-[8.5px] text-slate-600">a-z · 0-9 · - · _</span>
            </div>
            <div className="relative">
              <Hash size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={roomRef}
                id="tiffy-room"
                value={room}
                onChange={(event) => {
                  setRoom(event.target.value.toLowerCase().replace(/\s+/g, '-'));
                  setError('');
                }}
                maxLength={MAX_ROOM_CODE_LENGTH}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="sala-77"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-9 pr-10 text-[12.5px] text-white outline-none transition placeholder:text-slate-600 focus:border-mint-400/45 focus:bg-white/[0.055] focus:ring-2 focus:ring-mint-400/10"
              />
              <button
                type="button"
                onClick={handleRandomRoom}
                title="Generar un código aleatorio"
                aria-label="Generar un código de sala aleatorio"
                className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-mint-300"
              >
                <Shuffle size={13} />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="tiffy-alias" className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Tu alias
            </label>
            <div className="relative">
              <User size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={aliasRef}
                id="tiffy-alias"
                value={alias}
                onChange={(event) => {
                  setAlias(event.target.value);
                  setError('');
                }}
                maxLength={MAX_ALIAS_LENGTH}
                autoComplete="nickname"
                placeholder="Alex"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-9 pr-3 text-[12.5px] text-white outline-none transition placeholder:text-slate-600 focus:border-mint-400/45 focus:bg-white/[0.055] focus:ring-2 focus:ring-mint-400/10"
              />
            </div>
          </div>

          {error ? <p className="text-[10.5px] leading-snug text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="group flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-mint-300 to-mint-500 text-[12px] font-bold text-ink-950 shadow-lg shadow-mint-500/20 transition hover:brightness-110 active:scale-[0.99]"
          >
            Entrar a la sala
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>

        <p className="mt-3 text-center text-[9.5px] leading-relaxed text-slate-600">
          Comparte el código con tu amigo. El código es la llave de la sala.
        </p>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-1.5 border-t border-white/[0.05] px-3 py-2 text-[8px] text-slate-600">
        <Keyboard size={10} className="shrink-0" />
        <span>Ctrl+Shift+H ocultar · J atravesar · O opacidad</span>
      </footer>
    </section>
  );
}
