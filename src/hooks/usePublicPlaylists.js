import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

export const usePublicPlaylists = (limitCount = 10) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        
        // Query for public playlists, sorted by creation date
        const playlistsQuery = query(
          collection(firestore, 'playlists'),
          where('privacy', '==', 'public'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(playlistsQuery);
        
        const playlistsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPlaylists(playlistsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching public playlists:', err);
        setError(err);
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaylists();
  }, [limitCount]);

  return { playlists, loading, error };
};
