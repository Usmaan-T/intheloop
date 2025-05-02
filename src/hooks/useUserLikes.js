import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Hook to fetch a user's liked samples from Firestore
 * @param {string} userId - The user ID to fetch likes for
 * @returns {object} The liked samples, loading state, and error if any
 */
const useUserLikes = (userId) => {
  const [likedSamples, setLikedSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLikedSamples = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First get the user doc to get the list of liked sample IDs
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        
        if (!userDoc.exists()) {
          setLikedSamples([]);
          setIsLoading(false);
          return;
        }

        const userData = userDoc.data();
        const likedIds = userData.likes || [];

        if (likedIds.length === 0) {
          setLikedSamples([]);
          setIsLoading(false);
          return;
        }

        // Process in batches of 10 due to Firestore's "in" query limitation
        let allLikedSamples = [];
        
        for (let i = 0; i < likedIds.length; i += 10) {
          const batch = likedIds.slice(i, i + 10);
          
          if (batch.length === 0) break;
          
          const batchQuery = query(
            collection(firestore, 'posts'),
            where('__name__', 'in', batch)
          );
          
          const batchSnapshot = await getDocs(batchQuery);
          
          const batchSamples = batchSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          allLikedSamples = [...allLikedSamples, ...batchSamples];
        }
        
        // Sort by most recently liked (if we had that data) or by creation date
        allLikedSamples.sort((a, b) => {
          return (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0);
        });
        
        setLikedSamples(allLikedSamples);
      } catch (err) {
        console.error('Error fetching liked samples:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedSamples();
  }, [userId]);

  return { likedSamples, isLoading, error };
};

export default useUserLikes; 