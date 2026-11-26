import { Database, KeyRound, Power, RefreshCw, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

function Step({ number, title, children }) {
  return (
    <li className="flex gap-2.5">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-mint-400/12 text-[9px] font-bold text-mint-300 ring-1 ring-inset ring-mint-400/20">
        {number}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-200">{title}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{children}</p>
      </div>
    </li>
  );
}

export default function SetupScreen({ missingKeys, initError, desktop }) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="window-drag flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.05] px-3">
        <Logo className="size-7" iconSize={15} />
        <span className="text-[12px] font-semibold tracking-tight text-white">tiffy</span>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-[0.14em] text-amber-200">
          setup
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
          <div className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
            <Database size={11} />
            Falta un paso
          </div>
          <h1 className="text-[24px] font-semibold leading-[1.12] tracking-[-0.025em] text-white">
            Conecta tu <span className="text-mint-300">Firebase.</span>
          </h1>
          <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
            Tiffy guarda las notas e imágenes en Firebase Realtime Database. Añade las credenciales y
            vuelve a abrir la app.
          </p>
        </div>

        {initError ? (
          <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] p-3">
            <p className="text-[10px] font-semibold text-rose-200">No se pudo iniciar Firebase</p>
            <p className="mt-1 break-words text-[9.5px] leading-relaxed text-rose-300/80">
              {initError.message}
            </p>
          </div>
        ) : null}

        {missingKeys.length > 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-300">
              <KeyRound size={11} className="text-amber-300" />
              Variables pendientes
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {missingKeys.map((key) => (
                <code
                  key={key}
                  className="rounded-md border border-white/[0.06] bg-ink-950/70 px-1.5 py-1 text-[8px] text-amber-200/80"
                >
                  {key}
                </code>
              ))}
            </div>
          </div>
        ) : null}

        <ol className="mt-4 space-y-3">
          <Step number="1" title="Copia el archivo de ejemplo">
            Duplica <code className="text-slate-300">.env.example</code> y renómbralo a{' '}
            <code className="text-slate-300">.env.local</code>.
          </Step>
          <Step number="2" title="Rellena tus credenciales">
            Firebase Console → Configuración del proyecto → Tus apps. Copia los cinco valores del SDK web.
          </Step>
          <Step number="3" title="Reinicia la app">
            En desarrollo, vuelve a ejecutar <code className="text-slate-300">npm run dev</code>. Para
            producción, recompila con <code className="text-slate-300">npm run build</code>.
          </Step>
        </ol>

        <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-ink-950/80 p-2.5 text-[9px] leading-relaxed text-slate-400">
          <code>{'Copy-Item .env.example .env.local\nnpm run dev'}</code>
        </pre>

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-mint-400/15 bg-mint-400/[0.04] p-2.5">
          <ShieldCheck size={12} className="mt-0.5 shrink-0 text-mint-400/80" />
          <p className="text-[9.5px] leading-relaxed text-slate-500">
            Publica también las reglas de <code className="text-slate-300">database.rules.json</code> en
            Firebase para habilitar las salas. Instrucciones completas en el README.
          </p>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-1.5 border-t border-white/[0.05] px-3 py-2 text-[8.5px] text-slate-600">
        <RefreshCw size={9} />
        <span>Los cambios de .env.local requieren reiniciar Vite</span>
      </footer>
    </section>
  );
}
