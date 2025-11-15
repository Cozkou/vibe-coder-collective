import { useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  query
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';

export interface User {
  id: string;
  userName: string;
  color: string;
  joinedAt: any;
  lastSeen: any;
  currentPrompt?: string; // What they're currently working on
}

// Generate a random color for the user
const generateColor = () => {
  const colors = [
    '#EF4444', // red
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate a random name
const generateUserName = () => {
  const adjectives = ['Happy', 'Cool', 'Swift', 'Bright', 'Smart', 'Quick', 'Bold', 'Zen'];
  const nouns = ['Coder', 'Dev', 'Builder', 'Hacker', 'Maker', 'Artist', 'Ninja', 'Wizard'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};

export const useUserPresence = (sessionId: string | undefined) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (!sessionId) return;

    // Get or create user identity
    let userId = sessionStorage.getItem('userId');
    let userName = sessionStorage.getItem('userName');
    let userColor = sessionStorage.getItem('userColor');

    if (!userId) {
      userId = crypto.randomUUID();
      userName = generateUserName();
      userColor = generateColor();
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('userName', userName);
      sessionStorage.setItem('userColor', userColor);
    }

    setCurrentUserId(userId);

    // Register user presence
    const userRef = doc(db, 'sessions', sessionId, 'presence', userId);
    
    const registerPresence = async () => {
      await setDoc(userRef, {
        id: userId,
        userName: userName,
        color: userColor,
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        currentPrompt: null,
      });
    };

    registerPresence();

    // Update lastSeen every 5 seconds (heartbeat)
    const heartbeatInterval = setInterval(async () => {
      try {
        await setDoc(userRef, {
          lastSeen: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    }, 5000);

    // Listen to all users in this session
    const presenceRef = collection(db, 'sessions', sessionId, 'presence');
    const q = query(presenceRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeUsers: User[] = [];
      const now = Date.now();
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data() as User;
        // Consider user active if lastSeen is within last 15 seconds
        const lastSeen = userData.lastSeen?.toMillis?.() || 0;
        const isActive = (now - lastSeen) < 15000;
        
        if (isActive) {
          activeUsers.push(userData);
        }
      });
      
      setUsers(activeUsers);
    });

    // Cleanup: Remove presence on unmount
    const cleanup = async () => {
      clearInterval(heartbeatInterval);
      try {
        await deleteDoc(userRef);
      } catch (error) {
        console.error('Error removing presence:', error);
      }
    };

    window.addEventListener('beforeunload', cleanup);

    return () => {
      cleanup();
      unsubscribe();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [sessionId]);

  // Update what current user is working on
  const updateCurrentWork = async (promptContent: string | null) => {
    if (!sessionId || !currentUserId) return;
    
    const userRef = doc(db, 'sessions', sessionId, 'presence', currentUserId);
    await setDoc(userRef, {
      currentPrompt: promptContent,
      lastSeen: serverTimestamp(),
    }, { merge: true });
  };

  return { 
    users, 
    currentUserId, 
    currentUser: users.find(u => u.id === currentUserId),
    updateCurrentWork 
  };
};

