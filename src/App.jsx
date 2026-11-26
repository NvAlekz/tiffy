import { useState } from 'react';
import ChatScreen from './components/ChatScreen';
import GhostBanner from './components/GhostBanner';
import JoinScreen from './components/JoinScreen';
import SetupScreen from './components/SetupScreen';
import { useDesktopBridge } from './hooks/useDesktopBridge';
import { db, initError, isFirebaseConfigured, missingConfigKeys } from './lib/firebase';
import { clearSession, loadSession, saveDraft, saveSession } from './lib/storage';

function WindowDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -left-24 -top-28 size-64 rounded-full bg-mint-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 size-52 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-mint-400/50 to-transparent" />
    </>
  );
}

export default function App() {
  const desktop = useDesktopBridge();
  const [session, setSession] = useState(loadSession);

  function handleJoin(nextSession) {
    saveSession(nextSession);
    saveDraft(nextSession);
    setSession(nextSession);
  }

  function handleLeave() {
    clearSession();
    setSession(null);
  }

  const configReady = isFirebaseConfigured && Boolean(db);

  return (
    <main className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[18px] border border-white/10 bg-ink-950/90 text-slate-100">
      <WindowDecor />
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        {!configReady ? (
          <SetupScreen missingKeys={missingConfigKeys} initError={initError} desktop={desktop} />
        ) : session ? (
          <ChatScreen session={session} onLeave={handleLeave} desktop={desktop} />
        ) : (
          <JoinScreen onJoin={handleJoin} desktop={desktop} />
        )}
      </div>
      <GhostBanner active={desktop.ghostMode} />
    </main>
  );
}
