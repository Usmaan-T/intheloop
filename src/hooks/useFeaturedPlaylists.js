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

/**
 * Custom hook for fetching featured playlists chosen by admins
 * @param {number} limitCount - Maximum number of playlists to fetch
 */
export const useFeaturedPlaylists = (limitCount = 10) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedPlaylists = async () => {
      try {
        setLoading(true);
        
        // Query for playlists marked as featured by admins
        const featuredPlaylistsQuery = query(
          collection(firestore, 'playlists'),
          where('isFeatured', '==', true),
          where('privacy', '==', 'public'), // Ensure we only get public playlists
          orderBy('featuredOrder', 'asc'), // Order by the admin-defined featured order
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(featuredPlaylistsQuery);
        
        const playlistsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPlaylists(playlistsData);
        setError(null);
        
        // If we don't have enough featured playlists, fetch some public ones to fill in
        if (playlistsData.length < limitCount) {
          // Get IDs of already fetched playlists to exclude them
          const fetchedIds = playlistsData.map(playlist => playlist.id);
          
          // Query for additional public playlists
          const additionalPlaylistsQuery = query(
            collection(firestore, 'playlists'),
            where('privacy', '==', 'public'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );
          
          const additionalSnapshot = await getDocs(additionalPlaylistsQuery);
          
          const additionalPlaylists = additionalSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            // Filter out any that were already included in featured results
            .filter(playlist => !fetchedIds.includes(playlist.id));
          
          // Only add enough to reach the limit
          const remainingSlots = limitCount - playlistsData.length;
          const combinedPlaylists = [
            ...playlistsData,
            ...additionalPlaylists.slice(0, remainingSlots)
          ];
          
          setPlaylists(combinedPlaylists);
        }
      } catch (err) {
        console.error('Error fetching featured playlists:', err);
        setError(err);
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedPlaylists();
  }, [limitCount]);

  return { playlists, loading, error };
}; 