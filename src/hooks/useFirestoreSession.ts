import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

export interface Session {
  id: string;
  createdBy: string;
  initialPrompt: string;
  teamSize: number;
  createdAt: Timestamp;
  projectSpec?: string;
  features?: string[];
  currentFeature?: string | null;
}

export const useFirestoreSession = (sessionId: string | undefined) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const sessionRef = doc(db, 'sessions', sessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSession({ id: snapshot.id, ...snapshot.data() } as Session);
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching session:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  const updateSession = async (updates: Partial<Session>) => {
    if (!sessionId) return;
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, updates);
  };

  return { session, loading, error, updateSession };
};

