import { limitToLast, onValue, orderByChild, push, query, ref, remove } from 'firebase/database';
import { MAX_MESSAGE_LENGTH, MESSAGE_PAGE_SIZE } from './constants';
import { getServerNow } from './firebase';

function messagesPath(room) {
  return `rooms/${room}/messages`;
}

export function subscribeToMessages(db, room, { onMessages, onError }) {
  const roomQuery = query(
    ref(db, messagesPath(room)),
    orderByChild('createdAt'),
    limitToLast(MESSAGE_PAGE_SIZE),
  );

  return onValue(
    roomQuery,
    (snapshot) => {
      const messages = [];
      snapshot.forEach((child) => {
        const value = child.val();
        if (!value || typeof value !== 'object') return;
        messages.push({ id: child.key, ...value });
      });
      messages.sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0));
      onMessages(messages);
    },
    (error) => onError?.(error),
  );
}

export async function sendTextMessage({ db, room, alias, senderId, text }) {
  const clean = String(text ?? '').replace(/\r\n/g, '\n').trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!clean) return;

  await push(ref(db, messagesPath(room)), {
    type: 'text',
    text: clean,
    alias,
    senderId,
    createdAt: getServerNow(),
  });
}

export async function sendImageMessage({ db, room, alias, senderId, image }) {
  if (!image?.dataUrl?.startsWith('data:image/')) {
    throw new Error('La imagen no es válida.');
  }

  await push(ref(db, messagesPath(room)), {
    type: 'image',
    image: {
      dataUrl: image.dataUrl,
      width: Math.max(1, Math.round(Number(image.width) || 1)),
      height: Math.max(1, Math.round(Number(image.height) || 1)),
      mime: image.mime || 'image/webp',
    },
    alias,
    senderId,
    createdAt: getServerNow(),
  });
}

export async function clearRoomMessages(db, room) {
  await remove(ref(db, messagesPath(room)));
}

export function humanizeFirebaseError(error) {
  const code = String(error?.code ?? '');
  const message = String(error?.message ?? '');
  const combined = `${code} ${message}`;

  if (/permission_denied|permission denied/i.test(combined)) {
    return 'Firebase bloqueó el acceso. Revisa las reglas de Realtime Database (database.rules.json).';
  }
  if (/network|offline|unavailable|timeout|websocket/i.test(combined)) {
    return 'No hay conexión con Firebase. Se reintentará automáticamente.';
  }
  if (/database.?url|invalid.?url/i.test(combined)) {
    return 'La VITE_FIREBASE_DATABASE_URL no es válida. Revisa tu .env.local.';
  }
  return 'No se pudo conectar con la sala. Inténtalo de nuevo.';
}
