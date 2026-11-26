import { getApps, initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref } from 'firebase/database';

const ENV_NAMES = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  databaseURL: 'VITE_FIREBASE_DATABASE_URL',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function isPlaceholder(value) {
  if (!value || !String(value).trim()) return true;
  const normalized = String(value).trim();
  if (/^(tu[-_]|your[-_]|xxx|change[-_]?me|\.\.\.)/i.test(normalized)) return true;
  return /tu-proyecto|tu-api-key|123456789012|abcdef123456/i.test(normalized);
}

export const missingConfigKeys = Object.entries(ENV_NAMES)
  .filter(([key]) => isPlaceholder(firebaseConfig[key]))
  .map(([, envName]) => envName);

export const isFirebaseConfigured = missingConfigKeys.length === 0;

let serverTimeOffset = 0;
let db = null;
let initError = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    db = getDatabase(app);

    onValue(
      ref(db, '.info/serverTimeOffset'),
      (snapshot) => {
        const offset = Number(snapshot.val());
        serverTimeOffset = Number.isFinite(offset) ? offset : 0;
      },
      () => {
        // El offset es opcional; si falla se usa la hora local.
      },
    );
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
  }
}

export function getServerNow() {
  return Date.now() + serverTimeOffset;
}

export { db, initError };
