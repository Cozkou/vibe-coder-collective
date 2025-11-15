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

export interface FileItem {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  updatedAt: Timestamp;
}

export const useFirestoreFiles = (sessionId: string | undefined) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const filesRef = collection(db, 'sessions', sessionId, 'files');
    const q = query(filesRef, orderBy('path', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fileItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FileItem[];
      setFiles(fileItems);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching files:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const addFile = async (
    name: string,
    path: string,
    type: 'file' | 'folder',
    content?: string,
    language?: string
  ) => {
    if (!sessionId) return;
    
    const filesRef = collection(db, 'sessions', sessionId, 'files');
    await addDoc(filesRef, {
      name,
      path,
      type,
      content: content || '',
      language,
      updatedAt: Timestamp.now()
    });
  };

  const updateFile = async (fileId: string, content: string) => {
    if (!sessionId) return;
    
    const fileRef = doc(db, 'sessions', sessionId, 'files', fileId);
    await updateDoc(fileRef, {
      content,
      updatedAt: Timestamp.now()
    });
  };

  return { files, loading, addFile, updateFile };
};

