import { MAX_ROOM_CODE_LENGTH } from './constants';

export function cn(...values) {
  return values.flat(Infinity).filter(Boolean).join(' ');
}

export function normalizeRoomCode(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, MAX_ROOM_CODE_LENGTH);
}

export function isValidRoomCode(value) {
  return /^[a-z0-9][a-z0-9_-]{1,39}$/.test(String(value ?? ''));
}

export function generateRoomCode() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `sala-${suffix}`;
}

export function formatClock(timestamp) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isSameDay(first, second) {
  const a = new Date(Number(first));
  const b = new Date(Number(second));
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return startOfDay(a) === startOfDay(b);
}

export function formatDayLabel(timestamp) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return '';

  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';

  const label = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const ALIAS_COLORS = ['#7bf3d2', '#93c5fd', '#f9a8d4', '#fcd34d', '#c4b5fd', '#fdba74', '#a5b4fc', '#86efac'];

export function aliasColor(alias) {
  let hash = 0;
  for (const char of String(alias ?? '')) {
    hash = (hash * 31 + char.codePointAt(0)) | 0;
  }
  return ALIAS_COLORS[Math.abs(hash) % ALIAS_COLORS.length];
}
