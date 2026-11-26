import { useCallback, useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { humanizeFirebaseError, subscribeToMessages } from '../lib/messages';

export function useRoomMessages(db, room) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState('connecting');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!db) {
      setConnection('offline');
      return undefined;
    }

    const unsubscribe = onValue(
      ref(db, '.info/connected'),
      (snapshot) => setConnection(snapshot.val() === true ? 'online' : 'offline'),
      () => setConnection('offline'),
    );

    return unsubscribe;
  }, [db]);

  useEffect(() => {
    if (!db || !room) {
      setLoading(false);
      return undefined;
    }

    setMessages([]);
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToMessages(db, room, {
      onMessages: (nextMessages) => {
        setMessages(nextMessages);
        setLoading(false);
      },
      onError: (nextError) => {
        console.error('[tiffy] Error de Firebase:', nextError);
        setError(humanizeFirebaseError(nextError));
        setLoading(false);
      },
    });

    return unsubscribe;
  }, [db, room, retryKey]);

  const retry = useCallback(() => {
    setRetryKey((current) => current + 1);
  }, []);

  return { messages, loading, error, connection, retry };
}
