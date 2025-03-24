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
import COLLECTIONS from '../firebase/collections';

/**
 * Hook to fetch popular samples based on specified time period
 */
export const usePopularSamples = (limitCount = 10, timeRange = 'weekly') => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPopularSamples = async () => {
      try {
        setLoading(true);
        
        // Validate timeRange
        const validRanges = ['daily', 'weekly', 'monthly', 'allTime'];
        const scoreField = validRanges.includes(timeRange) 
          ? `popularityScores.${timeRange}` 
          : 'likes'; // Fallback to likes for backward compatibility
          
        // Build query
        let samplesQuery;
        
        if (scoreField === 'likes') {
          // Fallback for systems without popularity scores yet
          samplesQuery = query(
            collection(firestore, COLLECTIONS.POSTS),
            orderBy('likes', 'desc'),
            limit(limitCount)
          );
        } else {
          samplesQuery = query(
            collection(firestore, COLLECTIONS.POSTS),
            orderBy(scoreField, 'desc'),
            limit(limitCount)
          );
        }
        
        // Execute the query
        const querySnapshot = await getDocs(samplesQuery);
        const samplesData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          samplesData.push({
            id: doc.id,
            ...data,
            popularityScore: data.popularityScores?.[timeRange] || data.likes || 0
          });
        });
        
        setSamples(samplesData);
        
      } catch (err) {
        console.error('Error fetching popular samples:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPopularSamples();
    
  }, [limitCount, timeRange]);
  
  return { samples, loading, error };
};

export default usePopularSamples;
