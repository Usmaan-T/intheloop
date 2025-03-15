import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Hook for fetching user statistics
 * @param {string} userId - The ID of the user to fetch stats for
 * @returns {Object} User stats including sample count, playlist count, and followers
 */
const useUserStats = (userId) => {
  const [stats, setStats] = useState({ samples: 0, playlists: 0, followers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get user document to fetch followers
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        const followers = userDoc.exists() ? userDoc.data().followers?.length || 0 : 0;
        
        // Count samples (posts) created by this user
        const samplesQuery = query(
          collection(firestore, 'posts'),
          where('userId', '==', userId)
        );
        const samplesSnapshot = await getDocs(samplesQuery);
        const samplesCount = samplesSnapshot.size;
        
        // Count playlists created by this user
        const playlistsQuery = query(
          collection(firestore, 'playlists'),
          where('userId', '==', userId)
        );
        const playlistsSnapshot = await getDocs(playlistsQuery);
        const playlistsCount = playlistsSnapshot.size;
        
        // Set all stats at once
        setStats({
          samples: samplesCount,
          playlists: playlistsCount,
          followers: followers
        });
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [userId]);

  return { stats, loading, error };
};

export default useUserStats;
