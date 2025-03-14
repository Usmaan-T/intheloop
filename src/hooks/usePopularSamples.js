import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

export const usePopularSamples = (limitCount = 10) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        
        // Query for samples, sorted by likes count (descending)
        const samplesQuery = query(
          collection(firestore, 'posts'),
          orderBy('likes', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(samplesQuery);
        
        const samplesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setSamples(samplesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching popular samples:', err);
        setError(err);
        setSamples([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSamples();
  }, [limitCount]);

  return { samples, loading, error };
};
