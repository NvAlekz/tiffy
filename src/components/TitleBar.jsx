import { useEffect, useRef, useState } from 'react';
import {
  EyeOff,
  Ghost,
  LogOut,
  MoreHorizontal,
  Power,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';

const STATUS = {
  online: { dot: 'bg-mint-400 shadow-[0_0_7px_rgba(53,223,178,0.75)]', label: 'en línea' },
  connecting: { dot: 'bg-amber-300 animate-pulse', label: 'conectando…' },
  offline: { dot: 'bg-amber-400 animate-pulse', label: 'reconectando…' },
  error: { dot: 'bg-rose-400', label: 'error de conexión' },
};

function IconButton({ label, active, disabled, onClick, children, className }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'no-drag grid size-7 place-items-center rounded-lg text-slate-400 transition',
        'hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-30',
        active && 'bg-mint-400/15 text-mint-300 ring-1 ring-inset ring-mint-400/30',
        className,
      )}
    >
      {children}
    </button>
  );
}

function MenuItem({ icon: Icon, label, hint, onClick, active, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium transition',
        'text-slate-300 hover:bg-white/[0.07] hover:text-white disabled:pointer-events-none disabled:opacity-35',
        active && 'text-mint-300',
        danger && 'text-rose-300 hover:bg-rose-500/10 hover:text-rose-200',
      )}
    >
      <Icon size={13} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint ? <span className="shrink-0 text-[8.5px] font-normal tracking-wide text-slate-600">{hint}</span> : null}
    </button>
  );
}

export default function TitleBar({ room, status, desktop, hasMessages, clearing, onClear, onLeave }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const meta = STATUS[status] ?? STATUS.connecting;
  const percent = Math.round((desktop?.opacity ?? 1) * 100);
  const bridgeReady = Boolean(desktop?.available);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  function choose(action) {
    setMenuOpen(false);
    action?.();
  }

  return (
    <header className="window-drag relative z-30 flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] px-2.5">
      <Logo className="size-7" iconSize={15} />

      <div className="min-w-0 flex-1 select-none">
        <p className="truncate text-[12px] font-semibold leading-tight tracking-tight text-white">#{room}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[9px] leading-none text-slate-500">
          <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} />
          <span className="truncate">{meta.label}</span>
        </div>
      </div>

      <div className="no-drag flex items-center gap-0.5">
        <IconButton
          label={`Modo fantasma · Ctrl+Shift+J`}
          active={desktop?.ghostMode}
          disabled={!bridgeReady}
          onClick={desktop?.toggleGhostMode}
        >
          <Ghost size={14} />
        </IconButton>

        <button
          type="button"
          title="Cambiar opacidad · Ctrl+Shift+O"
          aria-label={`Opacidad actual ${percent}%. Cambiar opacidad`}
          disabled={!bridgeReady}
          onClick={desktop?.cycleOpacity}
          className="no-drag h-7 min-w-9 rounded-lg px-1 text-[8.5px] font-semibold tabular-nums text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          {percent}%
        </button>

        <IconButton
          label="Limpiar sala"
          disabled={!hasMessages || clearing}
          onClick={onClear}
        >
          <Trash2 size={14} />
        </IconButton>

        <div className="relative" ref={menuRef}>
          <IconButton
            label="Más opciones"
            active={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal size={15} />
          </IconButton>

          {menuOpen ? (
            <div
              role="menu"
              className="no-drag absolute right-0 top-[calc(100%+7px)] z-50 w-64 rounded-xl border border-white/10 bg-ink-900/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-2xl"
            >
              <MenuItem
                icon={Ghost}
                label="Modo fantasma"
                hint="Ctrl+Shift+J"
                active={desktop?.ghostMode}
                disabled={!bridgeReady}
                onClick={() => choose(desktop?.toggleGhostMode)}
              />
              <MenuItem
                icon={EyeOff}
                label={`Opacidad · ${percent}%`}
                hint="Ctrl+Shift+O"
                disabled={!bridgeReady}
                onClick={() => choose(desktop?.cycleOpacity)}
              />
              <MenuItem
                icon={MoreHorizontal}
                label="Ocultar ventana"
                hint="Ctrl+Shift+H"
                disabled={!bridgeReady}
                onClick={() => choose(desktop?.hideWindow)}
              />

              <div className="my-1 h-px bg-white/[0.06]" />

              <MenuItem icon={LogOut} label="Cambiar de sala" onClick={() => choose(onLeave)} />
              <MenuItem
                icon={Power}
                label="Salir de Tiffy"
                danger
                disabled={!bridgeReady}
                onClick={() => choose(desktop?.quit)}
              />

              {desktop?.contentProtected ? (
                <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.025] px-2 py-1.5 text-[8.5px] text-slate-500">
                  <ShieldCheck size={10} className="shrink-0 text-mint-400/80" />
                  Excluida de capturas y grabaciones
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
