import { MAX_ALIAS_LENGTH } from './constants';
import { isValidRoomCode, normalizeRoomCode } from './utils';

const SESSION_KEY = 'tiffy:session:v1';
const DRAFT_KEY = 'tiffy:draft:v1';
const USER_ID_KEY = 'tiffy:user-id:v1';

function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // El almacenamiento local puede estar bloqueado; la app sigue funcionando sin persistencia.
  }
}

function remove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Sin persistencia disponible.
  }
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function cleanAlias(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_ALIAS_LENGTH);
}

export function loadSession() {
  const stored = parseJson(read(SESSION_KEY));
  if (!stored || typeof stored !== 'object') return null;

  const room = normalizeRoomCode(stored.room);
  const alias = cleanAlias(stored.alias);
  if (!isValidRoomCode(room) || alias.length < 2) return null;

  return { room, alias };
}

export function saveSession(session) {
  write(SESSION_KEY, JSON.stringify({ room: session.room, alias: session.alias }));
}

export function clearSession() {
  remove(SESSION_KEY);
}

export function loadDraft() {
  const stored = parseJson(read(DRAFT_KEY));
  if (!stored || typeof stored !== 'object') return { room: '', alias: '' };

  return {
    room: normalizeRoomCode(stored.room),
    alias: cleanAlias(stored.alias),
  };
}

export function saveDraft(draft) {
  write(DRAFT_KEY, JSON.stringify({ room: draft.room, alias: draft.alias }));
}

export function getOrCreateUserId() {
  const existing = read(USER_ID_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  write(USER_ID_KEY, id);
  return id;
}
