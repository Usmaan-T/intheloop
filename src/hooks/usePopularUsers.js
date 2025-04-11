import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Hook to fetch users with the highest heat scores (weekly popularity)
 * @param {number} limitCount - Maximum number of users to fetch
 * @returns {Object} Popular users, loading state, and error state
 */
const usePopularUsers = (limitCount = 5) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPopularUsers = async () => {
      try {
        setLoading(true);
        
        // Query users ordered by their weekly popularity score
        const usersQuery = query(
          collection(firestore, 'users'),
          orderBy('popularityScores.weekly', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        const usersData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Only include users with a heat score > 0 
          if (data.popularityScores?.weekly > 0) {
            usersData.push({
              id: doc.id,
              uid: data.uid,
              username: data.username || data.displayName || 'User',
              photoURL: data.photoURL,
              heat: data.popularityScores?.weekly || 0
            });
          }
        });
        
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching popular users:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPopularUsers();
  }, [limitCount]);
  
  return { users, loading, error };
};

export default usePopularUsers; 