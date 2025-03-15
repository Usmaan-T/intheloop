import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Hook for fetching user data from Firestore
 * @param {string} userId - The ID of the user to fetch
 * @returns {Object} User data, loading state, and error state
 */
const useUserData = (userId) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        
        if (!userDoc.exists()) {
          setError('User not found');
          return;
        }
        
        setUserData({
          id: userDoc.id,
          ...userDoc.data()
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  return { userData, loading, error };
};

export default useUserData;
