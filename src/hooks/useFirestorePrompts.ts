import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

export interface Prompt {
  id: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
  userId: string;
}

export const useFirestorePrompts = (sessionId: string | undefined) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const promptsRef = collection(db, 'sessions', sessionId, 'prompts');
    const q = query(promptsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prpts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Prompt[];
      setPrompts(prpts);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching prompts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const addPrompt = async (content: string, userId: string) => {
    if (!sessionId) return;
    
    const promptsRef = collection(db, 'sessions', sessionId, 'prompts');
    await addDoc(promptsRef, {
      content,
      status: 'pending',
      userId,
      createdAt: Timestamp.now(),
      completedAt: null
    });
  };

  const updatePromptStatus = async (
    promptId: string, 
    status: Prompt['status']
  ) => {
    if (!sessionId) return;
    
    const promptRef = doc(db, 'sessions', sessionId, 'prompts', promptId);
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.completedAt = Timestamp.now();
    }
    
    await updateDoc(promptRef, updates);
  };

  return { prompts, loading, addPrompt, updatePromptStatus };
};

