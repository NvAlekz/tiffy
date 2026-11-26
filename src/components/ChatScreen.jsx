import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ImagePlus, RefreshCw } from 'lucide-react';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { db } from '../lib/firebase';
import { prepareImage } from '../lib/images';
import {
  clearRoomMessages,
  humanizeFirebaseError,
  sendImageMessage,
  sendTextMessage,
} from '../lib/messages';
import { getOrCreateUserId } from '../lib/storage';
import Composer from './Composer';
import ConfirmDialog from './ConfirmDialog';
import Lightbox from './Lightbox';
import MessageList from './MessageList';
import TitleBar from './TitleBar';
import Toast from './Toast';

export default function ChatScreen({ session, onLeave, desktop }) {
  const { room, alias } = session;
  const { messages, loading, error, connection, retry } = useRoomMessages(db, room);
  const userId = useMemo(getOrCreateUserId, []);
  const { copyText } = desktop;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const notify = useCallback((message, tone = 'error') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSendText = useCallback(
    async (text) => {
      try {
        await sendTextMessage({ db, room, alias, senderId: userId, text });
      } catch (sendError) {
        console.error('[tiffy] No se pudo enviar el texto:', sendError);
        notify(humanizeFirebaseError(sendError), 'error');
        throw sendError;
      }
    },
    [alias, notify, room, userId],
  );

  const handleImageFile = useCallback(
    async (file) => {
      if (!file || uploading) return;
      setUploading(true);

      try {
        let image;
        try {
          image = await prepareImage(file);
        } catch (imageError) {
          notify(imageError.message || 'No se pudo preparar la imagen.', 'error');
          return;
        }

        await sendImageMessage({ db, room, alias, senderId: userId, image });
      } catch (sendError) {
        console.error('[tiffy] No se pudo enviar la imagen:', sendError);
        notify(humanizeFirebaseError(sendError), 'error');
      } finally {
        setUploading(false);
      }
    },
    [alias, notify, room, uploading, userId],
  );

  const handleClear = useCallback(async () => {
    if (clearing) return;
    setClearing(true);

    try {
      await clearRoomMessages(db, room);
      setConfirmOpen(false);
      notify('Sala limpia. No queda ningún mensaje.', 'success');
    } catch (clearError) {
      console.error('[tiffy] No se pudo limpiar la sala:', clearError);
      notify(humanizeFirebaseError(clearError), 'error');
    } finally {
      setClearing(false);
    }
  }, [clearing, notify, room]);

  const handleCopy = useCallback(
    async (text) => {
      const copied = await copyText(text);
      if (!copied) notify('No se pudo copiar el mensaje.', 'error');
      return copied;
    },
    [copyText, notify],
  );

  useEffect(() => {
    function handlePaste(event) {
      if (event.defaultPrevented) return;

      const item = Array.from(event.clipboardData?.items ?? []).find(
        (entry) => entry.kind === 'file' && entry.type.startsWith('image/'),
      );
      if (!item) return;

      const file = item.getAsFile();
      if (!file) return;

      event.preventDefault();
      handleImageFile(file);
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleImageFile]);

  function hasFiles(event) {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files');
  }

  function handleDragEnter(event) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    if (dragDepth.current === 1) setDragging(true);
  }

  function handleDragOver(event) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDragLeave(event) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);

    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 1) notify('Envía las imágenes de una en una.', 'info');
    if (files[0]) handleImageFile(files[0]);
  }

  return (
    <section
      className="relative flex h-full min-h-0 flex-col"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TitleBar
        room={room}
        status={error ? 'error' : connection}
        desktop={desktop}
        hasMessages={messages.length > 0}
        clearing={clearing}
        onClear={() => setConfirmOpen(true)}
        onLeave={onLeave}
      />

      {error ? (
        <div className="mx-2.5 mt-2 flex shrink-0 items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-2">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="min-w-0 flex-1 text-[9.5px] leading-relaxed text-amber-100/80">{error}</p>
          <button
            type="button"
            onClick={retry}
            title="Reintentar conexión"
            aria-label="Reintentar conexión"
            className="grid size-6 shrink-0 place-items-center rounded-md text-amber-200/80 transition hover:bg-amber-300/10 hover:text-amber-100"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      ) : null}

      <MessageList
        key={room}
        messages={messages}
        loading={loading}
        room={room}
        currentUserId={userId}
        onCopy={handleCopy}
        onOpenImage={setLightboxImage}
      />

      <Composer onSendText={handleSendText} onSendImage={handleImageFile} uploading={uploading} />

      <Toast toast={toast} onClose={() => setToast(null)} />

      <ConfirmDialog
        open={confirmOpen}
        title="¿Limpiar la sala?"
        description={`Se borrarán todos los mensajes e imágenes de #${room} para ambos. Esta acción no se puede deshacer.`}
        confirmLabel="Borrar todo"
        loading={clearing}
        onConfirm={handleClear}
        onCancel={() => {
          if (!clearing) setConfirmOpen(false);
        }}
      />

      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

      {dragging ? (
        <div className="pointer-events-none absolute inset-2.5 z-40 grid place-items-center rounded-2xl border-2 border-dashed border-mint-400/50 bg-ink-950/85 backdrop-blur-md">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="grid size-11 place-items-center rounded-2xl bg-mint-400/12 text-mint-300">
              <ImagePlus size={20} />
            </div>
            <p className="text-[12px] font-semibold text-white">Suelta la imagen</p>
            <p className="text-[9.5px] text-slate-500">Se comprime antes de enviarla</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
