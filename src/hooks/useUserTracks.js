import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

export default function useUserTracks(userId) {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!userId) return;
    
    setIsLoading(true);
    const tracksQuery = query(
      collection(firestore, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      tracksQuery,
      (snapshot) => {
        const trackData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTracks(trackData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching tracks:", error);
        setError(error);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [userId]);
  
  return { tracks, isLoading, error };
}
